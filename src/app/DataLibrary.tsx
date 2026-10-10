import clsx from 'clsx'
import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'
import { CircleAlert, Database, ExternalLink, FileCheck2, HardDrive, Newspaper, Search } from 'lucide-react'
import { useLang, type Text } from '../i18n/lang'
import { Card, Page } from './AppShell'
import { Meter } from './charts'
import { DASH, GOV_AR, STATUS_LABEL, bytes, loadLibrary, type EventRow, type Library } from './dash'

type Tab = 'sources' | 'facts' | 'events'
const PAGE = 40

const VERDICT: Record<string, Text> = {
  pass: { ar: 'اجتاز التحقق', en: 'Passed review' },
  'pass-with-corrections': { ar: 'اجتاز مع تصحيحات', en: 'Passed with corrections' },
}

const STATUS_TONE: Record<string, string> = {
  confirmed: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  partially: 'bg-amber-50 text-amber-800 border-amber-200',
  partial: 'bg-amber-50 text-amber-800 border-amber-200',
  corrected: 'bg-signal-50 text-signal-700 border-signal-200',
  unverified: 'bg-canvas text-ink-soft border-hair-2',
  downloaded: 'bg-emerald-50 text-emerald-800 border-emerald-200',
}

function Pill({ status }: { status: string }) {
  const { t } = useLang()
  const key = (status || '').toLowerCase()
  return <span className={clsx('inline-block whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-medium', STATUS_TONE[key] ?? 'bg-canvas text-ink-soft border-hair-2')}>{STATUS_LABEL[key] ? t(STATUS_LABEL[key]) : status || '—'}</span>
}

export default function DataLibrary() {
  const { lang, t, n } = useLang()
  const ar = lang === 'ar'
  const [params, setParams] = useSearchParams()
  const tab = (params.get('tab') as Tab) || 'sources'
  const domain = params.get('domain') || ''
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('')
  const [page, setPage] = useState(0)
  const [lib, setLib] = useState<Library | null>(null)

  useEffect(() => { loadLibrary().then(setLib).catch(() => setLib({ sources: [], facts: [] })) }, [])
  useEffect(() => setPage(0), [tab, domain, q, status])

  const set = (k: string, v: string) => {
    const p = new URLSearchParams(params)
    if (v) p.set(k, v)
    else p.delete(k)
    setParams(p, { replace: true })
  }

  const D = DASH
  const domainName = (id: string) => {
    const d = D.domains.find((x) => x.id === id)
    return d ? (ar ? d.name_ar : d.name_en) : id
  }
  const needle = q.trim().toLowerCase()

  const sources = useMemo(() => (lib?.sources ?? []).filter((s) => (!domain || s.domain === domain) && (!status || (s.status || '').toLowerCase() === status) && (!needle || `${s.title} ${s.publisher} ${s.url} ${s.type}`.toLowerCase().includes(needle))), [lib, domain, status, needle])
  const facts = useMemo(() => (lib?.facts ?? []).filter((f) => (!domain || f.domain === domain) && (!status || (f.status || '').toLowerCase() === status) && (!needle || `${f.claim_en} ${f.claim_ar} ${f.value} ${f.publisher}`.toLowerCase().includes(needle))), [lib, domain, status, needle])
  const events = useMemo(() => {
    const all: (EventRow & { register: 'theft' | 'supply' })[] = [...D.theft.events.map((e) => ({ ...e, register: 'theft' as const })), ...D.supply.events.map((e) => ({ ...e, register: 'supply' as const }))]
    return all.filter((e) => (!status || e.register === status) && (!needle || `${e.type} ${e.gov_en} ${e.place_en} ${e.place_ar} ${e.source_name} ${e.quantity ?? ''}`.toLowerCase().includes(needle))).sort((a, b) => (b.date || '').localeCompare(a.date || ''))
  }, [D, status, needle])

  const rows = tab === 'sources' ? sources : tab === 'facts' ? facts : events
  const pages = Math.max(1, Math.ceil(rows.length / PAGE))
  const slice = rows.slice(page * PAGE, page * PAGE + PAGE)

  const statusOptions: { v: string; l: Text }[] =
    tab === 'events'
      ? [{ v: 'theft', l: { ar: 'سرقات', en: 'Theft' } }, { v: 'supply', l: { ar: 'كسور وانقطاعات', en: 'Breaks and outages' } }]
      : tab === 'facts'
        ? ['confirmed', 'partially', 'corrected', 'unverified'].map((v) => ({ v, l: STATUS_LABEL[v] }))
        : [{ v: 'downloaded', l: STATUS_LABEL.downloaded }]

  const totalBytes = D.totals.bytes_c + D.totals.bytes_d
  const typeLabel = (reg: 'theft' | 'supply', type: string) => {
    const r = (reg === 'theft' ? D.theft : D.supply).by_type.find((x) => x.type === type)
    return r ? (ar ? r.label_ar : r.label_en) : type
  }

  return (
    <Page
      title={ar ? 'مكتبة البيانات' : 'Data library'}
      subtitle={ar ? 'كل ما جمعناه عن فاقد المياه في الأردن: من أين جاء، وما الذي تحقّقنا منه، وما الذي يحتاج طلبًا رسميًا. لا مسارات خطوط حقيقية هنا؛ تلك تبقى محجوبة.' : 'Everything we collected on water loss in Jordan: where it came from, what we checked, and what needs an official request. No real pipeline routes here; those stay restricted.'}
    >
      {/* Totals */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { icon: Database, v: n(D.totals.sources), l: ar ? `مصدرًا مفهرسًا، ${n(D.totals.sources_downloaded)} منها منزَّل` : `sources catalogued, ${n(D.totals.sources_downloaded)} downloaded`, p: [D.totals.sources_downloaded, D.totals.sources] },
          { icon: FileCheck2, v: n(D.totals.facts), l: ar ? `رقمًا وادّعاءً فحصناه، ${n(D.totals.facts_confirmed)} مؤكَّدة` : `figures and claims checked, ${n(D.totals.facts_confirmed)} confirmed`, p: [D.totals.facts_confirmed, D.totals.facts] },
          { icon: Newspaper, v: n(D.totals.theft_events + D.totals.supply_events), l: ar ? `حادثة من الأخبار: ${n(D.totals.theft_events)} سرقة و${n(D.totals.supply_events)} كسر وانقطاع` : `news events: ${n(D.totals.theft_events)} thefts, ${n(D.totals.supply_events)} breaks and outages`, p: null },
          { icon: HardDrive, v: bytes(totalBytes, lang), l: ar ? `على القرصين، ${n(D.totals.files_c + D.totals.files_d)} ملفًا في ${n(D.totals.domains)} مجالًا` : `on two disks, ${n(D.totals.files_c + D.totals.files_d)} files in ${n(D.totals.domains)} domains`, p: null },
        ].map((x) => (
          <div key={x.l} className="rounded-[12px] border border-hair bg-card p-5 shadow-[0_1px_2px_rgb(1_28_71/0.04)]">
            <x.icon className="size-5 text-signal-600" aria-hidden />
            <p className="num mt-3 text-[30px] font-semibold leading-none text-navy-900" dir="ltr" data-num="">{x.v}</p>
            <p className="mt-2 text-[12.5px] leading-snug text-ink-soft">{x.l}</p>
            {x.p && <div className="mt-3"><Meter value={x.p[0]} total={x.p[1]} color="#1a6ff0" /></div>}
          </div>
        ))}
      </div>

      {/* Domains */}
      <h2 className="mb-3 mt-8 text-[17px] font-semibold text-navy-900">{ar ? `المجالات (${n(D.domains.length)})` : `Domains (${n(D.domains.length)})`}</h2>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {D.domains.map((d) => {
          const on = domain === d.id
          return (
            <article key={d.id} className={clsx('flex flex-col rounded-[12px] border bg-card p-5 shadow-[0_1px_2px_rgb(1_28_71/0.04)] transition-colors', on ? 'border-signal-500 ring-2 ring-signal-200' : 'border-hair')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="text-[15px] font-semibold text-navy-900">{ar ? d.name_ar : d.name_en}</h3>
                  <p className="text-[11.5px] text-ink-soft" lang={ar ? 'en' : 'ar'}>{ar ? d.name_en : d.name_ar}</p>
                </div>
                {d.verdict && <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-800">{VERDICT[d.verdict] ? t(VERDICT[d.verdict]) : d.verdict}</span>}
              </div>
              <p className="mt-3 text-[13px] leading-relaxed text-ink">{ar ? d.summary_ar : d.summary_en}</p>
              <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
                {[
                  { v: n(d.sources), l: ar ? 'مصدر' : 'sources' },
                  { v: n(d.facts), l: ar ? 'رقم' : 'figures' },
                  { v: bytes(d.bytes_c + d.bytes_d, lang), l: ar ? 'الحجم' : 'size' },
                ].map((x) => (
                  <div key={x.l} className="rounded-[8px] bg-canvas px-2 py-2">
                    <dd className="num font-mono text-[14px] font-semibold text-navy-900" dir="ltr">{x.v}</dd>
                    <dt className="text-[11px] text-ink-soft">{x.l}</dt>
                  </div>
                ))}
              </dl>
              {d.facts > 0 && (
                <div className="mt-3">
                  <div className="flex h-2 overflow-hidden rounded-full bg-[#e6ebf3]" aria-hidden>
                    <span style={{ width: `${(d.confirmed / d.facts) * 100}%` }} className="bg-emerald-500" />
                    <span style={{ width: `${((d.partial + d.corrected) / d.facts) * 100}%` }} className="bg-amber-400" />
                  </div>
                  <p className="mt-1.5 text-[11.5px] text-ink-soft">{ar ? `${n(d.confirmed)} مؤكَّد · ${n(d.partial + d.corrected)} جزئي أو مصحَّح · ${n(d.unverified)} غير مؤكَّد` : `${n(d.confirmed)} confirmed · ${n(d.partial + d.corrected)} partial or corrected · ${n(d.unverified)} unverified`}</p>
                </div>
              )}
              {d.findings.length > 0 && (
                <ul className="mt-4 grid gap-2 border-t border-hair pt-3">
                  {d.findings.slice(0, 3).map((f, i) => <li key={i} className="flex gap-2 text-[12.5px] leading-relaxed text-ink"><span className="mt-[7px] size-1.5 shrink-0 rounded-full bg-signal-500" aria-hidden />{ar ? f.ar : f.en}</li>)}
                </ul>
              )}
              {d.blocked.length > 0 && (
                <div className="mt-3 rounded-[8px] bg-amber-50 p-3 text-[12px] leading-relaxed text-amber-900">
                  <p className="flex items-center gap-1.5 font-semibold"><CircleAlert className="size-3.5" aria-hidden />{ar ? 'يحتاج طلبًا رسميًا' : 'Needs an official request'}</p>
                  {d.blocked.slice(0, 2).map((b, i) => <p key={i} className="mt-1">{ar ? b.ar : b.en}</p>)}
                </div>
              )}
              <button type="button" onClick={() => set('domain', on ? '' : d.id)} className={clsx('mt-4 h-9 self-start rounded-[8px] px-3 text-[12.5px] font-semibold', on ? 'bg-signal-600 text-white' : 'border border-hair-2 text-navy-900 hover:bg-canvas')}>
                {on ? (ar ? 'إلغاء التصفية' : 'Clear filter') : ar ? 'اعرض مصادره وأرقامه' : 'Show its sources and figures'}
              </button>
            </article>
          )
        })}
      </div>

      {/* Tables */}
      <Card className="mt-8" pad={false}>
        <div className="flex flex-wrap items-center gap-3 border-b border-hair px-4 py-3">
          <div className="flex rounded-[8px] bg-canvas p-1" role="tablist">
            {([
              { k: 'sources', l: { ar: 'المصادر', en: 'Sources' }, c: lib?.sources.length ?? D.totals.sources },
              { k: 'facts', l: { ar: 'الأرقام والادعاءات', en: 'Figures and claims' }, c: lib?.facts.length ?? D.totals.facts },
              { k: 'events', l: { ar: 'سجل الأحداث', en: 'Event register' }, c: D.theft.events.length + D.supply.events.length },
            ] as { k: Tab; l: Text; c: number }[]).map((x) => (
              <button key={x.k} type="button" role="tab" aria-selected={tab === x.k} onClick={() => { set('tab', x.k === 'sources' ? '' : x.k); setStatus('') }} className={clsx('rounded-[6px] px-3 py-1.5 text-[13px] font-semibold', tab === x.k ? 'bg-card text-navy-900 shadow-sm' : 'text-ink-soft hover:text-navy-900')}>
                {t(x.l)} <span className="num font-mono text-[11px] text-ink-soft" dir="ltr">{n(x.c)}</span>
              </button>
            ))}
          </div>
          <label className="relative ms-auto min-w-[200px] flex-1 sm:max-w-[320px]">
            <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-ink-soft" aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder={ar ? 'ابحث…' : 'Search…'} aria-label={ar ? 'بحث' : 'Search'} className="h-9 w-full rounded-[8px] border border-hair-2 bg-card ps-9 pe-3 text-[13px] text-navy-900 focus:border-signal-500 focus:outline-none" />
          </label>
          {tab !== 'events' && (
            <select value={domain} onChange={(e) => set('domain', e.target.value)} aria-label={ar ? 'المجال' : 'Domain'} className="h-9 rounded-[8px] border border-hair-2 bg-card px-2 text-[13px] text-navy-900">
              <option value="">{ar ? 'كل المجالات' : 'All domains'}</option>
              {D.domains.map((d) => <option key={d.id} value={d.id}>{ar ? d.name_ar : d.name_en}</option>)}
            </select>
          )}
          <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label={ar ? 'الحالة' : 'Status'} className="h-9 rounded-[8px] border border-hair-2 bg-card px-2 text-[13px] text-navy-900">
            <option value="">{ar ? 'الكل' : 'All'}</option>
            {statusOptions.map((o) => <option key={o.v} value={o.v}>{t(o.l)}</option>)}
          </select>
        </div>

        <div className="relative overflow-x-auto">
          {!lib && tab !== 'events' ? (
            <p className="py-10 text-center text-[13px] text-ink-soft">{ar ? 'تُحمَّل المكتبة…' : 'Loading the library…'}</p>
          ) : rows.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-ink-soft">{ar ? 'لا نتائج.' : 'No results.'}</p>
          ) : tab === 'sources' ? (
            <table className="w-full min-w-[860px] text-[13px]">
              <thead className="bg-canvas text-[11.5px] text-ink-soft">
                <tr>{[ar ? 'المصدر' : 'Source', ar ? 'الناشر' : 'Publisher', ar ? 'المجال' : 'Domain', ar ? 'النوع' : 'Type', ar ? 'الترخيص' : 'Licence', ar ? 'الحالة' : 'Status'].map((h) => <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(slice as Library['sources']).map((s) => (
                  <tr key={`${s.domain}-${s.id}`} className="border-t border-hair align-top hover:bg-canvas/60">
                    <td className="max-w-[360px] px-4 py-2.5">
                      <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 font-medium text-navy-900 hover:text-signal-700 hover:underline" dir="auto">{s.title || s.url}<ExternalLink className="mt-1 size-3 shrink-0 opacity-60" aria-hidden /></a>
                      {s.date && <span className="num block font-mono text-[11px] text-ink-soft" dir="ltr">{s.date}</span>}
                    </td>
                    <td className="max-w-[200px] px-4 py-2.5 text-ink" dir="auto">{s.publisher}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{domainName(s.domain)}</td>
                    <td className="px-4 py-2.5 text-ink-soft" dir="auto">{s.type}</td>
                    <td className="max-w-[160px] px-4 py-2.5 text-ink-soft" dir="auto">{s.licence}</td>
                    <td className="px-4 py-2.5"><Pill status={s.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : tab === 'facts' ? (
            <table className="w-full min-w-[860px] text-[13px]">
              <thead className="bg-canvas text-[11.5px] text-ink-soft">
                <tr>{[ar ? 'الرقم أو الادعاء' : 'Figure or claim', ar ? 'القيمة' : 'Value', ar ? 'المجال' : 'Domain', ar ? 'الحالة' : 'Status', ar ? 'المصدر' : 'Source'].map((h) => <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(slice as Library['facts']).map((f) => (
                  <tr key={`${f.domain}-${f.id}`} className="border-t border-hair align-top hover:bg-canvas/60">
                    <td className="max-w-[520px] px-4 py-2.5 leading-relaxed text-ink" dir="auto">{ar ? f.claim_ar || f.claim_en : f.claim_en || f.claim_ar}</td>
                    <td className="max-w-[180px] px-4 py-2.5"><span className="num font-mono text-[12px] text-navy-900" dir="ltr">{[f.value, f.unit].filter(Boolean).join(' ') || '—'}</span>{f.period && <span className="num block font-mono text-[11px] text-ink-soft" dir="ltr">{f.period}</span>}</td>
                    <td className="px-4 py-2.5 text-ink-soft">{domainName(f.domain)}</td>
                    <td className="px-4 py-2.5"><Pill status={f.status} /></td>
                    <td className="max-w-[200px] px-4 py-2.5">{f.source_url ? <a href={f.source_url} target="_blank" rel="noreferrer" className="text-[12px] text-signal-700 hover:underline" dir="auto">{f.publisher || (ar ? 'الرابط' : 'Link')}</a> : <span className="text-ink-soft">—</span>}{f.date && <span className="num block font-mono text-[11px] text-ink-soft" dir="ltr">{f.date}</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <table className="w-full min-w-[860px] text-[13px]">
              <thead className="bg-canvas text-[11.5px] text-ink-soft">
                <tr>{[ar ? 'التاريخ' : 'Date', ar ? 'السجل' : 'Register', ar ? 'النوع' : 'Type', ar ? 'المكان' : 'Place', ar ? 'الكمية' : 'Quantity', ar ? 'المصدر' : 'Source'].map((h) => <th key={h} className="px-4 py-2.5 text-start font-medium">{h}</th>)}</tr>
              </thead>
              <tbody>
                {(slice as (EventRow & { register: 'theft' | 'supply' })[]).map((e) => (
                  <tr key={e.id} className="border-t border-hair align-top hover:bg-canvas/60">
                    <td className="num whitespace-nowrap px-4 py-2.5 font-mono text-[12px] text-navy-900" dir="ltr">{e.date}</td>
                    <td className="px-4 py-2.5"><span className={clsx('rounded-full px-2 py-0.5 text-[11px] font-medium', e.register === 'theft' ? 'bg-red-50 text-red-800' : 'bg-signal-50 text-signal-700')}>{e.register === 'theft' ? (ar ? 'سرقة' : 'Theft') : ar ? 'كسر أو انقطاع' : 'Break or outage'}</span></td>
                    <td className="px-4 py-2.5 text-ink">{typeLabel(e.register, e.type)}</td>
                    <td className="px-4 py-2.5 text-ink">{ar ? e.place_ar || e.place_en : e.place_en || e.place_ar}<span className="block text-[11.5px] text-ink-soft">{ar ? GOV_AR[e.gov_en] ?? e.gov_en : e.gov_en}</span></td>
                    <td className="max-w-[220px] px-4 py-2.5 text-ink-soft" dir="auto">{e.quantity || '—'}</td>
                    <td className="px-4 py-2.5"><a href={e.source_url} target="_blank" rel="noreferrer" className="text-[12px] text-signal-700 hover:underline" dir="auto">{e.source_name || (ar ? 'الرابط' : 'Link')}</a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-hair px-4 py-3 text-[12.5px] text-ink-soft">
          <span>{ar ? `${n(rows.length)} نتيجة` : `${n(rows.length)} results`}</span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))} className="h-8 rounded-[6px] border border-hair-2 px-3 font-medium text-navy-900 disabled:opacity-40">{ar ? 'السابق' : 'Previous'}</button>
            <span className="num font-mono" dir="ltr">{n(page + 1)} / {n(pages)}</span>
            <button type="button" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))} className="h-8 rounded-[6px] border border-hair-2 px-3 font-medium text-navy-900 disabled:opacity-40">{ar ? 'التالي' : 'Next'}</button>
          </div>
        </div>
      </Card>
    </Page>
  )
}
