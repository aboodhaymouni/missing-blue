import clsx from 'clsx'
import { Suspense, useEffect, useMemo, useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router'
import { BarChart3, Briefcase, ClipboardCheck, Database, FlaskConical, FileText, Home, LayoutDashboard, Map as MapIcon, Menu, PenLine, ScrollText, Smartphone, X } from 'lucide-react'
import { Wordmark } from '../components/Logo'
import { useLang, type Text } from '../i18n/lang'
import { useStore } from '../lib/store'
import { DASH } from './dash'

type Item = { to: string; label: Text; icon: typeof Home; count?: number; external?: boolean; match?: (path: string, search: string) => boolean }

function NavItem({ item, onNavigate }: { item: Item; onNavigate?: () => void }) {
  const { t, n } = useLang()
  const { pathname, search } = useLocation()
  const Icon = item.icon
  const active = item.match ? item.match(pathname, search) : pathname === item.to
  const cls = clsx(
    'group relative flex h-9 shrink-0 items-center gap-3 rounded-[10px] px-3 text-[13.5px] transition-all duration-200',
    active ? 'mb-nav-active font-semibold text-white' : 'text-rail-ink hover:bg-white/[0.06] hover:text-white',
  )
  const body = (
    <>
      {active && <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-signal-300 shadow-[0_0_12px_2px_rgb(92_188_255/0.6)]" aria-hidden />}
      <Icon className={clsx('size-[18px] shrink-0', active ? 'text-signal-300' : 'text-rail-ink/80 group-hover:text-white')} aria-hidden />
      <span className="min-w-0 flex-1 truncate">{t(item.label)}</span>
      {item.count != null && item.count > 0 && (
        <span className={clsx('num rounded-full px-2 py-0.5 font-mono text-[11px] leading-none', active ? 'bg-signal-400 font-semibold text-navy-950' : 'bg-white/[0.08] text-rail-ink')} dir="ltr">{n(item.count)}</span>
      )}
    </>
  )
  if (item.external) return <Link to={item.to} target="_blank" className={cls} onClick={onNavigate}>{body}</Link>
  return <NavLink to={item.to} className={cls} onClick={onNavigate} aria-current={active ? 'page' : undefined}>{body}</NavLink>
}

function RailContent({ onNavigate }: { onNavigate?: () => void }) {
  const { lang, t, toggle } = useLang()
  const ar = lang === 'ar'
  const store = useStore()
  const counts = useMemo(() => ({
    sites: store.sites.filter((s) => s.status === 'new' || s.status === 'dispatched').length,
    reports: store.reports.filter((r) => r.status === 'unconfirmed').length,
    edits: store.edits.filter((e) => e.status === 'draft').length,
  }), [store.sites, store.reports, store.edits])

  const tabIs = (tab: string) => (p: string, s: string) => p === '/app/map' && new URLSearchParams(s).get('tab') === tab
  const groups: { title: Text; items: Item[] }[] = [
    {
      title: { ar: 'التشغيل', en: 'Operations' },
      items: [
        { to: '/app', label: { ar: 'نظرة عامة', en: 'Overview' }, icon: LayoutDashboard },
        { to: '/app/map', label: { ar: 'الخريطة والمواقع', en: 'Map and sites' }, icon: MapIcon, count: counts.sites, match: (p, s) => p === '/app/map' && !['reports', 'edits'].includes(new URLSearchParams(s).get('tab') ?? '') },
        { to: '/app/map?tab=reports', label: { ar: 'البلاغات الميدانية', en: 'Field reports' }, icon: FileText, count: counts.reports, match: tabIs('reports') },
        { to: '/app/map?tab=edits', label: { ar: 'تعديلات الخريطة', en: 'Map edits' }, icon: PenLine, count: counts.edits, match: tabIs('edits') },
      ],
    },
    {
      title: { ar: 'البيانات والأدلة', en: 'Data and evidence' },
      items: [
        { to: '/app/data', label: { ar: 'مكتبة البيانات', en: 'Data library' }, icon: Database, count: DASH.totals.sources },
        { to: '/app/eval', label: { ar: 'تقييم الاستخراج', en: 'Extraction evaluation' }, icon: FlaskConical },
        { to: '/app/audit', label: { ar: 'سجل التدقيق', en: 'Audit trail' }, icon: ScrollText, count: store.audit.length },
      ],
    },
    {
      title: { ar: 'روابط', en: 'Links' },
      items: [
        { to: '/crew', label: { ar: 'تطبيق الفريق', en: 'Crew app' }, icon: Smartphone, external: true },
        { to: '/bmc', label: { ar: 'نموذج العمل', en: 'Business model' }, icon: Briefcase },
        { to: '/', label: { ar: 'الصفحة الرئيسية', en: 'Landing page' }, icon: Home },
      ],
    },
  ]

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 px-4 pb-3 pt-4">
        <Link to="/" aria-label={ar ? 'الصفحة الرئيسية' : 'Home'} onClick={onNavigate}><Wordmark size="sm" tone="white" /></Link>
        <div className="mt-3.5 flex items-center gap-2.5 rounded-[12px] border border-white/[0.08] bg-gradient-to-br from-white/[0.08] to-white/[0.02] px-2.5 py-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-gradient-to-br from-signal-400 to-signal-700 text-white shadow-[0_6px_18px_-6px_rgb(42_139_255/0.8)]"><BarChart3 className="size-4" aria-hidden /></span>
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-semibold text-white">{ar ? 'مكتب فاقد المياه' : 'Water-loss desk'}</span>
            <span className="block truncate text-[11.5px] text-rail-ink">{ar ? 'نموذج عرض · صور حقيقية' : 'Demo workspace · real imagery'}</span>
          </span>
        </div>
      </div>
      <nav className="mb-rail-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 pb-2 pt-1" aria-label={ar ? 'أقسام لوحة العمليات' : 'Dashboard sections'}>
        {groups.map((g) => (
          <div key={g.title.en} className="mb-3 last:mb-0">
            <p className="mb-1 px-3 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-rail-ink/45">{t(g.title)}</p>
            <div className="grid gap-0.5">{g.items.map((it) => <NavItem key={it.to} item={it} onNavigate={onNavigate} />)}</div>
          </div>
        ))}
      </nav>
      <div className="flex shrink-0 items-center justify-between gap-2 border-t border-white/[0.08] px-4 py-2.5">
        <span className="flex min-w-0 items-center gap-1.5 text-[11px] text-rail-ink/70">
          <ClipboardCheck className="size-3.5 shrink-0 text-signal-300" aria-hidden />
          <span className="truncate">{ar ? 'محقَّقة حتى 10/10/2026' : 'Checked to 10 Oct 2026'}</span>
        </span>
        <button type="button" onClick={toggle} className="h-7 shrink-0 rounded-full border border-white/15 px-3 text-[12px] font-semibold text-white hover:bg-white/10">
          <span lang={ar ? 'en' : 'ar'}>{ar ? 'English' : 'العربية'}</span>
        </button>
      </div>
    </div>
  )
}

const SECTION: Record<string, Text> = {
  '/app': { ar: 'نظرة عامة', en: 'Overview' },
  '/app/map': { ar: 'الخريطة والمواقع', en: 'Map and sites' },
  '/app/data': { ar: 'مكتبة البيانات', en: 'Data library' },
  '/app/eval': { ar: 'تقييم الاستخراج', en: 'Extraction evaluation' },
  '/app/audit': { ar: 'سجل التدقيق', en: 'Audit trail' },
}

/** Top bar: where you are, what the data is, and who is signed in (a demo role). */
function TopBar({ onMenu }: { onMenu: () => void }) {
  const { lang, t, toggle } = useLang()
  const ar = lang === 'ar'
  const { pathname, search } = useLocation()
  const tab = new URLSearchParams(search).get('tab')
  const here: Text = pathname === '/app/map' && tab === 'reports' ? { ar: 'البلاغات الميدانية', en: 'Field reports' } : pathname === '/app/map' && tab === 'edits' ? { ar: 'تعديلات الخريطة', en: 'Map edits' } : SECTION[pathname] ?? SECTION['/app']
  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-3 border-b border-hair/80 bg-white/80 px-4 backdrop-blur-xl lg:h-16 lg:px-8">
      <button type="button" onClick={onMenu} className="grid size-9 place-items-center rounded-[10px] text-navy-900 hover:bg-canvas lg:hidden" aria-label={ar ? 'فتح القائمة' : 'Open menu'}><Menu className="size-5" /></button>
      <span className="min-w-0 lg:hidden"><Wordmark size="sm" /></span>
      <nav aria-label={ar ? 'المسار' : 'Breadcrumb'} className="hidden min-w-0 items-center gap-2 text-[13.5px] lg:flex">
        <span className="text-ink-soft">{ar ? 'مكتب فاقد المياه' : 'Water-loss desk'}</span>
        <span className="text-hair-2" aria-hidden>/</span>
        <span className="truncate font-semibold text-navy-900">{t(here)}</span>
      </nav>
      <div className="ms-auto flex items-center gap-2.5">
        <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-[12px] font-semibold text-emerald-800 md:inline-flex">
          <span className="relative flex size-2"><span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400 opacity-60" /><span className="relative inline-flex size-2 rounded-full bg-emerald-500" /></span>
          {ar ? 'نموذج عرض حيّ' : 'Live demo'}
        </span>
        <span className="hidden items-center gap-1.5 rounded-full border border-hair bg-white px-3 py-1 text-[12px] text-ink-soft xl:inline-flex">
          <ClipboardCheck className="size-3.5 text-signal-600" aria-hidden />{ar ? 'البيانات محقَّقة حتى 10 تشرين الأول 2026' : 'Data checked to 10 Oct 2026'}
        </span>
        <button type="button" onClick={toggle} className="h-8 min-w-8 rounded-full border border-hair-2 bg-white px-3 text-[12.5px] font-semibold text-navy-900 hover:bg-canvas">
          <span lang={ar ? 'en' : 'ar'}>{ar ? 'EN' : 'ع'}</span>
        </button>
        <span className="hidden items-center gap-2.5 border-s border-hair ps-3 sm:flex">
          <span className="grid size-9 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-950 text-[13px] font-bold text-white ring-2 ring-signal-200">{ar ? 'م' : 'E'}</span>
          <span className="hidden leading-tight xl:block">
            <span className="block text-[13px] font-semibold text-navy-900">{ar ? 'مهندس الفاقد' : 'NRW engineer'}</span>
            <span className="block text-[11.5px] text-ink-soft">{ar ? 'سلطة المياه · دور تجريبي' : 'WAJ · demo role'}</span>
          </span>
        </span>
      </div>
    </header>
  )
}

/** The operations workspace: a dark navy rail and a light canvas. On phones the rail becomes a drawer. */
export default function AppShell() {
  const { lang } = useLang()
  const ar = lang === 'ar'
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const fullBleed = pathname === '/app/map'

  useEffect(() => setOpen(false), [pathname])

  return (
    <div className="mb-canvas flex min-h-dvh text-ink">
      <aside className="mb-rail sticky top-0 hidden h-dvh w-[244px] shrink-0 overflow-hidden lg:block">
        <RailContent />
      </aside>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={ar ? 'القائمة' : 'Menu'}>
          <button type="button" className="absolute inset-0 bg-navy-950/50" aria-label={ar ? 'إغلاق القائمة' : 'Close menu'} onClick={() => setOpen(false)} />
          <div className="mb-rail absolute inset-y-0 start-0 w-[272px] max-w-[85vw] overflow-hidden shadow-2xl">
            <button type="button" onClick={() => setOpen(false)} className="absolute end-3 top-4 grid size-9 place-items-center rounded-[8px] text-white hover:bg-white/10" aria-label={ar ? 'إغلاق' : 'Close'}><X className="size-5" /></button>
            <RailContent onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar onMenu={() => setOpen(true)} />
        <main className={clsx('min-w-0', fullBleed ? 'h-[calc(100dvh-3.5rem)] min-h-0 flex-none overflow-hidden lg:h-[calc(100dvh-4rem)]' : 'flex-1')}>
          <Suspense fallback={<div className="grid h-64 place-items-center font-mono text-[12px] text-ink-soft">…</div>}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  )
}

/** Standard page frame for the scrolling dashboard pages. */
export function Page({ title, subtitle, actions, children }: { title: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
      <div className="flex flex-wrap items-end justify-between gap-4 pb-6">
        <div className="min-w-0">
          <h1 className="text-[26px] font-bold leading-tight tracking-[-0.01em] text-navy-900 sm:text-[30px]">{title}</h1>
          {subtitle && <p className="mt-1.5 max-w-[80ch] text-[14.5px] leading-relaxed text-ink-soft">{subtitle}</p>}
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>
      {children}
    </div>
  )
}

/** A dashboard card. */
export function Card({ title, aside, children, className, pad = true }: { title?: ReactNode; aside?: ReactNode; children: ReactNode; className?: string; pad?: boolean }) {
  return (
    <section className={clsx('min-w-0 rounded-[16px] border border-hair/80 bg-card shadow-[0_1px_2px_rgb(1_28_71/0.04),0_12px_32px_-20px_rgb(1_28_71/0.18)]', className)}>
      {(title || aside) && (
        <header className="flex flex-wrap items-center justify-between gap-2 px-5 pb-1 pt-4">
          {title && <h2 className="flex items-center gap-2 text-[15.5px] font-semibold text-navy-900"><span className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-signal-400 to-signal-700" aria-hidden />{title}</h2>}
          {aside && <div className="text-[12px] text-ink-soft">{aside}</div>}
        </header>
      )}
      <div className={pad ? 'p-5' : ''}>{children}</div>
    </section>
  )
}

/** "Source" link for a chart or a number. */
export function SourceLine({ sources }: { sources: ({ publisher: string; date?: string; url: string } | null | undefined)[] }) {
  const { lang } = useLang()
  const list = sources.filter(Boolean) as { publisher: string; date?: string; url: string }[]
  if (!list.length) return null
  return (
    <p className="mt-4 flex flex-wrap gap-x-3 gap-y-1 border-t border-hair pt-3 text-[11.5px] leading-snug text-ink-soft">
      <span className="font-semibold">{lang === 'ar' ? 'المصدر' : 'Source'}</span>
      {list.map((s) => (
        <a key={s.url} href={s.url} target="_blank" rel="noreferrer" className="underline decoration-hair-2 underline-offset-2 hover:text-navy-900" lang="en" dir="ltr">
          {s.publisher}{s.date ? ` · ${s.date}` : ''}
        </a>
      ))}
    </p>
  )
}
