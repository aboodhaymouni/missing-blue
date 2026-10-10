import clsx from 'clsx'
import { useEffect, useState } from 'react'
import { LayoutDashboard, Menu, X } from 'lucide-react'
import { Wordmark } from '../components/Logo'
import { Container } from '../components/ui'
import { Cta } from './kit'
import { useHud } from '../components/Hud'
import { useLang, type Text } from '../i18n/lang'

export const NAV: { id: string; label: Text }[] = [
  { id: 'problem', label: { ar: 'المشكلة', en: 'Problem' } },
  { id: 'reach', label: { ar: 'مَن لا تصله الخدمة', en: 'Who is left out' } },
  { id: 'how', label: { ar: 'كيف يعمل', en: 'How it works' } },
  { id: 'different', label: { ar: 'المقارنة', en: 'Comparison' } },
  { id: 'pilot', label: { ar: 'التجربة', en: 'Pilot' } },
  { id: 'sources', label: { ar: 'المصادر', en: 'Sources' } },
]

/** In-page scrolling that does not fight the hash router. */
export function scrollToId(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  el.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' })
}

export function LangToggle({ className }: { className?: string }) {
  const { lang, toggle } = useLang()
  return (
    <button type="button" onClick={toggle} className={clsx('h-9 px-2 text-[14px] font-semibold text-navy-900 underline decoration-navy-900/30 underline-offset-[6px] transition-colors hover:decoration-navy-900', className)} aria-label={lang === 'ar' ? 'Switch to English' : 'التبديل إلى العربية'}>
      <span lang={lang === 'ar' ? 'en' : 'ar'}>{lang === 'ar' ? 'English' : 'العربية'}</span>
    </button>
  )
}

/** Running head of the report: issue line, live coordinates of the map under the cursor, and a scale bar. */
export function RunningHead() {
  const { lang } = useLang()
  const { lat, lon } = useHud()
  const ar = lang === 'ar'
  return (
    <div className="border-b border-hair/80">
      <Container className="flex h-8 items-center justify-between gap-4 text-[11.5px] text-ink-soft">
        <span className="truncate">{ar ? 'تقرير ميداني رقم 01 · السبت 10 تشرين الأول 2026' : 'Field report No. 01 · Saturday 10 October 2026'}</span>
        <span className="hidden items-center gap-4 font-mono text-[11px] sm:flex" dir="ltr">
          <span>{lat.toFixed(4)}° N</span>
          <span>{lon.toFixed(4)}° E</span>
          <span className="flex items-center gap-1.5" aria-hidden>
            <span className="flex h-[6px] w-16 border border-navy-900/60">
              <span className="w-1/2 bg-navy-900/70" />
            </span>
            2 km
          </span>
        </span>
        <span className="hidden font-mono text-[11px] md:inline" dir="ltr">AI QUEST 2026 · SECTOR 02</span>
      </Container>
    </div>
  )
}

export default function Header() {
  const { t, lang } = useLang()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 60)
    on()
    window.addEventListener('scroll', on, { passive: true })
    return () => window.removeEventListener('scroll', on)
  }, [])

  return (
    <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl">
      <RunningHead />
      <div className={clsx('border-b transition-[border-color,box-shadow]', scrolled || open ? 'border-hair/80 shadow-[0_12px_30px_-24px_rgb(1_28_71/0.45)]' : 'border-transparent')}>
        <Container className="flex h-[72px] items-center gap-6">
          <a href="#/" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }} aria-label={lang === 'ar' ? 'الأزرق المفقود — الصفحة الرئيسية' : 'Missing Blue — home'}>
            <Wordmark />
          </a>

          <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label={lang === 'ar' ? 'أقسام الصفحة' : 'Page sections'}>
            {NAV.map((n) => (
              <button key={n.id} type="button" onClick={() => scrollToId(n.id)} className="rounded-full px-3 py-1.5 text-[14.5px] text-ink-2 transition-colors hover:bg-canvas hover:text-navy-900">
                {t(n.label)}
              </button>
            ))}
          </nav>

          <div className="ms-auto flex items-center gap-3">
            <LangToggle className="rounded-full border border-hair-2 bg-card !px-3.5 !no-underline hover:bg-canvas" />
            <Cta to="/app" size="sm" className="max-sm:hidden">
              <LayoutDashboard className="size-4" aria-hidden />
              {lang === 'ar' ? 'لوحة العمليات' : 'Operations console'}
            </Cta>
            <button type="button" className="grid size-9 place-items-center rounded-[10px] border border-hair-2 bg-card text-navy-900 transition-colors hover:bg-canvas lg:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={lang === 'ar' ? 'القائمة' : 'Menu'}>
              {open ? <X className="size-4" /> : <Menu className="size-4" />}
            </button>
          </div>
        </Container>

        {open && (
          <div className="border-t border-hair/80 lg:hidden">
            <Container className="grid gap-0.5 py-3">
              {NAV.map((n) => (
                <button key={n.id} type="button" onClick={() => { setOpen(false); scrollToId(n.id) }} className="rounded-[10px] px-3 py-3 text-start text-[16.5px] text-navy-900 transition-colors hover:bg-canvas">
                  {t(n.label)}
                </button>
              ))}
              <Cta to="/app" className="my-3 sm:hidden"><LayoutDashboard className="size-4" aria-hidden />{lang === 'ar' ? 'افتح لوحة العمليات' : 'Open the operations console'}</Cta>
            </Container>
          </div>
        )}
      </div>
    </header>
  )
}
