import clsx from 'clsx'
import { useMemo, useState, type ReactNode } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { Chip, Container, Fn, StatusPill } from '../components/ui'
import { Plate, SectionHead } from './kit'
import { FieldsTable, ReportHighlighter } from '../components/Extraction'
import { useLang, type Text } from '../i18n/lang'
import { extractRules } from '../lib/extract/rules'
import { SAMPLE_REPORTS } from '../data/reports'
import { MARKET } from '../data/facts'
import { SRC } from '../data/sources'
import patchesJson from '../data/imagery/mudawwara-patches.json'

type Patch = (typeof patchesJson)['patches'][number]

/** The published ranking rule: small + isolated + new + persistent ranks above large organised circles. */
export function rankPatches(patches: Patch[]) {
  const big = patches.filter((p) => p.area_ha >= 20)
  return patches
    .map((p) => {
      const gapPx = big.length && p.area_ha < 20 ? Math.min(...big.filter((b) => b !== p).map((b) => Math.hypot(b.px[0] - p.px[0], b.px[1] - p.px[1]) - b.radius_px - p.radius_px)) : 0
      const isolationM = Math.max(0, gapPx * 10)
      const small = p.area_ha < 3
      const persistent = p.first_seen?.startsWith('2017') ?? false
      const score = (small ? 0.35 : 0) + Math.min(1, isolationM / 1500) * 0.35 + Math.min(1, p.gain / 0.4) * 0.2 + (persistent ? 0.1 : 0)
      return { p, isolationM, small, persistent, score }
    })
    .sort((a, b) => b.score - a.score)
}

/* ----------------------------- 3.1 Detect ----------------------------- */

function DetectFigure() {
  const { lang, n } = useLang()
  const ar = lang === 'ar'
  const [view, setView] = useState<'2017' | '2024' | 'change'>('change')
  const ranked = useMemo(() => rankPatches(patchesJson.patches).slice(0, 4), [])
  const [sel, setSel] = useState(0)

  return (
    <Plate
      n="4"
      caption={ar ? <>المقارنة على صورة حقيقية: بالأزرق، البكسلات التي ارتفع فيها مؤشر الخضرة (NDVI) أكثر من 0.18 بين آب 2017 وآب 2024. الترتيب صيغة معلنة لا ذكاء اصطناعي.<Fn url={SRC.sentinel.url} /><Fn url={SRC.chirps.url} /></> : <>Comparison on a real image: in blue, pixels whose greenness (NDVI) rose by more than 0.18 between August 2017 and August 2024. The ranking is a published formula, not AI.<Fn url={SRC.sentinel.url} /><Fn url={SRC.chirps.url} /></>}
    >
      <div className="relative aspect-[4/3] bg-navy-950">
        <img src="./imagery/mudawwara-2017.webp" alt="" className={clsx('absolute inset-0 size-full object-cover transition-opacity duration-500', view === '2017' ? 'opacity-100' : 'opacity-0')} />
        <img src="./imagery/mudawwara-2024.webp" alt={ar ? 'صورة Sentinel-2، آب 2024' : 'Sentinel-2 image, August 2024'} className={clsx('absolute inset-0 size-full object-cover transition-[opacity,filter] duration-500', view === '2017' ? 'opacity-0' : 'opacity-100', view === 'change' && 'brightness-[0.6] saturate-[0.35]')} />
        <img src="./imagery/mudawwara-change.png" alt="" className={clsx('absolute inset-0 size-full object-cover transition-opacity duration-500 [image-rendering:pixelated]', view === 'change' ? 'opacity-100' : 'opacity-0')} />
        {ranked.map((r, i) => (
          <button key={i} type="button" onClick={() => setSel(i)} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${r.p.pct[0]}%`, top: `${r.p.pct[1]}%` }} aria-label={`${ar ? 'الموقع' : 'Site'} ${i + 1}`}>
            <span className={clsx('grid size-7 place-items-center rounded-[9px] border-2 font-mono text-[12px] font-semibold shadow-[0_6px_14px_-6px_rgb(0_0_0/0.7)] transition-all', sel === i ? 'scale-110 border-white bg-candidate text-navy-950' : 'border-candidate bg-navy-950/80 text-candidate')}>{i + 1}</span>
          </button>
        ))}
        <span className="absolute bottom-3 start-3 rounded-full bg-white/90 px-2.5 py-1 font-mono text-[10.5px] text-navy-900 shadow-sm backdrop-blur" dir="ltr">12 × 9 km · 10 m/px</span>
      </div>

      <div className="flex gap-1 border-y border-hair bg-canvas p-1.5 text-[13px]" role="tablist" aria-label={ar ? 'عرض الصورة' : 'Image view'}>
        {(
          [
            ['2017', ar ? 'آب 2017' : 'Aug 2017'],
            ['2024', ar ? 'آب 2024' : 'Aug 2024'],
            ['change', ar ? 'التغيّر' : 'Change'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={view === k} onClick={() => setView(k)} className={clsx('flex-1 rounded-[10px] py-2 font-semibold transition-all', view === k ? 'bg-gradient-to-b from-navy-700 to-navy-900 text-white shadow-[0_6px_14px_-8px_rgb(1_28_71/0.8)]' : 'text-navy-900 hover:bg-card')}>
            {l}
          </button>
        ))}
      </div>

      <table className="w-full text-[13.5px]">
        <thead>
          <tr className="border-b border-hair bg-canvas/50 text-start font-mono text-[11px] text-ink-soft">
            <th className="px-4 py-2 text-start font-normal">#</th>
            <th className="px-2 py-2 text-start font-normal">{ar ? 'المساحة' : 'Area'}</th>
            <th className="px-2 py-2 text-start font-normal">{ar ? 'أول ظهور' : 'First seen'}</th>
            <th className="px-2 py-2 text-start font-normal">{ar ? 'العزلة' : 'Isolation'}</th>
            <th className="px-2 py-2 text-start font-normal">ΔNDVI</th>
            <th className="px-4 py-2 text-end font-normal">{ar ? 'الدرجة' : 'Score'}</th>
          </tr>
        </thead>
        <tbody>
          {ranked.map((r, i) => (
            <tr key={i} onClick={() => setSel(i)} className={clsx('cursor-pointer border-b border-hair/70 transition-colors last:border-0', sel === i ? 'bg-candidate/10' : 'hover:bg-canvas')}>
              <td className="px-4 py-2.5 font-mono font-semibold text-navy-900">{i + 1}</td>
              <td className="num px-2 py-2.5" dir="ltr" data-num="">{n(r.p.area_ha, { maximumFractionDigits: 2 })} ha</td>
              <td className="num px-2 py-2.5" dir="ltr" data-num="">{r.p.first_seen}</td>
              <td className="num px-2 py-2.5" dir="ltr" data-num="">{r.isolationM > 0 ? `${n(Math.round(r.isolationM / 10) * 10)} m` : '—'}</td>
              <td className="num px-2 py-2.5" dir="ltr" data-num="">+{r.p.gain.toFixed(2)}</td>
              <td className="num px-4 py-2.5 text-end font-mono" dir="ltr">{r.score.toFixed(2)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Plate>
  )
}

/* ----------------------------- 3.2 Verify ----------------------------- */

function VerifyFigure() {
  const { lang, t } = useLang()
  const ar = lang === 'ar'
  const [text, setText] = useState(SAMPLE_REPORTS[0].text)
  const [editing, setEditing] = useState(false)
  const [active, setActive] = useState<string | null>(null)
  const x = useMemo(() => extractRules(text), [text])

  return (
    <Plate
      n="5"
      caption={ar ? <>بلاغ ميداني (اصطناعي) وما استُخرج منه. كل حقل مرتبط بكلماته في النص، وما لم يُذكر يبقى فارغًا. «2 إنش بلاستيك» = 63 ملم حسب مواصفة مياهنا للبولي إيثيلين.<Fn url={MARKET.pe63.source.url} /></> : <>A (synthetic) field report and what was extracted from it. Each field links to its words in the text; anything unmentioned stays empty. “2-inch plastic” = 63 mm per Miyahuna’s PE specification.<Fn url={MARKET.pe63.source.url} /></>}
    >
      <div className="flex flex-wrap items-center gap-2 border-b border-hair bg-canvas/50 px-5 py-3 text-[12.5px]">
        <span className="font-mono text-[11px] text-muted">{ar ? 'بلاغات:' : 'Reports:'}</span>
        {SAMPLE_REPORTS.slice(0, 5).map((r) => (
          <button key={r.id} type="button" onClick={() => { setText(r.text); setEditing(false) }} className={clsx('rounded-full px-3 py-1 ring-1 transition-colors', text === r.text ? 'bg-navy-900 font-semibold text-white ring-navy-900' : 'bg-card text-ink-2 ring-hair hover:text-navy-900 hover:ring-signal-200')}>
            {t(r.title)}
          </button>
        ))}
        <button type="button" onClick={() => setEditing((v) => !v)} className="ms-auto rounded-full bg-signal-50 px-3 py-1 font-mono text-[11px] font-semibold text-signal-700 ring-1 ring-signal-100 transition-colors hover:bg-signal-100">{editing ? (ar ? 'تم' : 'Done') : ar ? 'اكتب بلاغك' : 'Write your own'}</button>
      </div>

      <div className="px-6 py-7 sm:px-8">
        {editing ? (
          <textarea value={text} onChange={(e) => setText(e.target.value)} dir="rtl" lang="ar" rows={3} autoFocus className="w-full resize-none rounded-[12px] border border-hair-2 bg-canvas p-3 font-display text-[22px] leading-[1.7] text-navy-900 outline-none transition-shadow focus:border-signal-500 focus:shadow-[0_0_0_4px_rgb(26_111_240/0.15)]" />
        ) : (
          <ReportHighlighter text={text} extraction={x} active={active} onHover={setActive} className="font-display !text-[clamp(1.4rem,2.4vw,1.85rem)] !leading-[1.9] text-navy-900" />
        )}
        <div className="mt-4 flex flex-wrap items-center gap-4">
          <Chip kind="rules" className="rounded-full bg-canvas px-2.5 py-1.5 ring-1 ring-hair">{ar ? 'محرّك القواعد · يعمل دون إنترنت' : 'Rules engine · works offline'}</Chip>
          <Chip kind="unconfirmed" className="rounded-full bg-amber-50 px-2.5 py-1.5 !text-amber-800 ring-1 ring-amber-200" />
        </div>
      </div>

      <div className="border-t border-hair px-5 py-2 sm:px-6">
        <FieldsTable extraction={x} active={active} onHover={setActive} />
        {x.warnings.map((w, i) => (
          <p key={i} className="border-t border-hair/70 py-2 text-[12.5px] text-candidate-ink">{t(w)}</p>
        ))}
      </div>
    </Plate>
  )
}

/* ----------------------------- 3.3 Remember ----------------------------- */

type Stage = 'draft' | 'approved' | 'exported'

function RememberFigure() {
  const { lang } = useLang()
  const ar = lang === 'ar'
  const reduce = useReducedMotion()
  const [stage, setStage] = useState<Stage>('draft')
  const approved = stage !== 'draft'
  const line = approved ? '#011c47' : '#6f4bd8'

  const attrs: { k: string; v: string; note: Text; changed?: boolean }[] = [
    { k: 'MATERIAL', v: approved ? 'PE' : '—', note: approved ? { ar: 'حدّده المهندس', en: 'set by the engineer' } : { ar: 'مرشّحات: PE / HDPE / PVC', en: 'candidates: PE / HDPE / PVC' }, changed: approved },
    { k: 'WP_MAT_TXT_S', v: 'بلاستيك', note: { ar: 'كلمة الطاقم كما هي', en: "the crew's own word" } },
    { k: 'DIAMETER', v: '63', note: { ar: '2 إنش بلاستيك (مواصفة مياهنا)', en: '2 in plastic (Miyahuna spec)' } },
    { k: 'CIP_WP_TYPE', v: '6', note: { ar: 'وصلة منزلية', en: 'House connection' } },
    { k: 'OWNEDBY', v: '-1', note: { ar: 'خاص', en: 'Private' } },
    { k: 'WP_COND', v: approved ? '3' : '4', note: approved ? { ar: 'جيد', en: 'Good' } : { ar: 'قيد الفحص', en: 'Under check' }, changed: approved },
    { k: 'WP_STATUS', v: approved ? '1' : '—', note: approved ? { ar: 'قائم ومفعّل', en: 'Existing, active' } : { ar: 'فارغ في المسودة', en: 'empty in draft' }, changed: approved },
  ]

  const trail: { at: string; who: Text; what: Text; show: boolean }[] = [
    { at: '09:12', who: { ar: 'الفريق 3', en: 'Crew 3' }, what: { ar: 'أرسل بلاغًا صوتيًا؛ النص الأصلي والصورة محفوظان', en: 'sent a voice report; original words and photo kept' }, show: true },
    { at: '09:12', who: { ar: 'النظام', en: 'System' }, what: { ar: 'استخرج الحقول، كلٌّ بكلماته؛ غير مؤكّد', en: 'extracted fields, each with its words; unconfirmed' }, show: true },
    { at: '09:20', who: { ar: 'النظام', en: 'System' }, what: { ar: 'أنشأ مسودة wMain بحالة «قيد الفحص» (4)', en: 'drafted a wMain edit, “under check” (4)' }, show: true },
    { at: '09:41', who: { ar: 'مهندس GIS', en: 'GIS engineer' }, what: { ar: 'اعتمد التعديل وحدّد المادة PE', en: 'approved the edit and set material PE' }, show: approved },
    { at: '09:42', who: { ar: 'مهندس GIS', en: 'GIS engineer' }, what: { ar: 'صدّره بنظام EPSG:28191 الذي يستخدمه خادم مياهنا', en: "exported it in EPSG:28191, the CRS of Miyahuna's server" }, show: stage === 'exported' },
  ]

  return (
    <Plate
      n="6"
      caption={ar ? <>مسودة تعديل بصيغة wMain التي رأيناها في مخطط منشور لمياهنا: متقطّعة وحالتها «قيد الفحص» حتى يعتمدها مهندس، ثم تُصدَّر. الخط والمزرعة توضيحيان.<Fn url={SRC.wmain.url} /></> : <>A draft edit in the wMain format we found in a published Miyahuna schema: dashed and “under check” until an engineer approves it, then exported. The line and farm are illustrative.<Fn url={SRC.wmain.url} /></>}
    >
      <div className="grid md:grid-cols-[1.15fr_1fr]">
        <div className="relative border-b border-hair bg-[#f1ece1] md:border-b-0 md:border-e">
          <svg viewBox="0 0 520 380" className="block w-full" role="img" aria-label={ar ? 'خريطة توضيحية: خط رئيسي ووصلة جديدة إلى مزرعة' : 'Illustrative map: a main line and a new connection to a farm'}>
            <defs>
              <pattern id="farm-hatch" width="7" height="7" patternUnits="userSpaceOnUse" patternTransform="rotate(34)">
                <line x1="0" y1="0" x2="0" y2="7" stroke="#8aa86a" strokeWidth="1.4" />
              </pattern>
            </defs>
            <rect width="520" height="380" fill="#f1ece1" />
            {Array.from({ length: 9 }, (_, i) => <line key={`v${i}`} x1={i * 65} y1="0" x2={i * 65} y2="380" stroke="#011c47" strokeOpacity="0.05" />)}
            {Array.from({ length: 6 }, (_, i) => <line key={`h${i}`} x1="0" y1={i * 76} x2="520" y2={i * 76} stroke="#011c47" strokeOpacity="0.05" />)}
            <path d="M-10 270 C 120 250, 260 282, 540 232" fill="none" stroke="#c9bfa9" strokeWidth="14" />
            <path d="M-10 270 C 120 250, 260 282, 540 232" fill="none" stroke="#fff" strokeWidth="1.2" strokeDasharray="8 8" />
            <text x="34" y="300" fontSize="11.5" fill="#6d6555">{ar ? 'الطريق' : 'Road'}</text>
            <path d="M-10 212 C 140 194, 300 226, 540 176" fill="none" stroke="#011c47" strokeWidth="5" />
            <text x="352" y="192" fontSize="11.5" fill="#011c47" fontWeight="600">{ar ? 'خط رئيسي (توضيحي)' : 'Main line (illustrative)'}</text>
            <rect x="304" y="44" width="150" height="96" fill="url(#farm-hatch)" stroke="#6f8f4f" strokeWidth="1.2" />
            <text x="379" y="98" textAnchor="middle" fontSize="12" fill="#3f5a25" fontWeight="600">{ar ? 'مزرعة' : 'Farm'}</text>
            <motion.path
              d="M262 211 L 268 152 L 320 114"
              fill="none"
              stroke={line}
              strokeWidth="3.5"
              initial={false}
              animate={{ strokeDasharray: approved ? '400 0' : '8 6' }}
              transition={{ duration: reduce ? 0 : 0.9, ease: [0.22, 1, 0.36, 1] }}
            />
            <circle cx="262" cy="211" r="6" fill="#fff" stroke={line} strokeWidth="2.5" />
            {/* north arrow + scale bar */}
            <g transform="translate(484 40)">
              <path d="M0 -16 L6 6 L0 2 L-6 6 Z" fill="#011c47" />
              <text y="22" textAnchor="middle" fontSize="10" fill="#011c47" fontFamily="IBM Plex Mono">N</text>
            </g>
            <g transform="translate(24 352)">
              <rect width="40" height="5" fill="#011c47" />
              <rect x="40" width="40" height="5" fill="#fff" stroke="#011c47" strokeWidth="1" />
              <text x="0" y="-5" fontSize="9.5" fill="#011c47" fontFamily="IBM Plex Mono">0</text>
              <text x="76" y="-5" fontSize="9.5" fill="#011c47" fontFamily="IBM Plex Mono">50 m</text>
            </g>
            <text x="276" y="140" fontSize="11" fill={line} fontWeight="600">{approved ? (ar ? 'معتمد' : 'approved') : ar ? 'مسودة' : 'draft'}</text>
          </svg>
        </div>

        <div className="flex flex-col">
          <div className="flex items-center justify-between border-b border-hair bg-canvas/50 px-4 py-2.5">
            <span className="font-mono text-[11px] text-muted" dir="ltr">wMain · MB-0142</span>
            {approved ? <StatusPill tone="verified" className="!rounded-full">{ar ? 'معتمد' : 'Approved'}</StatusPill> : <StatusPill tone="neutral" dashed className="!rounded-full">{ar ? 'قيد الفحص' : 'Under check'}</StatusPill>}
          </div>
          <table className="w-full text-[12.5px]">
            <tbody>
              {attrs.map((a) => (
                <tr key={a.k} className={clsx('border-b border-hair/70 transition-colors', a.changed && 'bg-signal-50')}>
                  <td className="px-4 py-1.5 font-mono text-[11px] text-ink-2" dir="ltr">{a.k}</td>
                  <td className={clsx('px-2 py-1.5 font-semibold text-navy-900', a.k === 'WP_MAT_TXT_S' ? 'font-sans' : 'font-mono')} dir={a.k === 'WP_MAT_TXT_S' ? 'rtl' : 'ltr'}>{a.v}</td>
                  <td className="px-4 py-1.5 text-muted">{ar ? a.note.ar : a.note.en}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-auto flex gap-2 p-4">
            {stage === 'draft' && <button type="button" onClick={() => setStage('approved')} className="h-10 flex-1 rounded-[10px] bg-gradient-to-b from-signal-500 to-signal-700 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_8px_18px_-8px_rgb(42_139_255/0.9)] transition-transform hover:-translate-y-0.5">{ar ? 'اعتماد المهندس' : 'Engineer approves'}</button>}
            {stage === 'approved' && <button type="button" onClick={() => setStage('exported')} className="h-10 flex-1 rounded-[10px] bg-gradient-to-b from-navy-700 to-navy-900 text-[13px] font-semibold text-white shadow-[0_8px_18px_-8px_rgb(1_28_71/0.8)] transition-transform hover:-translate-y-0.5">{ar ? 'تصدير إلى مياهنا' : 'Export to Miyahuna'}</button>}
            {stage !== 'draft' && <button type="button" onClick={() => setStage('draft')} className="h-10 rounded-[10px] border border-hair-2 bg-card px-3.5 text-[13px] text-navy-900 transition-colors hover:bg-canvas">{ar ? 'إعادة' : 'Reset'}</button>}
          </div>
        </div>
      </div>

      <ol className="border-t border-hair bg-canvas/40 px-4 py-3">
        <li className="mb-1.5 font-mono text-[11px] text-muted">{ar ? 'سجل التدقيق — يُضاف إليه ولا يُحذف منه' : 'Audit trail — append-only'}</li>
        <AnimatePresence initial={false}>
          {trail.filter((e) => e.show).map((e) => (
            <motion.li key={e.at + e.what.en} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex gap-4 border-t border-hair/70 py-1.5 text-[12.5px]">
              <span className="num w-10 shrink-0 font-mono text-muted" dir="ltr">{e.at}</span>
              <span className="text-ink"><span className="font-semibold text-navy-900">{ar ? e.who.ar : e.who.en}</span> {ar ? e.what.ar : e.what.en}</span>
            </motion.li>
          ))}
        </AnimatePresence>
      </ol>
    </Plate>
  )
}

/* ----------------------------- Section ----------------------------- */

function Step({ num, title, body, points, note, figure, flip }: { num: string; title: string; body: ReactNode; points: string[]; note: string; figure: ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-start gap-10 lg:grid-cols-12 lg:gap-10">
      <div className={clsx('lg:col-span-4 lg:pt-2', flip && 'lg:order-2 lg:col-start-9')}>
        <p className="inline-flex h-8 items-center rounded-full bg-gradient-to-b from-signal-500 to-signal-700 px-3.5 font-mono text-[12.5px] font-semibold text-white shadow-[0_8px_18px_-8px_rgb(42_139_255/0.9)]" dir="ltr" data-num="">{num}</p>
        <h3 className="mt-4 text-[clamp(1.75rem,2.7vw,2.3rem)] font-semibold text-navy-900">{title}</h3>
        <div className="mt-4 text-[16.5px] leading-[1.9] text-ink-2">{body}</div>
        <ol className="mt-6 grid gap-3">
          {points.map((p, i) => (
            <li key={i} className="flex gap-3 text-[15px] leading-relaxed text-ink">
              <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-signal-50 font-mono text-[10.5px] font-semibold text-signal-700 ring-1 ring-signal-100" dir="ltr">{String(i + 1).padStart(2, '0')}</span>
              <span>{p}</span>
            </li>
          ))}
        </ol>
        <p className="mt-6 flex items-center gap-2.5 rounded-[12px] border border-hair/80 bg-card px-4 py-3 text-[13.5px] font-semibold text-navy-900 shadow-[0_1px_2px_rgb(1_28_71/0.04),0_10px_24px_-18px_rgb(1_28_71/0.25)]"><span className="h-4 w-1 shrink-0 rounded-full bg-gradient-to-b from-signal-400 to-signal-700" aria-hidden />{note}</p>
      </div>
      <div className={clsx('lg:col-span-8', flip && 'lg:order-1 lg:col-start-1')}>{figure}</div>
    </div>
  )
}

export default function How() {
  const { lang } = useLang()
  const ar = lang === 'ar'
  return (
    <section id="how" className="scroll-mt-28 pt-24 sm:pt-32">
      <Container>
        <SectionHead
          index="03"
          eyebrow={ar ? 'كيف يعمل' : 'How it works'}
          title={ar ? 'رصد، تحقّق، توثيق' : 'Detect, verify, remember'}
          lead={ar ? 'فكرتان في منصة واحدة: «معين» يدلّ الفرق إلى أين تذهب، و«ذاكرة المياه» تضمن ألّا يضيع ما تجده. والذكاء الاصطناعي في مكان واحد فقط، حيث يضيف قيمة فعلًا.' : 'Two ideas in one platform: Ma’een tells crews where to go, and Water Memory makes sure what they find is never lost. AI sits in exactly one place, where it truly adds value.'}
        />

        <div className="mt-14 grid gap-20 sm:gap-24">
          <Step
            num="3.1"
            title={ar ? 'رصد: الصورة تقول أين نذهب' : 'Detect: the image says where to go'}
            body={ar ? 'نقارن صور Sentinel-2 المجانية للشهر الجاف نفسه عبر عدّة سنوات، ونبحث عن رقع خضراء أو رطبة جديدة ومعزولة قرب الخطوط الرئيسية في الأرض المفتوحة.' : 'We compare free Sentinel-2 images of the same dry month across several years, looking for new, isolated green or wet patches near main lines in open land.'}
            points={
              ar
                ? ['آب بلا مطر في كل المحافظات، فأي خضرة جديدة فيه لها مصدر ماء.', 'البطاقة لا تقول «تسرّب» ولا «سارق»: تقول «يستحق الفحص، لأن…».', 'الاستخدامات المرخّصة المعروفة تُستبعد كي لا يتكرّر الإنذار نفسه.']
                : ['August is rain-free in every governorate, so new green then has a water source.', 'A card never says “leak” or “thief”: it says “worth inspecting, because…”.', 'Known licensed uses are filtered out so the same alarm never repeats.']
            }
            note={ar ? 'ليس ذكاءً اصطناعيًا: مقارنة صور وصيغة ترتيب معلنة.' : 'Not AI: image comparison and a published ranking formula.'}
            figure={<DetectFigure />}
          />
          <Step
            flip
            num="3.2"
            title={ar ? 'تحقّق: بلاغ عربي يصبح حقولًا' : 'Verify: an Arabic report becomes fields'}
            body={ar ? 'يزور الفريق الموقع ويكتب أو يسجّل بلاغه بلهجته. الذكاء الاصطناعي يحوّله إلى حقول منظّمة، ويُظهر الكلمات التي جاء منها كل حقل، ويترك ما لم يُذكر فارغًا بدل أن يخمّنه.' : 'The crew visits and types or records a report in their own dialect. AI turns it into structured fields, shows the words each field came from, and leaves anything unmentioned empty instead of guessing.'}
            points={
              ar
                ? ['مقاسات مياهنا لا التحويل الحسابي: «2 إنش بلاستيك» = 63 ملم.', '«بلاستيك» لا يكفي لاختيار رمز المادة، فيبقى للمهندس مع المرشّحات.', 'جرّب: اختر بلاغًا آخر، أو اكتب بلاغك أنت.']
                : ['Miyahuna’s sizes, not arithmetic: “2-inch plastic” = 63 mm.', '“Plastic” is not enough to pick a material code, so it stays with the engineer.', 'Try it: pick another report, or write your own.']
            }
            note={ar ? 'هنا فقط نستخدم الذكاء الاصطناعي.' : 'This is the only place we use AI.'}
            figure={<VerifyFigure />}
          />
          <Step
            num="3.3"
            title={ar ? 'توثيق: ما يجده الميدان لا يضيع' : 'Remember: what crews find is never lost'}
            body={ar ? 'إذا وجد الفريق أنبوبًا أو وصلة غير مرسومة، نجهّز مسودة تعديل بصيغة مياهنا نفسها. تبقى متقطّعة حتى يعتمدها مهندس، ثم تُصدَّر إلى نظامهم.' : 'If the crew finds a pipe or connection missing from the map, we draft an edit in Miyahuna’s own format. It stays dashed until an engineer approves it, then exports to their system.'}
            points={
              ar
                ? ['كل سجل يحفظ: من أبلغ، ومتى، والكلمات الأصلية، والصورة، ومن اعتمد.', 'النتائج المؤكّدة تحسّن الترتيب القادم.', 'لا يظهر عنصر غير مؤكّد على أنه مؤكّد. أبدًا.']
                : ['Every record keeps who reported, when, the original words, the photo, and who approved.', 'Confirmed outcomes improve the next ranking.', 'Nothing unconfirmed is ever shown as confirmed.']
            }
            note={ar ? 'ليس ذكاءً اصطناعيًا: تحقق خرائطي واعتماد بشري.' : 'Not AI: map checks and human approval.'}
            figure={<RememberFigure />}
          />
        </div>
      </Container>
    </section>
  )
}
