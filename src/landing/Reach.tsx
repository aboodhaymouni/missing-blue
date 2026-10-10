import clsx from 'clsx'
import { HardHat, House, Map as MapIcon, Waves } from 'lucide-react'
import { Container, Fn } from '../components/ui'
import { CARD, CHIP, LIFT, SectionHead } from './kit'
import { useLang, type Text } from '../i18n/lang'
import { FACTS, type Fact } from '../data/facts'
import { SRC } from '../data/sources'

type Persona = { tag: Text; who: Text; today: Text; todayFn?: string; facts: Fact[]; reach: Text }

const PERSONA_ICONS = [House, HardHat, MapIcon]

const PERSONAS: Persona[] = [
  {
    tag: { ar: 'أ', en: 'A' },
    who: { ar: 'بيوت آخر الخط', en: 'Homes at the end of the line' },
    today: {
      ar: 'التزويد بالدور، وما يُسحب من الخط قبلهم لا يصلهم. وساعات التزويد المعلنة جداول، لا قياسات.',
      en: 'Water comes on rotation, and whatever is drawn off upstream never reaches them. Published supply hours are schedules, not measurements.',
    },
    facts: [FACTS.supplyHours, FACTS.noWater, FACTS.continuous],
    reach: { ar: 'كل لتر نوقف سرقته من خط ناقل يكمل طريقه إلى آخر الخط.', en: 'Every litre we stop being stolen from a carrier line continues to the end of the line.' },
  },
  {
    tag: { ar: 'ب', en: 'B' },
    who: { ar: 'الفرق الميدانية والمقاولون', en: 'Field crews and contractors' },
    today: {
      ar: 'يغطّون ممرات صحراوية طويلة بحجم عمل كبير، ويحتاجون إبلاغًا سريعًا بالعربية يعمل في الميدان.',
      en: 'They cover long desert corridors at real scale, and need fast Arabic reporting that works in the field.',
    },
    facts: [FACTS.disi],
    reach: { ar: 'تطبيق بالعربية: صوت أو نص أو صورة، والذكاء الاصطناعي يملأ الحقول ويُظهر الكلمات التي استند إليها.', en: 'An Arabic app: voice, text or photo. AI fills in the fields and shows the words it relied on.' },
  },
  {
    tag: { ar: 'ج', en: 'C' },
    who: { ar: 'مهندسو الخرائط والفاقد', en: 'GIS and water-loss engineers' },
    today: {
      ar: 'الشبكة على GIS منذ 1999 على الأقل، لكن لا أرقام منشورة عن دقّة سجلاتها، وما زالت عطاءات مياه اليرموك تطلب مخططات المقاولين على ورق شفاف.',
      en: 'The network has been in GIS since at least 1999, but no accuracy figures are published for its records, and Yarmouk Water tenders still ask contractors for drawings on film.',
    },
    todayFn: SRC.ywcTender.url,
    facts: [FACTS.gisKm],
    reach: { ar: 'كل اكتشاف يصلهم مسودة تعديل بصيغة مياهنا، تبقى متقطّعة حتى يعتمدوها بأنفسهم.', en: 'Every finding reaches them as a draft edit in Miyahuna’s format, dashed until they approve it themselves.' },
  },
]

export default function Reach() {
  const { lang, t } = useLang()
  const ar = lang === 'ar'
  return (
    <section id="reach" className="scroll-mt-28 pt-24 sm:pt-32">
      <Container>
        <SectionHead
          index="02"
          eyebrow={ar ? 'سؤال القطاع الثاني' : 'Sector 2’s question'}
          title={ar ? 'مَن لا تصله الخدمة اليوم؟' : 'Who does the service miss today?'}
          lead={ar ? 'تسأل لجنة القطاع: مَن يصل إليه حلّك ولا تصله الخدمة الحالية؟ جوابنا ثلاث فئات، ولكلٍّ منها طريقة نصل بها إليها.' : 'The panel asks: who does your solution reach that the current service does not? Our answer is three groups, each with a way to reach them.'}
        />

        <figure className={clsx(CARD, 'relative mt-14 grid gap-6 overflow-hidden p-6 sm:p-8 lg:grid-cols-12 lg:gap-10')}>
          <span className="pointer-events-none absolute -start-16 -top-16 size-56 rounded-full bg-gradient-to-br from-signal-400/15 to-transparent blur-2xl" aria-hidden />
          <div className="relative flex items-center gap-4 lg:col-span-4 lg:flex-col lg:items-start">
            <span className={clsx(CHIP, 'size-11')}><Waves className="size-5" aria-hidden /></span>
            <p className="num font-display text-[clamp(2.6rem,4.6vw,3.8rem)] font-semibold leading-none text-signal-600" dir="ltr" data-num="">{FACTS.aqaba.value}</p>
          </div>
          <blockquote className="relative text-[17.5px] leading-[1.85] text-navy-900 sm:text-[18px] lg:col-span-8">
            {t(FACTS.aqaba.label)}. {t(FACTS.aqaba.detail!)}<Fn sources={FACTS.aqaba.sources} />{' '}
            <span className="text-ink-2">{ar ? 'هكذا يعمل الكشف اليوم: ينتظر أن يشتكي أحد. لكن على الكيلومترات الصحراوية من الخطوط الناقلة لا يسكن أحد ليشتكي — وهناك بالضبط تنظر الأقمار الصناعية.' : 'That is how detection works today: it waits for someone to complain. On the desert kilometres of the carrier lines nobody lives to complain — and that is exactly where the satellite looks.'}</span>
          </blockquote>
        </figure>

        <div className="mt-6 grid gap-4 lg:grid-cols-3 lg:gap-6">
          {PERSONAS.map((p, i) => {
            const Icon = PERSONA_ICONS[i]
            return (
            <article key={i} className={clsx(CARD, LIFT, 'flex flex-col p-6 sm:p-7')}>
              <div className="flex items-center justify-between gap-3">
                <span className={clsx(CHIP, 'size-11')}><Icon className="size-5" aria-hidden /></span>
                <p className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-navy-600 to-navy-950 font-display text-[22px] font-semibold leading-none text-white shadow-[0_8px_18px_-8px_rgb(1_28_71/0.7)]">{t(p.tag)}</p>
              </div>
              <h3 className="mt-5 text-[clamp(1.5rem,2.1vw,1.8rem)] font-semibold text-navy-900">{t(p.who)}</h3>
              <p className="mt-3 text-[16px] leading-[1.85] text-ink-2">
                {t(p.today)}
                {p.todayFn && <Fn url={p.todayFn} />}
              </p>

              <dl className="mt-6 grid gap-5 rounded-[12px] bg-canvas p-4 ring-1 ring-hair/70 sm:p-5">
                {p.facts.map((f) => (
                  <div key={f.id}>
                    <dd className="num font-display text-[2.1rem] font-semibold leading-none text-navy-900" dir="ltr" data-num="">{f.value}</dd>
                    <dt className="mt-2 text-[14.5px] leading-snug text-ink-2">{t(f.label)}<Fn sources={f.sources.slice(0, 1)} /></dt>
                  </div>
                ))}
              </dl>

              <p className="mt-auto pt-6 text-[15.5px] leading-relaxed text-navy-900">
                <span className="me-1.5 inline-flex rounded-full bg-signal-50 px-2.5 py-0.5 font-mono text-[12px] font-semibold text-signal-700 ring-1 ring-signal-100">{ar ? 'نصل إليهم ←' : 'How we reach them →'}</span> {t(p.reach)}
              </p>
            </article>
            )
          })}
        </div>
      </Container>
    </section>
  )
}
