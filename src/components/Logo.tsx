import clsx from 'clsx'

/** The two slabs, traced from the supplied logo (viewBox 577×973, vertices measured from the source pixels). */
export const LOGO_LEFT = 'M0 162 190 289V486L353 599V973L0 716Z'
export const LOGO_RIGHT = 'M268 0 577 208V817L426 704V559L268 450Z'
/** Centre line of the gap between the slabs — the "missing" channel. */
export const LOGO_GAP = 'M229 300V468L389.5 579V700'

export function LogoMark({ className, title, glow = false }: { className?: string; title?: string; glow?: boolean }) {
  return (
    <svg viewBox="0 0 577 973" className={className} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {glow && (
        <>
          <defs>
            <filter id="mb-gap-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="16" />
            </filter>
          </defs>
          <path d={LOGO_GAP} fill="none" stroke="#2a8bff" strokeWidth="46" strokeLinejoin="round" opacity="0.55" filter="url(#mb-gap-glow)" />
          <path d={LOGO_GAP} fill="none" stroke="#8fd3ff" strokeWidth="10" strokeLinejoin="round" strokeDasharray="60 340" style={{ animation: 'mb-flow 2.8s linear infinite' }} />
          <style>{'@keyframes mb-flow{to{stroke-dashoffset:-400}}'}</style>
        </>
      )}
      <path d={LOGO_LEFT} fill="currentColor" />
      <path d={LOGO_RIGHT} fill="currentColor" />
    </svg>
  )
}

/**
 * Bilingual lockup: the mark, then Arabic above English — the way Jordanian institutions set
 * their names. Both languages are always shown, whatever the interface language.
 */
export function Wordmark({ className, size = 'md', tone = 'ink' }: { className?: string; size?: 'sm' | 'md' | 'lg'; tone?: 'ink' | 'white' }) {
  const s = {
    sm: { mark: 'h-7', ar: 'text-[17px]', en: 'text-[11.5px]', gap: 'gap-2' },
    md: { mark: 'h-9', ar: 'text-[21px]', en: 'text-[13px]', gap: 'gap-2.5' },
    lg: { mark: 'h-14', ar: 'text-[34px]', en: 'text-[19px]', gap: 'gap-4' },
  }[size]
  return (
    <span className={clsx('inline-flex items-center', s.gap, tone === 'white' ? 'text-white' : 'text-navy-900', className)}>
      <LogoMark className={clsx(s.mark, 'w-auto shrink-0')} />
      <span className="flex flex-col leading-none">
        <span lang="ar" dir="rtl" className={clsx('font-bold leading-[1.05]', s.ar)} style={{ fontFamily: '"Markazi Text Variable", serif' }}>
          الأزرق المفقود
        </span>
        <span lang="en" dir="ltr" className={clsx('mt-[3px] font-semibold italic leading-none tracking-[0.01em] opacity-80', s.en)} style={{ fontFamily: '"Newsreader Variable", Georgia, serif' }}>
          Missing Blue
        </span>
      </span>
    </span>
  )
}
