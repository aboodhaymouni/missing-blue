import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useReducedMotion } from 'motion/react'
import { Droplets, Play, ShieldAlert, Smartphone, Target, TriangleAlert } from 'lucide-react'
import { Container, Fn, Fwd } from '../components/ui'
import { CHIP_DARK, Cta, GLASS, GlowMark, Plate } from './kit'
import { useHud, lonLatAt } from '../components/Hud'
import { useLang, type Text } from '../i18n/lang'
import { FACTS } from '../data/facts'
import heroMeta from '../data/imagery/hero.json'
import heroPatches from '../data/imagery/hero-patches.json'
import { NAV, scrollToId } from './Header'

type P = (typeof heroPatches)['patches'][number]
const YEARS = ['2017', '2022', '2024'] as const
type Year = (typeof YEARS)[number]
const FILE: Record<Year, string> = { '2017': './imagery/hero-2017.webp', '2022': './imagery/hero-2022.webp', '2024': './imagery/hero-2024.webp' }

type Note = { key: string; p: P; letter: Text; text: Text; from: Year; lx: number; ly: number; tone: 'candidate' | 'ink' }

/** Three annotations on real patches: two new irrigation circles and one small isolated patch. */
function useNotes(n: (v: number, o?: Intl.NumberFormatOptions) => string): Note[] {
  return useMemo(() => {
    const ps = heroPatches.patches as P[]
    const big = ps.filter((p) => p.area_ha >= 20)
    const smallIso = ps
      .filter((p) => p.area_ha < 3 && p.first_seen?.startsWith('2022') && p.pct[0] > 10 && p.pct[0] < 90 && p.pct[1] > 20 && p.pct[1] < 85)
      .map((p) => ({ p, gap: Math.min(...big.map((b) => Math.hypot(b.px[0] - p.px[0], b.px[1] - p.px[1]) - b.radius_px - p.radius_px)) * 10 }))
      .sort((a, b) => b.gap - a.gap)[0]
    const c2224 = big.filter((p) => p.first_seen?.startsWith('2022') && p.pct[1] > 18 && p.pct[1] < 80).sort((a, b) => a.pct[0] - b.pct[0]).slice(-1)[0]
    const c1722 = big.filter((p) => p.first_seen?.startsWith('2017') && p.pct[1] > 18 && p.pct[1] < 80).sort((a, b) => b.area_ha - a.area_ha)[0]
    const out: Note[] = []
    if (c1722)
      out.push({
        key: 'c',
        p: c1722,
        letter: { ar: 'ج', en: 'C' },
        text: { ar: `دائرة ري ${n(Math.round(c1722.area_ha))} هـ · ظهرت 2017–2022`, en: `Irrigation circle, ${n(Math.round(c1722.area_ha))} ha · appeared 2017–2022` },
        from: '2022',
        lx: Math.max(4, c1722.pct[0] - 18),
        ly: Math.max(6, c1722.pct[1] - 26),
        tone: 'ink',
      })
    if (c2224)
      out.push({
        key: 'b',
        p: c2224,
        letter: { ar: 'ب', en: 'B' },
        text: { ar: `دائرة ري ${n(Math.round(c2224.area_ha))} هـ · ظهرت 2022–2024 · تُطابَق مع قائمة الاستخدامات المرخّصة`, en: `Irrigation circle, ${n(Math.round(c2224.area_ha))} ha · appeared 2022–2024 · checked against licensed uses` },
        from: '2024',
        lx: Math.min(70, c2224.pct[0] - 6),
        ly: Math.max(6, c2224.pct[1] - 30),
        tone: 'ink',
      })
    if (smallIso)
      out.push({
        key: 'a',
        p: smallIso.p,
        letter: { ar: 'أ', en: 'A' },
        text: { ar: `رقعة ${n(smallIso.p.area_ha, { maximumFractionDigits: 2 })} هـ · ظهرت 2022–2024 · معزولة ${n(Math.round(smallIso.gap / 10) * 10)} م · تستحق الفحص`, en: `Patch, ${n(smallIso.p.area_ha, { maximumFractionDigits: 2 })} ha · appeared 2022–2024 · ${n(Math.round(smallIso.gap / 10) * 10)} m from other farms · worth inspecting` },
        from: '2024',
        lx: Math.min(66, smallIso.p.pct[0] + 4),
        ly: Math.min(86, smallIso.p.pct[1] + 12),
        tone: 'candidate',
      })
    return out
  }, [n])
}

function PlateOne() {
  const { lang, n, dir } = useLang()
  const ar = lang === 'ar'
  const reduce = useReducedMotion()
  const hud = useHud()
  const ref = useRef<HTMLDivElement>(null)
  const [year, setYear] = useState<Year>(reduce ? '2024' : '2017')
  const [run, setRun] = useState(0)
  const notes = useNotes(n)

  // Play the sequence 2017 → 2022 → 2024 once on load (and again on "replay").
  useEffect(() => {
    if (reduce) return
    setYear('2017')
    const a = setTimeout(() => setYear('2022'), 1600)
    const b = setTimeout(() => setYear('2024'), 3400)
    return () => { clearTimeout(a); clearTimeout(b) }
  }, [run, reduce])

  const onMove = useCallback((e: PointerEvent<HTMLDivElement>) => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const [lon, lat] = lonLatAt(heroMeta.corners_lonlat_tl_tr_br_bl, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height)
    hud.set(lat, lon)
  }, [hud])

  const yi = YEARS.indexOf(year)
  const c = heroMeta.corners_lonlat_tl_tr_br_bl
  const corner = (ll: number[]) => `${ll[1].toFixed(3)}°N ${ll[0].toFixed(3)}°E`

  return (
    <Plate
      n="1"
      dark
      corners={{ tl: corner(c[0]), br: corner(c[2]) }}
      caption={
        ar ? (
          <>صحراء المدوّرة، محافظة معان: الشهر الجاف نفسه (آب) في ثلاث سنوات. صور Sentinel-2 حقيقية بدقة 10 أمتار، والمساحات والتواريخ محسوبة منها. حالة الترخيص والترتيب توضيحيان.<Fn url="https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a" /></>
        ) : (
          <>The Mudawwara desert, Ma’an: the same dry month (August) in three years. Real Sentinel-2 imagery at 10 m; areas and dates are computed from it. Licence status and ranking are illustrative.<Fn url="https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a" /></>
        )
      }
    >
      <div ref={ref} onPointerMove={onMove} className="relative aspect-[1988/1118] cursor-crosshair overflow-hidden bg-[#d9a066]">
        {YEARS.map((y) => (
          <img key={y} src={FILE[y]} alt={y === '2024' ? (ar ? 'صحراء المدوّرة في آب 2024' : 'Mudawwara desert, August 2024') : ''} draggable={false} className={clsx('absolute inset-0 size-full object-cover transition-opacity duration-[1200ms] ease-out', year === y ? 'opacity-100' : 'opacity-0')} />
        ))}

        <svg className="pointer-events-none absolute inset-0 size-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden>
          {notes.map((nt) => {
            const on = YEARS.indexOf(nt.from) <= yi
            return (
              <g key={nt.key} className="transition-opacity duration-500" style={{ opacity: on ? 1 : 0 }}>
                <line x1={nt.p.pct[0]} y1={nt.p.pct[1]} x2={nt.lx} y2={nt.ly} stroke="#fff" strokeWidth="3" vectorEffect="non-scaling-stroke" />
                <line x1={nt.p.pct[0]} y1={nt.p.pct[1]} x2={nt.lx} y2={nt.ly} stroke="#011c47" strokeWidth="1.2" vectorEffect="non-scaling-stroke" />
              </g>
            )
          })}
        </svg>

        {notes.map((nt) => {
          const on = YEARS.indexOf(nt.from) <= yi
          return (
            <div key={nt.key} className="transition-opacity duration-500" style={{ opacity: on ? 1 : 0 }}>
              <span className="absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-navy-900 shadow-[0_0_0_1px_rgb(1_28_71/0.6)]" style={{ left: `${nt.p.pct[0]}%`, top: `${nt.p.pct[1]}%` }} aria-hidden />
              {nt.tone === 'candidate' && on && <span className="absolute size-9 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-dashed border-candidate" style={{ left: `${nt.p.pct[0]}%`, top: `${nt.p.pct[1]}%` }} aria-hidden />}
              <div className={clsx('absolute max-w-[46%] -translate-y-1/2 rounded-[10px] border bg-white/95 px-2.5 py-1.5 text-[12px] leading-snug text-navy-900 shadow-[0_12px_28px_-12px_rgb(1_28_71/0.6)] sm:text-[12.5px]', nt.tone === 'candidate' ? 'border-candidate' : 'border-white')} style={{ left: `${nt.lx}%`, top: `${nt.ly}%`, transform: nt.lx < 50 ? 'translate(0, -50%)' : 'translate(-100%, -50%)' }}>
                <span className={clsx('me-1.5 font-mono font-semibold', nt.tone === 'candidate' ? 'text-candidate-ink' : 'text-signal-700')}>{ar ? nt.letter.ar : nt.letter.en}</span>
                {ar ? nt.text.ar : nt.text.en}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time ruler */}
      <div className="flex items-center gap-4 border-t border-hair bg-card px-4 pb-4 pt-3">
        <span className="rounded-full bg-canvas px-2 py-0.5 font-mono text-[11px] text-ink-soft ring-1 ring-hair">{ar ? 'آب' : 'Aug'}</span>
        <div className="relative h-7 flex-1">
          <div className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 rounded-full bg-hair" />
          {Array.from({ length: 8 }, (_, i) => 2017 + i).map((y) => {
            const pos = dir === 'rtl' ? 100 - ((y - 2017) / 7) * 100 : ((y - 2017) / 7) * 100
            const avail = (YEARS as readonly string[]).includes(String(y))
            const active = String(y) === year
            return (
              <button
                key={y}
                type="button"
                disabled={!avail}
                onClick={() => avail && setYear(String(y) as Year)}
                className={clsx('absolute top-1/2 -translate-x-1/2 -translate-y-1/2', avail ? 'cursor-pointer' : 'cursor-default')}
                style={{ left: `${pos}%` }}
                aria-label={String(y)}
                aria-pressed={active}
              >
                <span className={clsx('block transition-all', avail ? 'size-3.5 rounded-full border-2' : 'h-2 w-px bg-hair-2', active && 'border-signal-600 bg-signal-600 shadow-[0_0_0_4px_rgb(26_111_240/0.18)]', avail && !active && 'border-navy-900/45 bg-card')} />
                {avail && <span className={clsx('absolute left-1/2 top-[18px] -translate-x-1/2 font-mono text-[10.5px]', active ? 'font-semibold text-signal-700' : 'text-muted')}>{y}</span>}
              </button>
            )
          })}
        </div>
        <button type="button" onClick={() => setRun((r) => r + 1)} className="inline-flex items-center gap-1.5 rounded-full bg-signal-50 px-2.5 py-1 font-mono text-[11px] font-semibold text-signal-700 ring-1 ring-signal-100 transition-colors hover:bg-signal-100">
          <Play className="size-3" aria-hidden />
          {ar ? 'إعادة' : 'Replay'}
        </button>
      </div>
    </Plate>
  )
}

const FIGURE_ICONS = [Droplets, ShieldAlert, TriangleAlert, Target]

export default function Hero() {
  const { lang, t } = useLang()
  const ar = lang === 'ar'
  const figures = [FACTS.nrw, FACTS.attacks, FACTS.disi, FACTS.target]

  return (
    <section className="relative px-2.5 pt-2.5 sm:px-4 sm:pt-4">
      <div className="lp-dark mb-hero relative isolate overflow-hidden rounded-[24px] text-white shadow-[0_40px_90px_-45px_rgb(1_28_71/0.9)] sm:rounded-[32px]">
        <div className="mb-hero-grid pointer-events-none absolute inset-0" aria-hidden />
        <span className="pointer-events-none absolute -top-56 start-[6%] size-[560px] rounded-full bg-signal-500/20 blur-[110px]" aria-hidden />
        <span className="pointer-events-none absolute -bottom-48 end-[10%] size-[480px] rounded-full bg-proposed/25 blur-[110px]" aria-hidden />

        <Container className="relative pb-8 pt-12 sm:pb-12 sm:pt-16 lg:pt-20">
          <div className="flex items-center justify-between gap-10">
            <h1 className={clsx('max-w-[1080px] font-semibold leading-[1.12] text-white', ar ? 'text-[clamp(2.6rem,6.4vw,5.9rem)]' : 'text-[clamp(2.3rem,5vw,4.5rem)]')}>
              {ar ? (
                <>
                  نكشف أين تضيع المياه،
                  <br />
                  <span className="bg-gradient-to-l from-signal-200 via-signal-300 to-signal-400 inline-block bg-clip-text text-transparent text-balance">ولا ندع ما نكتشفه يضيع.</span>
                </>
              ) : (
                <>
                  Find where water goes missing,
                  <br />
                  <span className="bg-gradient-to-r from-signal-200 via-signal-300 to-signal-400 inline-block bg-clip-text text-transparent text-balance">and never lose what you find.</span>
                </>
              )}
            </h1>
            <GlowMark className="hidden h-[170px] w-auto shrink-0 lg:block xl:h-[220px]" />
          </div>

          <div className="mt-10 grid gap-12 lg:mt-14 lg:grid-cols-12 lg:gap-10">
            <div className="lg:col-span-5 xl:col-span-4">
              <p className="text-[17.5px] leading-[1.9] text-white/75 sm:text-[19px]">
                {ar ? (
                  <>
                    منصّة تقارن صور الأقمار الصناعية المجانية للشهر الجاف نفسه عبر السنين، وتدلّ الفرق الميدانية على ما يستحق الفحص قرب خطوط المياه الرئيسية. ما يجده الفريق يُكتب <span className="lp-mark">بالعربية</span> ويصبح سجلًّا على خريطة المرفق بعد موافقة مهندس.
                  </>
                ) : (
                  <>
                    A platform that compares free satellite images of the same dry month across years and points field crews to what is worth inspecting near main water lines. What the crew finds is written <span className="lp-mark">in Arabic</span> and becomes a record on the utility’s map once an engineer approves it.
                  </>
                )}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Cta to="/app/map?demo=1" size="lg"><Play className="size-4" aria-hidden />{ar ? 'شاهد العرض الحي' : 'Watch the live demo'}</Cta>
                <Cta to="/crew" size="lg" variant="glass"><Smartphone className="size-4" aria-hidden />{ar ? 'تطبيق الفريق' : 'Crew app'}</Cta>
              </div>

              <nav className={clsx(GLASS, 'mt-10 hidden p-3 lg:block')} aria-label={ar ? 'محتويات التقرير' : 'Report contents'}>
                <p className="px-2.5 pb-1.5 pt-1 font-mono text-[11px] text-white/55">{ar ? 'في هذا التقرير' : 'In this report'}</p>
                <ol className="grid gap-0.5">
                  {NAV.map((x, i) => (
                    <li key={x.id}>
                      <button type="button" onClick={() => scrollToId(x.id)} className="group flex w-full items-center gap-3 rounded-[10px] px-2.5 py-1.5 text-start text-[14.5px] text-white/80 transition-colors hover:bg-white/[0.08] hover:text-white">
                        <span className="w-5 font-mono text-[11px] text-signal-300" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
                        <span>{t(x.label)}</span>
                        <Fwd className="ms-auto size-3.5 opacity-0 transition-opacity group-hover:opacity-70" />
                      </button>
                    </li>
                  ))}
                </ol>
              </nav>
            </div>

            <div className="lg:col-span-7 xl:col-span-8">
              <PlateOne />
            </div>
          </div>

          <dl className="mt-14 grid grid-cols-2 gap-3 sm:gap-4 lg:mt-16 lg:grid-cols-4">
            {figures.map((f, i) => {
              const Icon = FIGURE_ICONS[i]
              return (
                <div key={f.id} className={clsx(GLASS, 'relative flex min-w-0 flex-col overflow-hidden p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-signal-300/40 hover:bg-white/[0.09] sm:p-5')}>
                  <span className="pointer-events-none absolute -end-12 -top-12 size-36 rounded-full bg-signal-400/[0.12] blur-2xl" aria-hidden />
                  <span className={clsx(CHIP_DARK, 'relative size-9')}><Icon className="size-[18px]" aria-hidden /></span>
                  <dd className="num relative mt-4 font-display text-[clamp(1.8rem,3.3vw,2.9rem)] font-semibold leading-none text-white" dir="ltr" data-num="">
                    {f.value}
                  </dd>
                  <dt className="relative mt-2.5 text-[13.5px] leading-snug text-white/70 sm:text-[14.5px]">
                    {t(f.label)}
                    <Fn sources={f.sources.slice(0, 1)} />
                  </dt>
                </div>
              )
            })}
          </dl>
        </Container>
      </div>
    </section>
  )
}
