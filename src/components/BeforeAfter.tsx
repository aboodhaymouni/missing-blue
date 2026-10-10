import clsx from 'clsx'
import { useCallback, useEffect, useRef, useState, type ReactNode, type KeyboardEvent, type PointerEvent } from 'react'
import { useReducedMotion } from 'motion/react'
import { ChevronsLeftRight } from 'lucide-react'
import { useLang } from '../i18n/lang'

const TAN = 0.6745 // tan(34°), the logo's slant

/**
 * Before/after comparison whose divider is the logo's own gap: a vertical cut, a 34° step, then vertical again.
 * "Before" sits on the reading-start side (right in Arabic, left in English).
 */
export function BeforeAfter({
  before,
  after,
  aspect = 4 / 3,
  initial = 0.5,
  intro = true,
  className,
  children,
  onChange,
  stepY = 0.46,
  stepX = 0.06,
  pixelated = false,
}: {
  before: { src: string; label: ReactNode; alt: string }
  after: { src: string; label: ReactNode; alt: string }
  aspect?: number
  initial?: number
  intro?: boolean
  className?: string
  /** overlay content (markers) — receives nothing; position it with percentages */
  children?: ReactNode
  onChange?: (p: number) => void
  stepY?: number
  stepX?: number
  /** show real satellite pixels (no smoothing) */
  pixelated?: boolean
}) {
  const { dir, lang } = useLang()
  const reduce = useReducedMotion()
  const ref = useRef<HTMLDivElement>(null)
  const [p, setP] = useState(intro && !reduce ? 0.94 : initial)
  const dragging = useRef(false)

  useEffect(() => {
    onChange?.(p)
  }, [p, onChange])

  // Intro sweep: reveal the "after" image once, then rest at `initial`.
  useEffect(() => {
    if (!intro || reduce) return
    let raf = 0
    const t0 = performance.now() + 450
    const from = 0.94
    const tick = (now: number) => {
      const k = Math.min(1, Math.max(0, (now - t0) / 1700))
      const e = 1 - Math.pow(1 - k, 5)
      if (!dragging.current) setP(from + (initial - from) * e)
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [intro, initial, reduce])

  const s1 = stepY * 100
  const d = stepX * 100
  const s2 = s1 + d * aspect * TAN
  const x1 = p * 100
  const x2 = x1 + d

  const pts = [
    [0, 0],
    [x1, 0],
    [x1, s1],
    [x2, s2],
    [x2, 100],
    [0, 100],
  ]
  const mirror = (x: number) => (dir === 'rtl' ? 100 - x : x)
  const clip = `polygon(${pts.map(([x, y]) => `${mirror(x)}% ${y}%`).join(',')})`
  const line = [[x1, -2], [x1, s1], [x2, s2], [x2, 102]].map(([x, y]) => `${mirror(x)},${y}`).join(' ')

  const setFromClientX = useCallback(
    (clientX: number) => {
      const el = ref.current
      if (!el) return
      const r = el.getBoundingClientRect()
      let f = (clientX - r.left) / r.width
      if (dir === 'rtl') f = 1 - f
      setP(Math.min(0.97, Math.max(0.02, f - stepX / 2)))
    },
    [dir, stepX],
  )

  const onDown = (e: PointerEvent<HTMLDivElement>) => {
    dragging.current = true
    ;(e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId)
    setFromClientX(e.clientX)
  }
  const onMove = (e: PointerEvent<HTMLDivElement>) => {
    if (dragging.current) setFromClientX(e.clientX)
  }
  const onUp = () => {
    dragging.current = false
  }
  const onKey = (e: KeyboardEvent) => {
    const step = e.shiftKey ? 0.1 : 0.03
    const towardsStart = dir === 'rtl' ? 'ArrowRight' : 'ArrowLeft'
    const towardsEnd = dir === 'rtl' ? 'ArrowLeft' : 'ArrowRight'
    if (e.key === towardsStart) setP((v) => Math.max(0.02, v - step))
    else if (e.key === towardsEnd) setP((v) => Math.min(0.97, v + step))
    else if (e.key === 'Home') setP(0.02)
    else if (e.key === 'End') setP(0.97)
    else return
    dragging.current = true
    e.preventDefault()
  }

  const hx = mirror(x1 + d / 2)
  const hy = (s1 + s2) / 2

  return (
    <div
      ref={ref}
      className={clsx('relative isolate select-none overflow-hidden bg-navy-950 touch-pan-y', className)}
      style={{ aspectRatio: String(aspect) }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      <img src={after.src} alt={after.alt} className={clsx('absolute inset-0 size-full object-cover', pixelated && '[image-rendering:pixelated]')} draggable={false} />
      <img src={before.src} alt={before.alt} className={clsx('absolute inset-0 size-full object-cover', pixelated && '[image-rendering:pixelated]')} style={{ clipPath: clip }} draggable={false} />

      {children}

      <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
        <polyline points={line} fill="none" stroke="rgb(1 28 71 / 0.55)" strokeWidth="6" vectorEffect="non-scaling-stroke" strokeLinejoin="miter" />
        <polyline points={line} fill="none" stroke="#fff" strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinejoin="miter" />
      </svg>

      <button
        type="button"
        role="slider"
        aria-label={lang === 'ar' ? 'مقارنة قبل وبعد' : 'Before and after comparison'}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.round(p * 100)}
        onKeyDown={onKey}
        onKeyUp={() => (dragging.current = false)}
        className="absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize place-items-center rounded-full border border-white/70 bg-navy-900/85 text-white shadow-[0_6px_24px_rgb(0_0_0/0.35)] backdrop-blur-md transition-transform hover:scale-105"
        style={{ left: `${hx}%`, top: `${hy}%` }}
      >
        <ChevronsLeftRight className="size-5" aria-hidden />
      </button>

      <div className="pointer-events-none absolute inset-x-3 top-3 z-10 flex items-start justify-between gap-2">
        <span className="rounded-full bg-navy-950/70 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-md">{before.label}</span>
        <span className="rounded-full bg-navy-950/70 px-3 py-1 text-[12px] font-medium text-white backdrop-blur-md">{after.label}</span>
      </div>
    </div>
  )
}

/** Is a point (in % of the image, LTR coordinates) on the "after" side of the divider at position p? */
export function onAfterSide(xPct: number, yPct: number, p: number, dir: 'rtl' | 'ltr', aspect = 4 / 3, stepY = 0.46, stepX = 0.06) {
  const s1 = stepY * 100
  const d = stepX * 100
  const s2 = s1 + d * aspect * TAN
  const x = dir === 'rtl' ? 100 - xPct : xPct
  const cut = yPct <= s1 ? p * 100 : yPct >= s2 ? p * 100 + d : p * 100 + (d * (yPct - s1)) / (s2 - s1)
  return x > cut
}
