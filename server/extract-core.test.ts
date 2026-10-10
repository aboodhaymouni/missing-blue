/**
 * Tests for the extraction core. No network and no key: the Messages API is replaced by a local
 * mock server, so these check the request we send and how the answer is checked, not the model.
 * Run: npm test
 */
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { createServer, type IncomingMessage } from 'node:http'
import type { AddressInfo } from 'node:net'
import Anthropic from '@anthropic-ai/sdk'
import { checkEvidence, extractWithClaude, findQuote, FIELD_KEYS, ExtractError, type ModelOutput } from './extract-core.ts'

/** Placeholder credential for the in-process mock API (no real key is used in tests). */
const MOCK_CREDENTIAL = ['test', 'only'].join('-')

const REPORT = 'لقينا وصلة غير مرخصة 2 إنش بلاستيك على الخط الرئيسي، على بعد 15 متر من الشارع'

function emptyOutput(): ModelOutput {
  const o = { notes: [] } as unknown as ModelOutput
  for (const k of FIELD_KEYS) o[k] = { value: null, quote: null }
  return o
}

test('findQuote: exact, whitespace-tolerant, never letter-tolerant', () => {
  assert.equal(findQuote(REPORT, 'وصلة غير مرخصة'), 'وصلة غير مرخصة')
  assert.equal(findQuote(REPORT, '  وصلة   غير مرخصة '), 'وصلة غير مرخصة')
  assert.equal(findQuote(REPORT, 'وصلة غير مرخّصة'), null, 'a shadda the crew did not write is not their words')
  assert.equal(findQuote(REPORT, 'على بعد 20 متر'), null)
  assert.equal(findQuote(REPORT, '   '), null)
})

test('checkEvidence keeps backed fields and drops invented ones', () => {
  const out = emptyOutput()
  out.outcome = { value: 'illegal_connection', quote: 'وصلة غير مرخصة' }
  out.material = { value: 'PLASTIC', quote: 'بلاستيك' }
  out.diameter = { value: 63, quote: '2 إنش' }
  out.location = { value: 15, quote: 'على بعد 15 متر من الشارع' }
  out.depth = { value: 1.5, quote: 'على عمق متر ونص' } // not in the report
  out.count = { value: 1, quote: null } // value without any quote
  out.notes = [{ ar: 'ملاحظة', en: 'note' }]
  const c = checkEvidence(REPORT, out)
  assert.equal(c.fields.outcome.value, 'illegal_connection')
  assert.equal(c.fields.diameter.value, 63)
  assert.equal(c.fields.location.value, 15)
  assert.deepEqual(c.fields.depth, { value: null, quote: null })
  assert.deepEqual(c.fields.count, { value: null, quote: null })
  assert.deepEqual(c.dropped.map((d) => d.field).sort(), ['count', 'depth'])
  assert.equal(c.notes.length, 1)
})

test('checkEvidence: quote-without-value only where it means "engineer decides"', () => {
  const out = emptyOutput()
  out.diameter = { value: null, quote: '2 إنش' } // size stated, material unknown
  out.location = { value: null, quote: 'الشارع' } // landmark only
  out.outcome = { value: null, quote: 'وصلة' } // an outcome needs a value
  out.missingFromMap = { value: false, quote: 'الخط الرئيسي' } // only "not on the map" is recorded
  const c = checkEvidence(REPORT, out)
  assert.deepEqual(c.fields.diameter, { value: null, quote: '2 إنش' })
  assert.deepEqual(c.fields.location, { value: null, quote: 'الشارع' })
  assert.deepEqual(c.fields.outcome, { value: null, quote: null })
  assert.deepEqual(c.fields.missingFromMap, { value: null, quote: null })
  assert.equal(c.dropped.length, 0)
})

type Seen = { headers: IncomingMessage['headers']; body: Record<string, unknown> }

async function mockApi(answer: (body: Record<string, unknown>, n: number) => { status: number; json: unknown }) {
  const seen: Seen[] = []
  const server = createServer((req, res) => {
    let raw = ''
    req.on('data', (c) => (raw += c))
    req.on('end', () => {
      const body = JSON.parse(raw) as Record<string, unknown>
      seen.push({ headers: req.headers, body })
      const { status, json } = answer(body, seen.length)
      res.writeHead(status, { 'content-type': 'application/json', 'request-id': `req_mock_${seen.length}` })
      res.end(JSON.stringify(json))
    })
  })
  await new Promise<void>((r) => server.listen(0, '127.0.0.1', r))
  const port = (server.address() as AddressInfo).port
  // The local mock server ignores credentials; the SDK only needs a non-empty value.
  const client = new Anthropic({ apiKey: MOCK_CREDENTIAL, baseURL: `http://127.0.0.1:${port}`, maxRetries: 0 })
  return { client, seen, close: () => new Promise((r) => server.close(r)) }
}

function message(text: string, extra: Record<string, unknown> = {}) {
  return {
    id: 'msg_mock', type: 'message', role: 'assistant', model: 'claude-opus-5-5',
    content: [{ type: 'text', text }], stop_reason: 'end_turn', stop_sequence: null,
    usage: { input_tokens: 900, output_tokens: 300, cache_creation_input_tokens: 0, cache_read_input_tokens: 0, iterations: null },
    ...extra,
  }
}

test('extractWithClaude sends the documented request and checks the answer', async () => {
  const answer = emptyOutput()
  answer.outcome = { value: 'illegal_connection', quote: 'وصلة غير مرخصة' }
  answer.depth = { value: 2, quote: 'عمق مترين' } // invented: must be dropped
  const api = await mockApi(() => ({ status: 200, json: message(JSON.stringify(answer)) }))
  try {
    const r = await extractWithClaude(api.client, 'claude-opus-5-5', REPORT)
    const req = api.seen[0]
    assert.equal(req.body.model, 'claude-opus-5-5')
    assert.equal(req.body.fallbacks, 'default')
    assert.match(String(req.headers['anthropic-beta']), /server-side-fallback-2026-07-01/)
    const oc = req.body.output_config as { effort: string; format: { type: string; schema: { required: string[] } } }
    assert.equal(oc.effort, 'low')
    assert.equal(oc.format.type, 'json_schema')
    assert.deepEqual(oc.format.schema.required, [...FIELD_KEYS, 'notes'])
    assert.ok(!('thinking' in req.body), 'Opus 5.5 thinking is not configurable; we leave it out')
    const msgs = req.body.messages as { role: string; content: string }[]
    assert.equal(msgs[0].content, `<report>\n${REPORT}\n</report>`)
    assert.equal(r.fields.outcome.value, 'illegal_connection')
    assert.deepEqual(r.dropped.map((d) => d.field), ['depth'])
    assert.equal(r.fallback, false)
  } finally {
    await api.close()
  }
})

test('extractWithClaude retries without the fallback beta when the account rejects it', async () => {
  const api = await mockApi((body) =>
    'fallbacks' in body
      ? { status: 400, json: { type: 'error', error: { type: 'invalid_request_error', message: 'fallbacks: not enabled' } } }
      : { status: 200, json: message(JSON.stringify(emptyOutput())) },
  )
  try {
    const r = await extractWithClaude(api.client, 'claude-opus-5-5', REPORT)
    assert.equal(api.seen.length, 2)
    assert.ok(!('fallbacks' in api.seen[1].body))
    assert.equal(r.fields.outcome.value, null)
  } finally {
    await api.close()
  }
})

test('extractWithClaude: a refusal is an error, never an empty extraction', async () => {
  const api = await mockApi(() => ({ status: 200, json: message('', { stop_reason: 'refusal', content: [] }) }))
  try {
    await assert.rejects(extractWithClaude(api.client, 'claude-opus-5-5', REPORT), (e) => e instanceof ExtractError && e.code === 'refused')
  } finally {
    await api.close()
  }
})
