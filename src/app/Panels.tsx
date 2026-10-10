import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, ArrowRight, Mic, Type, Camera, Sparkles } from 'lucide-react'
import { BeforeAfter } from '../components/BeforeAfter'
import { FieldsTable, ReportHighlighter } from '../components/Extraction'
import { Chip, StatusPill } from '../components/ui'
import { useLang, type Text } from '../i18n/lang'
import { hhmm, useStore, type Site, type Report, type MapEdit } from '../lib/store'
import { OUTCOME_LABEL, type Outcome } from '../lib/extract/rules'
import { AI_ERROR, aiStatus, extractAI, type AiStatus } from '../lib/extract/ai'
import { download, editsToGeoJSON, toPalestineGrid } from '../lib/export'

export const SITE_STATUS: Record<Site['status'], { label: Text; tone: 'candidate' | 'neutral' | 'leak' | 'licensed' | 'nothing'; dashed?: boolean }> = {
  new: { label: { ar: 'يستحق الفحص', en: 'Worth inspecting' }, tone: 'candidate', dashed: true },
  dispatched: { label: { ar: 'أُرسل فريق', en: 'Crew sent' }, tone: 'neutral' },
  visited: { label: { ar: 'زاره الفريق', en: 'Visited' }, tone: 'leak' },
  licensed: { label: { ar: 'استخدام مرخّص', en: 'Licensed use' }, tone: 'licensed', dashed: true },
  dismissed: { label: { ar: 'تم التجاهل', en: 'Dismissed' }, tone: 'nothing' },
}

const WC_LABEL: Record<string, Text> = {
  bare: { ar: 'أرض جرداء', en: 'Bare' },
  grass: { ar: 'عشب', en: 'Grassland' },
  shrub: { ar: 'شجيرات', en: 'Shrubland' },
  tree: { ar: 'أشجار', en: 'Trees' },
  cropland: { ar: 'أرض زراعية', en: 'Cropland' },
  built: { ar: 'عمران', en: 'Built-up' },
  water: { ar: 'ماء', en: 'Water' },
}

function Back({ onClick }: { onClick: () => void }) {
  const { dir, lang } = useLang()
  const Icon = dir === 'rtl' ? ArrowRight : ArrowLeft
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 font-mono text-[11.5px] text-navy-900 hover:underline">
      <Icon className="size-3.5" aria-hidden />
      {lang === 'ar' ? 'رجوع' : 'Back'}
    </button>
  )
}

/* ------------------------------ Sites ------------------------------ */

function NdviSpark({ series, firstYear }: { series: Record<string, number | null>; firstYear: number | null }) {
  const { lang } = useLang()
  const yrs = Object.keys(series).sort()
  if (yrs.length < 2) return <p className="text-[12.5px] text-ink-soft">{lang === 'ar' ? 'لا سلسلة سنوية لهذه المنطقة بعد.' : 'No yearly series for this area yet.'}</p>
  const vals = yrs.map((y) => series[y])
  const max = Math.max(0.4, ...vals.map((v) => v ?? 0))
  const W = 300, H = 90, P = 6
  const x = (i: number) => P + (i / (yrs.length - 1)) * (W - P * 2)
  const y = (v: number) => H - P - (v / max) * (H - P * 2)
  const base = vals.find((v) => v != null) ?? 0
  const thr = base + 0.18
  const pts = vals.map((v, i) => (v == null ? null : `${x(i)},${y(v)}`)).filter(Boolean).join(' ')
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H + 18}`} className="w-full" role="img" aria-label="NDVI">
        <line x1={P} x2={W - P} y1={y(thr)} y2={y(thr)} stroke="#f5a524" strokeDasharray="4 3" />
        <text x={W - P} y={y(thr) - 4} textAnchor="end" fontSize="9" fill="#8f5300" fontFamily="IBM Plex Mono">+0.18</text>
        <polyline points={pts} fill="none" stroke="#011c47" strokeWidth="1.8" />
        {vals.map((v, i) => (v == null ? null : <rect key={i} x={x(i) - 2.5} y={y(v) - 2.5} width="5" height="5" fill={firstYear && Number(yrs[i]) >= firstYear ? '#1a6ff0' : '#011c47'} />))}
        {yrs.map((yr, i) => (i % 3 === 0 || i === yrs.length - 1 ? <text key={yr} x={x(i)} y={H + 14} textAnchor="middle" fontSize="9" fill="#6d7183" fontFamily="IBM Plex Mono">{yr}</text> : null))}
      </svg>
      <figcaption className="mt-1 text-[11.5px] text-ink-soft">{lang === 'ar' ? 'متوسط NDVI للرقعة في آب من كل سنة (مركّبات Sentinel-2). الخط المتقطّع = عتبة التغيّر.' : 'Patch mean NDVI each August (Sentinel-2 composites). Dashed line = change threshold.'}</figcaption>
    </figure>
  )
}

function FormulaBars({ parts }: { parts: Site['parts'] }) {
  const { lang } = useLang()
  const rows: { k: keyof Site['parts']; w: number; label: Text }[] = [
    { k: 'near_line', w: 0.3, label: { ar: 'القرب من الخط', en: 'Near the line' } },
    { k: 'isolation', w: 0.25, label: { ar: 'العزلة', en: 'Isolation' } },
    { k: 'gain', w: 0.2, label: { ar: 'شدة التغيّر', en: 'Change' } },
    { k: 'persistence', w: 0.15, label: { ar: 'الاستمرار 2024–26', en: 'Persistence 2024–26' } },
    { k: 'small', w: 0.1, label: { ar: 'صِغر الحجم', en: 'Small size' } },
  ]
  return (
    <table className="w-full text-[12px]">
      <tbody>
        {rows.map((r) => {
          const v = parts[r.k] as number
          return (
            <tr key={r.k} className="border-b border-hair last:border-0">
              <td className="py-1.5 pe-2 text-ink-2">{lang === 'ar' ? r.label.ar : r.label.en}</td>
              <td className="w-[45%] py-1.5">
                <span className="relative block h-2 bg-navy-900/10" dir="ltr">
                  <span className="absolute inset-y-0 left-0 bg-navy-900" style={{ width: `${v * 100}%` }} />
                </span>
              </td>
              <td className="num py-1.5 ps-2 text-end font-mono text-ink-soft" dir="ltr">{r.w.toFixed(2)}×{v.toFixed(2)}</td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}

export function SiteList({ aoi, selected, onSelect }: { aoi: string; selected: string | null; onSelect: (id: string) => void }) {
  const { lang, t, n } = useLang()
  const { sites } = useStore()
  const [filter, setFilter] = useState<'open' | 'all'>('open')
  const list = sites.filter((s) => s.aoi === aoi && (filter === 'all' || s.status === 'new' || s.status === 'dispatched' || s.status === 'visited'))
  return (
    <div>
      <div className="flex items-center justify-between border-b border-hair px-5 py-3">
        <p className="text-[13px] text-ink-2">
          {lang === 'ar' ? 'مرتّبة بصيغة معلنة' : 'Ranked by a published formula'} · <span className="num font-mono">{list.length}</span>
        </p>
        <div className="flex rounded-full bg-canvas p-0.5 text-[12px] ring-1 ring-hair">
          {(['open', 'all'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFilter(f)} className={clsx('rounded-full px-3 py-1 font-semibold transition-colors', filter === f ? 'bg-navy-900 text-white shadow-sm' : 'text-ink-soft hover:text-navy-900')}>
              {f === 'open' ? (lang === 'ar' ? 'المفتوحة' : 'Open') : lang === 'ar' ? 'الكل' : 'All'}
            </button>
          ))}
        </div>
      </div>
      <ol>
        {list.map((s) => {
          const st = SITE_STATUS[s.status]
          return (
            <li key={s.id}>
              <button type="button" onClick={() => onSelect(s.id)} className={clsx('relative grid w-full grid-cols-[2rem_1fr_auto] items-center gap-3 border-b border-hair/70 px-5 py-3.5 text-start transition-colors', selected === s.id ? 'bg-signal-50/70' : 'hover:bg-canvas')}>
                {selected === s.id && <span className="absolute inset-y-2 start-0 w-[3px] rounded-full bg-signal-500" aria-hidden />}
                <span className={clsx('grid size-8 place-items-center rounded-full text-[12.5px] font-bold', s.status === 'new' ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-navy-950 shadow-[0_4px_10px_-4px_rgb(217_138_0/0.8)]' : 'border border-hair-2 bg-white text-navy-900')} dir="ltr">{s.rank}</span>
                <span className="min-w-0">
                  <span className="flex items-baseline gap-2">
                    <span className="font-mono text-[12.5px] font-semibold text-navy-900">{s.id}</span>
                    <span className="num text-[12px] text-ink-soft" dir="ltr">{n(s.area_ha, { maximumFractionDigits: 2 })} ha · {n(s.dist_line_m)} m</span>
                  </span>
                  <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-[#e9eef6]" dir="ltr">
                    <span className="block h-full rounded-full bg-gradient-to-r from-signal-600 to-signal-400" style={{ width: `${Math.min(100, s.score * 100)}%` }} />
                  </span>
                </span>
                <StatusPill tone={st.tone} dashed={st.dashed}>{t(st.label)}</StatusPill>
              </button>
            </li>
          )
        })}
      </ol>
    </div>
  )
}

export function SiteDetail({ id, onBack, onOpenReport }: { id: string; onBack: () => void; onOpenReport: (rid: string) => void }) {
  const { lang, t, n } = useLang()
  const ar = lang === 'ar'
  const { sites, reports, dispatchCrew, markLicensed, dismiss } = useStore()
  const s = sites.find((x) => x.id === id)
  const [crew, setCrew] = useState('C1')
  if (!s) return null
  const st = SITE_STATUS[s.status]
  const reps = reports.filter((r) => r.siteId === s.id)
  const reasons: string[] = []
  if (s.first_year_over_threshold) reasons.push(ar ? `جديدة منذ ${s.first_year_over_threshold}` : `new since ${s.first_year_over_threshold}`)
  if (s.persist_last3 >= 2) reasons.push(ar ? 'مستمرة في الصيفين الأخيرين' : 'persists in the last two summers')
  if (s.dist_line_m < 1000) reasons.push(ar ? `على بعد ${n(s.dist_line_m)} م من المسار` : `${n(s.dist_line_m)} m from the route`)
  if (s.isolation_m > 300) reasons.push(ar ? `معزولة ${n(s.isolation_m)} م عن غيرها` : `${n(s.isolation_m)} m from others`)
  if (s.area_ha < 3) reasons.push(ar ? 'صغيرة' : 'small')

  // Confidence ladder (no percentages): tied to an action, as in PAIR / Global Nature Watch.
  const priority: { label: Text; note: Text } =
    s.persist_last3 >= 2 && s.dist_line_m < 1000
      ? { label: { ar: 'افحص أولًا', en: 'Inspect first' }, note: { ar: 'استمرت الإشارة صيفين على الأقل، وقريبة من المسار', en: 'Signal held for two or more summers, close to the route' } }
      : s.first_year_over_threshold && s.dist_line_m < 2000
        ? { label: { ar: 'افحص', en: 'Inspect' }, note: { ar: 'إشارة جديدة قرب المسار', en: 'A new signal near the route' } }
        : { label: { ar: 'راقب', en: 'Watch' }, note: { ar: 'إشارة واحدة أو بعيدة؛ ننتظر صيفًا آخر', en: 'One season or far away; wait for another summer' } }
  const alternatives: Text[] = [
    { ar: 'مزرعة أو حديقة جديدة مرخّصة — تُقارَن بقائمة الاستخدامات المرخّصة لدى المرفق', en: 'A new licensed farm or garden — checked against the utility’s licensed-use list' },
    { ar: 'طفح صرف صحي أو مياه رمادية', en: 'A sewage or grey-water overflow' },
  ]
  if (s.worldcover_2021 === 'built') alternatives.push({ ar: 'سقاية داخل تجمّع سكني', en: 'Watering inside a settlement' })
  if (s.gain < 0.25) alternatives.push({ ar: 'نبات بعد مطر نادر — نتحقق من مطر الشهر نفسه (CHIRPS)', en: 'Plants after rare rain — we check that month’s rainfall (CHIRPS)' })

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between border-b border-hair px-5 py-3">
        <Back onClick={onBack} />
        <StatusPill tone={st.tone} dashed={st.dashed}>{t(st.label)}</StatusPill>
      </div>
      <div className="px-5 pt-5">
        <p className="font-mono text-[11px] text-ink-soft">{ar ? 'بطاقة دليل' : 'Evidence card'} · #{s.rank}</p>
        <h2 className="mt-1 font-display text-[30px] font-medium leading-none text-navy-900" dir="ltr" data-num="">{s.id}</h2>
        <p className="mt-3 text-[14px] leading-relaxed text-navy-900">
          {ar ? 'يستحق الفحص، لأن: ' : 'Worth inspecting, because: '}
          <span className="text-ink-2">{reasons.join(ar ? '، ' : ', ')}.</span>
        </p>
        <p className="mt-2 flex items-center gap-2 text-[12.5px]">
          <span className="border border-navy-900 bg-navy-900 px-2 py-0.5 font-semibold text-white">{t(priority.label)}</span>
          <span className="text-ink-soft">{t(priority.note)}</span>
        </p>

        <div className="mt-4 border border-hair-2">
          <BeforeAfter
            aspect={1}
            initial={0.5}
            intro={false}
            stepY={0.44}
            pixelated
            before={{ src: `./${s.crop.before}`, alt: '', label: `${ar ? 'آب' : 'Aug'} ${s.crop.before_date.slice(0, 4)}` }}
            after={{ src: `./${s.crop.after}`, alt: '', label: `${ar ? 'آب' : 'Aug'} ${s.crop.after_date.slice(0, 4)}` }}
          >
            <span className="pointer-events-none absolute left-1/2 top-1/2 size-12 -translate-x-1/2 -translate-y-1/2 border-2 border-dashed border-candidate" aria-hidden />
          </BeforeAfter>
          <p className="border-t border-hair-2 px-3 py-1.5 font-mono text-[10.5px] text-ink-soft" dir="ltr">Sentinel-2 L2A · 800 × 800 m · 10 m/px</p>
        </div>

        <dl className="mt-5 grid grid-cols-2 border-t border-hair text-[13px]">
          {[
            [ar ? 'المساحة' : 'Area', `${n(s.area_ha, { maximumFractionDigits: 2 })} ha`],
            [ar ? 'أول سنة فوق العتبة' : 'First year over threshold', s.first_year_over_threshold ? String(s.first_year_over_threshold) : '—'],
            [ar ? 'المسافة إلى المسار (توضيحي)' : 'To route (illustrative)', `${n(s.dist_line_m)} m`],
            [ar ? 'العزلة' : 'Isolation', `${n(s.isolation_m)} m`],
            ['NDVI 2017 → ' + s.crop.after_date.slice(0, 4), `${s.ndvi_first.toFixed(2)} → ${s.ndvi_last.toFixed(2)}`],
            [ar ? 'الغطاء الأرضي 2021' : 'Land cover 2021', t(WC_LABEL[s.worldcover_2021] ?? { ar: s.worldcover_2021, en: s.worldcover_2021 })],
          ].map(([k, v], i) => (
            <div key={i} className={clsx('border-b border-hair py-2', i % 2 === 1 && 'border-s border-hair ps-3')}>
              <dt className="text-[11.5px] text-ink-soft">{k}</dt>
              <dd className={clsx('num mt-0.5 text-[13px] font-semibold text-navy-900', i === 5 ? 'font-sans' : 'font-mono')} dir={i === 5 ? undefined : 'ltr'} data-num="">{v}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-5">
          <NdviSpark series={s.ndvi_by_year as Record<string, number | null>} firstYear={s.first_year_over_threshold} />
        </div>

        <div className="mt-5">
          <p className="mb-1 font-mono text-[11px] text-ink-soft">{ar ? 'لماذا هذا الترتيب' : 'Why this rank'} · <span dir="ltr">{s.score.toFixed(2)}</span></p>
          <FormulaBars parts={s.parts} />
        </div>

        <div className="mt-5 border-t border-hair pt-3">
          <p className="font-mono text-[11px] text-ink-soft">{ar ? 'تفسيرات أخرى محتملة — يتحقق منها الفريق' : 'Other possible explanations — the crew checks them'}</p>
          <ul className="mt-2 grid gap-1.5 text-[13px] text-ink">
            {alternatives.map((a, i) => <li key={i} className="flex gap-2"><span className="text-ink-soft">—</span>{t(a)}</li>)}
          </ul>
        </div>

        {(s.status === 'new' || s.status === 'dispatched') && (
          <div className="mt-6 grid gap-2">
            <div className="flex gap-2">
              <select value={crew} onChange={(e) => setCrew(e.target.value)} className="h-10 border border-hair-2 bg-card px-2 text-[13px]" aria-label={ar ? 'الفريق' : 'Crew'}>
                {['C1', 'C2', 'C3', 'C4'].map((c) => <option key={c} value={c}>{ar ? `الفريق ${c.slice(1)}` : `Crew ${c.slice(1)}`}</option>)}
              </select>
              <button type="button" onClick={() => dispatchCrew(s.id, crew)} className="h-10 flex-1 rounded-[8px] bg-navy-900 text-[13.5px] font-semibold text-white hover:bg-navy-700">
                {s.status === 'dispatched' ? (ar ? `أُرسل ${s.crew} — إعادة الإرسال` : `Sent to ${s.crew} — resend`) : ar ? 'أرسل فريقًا' : 'Send a crew'}
              </button>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => markLicensed(s.id)} className="h-9 flex-1 rounded-[8px] border border-hair-2 text-[12.5px] font-semibold text-navy-900 hover:bg-canvas">{ar ? 'استخدام مرخّص معروف' : 'Known licensed use'}</button>
              <button type="button" onClick={() => dismiss(s.id)} className="h-9 rounded-[8px] border border-hair-2 px-3 text-[12.5px] text-ink-2 hover:bg-canvas">{ar ? 'تجاهل' : 'Dismiss'}</button>
            </div>
          </div>
        )}

        {reps.length > 0 && (
          <div className="mt-6 border-t border-hair pt-3">
            <p className="font-mono text-[11px] text-ink-soft">{ar ? 'بلاغات هذا الموقع' : 'Reports for this site'}</p>
            {reps.map((r) => (
              <button key={r.id} type="button" onClick={() => onOpenReport(r.id)} className="mt-2 block w-full border border-hair p-3 text-start text-[13px] hover:bg-canvas">
                <span className="font-mono text-[11px] text-ink-soft">{r.id} · {r.crew} · {hhmm(r.receivedAt)}</span>
                <span className="mt-1 line-clamp-2 block text-navy-900" lang="ar" dir="rtl">{r.text}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

/* ------------------------------ Reports ------------------------------ */

const CHANNEL_ICON = { voice: Mic, text: Type, photo: Camera }

export function ReportList({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const { lang, t } = useLang()
  const { reports } = useStore()
  if (!reports.length) return <p className="px-5 py-8 text-[14px] text-ink-soft">{lang === 'ar' ? 'لا بلاغات بعد. أرسل فريقًا إلى موقع، أو افتح تطبيق الفريق.' : 'No reports yet. Send a crew to a site, or open the crew app.'}</p>
  return (
    <ol>
      {reports.map((r) => {
        const Icon = CHANNEL_ICON[r.channel]
        return (
          <li key={r.id}>
            <button type="button" onClick={() => onSelect(r.id)} className={clsx('block w-full border-b border-hair px-5 py-3.5 text-start transition-colors', selected === r.id ? 'bg-signal-50' : 'hover:bg-canvas')}>
              <span className="flex items-center gap-2 font-mono text-[11px] text-ink-soft">
                <Icon className="size-3.5" aria-hidden />
                {r.id} · {r.crew} · {hhmm(r.receivedAt)} {r.siteId && `· ${r.siteId}`}
                <span className="ms-auto">{r.status === 'confirmed' ? <StatusPill tone="verified">{lang === 'ar' ? 'مؤكّد' : 'Confirmed'}</StatusPill> : <StatusPill tone="neutral" dashed>{lang === 'ar' ? 'غير مؤكّد' : 'Unconfirmed'}</StatusPill>}</span>
              </span>
              <span className="mt-1.5 line-clamp-2 block text-[14px] leading-relaxed text-navy-900" lang="ar" dir="rtl">{r.text}</span>
              {r.extraction.outcome && <span className="mt-1 block text-[12px] text-ink-2">→ {t(r.extraction.outcome.label)}</span>}
            </button>
          </li>
        )
      })}
    </ol>
  )
}

export function ReportDetail({ id, onBack, onOpenEdit }: { id: string; onBack: () => void; onOpenEdit: (eid: string) => void }) {
  const { lang, t } = useLang()
  const ar = lang === 'ar'
  const { reports, edits, setExtraction, confirmReport, createEdit } = useStore()
  const r = reports.find((x) => x.id === id)
  const [active, setActive] = useState<string | null>(null)
  const [ai, setAi] = useState<AiStatus | null>(null)
  const [busy, setBusy] = useState(false)
  const [aiError, setAiError] = useState<string | null>(null)
  const [outcome, setOutcome] = useState<Outcome | ''>('')

  useEffect(() => { aiStatus().then(setAi) }, [])
  useEffect(() => { if (r) setOutcome(r.confirmedOutcome ?? r.extraction.outcome?.value ?? '') }, [r?.id, r?.extraction, r])

  const edit = useMemo(() => edits.find((e) => e.reportId === id), [edits, id])
  if (!r) return null
  const canDraft = (r.status === 'confirmed' && (r.confirmedOutcome === 'illegal_connection' || !!r.extraction.missingFromMap)) && !edit

  const runAI = async () => {
    setBusy(true)
    setAiError(null)
    const res = await extractAI(r.text)
    setBusy(false)
    if (res.ok) setExtraction(r.id, res.extraction, 'claude')
    else setAiError(res.error)
  }

  return (
    <div className="pb-6">
      <div className="flex items-center justify-between border-b border-hair px-5 py-3">
        <Back onClick={onBack} />
        <span className="font-mono text-[11px] text-ink-soft">{r.id} · {r.crew} · {hhmm(r.receivedAt)}</span>
      </div>
      <div className="px-5 pt-5">
        <div className="flex flex-wrap items-center gap-3">
          {r.synthetic && <Chip kind="synthetic">{ar ? 'بلاغ اصطناعي للعرض' : 'Synthetic demo report'}</Chip>}
          <Chip kind={r.engine === 'claude' ? 'ai' : 'rules'}>{r.engine === 'claude' ? (ar ? 'استخراج: Claude' : 'Extraction: Claude') : ar ? 'استخراج: قواعد' : 'Extraction: rules'}</Chip>
        </div>
        <div className="mt-4 border border-hair bg-canvas px-4 py-3">
          <ReportHighlighter text={r.text} extraction={r.extraction} active={active} onHover={setActive} className="font-display !text-[22px] !leading-[1.85] text-navy-900" />
        </div>
        {r.photo && <img src={r.photo} alt={ar ? 'صورة من الفريق' : 'Crew photo'} className="mt-3 max-h-44 border border-hair object-cover" />}

        <div className="mt-4">
          <FieldsTable extraction={r.extraction} active={active} onHover={setActive} />
          {r.extraction.warnings.map((w, i) => <p key={i} className="border-t border-hair py-2 text-[12.5px] text-candidate-ink">{t(w)}</p>)}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button type="button" disabled={!ai?.available || busy || r.status === 'confirmed'} onClick={runAI} className="inline-flex h-9 items-center gap-1.5 rounded-[8px] border border-signal-600 px-3 text-[12.5px] font-semibold text-signal-700 hover:bg-signal-50 disabled:cursor-not-allowed disabled:opacity-50" title={ai?.available ? ai.model : ai?.reason}>
            <Sparkles className="size-3.5" aria-hidden />
            {busy ? (ar ? 'جارٍ الاستخراج…' : 'Extracting…') : ar ? 'أعد الاستخراج بالذكاء الاصطناعي' : 'Re-extract with AI'}
          </button>
          {!ai?.available && ai && <span className="text-[11.5px] text-ink-soft">{ar ? 'الذكاء الاصطناعي غير مفعّل على هذا الجهاز (لا مفتاح API)؛ نعرض محرّك القواعد.' : 'AI is not configured on this machine (no API key); showing the rules engine.'}</span>}
          {aiError && <span role="status" className="text-[11.5px] text-candidate-ink">{t(AI_ERROR[aiError] ?? { ar: `تعذّر الاستخراج (${aiError})؛ أبقينا نتيجة القواعد.`, en: `Extraction failed (${aiError}); the rules result is kept.` })}</span>}
        </div>

        {r.status === 'unconfirmed' ? (
          <div className="mt-6 grid gap-2 border-t border-hair pt-4">
            <label className="text-[12px] text-ink-soft" htmlFor="oc">{ar ? 'النتيجة كما يعتمدها المهندس' : 'Outcome as confirmed by the engineer'}</label>
            <div className="flex gap-2">
              <select id="oc" value={outcome} onChange={(e) => setOutcome(e.target.value as Outcome | '')} className="h-10 flex-1 border border-hair-2 bg-card px-2 text-[13px]">
                <option value="">{ar ? '— غير محدّدة —' : '— not set —'}</option>
                {(Object.keys(OUTCOME_LABEL) as Outcome[]).map((o) => <option key={o} value={o}>{t(OUTCOME_LABEL[o])}</option>)}
              </select>
              <button type="button" onClick={() => confirmReport(r.id, outcome || null)} className="h-10 rounded-[8px] bg-navy-900 px-4 text-[13.5px] font-semibold text-white hover:bg-navy-700">{ar ? 'تأكيد الحقول' : 'Confirm fields'}</button>
            </div>
          </div>
        ) : (
          <div className="mt-6 border-t border-hair pt-4 text-[13px] text-navy-900">
            <StatusPill tone="verified">{ar ? 'مؤكّد' : 'Confirmed'}</StatusPill>
            <span className="ms-2">{r.confirmedOutcome ? t(OUTCOME_LABEL[r.confirmedOutcome]) : ''}</span>
          </div>
        )}

        {canDraft && (
          <button type="button" onClick={() => createEdit(r.id)} className="mt-3 h-10 w-full rounded-[8px] border border-dashed border-signal-600 text-[13.5px] font-semibold text-signal-700 hover:bg-signal-50">
            {ar ? 'أنشئ مسودة تعديل على الخريطة (wMain)' : 'Draft a map edit (wMain)'}
          </button>
        )}
        {edit && (
          <button type="button" onClick={() => onOpenEdit(edit.id)} className="mt-3 block w-full border border-hair p-3 text-start text-[13px] hover:bg-canvas">
            <span className="font-mono text-[11px] text-ink-soft">{edit.id}</span> · {edit.status === 'draft' ? (ar ? 'مسودة قيد الفحص' : 'Draft, under check') : ar ? 'معتمد' : 'Approved'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------ Edits ------------------------------ */

const MATERIALS = ['PE', 'HDPE', 'PVC', 'GP', 'SP', 'DIP', 'CAS', 'AC']

export function EditList({ selected, onSelect }: { selected: string | null; onSelect: (id: string) => void }) {
  const { lang } = useLang()
  const { edits } = useStore()
  if (!edits.length) return <p className="px-5 py-8 text-[14px] text-ink-soft">{lang === 'ar' ? 'لا تعديلات بعد. تُنشأ من بلاغ مؤكّد عن وصلة غير مرسومة.' : 'No edits yet. They are drafted from a confirmed report of an unmapped connection.'}</p>
  return (
    <ol>
      {edits.map((e) => (
        <li key={e.id}>
          <button type="button" onClick={() => onSelect(e.id)} className={clsx('flex w-full items-center gap-3 border-b border-hair px-5 py-3.5 text-start', selected === e.id ? 'bg-signal-50' : 'hover:bg-canvas')}>
            <svg width="36" height="10" aria-hidden><line x1="0" y1="5" x2="36" y2="5" stroke={e.status === 'draft' ? '#6f4bd8' : e.status === 'rejected' ? '#9aa0ad' : '#011c47'} strokeWidth="3" strokeDasharray={e.status === 'draft' ? '5 4' : undefined} /></svg>
            <span className="font-mono text-[12.5px] font-semibold text-navy-900">{e.id}</span>
            <span className="text-[12px] text-ink-soft">{e.siteId}</span>
            <span className="ms-auto">{e.status === 'draft' ? <StatusPill tone="neutral" dashed>{lang === 'ar' ? 'قيد الفحص' : 'Under check'}</StatusPill> : e.status === 'rejected' ? <StatusPill tone="nothing">{lang === 'ar' ? 'مرفوض' : 'Rejected'}</StatusPill> : <StatusPill tone="verified">{e.status === 'exported' ? (lang === 'ar' ? 'مُصدَّر' : 'Exported') : lang === 'ar' ? 'معتمد' : 'Approved'}</StatusPill>}</span>
          </button>
        </li>
      ))}
    </ol>
  )
}

export function EditDetail({ id, onBack }: { id: string; onBack: () => void }) {
  const { lang } = useLang()
  const ar = lang === 'ar'
  const { edits, approveEdit, rejectEdit, exportEdit } = useStore()
  const e = edits.find((x) => x.id === id) as MapEdit | undefined
  const [mat, setMat] = useState<string>('')
  useEffect(() => { if (e) setMat(e.attrs.MATERIAL ?? e.candidates[0] ?? '') }, [e?.id, e])
  if (!e) return null
  const draft = e.status === 'draft'
  const first = toPalestineGrid(e.geometry[0])
  const rows: [string, string, string][] = [
    ['MATERIAL', draft ? (e.attrs.MATERIAL ?? '—') : e.attrs.MATERIAL ?? '—', draft && !e.attrs.MATERIAL ? (ar ? `مرشّحات: ${e.candidates.join(' / ') || '—'}` : `candidates: ${e.candidates.join(' / ') || '—'}`) : ''],
    ['WP_MAT_TXT_S', e.attrs.WP_MAT_TXT_S ?? '—', ar ? 'كلمة الطاقم' : "crew's word"],
    ['DIAMETER', e.attrs.DIAMETER != null ? String(e.attrs.DIAMETER) : '—', 'mm'],
    ['CIP_WP_TYPE', String(e.attrs.CIP_WP_TYPE), ar ? 'وصلة منزلية' : 'House connection'],
    ['OWNEDBY', String(e.attrs.OWNEDBY), ar ? 'خاص' : 'Private'],
    ['WP_COND', String(e.attrs.WP_COND), e.attrs.WP_COND === 4 ? (ar ? 'قيد الفحص' : 'Under check') : ar ? 'جيد' : 'Good'],
    ['WP_STATUS', e.attrs.WP_STATUS != null ? String(e.attrs.WP_STATUS) : '—', e.attrs.WP_STATUS ? (ar ? 'قائم ومفعّل' : 'Existing, active') : ar ? 'فارغ في المسودة' : 'empty in draft'],
    ['ORDER_ID', e.attrs.ORDER_ID, ''],
  ]
  return (
    <div className="pb-6">
      <div className="flex items-center justify-between border-b border-hair px-5 py-3">
        <Back onClick={onBack} />
        <span className="font-mono text-[11px] text-ink-soft">{e.id} · wMain</span>
      </div>
      <div className="px-5 pt-5">
        <p className="text-[14px] leading-relaxed text-navy-900">
          {draft
            ? ar ? 'مسودة متقطّعة على الخريطة، حالتها «قيد الفحص» (WP_COND = 4). لا تُحتسب ولا تُصدَّر قبل اعتماد مهندس.' : 'A dashed draft on the map, “under check” (WP_COND = 4). It does not count and cannot be exported until an engineer approves it.'
            : ar ? 'معتمدة: صارت متصلة على الخريطة وجاهزة للتصدير بصيغة مياهنا.' : 'Approved: now solid on the map and ready to export in Miyahuna’s format.'}
        </p>
        <table className="mt-4 w-full border-t border-hair-2 text-[12.5px]">
          <tbody>
            {rows.map(([k, v, note]) => (
              <tr key={k} className="border-b border-hair">
                <td className="py-1.5 pe-2 font-mono text-[11px] text-ink-2" dir="ltr">{k}</td>
                <td className={clsx('py-1.5 font-semibold text-navy-900', k === 'WP_MAT_TXT_S' ? 'font-sans' : 'font-mono')} dir={k === 'WP_MAT_TXT_S' ? 'rtl' : 'ltr'}>{v}</td>
                <td className="py-1.5 ps-2 text-ink-soft">{note}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 font-mono text-[10.5px] text-ink-soft" dir="ltr">EPSG:28191 · start {first[0].toFixed(1)}, {first[1].toFixed(1)}</p>

        {draft && (
          <div className="mt-5 grid gap-2 border-t border-hair pt-4">
            <label className="text-[12px] text-ink-soft" htmlFor="mat">{ar ? 'المادة (يحدّدها المهندس)' : 'Material (set by the engineer)'}</label>
            <div className="flex gap-2">
              <select id="mat" value={mat} onChange={(ev) => setMat(ev.target.value)} className="h-10 w-28 border border-hair-2 bg-card px-2 font-mono text-[13px]">
                {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
              <button type="button" onClick={() => approveEdit(e.id, mat || null)} className="h-10 flex-1 rounded-[8px] bg-navy-900 text-[13.5px] font-semibold text-white hover:bg-navy-700">{ar ? 'اعتماد التعديل' : 'Approve edit'}</button>
              <button type="button" onClick={() => rejectEdit(e.id)} className="h-10 rounded-[8px] border border-hair-2 px-3 text-[13px] text-navy-900 hover:bg-canvas">{ar ? 'رفض' : 'Reject'}</button>
            </div>
          </div>
        )}
        {(e.status === 'approved' || e.status === 'exported') && (
          <button
            type="button"
            onClick={() => {
              download(`wMain_${e.id}_EPSG28191.geojson`, JSON.stringify(editsToGeoJSON([e]), null, 2))
              exportEdit(e.id)
            }}
            className="mt-5 h-11 w-full rounded-[8px] bg-verified text-[14px] font-semibold text-white hover:brightness-95"
          >
            {ar ? 'تصدير بصيغة مياهنا (GeoJSON · EPSG:28191)' : 'Export in Miyahuna’s format (GeoJSON · EPSG:28191)'}
          </button>
        )}
      </div>
    </div>
  )
}

/* ------------------------------ Audit ------------------------------ */

export function AuditPanel() {
  const { lang } = useLang()
  const { audit } = useStore()
  return (
    <div>
      <p className="border-b border-hair px-5 py-3 text-[13px] text-ink-2">{lang === 'ar' ? 'سجل يُضاف إليه ولا يُحذف منه. كل حدث بوقته وصاحبه.' : 'Append-only. Every event with its time and actor.'}</p>
      <ol>
        {[...audit].reverse().map((a) => (
          <li key={a.id} className="grid grid-cols-[3rem_3.5rem_1fr] gap-2 border-b border-hair px-5 py-2.5 text-[12.5px]">
            <span className="num font-mono text-ink-soft" dir="ltr">{hhmm(a.at)}</span>
            <span className="font-mono text-[11.5px] text-navy-900" dir="ltr">{a.actor}</span>
            <span className="text-ink"><span className="font-mono text-[11px] text-ink-soft">{a.target}</span> {a.detail}</span>
          </li>
        ))}
      </ol>
    </div>
  )
}

export type { Report }
