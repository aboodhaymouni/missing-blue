import clsx from 'clsx'
import { useRef } from 'react'
import { motion, useInView, useReducedMotion } from 'motion/react'
import { PieChart, ShieldAlert } from 'lucide-react'
import { Container, Fn } from '../components/ui'
import { CARD, CHIP, LIFT, Plate, SectionHead } from './kit'
import { useLang } from '../i18n/lang'
import { FACTS } from '../data/facts'
import { SRC } from '../data/sources'

/** 100 litres, drawn honestly: the lost share is a range (41–45), so four cells are hatched. */
function LitreGrid() {
  const { lang } = useLang()
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const cells = Array.from({ length: 100 }, (_, i) => (i < 41 ? 'lost' : i < 45 ? 'range' : 'billed'))
  return (
    <div ref={ref} className="grid max-w-[340px] grid-cols-10 gap-[3px]" role="img" aria-label={lang === 'ar' ? 'من كل 100 لتر تُزوَّد، 41 إلى 45 لترًا لا تُفوتر' : 'Of every 100 litres supplied, 41 to 45 are never billed'}>
      {cells.map((c, i) => (
        <motion.span
          key={i}
          initial={reduce ? false : { opacity: 0 }}
          animate={inView ? { opacity: 1 } : undefined}
          transition={{ delay: reduce ? 0 : i * 0.006, duration: 0.25 }}
          className={clsx(
            'aspect-square rounded-[3px]',
            c === 'billed' && 'bg-navy-900',
            c === 'lost' && 'border border-dashed border-signal-600 bg-signal-100',
            c === 'range' && 'border border-dashed border-signal-600 bg-[repeating-linear-gradient(135deg,rgb(26_111_240/0.35)_0_2px,transparent_2px_5px)]',
          )}
        />
      ))}
    </div>
  )
}

/** Water lost to attacks on the Disi line, Jan–Jul 2026 (MWI figures via JO24). */
const DISI_2026 = [
  { m: { ar: 'ك2', en: 'Jan' }, full: { ar: 'كانون الثاني', en: 'January' }, v: 40000 },
  { m: { ar: 'شباط', en: 'Feb' }, full: { ar: 'شباط', en: 'February' }, v: 67000 },
  { m: { ar: 'آذار', en: 'Mar' }, full: { ar: 'آذار', en: 'March' }, v: 66000 },
  { m: { ar: 'نيسان', en: 'Apr' }, full: { ar: 'نيسان', en: 'April' }, v: 75000 },
  { m: { ar: 'أيار', en: 'May' }, full: { ar: 'أيار', en: 'May' }, v: 320000 },
  { m: { ar: 'حزيران', en: 'Jun' }, full: { ar: 'حزيران', en: 'June' }, v: 400000 },
  { m: { ar: 'تموز', en: 'Jul' }, full: { ar: 'تموز', en: 'July' }, v: 500000 },
]

function DisiChart() {
  const { lang, n } = useLang()
  const ar = lang === 'ar'
  const ref = useRef<HTMLDivElement>(null)
  const inView = useInView(ref, { once: true, margin: '-10% 0px' })
  const reduce = useReducedMotion()
  const max = 500000
  return (
    <div ref={ref} className="px-5 pb-4 pt-6 sm:px-7">
      <div className="relative h-[260px]">
        {[0, 100000, 200000, 300000, 400000, 500000].map((g) => (
          <div key={g} className="absolute inset-x-0 border-t border-navy-900/10" style={{ bottom: `${(g / max) * 100}%` }}>
            <span className="absolute -top-2.5 start-0 bg-surface pe-2 font-mono text-[10px] text-muted" dir="ltr">{g === 0 ? '0' : `${g / 1000}k`}</span>
          </div>
        ))}
        <div className="absolute inset-y-0 start-10 end-0 flex items-end gap-[6%]">
          {DISI_2026.map((d, i) => {
            const summer = i >= 4
            return (
              <div key={i} className="relative flex h-full flex-1 flex-col items-center justify-end">
                <span className={clsx('mb-1.5 font-mono text-[11px]', summer ? 'font-semibold text-navy-900' : 'text-muted')}>{n(Math.round(d.v / 1000))}k</span>
                <motion.div
                  initial={reduce ? false : { height: 0 }}
                  animate={inView ? { height: `${(d.v / max) * 100}%` } : undefined}
                  transition={{ delay: reduce ? 0 : 0.1 + i * 0.08, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                  className={clsx('w-full rounded-t-[6px]', summer ? 'bg-gradient-to-t from-signal-700 to-signal-400 shadow-[0_10px_24px_-12px_rgb(26_111_240/0.8)]' : 'bg-gradient-to-t from-navy-900 to-navy-600')}
                  style={reduce ? { height: `${(d.v / max) * 100}%` } : undefined}
                  title={`${ar ? d.full.ar : d.full.en}: ${n(d.v)} m³`}
                />
              </div>
            )
          })}
        </div>
      </div>
      <div className="ms-10 mt-2 flex gap-[6%]">
        {DISI_2026.map((d, i) => (
          <span key={i} className="flex-1 text-center text-[11.5px] text-ink-2">{ar ? d.m.ar : d.m.en}</span>
        ))}
      </div>
    </div>
  )
}

export default function Problem() {
  const { lang, t } = useLang()
  const ar = lang === 'ar'
  return (
    <section id="problem" className="scroll-mt-28 pt-24 sm:pt-32">
      <Container>
        <SectionHead
          index="01"
          eyebrow={ar ? 'المشكلة' : 'The problem'}
          title={ar ? 'الماء يختفي قبل أن يصل' : 'Water disappears before it arrives'}
          lead={
            <>
              {ar
                ? 'يسحب الأردن من المياه العذبة أكثر من المتجدّد المتاح له، ومع ذلك يضيع جزء كبير ممّا يُضخّ قبل أن يصل إلى العدّاد: بالتسرّب، وبالسرقة من الخطوط.'
                : 'Jordan withdraws more freshwater than it can renew, yet a large share of what it pumps is lost before it reaches a meter: through leaks, and through theft from the lines.'}
              <Fn sources={FACTS.stress.sources} />
            </>
          }
        />

        <div className="mt-14 grid gap-14 lg:grid-cols-12 lg:gap-6">
          <div className="lg:col-span-4 lg:col-start-1">
            <Plate
              n="2"
              frameClass="p-6"
              caption={ar ? <>من كل 100 لتر تُزوَّد، لا يُفوتر 41 إلى 45. المربعات المخطّطة نطاق التقديرات بين التقييم الرسمي 2024/25 وتصريحات 2026.<Fn sources={FACTS.nrw.sources} /></> : <>Of every 100 litres supplied, 41 to 45 are never billed. Hatched cells show the range between the official 2024/25 assessment and 2026 statements.<Fn sources={FACTS.nrw.sources} /></>}
            >
              <p className="num font-display text-[clamp(3.6rem,7vw,5.2rem)] font-medium leading-none text-signal-600" dir="ltr" data-num="">41–45</p>
              <p className="mt-2 text-[15px] text-navy-900">{ar ? 'لترًا من كل 100 لا تُفوتر' : 'litres in every 100 are never billed'}</p>
              <div className="mt-6">
                <LitreGrid />
              </div>
            </Plate>
          </div>

          <div className="lg:col-span-8">
            <Plate
              n="3"
              caption={
                ar ? (
                  <>المياه المفقودة بسبب الاعتداءات على خط الديسي في 2026 (م³ شهريًا). القفزة تبدأ في أيار مع الصيف — الموسم الجاف نفسه الذي نقارن فيه الصور. وارتفعت الاعتداءات على الخط من 307 في 2015 إلى 1,802 في 2025.<Fn url={SRC.disiMonthly.url} /><Fn url={SRC.disi2015.url} /><Fn sources={FACTS.disi.sources} /></>
                ) : (
                  <>Water lost to attacks on the Disi line in 2026 (m³ per month). The jump starts in May with summer — the same dry season in which we compare images. Attacks on the line rose from 307 in 2015 to 1,802 in 2025.<Fn url={SRC.disiMonthly.url} /><Fn url={SRC.disi2015.url} /><Fn sources={FACTS.disi.sources} /></>
                )
              }
            >
              <DisiChart />
            </Plate>
          </div>
        </div>

        <div className="mt-16 grid gap-4 sm:grid-cols-2 sm:gap-6">
          {[FACTS.attacks, FACTS.theftShare].map((f, i) => (
            <div key={f.id} className={clsx(CARD, LIFT, 'relative overflow-hidden p-6 sm:p-8')}>
              <span className="pointer-events-none absolute -end-12 -top-12 size-44 rounded-full bg-gradient-to-br from-signal-400/15 to-transparent blur-2xl" aria-hidden />
              <span className={clsx(CHIP, 'relative mb-5 size-11')}>{i === 0 ? <ShieldAlert className="size-5" aria-hidden /> : <PieChart className="size-5" aria-hidden />}</span>
              <p className="num relative font-display text-[clamp(2.6rem,4.4vw,3.6rem)] font-semibold leading-none text-navy-900" dir="ltr" data-num="">{f.value}</p>
              <p className="relative mt-3 text-[17px] text-navy-900">{t(f.label)}<Fn sources={f.sources} /></p>
              {f.detail && <p className="relative mt-3 max-w-[520px] border-t border-hair pt-3 text-[15px] leading-relaxed text-ink-2">{t(f.detail)}</p>}
            </div>
          ))}
        </div>

        <blockquote className={clsx(CARD, 'relative mt-6 overflow-hidden bg-gradient-to-br from-signal-50 via-card to-card p-7 ps-9 font-display text-[clamp(1.4rem,2.4vw,1.95rem)] leading-[1.6] text-navy-900 sm:p-10 sm:ps-12')}>
          <span className="absolute inset-y-7 start-0 w-1.5 rounded-e-full bg-gradient-to-b from-signal-400 to-signal-700" aria-hidden />
          {ar
            ? `${FACTS.smallLeaks.value} من التسرّبات المبلّغ عنها في الشبكات الصغيرة ووصلات المنازل، ولا تراها الأقمار الصناعية بدقة 10 أمتار. لذلك نبدأ بالخطوط الناقلة في الأرض المفتوحة: هناك تتركّز الاعتداءات، وهناك تظهر أي رقعة خضراء جديدة بوضوح.`
            : `${FACTS.smallLeaks.value} of reported leaks are on small pipes and house connections, which 10 m satellite pixels cannot see. So we start with carrier lines in open land: that is where attacks concentrate, and where a new green patch stands out.`}
          <Fn sources={FACTS.smallLeaks.sources} />
        </blockquote>
      </Container>
    </section>
  )
}
