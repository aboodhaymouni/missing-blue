import React from 'react'
import { AbsoluteFill, Easing, Img, interpolate, random, staticFile, useCurrentFrame } from 'remotion'

export const C = {
  bg: '#020817',
  navy: '#011c47',
  deep: '#000f2b',
  ink: '#04102a',
  blue: '#2a8bff',
  blue2: '#1a6ff0',
  ice: '#8fd3ff',
  amber: '#f5a524',
  red: '#ff4d57',
  paper: '#f2ede2',
  white: '#f1f5ff',
  muted: 'rgba(214,226,255,0.66)',
  faint: 'rgba(170,190,232,0.42)',
  violet: '#8b6cff',
  green: '#3ddc97',
}

export const F = {
  serif: '"Newsreader", Georgia, serif',
  sans: '"Plex", system-ui, sans-serif',
  mono: '"PlexMono", ui-monospace, monospace',
  ar: '"Markazi", "Plex", serif',
}

export const EXPO = Easing.bezier(0.16, 1, 0.3, 1)
export const INOUT = Easing.bezier(0.65, 0, 0.35, 1)

/** 0→1 between frames [start, start+dur] with a strong ease-out. */
export function ease(frame: number, start: number, dur: number, easing = EXPO) {
  return interpolate(frame, [start, start + dur], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing })
}
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t

/** Fades a whole scene in over its first frames (scenes overlap a little). */
export function SceneFade({ children, inF = 12, outAt, outF = 14 }: { children: React.ReactNode; inF?: number; outAt?: number; outF?: number }) {
  const f = useCurrentFrame()
  let o = inF ? ease(f, 0, inF, Easing.linear) : 1
  if (outAt != null) o *= 1 - ease(f, outAt, outF, Easing.linear)
  return <AbsoluteFill style={{ opacity: o }}>{children}</AbsoluteFill>
}

/** Word-by-word cinematic reveal: rise, unblur, fade. */
export function Words({ text, start, stagger = 3, dur = 22, style, wordStyle, highlight }: { text: string; start: number; stagger?: number; dur?: number; style?: React.CSSProperties; wordStyle?: (i: number, w: string) => React.CSSProperties | undefined; highlight?: string[] }) {
  const f = useCurrentFrame()
  const words = text.split(' ')
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', columnGap: '0.26em', ...style }}>
      {words.map((w, i) => {
        const t = ease(f, start + i * stagger, dur)
        const hl = highlight?.some((h) => w.replace(/[.,:]/g, '').toLowerCase() === h.toLowerCase())
        return (
          <span
            key={i}
            style={{
              display: 'inline-block',
              opacity: t,
              transform: `translateY(${(1 - t) * 0.42}em)`,
              filter: `blur(${(1 - t) * 10}px)`,
              color: hl ? C.ice : undefined,
              ...(wordStyle?.(i, w) ?? {}),
            }}
          >
            {w}
          </span>
        )
      })}
    </div>
  )
}

/** Mono kicker label with a growing rule. */
export function Kicker({ children, start, color = C.ice, style }: { children: React.ReactNode; start: number; color?: string; style?: React.CSSProperties }) {
  const f = useCurrentFrame()
  const t = ease(f, start, 24)
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 18, fontFamily: F.mono, fontSize: 22, letterSpacing: '0.28em', textTransform: 'uppercase', color, opacity: t, ...style }}>
      <span style={{ width: 70 * t, height: 2, background: color, boxShadow: `0 0 14px ${color}` }} />
      <span style={{ transform: `translateX(${(1 - t) * 30}px)` }}>{children}</span>
    </div>
  )
}

export function CountUp({ to, start, dur = 45, decimals = 0, prefix = '', suffix = '', style }: { to: number; start: number; dur?: number; decimals?: number; prefix?: string; suffix?: string; style?: React.CSSProperties }) {
  const f = useCurrentFrame()
  const t = ease(f, start, dur, Easing.bezier(0.22, 1, 0.36, 1))
  const v = to * t
  const s = v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
  return <span style={{ fontVariantNumeric: 'tabular-nums', ...style }}>{prefix}{s}{suffix}</span>
}

/** Animated film grain + vignette, over everything. */
export function Grain({ opacity = 0.07 }: { opacity?: number }) {
  const f = useCurrentFrame()
  const x = Math.floor(random(`gx${f}`) * 512)
  const y = Math.floor(random(`gy${f}`) * 512)
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <AbsoluteFill style={{ backgroundImage: `url(${staticFile('grain.png')})`, backgroundPosition: `${x}px ${y}px`, opacity, mixBlendMode: 'overlay' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(0,0,0,0.55) 100%)' }} />
    </AbsoluteFill>
  )
}

/** Deep navy backdrop with slow-moving glows and a faint survey grid. */
export function Backdrop({ glow = C.blue, grid = true, tint = 0.5 }: { glow?: string; grid?: boolean; tint?: number }) {
  const f = useCurrentFrame()
  const dx = Math.sin(f / 90) * 60
  const dy = Math.cos(f / 110) * 40
  return (
    <AbsoluteFill style={{ background: `radial-gradient(1200px 700px at ${70 + dx / 30}% ${-5 + dy / 30}%, ${glow}${Math.round(tint * 70).toString(16).padStart(2, '0')}, transparent 60%), radial-gradient(900px 600px at 0% 110%, rgba(124,92,255,0.18), transparent 60%), linear-gradient(160deg, #061a3f 0%, #030c22 55%, #01040d 100%)` }}>
      {grid && (
        <AbsoluteFill
          style={{
            backgroundImage: 'linear-gradient(rgba(255,255,255,0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.045) 1px, transparent 1px)',
            backgroundSize: '80px 80px',
            backgroundPosition: `${(f * 0.4) % 80}px ${(f * 0.25) % 80}px`,
            maskImage: 'radial-gradient(ellipse at 60% 40%, black 15%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse at 60% 40%, black 15%, transparent 70%)',
          }}
        />
      )}
    </AbsoluteFill>
  )
}

/** Drifting dust / data particles. */
export function Dust({ n = 70, color = C.ice, seed = 'd', speed = 1, opacity = 0.5 }: { n?: number; color?: string; seed?: string; speed?: number; opacity?: number }) {
  const f = useCurrentFrame()
  return (
    <AbsoluteFill style={{ pointerEvents: 'none' }}>
      <svg width={1920} height={1080}>
        {Array.from({ length: n }).map((_, i) => {
          const x0 = random(`${seed}x${i}`) * 1920
          const y0 = random(`${seed}y${i}`) * 1080
          const s = 0.3 + random(`${seed}s${i}`) * 1.4
          const x = (x0 + f * s * 0.6 * speed) % 1960 - 20
          const y = (y0 - f * s * 0.35 * speed + 2160) % 1080
          const tw = 0.4 + 0.6 * Math.abs(Math.sin(f / (20 + i % 17) + i))
          return <circle key={i} cx={x} cy={y} r={s * 1.3} fill={color} opacity={opacity * tw * (s / 1.7)} />
        })}
      </svg>
    </AbsoluteFill>
  )
}

export const LOGO_LEFT = 'M0 162 190 289V486L353 599V973L0 716Z'
export const LOGO_RIGHT = 'M268 0 577 208V817L426 704V559L268 450Z'
export const LOGO_GAP = 'M229 300V468L389.5 579V700'

/** Satellite image as a texture. */
export function Sat({ src, style, filter }: { src: string; style?: React.CSSProperties; filter?: string }) {
  return <Img src={staticFile(src)} style={{ position: 'absolute', objectFit: 'cover', filter, ...style }} />
}

/* ------------------------------------------------------------------ geometry */

export type Pt = [number, number]

/** Natural Earth (110m) outline of Jordan, lon/lat. */
export const JORDAN: Pt[] = [
  [35.545665, 32.393992], [35.719918, 32.709192], [36.834062, 32.312938], [38.792341, 33.378686], [39.195468, 32.161009], [39.004886, 32.010217],
  [37.002166, 31.508413], [37.998849, 30.5085], [37.66812, 30.338665], [37.503582, 30.003776], [36.740528, 29.865283], [36.501214, 29.505254],
  [36.068941, 29.197495], [34.956037, 29.356555], [34.922603, 29.501326], [35.420918, 31.100066], [35.397561, 31.489086], [35.545252, 31.782505], [35.545665, 32.393992],
]
/** An illustrative south-to-north carrier route (not the real alignment). */
export const LINE: Pt[] = [[35.98, 29.42], [35.86, 29.78], [35.74, 30.12], [35.76, 30.45], [35.9, 30.82], [36.04, 31.2], [36.0, 31.55], [35.93, 31.92]]

export function project(p: Pt, cx = 1250, cy = 545, k = 1): Pt {
  return [cx + (p[0] - 37.05) * 167 * k, cy - (p[1] - 31.3) * 195 * k]
}
export function pathOf(pts: Pt[]) {
  return pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' ')
}
/** Smooth path (Catmull-Rom → Bézier). */
export function smoothPath(pts: Pt[]) {
  let d = `M${pts[0][0]} ${pts[0][1]}`
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    const c1: Pt = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6]
    const c2: Pt = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6]
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`
  }
  return d
}
/** Point at fraction t along a polyline (by length). */
export function along(pts: Pt[], t: number): Pt {
  const seg: number[] = []
  let total = 0
  for (let i = 0; i < pts.length - 1; i++) {
    const l = Math.hypot(pts[i + 1][0] - pts[i][0], pts[i + 1][1] - pts[i][1])
    seg.push(l)
    total += l
  }
  let d = Math.max(0, Math.min(1, t)) * total
  for (let i = 0; i < seg.length; i++) {
    if (d <= seg[i]) {
      const u = seg[i] ? d / seg[i] : 0
      return [lerp(pts[i][0], pts[i + 1][0], u), lerp(pts[i][1], pts[i + 1][1], u)]
    }
    d -= seg[i]
  }
  return pts[pts.length - 1]
}
