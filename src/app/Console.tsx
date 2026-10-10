import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { Presentation, RotateCcw, Smartphone, X } from 'lucide-react'
import { Chip } from '../components/ui'
import { useLang, type Text } from '../i18n/lang'
import { useStore } from '../lib/store'
import { SAMPLE_REPORTS } from '../data/reports'
import { aiStatus, extractAI } from '../lib/extract/ai'
import { download, editsToGeoJSON } from '../lib/export'
import MapView, { AOI_IMAGES, type AoiKey, type MapEvent } from './MapView'
import { DASH } from './dash'
import { AuditPanel, EditDetail, EditList, ReportDetail, ReportList, SiteDetail, SiteList } from './Panels'

type Tab = 'sites' | 'reports' | 'edits' | 'audit'

/** Dark glass for everything floating over the satellite map. */
const GLASS = 'bg-[#04102a]/75 backdrop-blur-md border border-white/15 text-white rounded-[14px] shadow-xl'

const STEPS: { title: Text; body: Text }[] = [
  { title: { ar: 'صورة فضائية حقيقية', en: 'A real satellite image' }, body: { ar: 'Sentinel-2، آب 2025: مقطع صحراوي قرب القطرانة. الخط المتقطّع مسار توضيحي، لا مسار الخط الحقيقي.', en: 'Sentinel-2, August 2025: a desert segment near Qatrana. The dashed line is an illustrative route, not the real pipeline.' } },
  { title: { ar: 'موقع مرتّب «يستحق الفحص»', en: 'A ranked “worth inspecting” site' }, body: { ar: 'رقعة جديدة صغيرة قرب المسار. البطاقة تقول لماذا، ولا تقول «تسرّب» أو «سارق».', en: 'A small new patch near the route. The card says why — never “leak” or “thief”.' } },
  { title: { ar: 'بلاغ ميداني بالعربية', en: 'An Arabic field report' }, body: { ar: 'الفريق 3 يزور الموقع ويبلّغ بلهجته من تطبيق الفريق.', en: 'Crew 3 visits the site and reports in dialect from the crew app.' } },
  { title: { ar: 'حقول مستخرجة بكلماتها', en: 'Fields with their source words' }, body: { ar: 'كل حقل يشير إلى كلماته في النص. العمق فارغ لأنه لم يُذكر. «2 إنش بلاستيك» = 63 ملم.', en: 'Every field points to its words. Depth is empty because it was not mentioned. “2-inch plastic” = 63 mm.' } },
  { title: { ar: 'مسودة تعديل متقطّعة', en: 'A dashed draft map edit' }, body: { ar: 'بعد تأكيد النتيجة، تُنشأ مسودة بصيغة wMain حالتها «قيد الفحص».', en: 'After the outcome is confirmed, a wMain draft is created, “under check”.' } },
  { title: { ar: 'اعتماد المهندس', en: 'Engineer approval' }, body: { ar: 'المهندس يحدّد المادة ويعتمد، فيصبح الخط متصلًا.', en: 'The engineer sets the material and approves; the line turns solid.' } },
  { title: { ar: 'تصدير بصيغة مياهنا', en: 'Export in Miyahuna’s format' }, body: { ar: 'GeoJSON بنظام EPSG:28191، والسجل يحفظ كل خطوة.', en: 'GeoJSON in EPSG:28191, and the audit log keeps every step.' } },
]

export default function Console() {
  const { lang, t, n } = useLang()
  const ar = lang === 'ar'
  const store = useStore()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<Tab>('sites')
  const [aoi, setAoi] = useState<AoiKey>('qatrana')
  const [year, setYear] = useState<'before' | 'after'>('after')
  const [site, setSite] = useState<string | null>(null)
  const [report, setReport] = useState<string | null>(null)
  const [edit, setEdit] = useState<string | null>(null)
  const [cursor, setCursor] = useState<[number, number] | null>(null)
  const [focus, setFocus] = useState<{ lon: number; lat: number; zoom?: number; key: number } | null>(null)
  const [demo, setDemo] = useState<number | null>(params.get('demo') ? 0 : null)
  const demoIds = useRef<{ site?: string; report?: string; edit?: string }>({})
  const [layers, setLayers] = useState({ theft: false, supply: false })
  // A short confirmation after every recorded action (the audit trail is the single source).
  const [toast, setToast] = useState<{ id: string; text: string } | null>(null)
  const auditLen = useRef(store.audit.length)
  useEffect(() => {
    if (store.audit.length > auditLen.current) {
      const a = store.audit[store.audit.length - 1]
      setToast({ id: a.id, text: `${a.target} · ${a.detail}` })
      const tm = setTimeout(() => setToast(null), 3200)
      auditLen.current = store.audit.length
      return () => clearTimeout(tm)
    }
    auditLen.current = store.audit.length
  }, [store.audit])
  const [national, setNational] = useState(0)
  const [reframe, setReframe] = useState(0)
  // The map's bottom controls (scale, attribution) sit above the floating footer, whatever its height.
  const mapArea = useRef<HTMLElement>(null)
  const footer = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const f = footer.current
    const area = mapArea.current
    if (!f || !area || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(() => area.style.setProperty('--mb-foot', `${f.offsetHeight + 12}px`))
    ro.observe(f)
    return () => ro.disconnect()
  }, [])
  const mapEvents = useMemo<MapEvent[]>(() => [
    ...DASH.theft.events.map((e) => ({ e, register: 'theft' as const, reg: DASH.theft })),
    ...DASH.supply.events.map((e) => ({ e, register: 'supply' as const, reg: DASH.supply })),
  ].filter(({ e }) => e.lat != null && e.lon != null).map(({ e, register, reg }) => {
    const type = reg.by_type.find((x) => x.type === e.type)
    const place = (ar ? e.place_ar : e.place_en) || e.place_en || e.gov_en
    return { id: e.id, register, lat: e.lat as number, lon: e.lon as number, date: e.date, label: `${type ? (ar ? type.label_ar : type.label_en) : e.type} · ${place}` }
  }), [ar])

  const counts = useMemo(() => ({
    sites: store.sites.filter((s) => s.aoi === aoi && (s.status === 'new' || s.status === 'dispatched')).length,
    reports: store.reports.filter((r) => r.status === 'unconfirmed').length,
    edits: store.edits.filter((e) => e.status === 'draft').length,
  }), [store.sites, store.reports, store.edits, aoi])

  const selectSite = useCallback((id: string) => {
    setTab('sites')
    setSite(id)
    const s = store.sites.find((x) => x.id === id)
    if (s) {
      if (s.aoi !== aoi) setAoi(s.aoi as AoiKey)
      setFocus({ lon: s.lon, lat: s.lat, zoom: 15, key: Date.now() })
    }
  }, [store.sites, aoi])

  // Keep a stable callback for map markers.
  const selectRef = useRef(selectSite)
  selectRef.current = selectSite
  const onMarker = useCallback((id: string) => selectRef.current(id), [])

  // Demo state machine — each step is idempotent so the presenter can move back and forth.
  const runStep = useCallback(async (i: number) => {
    const ids = demoIds.current
    const top = store.sites.filter((s) => s.aoi === 'qatrana').sort((a, b) => a.rank - b.rank).find((s) => s.status === 'new' || s.id === ids.site) ?? store.sites[0]
    if (i === 0) {
      setAoi('qatrana'); setYear('after'); setTab('sites'); setSite(null); setFocus(null)
    }
    if (i === 1) {
      ids.site = top.id
      setAoi('qatrana'); setYear('after'); selectSite(top.id)
    }
    if (i === 2) {
      const sid = ids.site ?? top.id
      ids.site = sid
      const s = store.sites.find((x) => x.id === sid)
      if (s && s.status === 'new') store.dispatchCrew(sid, 'C3')
      // Prefer a report the crew actually sent from the phone; otherwise use the synthetic one.
      const fromPhone = store.reports.find((r) => r.siteId === sid && !r.synthetic)
      if (fromPhone) ids.report = fromPhone.id
      else if (!ids.report) {
        const r01 = SAMPLE_REPORTS[0]
        store.addReport({ siteId: sid, crew: 'C3', channel: 'voice', text: r01.text, synthetic: true })
      }
      setTab('reports')
    }
    if (i === 3) {
      setTab('reports')
      const st = await aiStatus()
      const rid = ids.report
      if (st.available && rid) {
        const r = store.reports.find((x) => x.id === rid)
        if (r && r.engine !== 'claude') {
          const res = await extractAI(r.text)
          if (res.ok) store.setExtraction(rid, res.extraction, 'claude')
        }
      }
    }
    if (i === 4) {
      const rid = ids.report
      const r = store.reports.find((x) => x.id === rid)
      if (r && r.status === 'unconfirmed') store.confirmReport(r.id, 'illegal_connection')
      if (r && !store.edits.find((e) => e.reportId === r.id)) store.createEdit(r.id)
      setTab('edits')
      const s = store.sites.find((x) => x.id === ids.site)
      if (s) setFocus({ lon: s.lon + 0.0005, lat: s.lat - 0.0001, zoom: 16.5, key: Date.now() })
    }
    if (i === 5) {
      const e = store.edits.find((x) => x.reportId === ids.report)
      if (e && e.status === 'draft') store.approveEdit(e.id, 'PE')
      setTab('edits')
    }
    if (i === 6) {
      const e = store.edits.find((x) => x.reportId === ids.report)
      if (e && e.status === 'approved') {
        download(`wMain_${e.id}_EPSG28191.geojson`, JSON.stringify(editsToGeoJSON([e]), null, 2))
        store.exportEdit(e.id)
      }
      setTab('audit')
    }
  }, [store, selectSite])

  // Track the report/edit created during the demo and open them in the side panel.
  useEffect(() => {
    if (demo === null) return
    const ids = demoIds.current
    if (demo >= 2 && ids.site) {
      const r = store.reports.find((x) => x.siteId === ids.site)
      if (r) {
        ids.report = r.id
        if (tab === 'reports') setReport(r.id)
      }
    }
    if (demo >= 4 && ids.report) {
      const e = store.edits.find((x) => x.reportId === ids.report)
      if (e) {
        ids.edit = e.id
        if (tab === 'edits') setEdit(e.id)
      }
    }
  }, [demo, store.reports, store.edits, tab])

  useEffect(() => {
    if (demo !== null) runStep(demo)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [demo])

  // Keyboard: J / K walk the ranked sites, B flips between the two years, Esc goes back. In presentation
  // mode a clicker's keys (PageDown / PageUp, arrows) move between steps. event.code also works on an Arabic layout.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return
      if (el?.closest('input, textarea, select, [contenteditable="true"], [role="slider"], .maplibregl-canvas')) return
      if (demo !== null) {
        const step = ['PageDown', 'ArrowDown', 'ArrowRight'].includes(e.code) ? 1 : ['PageUp', 'ArrowUp', 'ArrowLeft'].includes(e.code) ? -1 : 0
        if (step) {
          e.preventDefault()
          setDemo((d) => (d === null ? d : Math.min(STEPS.length - 1, Math.max(0, d + step))))
          return
        }
      }
      if (e.code === 'KeyB') setYear((y) => (y === 'after' ? 'before' : 'after'))
      else if (e.code === 'Escape') {
        if (edit) setEdit(null)
        else if (report) setReport(null)
        else if (site) setSite(null)
      } else if (e.code === 'KeyJ' || e.code === 'KeyK') {
        const list = store.sites.filter((s) => s.aoi === aoi).sort((a, b) => a.rank - b.rank)
        if (!list.length) return
        const i = list.findIndex((s) => s.id === site)
        const j = e.code === 'KeyJ' ? (i + 1) % list.length : i <= 0 ? list.length - 1 : i - 1
        selectSite(list[j].id)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [demo, edit, report, site, aoi, store.sites, selectSite])

  // Deep links from the dashboard rail and overview: ?tab=reports|edits, ?site=ID.
  const qTab = params.get('tab')
  const qSite = params.get('site')
  useEffect(() => {
    if (qTab === 'reports' || qTab === 'edits' || qTab === 'audit') setTab(qTab)
    else if (!qSite) setTab('sites')
  }, [qTab, qSite])
  useEffect(() => {
    if (qSite) selectSite(qSite)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qSite])

  const closeDemo = () => {
    setDemo(null)
    if (params.get('demo')) {
      params.delete('demo')
      setParams(params, { replace: true })
    }
  }

  const img = AOI_IMAGES[aoi]
  const flowSteps: { key: string; label: Text; count: number; active: boolean; go: () => void }[] = [
    { key: 'detect', label: { ar: 'رصد: يستحق الفحص', en: 'Detect: worth a visit' }, count: store.sites.filter((s) => s.status === 'new').length, active: tab === 'sites' && !site, go: () => { setTab('sites'); setSite(null) } },
    { key: 'visit', label: { ar: 'زيارة: فريق مُرسَل', en: 'Visit: crew sent' }, count: store.sites.filter((s) => s.status === 'dispatched').length, active: tab === 'sites' && !!site, go: () => { setTab('sites'); const d = store.sites.find((s) => s.status === 'dispatched'); if (d) selectSite(d.id) } },
    { key: 'verify', label: { ar: 'تحقّق: بلاغ للتأكيد', en: 'Verify: report to confirm' }, count: store.reports.filter((r) => r.status === 'unconfirmed').length, active: tab === 'reports', go: () => { setTab('reports'); setReport(null) } },
    { key: 'approve', label: { ar: 'اعتماد: مسودة', en: 'Approve: draft edit' }, count: store.edits.filter((e) => e.status === 'draft').length, active: tab === 'edits' && !store.edits.some((e) => e.id === edit && e.status !== 'draft'), go: () => { setTab('edits'); setEdit(null) } },
    { key: 'export', label: { ar: 'تصدير بصيغة مياهنا', en: 'Export to Miyahuna' }, count: store.edits.filter((e) => e.status === 'approved' || e.status === 'exported').length, active: tab === 'audit', go: () => setTab('audit') },
  ]
  const tabs: { k: Tab; label: Text; count?: number }[] = [
    { k: 'sites', label: { ar: 'المواقع', en: 'Sites' }, count: counts.sites },
    { k: 'reports', label: { ar: 'البلاغات', en: 'Reports' }, count: counts.reports },
    { k: 'edits', label: { ar: 'التعديلات', en: 'Edits' }, count: counts.edits },
    { k: 'audit', label: { ar: 'السجل', en: 'Audit' } },
  ]

  return (
    <div className="flex h-full flex-col bg-canvas text-ink">
      {/* Page toolbar */}
      <header className="flex h-11 shrink-0 items-center gap-3 border-b border-hair bg-card px-4">
        <div className="flex min-w-0 items-baseline gap-2.5">
          <h1 className="truncate text-[14.5px] font-semibold text-navy-900">{ar ? 'الخريطة والمواقع' : 'Map and sites'}</h1>
          <p className="hidden truncate text-[11.5px] text-ink-soft lg:block">{ar ? 'صور Sentinel-2 حقيقية · المسار توضيحي · البلاغات اصطناعية' : 'Real Sentinel-2 imagery · illustrative route · synthetic reports'}</p>
        </div>
        <nav className="ms-auto flex items-center gap-1.5">
          <Link to="/crew" target="_blank" className="hidden h-8 items-center gap-1.5 rounded-[8px] border border-hair-2 px-2.5 text-[12.5px] font-semibold text-navy-900 hover:bg-canvas sm:inline-flex">
            <Smartphone className="size-4" aria-hidden />
            {ar ? 'تطبيق الفريق' : 'Crew app'}
          </Link>
          <button type="button" onClick={() => setDemo(demo === null ? 0 : null)} className={clsx('inline-flex h-8 items-center gap-1.5 rounded-[8px] px-2.5 text-[12.5px] font-semibold', demo !== null ? 'bg-signal-600 text-white' : 'bg-navy-900 text-white hover:bg-navy-700')}>
            <Presentation className="size-4" aria-hidden />
            {ar ? 'عرض تقديمي' : 'Presentation'}
          </button>
          <button type="button" onClick={() => { if (confirm(ar ? 'إعادة بيانات العرض إلى البداية؟' : 'Reset demo data?')) { store.reset(); setSite(null); setReport(null); setEdit(null); demoIds.current = {} } }} className="grid size-8 place-items-center rounded-[8px] text-ink-soft hover:bg-canvas hover:text-navy-900" title={ar ? 'إعادة بيانات العرض' : 'Reset demo data'} aria-label={ar ? 'إعادة بيانات العرض' : 'Reset demo data'}>
            <RotateCcw className="size-4" aria-hidden />
          </button>
        </nav>
      </header>

      {/* System flow: where every case is, end to end */}
      <nav aria-label={ar ? 'مسار العمل' : 'Workflow'} className="flex shrink-0 items-stretch gap-1 overflow-x-auto border-b border-hair bg-card px-3 py-1.5 scrollbar-thin">
        {flowSteps.map((f, i) => {
          const on = f.active
          return (
            <div key={f.key} className="flex items-center gap-1">
              {i > 0 && <span className="px-0.5 text-hair-2" aria-hidden>{ar ? '←' : '→'}</span>}
              <button type="button" onClick={f.go} aria-current={on ? 'step' : undefined} className={clsx('flex items-center gap-2 whitespace-nowrap rounded-[8px] border px-2.5 py-1.5 text-start transition-colors', on ? 'border-navy-900 bg-navy-900 text-white' : 'border-hair bg-card text-navy-900 hover:bg-canvas')}>
                <span className={clsx('grid size-5 place-items-center rounded-full font-mono text-[11px] font-semibold', on ? 'bg-white text-navy-900' : 'bg-canvas text-ink-soft')}>{i + 1}</span>
                <span className="text-[12.5px] font-semibold">{t(f.label)}</span>
                <span className={clsx('num rounded-full px-1.5 font-mono text-[11px]', on ? 'bg-white/15' : f.count ? 'bg-signal-50 text-signal-700' : 'text-ink-soft')} dir="ltr">{n(f.count)}</span>
              </button>
            </div>
          )
        })}
        <p className="ms-auto hidden items-center ps-4 text-[11.5px] text-ink-soft xl:flex">{ar ? 'الصور ترشّح · الطاقم يتحقّق · المهندس يعتمد' : 'Imagery suggests · crews verify · engineers approve'}</p>
      </nav>

      <div className="flex min-h-0 flex-1 flex-col-reverse md:flex-row">
        {/* Side panel */}
        <aside className="flex min-h-0 w-full flex-col border-hair bg-card md:w-[420px] md:border-e">
          <div className="flex shrink-0 border-b border-hair px-2" role="tablist">
            {tabs.map((x) => (
              <button key={x.k} type="button" role="tab" aria-selected={tab === x.k} onClick={() => setTab(x.k)} className={clsx('relative flex-1 py-3 text-[13.5px] font-semibold transition-colors', tab === x.k ? 'text-navy-900' : 'text-muted hover:text-navy-900')}>
                {t(x.label)}
                {!!x.count && <span className="ms-1.5 font-mono text-[11px] text-signal-600">{x.count}</span>}
                {tab === x.k && <span className="absolute inset-x-3 bottom-0 h-[2px] bg-navy-900" aria-hidden />}
              </button>
            ))}
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
            {tab === 'sites' && (site ? <SiteDetail id={site} onBack={() => setSite(null)} onOpenReport={(rid) => { setTab('reports'); setReport(rid) }} /> : <SiteList aoi={aoi} selected={site} onSelect={selectSite} />)}
            {tab === 'reports' && (report ? <ReportDetail id={report} onBack={() => setReport(null)} onOpenEdit={(eid) => { setTab('edits'); setEdit(eid) }} /> : <ReportList selected={report} onSelect={setReport} />)}
            {tab === 'edits' && (edit ? <EditDetail id={edit} onBack={() => setEdit(null)} /> : <EditList selected={edit} onSelect={setEdit} />)}
            {tab === 'audit' && <AuditPanel />}
          </div>
        </aside>

        {/* Map */}
        <main ref={mapArea} className="relative h-[46vh] min-h-[320px] flex-1 bg-[#04102a] md:h-auto">
          <MapView aoi={aoi} year={year} selected={site} onSelect={onMarker} onCursor={setCursor} focus={focus} events={mapEvents} showEvents={layers} national={national} reframe={reframe} />

          <div className="absolute end-3 top-3 z-10 grid gap-2">
            <div className={clsx(GLASS, 'flex gap-1 p-1 text-[12.5px]')}>
              {(['qatrana', 'mudawwara'] as const).map((k) => (
                <button key={k} type="button" aria-pressed={aoi === k} onClick={() => { setAoi(k); setSite(null) }} className={clsx('flex-1 rounded-[10px] px-3 py-1.5 font-semibold transition-colors', aoi === k ? 'bg-signal-500 text-white shadow-[0_0_16px_rgb(42_139_255/0.55)]' : 'text-white/75 hover:bg-white/10 hover:text-white')}>
                  {k === 'qatrana' ? (ar ? 'القطرانة' : 'Qatrana') : ar ? 'المدوّرة' : 'Mudawwara'}
                </button>
              ))}
            </div>
            <div className={clsx(GLASS, 'flex gap-1 p-1 text-[12.5px]')}>
              {(['before', 'after'] as const).map((k) => (
                <button key={k} type="button" aria-pressed={year === k} onClick={() => setYear(k)} title={ar ? 'اضغط B للتبديل بين السنتين' : 'Press B to flip between the years'} aria-keyshortcuts="B" className={clsx('flex-1 rounded-[10px] px-3 py-1.5 font-mono font-semibold transition-colors', year === k ? 'bg-signal-500 text-white shadow-[0_0_16px_rgb(42_139_255/0.55)]' : 'text-white/75 hover:bg-white/10 hover:text-white')}>
                  {k === 'before' ? img.beforeYear : img.afterYear}
                </button>
              ))}
            </div>
            <div className={clsx(GLASS, 'grid gap-1.5 p-2.5 text-[12.5px]')}>
              <p className="px-1 text-[11px] font-semibold text-white/60">{ar ? 'طبقات من الأخبار' : 'News layers'}</p>
              {([
                { k: 'theft', l: ar ? `سرقات (${DASH.theft.events.length})` : `Thefts (${DASH.theft.events.length})`, c: '#e5484d' },
                { k: 'supply', l: ar ? `كسور وانقطاعات (${DASH.supply.events.length})` : `Breaks, outages (${DASH.supply.events.length})`, c: '#1a6ff0' },
              ] as const).map((x) => (
                <label key={x.k} className="flex cursor-pointer items-center gap-2 rounded-[8px] px-1 py-0.5 text-white/90 hover:bg-white/10">
                  <input type="checkbox" checked={layers[x.k]} onChange={(e) => { setLayers((v) => ({ ...v, [x.k]: e.target.checked })); if (e.target.checked) setNational((v) => v + 1) }} className="accent-[#2a8bff]" />
                  <span className="size-2.5 rounded-full ring-1 ring-white/70" style={{ background: x.c }} aria-hidden />
                  {x.l}
                </label>
              ))}
              <div className="flex gap-1.5 pt-1">
                <button type="button" onClick={() => setNational((v) => v + 1)} className="h-7 flex-1 whitespace-nowrap rounded-[8px] border border-white/15 px-2 text-[11.5px] font-semibold text-white hover:bg-white/10">{ar ? 'الأردن كله' : 'All Jordan'}</button>
                <button type="button" onClick={() => setReframe((v) => v + 1)} className="h-7 flex-1 whitespace-nowrap rounded-[8px] border border-white/15 px-2 text-[11.5px] font-semibold text-white hover:bg-white/10">{ar ? 'منطقة الدراسة' : 'Study area'}</button>
              </div>
            </div>
          </div>

          {/* Footer strip: provenance, the one caveat, cursor position */}
          <div ref={footer} className={clsx(GLASS, 'absolute inset-x-3 bottom-3 z-10 flex flex-wrap items-center gap-x-4 gap-y-1 px-3 py-1.5 text-[11px]')}>
            <Chip kind="real" className="text-white!">{ar ? `صور Sentinel-2 حقيقية · آب ${year === 'before' ? img.beforeYear : img.afterYear}` : `Real Sentinel-2 · Aug ${year === 'before' ? img.beforeYear : img.afterYear}`}</Chip>
            <Chip kind="illustrative" className="text-[#8fd3ff]!">{ar ? 'المسار توضيحي' : 'Route illustrative'}</Chip>
            <Chip kind="synthetic" className="text-white/80!">{ar ? 'البلاغات اصطناعية' : 'Reports synthetic'}</Chip>
            <span className="text-white/65">{ar ? 'الموقع المرشّح يستحق الفحص فقط، ولا يعني وجود مخالفة.' : 'A candidate site is only worth a visit; it does not mean a violation.'}</span>
            <span className="ms-auto font-mono text-white/65" dir="ltr">{cursor ? `${cursor[1].toFixed(5)}° N  ${cursor[0].toFixed(5)}° E` : '—'}</span>
          </div>

          {toast && (
            <div role="status" aria-live="polite" key={toast.id} className="absolute inset-x-0 top-3 z-30 mx-auto flex w-fit max-w-[60%] items-center gap-2 rounded-full border border-white/15 bg-navy-900/90 px-4 py-2 text-[13px] font-medium text-white shadow-[0_8px_24px_rgb(1_28_71/0.3)] backdrop-blur-md">
              <span className="grid size-5 place-items-center rounded-full bg-signal-500 text-[11px]" aria-hidden>✓</span>
              <span className="truncate">{toast.text}</span>
            </div>
          )}

          {/* Presentation bar */}
          {demo !== null && (
            <div className="absolute inset-x-3 bottom-[calc(var(--mb-foot,52px)_+_40px)] z-20 overflow-hidden rounded-[12px] border border-hair bg-card shadow-[0_12px_40px_rgb(1_28_71/0.22)] md:inset-x-auto md:end-3 md:w-[500px]">
              <div className="flex items-center gap-1 border-b border-hair px-3 py-2.5" dir="ltr">
                {STEPS.map((_, i) => (
                  <button key={i} type="button" onClick={() => setDemo(i)} className={clsx('h-1.5 flex-1 rounded-full', i <= demo ? 'bg-signal-600' : 'bg-hair')} aria-label={`${i + 1}`} />
                ))}
                <button type="button" onClick={closeDemo} className="ms-2 grid size-6 place-items-center text-muted hover:text-navy-900" aria-label={ar ? 'إغلاق' : 'Close'}><X className="size-4" /></button>
              </div>
              <div className="px-4 py-3">
                <p className="font-mono text-[11px] text-muted" dir="ltr" data-num="">{String(demo + 1).padStart(2, '0')} / 07</p>
                <p className="mt-1 font-display text-[20px] leading-snug text-navy-900">{t(STEPS[demo].title)}</p>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{t(STEPS[demo].body)}</p>
                <div className="mt-3 flex gap-2">
                  <button type="button" disabled={demo === 0} onClick={() => setDemo(Math.max(0, demo - 1))} className="h-9 rounded-[8px] border border-hair-2 px-3 text-[13px] text-navy-900 disabled:opacity-40">{ar ? 'السابق' : 'Back'}</button>
                  {demo < STEPS.length - 1 ? (
                    <button type="button" onClick={() => setDemo(demo + 1)} aria-keyshortcuts="PageDown" title={ar ? 'أو PageDown / زر جهاز العرض' : 'or PageDown / the clicker'} className="h-9 flex-1 rounded-[8px] bg-navy-900 text-[13.5px] font-semibold text-white hover:bg-navy-700">{ar ? 'الخطوة التالية' : 'Next step'}</button>
                  ) : (
                    <button type="button" onClick={closeDemo} className="h-9 flex-1 rounded-[8px] bg-signal-600 text-[13.5px] font-semibold text-white">{ar ? 'انتهى العرض' : 'Done'}</button>
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
