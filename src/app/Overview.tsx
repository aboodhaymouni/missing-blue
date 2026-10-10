import clsx from 'clsx'
import { useMemo, type ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowUpRight, CircleAlert, Database, Droplets, FileText, MapPin, PenLine, Presentation, Satellite, ShieldAlert, TriangleAlert } from 'lucide-react'
import { useLang } from '../i18n/lang'
import { hhmm, useStore } from '../lib/store'
import { FACTS } from '../data/facts'
import { Card, SourceLine } from './AppShell'
import { BarsH, Columns, Meter, Spark, Stack } from './charts'
import { DASH, GOV_AR, bytes } from './dash'

const TONE = {
  signal: { chip: 'bg-signal-50 text-signal-600 ring-signal-100', value: 'text-navy-900', spark: '#1a6ff0', glow: 'from-signal-400/15' },
  navy: { chip: 'bg-navy-50 text-navy-700 ring-navy-100', value: 'text-navy-900', spark: '#1b3f82', glow: 'from-navy-400/10' },
  amber: { chip: 'bg-amber-50 text-amber-700 ring-amber-100', value: 'text-navy-900', spark: '#d98a00', glow: 'from-amber-400/15' },
  emerald: { chip: 'bg-emerald-50 text-emerald-700 ring-emerald-100', value: 'text-navy-900', spark: '#059669', glow: 'from-emerald-400/15' },
} as const

function Kpi({ label, value, sub, icon: Icon, badge, children, tone = 'navy' }: { label: string; value: string; sub?: string; icon: typeof MapPin; badge?: ReactNode; children?: ReactNode; tone?: keyof typeof TONE }) {
  const c = TONE[tone]
  return (
    <div className="group relative flex min-w-0 flex-col gap-4 overflow-hidden rounded-[16px] border border-hair/80 bg-card p-5 shadow-[0_1px_2px_rgb(1_28_71/0.04),0_12px_32px_-20px_rgb(1_28_71/0.18)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_1px_2px_rgb(1_28_71/0.04),0_20px_40px_-20px_rgb(1_28_71/0.28)]">
      <span className={clsx('pointer-events-none absolute -end-10 -top-10 size-40 rounded-full bg-gradient-to-br to-transparent blur-2xl', c.glow)} aria-hidden />
      <div className="relative flex items-center gap-3">
        <span className={clsx('grid size-10 shrink-0 place-items-center rounded-[12px] ring-1', c.chip)}><Icon className="size-[19px]" aria-hidden /></span>
        <p className="min-w-0 flex-1 text-[13px] font-medium leading-snug text-ink-soft">{label}</p>
        {badge}
      </div>
      <div className="relative flex items-end justify-between gap-3">
        <p className={clsx('num text-[36px] font-bold leading-none tracking-[-0.02em]', c.value)} dir="ltr" data-num="">{value}</p>
        {children}
      </div>
      {sub && <p className="relative border-t border-hair/70 pt-3 text-[12.5px] leading-snug text-ink-soft">{sub}</p>}
    </div>
  )
}

function Hero({ sites, reports, drafts }: { sites: number; reports: number; drafts: number }) {
  const { lang, n } = useLang()
  const ar = lang === 'ar'
  const steps = [
    { icon: Satellite, k: ar ? 'رصد' : 'Detect', l: ar ? 'مواقع تستحق الفحص' : 'sites worth a visit', v: sites, to: '/app/map' },
    { icon: FileText, k: ar ? 'تحقّق' : 'Verify', l: ar ? 'بلاغات تنتظر التأكيد' : 'reports to confirm', v: reports, to: '/app/map?tab=reports' },
    { icon: PenLine, k: ar ? 'اعتماد' : 'Approve', l: ar ? 'مسودات للاعتماد' : 'drafts to approve', v: drafts, to: '/app/map?tab=edits' },
  ]
  return (
    <section className="mb-hero relative overflow-hidden rounded-[22px] px-6 py-7 text-white shadow-[0_30px_70px_-35px_rgb(1_28_71/0.8)] sm:px-9 sm:py-9">
      <div className="mb-hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <svg className="pointer-events-none absolute -bottom-24 end-[38%] h-[340px] text-white opacity-[0.05]" viewBox="0 0 577 973" aria-hidden>
        <path d="M0 162 190 289V486L353 599V973L0 716Z" fill="currentColor" /><path d="M268 0 577 208V817L426 704V559L268 450Z" fill="currentColor" />
      </svg>
      <div className="relative grid items-center gap-8 xl:grid-cols-[1.05fr_1fr]">
        <div className="min-w-0">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.07] px-3 py-1 text-[12px] font-medium text-signal-200">
            <Satellite className="size-3.5" aria-hidden />{ar ? 'صور Sentinel-2 · الموسم الجاف 2025' : 'Sentinel-2 imagery · dry season 2025'}
          </p>
          <h1 className="mt-4 text-[28px] font-bold leading-[1.25] tracking-[-0.01em] sm:text-[34px]">
            {ar ? <>صباح الخير. <span className="bg-gradient-to-l from-signal-200 to-signal-400 bg-clip-text text-transparent">{n(sites)} موقعًا</span> تنتظر الفحص على الخطوط الناقلة.</> : <>Good morning. <span className="bg-gradient-to-r from-signal-200 to-signal-400 bg-clip-text text-transparent">{n(sites)} sites</span> are waiting for a visit on the carrier lines.</>}
          </h1>
          <p className="mt-3 max-w-[60ch] text-[14.5px] leading-relaxed text-white/70">
            {ar ? 'كل رقم هنا مصدره مذكور. الصور ترشّح، والطاقم يتحقّق، والمهندس يعتمد، ولا نقول «سرقة» قبل ذلك.' : 'Every number here is sourced. Imagery suggests, a crew checks, an engineer approves, and nothing is called theft before that.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            <Link to="/app/map" className="inline-flex h-11 items-center gap-2 rounded-[12px] bg-gradient-to-b from-signal-400 to-signal-600 px-5 text-[14px] font-semibold text-white shadow-[0_10px_24px_-10px_rgb(42_139_255/0.9)] transition-transform hover:-translate-y-0.5"><MapPin className="size-4" aria-hidden />{ar ? 'افتح الخريطة' : 'Open the map'}</Link>
            <Link to="/app/map?demo=1" className="inline-flex h-11 items-center gap-2 rounded-[12px] border border-white/20 bg-white/[0.06] px-5 text-[14px] font-semibold text-white backdrop-blur transition-colors hover:bg-white/[0.12]"><Presentation className="size-4" aria-hidden />{ar ? 'العرض التقديمي' : 'Presentation'}</Link>
          </div>
        </div>
        <ol className="grid gap-3 sm:grid-cols-3">
          {steps.map((st, i) => (
            <li key={st.k} className="relative">
              <Link to={st.to} className="group flex h-full flex-col rounded-[16px] border border-white/[0.12] bg-white/[0.06] p-4 backdrop-blur-md transition-all hover:-translate-y-0.5 hover:border-signal-300/40 hover:bg-white/[0.1]">
                <span className="flex items-center justify-between">
                  <span className="grid size-9 place-items-center rounded-[10px] bg-signal-400/15 text-signal-200 ring-1 ring-signal-300/25"><st.icon className="size-[18px]" aria-hidden /></span>
                  <span className="font-mono text-[11px] text-white/45" dir="ltr">0{i + 1}</span>
                </span>
                <span className="num mt-4 block text-[38px] font-bold leading-none tracking-[-0.02em]" dir="ltr" data-num="">{n(st.v)}</span>
                <span className="mt-2 block text-[14px] font-semibold">{st.k}</span>
                <span className="block text-[12.5px] text-white/60">{st.l}</span>
                <span className="mt-3 h-1 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-signal-300 to-signal-500" style={{ width: st.v ? '100%' : '6%' }} /></span>
              </Link>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default function Overview() {
  const { lang, t, n } = useLang()
  const ar = lang === 'ar'
  const store = useStore()
  const D = DASH

  const open = useMemo(() => store.sites.filter((s) => s.status === 'new' || s.status === 'dispatched').sort((a, b) => a.rank - b.rank), [store.sites])
  const unconfirmed = store.reports.filter((r) => r.status === 'unconfirmed').length
  const drafts = store.edits.filter((e) => e.status === 'draft').length
  const recent = [...store.audit].reverse().slice(0, 5)

  const nrw = D.nrw_national
  const nrwLast = nrw[nrw.length - 1]
  const cum = D.enforcement.cumulative
  const disi = D.enforcement.disi_by_year
  const disi2025 = disi.find((d) => d.year === 2025)
  const disi2026 = disi.find((d) => d.year === 2026)
  const annual = D.enforcement.annual.filter((a) => a.main_line_attacks != null)
  const govRows = [...D.nrw_by_governorate].filter((g) => g.latest != null || g.base != null).sort((a, b) => (b.latest ?? b.base ?? 0) - (a.latest ?? a.base ?? 0))
  const fe = D.feasibility
  const totalBytes = D.totals.bytes_c + D.totals.bytes_d

  const qrow = (icon: ReactNode, label: string, count: number, to: string, cta: string) => (
    <Link to={to} className="group flex items-center gap-3 rounded-[12px] border border-hair/80 bg-gradient-to-b from-white to-canvas/60 px-4 py-3 transition-all hover:-translate-y-px hover:border-signal-200 hover:shadow-[0_8px_20px_-14px_rgb(26_111_240/0.5)]">
      <span className="grid size-10 shrink-0 place-items-center rounded-[11px] bg-signal-50 text-signal-600 ring-1 ring-signal-100">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-medium text-navy-900">{label}</span>
        <span className="block text-[12px] text-ink-soft">{cta}</span>
      </span>
      <span className="num text-[24px] font-bold text-navy-900" dir="ltr">{n(count)}</span>
      <ArrowUpRight className="size-4 text-ink-soft opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" aria-hidden />
    </Link>
  )

  return (
    <div className="mx-auto w-full max-w-[1400px] px-4 pb-16 pt-6 sm:px-8 sm:pt-8">
      <Hero sites={open.length} reports={unconfirmed} drafts={drafts} />

      <div className="mb-5 mt-4 flex flex-wrap gap-2 text-[12px]">
        {[
          { c: 'bg-emerald-50 text-emerald-800 border-emerald-200', d: 'bg-emerald-500', l: ar ? 'صور الأقمار حقيقية' : 'Satellite imagery is real' },
          { c: 'bg-signal-50 text-signal-700 border-signal-200', d: 'bg-signal-500', l: ar ? `أرقام عامة محقّقة: ${n(D.totals.facts_confirmed)} من ${n(D.totals.facts)}` : `Public figures checked: ${n(D.totals.facts_confirmed)} of ${n(D.totals.facts)} confirmed` },
          { c: 'bg-amber-50 text-amber-800 border-amber-200', d: 'bg-amber-500', l: ar ? 'المسار توضيحي والبلاغات اصطناعية' : 'Route illustrative, reports synthetic' },
        ].map((b) => <span key={b.l} className={clsx('inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium', b.c)}><span className={clsx('size-1.5 rounded-full', b.d)} />{b.l}</span>)}
      </div>

      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Droplets} tone="signal" label={ar ? 'الفاقد الوطني (مياه لا تُفوتر)' : 'National non-revenue water'} value={nrwLast ? `${n(nrwLast.value)}%` : FACTS.nrw.value} sub={nrwLast ? (ar ? `آخر قيمة رسمية · ${nrwLast.period}` : `Latest official value · ${nrwLast.period}`) : t(FACTS.nrw.label)}>
          <Spark values={nrw.map((x) => x.value)} width={130} height={44} />
        </Kpi>
        <Kpi icon={ShieldAlert} label={ar ? 'اعتداءات على الخطوط الرئيسية والناقلة' : 'Attacks on main and carrier lines'} value={n(cum?.main_line_attacks ?? 133408)} sub={ar ? `مجموع ${cum?.period ?? 'حزيران 2013 – حزيران 2026'}` : `Total, ${cum?.period ?? 'Jun 2013 – Jun 2026'}`}>
          <Spark values={annual.map((a) => a.main_line_attacks as number)} color="#1b3f82" width={130} height={44} />
        </Kpi>
        <Kpi icon={TriangleAlert} label={ar ? 'اعتداءات على خط الديسي' : 'Attacks on the Disi line'} value={n(disi2025?.attacks ?? 1802)} tone="amber" badge={<span className="rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">{ar ? 'الأعلى منذ 2014' : 'Highest since 2014'}</span>} sub={ar ? `في 2025، أعلى عام منذ 2014${disi2026 ? `؛ و${n(disi2026.attacks)} في 2026 حتى آب` : ''}` : `in 2025, the most since 2014${disi2026 ? `; ${n(disi2026.attacks)} in 2026 to August` : ''}`}>
          <Spark values={disi.map((d) => d.attacks)} color="#d98a00" width={130} height={44} />
        </Kpi>
        <Kpi icon={Database} label={ar ? 'بيانات جمعناها وتحقّقنا منها' : 'Data collected and checked'} value={n(D.totals.sources)} tone="emerald" sub={ar ? `مصدرًا في ${n(D.totals.domains)} مجالًا · ${n(D.totals.facts)} رقمًا · ${bytes(totalBytes, 'ar')}` : `sources in ${n(D.totals.domains)} domains · ${n(D.totals.facts)} figures · ${bytes(totalBytes, 'en')}`}>
          <Link to="/app/data" className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1.5 text-[12.5px] font-semibold text-emerald-800 ring-1 ring-emerald-100 hover:bg-emerald-100">{ar ? 'المكتبة' : 'Library'}<ArrowUpRight className="size-3.5" aria-hidden /></Link>
        </Kpi>
      </div>

      {/* Queue + NRW by governorate */}
      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-5" title={ar ? 'ينتظر اليوم' : 'Waiting today'} aside={ar ? 'من بيانات العرض' : 'Demo data'}>
          <div className="hidden">
            {qrow(<MapPin className="size-4" />, ar ? 'مواقع تستحق الفحص' : 'Sites worth inspecting', open.length, '/app/map', ar ? 'مرتّبة بصيغة معلنة' : 'Ranked by a published formula')}
            {qrow(<FileText className="size-4" />, ar ? 'بلاغات تنتظر التأكيد' : 'Reports awaiting confirmation', unconfirmed, '/app/map?tab=reports', ar ? 'الحقول مع كلمات الطاقم' : 'Fields with the crew’s words')}
            {qrow(<PenLine className="size-4" />, ar ? 'مسودات تنتظر الاعتماد' : 'Draft edits awaiting approval', drafts, '/app/map?tab=edits', ar ? 'متقطّعة حتى يعتمدها مهندس' : 'Dashed until an engineer approves')}
          </div>
          {open.length > 0 && (
            <>
              <p className="mb-2 mt-1 text-[12px] font-semibold text-ink-soft">{ar ? 'أعلى المواقع ترتيبًا' : 'Top-ranked sites'}</p>
              <ol className="grid grid-cols-[minmax(0,1fr)] gap-1">
                {open.slice(0, 6).map((s) => (
                  <li key={s.id}>
                    <Link to={`/app/map?site=${s.id}`} className="flex items-center gap-3 rounded-[12px] border border-transparent px-2.5 py-2.5 text-[13px] transition-colors hover:border-hair hover:bg-canvas">
                      <span className="num grid size-7 shrink-0 place-items-center rounded-full bg-gradient-to-br from-amber-300 to-amber-500 text-[12px] font-bold text-navy-950 shadow-[0_4px_10px_-4px_rgb(217_138_0/0.8)]" dir="ltr">{s.rank}</span>
                      <span className="font-mono font-semibold text-navy-900">{s.id}</span>
                      <span className="num ms-auto font-mono text-[12px] text-ink-soft" dir="ltr">{n(s.area_ha, { maximumFractionDigits: 2 })} ha · {n(s.dist_line_m)} m</span>
                      <span className="w-20"><Meter value={s.score} total={1} color="#1a6ff0" /></span>
                    </Link>
                  </li>
                ))}
              </ol>
            </>
          )}
          {recent.length > 0 && (
            <>
              <p className="mb-2 mt-5 text-[12px] font-semibold text-ink-soft">{ar ? 'آخر نشاط' : 'Recent activity'}</p>
              <ul className="grid grid-cols-[minmax(0,1fr)] gap-1.5">
                {recent.map((a) => (
                  <li key={a.id} className="flex min-w-0 items-baseline gap-3 text-[12.5px]">
                    <span className="num font-mono text-[11.5px] text-ink-soft" dir="ltr">{hhmm(a.at)}</span>
                    <span className="font-mono text-[11.5px] font-semibold text-navy-900">{a.target}</span>
                    <span className="min-w-0 flex-1 truncate text-ink-soft">{a.detail}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card className="xl:col-span-7" title={ar ? 'الفاقد حسب المحافظة' : 'Non-revenue water by governorate'} aside={govRows[0]?.latest_period ? (ar ? `${govRows[0].base_period} مقابل ${govRows[0].latest_period}` : `${govRows[0].base_period} vs ${govRows[0].latest_period}`) : undefined}>
          {govRows.length ? (
            <BarsH
              unit="%"
              max={80}
              aLabel={ar ? `الأحدث (${govRows[0].latest_period ?? ''})` : `Latest (${govRows[0].latest_period ?? ''})`}
              bLabel={ar ? `خط الأساس (${govRows[0].base_period ?? ''})` : `Baseline (${govRows[0].base_period ?? ''})`}
              rows={govRows.map((g) => ({ key: g.gov_en, label: ar ? g.gov_ar || GOV_AR[g.gov_en] || g.gov_en : g.gov_en, a: g.latest, b: g.base }))}
            />
          ) : <Empty />}
          <SourceLine sources={[D.nrw_by_governorate_source]} />
        </Card>
      </div>

      {/* Registers */}
      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-7" title={ar ? `سجل السرقات من الأخبار · ${n(D.theft.total)} حادثة` : `Theft register from the news · ${n(D.theft.total)} events`} aside={<Link to="/app/data?tab=events" className="font-semibold text-signal-700 hover:underline">{ar ? 'كل الأحداث' : 'All events'}</Link>}>
          {D.theft.total ? (
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <p className="mb-3 text-[12px] font-semibold text-ink-soft">{ar ? 'حسب السنة' : 'By year'}</p>
                <Columns data={D.theft.by_year.map((y) => ({ label: String(y.year), value: y.count }))} height={120} color="#b4232a" />
              </div>
              <div>
                <p className="mb-3 text-[12px] font-semibold text-ink-soft">{ar ? 'حسب النوع' : 'By type'}</p>
                <BarsH color="#b4232a" rows={D.theft.by_type.map((x) => ({ key: x.type, label: ar ? x.label_ar : x.label_en, a: x.count }))} />
                <p className="mb-2 mt-5 text-[12px] font-semibold text-ink-soft">{ar ? 'أكثر المحافظات' : 'Top governorates'}</p>
                <div className="flex flex-wrap gap-1.5">
                  {D.theft.by_governorate.slice(0, 6).map((g) => (
                    <span key={g.gov_en} className="rounded-full bg-canvas px-2.5 py-1 text-[12px] text-navy-900">{ar ? g.gov_ar || GOV_AR[g.gov_en] || g.gov_en : g.gov_en} <span className="num font-mono text-ink-soft" dir="ltr">{n(g.count)}</span></span>
                  ))}
                </div>
              </div>
            </div>
          ) : <Empty />}
          <p className="mt-4 border-t border-hair pt-3 text-[11.5px] text-ink-soft">{ar ? 'عيّنة مما نشرته الصحافة، كل حادثة برابطها. الوزارة سجّلت أضعاف ذلك.' : 'A sample of what the press reported, each event with its link. The ministry recorded many times more.'}</p>
        </Card>

        <Card className="xl:col-span-5" title={<span className="inline-flex items-center gap-2"><Satellite className="size-4 text-signal-600" aria-hidden />{ar ? 'اختبار الأقمار على خطوط الديسي' : 'Satellite test on the Disi lines'}</span>}>
          {fe ? (
            <>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { v: n(fe.candidates_default_2km), l: ar ? 'رقعة جديدة على بعد 2 كم من الخط' : 'new patches within 2 km of a line' },
                  { v: `${n(fe.detect_green_m2)} م²`.replace('م²', ar ? 'م²' : 'm²'), l: ar ? 'أصغر رقعة خضراء تُكشف دائمًا' : 'smallest green patch always found' },
                  { v: fe.separation.split(' ')[0], l: ar ? 'فوق ضجيج الصحراء' : 'above desert noise' },
                ].map((x) => (
                  <div key={x.l} className="rounded-[10px] bg-canvas p-3">
                    <p className="num font-mono text-[18px] font-semibold text-navy-900" dir="ltr">{x.v}</p>
                    <p className="mt-1 text-[11.5px] leading-snug text-ink-soft">{x.l}</p>
                  </div>
                ))}
              </div>
              <p className="mb-2 mt-5 text-[12px] font-semibold text-ink-soft">{ar ? 'ماذا تبيّن بعد المراجعة البصرية (تقدير لكل الرقع)' : 'What visual review found (estimate over all patches)'}</p>
              <Stack parts={[
                { key: 'fp', label: ar ? 'إنذار كاذب واضح (طرق، عمران، أودية)' : 'Obvious false alarm (roads, building, wadis)', value: fe.review_all_estimate.false_positive, color: '#c9d3e3' },
                { key: 'farm', label: ar ? 'مزرعة أو بيت بلاستيكي جديد' : 'New farm or greenhouse', value: fe.review_all_estimate.new_farm, color: '#f5a524' },
                { key: 'unx', label: ar ? 'غير مفسَّر: هذه ما يُرسل إليه الطاقم' : 'Unexplained: what a crew is sent to', value: fe.review_all_estimate.unexplained, color: '#1a6ff0' },
              ]} />
              <p className="mt-4 flex gap-2 rounded-[8px] bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900"><CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden />{ar ? 'لهذا لا نقول «سرقة» أبدًا: الصور ترشّح، والطاقم يتحقّق، والمهندس يعتمد.' : 'This is why we never say “theft”: imagery suggests, a crew checks, an engineer approves.'}</p>
            </>
          ) : <Empty />}
        </Card>
      </div>

      {/* Disi + outages */}
      <div className="mt-4 grid gap-4 xl:grid-cols-12">
        <Card className="xl:col-span-6" title={ar ? 'الاعتداءات على خط الديسي، سنة بسنة' : 'Attacks on the Disi line, year by year'} aside={ar ? '* سنة غير مكتملة' : '* partial year'}>
          {disi.length ? <Columns data={disi.map((d) => ({ label: String(d.year), value: d.attacks, partial: d.partial_year }))} height={150} color="#c77c00" highlightLast /> : <Empty />}
          <SourceLine sources={[disi[disi.length - 1]?.source]} />
        </Card>
        <Card className="xl:col-span-6" title={ar ? 'إنفاذ الوزارة على الخطوط الرئيسية' : 'Ministry enforcement on main lines'} aside={ar ? 'اعتداءات مضبوطة في السنة' : 'Attacks caught per year'}>
          {annual.length ? <Columns data={annual.map((a) => ({ label: String(a.year), value: a.main_line_attacks, partial: a.partial_year }))} height={150} color="#0b2a5b" /> : <Empty />}
          <SourceLine sources={[annual[annual.length - 1]?.source]} />
        </Card>
      </div>

      {/* Domains preview */}
      <Card className="mt-4" title={ar ? `مكتبة البيانات · ${n(D.totals.domains)} مجالًا` : `Data library · ${n(D.totals.domains)} domains`} aside={<Link to="/app/data" className="font-semibold text-signal-700 hover:underline">{ar ? 'افتح المكتبة' : 'Open the library'}</Link>}>
        {D.domains.length ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
            {D.domains.map((d) => (
              <Link key={d.id} to={`/app/data?domain=${d.id}`} className="rounded-[10px] border border-hair p-3.5 transition-colors hover:border-hair-2 hover:bg-canvas">
                <p className="truncate text-[13.5px] font-semibold text-navy-900">{ar ? d.name_ar : d.name_en}</p>
                <p className="num mt-1 font-mono text-[11.5px] text-ink-soft" dir="ltr">{n(d.sources)} src · {n(d.facts)} facts · {bytes(d.bytes_c + d.bytes_d, 'en')}</p>
                <div className="mt-2.5"><Meter value={d.confirmed} total={d.facts || 1} color="#0b2a5b" /></div>
              </Link>
            ))}
          </div>
        ) : <Empty />}
      </Card>
    </div>
  )
}

function Empty() {
  const { lang } = useLang()
  return <p className="py-6 text-center text-[13px] text-ink-soft">{lang === 'ar' ? 'تُحمَّل البيانات…' : 'Loading data…'}</p>
}
