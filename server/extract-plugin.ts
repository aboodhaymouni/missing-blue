/**
 * Local AI endpoint for crew-report extraction, served by Vite in dev and preview:
 *
 *   GET  /api/health   -> { available, model?, reason? }
 *   POST /api/extract  -> { model, fields: { key: { value, quote } }, notes, dropped, ms }
 *
 * The key stays on this machine: it is read here from ANTHROPIC_API_KEY (shell environment or
 * .env.local) and never sent to the browser. Without credentials the endpoint reports itself
 * unavailable and the app keeps the rules engine.
 */
import { existsSync } from 'node:fs'
import { homedir } from 'node:os'
import { join } from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin } from 'vite'
import Anthropic from '@anthropic-ai/sdk'
import { DEFAULT_MODEL, ExtractError, extractWithClaude } from './extract-core.ts'

type Env = Record<string, string | undefined>

const MAX_CHARS = 2000
const MAX_PER_MINUTE = 30

function credentialSource(env: Env): string | null {
  if (env.ANTHROPIC_API_KEY) return 'api-key'
  if (env.ANTHROPIC_AUTH_TOKEN) return 'auth-token'
  if (existsSync(join(homedir(), '.config', 'anthropic'))) return 'profile'
  return null
}

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json; charset=utf-8')
  res.setHeader('cache-control', 'no-store')
  res.end(JSON.stringify(body))
}

function readBody(req: IncomingMessage, limit: number): Promise<string> {
  return new Promise((resolve, reject) => {
    let size = 0
    const chunks: Buffer[] = []
    req.on('data', (c: Buffer) => {
      size += c.length
      if (size > limit) {
        reject(new Error('too-large'))
        req.destroy()
      } else chunks.push(c)
    })
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

export function extractApi(env: Env): Plugin {
  const model = env.MB_MODEL || DEFAULT_MODEL
  const disabled = env.MB_AI === 'off'
  let client: Anthropic | null = null
  const getClient = () => {
    if (!client) {
      const opts: NonNullable<ConstructorParameters<typeof Anthropic>[0]> = { timeout: 60_000, maxRetries: 1 }
      if (env.ANTHROPIC_API_KEY) opts.apiKey = env.ANTHROPIC_API_KEY
      if (env.ANTHROPIC_AUTH_TOKEN) opts.authToken = env.ANTHROPIC_AUTH_TOKEN
      if (env.ANTHROPIC_BASE_URL) opts.baseURL = env.ANTHROPIC_BASE_URL
      client = new Anthropic(opts)
    }
    return client
  }

  // The dev server listens on the LAN for the crew phone; cap calls so a stray client cannot run up a bill.
  let windowStart = 0
  let used = 0
  const allow = () => {
    const now = Date.now()
    if (now - windowStart > 60_000) {
      windowStart = now
      used = 0
    }
    return ++used <= MAX_PER_MINUTE
  }

  const handle = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    const path = (req.url ?? '').split('?')[0]
    if (path === '/api/health' && req.method === 'GET') {
      const source = credentialSource(env)
      if (disabled) return send(res, 200, { available: false, reason: 'disabled' })
      if (!source) return send(res, 200, { available: false, reason: 'no-credentials' })
      return send(res, 200, { available: true, model })
    }
    if (path !== '/api/extract') return next()
    if (req.method !== 'POST') return send(res, 405, { error: 'method' })
    if (disabled || !credentialSource(env)) return send(res, 503, { error: 'not-configured' })
    if (!allow()) return send(res, 429, { error: 'rate-limited' })

    let text: unknown
    try {
      text = (JSON.parse(await readBody(req, 16_384)) as { text?: unknown }).text
    } catch {
      return send(res, 400, { error: 'bad-request' })
    }
    if (typeof text !== 'string' || text.trim().length < 3 || text.length > MAX_CHARS) return send(res, 400, { error: 'bad-text' })

    const t0 = Date.now()
    try {
      const out = await extractWithClaude(getClient(), model, text)
      const ms = Date.now() - t0
      console.log(`[extract] ${out.model}${out.fallback ? ' (fallback)' : ''} ${ms} ms, in ${out.inputTokens} / out ${out.outputTokens} tokens, dropped ${out.dropped.length}`)
      return send(res, 200, { model: out.model, fallback: out.fallback, fields: out.fields, notes: out.notes, dropped: out.dropped, ms })
    } catch (e) {
      const code =
        e instanceof ExtractError ? e.code
        : e instanceof Anthropic.AuthenticationError || e instanceof Anthropic.PermissionDeniedError ? 'auth'
        : e instanceof Anthropic.RateLimitError ? 'upstream-rate-limited'
        : e instanceof Anthropic.APIConnectionError ? 'offline'
        : e instanceof Anthropic.APIError ? `api-${e.status ?? 'error'}`
        : 'error'
      console.warn(`[extract] failed: ${code}${e instanceof Error ? ` (${e.message.slice(0, 200)})` : ''}`)
      return send(res, 502, { error: code })
    }
  }

  const mount = (server: { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }) => {
    server.middlewares.use((req, res, next) => {
      handle(req, res, next).catch(() => send(res, 500, { error: 'error' }))
    })
  }

  return {
    name: 'missing-blue-extract-api',
    configureServer: mount,
    configurePreviewServer: mount,
  }
}
