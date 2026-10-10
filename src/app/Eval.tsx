import clsx from 'clsx'
import { Fragment, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Download, Play } from 'lucide-react'
import { Wordmark } from '../components/Logo'
import { Chip } from '../components/ui'
import { LangToggle } from '../landing/Header'
import { useLang, type Text } from '../i18n/lang'
import { DEV, HELD_OUT } from '../data/eval-set'
import { ASSET_LABEL, FLOW_LABEL, LINE_LABEL, OUTCOME_LABEL, extractRules, type Asset, type Extraction, type Flow, type Outcome } from '../lib/extract/rules'
import { AI_ERROR, aiStatus, extractAI, type AiStatus } from '../lib/extract/ai'
import { SCORED_FIELDS, scoreItem, summarise, type ItemResult, type ScoredField, type Summary, type Value, type Verdict } from '../lib/extract/score'
import { download } from '../lib/export'

const FIELD_LABEL: Record<ScoredField, Text> = {
  outcome: { ar: 'النتيجة', en: 'Outcome' },
  asset: { ar: 'الأصل', en: 'Asset' },
  lineName: { ar: 'اسم الخط', en: 'Line' },
  material: { ar: 'المادة', en: 'Material' },
  diameter: { ar: 'القطر', en: 'Diameter' },
  location: { ar: 'الموقع', en: 'Location' },
  depth: { ar: 'العمق', en: 'Depth' },
  count: { ar: 'العدد', en: 'Count' },
  flow: { ar: 'الجريان', en: 'Flow' },
  missingFromMap: { ar: 'غير مرسوم', en: 'Off the map' },
}

const VERDICT: Record<Verdict, { mark: string; label: Text; cls: string }> = {
  correct: { mark: '✓', label: { ar: 'صحيح', en: 'Correct' }, cls: 'text-navy-900' },
  'false-fill': { mark: '+', label: { ar: 'مُعبّأ دون ذكر', en: 'Filled, not stated' }, cls: 'text-[#6f4bd8]' },
  missed: { mark: '–', label: { ar: 'فائت', en: 'Missed' }, cls: 'text-muted' },
  wrong: { mark: '✗', label: { ar: 'قيمة خاطئة', en: 'Wrong value' }, cls: 'text-[#c2353a]' },
}

function show(k: ScoredField, v: Value): Text {
  if (v === null) return { ar: '—', en: '—' }
  if (k === 'outcome') return OUTCOME_LABEL[v as Outcome]
  if (k === 'asset') return ASSET_LABEL[v as Asset]
  if (k === 'flow') return FLOW_LABEL[v as Flow]
  if (k === 'lineName') return LINE_LABEL[String(v)] ?? { ar: String(v), en: String(v) }
  if (k === 'material') return v === 'PLASTIC' ? { ar: 'بلاستيك (النوع للمهندس)', en: 'Plastic (type for the engineer)' } : { ar: String(v), en: String(v) }
  if (k === 'diameter') return v === 'UNRESOLVED' ? { ar: 'إنش دون مادة', en: 'Inches, no material' } : { ar: `${v} ملم`, en: `${v} mm` }
  if (k === 'location') return v === 'LANDMARK' ? { ar: 'معلم فقط', en: 'Landmark only' } : { ar: `${v} م`, en: `${v} m` }
  if (k === 'depth') return { ar: `${v} م`, en: `${v} m` }
  if (k === 'missingFromMap') return { ar: 'نعم', en: 'Yes' }
  return { ar: String(v), en: String(v) }
}

type AiItem = { id: string; extraction: Extraction | null; error?: string; dropped: number; ms: number }
type AiRun = { model: string; at: string; items: AiItem[] }
const CACHE = 'mb.eval.ai.v1'

function readCache(): AiRun | null {
  try {
    const raw = localStorage.getItem(CACHE)
    return raw ? (JSON.parse(raw) as AiRun) : null
  } catch {
    return null
  }
}

export default function Eval({ embedded = false }: { embedded?: boolean }) {
  const { lang, t, n } = useLang()
  const ar = lang === 'ar'

  const rulesDev = useMemo(() => DEV.map((it) => scoreItem(it, extractRules(it.text))), [])
  const rulesHeld = useMemo(() => HELD_OUT.map((it) => scoreItem(it, extractRules(it.text))), [])
  const [ai, setAi] = useState<AiStatus | null>(null)
  const [run, setRun] = useState<AiRun | null>(readCache)
  const [progress, setProgress] = useState<number | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  useEffect(() => { aiStatus().then(setAi) }, [])

  const aiHeld = useMemo(() => {
    if (!run) return null
    const byId = new Map(run.items.map((x) => [x.id, x]))
    const scored: ItemResult[] = []
    for (const it of HELD_OUT) {
      const x = byId.get(it.id)?.extraction
      if (x) scored.push(scoreItem(it, x))
    }
    return scored
  }, [run])

  const sRulesDev = summarise(rulesDev)
  const sRulesHeld = summarise(rulesHeld)
  const sAi = aiHeld && aiHeld.length ? summarise(aiHeld) : null
  const aiErrors = run ? run.items.filter((x) => !x.extraction) : []
  const aiDropped = run ? run.items.reduce((a, x) => a + x.dropped, 0) : 0

  const runAll = async () => {
    if (!ai?.available || progress !== null) return
    const items: AiItem[] = new Array(HELD_OUT.length)
    let next = 0
    let done = 0
    let model = ai.model ?? ''
    setProgress(0)
    const worker = async () => {
      while (next < HELD_OUT.length) {
        const i = next++
        const it = HELD_OUT[i]
        const res = await extractAI(it.text)
        items[i] = res.ok ? { id: it.id, extraction: res.extraction, dropped: res.dropped, ms: res.ms } : { id: it.id, extraction: null, error: res.error, dropped: 0, ms: 0 }
        if (res.ok) model = res.model
        setProgress(++done)
      }
    }
    await Promise.all([worker(), worker(), worker()])
    const r: AiRun = { model, at: new Date().toISOString(), items }
    setRun(r)
    setProgress(null)
    try {
      localStorage.setItem(CACHE, JSON.stringify(r))
    } catch {
      /* keep in memory only */
    }
  }

  const pct = (a: number, b: number) => (b ? `${n(Math.round((a / b) * 100))}%` : '—')

  const rows: { label: Text; get: (s: Summary) => string; good: 'high' | 'low' }[] = [
    { label: { ar: 'نتيجة الزيارة صحيحة', en: 'Visit outcome correct' }, get: (s) => `${n(s.outcomeCorrect)} / ${n(s.n)}`, good: 'high' },
    { label: { ar: 'كل الحقول (بما فيها الفارغ الصحيح)', en: 'All fields (incl. correct empties)' }, get: (s) => `${pct(s.fieldsCorrect, s.fieldsTotal)}  ·  ${n(s.fieldsCorrect)} / ${n(s.fieldsTotal)}`, good: 'high' },
    { label: { ar: 'حقول عُبّئت والبلاغ لم يذكرها', en: 'Fields filled that the report did not state' }, get: (s) => n(s.falseFills), good: 'low' },
    { label: { ar: 'حقول ذكرها البلاغ وفاتت', en: 'Stated fields missed' }, get: (s) => n(s.missed), good: 'low' },
    { label: { ar: 'قيمة خاطئة', en: 'Wrong value' }, get: (s) => n(s.wrong), good: 'low' },
    { label: { ar: 'حقول تظهر دون كلمات من البلاغ', en: 'Fields shown without the crew’s words' }, get: (s) => n(s.unsupported), good: 'low' },
    { label: { ar: 'عُرض «مؤكّدًا» قبل المهندس', en: 'Shown as confirmed before the engineer' }, get: (s) => n(s.confirmed), good: 'low' },
  ]

  return (
    <div className={embedded ? 'text-ink' : 'min-h-dvh bg-bg text-ink'}>
      {!embedded && <header className="flex h-14 items-center gap-5 border-b border-navy-900/20 bg-surface px-4">
        <Link to="/" aria-label={ar ? 'الصفحة الرئيسية' : 'Home'}><Wordmark size="sm" /></Link>
        <span className="hidden h-6 w-px bg-navy-900/20 md:block" aria-hidden />
        <p className="hidden text-[13px] font-semibold text-navy-900 md:block">{ar ? 'تقييم الاستخراج' : 'Extraction evaluation'}</p>
        <nav className="ms-auto flex items-center gap-2">
          <Link to="/app" className="inline-flex h-9 items-center rounded-[3px] border border-navy-900/50 px-3 text-[13px] font-semibold text-navy-900 hover:bg-paper">{ar ? 'لوحة العمليات' : 'Console'}</Link>
          <LangToggle />
        </nav>
      </header>}

      <main className="mx-auto w-full max-w-[1180px] px-5 pb-24 pt-14 sm:px-10">
        <p className="eyebrow">{ar ? 'الملحق أ' : 'Appendix A'}</p>
        <h1 className="mt-3 max-w-[22ch] font-display text-[clamp(2.2rem,4.4vw,3.6rem)] font-medium leading-[1.1] text-navy-900">{ar ? 'كيف نعرف أن الاستخراج صحيح؟' : 'How do we know the extraction is right?'}</h1>
        <p className="mt-6 max-w-[68ch] text-[17px] leading-[1.85] text-ink-2">
          {ar
            ? 'جرّبنا المحرّكين على 35 بلاغًا اصطناعيًا بلهجة الفرق الميدانية، ولكل بلاغ إجابة كتبناها بأيدينا للحقول العشرة. البلاغات العشرة الأولى كتبنا القواعد ونحن ننظر إليها، فنتيجتها متفائلة. أما الخمسة والعشرون الأخرى فكُتبت بعد تجميد القواعد، ولم نغيّر أي قاعدة بعد رؤية نتيجتها. الفارغ الصحيح يُحسب صحيحًا، وأسوأ خطأ عندنا حقل مُعبّأ لم يذكره البلاغ.'
            : 'We ran both engines on 35 synthetic reports in field-crew dialect, each with a hand-written answer for all ten fields. The rules were written while looking at the first 10, so that score is optimistic. The other 25 were written after the rules were frozen, and no rule was changed after seeing their score. A correct empty field counts as correct; the worst error is a filled field the report never stated.'}
        </p>
        <div className="mt-5 flex flex-wrap gap-2">
          <Chip kind="synthetic">{ar ? 'بلاغات اصطناعية' : 'Synthetic reports'}</Chip>
          <Chip kind="rules">{ar ? 'القواعد تعمل في المتصفح' : 'Rules run in the browser'}</Chip>
          <Chip kind="ai">{ar ? 'Claude عبر الخادم المحلي' : 'Claude via the local server'}</Chip>
        </div>

        {/* Table 1 */}
        <section className="mt-14" aria-labelledby="t1">
          <div className="flex items-baseline justify-between gap-4 border-b border-navy-900 pb-2">
            <h2 id="t1" className="font-display text-[22px] font-medium text-navy-900">{ar ? 'الجدول 1 · النتيجة' : 'Table 1 · Results'}</h2>
            <span className="font-mono text-[11px] text-muted">{ar ? 'الأفضل: ↑ أعلى · ↓ أقل' : 'Better: ↑ higher · ↓ lower'}</span>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[14.5px]">
              <thead>
                <tr className="border-b border-navy-900/30 text-start text-[12.5px] text-muted">
                  <th className="py-3 text-start font-medium" />
                  <th className="px-3 py-3 text-start font-medium">{ar ? 'القواعد · التطوير (10)' : 'Rules · development (10)'}</th>
                  <th className="px-3 py-3 text-start font-medium text-navy-900">{ar ? 'القواعد · المحجوزة (25)' : 'Rules · held-out (25)'}</th>
                  <th className="bg-signal-50 px-3 py-3 text-start font-medium text-navy-900">{ar ? 'Claude · المحجوزة (25)' : 'Claude · held-out (25)'}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.label.en} className="border-b border-navy-900/10">
                    <th scope="row" className="py-3 pe-4 text-start font-normal text-navy-900">
                      {t(r.label)} <span className="font-mono text-[11px] text-muted">{r.good === 'high' ? '↑' : '↓'}</span>
                    </th>
                    <td className="num px-3 py-3 font-mono text-[13.5px] text-ink-2" dir="ltr" data-num="">{r.get(sRulesDev)}</td>
                    <td className="num px-3 py-3 font-mono text-[13.5px] text-navy-900" dir="ltr" data-num="">{r.get(sRulesHeld)}</td>
                    <td className="num bg-signal-50 px-3 py-3 font-mono text-[13.5px] text-navy-900" dir="ltr" data-num="">{sAi ? r.get(sAi) : '—'}</td>
                  </tr>
                ))}
                <tr className="border-b border-navy-900/10">
                  <th scope="row" className="py-3 pe-4 text-start font-normal text-navy-900">{ar ? 'اقتباسات مخترعة حذفها الحارس' : 'Invented quotes removed by the guard'}</th>
                  <td className="px-3 py-3 font-mono text-[13.5px] text-muted">{ar ? 'لا ينطبق' : 'n/a'}</td>
                  <td className="px-3 py-3 font-mono text-[13.5px] text-muted">{ar ? 'لا ينطبق' : 'n/a'}</td>
                  <td className="num bg-signal-50 px-3 py-3 font-mono text-[13.5px] text-navy-900" dir="ltr" data-num="">{run ? n(aiDropped) : '—'}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="caption mt-3 max-w-[90ch]">
            {ar
              ? '«الحقول دون كلمات من البلاغ» يجب أن تبقى صفرًا في المحرّكين: كل قيمة تُعرض مع موضعها في نص الطاقم، وما لا دليل له يُحذف. و«مؤكّد» لا يظهر إلا بعد أن يعتمده مهندس.'
              : '“Fields shown without the crew’s words” must stay at zero for both engines: every value is shown with its place in the crew’s text, and anything without evidence is removed. “Confirmed” appears only after an engineer approves.'}
          </p>
        </section>

        {/* Claude run */}
        <section className="mt-10 grid gap-4 border border-navy-900/25 bg-surface p-5 md:grid-cols-[1fr_auto] md:items-center" aria-live="polite">
          <div className="text-[14.5px] leading-relaxed text-navy-900">
            {run ? (
              <p>
                {ar ? 'آخر تشغيل لـ Claude: ' : 'Last Claude run: '}
                <span className="font-mono text-[13px]" dir="ltr">{run.model}</span> · <span className="font-mono text-[13px]" dir="ltr">{run.at.slice(0, 16).replace('T', ' ')}</span>
                {aiErrors.length > 0 && <span className="text-candidate-ink"> · {ar ? `${n(aiErrors.length)} بلاغ تعذّر استخراجه` : `${n(aiErrors.length)} reports failed`}</span>}
              </p>
            ) : ai?.available ? (
              <p>{ar ? 'Claude متاح على هذا الجهاز. شغّله على البلاغات الخمسة والعشرين المحجوزة لملء العمود الأزرق.' : 'Claude is available on this machine. Run it on the 25 held-out reports to fill the blue column.'}</p>
            ) : (
              <p>{ar ? 'لم يُشغَّل Claude على هذا الجهاز بعد: يحتاج مفتاح API على الخادم (انظر README). عمود القواعد محسوب الآن في متصفحك.' : 'Claude has not been run on this machine: it needs an API key on the server (see the README). The rules column is computed in your browser right now.'}</p>
            )}
            <p className="mt-1 text-[12.5px] text-muted">{ar ? '25 طلبًا، نحو نصف دولار بأسعار Opus 5.5 المعلنة (تقدير).' : '25 requests, about half a dollar at Opus 5.5 list prices (estimate).'}</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" disabled={!ai?.available || progress !== null} onClick={runAll} className="inline-flex h-10 items-center gap-2 rounded-[3px] bg-navy-900 px-4 text-[13.5px] font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40">
              <Play className="size-4" aria-hidden />
              {progress !== null ? (ar ? `جارٍ… ${n(progress)} / 25` : `Running… ${n(progress)} / 25`) : run ? (ar ? 'أعد التشغيل' : 'Run again') : ar ? 'شغّل Claude' : 'Run Claude'}
            </button>
            {run && (
              <button type="button" onClick={() => download(`missing-blue-eval-${run.at.slice(0, 10)}.json`, JSON.stringify({ run, held_out: HELD_OUT }, null, 1))} className="inline-flex h-10 items-center gap-2 rounded-[3px] border border-navy-900/50 px-4 text-[13.5px] font-semibold text-navy-900 hover:bg-paper">
                <Download className="size-4" aria-hidden />
                {ar ? 'نزّل النتائج' : 'Download results'}
              </button>
            )}
          </div>
          {aiErrors.length > 0 && (
            <p className="text-[12.5px] text-candidate-ink md:col-span-2">{t(AI_ERROR[aiErrors[0].error ?? ''] ?? { ar: `خطأ: ${aiErrors[0].error}`, en: `Error: ${aiErrors[0].error}` })}</p>
          )}
        </section>

        {/* Figure: per field */}
        <section className="mt-14" aria-labelledby="f1">
          <div className="flex items-baseline justify-between gap-4 border-b border-navy-900 pb-2">
            <h2 id="f1" className="font-display text-[22px] font-medium text-navy-900">{ar ? 'الشكل أ.1 · الدقة لكل حقل (المجموعة المحجوزة)' : 'Figure A.1 · Accuracy per field (held-out set)'}</h2>
            <span className="flex items-center gap-4 font-mono text-[11px] text-muted">
              <span className="flex items-center gap-1.5"><span className="h-2 w-5 bg-navy-900" aria-hidden />{ar ? 'القواعد' : 'Rules'}</span>
              <span className="flex items-center gap-1.5"><span className="h-2 w-5 bg-signal-500" aria-hidden />Claude</span>
            </span>
          </div>
          <dl className="mt-2 grid gap-x-12 md:grid-cols-2">
            {SCORED_FIELDS.map((k) => (
              <div key={k} className="grid grid-cols-[7.5rem_1fr] items-center gap-3 border-b border-navy-900/10 py-3">
                <dt className="text-[14px] text-navy-900">{t(FIELD_LABEL[k])}</dt>
                <dd className="grid gap-1.5">
                  <Bar value={sRulesHeld.perField[k]} of={sRulesHeld.n} cls="bg-navy-900" n={n} />
                  {sAi ? <Bar value={sAi.perField[k]} of={sAi.n} cls="bg-signal-500" n={n} /> : <span className="h-2 border border-dashed border-signal-500/50" aria-hidden />}
                </dd>
              </div>
            ))}
          </dl>
        </section>

        {/* Table 2: report by report */}
        <section className="mt-14" aria-labelledby="t2">
          <div className="flex items-baseline justify-between gap-4 border-b border-navy-900 pb-2">
            <h2 id="t2" className="font-display text-[22px] font-medium text-navy-900">{ar ? 'الجدول 2 · بلاغًا بلاغًا' : 'Table 2 · Report by report'}</h2>
            <span className="flex flex-wrap gap-3 font-mono text-[11px] text-muted">
              {(Object.keys(VERDICT) as Verdict[]).map((v) => <span key={v} className={VERDICT[v].cls}>{VERDICT[v].mark} {t(VERDICT[v].label)}</span>)}
            </span>
          </div>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[820px] border-collapse text-[14px]">
              <thead>
                <tr className="border-b border-navy-900/30 text-[12.5px] text-muted">
                  <th className="py-3 pe-3 text-start font-medium">#</th>
                  <th className="py-3 pe-3 text-start font-medium">{ar ? 'البلاغ' : 'Report'}</th>
                  <th className="py-3 pe-3 text-start font-medium">{ar ? 'النتيجة المتوقعة' : 'Expected outcome'}</th>
                  <th className="py-3 pe-3 text-start font-medium">{ar ? 'القواعد' : 'Rules'}</th>
                  <th className="bg-signal-50 px-3 py-3 text-start font-medium">Claude</th>
                </tr>
              </thead>
              <tbody>
                {HELD_OUT.map((it, i) => {
                  const rr = rulesHeld[i]
                  const aiItem = run?.items.find((x) => x.id === it.id)
                  const ra = aiItem?.extraction ? scoreItem(it, aiItem.extraction) : null
                  const isOpen = open === it.id
                  return (
                    <Fragment key={it.id}>
                      <tr className={clsx('cursor-pointer border-b border-navy-900/10 align-top hover:bg-paper', isOpen && 'bg-paper')} onClick={() => setOpen(isOpen ? null : it.id)}>
                        <td className="py-3 pe-3 font-mono text-[12px] text-muted">
                          <button type="button" aria-expanded={isOpen} className="underline-offset-4 hover:underline" onClick={(e) => { e.stopPropagation(); setOpen(isOpen ? null : it.id) }}>{it.id}</button>
                        </td>
                        <td className="max-w-[440px] py-3 pe-3 leading-[1.7] text-navy-900" dir="rtl" lang="ar" style={{ textAlign: 'right' }}>{it.text}</td>
                        <td className="py-3 pe-3 text-ink-2">{t(show('outcome', it.expected.outcome))}</td>
                        <td className="py-3 pe-3"><Cell r={rr} /></td>
                        <td className="bg-signal-50 px-3 py-3">{ra ? <Cell r={ra} /> : <span className="text-muted">{aiItem?.error ? (ar ? 'تعذّر' : 'failed') : '—'}</span>}</td>
                      </tr>
                      {isOpen && (
                        <tr className="border-b border-navy-900/20 bg-paper">
                          <td />
                          <td colSpan={4} className="pb-5 pe-3">
                            <table className="w-full border-collapse text-[13px]">
                              <thead>
                                <tr className="text-[11.5px] text-muted">
                                  <th className="py-1.5 pe-3 text-start font-medium">{ar ? 'الحقل' : 'Field'}</th>
                                  <th className="py-1.5 pe-3 text-start font-medium">{ar ? 'المتوقع' : 'Expected'}</th>
                                  <th className="py-1.5 pe-3 text-start font-medium">{ar ? 'القواعد' : 'Rules'}</th>
                                  <th className="py-1.5 pe-3 text-start font-medium">Claude</th>
                                </tr>
                              </thead>
                              <tbody>
                                {SCORED_FIELDS.map((k) => (
                                  <tr key={k} className="border-t border-navy-900/10">
                                    <td className="py-1.5 pe-3 text-navy-900">{t(FIELD_LABEL[k])}</td>
                                    <td className="py-1.5 pe-3 text-ink-2">{t(show(k, rr.fields[k].expected))}</td>
                                    <td className="py-1.5 pe-3"><FieldCell k={k} f={rr.fields[k]} /></td>
                                    <td className="py-1.5 pe-3">{ra ? <FieldCell k={k} f={ra.fields[k]} /> : <span className="text-muted">—</span>}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
          <p className="caption mt-3 max-w-[90ch]">
            {ar
              ? 'اضغط أي صف لرؤية الحقول العشرة. القواعد تعمل دون اتصال وتبقى الخيار الاحتياطي؛ Claude يقرأ اللهجة والسياق ويقتبس الكلمات التي استند إليها، وكلاهما لا يعتمد شيئًا قبل المهندس.'
              : 'Click any row to see all ten fields. The rules work offline and remain the fallback; Claude reads dialect and context and quotes the words it relied on. Neither approves anything before the engineer.'}
          </p>
        </section>
      </main>
    </div>
  )
}

function Cell({ r }: { r: ItemResult }) {
  const { t, n } = useLang()
  const v = r.fields.outcome.verdict
  return (
    <span className="flex items-baseline gap-2 whitespace-nowrap">
      <span className={clsx('font-mono text-[14px] font-semibold', VERDICT[v].cls)} title={t(VERDICT[v].label)}>{VERDICT[v].mark}</span>
      <span className="text-[13px] text-navy-900">{t(show('outcome', r.fields.outcome.got))}</span>
      <span className="num font-mono text-[11.5px] text-muted" dir="ltr">{n(r.correct)}/10</span>
    </span>
  )
}

function FieldCell({ k, f }: { k: ScoredField; f: { got: Value; verdict: Verdict } }) {
  const { t } = useLang()
  return (
    <span className="inline-flex items-baseline gap-1.5">
      <span className={clsx('font-mono font-semibold', VERDICT[f.verdict].cls)} title={t(VERDICT[f.verdict].label)}>{VERDICT[f.verdict].mark}</span>
      <span className={f.verdict === 'correct' ? 'text-ink-2' : 'text-navy-900'}>{t(show(k, f.got))}</span>
    </span>
  )
}

function Bar({ value, of, cls, n }: { value: number; of: number; cls: string; n: (v: number) => string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="relative h-2 flex-1 bg-navy-900/[0.07]" aria-hidden>
        <span className={clsx('absolute inset-y-0 start-0', cls)} style={{ width: `${(value / of) * 100}%` }} />
      </span>
      <span className="num w-12 font-mono text-[11.5px] text-ink-2" dir="ltr" style={{ textAlign: 'end' }}>{n(value)}/{n(of)}</span>
    </span>
  )
}
