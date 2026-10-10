import clsx from 'clsx'
import { BadgeCheck, Camera, Droplets, Landmark, Library, Play, Route, ShieldAlert, Smartphone, Sprout, Users, Wrench } from 'lucide-react'
import { Container, Fn } from '../components/ui'
import { LogoMark, Wordmark } from '../components/Logo'
import { useLang, type Text } from '../i18n/lang'
import { MARKET, VERIFIED_ON } from '../data/facts'
import { SOURCE_LIST } from '../data/sources'
import stats from '../data/generated/stats.json'
import { EvalStrip } from './EvalStrip'
import { BusinessStrip } from './BusinessStrip'
import { CARD, CHIP, Cta, GLASS, LIFT, PILL, SectionHead } from './kit'

/* ------------------------------ § 04 Where the AI is ------------------------------ */

export function AIHonesty() {
  const { lang, t } = useLang()
  const ar = lang === 'ar'
  const rows: { part: Text; ai: boolean; how: Text }[] = [
    { part: { ar: 'تحويل البلاغ العربي إلى حقول', en: 'Arabic report → structured fields' }, ai: true, how: { ar: 'نموذج لغوي يُلزَم بذكر الكلمات التي استند إليها؛ وإن لم يجدها في النص يبقى الحقل فارغًا', en: 'A language model that must cite the words it used; if they are not in the text, the field stays empty' } },
    { part: { ar: 'الإدخال الصوتي', en: 'Voice input' }, ai: true, how: { ar: 'إضافة اختيارية فوق النص', en: 'An optional extra on top of text' } },
    { part: { ar: 'مقارنة الصور الفضائية', en: 'Satellite image comparison' }, ai: false, how: { ar: 'مؤشرات NDVI وNDMI للشهر الجاف نفسه عبر السنين', en: 'NDVI and NDMI for the same dry month across years' } },
    { part: { ar: 'ترتيب المواقع', en: 'Ranking sites' }, ai: false, how: { ar: 'صيغة معلنة: القرب من الخط، والعزلة، وشدة التغيّر، والاستمرار، والحجم', en: 'A published formula: distance to line, isolation, change, persistence, size' } },
    { part: { ar: 'فحوصات الخريطة والتحويل إلى نظام المرفق', en: 'Map checks and conversion to the utility’s CRS' }, ai: false, how: { ar: 'قواعد هندسية وتحويل إحداثيات صريح إلى EPSG:28191', en: 'Geometric rules and an explicit transform to EPSG:28191' } },
    { part: { ar: 'الاعتماد', en: 'Approval' }, ai: false, how: { ar: 'إنسان دائمًا', en: 'Always a person' } },
  ]
  return (
    <section className="pt-24 sm:pt-32">
      <Container>
        <SectionHead
          index="04"
          eyebrow={ar ? 'الصدق التقني' : 'Technical honesty'}
          title={ar ? 'أين الذكاء الاصطناعي، وأين لا' : 'Where the AI is, and where it isn’t'}
          lead={ar ? 'نستخدمه حيث يضيف قيمة حقيقية فقط، ونسمّي الباقي باسمه: طرق قياسية معروفة.' : 'We use it only where it adds real value, and call everything else what it is: standard, well-understood methods.'}
        />
        <div className={clsx(CARD, 'mt-14 overflow-hidden')}>
        <table className="w-full text-[15px]">
          <caption className="caption border-t border-hair bg-canvas/50 px-5 py-4 text-start caption-bottom">
            <span className={clsx(PILL, 'me-3')}>{ar ? 'الجدول 1' : 'Table 1'}</span>
            {ar ? 'ما نعرضه بصدق: دقّة الاستخراج على 25 بلاغًا لم تُستخدم في التطوير مقارنةً بقواعد بسيطة، وصفر عناصر غير مؤكّدة ظهرت على أنها مؤكّدة. لا ندّعي دقّة رصد قبل وجود حقيقة أرضية.' : 'What we can honestly show: extraction accuracy on 25 reports never used in development against simple rules, and zero unconfirmed items ever shown as confirmed. We claim no detection accuracy before there is ground truth.'}
          </caption>
          <thead>
            <tr className="border-b border-hair bg-canvas/60 text-start font-mono text-[11px] text-ink-soft">
              <th className="py-3 pe-3 ps-4 text-start font-normal sm:pe-4 sm:ps-6">{ar ? 'الجزء' : 'Part'}</th>
              <th className="px-3 py-3 text-start font-normal sm:px-4">{ar ? 'ذكاء اصطناعي؟' : 'AI?'}</th>
              <th className="py-3 pe-4 ps-3 text-start font-normal sm:pe-6 sm:ps-4">{ar ? 'كيف' : 'How'}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-hair/70 transition-colors last:border-0 hover:bg-canvas/50">
                <td className="py-4 pe-3 ps-4 font-medium text-navy-900 sm:pe-4 sm:ps-6">{t(r.part)}</td>
                <td className="px-3 py-4 sm:px-4">
                  <span className={clsx('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 font-mono text-[12px] font-semibold ring-1', r.ai ? 'bg-signal-50 text-signal-700 ring-signal-100' : 'bg-canvas text-ink-soft ring-hair')}>
                    <span className={clsx('size-2 rounded-full', r.ai ? 'bg-signal-500' : 'border border-ink-soft/60')} aria-hidden />
                    {r.ai ? (ar ? 'نعم' : 'Yes') : ar ? 'لا' : 'No'}
                  </span>
                </td>
                <td className="py-4 pe-4 ps-3 text-ink-2 sm:pe-6 sm:ps-4">{t(r.how)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>

        <EvalStrip />

        <div className="mt-6 grid gap-4 md:grid-cols-3 md:gap-6">
          {[
            { h: { ar: 'حقيقي ويعمل الآن', en: 'Real, working now' }, mark: 'bg-emerald-500', pill: 'bg-emerald-50 text-emerald-800 ring-emerald-200', dot: 'bg-emerald-500', items: [
              { ar: 'صور Sentinel-2 ومؤشر NDVI لكل موقع، 2017–2026', en: 'Sentinel-2 imagery and per-site NDVI, 2017–2026' },
              { ar: 'ترتيب المواقع بالصيغة المعلنة', en: 'Site ranking with the published formula' },
              { ar: 'استخراج الحقول العربية (قواعد، وClaude عند توفّر المفتاح)', en: 'Arabic field extraction (rules, and Claude when a key is set)' },
              { ar: 'التصدير بصيغة wMain إلى EPSG:28191', en: 'Export in wMain format to EPSG:28191' },
            ] },
            { h: { ar: 'محاكى وموسوم', en: 'Simulated and labelled' }, mark: 'border-[1.5px] border-dashed border-amber-700', pill: 'bg-amber-50 text-amber-800 ring-amber-200', dot: 'bg-amber-500', items: [
              { ar: 'مسار الخط (توضيحي، لا المسار الحقيقي)', en: 'The pipeline route (illustrative, not the real one)' },
              { ar: 'بلاغات الفرق في العرض (اصطناعية)', en: 'Crew reports in the demo (synthetic)' },
              { ar: 'قائمة الاستخدامات المرخّصة', en: 'The licensed-use list' },
            ] },
            { h: { ar: 'لم يُبنَ بعد', en: 'Not built yet' }, mark: 'border-[1.5px] border-dotted border-ink-2', pill: 'bg-canvas text-ink-2 ring-hair-2', dot: 'bg-ink-soft/50', items: [
              { ar: 'الكتابة المباشرة إلى قاعدة مياهنا (Esri)', en: 'Writing straight into Miyahuna’s Esri database' },
              { ar: 'تسجيل الدخول والصلاحيات وقاعدة «لا يعتمد أحد عمله بنفسه»', en: 'Sign-in, roles and the four-eyes rule' },
              { ar: 'رادار NISAR المجاني للتسرّب تحت السطح', en: 'Free NISAR radar for below-surface leaks' },
            ] },
          ].map((col, i) => (
            <div key={i} className={clsx(CARD, 'p-6')}>
              <p className={clsx('inline-flex items-center gap-2 rounded-full px-3 py-1 text-[14.5px] font-semibold ring-1', col.pill)}><span className={clsx('inline-block size-2.5 rounded-full', col.mark)} aria-hidden />{t(col.h)}</p>
              <ul className="mt-5 grid gap-2.5 text-[15px] leading-relaxed text-ink-2">
                {col.items.map((it, j) => <li key={j} className="flex gap-2.5"><span className={clsx('mt-[0.72em] size-1.5 shrink-0 rounded-full', col.dot)} aria-hidden /><span>{t(it)}</span></li>)}
              </ul>
            </div>
          ))}
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------ § 05 Live demo ------------------------------ */

export function DemoBand() {
  const { lang, t } = useLang()
  const ar = lang === 'ar'
  const steps: { label: Text; real?: boolean }[] = [
    { label: { ar: 'صورة فضائية حقيقية', en: 'A real satellite image' }, real: true },
    { label: { ar: 'موقع مرتّب «يستحق الفحص»', en: 'A ranked “worth inspecting” site' } },
    { label: { ar: 'بلاغ ميداني بالعربية', en: 'An Arabic field report' } },
    { label: { ar: 'حقول مستخرجة بكلماتها', en: 'Fields with their source words' } },
    { label: { ar: 'مسودة تعديل متقطّعة', en: 'A dashed draft map edit' } },
    { label: { ar: 'اعتماد المهندس', en: 'Engineer approval' } },
    { label: { ar: 'تصدير بصيغة مياهنا', en: 'Export in Miyahuna’s format' } },
  ]
  return (
    <section id="demo" className="mt-24 scroll-mt-28 px-2.5 sm:mt-32 sm:px-4">
      <div className="lp-dark mb-hero relative isolate overflow-hidden rounded-[24px] py-20 text-white shadow-[0_40px_90px_-45px_rgb(1_28_71/0.9)] sm:rounded-[32px] sm:py-28">
      <div className="mb-hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <LogoMark className="pointer-events-none absolute -bottom-24 end-[4%] h-[420px] w-auto text-white opacity-[0.05]" />
      <Container className="relative">
        <SectionHead
          invert
          index="05"
          eyebrow={ar ? 'العرض الحي' : 'Live demo'}
          title={ar ? 'سبع خطوات، من الصورة إلى سجل معتمد' : 'Seven steps, from image to approved record'}
          lead={ar ? 'الحقيقي: الصور الفضائية. والموسوم «توضيحي» أو «اصطناعي»: مسار الخط والشبكة وبلاغات الفرق.' : 'Real: the satellite images. Labelled illustrative or synthetic: the pipeline route, the network and the crew reports.'}
        />
        <ol className="mt-14 grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-7">
          {steps.map((s, i) => (
            <li key={i} className={clsx(GLASS, 'flex flex-col p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-signal-300/40 hover:bg-white/[0.09]')}>
              <p className="grid size-9 place-items-center rounded-[10px] bg-signal-400/15 font-mono text-[12px] font-semibold text-signal-200 ring-1 ring-signal-300/25" dir="ltr" data-num="">{String(i + 1).padStart(2, '0')}</p>
              <p className="mt-4 font-display text-[17px] leading-snug text-white sm:text-[19px]">{t(s.label)}</p>
              {s.real && <p className="mt-3 inline-flex w-fit items-center gap-1.5 rounded-full bg-emerald-400/15 px-2.5 py-0.5 font-mono text-[11px] text-emerald-200 ring-1 ring-emerald-300/30"><span className="size-1.5 rounded-full bg-emerald-400" aria-hidden />{ar ? 'حقيقي' : 'real'}</p>}
            </li>
          ))}
        </ol>
        <div className="mt-12 flex flex-wrap gap-3">
          <Cta to="/app/map?demo=1" variant="light" size="lg"><Play className="size-4" aria-hidden />{ar ? 'ابدأ العرض الحي' : 'Start the live demo'}</Cta>
          <Cta to="/crew" variant="glass" size="lg"><Smartphone className="size-4" aria-hidden />{ar ? 'تطبيق الفريق الميداني' : 'Field crew app'}</Cta>
        </div>
      </Container>
      </div>
    </section>
  )
}

/* ------------------------------ § 06 Comparison ------------------------------ */

type Cell = 'yes' | 'no' | 'part' | 'unknown' | 'na'
function Cellv({ v, note }: { v: Cell; note?: string }) {
  const { lang } = useLang()
  const sym = { yes: '●', no: '○', part: '◐', unknown: '—', na: '·' }[v]
  const label = { yes: lang === 'ar' ? 'نعم' : 'Yes', no: lang === 'ar' ? 'لا' : 'No', part: lang === 'ar' ? 'جزئيًا' : 'Partly', unknown: lang === 'ar' ? 'لا دليل منشور' : 'No published evidence', na: lang === 'ar' ? 'لا ينطبق' : 'n/a' }[v]
  return (
    <span className="inline-flex flex-col items-center gap-1">
      <span className={clsx('text-[16px] leading-none', v === 'yes' ? 'text-signal-600' : 'text-navy-900/45')} aria-hidden>{sym}</span>
      <span className="sr-only">{label}</span>
      {note && <span className="max-w-[9rem] text-center text-[11px] leading-tight text-muted">{note}</span>}
    </span>
  )
}

export function Different() {
  const { lang, t } = useLang()
  const ar = lang === 'ar'
  const cols = ['Missing Blue', 'ASTERRA', 'Origin Tech', 'Flowless', 'Esri']
  const rows: { label: Text; cells: { v: Cell; note?: Text }[] }[] = [
    { label: { ar: 'يراقب ممرات الخطوط الرئيسية في الأرض الجافة', en: 'Watches main-line corridors in dry open land' }, cells: [{ v: 'yes' }, { v: 'part', note: { ar: 'شبكات حضرية وريفية', en: 'urban & rural networks' } }, { v: 'part', note: { ar: 'شبكات المرافق', en: 'utility networks' } }, { v: 'no' }, { v: 'na' }] },
    { label: { ar: 'يرشّح حالات السرقة لا التسرّب فقط', en: 'Flags theft candidates, not only leaks' }, cells: [{ v: 'yes' }, { v: 'no' }, { v: 'no' }, { v: 'unknown' }, { v: 'na' }] },
    { label: { ar: 'يعمل على صور مجانية', en: 'Runs on free imagery' }, cells: [{ v: 'yes', note: { ar: 'Sentinel-2', en: 'Sentinel-2' } }, { v: 'no', note: { ar: 'رادار ALOS-2 مدفوع', en: 'paid ALOS-2 radar' } }, { v: 'unknown', note: { ar: 'لا يسمّي أقماره', en: 'satellites not named' } }, { v: 'na' }, { v: 'na' }] },
    { label: { ar: 'لا يحتاج أجهزة تُركّب في الشبكة', en: 'Needs no hardware in the network' }, cells: [{ v: 'yes' }, { v: 'yes' }, { v: 'yes' }, { v: 'no', note: { ar: 'حسّاسات تدفّق وضغط', en: 'flow & pressure sensors' } }, { v: 'na' }] },
    { label: { ar: 'إبلاغ ميداني بالعربية', en: 'Arabic field reporting' }, cells: [{ v: 'yes' }, { v: 'unknown' }, { v: 'unknown' }, { v: 'unknown' }, { v: 'unknown' }] },
    { label: { ar: 'يكتب النتائج في سجلات المرفق نفسه', en: 'Writes results into the utility’s own records' }, cells: [{ v: 'yes', note: { ar: 'wMain · EPSG:28191', en: 'wMain · EPSG:28191' } }, { v: 'unknown' }, { v: 'unknown' }, { v: 'unknown' }, { v: 'part', note: { ar: 'المنصة التي نصدّر إليها', en: 'the platform we export to' } }] },
  ]
  return (
    <section id="different" className="scroll-mt-28 pt-24 sm:pt-32">
      <Container>
        <SectionHead
          index="06"
          eyebrow={ar ? 'المقارنة' : 'Comparison'}
          title={ar ? 'لم نجد من يجمع الأربعة معًا' : 'No one we found combines all four'}
          lead={ar ? 'مراقبة ممرات الخطوط الرئيسية، وترشيح التسرّب والسرقة معًا، والإبلاغ الميداني بالعربية، وكتابة النتائج في سجلات المرفق. وEsri ليست منافسًا: هي المنصة التي نصدّر إليها.' : 'Watching main-line corridors, flagging leaks and theft, Arabic field reporting, and writing results back into the utility’s records. Esri is not a competitor: it is where our edits go.'}
        />
        <div className={clsx(CARD, 'relative mt-14 overflow-x-auto scrollbar-thin')}>
          <table className="w-full min-w-[760px] text-[15px]">
            <thead>
              <tr className="border-b border-hair bg-canvas/60">
                <th className="w-[36%] py-4 pe-4 ps-6 text-start font-mono text-[11px] font-normal text-ink-soft">{ar ? 'القدرة' : 'Capability'}</th>
                {cols.map((c, i) => (
                  <th key={c} className={clsx('px-3 py-4 text-center text-[14px] font-semibold', i === 0 ? 'bg-gradient-to-b from-signal-500 to-signal-700 text-white' : 'text-navy-900/80')} lang="en">{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-b border-hair/70 transition-colors last:border-0 hover:bg-canvas/40">
                  <td className="py-4 pe-4 ps-6 text-navy-900">{t(r.label)}</td>
                  {r.cells.map((c, j) => (
                    <td key={j} className={clsx('px-3 py-4 text-center align-top', j === 0 && 'bg-signal-50')}>
                      <Cellv v={c.v} note={c.note ? t(c.note) : undefined} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="caption mt-4">
          <span className={clsx(PILL, 'me-3')}>{ar ? 'الجدول 2' : 'Table 2'}</span>
          {ar ? '● نعم · ◐ جزئيًا · ○ لا · — لا دليل منشور (لا يعني أن الشركة لا تفعل ذلك).' : '● yes · ◐ partly · ○ no · — no published evidence (not proof the company cannot).'}
          <Fn url={MARKET.asterra.source.url} />
          <Fn url={MARKET.originThames.source.url} />
          <Fn url={MARKET.flowless.source.url} />
        </p>

        <div className="mt-10 grid gap-4 md:grid-cols-2 md:gap-6">
          <p className={clsx(CARD, 'p-6 text-[16px] leading-[1.85] text-ink-2 sm:p-7')}>{t(MARKET.originThames.text)}<Fn url={MARKET.originThames.source.url} /></p>
          <p className={clsx(CARD, 'p-6 text-[16px] leading-[1.85] text-ink-2 sm:p-7')}><span className="font-semibold text-navy-900">{ar ? 'ما يتغيّر: ' : 'What is changing: '}</span>{t(MARKET.nisar.text)}<Fn url={MARKET.nisar.source.url} /></p>
        </div>
      </Container>
    </section>
  )
}

/* ------------------------------ § 07 Pilot ------------------------------ */

export function Pilot() {
  const { lang, t } = useLang()
  const ar = lang === 'ar'
  const bands: { from: number; to: number; label: Text; body: Text; strong?: boolean }[] = [
    { from: 1, to: 2, label: { ar: 'خط أساس', en: 'Baseline' }, body: { ar: 'نقيس كلفة الدوريات اليوم، وكم مرة تُعاد مخططات المقاولين.', en: 'Measure what patrols cost today and how often contractor drawings are sent back.' } },
    { from: 3, to: 10, label: { ar: 'الدورة الأسبوعية', en: 'Weekly loop' }, body: { ar: 'رصد ← زيارة ← بلاغ ← اعتماد، على ممر واحد ومنطقة واحدة.', en: 'Detect → visit → report → approve, on one corridor and one district.' }, strong: true },
    { from: 11, to: 12, label: { ar: 'التقييم', en: 'Evaluation' }, body: { ar: 'الحالات المؤكّدة مقابل الدوريات، والكلفة لكل حالة، ونسبة إعادة المخططات.', en: 'Confirmed cases vs patrols, cost per confirmed case, drawing rework rate.' } },
  ]
  return (
    <section id="pilot" className="scroll-mt-28 pt-24 sm:pt-32">
      <Container>
        <SectionHead
          index="07"
          eyebrow={ar ? 'الجدوى والتوسّع' : 'Feasibility & scale'}
          title={ar ? 'تجربة ممولة: ممر واحد، منطقة واحدة، 12 أسبوعًا' : 'A funded pilot: one corridor, one district, 12 weeks'}
          lead={ar ? 'لا نسعّر قبل أن نقيس كلفة الدوريات وإعادة العمل الحالية. الصور مجانية، فالكلفة في التشغيل لا في البيانات، والتوسّع يكون ممرًّا بعد ممر.' : 'We won’t quote a price before measuring what patrols and rework cost today. Imagery is free, so cost sits in operations, not data, and scaling goes corridor by corridor.'}
        />

        <figure className={clsx(CARD, 'mt-14 p-3 sm:p-7')}>
          <div className="relative">
            <div className="grid grid-cols-12 overflow-hidden rounded-[10px] bg-canvas ring-1 ring-hair">
              {Array.from({ length: 12 }, (_, i) => (
                <div key={i} className={clsx('h-9 border-hair font-mono text-[10.5px] text-ink-soft', i > 0 && 'border-s')}>
                  <span className="block px-1.5 pt-1">{i + 1}</span>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-12 gap-y-2 pt-2">
              {bands.map((b, i) => (
                <div key={i} title={t(b.label)} className={clsx('min-w-0 rounded-[10px] px-1 py-3 sm:mx-0.5 sm:px-3', b.strong ? 'bg-gradient-to-b from-signal-500 to-signal-700 text-white shadow-[0_10px_22px_-12px_rgb(42_139_255/0.9)]' : 'bg-signal-50 text-navy-900 ring-1 ring-inset ring-signal-200')} style={{ gridColumn: `${b.from} / ${b.to + 1}`, gridRow: 1 }}>
                  <p className="truncate text-[11px] font-semibold sm:text-[14px]">{t(b.label)}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-6 grid gap-3 md:grid-cols-3">
            {bands.map((b, i) => (
              <div key={i} className="rounded-[12px] bg-canvas p-4 ring-1 ring-hair/70 sm:p-5">
                <p className={PILL} dir="ltr" data-num="">{ar ? `أسبوع ${b.from}–${b.to}` : `Weeks ${b.from}–${b.to}`}</p>
                <p className="mt-3 font-display text-[22px] font-semibold text-navy-900">{t(b.label)}</p>
                <p className="mt-2 text-[15px] leading-relaxed text-ink-2">{t(b.body)}</p>
              </div>
            ))}
          </div>
        </figure>

        <div className="mt-6 grid gap-4 md:grid-cols-2 md:gap-6">
          <div className={clsx(CARD, 'p-6 sm:p-7')}>
            <p className="flex items-center gap-3 font-mono text-[11px] text-ink-soft"><span className={clsx(CHIP, 'size-9 rounded-[10px]')}><Users className="size-[18px]" aria-hidden /></span>{ar ? 'المشترون' : 'Buyers'}</p>
            <dl className="mt-5 grid gap-3">
              <div className="rounded-[12px] bg-canvas p-4"><dt className="text-[13px] text-ink-soft">{ar ? 'الأول' : 'First'}</dt><dd className="mt-1 font-display text-[21px] font-semibold leading-snug text-navy-900">{ar ? 'سلطة المياه: وحدة الرقابة الداخلية ووحدة الفاقد المركزية' : 'Water Authority: Internal Control and Central NRW units'}</dd></div>
              <div className="rounded-[12px] bg-canvas p-4"><dt className="text-[13px] text-ink-soft">{ar ? 'الثاني' : 'Second'}</dt><dd className="mt-1 font-display text-[21px] font-semibold leading-snug text-navy-900">{ar ? 'مياهنا: مديرية نظم المعلومات الجغرافية' : 'Miyahuna: GIS Directorate'}</dd></div>
            </dl>
          </div>
          <div className={clsx(CARD, 'p-6 sm:p-7')}>
            <p className="flex items-center gap-3 font-mono text-[11px] text-ink-soft"><span className={clsx(CHIP, 'size-9 rounded-[10px]')}><Landmark className="size-[18px]" aria-hidden /></span>{ar ? 'سوابق تمويل' : 'Funding precedents'}</p>
            <ul className="mt-5 grid gap-3 text-[15.5px] leading-relaxed text-ink">
              <li className="rounded-[12px] bg-canvas p-4">{t(MARKET.jica.text)}<Fn url={MARKET.jica.source.url} /></li>
              <li className="rounded-[12px] bg-canvas p-4">{t(MARKET.spain.text)}<Fn url={MARKET.spain.source.url} /></li>
            </ul>
          </div>
        </div>

        <BusinessStrip />
      </Container>
    </section>
  )
}

/* ------------------------------ § 08 Data appendix ------------------------------ */

export function DataStack() {
  const { lang, n } = useLang()
  const ar = lang === 'ar'
  const rows: { v: number; label: Text }[] = [
    { v: stats.facts, label: { ar: 'رقمًا وادّعاءً تحقّقنا منها من مصادرها', en: 'numbers and claims checked against their sources' } },
    { v: stats.theft_events, label: { ar: 'حادثة سرقة مياه من الأخبار العامة، 2018–2026', en: 'water-theft events from public news, 2018–2026' } },
    { v: stats.supply_events, label: { ar: 'كسرًا وانقطاعًا مسجّلًا', en: 'breaks and supply interruptions logged' } },
    { v: stats.wapor_new_et_patches, label: { ar: 'رقعة تبخّر جديدة في أراضٍ جافة (FAO WaPOR)', en: 'new dry-land evapotranspiration patches (FAO WaPOR)' } },
    { v: stats.corridors, label: { ar: 'ممرات نقل رئيسية موثّقة المصدر', en: 'main transmission corridors with provenance' } },
    { v: stats.nrw_values, label: { ar: 'قيمة فاقد تاريخية', en: 'historical water-loss values' } },
    { v: stats.kartaview_photos_corridors ?? 0, label: { ar: 'صورة شارع مفتوحة على ممرّين', en: 'open street photos along two corridors' } },
    { v: stats.sources, label: { ar: 'مصدرًا مفهرسًا بالترخيص والحالة', en: 'sources catalogued with licence and status' } },
  ]
  const icons = [BadgeCheck, ShieldAlert, Wrench, Sprout, Route, Droplets, Camera, Library]
  const rules: Text[] = [
    { ar: 'مسارات الخطوط ومواقع الآبار والمضخات بيانات مقيّدة: لا تُنشر، والعرض يستخدم مسارًا توضيحيًا.', en: 'Line routes, wells and pumps are restricted: never published; the demo uses an illustrative route.' },
    { ar: 'لا أسماء أشخاص ولا أرقام اشتراكات: نعدّ الأحداث لا الأفراد.', en: 'No personal names or subscriber IDs: we count events, not people.' },
    { ar: 'Google للعرض فقط: شروطه تمنع تخزين محتواه أو التدريب عليه أو رسم الخطوط من صوره.', en: 'Google is display-only: its terms forbid storing it, training on it, or tracing lines from it.' },
  ]
  return (
    <section id="data" className="scroll-mt-28 pt-24 sm:pt-32">
      <Container>
        <SectionHead
          index="08"
          eyebrow={ar ? 'ملحق البيانات' : 'Data appendix'}
          title={ar ? 'مبني على بيانات عامة، مدقّقة ومفهرسة' : 'Built on public data, checked and catalogued'}
          lead={ar ? 'جمعنا قبل بناء الواجهة ما يمكن جمعه قانونيًا من المصادر العامة، وراجع مدقّق مستقل كل مجموعة.' : 'Before building the interface we gathered what can legally be gathered from public sources, and an independent checker reviewed every set.'}
        />
        <dl className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {rows.map((x, i) => {
            const Icon = icons[i]
            return (
            <div key={i} className={clsx(CARD, LIFT, 'flex min-w-0 flex-col p-4 sm:p-5')}>
              <span className={clsx(CHIP, 'mb-4 size-9 sm:size-10')}><Icon className="size-[18px]" aria-hidden /></span>
              <dd className="num font-display text-[clamp(1.75rem,3vw,2.7rem)] font-semibold leading-none text-navy-900" dir="ltr" data-num="">{n(x.v)}</dd>
              <dt className="mt-3 text-[13px] leading-snug text-ink-2 sm:text-[14px]">{ar ? x.label.ar : x.label.en}</dt>
            </div>
            )
          })}
        </dl>
        <ol className="mt-6 grid gap-3 md:grid-cols-3 md:gap-4">
          {rules.map((r, i) => (
            <li key={i} className="flex gap-3 rounded-[14px] border border-hair/80 bg-card p-4 text-[15px] leading-relaxed text-ink shadow-[0_1px_2px_rgb(1_28_71/0.04)]">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-signal-50 font-mono text-[10.5px] font-semibold text-signal-700 ring-1 ring-signal-100" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
              <span>{ar ? r.ar : r.en}</span>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

/* ------------------------------ § 09 Sources ------------------------------ */

export function Sources() {
  const { lang } = useLang()
  const ar = lang === 'ar'
  return (
    <section id="sources" className="scroll-mt-28 pt-24 sm:pt-32">
      <Container>
        <SectionHead index="09" eyebrow={ar ? 'المصادر' : 'Sources'} title={ar ? 'كل رقم، ومن أين جاء' : 'Every number, and where it came from'} lead={ar ? `تحقّقنا من كل مصدر في هذه القائمة بتاريخ ${VERIFIED_ON}.` : `Every source in this list was checked on ${VERIFIED_ON}.`} />
        <ol className={clsx(CARD, 'mt-12 columns-1 gap-12 p-5 sm:p-8 md:columns-2')} dir="ltr">
          {SOURCE_LIST.map((s, i) => (
            <li key={s.url} id={`src-${i + 1}`} className="mb-4 flex break-inside-avoid gap-3 text-[13.5px] leading-relaxed scroll-mt-40">
              <span className="mt-px grid h-6 min-w-7 shrink-0 place-items-center rounded-full bg-signal-50 px-1.5 font-mono text-[11px] font-semibold text-signal-700 ring-1 ring-signal-100">{i + 1}</span>
              <span>
                <a href={s.url} target="_blank" rel="noreferrer" className="text-navy-900 underline decoration-navy-900/25 underline-offset-4 hover:decoration-navy-900">{s.publisher}</a>
                <span className="text-muted"> · {s.date}</span>
              </span>
            </li>
          ))}
        </ol>
      </Container>
    </section>
  )
}

/* ------------------------------ Colophon ------------------------------ */

export function Closing() {
  const { lang } = useLang()
  const ar = lang === 'ar'
  return (
    <section className="px-2.5 pt-24 sm:px-4 sm:pt-32">
      <div className="lp-dark mb-hero relative isolate overflow-hidden rounded-[24px] text-white shadow-[0_40px_90px_-45px_rgb(1_28_71/0.9)] sm:rounded-[32px]">
      <div className="mb-hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <LogoMark className="pointer-events-none absolute -bottom-20 end-[5%] h-[360px] w-auto text-white opacity-[0.05]" />
      <Container className="relative">
        <div className="grid items-end gap-10 py-14 sm:py-20 lg:grid-cols-12">
          <h2 className="text-[clamp(2.1rem,4.4vw,3.6rem)] font-semibold leading-[1.2] text-white lg:col-span-8">
            {ar ? 'ممر واحد ومنطقة واحدة يكفيان لنعرف إن كان هذا يعمل.' : 'One corridor and one district are enough to know whether this works.'}
          </h2>
          <div className="lg:col-span-4">
            <p className="text-[16px] leading-[1.85] text-white/75">{ar ? 'نطلب من سلطة المياه ومياهنا ممرًّا للتجربة، وقائمة الاستخدامات المرخّصة، ومهندسًا يعتمد ما نجده.' : 'We ask the Water Authority and Miyahuna for one pilot corridor, the list of licensed uses, and one engineer to approve what we find.'}</p>
            <Cta to="/app/map?demo=1" size="lg" className="mt-6"><Play className="size-4" aria-hidden />{ar ? 'شاهد العرض الحي' : 'Watch the live demo'}</Cta>
          </div>
        </div>
      </Container>
      </div>
    </section>
  )
}

export function Footer() {
  const { lang } = useLang()
  const ar = lang === 'ar'
  return (
    <footer className="lp-dark mb-hero relative mt-24 overflow-hidden text-white sm:mt-32">
      <div className="mb-hero-grid pointer-events-none absolute inset-0" aria-hidden />
      <Container className="relative py-16">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-5">
            <Wordmark size="lg" tone="white" />
            <p className="mt-6 max-w-[420px] text-[15px] leading-relaxed text-white/70">
              {ar ? 'منصة تكشف أين تضيع المياه، وترسل الفرق للتحقق، وتحوّل ما تجده إلى سجلات موثّقة دائمة.' : 'One platform that finds where water goes missing, sends crews to check, and turns what they find into permanent, verified records.'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-[14px] lg:col-span-7 lg:grid-cols-3">
            <div>
              <p className="font-mono text-[11px] text-white/55">{ar ? 'المنتج' : 'Product'}</p>
              <ul className="mt-3 grid gap-2 text-white/80">
                <li><a href="#/app" className="hover:text-white">{ar ? 'لوحة العمليات' : 'Operations console'}</a></li>
                <li><a href="#/crew" className="hover:text-white">{ar ? 'تطبيق الفريق' : 'Crew app'}</a></li>
                <li><a href="#/app/eval" className="hover:text-white">{ar ? 'تقييم الاستخراج' : 'Extraction evaluation'}</a></li>
                <li><a href="#/bmc" className="hover:text-white">{ar ? 'نموذج العمل' : 'Business model'}</a></li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] text-white/55">{ar ? 'البيانات المفتوحة' : 'Open data'}</p>
              <ul className="mt-3 grid gap-2 text-white/80" dir="ltr">
                <li>Copernicus Sentinel-2</li>
                <li>ESA WorldCover · FAO WaPOR</li>
                <li>© OpenStreetMap contributors</li>
              </ul>
            </div>
            <div>
              <p className="font-mono text-[11px] text-white/55">{ar ? 'الحدث' : 'Event'}</p>
              <ul className="mt-3 grid gap-2 text-white/80" dir="ltr">
                <li>AI Quest 2026</li>
                <li>Future Jordan Hackathon</li>
                <li>Sector 02 · next.society()</li>
              </ul>
            </div>
          </div>
        </div>
        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-t border-white/15 pt-6 font-mono text-[11px] text-white/55" dir="ltr">
          <span className="flex items-center gap-2"><LogoMark className="h-4 w-auto text-white/60" /> Contains modified Copernicus Sentinel data 2017–2026 · Map data © OpenStreetMap contributors</span>
          <span>{ar ? `أرقام مدققة · ${VERIFIED_ON}` : `Figures verified · ${VERIFIED_ON}`}</span>
        </div>
      </Container>
    </footer>
  )
}
