import clsx from 'clsx'
import { Link } from 'react-router'
import { Fn, Fwd } from '../components/ui'
import { Accent, CARD } from './kit'
import { useLang, type Text } from '../i18n/lang'
import { BIZ_SRC, CALC } from '../data/business'
import { roi } from '../lib/biz'

/** The business model in three lines, with the break-even computed by the same code as the full canvas. */
export function BusinessStrip() {
  const { lang, t, n } = useLang()
  const ar = lang === 'ar'
  const r = roi({ km: 325, pricePerKm: CALC.priceRef.value, casesPer100Km: CALC.casesPer100Km, m3PerCase: CALC.m3PerCase.value, jodPerM3: CALC.jodPerM3.value })
  const be = r.breakEvenPer100Km ?? 0
  const tariff = roi({ km: 325, pricePerKm: CALC.priceRef.value, casesPer100Km: CALC.casesPer100Km, m3PerCase: CALC.m3PerCase.value, jodPerM3: CALC.tariffTop.value }).breakEvenPer100Km ?? 0

  const steps: Text[] = [
    { ar: 'تجربة ممولة من برنامج قائم', en: 'A pilot paid by a running programme' },
    { ar: 'اشتراك سنوي لكل كيلومتر من الممرات', en: 'An annual subscription per km of corridor' },
    { ar: 'ترخيص للبلاغ الميداني والسجلات لكل طاقم', en: 'A field-reporting and records licence per crew' },
  ]

  return (
    <div className={clsx(CARD, 'relative mt-6 grid gap-8 overflow-hidden p-6 sm:p-8 lg:grid-cols-12 lg:gap-10')}>
      <span className="pointer-events-none absolute -end-20 -top-24 size-72 rounded-full bg-gradient-to-br from-signal-400/15 to-transparent blur-3xl" aria-hidden />
      <div className="relative lg:col-span-5">
        <p className="flex items-center gap-2.5 font-mono text-[11px] text-ink-soft"><Accent />{ar ? 'نموذج العمل' : 'Business model'}</p>
        <ol className="mt-5 grid gap-3">
          {steps.map((s, i) => (
            <li key={i} className="flex items-start gap-3 rounded-[12px] bg-canvas px-4 py-3 font-display text-[20px] font-semibold leading-snug text-navy-900">
              <span className="mt-0.5 grid size-7 shrink-0 place-items-center rounded-full bg-card font-mono text-[11px] font-semibold text-signal-700 ring-1 ring-signal-100" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
              {t(s)}
            </li>
          ))}
        </ol>
        <p className="mt-4 text-[14.5px] leading-relaxed text-ink-2">
          {ar ? 'لا نقترح سعرًا قبل أن تقيس التجربة كلفة الدوريات اليوم.' : 'We propose no price before the pilot measures what patrols cost today.'}
        </p>
      </div>
      <div className="relative lg:col-span-7 lg:border-s lg:border-hair lg:ps-10">
        <p className="num font-display text-[clamp(2.6rem,4.4vw,3.6rem)] font-semibold leading-none text-signal-600" dir="ltr" data-num="">
          {n(be, { maximumFractionDigits: 1 })}
        </p>
        <p className="mt-3 max-w-[52ch] text-[16px] leading-relaxed text-navy-900">
          {ar
            ? `حالة إضافية مؤكّدة لكل 100 كم في السنة، لم تكن في سجل المرفق، تكفي ليغطي اشتراك الممر كلفته بسعر السوق المرجعي، أي نحو ${n((be * 325) / 100, { maximumFractionDigits: 0 })} حالات في السنة على خط الديسي كله، إذا قيس الماء بكلفة تزويده على الحكومة`
            : `extra confirmed cases per 100 km a year, not already in the utility’s register, pay for a corridor subscription at the market reference price: about ${n((be * 325) / 100, { maximumFractionDigits: 0 })} a year on the whole Disi line, valuing water at what it costs the government to supply`}
          <Fn sources={[CALC.priceRef.source, CALC.m3PerCase.source, CALC.jodPerM3.source, BIZ_SRC.disiLength]} />
          {ar ? `. وبأعلى تعرفة منزلية يلزم نحو ${n(tariff, { maximumFractionDigits: 0 })} لكل 100 كم.` : `. At the top household tariff it takes about ${n(tariff, { maximumFractionDigits: 0 })} per 100 km.`}
        </p>
        <p className="mt-3 max-w-[60ch] text-[14px] leading-relaxed text-ink-2">
          {ar
            ? 'ومن يدفع بعد التجربة: سلطة المياه، وشركات المياه، ومقاولو الفاقد بعقود الأداء، ومطوّر الناقل الوطني الذي طُلب منه في جلسة التشاور حول دراسة الأثر البيئي خطة أمنية ضد السرقة. لم نتواصل مع أيٍّ منهم بعد، والتجربة أول ما نطلبه.'
            : 'Who pays after the pilot: the Water Authority, the water companies, NRW contractors on performance contracts, and the National Carrier’s developer, asked at the ESIA consultation for a security plan against theft. None has been approached yet; the pilot is our first ask.'}
          <Fn sources={[BIZ_SRC.carrierEsia]} />
        </p>
        <Link to="/bmc" className="mt-6 inline-flex items-center gap-2 rounded-[12px] bg-gradient-to-b from-signal-500 to-signal-700 px-5 py-3 text-[15px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_10px_24px_-10px_rgb(42_139_255/0.9)] transition-all hover:-translate-y-0.5">
          {ar ? 'نموذج العمل كاملًا، مع حاسبة القيمة' : 'The full business model, with the value calculator'} <Fwd />
        </Link>
      </div>
    </div>
  )
}
