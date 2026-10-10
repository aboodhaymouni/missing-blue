import clsx from 'clsx'
import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { LOGO_GAP, LOGO_LEFT, LOGO_RIGHT } from '../components/Logo'
import { useLang } from '../i18n/lang'

/*
  Landing-page building blocks in the operations dashboard's visual language: white 16px cards with
  soft layered shadows, icon chips, a gradient accent bar before titles, and gradient primary actions.
  Same props as the report-style SectionHead / Plate / ButtonLink they replace on this page.
*/

/** The dashboard card surface. */
export const CARD = 'rounded-[16px] border border-hair/80 bg-card shadow-[0_1px_2px_rgb(1_28_71/0.04),0_12px_32px_-20px_rgb(1_28_71/0.18)]'
/** Hover lift for cards that are read at a glance (stats, personas). */
export const LIFT = 'transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgb(1_28_71/0.04),0_20px_40px_-20px_rgb(1_28_71/0.28)]'
/** Light icon chip. */
export const CHIP = 'grid shrink-0 place-items-center rounded-[12px] bg-signal-50 text-signal-600 ring-1 ring-signal-100'
/** Icon chip on navy surfaces. */
export const CHIP_DARK = 'grid shrink-0 place-items-center rounded-[10px] bg-signal-400/15 text-signal-200 ring-1 ring-signal-300/25'
/** Glass tile on navy surfaces. */
export const GLASS = 'rounded-[16px] border border-white/[0.12] bg-white/[0.06] backdrop-blur-md'
/** Small label pill (figure and table numbers, week ranges). */
export const PILL = 'inline-flex items-center rounded-full bg-signal-50 px-2.5 py-0.5 font-mono text-[11px] font-semibold text-signal-700 ring-1 ring-signal-100'

/** The gradient accent bar that sits before card titles. */
export function Accent({ className }: { className?: string }) {
  return <span className={clsx('h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-signal-400 to-signal-700', className)} aria-hidden />
}

/** Section head: a numbered pill and eyebrow on the margin, then a large title and lead. */
export function SectionHead({ index, eyebrow, title, lead, className, invert = false }: { index: string; eyebrow: string; title: ReactNode; lead?: ReactNode; className?: string; invert?: boolean }) {
  return (
    <div className={clsx('grid gap-5 lg:grid-cols-12 lg:gap-10', className)}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 lg:col-span-3 lg:flex-col lg:items-start lg:pt-2">
        <p
          className={clsx(
            'inline-flex h-8 items-center rounded-full px-3.5 font-mono text-[12px] font-semibold leading-none ring-1',
            invert ? 'bg-white/[0.08] text-signal-200 ring-white/15' : 'bg-card text-signal-700 ring-signal-100 shadow-[0_8px_20px_-12px_rgb(26_111_240/0.55)]',
          )}
          dir="ltr"
          data-num=""
        >
          § {index}
        </p>
        <p className={clsx('flex items-center gap-2.5 text-[15px] font-semibold', invert ? 'text-white' : 'text-navy-900')}>
          <Accent />
          {eyebrow}
        </p>
      </div>
      <div className="lg:col-span-9">
        <h2 className={clsx('text-[clamp(2.1rem,4.2vw,3.5rem)] font-semibold', invert ? 'text-white' : 'text-navy-900')}>{title}</h2>
        {lead && <p className={clsx('mt-5 max-w-[760px] text-[17.5px] leading-[1.85] sm:text-[18px]', invert ? 'text-white/75' : 'text-ink-2')}>{lead}</p>}
      </div>
    </div>
  )
}

/** A figure in a rounded card, with optional corner coordinates and a numbered caption. */
export function Plate({ n, caption, children, className, frameClass, corners, dark = false }: { n: string; caption: ReactNode; children: ReactNode; className?: string; frameClass?: string; corners?: { tl: string; br: string }; dark?: boolean }) {
  const { lang } = useLang()
  return (
    <figure className={clsx('m-0', className)}>
      <div className="relative">
        {corners && (
          <>
            <span className={clsx('pointer-events-none absolute -top-5 left-0 font-mono text-[10px]', dark ? 'text-white/50' : 'text-muted')} dir="ltr">{corners.tl}</span>
            <span className={clsx('pointer-events-none absolute -bottom-5 right-0 font-mono text-[10px]', dark ? 'text-white/50' : 'text-muted')} dir="ltr">{corners.br}</span>
          </>
        )}
        <div className={clsx('overflow-hidden', dark ? 'lp-light rounded-[18px] bg-card shadow-[0_40px_80px_-30px_rgb(0_0_0/0.65)] ring-1 ring-white/20' : CARD, frameClass)}>{children}</div>
      </div>
      <figcaption className={clsx('caption mt-4 flex items-start gap-3', dark && 'text-white/70')}>
        <span className={clsx('mt-px shrink-0 rounded-full px-2.5 py-0.5 font-mono text-[11px] font-semibold ring-1', dark ? 'bg-white/[0.08] text-signal-200 ring-white/15' : 'bg-signal-50 text-signal-700 ring-signal-100')}>
          {lang === 'ar' ? `الشكل ${n}` : `Fig. ${n}`}
        </span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  )
}

type CtaVariant = 'primary' | 'glass' | 'light' | 'outline'

/** Call-to-action link. Primary is the dashboard's signal gradient, a step darker so white text keeps AA contrast. */
export function Cta({ to, variant = 'primary', size = 'md', className, children }: { to: string; variant?: CtaVariant; size?: 'sm' | 'md' | 'lg'; className?: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className={clsx(
        'group inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 hover:-translate-y-0.5',
        size === 'sm' && 'h-9 rounded-[10px] px-3.5 text-[13.5px]',
        size === 'md' && 'h-11 rounded-[12px] px-5 text-[14.5px]',
        size === 'lg' && 'h-[52px] rounded-[14px] px-6 text-[15.5px]',
        variant === 'primary' && 'bg-gradient-to-b from-signal-500 to-signal-700 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_10px_24px_-10px_rgb(42_139_255/0.9)] hover:shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_16px_30px_-12px_rgb(42_139_255/1)]',
        variant === 'glass' && 'border border-white/20 bg-white/[0.07] text-white backdrop-blur hover:bg-white/[0.13]',
        variant === 'light' && 'bg-white text-navy-900 shadow-[0_12px_28px_-14px_rgb(0_0_0/0.6)] hover:bg-signal-50',
        variant === 'outline' && 'border border-hair-2 bg-card text-navy-900 shadow-[0_1px_2px_rgb(1_28_71/0.06)] hover:border-signal-200 hover:text-signal-700',
        className,
      )}
    >
      {children}
    </Link>
  )
}

/** The logo's two slabs with the "missing" channel between them glowing and flowing. Decorative. */
export function GlowMark({ className }: { className?: string }) {
  return (
    <svg viewBox="-80 -60 737 1093" className={className} aria-hidden>
      <defs>
        <linearGradient id="lp-slab" x1="0" y1="0" x2="0.35" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.96" />
          <stop offset="1" stopColor="#8fd3ff" stopOpacity="0.38" />
        </linearGradient>
        <filter id="lp-gap-glow" x="-60%" y="-30%" width="220%" height="160%">
          <feGaussianBlur stdDeviation="26" />
        </filter>
      </defs>
      <path d={LOGO_GAP} fill="none" stroke="#2a8bff" strokeWidth="84" strokeLinejoin="round" opacity="0.75" filter="url(#lp-gap-glow)" />
      <path d={LOGO_LEFT} fill="url(#lp-slab)" />
      <path d={LOGO_RIGHT} fill="url(#lp-slab)" />
      <path d={LOGO_GAP} fill="none" stroke="#8fd3ff" strokeWidth="13" strokeLinejoin="round" strokeLinecap="round" strokeDasharray="70 330" className="lp-flow" />
    </svg>
  )
}
