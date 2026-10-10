import clsx from 'clsx'
import type { ComponentProps, ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowLeft, ArrowRight, ArrowUpLeft, ArrowUpRight } from 'lucide-react'
import { useLang, type Text } from '../i18n/lang'
import type { Source } from '../data/facts'
import { fnOf } from '../data/sources'

export function Container({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={clsx('mx-auto w-full max-w-[1280px] px-5 sm:px-10', className)}>{children}</div>
}

/** An arrow that points "forward" in the reading direction. */
export function Fwd({ className, out = false }: { className?: string; out?: boolean }) {
  const { dir } = useLang()
  const Icon = out ? (dir === 'rtl' ? ArrowUpLeft : ArrowUpRight) : dir === 'rtl' ? ArrowLeft : ArrowRight
  return <Icon className={clsx('size-4 shrink-0', className)} aria-hidden />
}

type BtnVariant = 'primary' | 'outline' | 'ghost' | 'light' | 'signal'
const btn = (variant: BtnVariant, size: 'sm' | 'md' | 'lg') =>
  clsx(
    'group inline-flex items-center justify-center gap-2.5 rounded-[3px] font-semibold transition-[background,color,border-color] duration-200 disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap',
    size === 'sm' && 'h-9 px-3.5 text-[14px]',
    size === 'md' && 'h-11 px-5 text-[15px]',
    size === 'lg' && 'h-[52px] px-7 text-[16px]',
    variant === 'primary' && 'bg-navy-900 text-white hover:bg-navy-700',
    variant === 'signal' && 'bg-signal-600 text-white hover:bg-signal-700',
    variant === 'outline' && 'border border-navy-900/80 text-navy-900 hover:bg-navy-900 hover:text-white',
    variant === 'ghost' && 'text-ink hover:bg-ink/5',
    variant === 'light' && 'bg-white text-navy-900 hover:bg-paper',
  )

export function ButtonLink({ to, href, variant = 'primary', size = 'md', className, children, ...rest }: { to?: string; href?: string; variant?: BtnVariant; size?: 'sm' | 'md' | 'lg'; className?: string; children: ReactNode } & Omit<ComponentProps<'a'>, 'href'>) {
  if (to) return <Link to={to} className={clsx(btn(variant, size), className)} {...(rest as object)}>{children}</Link>
  return <a href={href} className={clsx(btn(variant, size), className)} {...rest}>{children}</a>
}

export function Button({ variant = 'primary', size = 'md', className, ...rest }: { variant?: BtnVariant; size?: 'sm' | 'md' | 'lg' } & ComponentProps<'button'>) {
  return <button type="button" className={clsx(btn(variant, size), className)} {...rest} />
}

/** Footnote marker that points to the numbered source list at the end of the page. */
export function Fn({ url, sources }: { url?: string; sources?: Source[] }) {
  const urls = sources ? sources.map((s) => s.url) : url ? [url] : []
  const nums = urls.map(fnOf).filter((x) => x > 0)
  if (!nums.length) return null
  return (
    <span className="whitespace-nowrap" dir="ltr">
      {nums.map((k, i) => (
        <a
          key={k}
          href={`#src-${k}`}
          className="fn"
          onClick={(e) => {
            e.preventDefault()
            document.getElementById(`src-${k}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }}
        >
          {k}
          {i < nums.length - 1 ? ',' : ''}
        </a>
      ))}
    </span>
  )
}

/** Inline source line (used inside product demos, where footnotes would be out of place). */
export function SourceRef({ sources, className, compact = false }: { sources: Source[]; className?: string; compact?: boolean }) {
  const { lang } = useLang()
  return (
    <span className={clsx('inline-flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] leading-snug text-muted', className)}>
      {!compact && <span className="font-medium">{lang === 'ar' ? 'المصدر:' : 'Source:'}</span>}
      {sources.map((s) => (
        <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="underline decoration-line-strong underline-offset-4 hover:text-ink">
          <span lang="en" dir="ltr">{s.publisher}</span> <span className="num opacity-70" dir="ltr">· {s.date}</span>
        </a>
      ))}
    </span>
  )
}

/** Report-style section head: a numbered margin label and a large serif title. */
export function SectionHead({ index, eyebrow, title, lead, className, invert = false }: { index: string; eyebrow: string; title: ReactNode; lead?: ReactNode; className?: string; invert?: boolean }) {
  return (
    <div className={clsx('grid gap-6 border-t pt-6 lg:grid-cols-12 lg:gap-10', invert ? 'border-white/25' : 'border-navy-900', className)}>
      <div className="lg:col-span-3">
        <p className={clsx('font-mono text-[12px] leading-none', invert ? 'text-white/60' : 'text-muted')} dir="ltr" data-num="">§ {index}</p>
        <p className={clsx('mt-3 text-[15px] font-semibold', invert ? 'text-white' : 'text-navy-900')}>{eyebrow}</p>
      </div>
      <div className="lg:col-span-9">
        <h2 className={clsx('text-[clamp(2.2rem,4.4vw,3.6rem)] font-medium', invert ? 'text-white' : 'text-navy-900')}>{title}</h2>
        {lead && <p className={clsx('mt-5 max-w-[760px] text-[18px] leading-[1.85]', invert ? 'text-white/75' : 'text-ink-2')}>{lead}</p>}
      </div>
    </div>
  )
}

/** A figure plate: inked frame with registration ticks, optional corner coordinates, numbered caption. */
export function Plate({ n, caption, children, className, frameClass, corners }: { n: string; caption: ReactNode; children: ReactNode; className?: string; frameClass?: string; corners?: { tl: string; br: string } }) {
  const { lang } = useLang()
  return (
    <figure className={clsx('m-0', className)}>
      <div className={clsx('plate border border-navy-900/70 bg-surface', frameClass)}>
        <span className="tick tl" aria-hidden />
        <span className="tick tr" aria-hidden />
        <span className="tick bl" aria-hidden />
        <span className="tick br" aria-hidden />
        {corners && (
          <>
            <span className="pointer-events-none absolute -top-5 left-0 font-mono text-[10px] text-muted" dir="ltr">{corners.tl}</span>
            <span className="pointer-events-none absolute -bottom-5 right-0 font-mono text-[10px] text-muted" dir="ltr">{corners.br}</span>
          </>
        )}
        {children}
      </div>
      <figcaption className="caption mt-4 flex gap-3">
        <span className="shrink-0 font-mono text-[12px] font-medium text-navy-900">{lang === 'ar' ? `الشكل ${n}` : `Fig. ${n}`}</span>
        <span>{caption}</span>
      </figcaption>
    </figure>
  )
}

/** Provenance labels: plain inked text with a shape, not pills. Real = solid square, illustrative = dashed, synthetic = dotted. */
export type Provenance = 'real' | 'illustrative' | 'synthetic' | 'ai' | 'rules' | 'verified' | 'unconfirmed'
const PROV: Record<Provenance, { label: Text; style: string }> = {
  real: { label: { ar: 'حقيقي', en: 'Real' }, style: 'border-solid' },
  illustrative: { label: { ar: 'توضيحي', en: 'Illustrative' }, style: 'border-dashed' },
  synthetic: { label: { ar: 'اصطناعي', en: 'Synthetic' }, style: 'border-dotted' },
  ai: { label: { ar: 'ذكاء اصطناعي', en: 'AI' }, style: 'border-solid' },
  rules: { label: { ar: 'قواعد معلنة', en: 'Published rules' }, style: 'border-solid' },
  verified: { label: { ar: 'معتمد', en: 'Approved' }, style: 'border-solid' },
  unconfirmed: { label: { ar: 'غير مؤكّد', en: 'Unconfirmed' }, style: 'border-dashed' },
}

export function Chip({ kind, children, className, title }: { kind: Provenance; children?: ReactNode; className?: string; title?: string }) {
  const { t } = useLang()
  const p = PROV[kind]
  return (
    <span title={title} className={clsx('inline-flex items-center gap-1.5 font-mono text-[11px] leading-none text-ink-2', className)}>
      <span className={clsx('inline-block size-2.5 border-[1.5px] border-current', p.style, kind === 'real' && 'bg-current')} aria-hidden />
      <span>{children ?? t(p.label)}</span>
    </span>
  )
}

/** Product status (used in the console and the demos). Square, quiet, dashed when unconfirmed. */
export function StatusPill({ tone, children, dashed = false, className }: { tone: 'candidate' | 'verified' | 'illegal' | 'leak' | 'licensed' | 'nothing' | 'neutral'; children: ReactNode; dashed?: boolean; className?: string }) {
  const tones = {
    candidate: 'text-candidate-ink border-candidate',
    verified: 'text-verified-ink border-verified',
    illegal: 'text-illegal-ink border-illegal',
    leak: 'text-signal-700 border-leak',
    licensed: 'text-navy-600 border-licensed',
    nothing: 'text-muted border-line-strong',
    neutral: 'text-ink-2 border-line-strong',
  }
  const dot = {
    candidate: 'bg-candidate', verified: 'bg-verified', illegal: 'bg-illegal', leak: 'bg-leak', licensed: 'bg-licensed', nothing: 'bg-nothing', neutral: 'bg-ink-2',
  }
  return (
    <span className={clsx('inline-flex h-6 items-center gap-1.5 rounded-[2px] border bg-surface px-2 text-[12px] font-semibold leading-none', dashed ? 'border-dashed' : 'border-solid', tones[tone], className)}>
      <span className={clsx('size-1.5', dot[tone])} aria-hidden />
      {children}
    </span>
  )
}
