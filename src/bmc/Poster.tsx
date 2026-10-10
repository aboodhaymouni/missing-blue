import clsx from 'clsx'
import { useEffect, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'
import {
  ArrowRight, Banknote, Building2, Cog, Database, Handshake, Heart, Layers, MessageSquareText, Radio, Satellite, ShieldCheck, Sparkles, Users, Wallet,
} from 'lucide-react'
import { LogoMark } from '../components/Logo'
import { SEGMENTS, type SegmentId } from '../data/business'

/**
 * One-page Business Model Canvas poster (1920×1080) for the hand-in and the pitch. The content is
 * a condensed copy of src/data/business.ts — keep the two in step. ?theme=dark switches to the
 * night variant; ?export=1 drops the fit-to-window scaling so a headless browser can screenshot it.
 */

const SEG = Object.fromEntries(SEGMENTS.map((s) => [s.id, s])) as Record<SegmentId, (typeof SEGMENTS)[number]>

type Line = { lead: string; rest?: string; for?: SegmentId[] }

const PARTNERS: Line[] = [
  { lead: 'WAJ and the water companies', rest: 'routes (kept on their servers), crews, approvals' },
  { lead: 'Pilot funders', rest: 'World Bank · EIB · GIZ · JICA' },
  { lead: 'Channel partners', rest: 'InfoGraph (Esri) · NRW performance-contract operators' },
  { lead: 'Public-terms suppliers', rest: 'Copernicus Sentinel-2 · NASA–ISRO NISAR · Anthropic Claude' },
]
const ACTIVITIES: Line[] = [
  { lead: 'Detect', rest: 'dry-season change, ranked by a published formula' },
  { lead: 'Verify', rest: 'Arabic crew reports → fields, each quoting the crew' },
  { lead: 'Remember', rest: 'wMain export, engineer approval, audit trail' },
  { lead: 'Measure', rest: 'pilots, extra confirmed cases' },
]
const RESOURCES: Line[] = [
  { lead: 'Free imagery', rest: 'Sentinel-2 since 2017; NISAR radar from 2026' },
  { lead: 'Our pipeline', rest: 'ranking, evidence-bound extraction, wMain export' },
  { lead: 'Records know-how', rest: 'wMain codes, Palestine Grid datum shift' },
  { lead: 'Team', rest: 'GIS, data, field ops + an AI researcher' },
]
const VALUE: Line[] = [
  { lead: 'Where to look, and why.', rest: 'Ranked sites on desert carrier lines, each with before/after evidence. No accusation.', for: ['waj', 'carriers'] },
  { lead: 'Arabic reports, no paper.', rest: 'Voice, text or photo in dialect. Every field quotes the crew — nothing invented.', for: ['waj', 'utilities', 'contractors'] },
  { lead: 'Records that fix themselves.', rest: 'Approved edits land in Miyahuna’s own wMain format.', for: ['utilities', 'contractors'] },
  { lead: 'A trail that holds up.', rest: 'Who reported, when, in what words, who approved.', for: ['waj', 'carriers'] },
  { lead: 'Results you can count.', rest: 'Extra confirmed cases — fits results-based funding.', for: ['funders', 'waj'] },
]
const RELATIONSHIPS: Line[] = [
  { lead: 'Co-designed pilot', rest: 'weekly loop: visit → report → approve', for: ['waj', 'utilities'] },
  { lead: 'Shared scorecard', rest: 'extra cases vs patrols, cost per case', for: ['funders', 'waj'] },
  { lead: 'People decide', rest: 'the system suggests, an engineer approves' },
]
const CHANNELS: Line[] = [
  { lead: 'Programme-funded pilot', rest: 'World Bank, GIZ, JICA', for: ['funders'] },
  { lead: 'Inside their Esri', rest: 'via InfoGraph', for: ['utilities'] },
  { lead: 'NRW contracts', rest: 'licence for the operator', for: ['contractors'] },
  { lead: 'Carrier security plan', rest: 'theft layer', for: ['carriers'] },
]
const SEGS: { id: SegmentId; title: string; proof: string }[] = [
  { id: 'waj', title: 'Water Authority (WAJ)', proof: 'Disi line: 1,802 attacks in 2025, most since 2014' },
  { id: 'utilities', title: 'Water companies', proof: 'Miyahuna · Yarmouk · Aqaba. NRW 68% in Mafraq' },
  { id: 'contractors', title: 'NRW contractors', proof: 'Paid on results; Amman PPP in procurement' },
  { id: 'carriers', title: 'Carrier operators', proof: 'Disi and the National Carrier (BOT)' },
  { id: 'funders', title: 'Funding programmes', proof: 'Pay the pilot — World Bank USD 209m for NRW' },
]
const COSTS: { lead: string; value: string }[] = [
  { lead: 'Team', value: 'Main cost' },
  { lead: 'Satellite imagery', value: 'JOD 0' },
  { lead: 'AI per report', value: '≈ JOD 0.02' },
  { lead: 'Server', value: 'Cloud / on-prem' },
]
const REVENUE: { n: string; lead: string; rest: string; for: SegmentId[] }[] = [
  { n: '1', lead: 'Pilot', rest: '10–12 weeks, fixed fee paid by a programme', for: ['funders'] },
  { n: '2', lead: 'Corridor monitoring', rest: 'annual subscription per km', for: ['waj', 'carriers'] },
  { n: '3', lead: 'Field reporting & records', rest: 'annual licence per crew', for: ['utilities', 'contractors'] },
  { n: '4', lead: 'Results payment', rest: 'per extra confirmed case', for: ['funders', 'waj'] },
  { n: '5', lead: 'Integration', rest: 'one-off GIS link and training', for: ['utilities', 'contractors'] },
]

function Dots({ ids }: { ids?: SegmentId[] }) {
  if (!ids) return null
  return (
    <span className="ms-1.5 inline-flex translate-y-[-1px] gap-[3px] align-middle" aria-hidden>
      {ids.map((id) => (
        <span key={id} className="inline-block size-[8px] rounded-full" style={SEG[id].dashed ? { border: `1.5px dashed var(--p-seg-f)` } : { background: SEG[id].color === '#011c47' ? 'var(--p-seg-a)' : SEG[id].color }} />
      ))}
    </span>
  )
}

function Block({ n, icon: Icon, title, ar, className, children, tone = 'card' }: { n: string; icon: typeof Users; title: string; ar: string; className?: string; children: ReactNode; tone?: 'card' | 'hero' }) {
  return (
    <section className={clsx('relative flex min-h-0 flex-col overflow-hidden rounded-[18px] px-6 pb-5 pt-5', tone === 'hero' ? 'p-hero' : 'p-card', className)}>
      <header className="mb-3 flex items-center gap-3">
        <span className={clsx('grid size-10 shrink-0 place-items-center rounded-[11px]', tone === 'hero' ? 'bg-white/15 text-white' : 'p-icon')}>
          <Icon className="size-[20px]" strokeWidth={2} aria-hidden />
        </span>
        <span className={clsx('font-mono text-[12px]', tone === 'hero' ? 'text-white/55' : 'p-faint')}>{n}</span>
        <h2 className={clsx('min-w-0 truncate text-[21px] font-semibold leading-tight tracking-[-0.01em]', tone === 'hero' ? 'text-white' : 'p-ink')}>{title}</h2>
        <span lang="ar" dir="rtl" className={clsx('ms-auto shrink-0 text-[13px]', tone === 'hero' ? 'text-white/60' : 'p-faint')} style={{ fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>{ar}</span>
      </header>
      {children}
    </section>
  )
}

function Lines({ items, hero = false, size = 15 }: { items: Line[]; hero?: boolean; size?: number }) {
  return (
    <ul className="flex flex-1 flex-col gap-[7px]" style={{ fontSize: size, lineHeight: 1.38 }}>
      {items.map((it) => (
        <li key={it.lead} className="flex gap-2.5">
          <span className={clsx('mt-[0.55em] size-[6px] shrink-0 rounded-full', hero ? 'bg-signal-300' : 'p-bullet')} aria-hidden />
          <span className={hero ? 'text-white/80' : 'p-soft'}>
            <b className={clsx('font-semibold', hero ? 'text-white' : 'p-ink')}>{it.lead}</b>
            {it.rest && <> {hero ? '' : '— '}{it.rest}</>}
            <Dots ids={it.for} />
          </span>
        </li>
      ))}
    </ul>
  )
}

const STATS = [
  { v: '1,802', l: 'attacks on the Disi line in 2025 — the most since 2014', s: 'MWI via Khaberni, 2026' },
  { v: 'JOD 0', l: 'satellite imagery: Sentinel-2 is free and open', s: 'Copernicus' },
  { v: '94%', l: 'of fields right on 25 held-out reports · 0 invented', s: 'our evaluation, frozen rules' },
  { v: '2.2', l: 'extra cases per 100 km a year to break even', s: 'IGC JOD 1.93/m³ · ASTERRA ref. price' },
]

export default function Poster() {
  const [params] = useSearchParams()
  const dark = params.get('theme') === 'dark'
  const exporting = params.get('export') === '1'
  const [scale, setScale] = useState(1)

  useEffect(() => {
    if (exporting) return
    const fit = () => setScale(Math.min(window.innerWidth / 1920, window.innerHeight / 1080))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [exporting])

  useEffect(() => {
    document.title = 'Missing Blue — Business Model Canvas'
  }, [])

  return (
    <div className={clsx('poster-root grid min-h-dvh place-items-center overflow-hidden', dark ? 'poster-dark' : 'poster-light')} lang="en" dir="ltr">
      <style>{POSTER_CSS}</style>
      <div style={{ width: 1920 * scale, height: 1080 * scale }}>
        <div className="p-stage relative flex flex-col overflow-hidden" style={{ width: 1920, height: 1080, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
          {/* backdrop: the logo's slanted channel, very faint */}
          <svg className="pointer-events-none absolute -end-24 -top-40 h-[760px] opacity-[0.05]" viewBox="0 0 577 973" aria-hidden>
            <LogoMarkPaths />
          </svg>

          {/* header */}
          <header className="relative flex items-center gap-8 px-12 pb-6 pt-9">
            <div className="flex items-center gap-4">
              <LogoMark className="h-[74px] w-auto p-logo" />
              <div className="leading-none">
                <div lang="ar" dir="rtl" className="p-ink text-[40px] font-bold leading-[1]" style={{ fontFamily: '"Markazi Text Variable", serif' }}>الأزرق المفقود</div>
                <div className="p-ink mt-1 text-[24px] font-semibold italic opacity-85" style={{ fontFamily: '"Newsreader Variable", Georgia, serif' }}>Missing Blue</div>
              </div>
            </div>
            <span className="p-rule h-[72px] w-px" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="p-accent font-mono text-[13px] uppercase tracking-[0.22em]">Business Model Canvas</p>
              <h1 className="p-ink mt-1.5 text-[34px] font-medium leading-[1.12] tracking-[-0.015em]" style={{ fontFamily: '"Newsreader Variable", Georgia, serif' }}>
                Finding the water Jordan loses on its desert carrier lines — <span className="p-accent italic">and writing it back into the records.</span>
              </h1>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-2.5">
              <div className="flex items-center gap-1.5">
                {[
                  { i: Satellite, t: 'Detect' },
                  { i: MessageSquareText, t: 'Verify' },
                  { i: Database, t: 'Remember' },
                ].map((s, k) => (
                  <span key={s.t} className="flex items-center gap-1.5">
                    {k > 0 && <ArrowRight className="p-faint size-4" aria-hidden />}
                    <span className="p-chip flex h-9 items-center gap-2 rounded-full px-3.5 text-[14px] font-semibold">
                      <s.i className="size-4" aria-hidden />{s.t}
                    </span>
                  </span>
                ))}
              </div>
              <p className="p-faint font-mono text-[12px] tracking-[0.06em]">AI QUEST 2026 · SECTOR 02 · next.society()</p>
            </div>
          </header>

          {/* canvas */}
          <main className="relative grid min-h-0 flex-1 gap-3.5 px-12" style={{ gridTemplateColumns: '1fr 1fr 1.18fr 1fr 1fr', gridTemplateRows: '1fr 1fr auto' }}>
            <Block n="08" icon={Handshake} title="Key partners" ar="الشركاء الرئيسيون" className="row-span-2">
              <Lines items={PARTNERS} />
              <p className="p-note mt-3 rounded-[10px] px-3 py-2 text-[12.5px] leading-snug">
                <b>Honest status:</b> no one approached yet, no contracts signed. The pilot is our first ask.
              </p>
            </Block>

            <Block n="06" icon={Cog} title="Key activities" ar="الأنشطة الرئيسية">
              <Lines items={ACTIVITIES} size={14} />
            </Block>

            <Block n="02" icon={Sparkles} title="Value proposition" ar="القيمة المقدّمة" className="row-span-2" tone="hero">
              <Lines items={VALUE} hero size={15.5} />
              <div className="mt-3 flex items-center gap-2.5 rounded-[12px] bg-white/10 px-3.5 py-2.5 text-[13px] leading-snug text-white/85">
                <ShieldCheck className="size-5 shrink-0 text-signal-300" aria-hidden />
                <span>AI only reads report text. Routes and coordinates never leave the utility.</span>
              </div>
            </Block>

            <Block n="04" icon={Heart} title="Relationships" ar="العلاقة مع العملاء">
              <Lines items={RELATIONSHIPS} size={14} />
            </Block>

            <Block n="01" icon={Users} title="Customer segments" ar="شرائح العملاء" className="row-span-2">
              <ul className="flex flex-1 flex-col gap-2.5">
                {SEGS.map((s) => {
                  const seg = SEG[s.id]
                  return (
                    <li key={s.id} className="p-seg flex gap-3 rounded-[12px] px-3 py-2.5">
                      <span className="grid size-7 shrink-0 place-items-center rounded-full font-mono text-[12px] font-semibold text-white" style={seg.dashed ? { border: '1.5px dashed var(--p-seg-f)', color: 'var(--p-seg-f)' } : { background: seg.color === '#011c47' ? 'var(--p-seg-a)' : seg.color }}>{seg.tag}</span>
                      <span className="min-w-0 text-[13.5px] leading-snug">
                        <span className="flex items-baseline justify-between gap-2">
                          <b className="p-ink text-[14.5px] font-semibold">{s.title}</b>
                          <span className="p-faint shrink-0 font-mono text-[10.5px] uppercase tracking-[0.08em]">{seg.role.en}</span>
                        </span>
                        <span className="p-soft block">{s.proof}</span>
                      </span>
                    </li>
                  )
                })}
              </ul>
              <p className="p-soft mt-2.5 text-[12.5px] leading-snug"><b className="p-ink">Users:</b> inspection crews, NRW engineers, GIS staff. <b className="p-ink">Beneficiaries:</b> homes at the end of the line.</p>
            </Block>

            <Block n="07" icon={Layers} title="Key resources" ar="الموارد الرئيسية">
              <Lines items={RESOURCES} size={14} />
            </Block>

            <Block n="03" icon={Radio} title="Channels" ar="القنوات">
              <Lines items={CHANNELS} size={14} />
            </Block>

            {/* bottom row */}
            <section className="p-card col-span-2 flex flex-col rounded-[18px] px-6 py-5">
              <BottomHead n="09" icon={Wallet} title="Cost structure" ar="هيكل التكاليف" />
              <div className="grid grid-cols-4 gap-2.5">
                {COSTS.map((c) => (
                  <div key={c.lead} className="p-tile rounded-[12px] px-3.5 py-3">
                    <div className="p-faint text-[12.5px]">{c.lead}</div>
                    <div className="p-ink mt-0.5 text-[19px] font-semibold leading-tight tracking-[-0.01em]">{c.value}</div>
                  </div>
                ))}
              </div>
              <p className="p-soft mt-2.5 text-[13px] leading-snug">Long public sales cycle → shortened by programme-funded pilots. Fixed costs kept small on purpose.</p>
            </section>

            <section className="p-card col-span-3 flex flex-col rounded-[18px] px-6 py-5">
              <BottomHead n="05" icon={Banknote} title="Revenue streams" ar="مصادر الإيراد" aside={<span className="p-pill rounded-full px-3 py-1 text-[12.5px] font-semibold">No price before the pilot measures today’s patrol cost</span>} />
              <div className="grid grid-cols-5 gap-2.5">
                {REVENUE.map((r) => (
                  <div key={r.n} className="p-tile flex flex-col rounded-[12px] px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <span className="p-num grid size-6 place-items-center rounded-full font-mono text-[12px] font-semibold">{r.n}</span>
                      <Dots ids={r.for} />
                    </div>
                    <div className="p-ink mt-1.5 text-[15px] font-semibold leading-tight">{r.lead}</div>
                    <div className="p-soft mt-0.5 text-[13px] leading-snug">{r.rest}</div>
                  </div>
                ))}
              </div>
              <p className="p-soft mt-2.5 text-[13px] leading-snug">Market reference: <b className="p-ink">≈ JOD 83 per km a year</b> (ASTERRA, Kentucky 2023). Scale comes from per-crew licences on ~32,000 km of utility networks.</p>
            </section>
          </main>

          {/* proof strip */}
          <footer className="relative mt-3.5 grid gap-3.5 px-12 pb-8" style={{ gridTemplateColumns: 'repeat(4, 1fr) 1.55fr' }}>
            {STATS.map((s) => (
              <div key={s.v} className="p-stat flex items-start gap-3.5 rounded-[16px] px-5 py-3.5">
                <span className="p-accent shrink-0 text-[34px] font-semibold leading-none tracking-[-0.02em]" style={{ fontFamily: '"Newsreader Variable", Georgia, serif' }}>{s.v}</span>
                <span className="min-w-0 text-[13px] leading-snug">
                  <span className="p-ink block">{s.l}</span>
                  <span className="p-faint mt-0.5 block font-mono text-[10.5px]">{s.s}</span>
                </span>
              </div>
            ))}
            <div className="p-kill flex items-center gap-3.5 rounded-[16px] px-5 py-3.5">
              <Building2 className="size-7 shrink-0" aria-hidden />
              <p className="text-[13.5px] leading-snug">
                <b className="block text-[15px]">Kill line = break-even.</b>
                Below 2.2 extra cases per 100 km after one season, we drop Detect and sell field reporting and records on their own.
              </p>
            </div>
          </footer>

          <p className="p-faint absolute bottom-2.5 start-12 font-mono text-[10.5px]">
            Sources: MWI (Khaberni, Madar Al-Saa 2026) · MWI performance report 2024 · IGC 2025 · EIB ESIA consultation 2022 · World Bank 2023 · Anthropic pricing 2026. Coloured dots = the customer segment an item serves. Full sources and calculator: /#/bmc
          </p>
          <p className="p-faint absolute bottom-2.5 end-12 font-mono text-[10.5px] italic">Where records end, evidence begins.</p>
        </div>
      </div>
    </div>
  )
}

function BottomHead({ n, icon: Icon, title, ar, aside }: { n: string; icon: typeof Users; title: string; ar: string; aside?: ReactNode }) {
  return (
    <header className="mb-3 flex items-center gap-3">
      <span className="p-icon grid size-10 shrink-0 place-items-center rounded-[11px]"><Icon className="size-[20px]" aria-hidden /></span>
      <span className="p-faint font-mono text-[12px]">{n}</span>
      <h2 className="p-ink text-[21px] font-semibold leading-tight tracking-[-0.01em]">{title}</h2>
      <span lang="ar" dir="rtl" className="p-faint text-[13px]" style={{ fontFamily: '"IBM Plex Sans Arabic", sans-serif' }}>{ar}</span>
      {aside && <span className="ms-auto">{aside}</span>}
    </header>
  )
}

function LogoMarkPaths() {
  return (
    <>
      <path d="M0 162 190 289V486L353 599V973L0 716Z" fill="currentColor" />
      <path d="M268 0 577 208V817L426 704V559L268 450Z" fill="currentColor" />
    </>
  )
}

const POSTER_CSS = `
.poster-root { font-family: "IBM Plex Sans Arabic", ui-sans-serif, system-ui, sans-serif; -webkit-font-smoothing: antialiased; }
.poster-light { background: #e9e5dc; --p-seg-a: #011c47; --p-seg-f: #011c47; }
.poster-dark { background: #020a1d; --p-seg-a: #8fd3ff; --p-seg-f: #b9daff; }

.poster-light .p-stage { background: radial-gradient(1200px 600px at 85% -10%, #dfe9fb 0%, transparent 60%), #f5f2eb; color: #011c47; }
.poster-light .p-card { background: #ffffff; border: 1px solid #e4ded2; box-shadow: 0 1px 0 rgb(1 28 71 / .03), 0 12px 32px -18px rgb(1 28 71 / .18); }
.poster-light .p-hero { background: linear-gradient(160deg, #0f2f69 0%, #011c47 55%, #000f2b 100%); box-shadow: 0 24px 60px -24px rgb(1 28 71 / .55); }
.poster-light .p-ink { color: #011c47; }
.poster-light .p-soft { color: #3b4763; }
.poster-light .p-faint { color: #7a8299; }
.poster-light .p-accent { color: #1a6ff0; }
.poster-light .p-icon { background: #eef3fb; color: #1a6ff0; }
.poster-light .p-bullet { background: #1a6ff0; }
.poster-light .p-logo { color: #011c47; }
.poster-light .p-rule { background: #cfc7b8; }
.poster-light .p-chip { background: #ffffff; border: 1px solid #e4ded2; color: #011c47; }
.poster-light .p-chip svg { color: #1a6ff0; }
.poster-light .p-note { background: #fff7e8; color: #6b4300; border: 1px solid #f3dfb8; }
.poster-light .p-seg { background: #f8f6f1; }
.poster-light .p-tile { background: #f8f6f1; }
.poster-light .p-num { background: #011c47; color: #fff; }
.poster-light .p-pill { background: #fff7e8; color: #6b4300; border: 1px solid #f3dfb8; }
.poster-light .p-stat { background: #ffffff; border: 1px solid #e4ded2; }
.poster-light .p-kill { background: #011c47; color: #fff; }
.poster-light .p-kill svg { color: #8fd3ff; }

.poster-dark .p-stage { background: radial-gradient(1100px 620px at 80% -10%, rgb(42 139 255 / .22) 0%, transparent 60%), radial-gradient(900px 500px at 0% 110%, rgb(111 75 216 / .14) 0%, transparent 60%), #04102a; color: #f1f5ff; }
.poster-dark .p-card { background: rgb(255 255 255 / .045); border: 1px solid rgb(186 208 255 / .12); backdrop-filter: blur(6px); }
.poster-dark .p-hero { background: linear-gradient(160deg, #2a8bff 0%, #1257c4 50%, #0c234c 100%); box-shadow: 0 30px 80px -30px rgb(42 139 255 / .7); }
.poster-dark .p-ink { color: #f1f5ff; }
.poster-dark .p-soft { color: rgb(214 226 255 / .74); }
.poster-dark .p-faint { color: rgb(170 190 232 / .55); }
.poster-dark .p-accent { color: #8fd3ff; }
.poster-dark .p-icon { background: rgb(143 211 255 / .12); color: #8fd3ff; }
.poster-dark .p-bullet { background: #5cbcff; }
.poster-dark .p-logo { color: #f1f5ff; }
.poster-dark .p-rule { background: rgb(186 208 255 / .2); }
.poster-dark .p-chip { background: rgb(255 255 255 / .06); border: 1px solid rgb(186 208 255 / .16); color: #f1f5ff; }
.poster-dark .p-chip svg { color: #8fd3ff; }
.poster-dark .p-note { background: rgb(245 165 36 / .1); color: #ffd79a; border: 1px solid rgb(245 165 36 / .25); }
.poster-dark .p-seg { background: rgb(255 255 255 / .04); }
.poster-dark .p-tile { background: rgb(255 255 255 / .05); }
.poster-dark .p-num { background: #8fd3ff; color: #04102a; }
.poster-dark .p-pill { background: rgb(245 165 36 / .12); color: #ffd79a; border: 1px solid rgb(245 165 36 / .3); }
.poster-dark .p-stat { background: rgb(255 255 255 / .045); border: 1px solid rgb(186 208 255 / .12); }
.poster-dark .p-kill { background: linear-gradient(135deg, #f5a524, #d9822b); color: #1a0f00; }
.poster-dark .p-kill svg { color: #1a0f00; }
`
