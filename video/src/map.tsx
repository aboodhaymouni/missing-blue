import React from 'react'
import { random, staticFile } from 'remotion'
import { C, F, JORDAN, LINE, type Pt, lerp, pathOf, project } from './kit'

/** Dense Catmull-Rom sampling so the drawn line and the particles share one curve. */
function catmull(pts: Pt[], per = 24): Pt[] {
  const out: Pt[] = []
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] ?? pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] ?? p2
    for (let s = 0; s < per; s++) {
      const t = s / per, t2 = t * t, t3 = t2 * t
      const x = 0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3)
      const y = 0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
      out.push([x, y])
    }
  }
  out.push(pts[pts.length - 1])
  return out
}

const OUTLINE = JORDAN.map((p) => project(p))
const LINE_P = catmull(LINE.map((p) => project(p)))
const CUM: number[] = [0]
for (let i = 1; i < LINE_P.length; i++) CUM.push(CUM[i - 1] + Math.hypot(LINE_P[i][0] - LINE_P[i - 1][0], LINE_P[i][1] - LINE_P[i - 1][1]))
const TOTAL = CUM[CUM.length - 1]

export function at(t: number): Pt {
  const d = Math.max(0, Math.min(1, t)) * TOTAL
  let i = 1
  while (i < CUM.length - 1 && CUM[i] < d) i++
  const u = (d - CUM[i - 1]) / (CUM[i] - CUM[i - 1] || 1)
  return [lerp(LINE_P[i - 1][0], LINE_P[i][0], u), lerp(LINE_P[i - 1][1], LINE_P[i][1], u)]
}
function normal(t: number): Pt {
  const a = at(t - 0.004), b = at(t + 0.004)
  const dx = b[0] - a[0], dy = b[1] - a[1], l = Math.hypot(dx, dy) || 1
  return [-dy / l, dx / l]
}
export const LINE_MID = at(0.5)

const LINE_D = pathOf(LINE_P)
const OUTLINE_D = pathOf(OUTLINE) + 'Z'

export type MapProps = {
  f: number
  outline?: number
  fill?: number
  line?: number
  flow?: number
  leak?: number
  pings?: number
  labels?: number
  grid?: number
  zoom?: number
  focus?: Pt
  shift?: Pt
  lineColor?: string
  texture?: number
  scan?: number
}

/** The stylised Jordan map with the (illustrative) desert carrier line. */
export function JordanMap({ f, outline = 1, fill = 1, line = 0, flow = 0, leak = 0, pings = 0, labels = 0, grid = 1, zoom = 1, focus = LINE_MID, shift = [0, 0], lineColor = C.ice, texture = 0, scan = -1 }: MapProps) {
  const tr = `translate(${shift[0]} ${shift[1]}) translate(${focus[0]} ${focus[1]}) scale(${zoom}) translate(${-focus[0]} ${-focus[1]})`
  const sw = 1 / Math.sqrt(zoom)
  return (
    <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0, overflow: 'visible' }}>
      <defs>
        <radialGradient id="jfill" cx="50%" cy="50%" r="60%">
          <stop offset="0" stopColor="#2a8bff" stopOpacity="0.16" />
          <stop offset="1" stopColor="#2a8bff" stopOpacity="0.03" />
        </radialGradient>
        <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6" /></filter>
        <filter id="glow2" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14" /></filter>
        <clipPath id="jclip"><path d={OUTLINE_D} /></clipPath>
        <linearGradient id="jshade" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#0b2a63" stopOpacity="0.35" />
          <stop offset="1" stopColor="#020817" stopOpacity="0.75" />
        </linearGradient>
      </defs>
      <g transform={tr}>
        {/* graticule */}
        <g opacity={0.5 * grid}>
          {[35, 36, 37, 38, 39].map((lon) => {
            const [x] = project([lon, 31])
            return (
              <g key={lon}>
                <line x1={x} y1={60} x2={x} y2={1020} stroke="rgba(143,211,255,0.10)" strokeWidth={sw} strokeDasharray="2 8" />
                <text x={x + 6} y={1012} fill="rgba(143,211,255,0.45)" fontFamily={F.mono} fontSize={13 * sw}>{lon}°E</text>
              </g>
            )
          })}
          {[29, 30, 31, 32, 33].map((lat) => {
            const [, y] = project([37, lat])
            return (
              <g key={lat}>
                <line x1={760} y1={y} x2={1780} y2={y} stroke="rgba(143,211,255,0.10)" strokeWidth={sw} strokeDasharray="2 8" />
                <text x={1700} y={y - 6} fill="rgba(143,211,255,0.45)" fontFamily={F.mono} fontSize={13 * sw}>{lat}°N</text>
              </g>
            )
          })}
        </g>
        {/* country: real Sentinel-2 desert texture clipped to the outline */}
        {texture > 0 && (
          <g clipPath="url(#jclip)" opacity={texture}>
            <image href={staticFile('imagery/qatrana-2025.webp')} x={860} y={110} width={800} height={880} preserveAspectRatio="xMidYMid slice" style={{ filter: 'saturate(1.15) contrast(1.1) brightness(0.95)' }} />
            <rect x={860} y={110} width={800} height={880} fill="url(#jshade)" />
          </g>
        )}
        <path d={OUTLINE_D} fill="url(#jfill)" opacity={fill * (1 - texture * 0.5)} />
        {scan >= 0 && scan <= 1 && (
          <g clipPath="url(#jclip)">
            <defs>
              <linearGradient id="scanband" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#8fd3ff" stopOpacity="0" />
                <stop offset="0.82" stopColor="#8fd3ff" stopOpacity="0.28" />
                <stop offset="1" stopColor="#ffffff" stopOpacity="0.9" />
              </linearGradient>
            </defs>
            <rect x={860} y={lerp(-60, 990, scan) - 160} width={800} height={160} fill="url(#scanband)" />
            <rect x={860} y={lerp(-60, 990, scan)} width={800} height={2.5} fill="#fff" opacity={0.9} />
          </g>
        )}
        <path d={OUTLINE_D} fill="none" stroke="#2a8bff" strokeWidth={6 * sw} opacity={0.5 * outline} filter="url(#glow)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - outline} />
        <path d={OUTLINE_D} fill="none" stroke="rgba(190,225,255,0.9)" strokeWidth={1.8 * sw} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - outline} strokeLinejoin="round" />
        {/* the carrier line */}
        {line > 0 && (
          <>
            <path d={LINE_D} fill="none" stroke={C.blue} strokeWidth={22 * sw} opacity={0.35} filter="url(#glow2)" pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} strokeLinecap="round" />
            <path d={LINE_D} fill="none" stroke={lineColor} strokeWidth={4.5 * sw} pathLength={1} strokeDasharray="1 1" strokeDashoffset={1 - line} strokeLinecap="round" strokeLinejoin="round" />
            {(() => {
              const head = at(line)
              return line < 0.999 ? <circle cx={head[0]} cy={head[1]} r={9 * sw} fill="#fff" filter="url(#glow)" /> : null
            })()}
          </>
        )}
        {/* flow particles */}
        {flow > 0 &&
          Array.from({ length: 46 }).map((_, i) => {
            const t = (i / 46 + f * 0.0035) % 1
            if (t > line) return null
            const p = at(t)
            return <circle key={i} cx={p[0]} cy={p[1]} r={(2.6 + (i % 3)) * sw} fill="#fff" opacity={flow * (0.55 + 0.45 * Math.sin(i + f / 6))} />
          })}
        {/* leaking particles */}
        {leak > 0 &&
          Array.from({ length: 90 }).map((_, i) => {
            const t0 = 0.04 + random(`lk${i}`) * 0.92
            const period = 55 + random(`lp${i}`) * 50
            const age = ((f + random(`la${i}`) * period) % period) / period
            const n = normal(t0)
            const side = random(`ls${i}`) > 0.5 ? 1 : -1
            const p = at(t0)
            const d = age * (40 + random(`ld${i}`) * 90)
            const x = p[0] + n[0] * side * d
            const y = p[1] + n[1] * side * d + age * age * 24
            const col = age < 0.35 ? C.ice : age < 0.7 ? C.amber : C.red
            return <circle key={i} cx={x} cy={y} r={(2.2 + random(`lr${i}`) * 2) * sw} fill={col} opacity={leak * (1 - age) * 0.9} />
          })}
        {/* attack pings */}
        {pings > 0 &&
          Array.from({ length: 84 }).map((_, i) => {
            if (i / 84 > pings) return null
            const t = 0.03 + random(`pt${i}`) * 0.94
            const n = normal(t)
            const side = random(`ps${i}`) > 0.5 ? 1 : -1
            const off = 8 + random(`po${i}`) * 26
            const p = at(t)
            const x = p[0] + n[0] * side * off, y = p[1] + n[1] * side * off
            const born = (i / 84) * 1
            const life = Math.min(1, (pings - born) * 10)
            const ph = ((f + random(`pp${i}`) * 40) % 40) / 40
            return (
              <g key={i} opacity={life}>
                <circle cx={x} cy={y} r={(4 + ph * 22) * sw} fill="none" stroke={C.red} strokeWidth={1.6 * sw} opacity={(1 - ph) * 0.8} />
                <circle cx={x} cy={y} r={4.2 * sw} fill={C.red} />
                <circle cx={x} cy={y} r={9 * sw} fill={C.red} opacity={0.25} filter="url(#glow)" />
              </g>
            )
          })}
        {/* labels */}
        {labels > 0 && (
          <g opacity={labels} fontFamily={F.mono}>
            {([
              ['DISI', at(0), [-90, 28]],
              ["MA'AN", at(0.36), [-118, 6]],
              ['QATRANA', at(0.74), [22, 6]],
              ['AMMAN', at(1), [-112, -12]],
            ] as [string, Pt, Pt][]).map(([name, p, o]) => (
              <g key={name}>
                <circle cx={p[0]} cy={p[1]} r={6 * sw} fill={C.bg} stroke="#fff" strokeWidth={2 * sw} />
                <text x={p[0] + o[0] * sw} y={p[1] + o[1] * sw} fill="#fff" fontSize={18 * sw} letterSpacing={3 * sw}>{name}</text>
              </g>
            ))}
          </g>
        )}
      </g>
    </svg>
  )
}
