import clsx from 'clsx'
import { useMemo, useState, type ReactNode } from 'react'
import { Link } from 'react-router'
import { Printer } from 'lucide-react'
import { Wordmark } from '../components/Logo'
import { Chip, Fn } from '../components/ui'
import { LangToggle } from '../landing/Header'
import { useLang, type Text } from '../i18n/lang'
import { fnOf } from '../data/sources'
import { FACTS, type Source } from '../data/facts'
import { BIZ_SRC, BLOCKS, CALC, PRECEDENT, PRESETS, QA, RISKS, SCALE, SEGMENTS, STAKES, USERS, WHY_NOW, type Block, type Item, type SegmentId } from '../data/business'
import { daysToCost, roi } from '../lib/biz'

const SEG = Object.fromEntries(SEGMENTS.map((s) => [s.id, s])) as Record<SegmentId, (typeof SEGMENTS)[number]>

function SegMark({ id, size = 9 }: { id: SegmentId; size?: number }) {
  const s = SEG[id]
  return <span aria-hidden className="inline-block shrink-0" style={{ width: size, height: size, background: s.dashed ? 'transparent' : s.color, border: s.dashed ? `1.5px dashed ${s.color}` : undefined }} />
}

function ItemRow({ item, active }: { item: Item; active: SegmentId | null }) {
  const { t, lang } = useLang()
  const dim = active !== null && !!item.for && !item.for.includes(active)
  const hit = active !== null && !!item.for?.includes(active)
  return (
    <li className={clsx('grid grid-cols-[1.5rem_1fr] gap-x-2 border-t border-navy-900/10 py-1.5 transition-opacity duration-200 first:border-t-0', dim && 'opacity-25')}>
      <span className="mt-[0.45em] flex flex-wrap content-start gap-[3px]" aria-hidden>
        {item.for ? item.for.map((id) => <SegMark key={id} id={id} size={7} />) : <span className="size-[7px] border border-navy-900/35" />}
      </span>
      <span className={clsx(hit && 'font-medium text-navy-900')}>
        {t(item.text)}
        {item.estimate && <span className="ms-1.5 whitespace-nowrap font-mono text-[10.5px] text-candidate-ink">{lang === 'ar' ? '· تقدير' : '· estimate'}</span>}
        {item.sources && <Fn sources={item.sources} />}
      </span>
    </li>
  )
}

function BlockCell({ b, active, className, children, tone = 'plain' }: { b: Pick<Block, 'id' | 'n' | 'title' | 'question'> & Partial<Block>; active: SegmentId | null; className?: string; children?: ReactNode; tone?: 'plain' | 'key' }) {
  const { t } = useLang()
  return (
    <section aria-labelledby={`bk-${b.id}`} className={clsx('flex min-w-0 flex-col p-4 sm:p-5', tone === 'key' ? 'bg-paper' : 'bg-surface', className)}>
      <header className="flex items-baseline gap-2">
        <span className="font-mono text-[11px] text-muted" dir="ltr">{b.n}</span>
        <h3 id={`bk-${b.id}`} className="font-display text-[20px] font-medium leading-tight text-navy-900">{t(b.title)}</h3>
      </header>
      <p className="bmc-q mb-2 mt-1 text-[12.5px] text-muted">{t(b.question)}</p>
      {children}
      {b.items && (
        <ul className="text-[13px] leading-[1.55] text-ink">
          {b.items.map((it, i) => <ItemRow key={i} item={it} active={active} />)}
        </ul>
      )}
      {b.note && <p className="mt-auto border-t border-navy-900/25 pt-3 text-[12.5px] leading-relaxed text-navy-900">{t(b.note)}</p>}
    </section>
  )
}

/* ------------------------------------------------------------------ calculator */

function Field({ id, label, caption, value, onChange, min, max, step, unit }: { id: string; label: string; caption: ReactNode; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit: string }) {
  return (
    <div className="border-t border-navy-900/15 py-4 first:border-t-0">
      <div className="flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="text-[14.5px] font-medium text-navy-900">{label}</label>
        <span className="flex items-baseline gap-1.5">
          <input
            type="number"
            inputMode="decimal"
            aria-label={label}
            value={value}
            min={min}
            step={step}
            onChange={(e) => { const v = parseFloat(e.target.value); if (Number.isFinite(v) && v >= 0) onChange(v) }}
            className="num w-24 border-b border-navy-900/40 bg-transparent py-0.5 text-end font-mono text-[15px] text-navy-900 focus:border-navy-900 focus:outline-none"
            dir="ltr"
          />
          <span className="font-mono text-[11.5px] text-muted">{unit}</span>
        </span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={Math.min(max, value)} onChange={(e) => onChange(parseFloat(e.target.value))} className="mt-3 w-full accent-[#011c47] print:hidden" />
      <p className="mt-1.5 text-[12px] leading-relaxed text-muted">{caption}</p>
    </div>
  )
}

type Basis = 'cost' | 'tariff' | 'custom'

function Calculator() {
  const { lang, n } = useLang()
  const ar = lang === 'ar'
  const [km, setKm] = useState(325)
  const [price, setPrice] = useState(CALC.priceRef.value)
  const [rate, setRate] = useState(CALC.casesPer100Km)
  const [m3, setM3] = useState(CALC.m3PerCase.value)
  const [jod, setJod] = useState(CALC.jodPerM3.value)
  const basis: Basis = jod === CALC.jodPerM3.value ? 'cost' : jod === CALC.tariffTop.value ? 'tariff' : 'custom'
  const r = roi({ km, pricePerKm: price, casesPer100Km: rate, m3PerCase: m3, jodPerM3: jod })
  const atTariff = roi({ km, pricePerKm: price, casesPer100Km: rate, m3PerCase: m3, jodPerM3: CALC.tariffTop.value })
  const days = daysToCost(r.annualCost, CALC.alJafrM3PerDay.value, jod)
  const money = (x: number) => (ar ? `${n(Math.round(x))} دينار` : `JOD ${n(Math.round(x))}`)
  const one = (x: number) => n(x, { maximumFractionDigits: 1 })
  const pays = r.multiple !== null && r.multiple >= 1

  const valueLabel: Record<Basis, Text> = {
    cost: { ar: 'قيمتها بكلفة التزويد على الحكومة', en: 'Its value at the government’s supply cost' },
    tariff: { ar: 'قيمتها بأعلى تعرفة منزلية', en: 'Its value at the top household tariff' },
    custom: { ar: 'قيمتها بالقيمة التي أدخلتها', en: 'Its value at the price you entered' },
  }
  const netLabel: Record<Basis, Text> = {
    cost: { ar: 'صافي القيمة للأردن', en: 'Net value to Jordan' },
    tariff: { ar: 'الصافي بقيمة التعرفة', en: 'Net at tariff value' },
    custom: { ar: 'الصافي', en: 'Net' },
  }
  const ledger: { k: Text; v: string; strong?: boolean }[] = [
    { k: { ar: 'كلفة الاشتراك في السنة', en: 'Subscription per year' }, v: money(r.annualCost) },
    { k: { ar: 'حالات إضافية مؤكّدة في السنة', en: 'Extra confirmed cases per year' }, v: one(r.cases) },
    { k: { ar: 'مياه موفّرة في السنة', en: 'Water saved per year' }, v: `${n(Math.round(r.m3))} ${ar ? 'م³' : 'm³'}` },
    { k: valueLabel[basis], v: money(r.value) },
    { k: netLabel[basis], v: `${r.net < 0 ? '−' : ''}${money(Math.abs(r.net))}`, strong: true },
  ]
  const headline =
    r.multiple === null
      ? ar ? 'أدخل سعرًا لحساب العائد.' : 'Enter a price to see the return.'
      : basis === 'cost'
        ? ar ? `كل دينار يُدفع يحمي مياهًا كلّف تزويدُها الحكومةَ ${one(r.multiple)} دينار.` : `Every dinar spent protects water that cost the government ${one(r.multiple)} dinars to supply.`
        : basis === 'tariff'
          ? ar ? `كل دينار يُدفع يحمي مياهًا قيمتها بأعلى تعرفة منزلية ${one(r.multiple)} دينار.` : `Every dinar spent protects ${one(r.multiple)} dinars of water at the top household tariff.`
          : ar ? `كل دينار يُدفع يحمي مياهًا قيمتها ${one(r.multiple)} دينار.` : `Every dinar spent protects ${one(r.multiple)} dinars of water.`

  const basisBtn = (b: Exclude<Basis, 'custom'>, v: number, label: Text) => (
    <button type="button" aria-pressed={basis === b} onClick={() => setJod(v)} className={clsx('inline-flex h-8 items-center rounded-[3px] border px-2.5 text-[12.5px] font-semibold', basis === b ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/40 text-navy-900 hover:bg-paper')}>
      {ar ? label.ar : label.en}
    </button>
  )

  return (
    <div className="grid border border-navy-900 lg:grid-cols-12">
      <div className="p-5 sm:p-6 lg:col-span-7 lg:border-e lg:border-navy-900">
        <div className="flex flex-wrap gap-2 print:hidden" role="group" aria-label={ar ? 'أمثلة جاهزة' : 'Presets'}>
          {PRESETS.map((p) => (
            <button key={p.id} type="button" aria-pressed={km === p.km} onClick={() => setKm(p.km)} className={clsx('inline-flex h-9 items-center gap-1 rounded-[3px] border px-3 text-[13px] font-semibold', km === p.km ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/40 text-navy-900 hover:bg-paper')}>
              {ar ? p.label.ar : p.label.en}
            </button>
          ))}
        </div>
        <div className="mt-2">
          <Field id="km" label={ar ? 'طول الخط المراقَب' : 'Length of line monitored'} unit={ar ? 'كم' : 'km'} value={km} onChange={setKm} min={10} max={1000} step={5} caption={<>{ar ? 'الديسي 325 كم، والناقل الوطني نحو 440 كم.' : 'Disi is 325 km; the National Carrier about 440 km.'}<Fn sources={PRESETS.flatMap((p) => p.sources)} /></>} />
          <Field
            id="price" label={ar ? 'سعر الاشتراك لكل كيلومتر في السنة' : 'Subscription per km per year'} unit={ar ? 'دينار' : 'JOD'} value={price} onChange={setPrice} min={0} max={400} step={0.1}
            caption={<>{ar ? `القيمة الأولى مرجع للتصوّر لا عرض منّا: بيان عمل لـ ASTERRA مودع لدى منظّم ولاية كنتاكي، 70 ألف دولار سنويًا لـ 373 ميلًا (عدا 9,500 دولار لخمسة أيام ميدانية)، أي نحو ${one(CALC.priceRef.value)} دينار للكيلومتر. نقطة واحدة من 2023.` : `The starting value is a reference for scale, not our quote: an ASTERRA statement of work filed with the Kentucky regulator, USD 70,000 a year for 373 miles (plus USD 9,500 for 5 field days), about JOD ${one(CALC.priceRef.value)} per km. One data point, from 2023.`}<Fn sources={[CALC.priceRef.source]} />{' '}<button type="button" onClick={() => setPrice(CALC.priceRef.value)} className="underline underline-offset-2 hover:text-navy-900 print:hidden">{ar ? 'أعِد المرجع' : 'Reset'}</button></>}
          />
          <Field
            id="rate" label={ar ? 'حالات إضافية مؤكّدة من قائمتنا لكل 100 كم في السنة' : 'Extra confirmed cases from our list per 100 km a year'} unit="" value={rate} onChange={setRate} min={0} max={50} step={0.5}
            caption={<>{ar ? `افتراضنا حتى تقيسه التجربة، ولا تُحسب الحالة إلا إن لم تكن في سجل المرفق. وللتصوّر لا للمقارنة: سجّلت الوزارة ${n(CALC.disiAttacksPer100Km)} اعتداءً لكل 100 كم على خط الديسي في 2025، وكلها مكتشفة أصلًا.` : `Our assumption until the pilot measures it. A case counts only if your register didn’t already hold it. For scale, not comparison: the ministry recorded ${n(CALC.disiAttacksPer100Km)} attacks per 100 km on the Disi line in 2025, all already found.`}<Fn sources={[BIZ_SRC.disiLength, ...FACTS.disi.sources]} /></>}
          />
          <Field
            id="m3" label={ar ? 'المياه الموفّرة في الحالة الواحدة' : 'Water saved per case'} unit={ar ? 'م³' : 'm³'} value={m3} onChange={setM3} min={0} max={10000} step={10}
            caption={<>{ar ? 'رقم مؤقت لا قياس: متوسط 2025 الوطني لكل اعتداء مسجّل من كل الأنواع، من الوصلات المنزلية إلى الآبار (27 مليون م³ ÷ 14 ألفًا، والقسمة لنا). وأرقام 2022 تعطي أقل من 1,000 م³ للحالة. والتجربة تقيس المياه الموفّرة فعلًا: التدفّق × الأيام التي سبقنا بها الدوريات.' : 'A placeholder, not a measurement: the 2025 national average per recorded attack of every kind, from house connections to wells (27 million m³ ÷ 14,000; our division). The 2022 figures give under 1,000 m³ a case. The pilot measures the water actually saved: flow × days found earlier than patrols.'}<Fn sources={[CALC.m3PerCase.source]} /></>}
          />
          <Field
            id="jod" label={ar ? 'قيمة المتر المكعب' : 'Value of one cubic metre'} unit={ar ? 'دينار' : 'JOD'} value={jod} onChange={setJod} min={0} max={3} step={0.005}
            caption={<>
              <span className="mb-2 flex flex-wrap gap-2 print:hidden" role="group" aria-label={ar ? 'أساس القيمة' : 'Value basis'}>
                {basisBtn('cost', CALC.jodPerM3.value, { ar: 'كلفة التزويد · 1.93', en: 'Supply cost · 1.93' })}
                {basisBtn('tariff', CALC.tariffTop.value, { ar: 'أعلى تعرفة منزلية · 0.525', en: 'Top household tariff · 0.525' })}
              </span>
              {ar ? 'كلفة تزويد المتر على الحكومة في 2024: قيمة الماء الذي لا يصل إلى آخر الخط بالنسبة للأردن. وليست نقدًا يعود إلى المشتري: تدفع المنازل 0.225–0.525 دينار للمتر (المصدر نفسه).' : 'What one cubic metre cost the government to supply in 2024: the value to Jordan of water that never reaches the end of the line. It is not cash back to the buyer: households pay JOD 0.225–0.525 per m³ (same source).'}
              <Fn sources={[CALC.jodPerM3.source]} />
            </>}
          />
        </div>
      </div>

      <div className="flex flex-col border-t border-navy-900 bg-paper p-5 sm:p-6 lg:col-span-5 lg:border-t-0" aria-live="polite">
        <p className="font-mono text-[11px] text-muted">{ar ? 'النتيجة' : 'Result'}</p>
        <p className={clsx('num mt-2 font-display text-[clamp(3.2rem,6vw,4.6rem)] font-medium leading-none', pays ? 'text-navy-900' : 'text-[#c2353a]')} dir="ltr" data-num="">
          {r.multiple === null ? '—' : `×${n(r.multiple, { maximumFractionDigits: 1, minimumFractionDigits: 1 })}`}
        </p>
        <p className="mt-2 text-[15px] leading-relaxed text-navy-900">{headline}</p>
        <dl className="mt-5 border-t border-navy-900/25">
          {ledger.map((row) => (
            <div key={row.k.en} className="flex items-baseline justify-between gap-4 border-b border-navy-900/10 py-2.5">
              <dt className="text-[13.5px] text-ink-2">{ar ? row.k.ar : row.k.en}</dt>
              <dd className={clsx('num whitespace-nowrap font-mono text-[14px]', row.strong ? 'font-semibold text-navy-900' : 'text-navy-900')} dir="ltr">{row.v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-5 grid gap-3 text-[14px] leading-relaxed text-navy-900">
          {r.breakEvenPer100Km !== null && (
            <p>
              <span className="font-semibold">{ar ? 'نقطة التعادل: ' : 'Break-even: '}</span>
              {ar
                ? `${one(r.breakEvenPer100Km)} حالة إضافية لكل 100 كم في السنة، أي نحو ${one((r.breakEvenPer100Km * km) / 100)} في السنة على هذا الخط.`
                : `${one(r.breakEvenPer100Km)} extra cases per 100 km a year, about ${one((r.breakEvenPer100Km * km) / 100)} a year on this line.`}
              {basis === 'cost' && atTariff.breakEvenPer100Km !== null && (
                <span className="text-ink-2">
                  {ar ? ` وبأعلى تعرفة منزلية: ${one(atTariff.breakEvenPer100Km)} لكل 100 كم.` : ` At the top household tariff: ${one(atTariff.breakEvenPer100Km)} per 100 km.`}
                </span>
              )}
            </p>
          )}
          <p>
            <span className="font-semibold">{ar ? 'سعر التعادل: ' : 'Break-even price: '}</span>
            {ar ? `بالمعدّل المفترض (${one(rate)} لكل 100 كم)، ${money(r.maxPricePerKm)} للكيلومتر سنويًا.` : `at the assumed rate (${one(rate)} per 100 km), ${money(r.maxPricePerKm)} per km a year.`}
          </p>
          {days !== null && (
            <p className="text-ink-2">
              {ar
                ? `وللتصوّر: محبس الهواء الذي كُسر قرب الجفر سرّب نحو 5,000 م³ يوميًا؛ وبهذه القيمة، ${one(days)} يوم من هذا التسرّب تعادل كلفة سنة كاملة من الاشتراك.`
                : `For scale: the air valve broken near Al-Jafr leaked about 5,000 m³ a day; at this value, ${one(days)} days of that leak equal a full year of the subscription.`}
              <Fn sources={[CALC.alJafrM3PerDay.source]} />
            </p>
          )}
        </div>
        <p className="mt-auto pt-5 text-[11.5px] leading-relaxed text-muted">
          {ar ? 'كل قيمة أولى مذكور مصدرها؛ و«الحالات الإضافية» و«المياه الموفّرة» افتراضان تقيسهما التجربة. الأرقام هنا لحساب التعادل، لا عرض سعر.' : 'Every starting value is sourced; “extra cases” and “water saved” are assumptions the pilot measures. These numbers find the break-even; they are not a price offer.'}
        </p>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ page */

const PATH: { when: Text; title: Text; body: Text; sources?: Source[] }[] = [
  { when: { ar: 'الأسابيع 1–12', en: 'Weeks 1–12' }, title: { ar: 'تجربة ممولة', en: 'Funded pilot' }, body: { ar: 'ممر واحد ومنطقة واحدة يدفعها برنامج قائم. نقيس الحالات الإضافية المؤكّدة مقابل الدوريات، والكلفة لكل حالة.', en: 'One corridor and one district, paid by a running programme. We measure extra confirmed cases against patrols, and cost per case.' } },
  { when: { ar: 'السنة الأولى', en: 'Year 1' }, title: { ar: 'أول اشتراك', en: 'First subscription' }, body: { ar: 'الممر نفسه باشتراك لكل كيلومتر، مع الربط بنظام GIS وتدريب الطواقم.', en: 'The same corridor on a per-km subscription, with the GIS connection and crew training.' } },
  { when: { ar: 'السنة 2–3', en: 'Years 2–3' }, title: { ar: 'السجلات والممرات', en: 'Records and corridors' }, body: { ar: 'ترخيص البلاغ الميداني والسجلات لطواقم الشركات، في المدن أيضًا؛ والناقل الوطني حين يعمل؛ ودفعات النتائج.', en: 'The field-reporting and records licence for utility crews, cities included; the National Carrier once it runs; results payments.' } },
  { when: { ar: 'بعدها', en: 'Then' }, title: { ar: 'المنطقة', en: 'The region' }, body: { ar: 'عُمان والشارقة تشتريان كشف التسرّب بالأقمار اليوم؛ ونحن نضيف السرقة والبلاغ العربي والسجلات.', en: 'Oman and Sharjah already buy satellite leak detection; we add theft, Arabic reporting and records.' }, sources: [BIZ_SRC.oman, BIZ_SRC.sewa] },
]

function SectionTitle({ id, children, aside }: { id: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-navy-900 pb-2">
      <h2 id={id} className="font-display text-[22px] font-medium text-navy-900">{children}</h2>
      {aside}
    </div>
  )
}

export default function Canvas() {
  const { lang, t, n } = useLang()
  const ar = lang === 'ar'
  const [active, setActive] = useState<SegmentId | null>(null)

  // Every source cited on this page, numbered as on the landing page.
  const cited = useMemo(() => {
    const all: Source[] = [
      ...STAKES.flatMap((s) => s.sources),
      ...SEGMENTS.flatMap((s) => s.sources),
      ...Object.values(BLOCKS).flatMap((b) => b.items.flatMap((i) => i.sources ?? [])),
      CALC.priceRef.source, CALC.m3PerCase.source, CALC.jodPerM3.source, CALC.alJafrM3PerDay.source, BIZ_SRC.disiLength, ...FACTS.disi.sources,
      ...PRESETS.flatMap((p) => p.sources),
      ...SCALE.sources,
      ...PATH.flatMap((p) => p.sources ?? []),
      ...WHY_NOW.flatMap((w) => w.sources),
      ...QA.flatMap((q) => q.sources ?? []),
      ...PRECEDENT.sources,
    ]
    const seen = new Map<number, Source>()
    for (const s of all) {
      const k = fnOf(s.url)
      if (k && !seen.has(k)) seen.set(k, s)
    }
    return [...seen.entries()].sort((a, b) => a[0] - b[0])
  }, [])

  return (
    <div className="min-h-dvh bg-bg text-ink print:bg-white">
      <style>{'@page { size: A4 landscape; margin: 9mm; }'}</style>
      <header className="flex h-14 items-center gap-5 border-b border-navy-900/20 bg-surface px-4 print:hidden">
        <Link to="/" aria-label={ar ? 'الصفحة الرئيسية' : 'Home'}><Wordmark size="sm" /></Link>
        <span className="hidden h-6 w-px bg-navy-900/20 md:block" aria-hidden />
        <p className="hidden text-[13px] font-semibold text-navy-900 md:block">{ar ? 'نموذج العمل' : 'Business model'}</p>
        <nav className="ms-auto flex items-center gap-2">
          <Link to="/app" className="hidden h-9 items-center rounded-[3px] px-2 text-[13px] text-navy-900 underline-offset-4 hover:underline sm:inline-flex">{ar ? 'لوحة العمليات' : 'Console'}</Link>
          <button type="button" onClick={() => window.print()} className="inline-flex h-9 items-center gap-1.5 rounded-[3px] border border-navy-900/50 px-3 text-[13px] font-semibold text-navy-900 hover:bg-paper">
            <Printer className="size-4" aria-hidden />
            {ar ? 'اطبع / PDF' : 'Print / PDF'}
          </button>
          <LangToggle />
        </nav>
      </header>

      <main className="mx-auto w-full max-w-[1280px] px-5 pb-24 pt-12 sm:px-10 print:max-w-none print:px-0 print:pb-0 print:pt-0">
        {/* Title */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-end print:hidden">
          <div className="lg:col-span-8">
            <p className="eyebrow">{ar ? 'الملحق ب · نموذج العمل' : 'Appendix B · Business model'}</p>
            <h1 className="mt-3 font-display text-[clamp(2.3rem,4.6vw,3.8rem)] font-medium leading-[1.08] text-navy-900">{ar ? 'مَن يدفع، ولماذا يربح؟' : 'Who pays, and why it pays off'}</h1>
            <p className="mt-6 max-w-[64ch] text-[17px] leading-[1.85] text-ink-2">
              {ar
                ? 'الصور الفضائية مجانية، فالكلفة في التشغيل لا في البيانات. نبدأ بتجربة تموّلها برامج قائمة لخفض الفاقد، ثم اشتراك سنوي لكل كيلومتر مراقَب. لا نقترح سعرًا قبل أن نقيس كلفة الدوريات اليوم، لكن يمكنك أن تحسب بنفسك أدناه متى يغطي الاشتراك كلفته.'
                : 'Satellite imagery is free, so the cost sits in operations, not data. We start with a pilot paid by programmes already funding water-loss cuts, then an annual subscription per kilometre monitored. We don’t propose a price before measuring what patrols cost today, but you can work out below when the subscription pays for itself.'}
            </p>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-2 lg:col-span-4 lg:justify-end">
            <Chip kind="real">{ar ? 'كل رقم بمصدره' : 'Every number sourced'}</Chip>
            <Chip kind="illustrative">{ar ? 'التقديرات موسومة' : 'Estimates labelled'}</Chip>
            <Chip kind="unconfirmed">{ar ? 'السعر بعد القياس' : 'Price after measuring'}</Chip>
          </div>
        </div>

        {/* Stakes */}
        <dl className="mt-12 grid gap-y-8 border-y border-navy-900/20 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:gap-x-10 print:hidden">
          {STAKES.map((s) => (
            <div key={s.value.en}>
              <dd className="num font-display text-[clamp(2.1rem,3vw,2.7rem)] font-medium leading-none text-navy-900" data-num="">{t(s.value)}</dd>
              <dt className="mt-3 max-w-[30ch] text-[14px] leading-snug text-ink-2">{t(s.label)}<Fn sources={s.sources} /></dt>
            </div>
          ))}
        </dl>

        {/* Figure B.1: the canvas */}
        <section className="mt-14 print:mt-0" aria-labelledby="fig-b1">
          <SectionTitle id="fig-b1" aside={<span className="font-mono text-[11px] text-muted print:hidden">{ar ? 'اضغط فئة لترى ما يخصّها' : 'Pick a segment to see what serves it'}</span>}>
            {ar ? 'الشكل ب.1 · نموذج العمل في صفحة واحدة' : 'Figure B.1 · The business model on one page'}
            <span className="ms-3 hidden font-sans text-[12px] text-muted print:inline">{ar ? 'الأزرق المفقود · AI Quest 2026 · القطاع 02' : 'Missing Blue · AI Quest 2026 · Sector 02'}</span>
          </SectionTitle>

          <div className="mt-4 flex flex-wrap items-center gap-2 print:hidden" role="group" aria-label={ar ? 'تصفية حسب الفئة' : 'Filter by segment'}>
            <button type="button" aria-pressed={active === null} onClick={() => setActive(null)} className={clsx('h-9 rounded-[3px] border px-3 text-[13px] font-semibold', active === null ? 'border-navy-900 bg-navy-900 text-white' : 'border-navy-900/40 text-navy-900 hover:bg-paper')}>{ar ? 'الكل' : 'Everyone'}</button>
            {SEGMENTS.map((s) => (
              <button key={s.id} type="button" aria-pressed={active === s.id} onClick={() => setActive(active === s.id ? null : s.id)} className={clsx('inline-flex h-9 items-center gap-2 rounded-[3px] border px-3 text-[13px] font-semibold', active === s.id ? 'border-navy-900 bg-paper-2 text-navy-900' : 'border-navy-900/25 text-ink-2 hover:bg-paper')}>
                <SegMark id={s.id} />
                <span className="font-mono text-[11px] text-muted">{s.tag}</span>
                <span>{t(s.short)}</span>
              </button>
            ))}
          </div>

          <div className="bmc-canvas mt-4 grid gap-px border border-navy-900 bg-navy-900/70 lg:grid-cols-10 xl:-mx-10 min-[1440px]:-mx-20 print:mx-0">
            <BlockCell b={{ id: 'segments', n: '01', title: { ar: 'شرائح العملاء', en: 'Customer segments' }, question: { ar: 'مَن يدفع؟', en: 'Who pays?' } }} active={active} className="order-1 lg:order-none lg:col-span-2 lg:col-start-9 lg:row-span-2 lg:row-start-1">
              <ul className="text-[13px] leading-[1.5]">
                {SEGMENTS.map((s) => (
                  <li key={s.id} className={clsx('border-t border-navy-900/10 py-2.5 transition-opacity duration-200 first:border-t-0', active && active !== s.id && 'opacity-25')}>
                    <p className="flex items-center gap-2 font-mono text-[10.5px] text-muted">
                      <SegMark id={s.id} size={10} />
                      <span>{s.tag}</span>
                      <span aria-hidden>·</span>
                      <span>{t(s.role)}</span>
                    </p>
                    <p className="mt-1 font-semibold text-navy-900">{t(s.name)}</p>
                    <p className="mt-1 text-[12.5px] leading-[1.5] text-ink-2">{t(s.why)}<Fn sources={s.sources} /></p>
                  </li>
                ))}
              </ul>
              <p className="mt-auto border-t border-navy-900/25 pt-3 text-[12.5px] leading-relaxed text-navy-900">{t(USERS)}</p>
            </BlockCell>
            <BlockCell b={BLOCKS.value} active={active} tone="key" className="order-2 lg:order-none lg:col-span-2 lg:col-start-5 lg:row-span-2 lg:row-start-1" />
            <BlockCell b={BLOCKS.channels} active={active} className="order-3 lg:order-none lg:col-span-2 lg:col-start-7 lg:row-start-2" />
            <BlockCell b={BLOCKS.relationships} active={active} className="order-4 lg:order-none lg:col-span-2 lg:col-start-7 lg:row-start-1" />
            <BlockCell b={BLOCKS.revenue} active={active} tone="key" className="order-5 lg:order-none lg:col-span-5 lg:col-start-6 lg:row-start-3" />
            <BlockCell b={BLOCKS.activities} active={active} className="order-6 lg:order-none lg:col-span-2 lg:col-start-3 lg:row-start-1" />
            <BlockCell b={BLOCKS.resources} active={active} className="order-7 lg:order-none lg:col-span-2 lg:col-start-3 lg:row-start-2" />
            <BlockCell b={BLOCKS.partners} active={active} className="order-8 lg:order-none lg:col-span-2 lg:col-start-1 lg:row-span-2 lg:row-start-1" />
            <BlockCell b={BLOCKS.costs} active={active} className="order-9 lg:order-none lg:col-span-5 lg:col-start-1 lg:row-start-3" />
          </div>
          <p className="caption mt-3 max-w-[100ch] print:hidden">
            {ar
              ? 'المربعات الملوّنة تربط كل سطر بالفئة التي يخدمها (أ، ب، ج، د، ف)؛ والمربع الفارغ يعني «للجميع». الأرقام الصغيرة تحيل إلى المصادر في آخر الصفحة.'
              : 'Coloured squares tie each line to the segment it serves (A, B, C, D, F); an empty square means “everyone”. Small numbers point to the sources at the end of the page.'}
          </p>
        </section>

        {/* Figure B.2: calculator */}
        <section className="mt-16 break-before-page print:mt-0" aria-labelledby="fig-b2">
          <SectionTitle id="fig-b2">{ar ? 'الشكل ب.2 · هل يستحق الدفع؟ احسبها بنفسك' : 'Figure B.2 · Does it pay? Work it out yourself'}</SectionTitle>
          <p className="mt-4 max-w-[80ch] text-[15.5px] leading-relaxed text-ink-2">
            {ar
              ? 'غيّر أي رقم. الحساب بسيط ومكشوف: الحالات الإضافية في السنة × المياه الموفّرة في الحالة × قيمة المتر، مقابل طول الخط × سعر الكيلومتر.'
              : 'Change any number. The arithmetic is simple and open: extra cases a year × water saved per case × value per m³, against line length × price per km.'}
          </p>
          <div className="mt-6"><Calculator /></div>
          <p className="mt-6 max-w-[95ch] border-s-2 border-navy-900 ps-4 text-[15px] leading-relaxed text-navy-900">
            <span className="font-semibold">{ar ? 'من أين يأتي الحجم؟ ' : 'Where scale comes from. '}</span>
            {t(SCALE.text)}
            <Fn sources={SCALE.sources} />
          </p>
        </section>

        {/* Figure B.3: path to revenue */}
        <section className="mt-16" aria-labelledby="fig-b3">
          <SectionTitle id="fig-b3">{ar ? 'الشكل ب.3 · طريق الإيراد' : 'Figure B.3 · The path to revenue'}</SectionTitle>
          <ol className="mt-6 grid gap-px border border-navy-900 bg-navy-900/70 md:grid-cols-4">
            {PATH.map((p, i) => (
              <li key={i} className={clsx('p-5', i === 0 ? 'bg-navy-900 text-white' : 'bg-surface')}>
                <p className={clsx('font-mono text-[11px]', i === 0 ? 'text-white/60' : 'text-muted')}>{String(i + 1).padStart(2, '0')} · {t(p.when)}</p>
                <p className={clsx('mt-2 font-display text-[21px] leading-tight', i === 0 ? 'text-white' : 'text-navy-900')}>{t(p.title)}</p>
                <p className={clsx('mt-2 text-[14px] leading-relaxed', i === 0 ? 'text-white/80' : 'text-ink-2')}>{t(p.body)}{p.sources && <Fn sources={p.sources} />}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Table B.1: risks */}
        <section className="mt-16" aria-labelledby="tab-b1">
          <SectionTitle id="tab-b1">{ar ? 'الجدول ب.1 · أخطر الافتراضات، وكيف نعرف أننا أخطأنا' : 'Table B.1 · Riskiest assumptions, and how we’d know we’re wrong'}</SectionTitle>
          <div className="relative overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[14.5px]">
              <thead>
                <tr className="border-b border-navy-900/30 text-[12.5px] text-muted">
                  <th className="w-[34%] py-3 pe-4 text-start font-medium">{ar ? 'الافتراض' : 'Assumption'}</th>
                  <th className="w-[33%] py-3 pe-4 text-start font-medium">{ar ? 'كيف تختبره التجربة' : 'How the pilot tests it'}</th>
                  <th className="py-3 text-start font-medium">{ar ? 'إن كان خاطئًا' : 'If it’s wrong'}</th>
                </tr>
              </thead>
              <tbody>
                {RISKS.map((r, i) => (
                  <tr key={i} className="border-b border-navy-900/10 align-top">
                    <td className="py-3.5 pe-4 text-navy-900">{t(r.assumption)}</td>
                    <td className="py-3.5 pe-4 text-ink-2">{t(r.test)}</td>
                    <td className="py-3.5 text-ink-2">{t(r.ifWrong)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Hard questions */}
        <section className="mt-16" aria-labelledby="qa">
          <SectionTitle id="qa">{ar ? 'أصعب الأسئلة التي نتوقعها، وجوابنا' : 'The hardest questions we expect, and our answers'}</SectionTitle>
          <dl className="mt-2 grid gap-x-10 lg:grid-cols-2">
            {QA.map((q, i) => (
              <div key={i} className="border-b border-navy-900/15 py-5">
                <dt className="font-display text-[19px] leading-snug text-navy-900">{t(q.q)}</dt>
                <dd className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{t(q.a)}{q.sources && <Fn sources={q.sources} />}</dd>
              </div>
            ))}
            <div className="py-5">
              <dt className="font-mono text-[11px] text-muted">{ar ? 'وإن سُئلنا: هل جُرّب هذا في الأردن؟' : 'And if asked whether this has been tried in Jordan'}</dt>
              <dd className="mt-2 text-[14.5px] leading-relaxed text-ink-2">{t(PRECEDENT.text)}<Fn sources={PRECEDENT.sources} /></dd>
            </div>
          </dl>
        </section>

        {/* Why now */}
        <section className="mt-16" aria-labelledby="why-now">
          <SectionTitle id="why-now">{ar ? 'لماذا الآن' : 'Why now'}</SectionTitle>
          <ol className="mt-6 grid gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-3">
            {WHY_NOW.map((w, i) => (
              <li key={i} className="border-t-2 border-navy-900 pt-3">
                <p className="num font-mono text-[12px] font-semibold text-navy-900" dir="ltr" data-num="">{t(w.when)}</p>
                <p className="mt-1.5 text-[14.5px] leading-relaxed text-ink-2">{t(w.what)}<Fn sources={w.sources} /></p>
              </li>
            ))}
          </ol>
        </section>

        {/* Sources */}
        <section className="mt-16" aria-labelledby="bmc-sources">
          <SectionTitle id="bmc-sources" aside={<span className="font-mono text-[11px] text-muted">{ar ? `تحقّقنا منها في 2026-10-10 · ${n(cited.length)} مصدرًا` : `Checked 2026-10-10 · ${n(cited.length)} sources`}</span>}>
            {ar ? 'المصادر' : 'Sources'}
          </SectionTitle>
          <ol className="mt-4 grid gap-x-10 gap-y-2 text-[13px] leading-snug md:grid-cols-2">
            {cited.map(([k, s]) => (
              <li key={k} id={`src-${k}`} className="flex scroll-mt-24 gap-3 break-inside-avoid">
                <span className="num w-7 shrink-0 font-mono text-[12px] text-muted" dir="ltr">{k}</span>
                <span className="min-w-0">
                  <a href={s.url} target="_blank" rel="noreferrer" className="break-words text-ink-2 underline decoration-navy-900/20 underline-offset-4 hover:text-navy-900" lang="en" dir="ltr">{s.publisher}</a>{' '}
                  <span className="num font-mono text-[11.5px] text-muted" dir="ltr">· {s.date}</span>
                </span>
              </li>
            ))}
          </ol>
        </section>

        <p className="mt-16 flex flex-wrap gap-x-6 gap-y-2 border-t border-navy-900/20 pt-6 text-[13.5px] print:hidden">
          <Link to="/" className="text-navy-900 underline underline-offset-4">{ar ? 'الصفحة الرئيسية' : 'Landing page'}</Link>
          <Link to="/app" className="text-navy-900 underline underline-offset-4">{ar ? 'لوحة العمليات' : 'Operations console'}</Link>
          <Link to="/app/eval" className="text-navy-900 underline underline-offset-4">{ar ? 'تقييم الاستخراج' : 'Extraction evaluation'}</Link>
        </p>
      </main>
    </div>
  )
}
