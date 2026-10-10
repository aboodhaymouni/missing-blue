/**
 * Small, hand-drawn charts for the dashboard. Plain DOM and SVG so they follow the page direction
 * (time runs right-to-left in Arabic) and the type of the rest of the interface.
 */
import clsx from 'clsx'
import { useId, type ReactNode } from 'react'
import { useLang } from '../i18n/lang'

/** Vertical bars over time. Partial periods are hatched and labelled. */
export function Columns({ data, height = 140, color = '#0b2a5b', format, highlightLast = false }: { data: { label: string; value: number | null; partial?: boolean; note?: string }[]; height?: number; color?: string; format?: (v: number) => string; highlightLast?: boolean }) {
  const { n } = useLang()
  const max = Math.max(1, ...data.map((d) => d.value ?? 0))
  const fmt = format ?? ((v: number) => n(v))
  return (
    <div className="flex items-end gap-1.5" style={{ height: height + 40 }} role="img" aria-label={data.map((d) => `${d.label}: ${d.value ?? '—'}`).join(', ')}>
      {data.map((d, i) => {
        const h = d.value ? Math.max(3, (d.value / max) * height) : 0
        const last = highlightLast && i === data.length - 1
        return (
          <div key={d.label} className="flex min-w-0 flex-1 flex-col items-center justify-end gap-1">
            <span className={clsx('num font-mono text-[10.5px] leading-none', last ? 'font-semibold text-navy-900' : 'text-ink-soft')} dir="ltr">{d.value == null ? '—' : fmt(d.value)}</span>
            <div
              className="w-full rounded-t-[6px]"
              title={d.note}
              style={{
                height: h,
                background: d.partial ? `repeating-linear-gradient(135deg, ${color} 0 3px, ${color}55 3px 6px)` : last ? color : `${color}cc`,
              }}
            />
            <span className="num font-mono text-[10.5px] leading-none text-ink-soft" dir="ltr">{d.label}{d.partial ? '*' : ''}</span>
          </div>
        )
      })}
    </div>
  )
}

/** Horizontal bars, one or two series per row (a lighter "before" behind a solid "now"). */
export function BarsH({ rows, max: maxIn, unit = '', aLabel, bLabel, color = '#0b2a5b' }: { rows: { label: ReactNode; key: string; a: number | null; b?: number | null }[]; max?: number; unit?: string; aLabel?: string; bLabel?: string; color?: string }) {
  const max = maxIn ?? Math.max(1, ...rows.flatMap((r) => [r.a ?? 0, r.b ?? 0]))
  return (
    <div className="grid gap-2.5">
      {(aLabel || bLabel) && (
        <div className="flex flex-wrap gap-4 text-[11.5px] text-ink-soft">
          {bLabel && <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[2px] bg-[#c9d3e3]" aria-hidden />{bLabel}</span>}
          {aLabel && <span className="flex items-center gap-1.5"><span className="h-2.5 w-4 rounded-[2px]" style={{ background: color }} aria-hidden />{aLabel}</span>}
        </div>
      )}
      {rows.map((r) => (
        <div key={r.key} className="grid grid-cols-[6.5rem_1fr_3.2rem] items-center gap-3">
          <span className="truncate text-[13px] text-navy-900">{r.label}</span>
          <span className="relative h-[18px] rounded-full bg-[#f1f4f9]">
            {r.b != null && <span className="absolute inset-y-0 start-0 rounded-full bg-[#dbe2ee]" style={{ width: `${(r.b / max) * 100}%` }} aria-hidden />}
            {r.a != null && <span className="absolute inset-y-[4px] start-[4px] rounded-full" style={{ width: `calc(${(r.a / max) * 100}% - 4px)`, background: `linear-gradient(90deg, ${color}, ${color}bb)` }} aria-hidden />}
          </span>
          <span className="num text-end text-[12.5px] font-semibold text-navy-900" dir="ltr">{r.a == null ? '—' : `${r.a}${unit}`}</span>
        </div>
      ))}
    </div>
  )
}

/** One bar split into shares, with a legend underneath. */
export function Stack({ parts, height = 14 }: { parts: { label: ReactNode; value: number; color: string; key: string }[]; height?: number }) {
  const { n } = useLang()
  const total = parts.reduce((s, p) => s + p.value, 0) || 1
  return (
    <div>
      <div className="flex w-full gap-[3px] overflow-hidden rounded-full" style={{ height }}>
        {parts.map((p) => <span key={p.key} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} title={`${p.value}`} />)}
      </div>
      <ul className="mt-3 grid gap-1.5">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-2 text-[12.5px] text-ink-soft">
            <span className="size-2.5 shrink-0 rounded-[2px]" style={{ background: p.color }} aria-hidden />
            <span className="min-w-0 flex-1 truncate">{p.label}</span>
            <span className="num font-mono text-navy-900" dir="ltr">{n(Math.round((p.value / total) * 100))}%</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

/** A sparkline for a KPI card. Oldest value first; follows the page direction. */
export function Spark({ values, color = '#1a6ff0', width = 120, height = 36 }: { values: number[]; color?: string; width?: number; height?: number }) {
  const { dir } = useLang()
  const gid = useId().replace(/:/g, '')
  if (values.length < 2) return null
  const min = Math.min(...values)
  const max = Math.max(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => {
    let x = (i / (values.length - 1)) * width
    if (dir === 'rtl') x = width - x
    const y = height - 4 - ((v - min) / span) * (height - 8)
    return [x, y]
  })
  const d = pts.map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ')
  const [lx, ly] = pts[pts.length - 1]
  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden className="overflow-visible">
      <defs>
        <linearGradient id={`sp${gid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity="0.28" />
          <stop offset="1" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={`${d} L${pts[pts.length - 1][0].toFixed(1)} ${height} L${pts[0][0].toFixed(1)} ${height} Z`} fill={`url(#sp${gid})`} />
      <path d={d} fill="none" stroke={color} strokeWidth="2.25" strokeLinejoin="round" strokeLinecap="round" />
      <circle cx={lx} cy={ly} r="6" fill={color} opacity="0.18" />
      <circle cx={lx} cy={ly} r="3.25" fill={color} stroke="#fff" strokeWidth="1.5" />
    </svg>
  )
}

/** A thin progress bar: part of a whole. */
export function Meter({ value, total, color = '#0b2a5b' }: { value: number; total: number; color?: string }) {
  return (
    <span className="relative block h-1.5 w-full overflow-hidden rounded-full bg-[#e6ebf3]" aria-hidden>
      <span className="absolute inset-y-0 start-0 rounded-full" style={{ width: `${total ? Math.min(100, (value / total) * 100) : 0}%`, background: color }} />
    </span>
  )
}
