import React from 'react'
import { AbsoluteFill, Easing, Img, interpolate, random, spring, staticFile, useCurrentFrame, useVideoConfig } from 'remotion'
import { Backdrop, C, CountUp, Dust, EXPO, F, Kicker, LOGO_GAP, LOGO_LEFT, LOGO_RIGHT, SceneFade, Words, ease, lerp } from './kit'
import { JordanMap, LINE_MID, at } from './map'

export type SceneProps = { dur: number }

const glass: React.CSSProperties = {
  background: 'linear-gradient(160deg, rgba(255,255,255,0.075), rgba(255,255,255,0.025))',
  border: '1px solid rgba(186,208,255,0.16)',
  borderRadius: 28,
  boxShadow: '0 40px 90px -40px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.08)',
  backdropFilter: 'blur(14px)',
}

function Source({ children, start, style }: { children: React.ReactNode; start: number; style?: React.CSSProperties }) {
  const f = useCurrentFrame()
  return <div style={{ fontFamily: F.mono, fontSize: 17, letterSpacing: '0.04em', color: C.faint, opacity: ease(f, start, 20), ...style }}>{children}</div>
}

/* ================================================================== 1. desert */
export function Desert({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const cam = interpolate(f, [0, dur], [1, 1.07])
  return (
    <SceneFade inF={0}>
      <Backdrop tint={0.35} />
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(2,8,23,0.9) 0%, rgba(2,8,23,0.35) 45%, transparent 70%)' }} />
      <Dust n={60} opacity={0.35} />
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: '1250px 545px' }}>
        <JordanMap f={f} scan={interpolate(f, [96, 196], [0, 1.02], { extrapolateLeft: 'extend', extrapolateRight: 'extend' })} texture={0.9 * ease(f, 60, 70)} outline={ease(f, 8, 95, Easing.bezier(0.45, 0, 0.2, 1))} fill={ease(f, 40, 60)} grid={ease(f, 0, 50)} line={ease(f, 212, 100, Easing.bezier(0.5, 0, 0.2, 1))} flow={ease(f, 290, 30)} labels={ease(f, 222, 30)} />
      </AbsoluteFill>
      {/* km counter beside the line */}
      <div style={{ position: 'absolute', left: LINE_MID[0] + 60, top: LINE_MID[1] - 92, padding: '16px 22px 14px', borderRadius: 18, background: 'rgba(4,16,42,0.72)', border: '1px solid rgba(143,211,255,0.25)', backdropFilter: 'blur(8px)', boxShadow: '0 20px 50px -20px rgba(0,0,0,0.8)', opacity: ease(f, 236, 20), transform: `translateX(${(1 - ease(f, 236, 30)) * 30}px)` }}>
        <div style={{ fontFamily: F.serif, fontSize: 92, color: '#fff', fontWeight: 500, lineHeight: 1, textShadow: '0 0 30px rgba(42,139,255,0.6)' }}>
          <CountUp to={325} start={240} dur={70} />
          <span style={{ fontSize: 40, color: C.ice, marginLeft: 10 }}>km</span>
        </div>
        <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: '0.18em', color: C.muted, marginTop: 8 }}>DISI → AMMAN · ROUTE ILLUSTRATIVE</div>
      </div>
      <div style={{ position: 'absolute', left: 130, top: 250, width: 820 }}>
        <Kicker start={30}>Jordan · 2026</Kicker>
        <Words text="One of the most water-scarce countries on Earth." start={72} stagger={4} highlight={['water-scarce']} style={{ marginTop: 34, fontFamily: F.serif, fontSize: 96, lineHeight: 1.02, color: '#fff', fontWeight: 400, letterSpacing: '-0.015em' }} />
        <Words text="Its water is pumped hundreds of kilometres across the desert." start={214} stagger={3} style={{ marginTop: 46, fontFamily: F.sans, fontSize: 38, lineHeight: 1.3, color: C.muted, maxWidth: 680 }} />
      </div>
    </SceneFade>
  )
}

/* ================================================================== 2. loss */
export function Loss({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const cam = 1.07 + f * 0.0002
  return (
    <SceneFade>
      <Backdrop tint={0.3} glow="#ff4d57" />
      <Dust n={40} opacity={0.25} color={C.amber} />
      <AbsoluteFill style={{ transform: `scale(${cam})`, transformOrigin: '1250px 545px' }}>
        <JordanMap f={f + 373} texture={0.9} line={1} flow={1 - ease(f, 40, 60) * 0.6} leak={ease(f, 10, 40)} labels={1 - ease(f, 0, 30) * 0.5} lineColor={interpolate(f, [0, 80], [0, 1], { extrapolateRight: 'clamp' }) > 0.5 ? '#b9d5f2' : C.ice} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(2,8,23,0.95) 0%, rgba(2,8,23,0.6) 45%, transparent 75%)' }} />
      <div style={{ position: 'absolute', left: 130, top: 190 }}>
        <Kicker start={6} color={C.amber}>More than</Kicker>
        <div style={{ fontFamily: F.serif, fontSize: 330, lineHeight: 0.95, fontWeight: 500, letterSpacing: '-0.04em', marginTop: 10, background: 'linear-gradient(180deg, #ffffff 0%, #ffd79a 60%, #f5a524 100%)', WebkitBackgroundClip: 'text', color: 'transparent', filter: `blur(${(1 - ease(f, 10, 20)) * 14}px)`, opacity: ease(f, 10, 16) }}>
          <CountUp to={40} start={12} dur={55} />%
        </div>
        <Words text="of Jordan’s water never reaches a bill." start={86} stagger={4} highlight={['never']} style={{ marginTop: 10, fontFamily: F.serif, fontSize: 64, color: '#fff', maxWidth: 780, lineHeight: 1.08 }} wordStyle={(i, w) => (w === 'never' ? { color: C.amber, fontStyle: 'italic' } : undefined)} />
        <Source start={110} style={{ marginTop: 34 }}>NON-REVENUE WATER · MINISTRY OF WATER AND IRRIGATION, 2024–2026</Source>
      </div>
    </SceneFade>
  )
}

/* ================================================================== 3. attacks */
export function Attacks({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const z = ease(f, 0, 150, Easing.bezier(0.6, 0, 0.2, 1))
  const zoom = lerp(1.07, 2.05, z)
  const shift: [number, number] = [lerp(0, 1340 - LINE_MID[0], z), lerp(0, 560 - LINE_MID[1], z)]
  const p = interpolate(f, [20, 160, 290, 360], [0, 0.18, 0.45, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.5, 0, 0.5, 1) })
  const statIn = ease(f, 176, 26)
  const shake = f > 291 && f < 330 ? Math.sin(f * 2.1) * (330 - f) * 0.15 : 0
  return (
    <SceneFade>
      <Backdrop tint={0.25} glow="#ff4d57" />
      <AbsoluteFill style={{ transform: `translate(${shake}px, ${shake * 0.6}px)` }}>
        <JordanMap f={f + 522} texture={0.9} line={1} flow={0.6} leak={0.35} pings={p} labels={0.6} zoom={zoom} shift={shift} focus={LINE_MID} grid={0.6} />
      </AbsoluteFill>
      <AbsoluteFill style={{ background: 'linear-gradient(90deg, rgba(2,8,23,0.97) 0%, rgba(2,8,23,0.75) 40%, transparent 70%)' }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 70% 50%, rgba(255,77,87,${0.16 * ease(f, 291, 10) * (1 - ease(f, 301, 40))}), transparent 60%)` }} />
      <div style={{ position: 'absolute', left: 130, top: 170, width: 860, opacity: 1 - statIn * 0.72, transform: `translateY(${-statIn * 40}px) scale(${1 - statIn * 0.12})`, transformOrigin: 'left top' }}>
        <Kicker start={8} color={C.red}>Along the carrier lines</Kicker>
        <Words text="Illegal taps hide in plain sight." start={14} stagger={5} style={{ marginTop: 30, fontFamily: F.serif, fontSize: 104, lineHeight: 1.0, color: '#fff' }} wordStyle={(i) => (i === 0 ? { color: C.red } : undefined)} />
      </div>
      <div style={{ position: 'absolute', left: 130, top: 470, opacity: statIn }}>
        <Kicker start={182} color={C.amber}>Disi line · 2025</Kicker>
        <div style={{ fontFamily: F.serif, fontSize: 250, fontWeight: 500, lineHeight: 1, letterSpacing: '-0.03em', marginTop: 8, background: 'linear-gradient(180deg, #fff 10%, #ffb259 55%, #ff4d57 100%)', WebkitBackgroundClip: 'text', color: 'transparent', opacity: ease(f, 282, 8), filter: `blur(${(1 - ease(f, 282, 14)) * 12}px)`, transform: `scale(${1 + 0.08 * (1 - ease(f, 291, 18))})`, transformOrigin: 'left center' }}>
          <CountUp to={1802} start={286} dur={60} />
        </div>
        <Words text="attacks logged — the most since 2014." start={300} stagger={3} style={{ fontFamily: F.sans, fontSize: 40, color: '#fff', marginTop: 6 }} />
        <Source start={322} style={{ marginTop: 22 }}>MINISTRY OF WATER AND IRRIGATION FIGURES · KHABERNI, AUG 2026</Source>
      </div>
    </SceneFade>
  )
}

/* ================================================================== 4. records */
const REPORT = 'لقينا وصلة بلاستيك ٢ إنش طالعة من الخط عند الكيلو ١٤٧، رايحة على مزرعة جديدة. الصمام مسكّر بس في آثار حفر جديدة.'
export function Records({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const cardIn = spring({ frame: f - 6, fps, config: { damping: 16, stiffness: 90 } })
  const chars = Math.floor(interpolate(f, [70, 160], [0, REPORT.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const stamp = spring({ frame: f - 150, fps, config: { damping: 9, stiffness: 160 } })
  const mapIn = ease(f, 165, 30)
  const glitchT = ease(f, dur - 26, 26, Easing.linear)
  const gx = glitchT > 0 ? (random(`g${f}`) - 0.5) * 80 * glitchT : 0
  return (
    <SceneFade outAt={dur - 6} outF={6}>
      <Backdrop tint={0.22} glow="#f5a524" />
      <AbsoluteFill style={{ transform: `translateX(${gx}px)`, filter: glitchT > 0 ? `hue-rotate(${glitchT * 90}deg) saturate(${1 + glitchT * 2})` : undefined }}>
        {/* paper report */}
        <div style={{ position: 'absolute', left: 150, top: 150, width: 720, height: 560, background: `linear-gradient(170deg, ${C.paper}, #e4dccb)`, borderRadius: 10, boxShadow: '0 50px 100px -30px rgba(0,0,0,0.9)', transform: `translateX(${(1 - cardIn) * -900}px) rotate(${-5 + cardIn * 2}deg)`, padding: '44px 54px', overflow: 'hidden' }}>
          <div style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: '0.2em', color: '#8a7f6a', display: 'flex', justifyContent: 'space-between' }}>
            <span>FIELD REPORT</span>
            <span>FREE TEXT · AR</span>
          </div>
          <div style={{ height: 2, background: '#cfc6b3', margin: '20px 0 26px' }} />
          <div dir="rtl" lang="ar" style={{ fontFamily: F.ar, fontSize: 46, lineHeight: 1.55, color: '#1d1a14', minHeight: 300 }}>
            {REPORT.slice(0, chars)}
            <span style={{ opacity: f % 16 < 8 && chars < REPORT.length ? 1 : 0, color: '#1a6ff0' }}>|</span>
          </div>
          <div style={{ position: 'absolute', right: 40, bottom: 40, transform: `rotate(-12deg) scale(${lerp(2.2, 1, stamp)})`, opacity: Math.min(1, stamp * 1.4), border: `5px solid ${C.red}`, color: C.red, fontFamily: F.mono, fontWeight: 500, fontSize: 30, letterSpacing: '0.16em', padding: '10px 22px', borderRadius: 8 }}>NO FIELDS · NO MAP</div>
        </div>
        {/* stale GIS record */}
        <div style={{ position: 'absolute', left: 990, top: 170, width: 780, height: 520, ...glass, opacity: mapIn, transform: `translateY(${(1 - mapIn) * 50}px)`, overflow: 'hidden' }}>
          <Img src={staticFile('imagery/qatrana-2017.webp')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', filter: 'saturate(0.7) brightness(0.75)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(4,16,42,0.55), rgba(4,16,42,0.85))' }} />
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '40px 40px' }} />
          <svg width={780} height={520} style={{ position: 'absolute', inset: 0 }}>
            <path d="M-20 430 C 200 380, 330 300, 420 230 S 640 90, 820 40" stroke={C.ice} strokeWidth={6} fill="none" opacity={0.9} />
            <path d="M420 232 L 560 330 L 610 330" stroke={C.amber} strokeWidth={4} fill="none" strokeDasharray="12 12" opacity={0.25 + 0.5 * Math.abs(Math.sin(f / 9))} />
            <rect x={610} y={292} width={120} height={80} rx={6} fill="rgba(245,165,36,0.12)" stroke={C.amber} strokeDasharray="6 6" />
            <text x={545} y={300} fill={C.amber} fontFamily={F.serif} fontSize={56} opacity={0.5 + 0.5 * Math.sin(f / 6)}>?</text>
          </svg>
          <div style={{ position: 'absolute', left: 28, top: 24, fontFamily: F.mono, fontSize: 18, letterSpacing: '0.14em', color: C.muted }}>GIS RECORD · CARRIER LINE</div>
          <div style={{ position: 'absolute', left: 28, bottom: 24, display: 'flex', alignItems: 'center', gap: 12, fontFamily: F.mono, fontSize: 20, color: C.amber }}>
            <span style={{ width: 12, height: 12, borderRadius: 99, background: C.amber, boxShadow: `0 0 12px ${C.amber}` }} />LAST EDITED: 2017 · CONNECTION NOT ON THE MAP
          </div>
        </div>
        <div style={{ position: 'absolute', left: 990, top: 740, width: 800 }}>
          <Words text="The report is free text. The map rarely catches up." start={168} stagger={4} style={{ fontFamily: F.serif, fontSize: 58, lineHeight: 1.08, color: '#fff' }} wordStyle={(i, w) => (w === 'rarely' ? { color: C.amber, fontStyle: 'italic' } : undefined)} />
        </div>
      </AbsoluteFill>
      {glitchT > 0 && (
        <AbsoluteFill style={{ pointerEvents: 'none' }}>
          {Array.from({ length: 9 }).map((_, i) => (
            <div key={i} style={{ position: 'absolute', left: 0, right: 0, top: random(`gt${i}${Math.floor(f / 2)}`) * 1080, height: 6 + random(`gh${i}${f}`) * 40, background: i % 3 ? 'rgba(42,139,255,0.35)' : 'rgba(255,77,87,0.35)', transform: `translateX(${(random(`gs${i}${f}`) - 0.5) * 300}px)`, opacity: glitchT }} />
          ))}
          <AbsoluteFill style={{ background: '#000', opacity: ease(f, dur - 10, 10, Easing.linear) }} />
        </AbsoluteFill>
      )}
    </SceneFade>
  )
}


/* ================================================================== 5. reveal */
export function LogoMark({ height, gapFlow = 1, f, glowAmt = 1, split = 0 }: { height: number; gapFlow?: number; f: number; glowAmt?: number; split?: number }) {
  const w = (577 / 973) * height
  return (
    <svg viewBox="0 0 577 973" width={w} height={height} style={{ overflow: 'visible' }}>
      <defs>
        <filter id="lg" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="18" /></filter>
        <linearGradient id="slab" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" />
          <stop offset="1" stopColor="#c9dcff" />
        </linearGradient>
      </defs>
      <path d={LOGO_GAP} fill="none" stroke={C.blue} strokeWidth={60} strokeLinejoin="round" opacity={0.6 * glowAmt} filter="url(#lg)" />
      <path d={LOGO_GAP} fill="none" stroke={C.ice} strokeWidth={14} strokeLinejoin="round" opacity={gapFlow} />
      <path d={LOGO_GAP} fill="none" stroke="#fff" strokeWidth={8} strokeLinejoin="round" strokeDasharray="70 330" strokeDashoffset={-f * 9} opacity={gapFlow} />
      <path d={LOGO_LEFT} fill="url(#slab)" transform={`translate(${-split} ${split * 0.674})`} />
      <path d={LOGO_RIGHT} fill="url(#slab)" transform={`translate(${split} ${-split * 0.674})`} />
    </svg>
  )
}

export function Reveal({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const hit = 27
  const s = spring({ frame: f - hit, fps, config: { damping: 14, stiffness: 120, mass: 0.9 } })
  const streak = ease(f, 2, 24, Easing.bezier(0.7, 0, 0.84, 0))
  const flash = f >= hit ? Math.max(0, 1 - (f - hit) / 14) : 0
  const ring = ease(f, hit, 40)
  const word = ease(f, 63, 34)
  const sweep = interpolate(f, [92, 128], [-0.4, 1.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const fly = ease(f, dur - 18, 30, Easing.bezier(0.7, 0, 0.84, 0))
  return (
    <SceneFade inF={0}>
      <AbsoluteFill style={{ background: '#01040d' }} />
      <AbsoluteFill style={{ transform: `scale(${1 + fly * fly * 16})`, transformOrigin: '969px 330px', filter: `blur(${fly * 5}px)`, opacity: 1 - fly * 0.35 }}>
      <AbsoluteFill style={{ background: `radial-gradient(900px 600px at 50% 42%, rgba(42,139,255,${0.32 * s}), transparent 65%)` }} />
      {f >= hit && <Dust n={90} seed="rv" opacity={0.5 * s} speed={1.4} />}
      {/* pre-hit light streak */}
      {f < hit + 4 && <div style={{ position: 'absolute', left: 958, width: 4, bottom: 0, height: 1080 * streak, background: 'linear-gradient(0deg, transparent, #8fd3ff 40%, #fff)', boxShadow: '0 0 40px 8px rgba(42,139,255,0.8)', opacity: 1 - ease(f, hit, 4) }} />}
      {/* shockwave */}
      {f >= hit && <div style={{ position: 'absolute', left: 960 - 900 * ring, top: 420 - 900 * ring, width: 1800 * ring, height: 1800 * ring, borderRadius: '50%', border: `${3 + 20 * (1 - ring)}px solid rgba(143,211,255,${0.7 * (1 - ring)})` }} />}
      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', transform: `scale(${lerp(1.5, 1, s)})`, opacity: Math.min(1, s * 1.3), filter: `blur(${(1 - Math.min(1, s)) * 18}px)` }}>
        <LogoMark height={430} f={f} split={(1 - s) * 260} glowAmt={0.6 + 0.4 * Math.sin(f / 10)} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 590, textAlign: 'center', overflow: 'hidden' }}>
        <div style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 150, fontWeight: 500, color: '#fff', letterSpacing: `${lerp(0.35, -0.01, word)}em`, opacity: word, filter: `blur(${(1 - word) * 16}px)`, textShadow: '0 0 60px rgba(42,139,255,0.55)', position: 'relative', display: 'inline-block', paddingInline: 30 }}>
          Missing Blue
          <span style={{ position: 'absolute', inset: 0, background: `linear-gradient(100deg, transparent ${sweep * 100 - 12}%, rgba(255,255,255,0.75) ${sweep * 100}%, transparent ${sweep * 100 + 12}%)`, mixBlendMode: 'overlay' }} />
        </div>
      </div>
      <div dir="rtl" lang="ar" style={{ position: 'absolute', left: 0, right: 0, top: 800, textAlign: 'center', fontFamily: F.ar, fontWeight: 600, fontSize: 84, color: C.ice, opacity: ease(f, 78, 30), transform: `translateY(${(1 - ease(f, 78, 30)) * 30}px)` }}>الأزرق المفقود</div>
      </AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 31%, rgba(143,211,255,${0.9 * fly}), rgba(42,139,255,${0.5 * fly}) 30%, transparent 70%)` }} />
      <AbsoluteFill style={{ background: '#fff', opacity: flash * 0.85, mixBlendMode: 'screen' }} />
    </SceneFade>
  )
}

/* ================================================================== shared step header */
function StepHead({ n, word, start }: { n: string; word: string; start: number }) {
  const f = useCurrentFrame()
  const t = ease(f, start - 4, 26)
  return (
    <div style={{ position: 'absolute', left: 120, top: 92, display: 'flex', alignItems: 'baseline', gap: 26 }}>
      <span style={{ fontFamily: F.serif, fontSize: 150, lineHeight: 0.8, fontWeight: 300, color: 'transparent', WebkitTextStroke: '2px rgba(143,211,255,0.55)', opacity: t, transform: `translateY(${(1 - t) * 40}px)` }}>{n}</span>
      <span style={{ fontFamily: F.mono, fontSize: 40, letterSpacing: `${lerp(0.6, 0.32, t)}em`, color: '#fff', opacity: t, fontWeight: 500 }}>{word}</span>
    </div>
  )
}

/* ================================================================== 6. detect */
const SITES = [
  { id: 'QAT-01', score: 0.652, ha: 0.07, m: 399 },
  { id: 'QAT-02', score: 0.651, ha: 0.05, m: 394 },
  { id: 'QAT-03', score: 0.638, ha: 0.08, m: 467 },
]
const FORMULA: [string, string][] = [['0.30', 'near the line'], ['0.25', 'isolation'], ['0.20', 'change'], ['0.15', 'persistence'], ['0.10', 'small size']]
export function Detect({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const panel = spring({ frame: f - 4, fps, config: { damping: 20, stiffness: 80 } })
  const wipe = ease(f, 52, 70, Easing.bezier(0.45, 0, 0.25, 1))
  const marks = [[0.655, 0.45], [0.632, 0.62], [0.59, 0.76]]
  return (
    <SceneFade>
      <Backdrop tint={0.45} />
      <StepHead n="01" word="DETECT" start={12} />
      <div style={{ position: 'absolute', left: 120, top: 330, width: 700 }}>
        <Words text="Free satellite imagery flags new green patches beside the lines." start={46} stagger={3} highlight={['green']} style={{ fontFamily: F.serif, fontSize: 66, lineHeight: 1.06, color: '#fff' }} />
        <div style={{ marginTop: 46, fontFamily: F.mono, fontSize: 18, letterSpacing: '0.22em', color: C.ice, opacity: ease(f, 160, 20) }}>PUBLISHED FORMULA · NO BLACK BOX</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 18 }}>
          {FORMULA.map(([w, l], i) => {
            const t = spring({ frame: f - 168 - i * 6, fps, config: { damping: 13, stiffness: 160 } })
            return (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 18px', borderRadius: 999, background: 'rgba(42,139,255,0.12)', border: '1px solid rgba(143,211,255,0.3)', transform: `scale(${t})`, opacity: Math.min(1, t) }}>
                <span style={{ fontFamily: F.mono, fontSize: 22, color: C.ice, fontWeight: 500 }}>{w}</span>
                <span style={{ fontFamily: F.sans, fontSize: 22, color: '#fff' }}>{l}</span>
              </div>
            )
          })}
        </div>
      </div>
      {/* satellite panel */}
      <div style={{ position: 'absolute', left: 900, top: 110, width: 900, height: 860, borderRadius: 30, overflow: 'hidden', transform: `translateX(${(1 - panel) * 300}px) rotateY(${(1 - panel) * -12}deg)`, opacity: Math.min(1, panel * 1.2), boxShadow: '0 60px 120px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(143,211,255,0.25)' }}>
        <Img src={staticFile('imagery/qatrana-2017.webp')} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.12 - f * 0.0003})` }} />
        <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${(1 - wipe) * 100}% 0 0)` }}>
          <Img src={staticFile('imagery/qatrana-2025.webp')} style={{ position: 'absolute', width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.12 - f * 0.0003})` }} />
        </div>
        {wipe > 0 && wipe < 1 && <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${wipe * 100}%`, width: 3, background: '#fff', boxShadow: '0 0 30px 10px rgba(143,211,255,0.8)' }} />}
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(2,8,23,0.45), transparent 30%, transparent 60%, rgba(2,8,23,0.85))' }} />
        <div style={{ position: 'absolute', left: 26, top: 24, fontFamily: F.mono, fontSize: 20, letterSpacing: '0.14em', color: '#fff', padding: '8px 14px', borderRadius: 10, background: 'rgba(2,8,23,0.6)' }}>SENTINEL-2 · {wipe < 0.5 ? '2017' : '2025'}</div>
        <div style={{ position: 'absolute', right: 26, top: 24, fontFamily: F.mono, fontSize: 18, letterSpacing: '0.12em', color: C.green, padding: '8px 14px', borderRadius: 10, background: 'rgba(2,8,23,0.6)' }}>FREE · OPEN DATA</div>
        {/* detections */}
        {marks.map(([x, y], i) => {
          const t = spring({ frame: f - 118 - i * 9, fps, config: { damping: 11, stiffness: 170 } })
          const pulse = ((f + i * 13) % 36) / 36
          return (
            <div key={i} style={{ position: 'absolute', left: x * 900 - 34, top: y * 860 - 34, width: 68, height: 68, transform: `scale(${t})`, opacity: Math.min(1, t) }}>
              <div style={{ position: 'absolute', inset: 0, border: `3px solid ${C.amber}`, borderRadius: 12, boxShadow: `0 0 22px ${C.amber}` }} />
              <div style={{ position: 'absolute', inset: -14 * pulse, border: `2px solid rgba(245,165,36,${1 - pulse})`, borderRadius: 16 }} />
              <div style={{ position: 'absolute', left: 74, top: 14, fontFamily: F.mono, fontSize: 18, color: '#fff', background: 'rgba(2,8,23,0.75)', padding: '4px 10px', borderRadius: 8, whiteSpace: 'nowrap' }}>#{i + 1}</div>
            </div>
          )
        })}
        {/* ranked list */}
        <div style={{ position: 'absolute', left: 26, right: 26, bottom: 26, ...glass, borderRadius: 22, padding: '18px 22px', opacity: ease(f, 150, 20), transform: `translateY(${(1 - ease(f, 150, 26)) * 60}px)`, background: 'rgba(4,16,42,0.82)' }}>
          {SITES.map((s, i) => {
            const t = ease(f, 158 + i * 10, 30)
            return (
              <div key={s.id} style={{ display: 'grid', gridTemplateColumns: '46px 92px 120px 1fr 90px', alignItems: 'center', gap: 16, padding: '9px 0', borderTop: i ? '1px solid rgba(186,208,255,0.12)' : 'none', opacity: t }}>
                <span style={{ width: 40, height: 40, borderRadius: 99, display: 'grid', placeItems: 'center', background: 'linear-gradient(135deg, #ffd27a, #f5a524)', color: '#1a1000', fontFamily: F.mono, fontWeight: 500, fontSize: 19 }}>{i + 1}</span>
                <Img src={staticFile(`imagery/sites/${s.id}-after.webp`)} style={{ width: 92, height: 56, objectFit: 'cover', borderRadius: 8 }} />
                <span style={{ fontFamily: F.mono, fontSize: 22, color: '#fff', fontWeight: 500 }}>{s.id}</span>
                <span style={{ height: 10, borderRadius: 99, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                  <span style={{ display: 'block', height: '100%', width: `${s.score * 100 * t}%`, borderRadius: 99, background: 'linear-gradient(90deg, #1a6ff0, #8fd3ff)' }} />
                </span>
                <span style={{ fontFamily: F.mono, fontSize: 22, color: C.ice, textAlign: 'right' }}>{(s.score * t).toFixed(3)}</span>
              </div>
            )
          })}
        </div>
      </div>
    </SceneFade>
  )
}

/* ================================================================== 7. verify */
const BUBBLE: { t: string; q?: number }[] = [
  { t: 'وصلة بلاستيك ٢ إنش', q: 0 },
  { t: ' ' },
  { t: 'طالعة من الخط', q: 3 },
  { t: ' ' },
  { t: 'عند الكيلو ١٤٧', q: 1 },
  { t: '، ' },
  { t: 'رايحة على مزرعة جديدة', q: 2 },
]
const FIELDS: { k: string; v: string; quote: string }[] = [
  { k: 'Connection', v: 'Unmapped · 2-inch plastic', quote: 'وصلة بلاستيك ٢ إنش' },
  { k: 'Location', v: 'Carrier line · km 147', quote: 'عند الكيلو ١٤٧' },
  { k: 'Use', v: 'New farm', quote: 'رايحة على مزرعة جديدة' },
  { k: 'Source', v: 'Main line', quote: 'طالعة من الخط' },
]
export function Verify({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const phone = spring({ frame: f - 2, fps, config: { damping: 18, stiffness: 90 } })
  const b1 = spring({ frame: f - 56, fps, config: { damping: 14, stiffness: 150 } })
  const b2 = spring({ frame: f - 82, fps, config: { damping: 14, stiffness: 150 } })
  const b3 = spring({ frame: f - 112, fps, config: { damping: 14, stiffness: 150 } })
  const card = ease(f, 146, 26)
  const quoteGlow = ease(f, 210, 20)
  const none = spring({ frame: f - 270, fps, config: { damping: 10, stiffness: 160 } })
  return (
    <SceneFade>
      <Backdrop tint={0.4} />
      <StepHead n="02" word="VERIFY" start={12} />
      {/* phone */}
      <div style={{ position: 'absolute', left: 150, top: 250, width: 470, height: 720, borderRadius: 56, background: '#0b1630', border: '10px solid #1b2a4c', boxShadow: '0 60px 120px -30px rgba(0,0,0,0.9), 0 0 0 2px rgba(143,211,255,0.2)', transform: `translateY(${(1 - phone) * 500}px) rotate(${(1 - phone) * -6}deg)`, overflow: 'hidden' }}>
        <div style={{ height: 90, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: 16, padding: '20px 26px 0' }}>
          <span style={{ width: 46, height: 46, borderRadius: 99, background: 'linear-gradient(135deg,#2a8bff,#1257c4)', display: 'grid', placeItems: 'center', color: '#fff', fontFamily: F.mono, fontSize: 18 }}>C3</span>
          <div>
            <div style={{ fontFamily: F.sans, fontSize: 22, fontWeight: 600, color: '#fff' }}>Field crew 3</div>
            <div style={{ fontFamily: F.mono, fontSize: 14, color: C.green }}>● on site · 11:20</div>
          </div>
        </div>
        <div style={{ padding: '26px 22px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* voice note */}
          <div style={{ alignSelf: 'flex-end', width: 330, padding: '16px 18px', borderRadius: '22px 22px 6px 22px', background: '#1a6ff0', transform: `scale(${b1})`, transformOrigin: 'right bottom', opacity: Math.min(1, b1), display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 42, height: 42, borderRadius: 99, background: '#fff', display: 'grid', placeItems: 'center', color: '#1a6ff0', fontSize: 20 }}>▶</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 3, height: 40, flex: 1 }}>
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} style={{ width: 4, borderRadius: 4, background: 'rgba(255,255,255,0.9)', height: 6 + Math.abs(Math.sin(i * 1.7 + f / 4)) * (8 + (i * 7) % 26) }} />
              ))}
            </div>
            <span style={{ fontFamily: F.mono, fontSize: 15, color: '#fff' }}>0:14</span>
          </div>
          {/* text */}
          <div dir="rtl" lang="ar" style={{ alignSelf: 'flex-end', maxWidth: 380, padding: '16px 20px', borderRadius: '22px 22px 6px 22px', background: '#1a6ff0', color: '#fff', fontFamily: F.sans, fontSize: 27, lineHeight: 1.55, transform: `scale(${b2})`, transformOrigin: 'right bottom', opacity: Math.min(1, b2) }}>
            {BUBBLE.map((s, i) => (
              <span key={i} style={s.q != null ? { background: `rgba(255,255,255,${0.24 * quoteGlow})`, borderBottom: `3px solid rgba(143,211,255,${quoteGlow})`, borderRadius: 4 } : undefined}>{s.t}</span>
            ))}
          </div>
          {/* photo */}
          <div style={{ alignSelf: 'flex-end', width: 300, height: 190, borderRadius: '22px 22px 6px 22px', overflow: 'hidden', transform: `scale(${b3})`, transformOrigin: 'right bottom', opacity: Math.min(1, b3), position: 'relative', background: 'linear-gradient(160deg, #d9a066, #8a5a2b 60%, #3b2a1a)' }}>
            <svg width={300} height={190} style={{ position: 'absolute', inset: 0 }}>
              <rect x={0} y={120} width={300} height={70} fill="rgba(60,40,20,0.6)" />
              <path d="M0 150 C 80 140, 180 160, 300 145" stroke="#2b2b2b" strokeWidth={14} fill="none" />
              <path d="M150 152 L 175 120 L 260 112" stroke="#e8e8e8" strokeWidth={6} fill="none" />
              <circle cx={150} cy={152} r={9} fill="#f5a524" />
            </svg>
            <span style={{ position: 'absolute', left: 12, bottom: 10, fontFamily: F.mono, fontSize: 14, color: '#fff', background: 'rgba(0,0,0,0.45)', padding: '3px 8px', borderRadius: 6 }}>photo · 11:21</span>
          </div>
          <div style={{ alignSelf: 'flex-end', fontFamily: F.mono, fontSize: 15, color: C.ice, opacity: ease(f, 124, 12) }}>sent ✓✓</div>
        </div>
        <div style={{ position: 'absolute', left: 18, right: 18, bottom: 22, height: 64, borderRadius: 999, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(186,208,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 10px 0 24px' }}>
          <span dir="rtl" style={{ fontFamily: F.sans, fontSize: 22, color: 'rgba(214,226,255,0.45)' }}>اكتب بلاغك…</span>
          <span style={{ width: 46, height: 46, borderRadius: 99, background: 'linear-gradient(135deg,#5cbcff,#1a6ff0)', display: 'grid', placeItems: 'center', boxShadow: `0 0 ${10 + 8 * Math.abs(Math.sin(f / 8))}px rgba(42,139,255,0.7)` }}>
            <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth={2.2} strokeLinecap="round"><rect x={9} y={3} width={6} height={11} rx={3} /><path d="M5 11a7 7 0 0 0 14 0M12 18v3" /></svg>
          </span>
        </div>
      </div>
      {/* beam */}
      <svg width={1920} height={1080} style={{ position: 'absolute', inset: 0 }}>
        <path d="M640 600 C 720 600, 700 520, 800 520" stroke="url(#beam)" strokeWidth={4} fill="none" opacity={card} strokeDasharray="10 12" strokeDashoffset={-f * 2} />
        <defs><linearGradient id="beam"><stop offset="0" stopColor="#8fd3ff" stopOpacity="0" /><stop offset="1" stopColor="#8fd3ff" /></linearGradient></defs>
      </svg>
      {/* extraction card */}
      <div style={{ position: 'absolute', left: 800, top: 250, width: 1000, ...glass, padding: '30px 36px', opacity: card, transform: `translateX(${(1 - card) * 80}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ width: 46, height: 46, borderRadius: 14, background: 'linear-gradient(135deg, #d97757, #b4532a)', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 26 }}>✳</span>
            <div>
              <div style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 28, color: '#fff' }}>Claude · structured fields</div>
              <div style={{ fontFamily: F.mono, fontSize: 16, color: C.muted, letterSpacing: '0.08em' }}>EVERY FIELD MUST QUOTE THE REPORT</div>
            </div>
          </div>
          <span style={{ fontFamily: F.mono, fontSize: 16, color: C.green, border: '1px solid rgba(61,220,151,0.4)', padding: '6px 12px', borderRadius: 99 }}>EVIDENCE-BOUND</span>
        </div>
        <div style={{ marginTop: 22 }}>
          {FIELDS.map((r, i) => {
            const t = ease(f, 156 + i * 12, 22)
            return (
              <div key={r.k} style={{ display: 'grid', gridTemplateColumns: '170px 1fr 300px', alignItems: 'center', gap: 18, padding: '16px 0', borderTop: '1px solid rgba(186,208,255,0.12)', opacity: t, transform: `translateY(${(1 - t) * 20}px)` }}>
                <span style={{ fontFamily: F.mono, fontSize: 19, color: C.muted, letterSpacing: '0.06em' }}>{r.k.toUpperCase()}</span>
                <span style={{ fontFamily: F.sans, fontSize: 28, color: '#fff', fontWeight: 600 }}>{r.v}</span>
                <span dir="rtl" lang="ar" style={{ justifySelf: 'end', fontFamily: F.sans, fontSize: 24, color: '#fff', padding: '6px 14px', borderRadius: 10, background: `rgba(143,211,255,${0.1 + 0.22 * quoteGlow})`, border: `1px solid rgba(143,211,255,${0.25 + 0.5 * quoteGlow})`, boxShadow: quoteGlow ? `0 0 ${24 * quoteGlow}px rgba(42,139,255,0.5)` : undefined }}>«{r.quote}»</span>
              </div>
            )
          })}
          {/* dropped field */}
          <div style={{ display: 'grid', gridTemplateColumns: '170px 1fr 300px', alignItems: 'center', gap: 18, padding: '16px 0', borderTop: '1px solid rgba(186,208,255,0.12)', opacity: ease(f, 250, 16) * (1 - 0.55 * ease(f, 276, 14)) }}>
            <span style={{ fontFamily: F.mono, fontSize: 19, color: C.muted }}>METER NO.</span>
            <span style={{ fontFamily: F.sans, fontSize: 28, color: C.red, textDecoration: ease(f, 274, 6) > 0.5 ? 'line-through' : 'none' }}>guess: 4471-B</span>
            <span style={{ justifySelf: 'end', fontFamily: F.mono, fontSize: 18, color: C.red }}>NOT IN REPORT → DROPPED</span>
          </div>
        </div>
      </div>
      <div style={{ position: 'absolute', left: 800, top: 905, display: 'flex', alignItems: 'center', gap: 18, transform: `scale(${none})`, transformOrigin: 'left center', opacity: Math.min(1, none) }}>
        <span style={{ fontFamily: F.serif, fontSize: 84, color: C.green, lineHeight: 1 }}>0</span>
        <span style={{ fontFamily: F.serif, fontSize: 54, color: '#fff', fontStyle: 'italic' }}>invented fields.</span>
      </div>
    </SceneFade>
  )
}

/* ================================================================== 8. remember */
const RECORD: [string, string][] = [
  ['layer', 'wMain · service connection'],
  ['status', 'verified · was unmapped'],
  ['diameter', '2 in · PE'],
  ['crs', 'EPSG:28191 · Palestine Grid'],
  ['evidence', 'crew report R-0147'],
  ['approved_by', 'NRW engineer'],
]
const AUDIT: [string, string][] = [
  ['05:45', 'Site QAT-01 ranked #1 · Sentinel-2'],
  ['11:20', 'Crew report received · voice + text'],
  ['11:24', 'Fields confirmed · each quotes the crew'],
  ['12:02', 'Edit approved · exported to GIS'],
]
export function Remember({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const panel = ease(f, 6, 30)
  const click = 82
  const approved = f >= click + 4
  const cursor = interpolate(f, [30, click - 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.6, 0, 0.2, 1) })
  const cx = lerp(900, 425, cursor), cy = lerp(990, 861, cursor)
  const press = f >= click - 2 && f < click + 6 ? 0.9 : 1
  const ripple = ease(f, click, 24)
  const solid = ease(f, click + 2, 18)
  const recIn = ease(f, 110, 20)
  return (
    <SceneFade>
      <Backdrop tint={0.4} />
      <StepHead n="03" word="REMEMBER" start={12} />
      {/* map */}
      <div style={{ position: 'absolute', left: 120, top: 250, width: 980, height: 760, borderRadius: 30, overflow: 'hidden', background: '#071433', boxShadow: '0 60px 120px -40px rgba(0,0,0,0.9), 0 0 0 1px rgba(143,211,255,0.2)', opacity: panel, transform: `translateY(${(1 - panel) * 60}px)` }}>
        <Img src={staticFile('imagery/qatrana-2025.webp')} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transform: `scale(${1.25 - f * 0.0004})`, filter: 'saturate(0.85) brightness(0.8)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(160deg, rgba(4,16,42,0.45), rgba(4,16,42,0.78))' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, transparent 1px)', backgroundSize: '48px 48px' }} />
        <svg width={980} height={760} style={{ position: 'absolute', inset: 0 }}>
          <defs><filter id="rg"><feGaussianBlur stdDeviation="8" /></filter></defs>
          <path d="M-40 640 C 220 560, 380 470, 470 380 S 760 150, 1020 60" stroke={C.blue} strokeWidth={26} fill="none" opacity={0.35} filter="url(#rg)" />
          <path d="M-40 640 C 220 560, 380 470, 470 380 S 760 150, 1020 60" stroke={C.ice} strokeWidth={8} fill="none" />
          <rect x={690} y={360} width={210} height={150} rx={10} fill="rgba(245,165,36,0.16)" stroke={C.amber} strokeWidth={3} style={{ filter: 'drop-shadow(0 0 10px rgba(245,165,36,0.6))' }} />
          <text x={706} y={392} fill={C.amber} fontFamily={F.mono} fontSize={18}>NEW FARM</text>
          {/* the edit */}
          <path d="M470 382 L 590 470 L 690 470" stroke={approved ? '#fff' : C.violet} strokeWidth={approved ? 7 : 5} fill="none" strokeDasharray={approved ? `${1000 * solid} 1000` : '14 12'} strokeDashoffset={approved ? 0 : -f * 1.5} strokeLinejoin="round" />
          {approved && <path d="M470 382 L 590 470 L 690 470" stroke={C.blue} strokeWidth={22} fill="none" opacity={0.5 * solid} filter="url(#rg)" />}
          <circle cx={470} cy={382} r={10} fill="#fff" />
        </svg>
        {/* popover */}
        <div style={{ position: 'absolute', left: 140, top: 520, width: 330, ...glass, background: 'rgba(4,16,42,0.92)', borderRadius: 18, padding: '16px 18px' }}>
          <div style={{ fontFamily: F.mono, fontSize: 15, letterSpacing: '0.1em', color: approved ? C.green : C.violet }}>{approved ? '● APPROVED · ENGINEER' : '◌ DRAFT EDIT · UNCONFIRMED'}</div>
          <div style={{ fontFamily: F.sans, fontSize: 22, color: '#fff', marginTop: 6 }}>2-inch connection → new farm</div>
          <div style={{ marginTop: 14, height: 50, borderRadius: 12, display: 'grid', placeItems: 'center', fontFamily: F.sans, fontWeight: 600, fontSize: 22, color: '#fff', background: approved ? 'linear-gradient(180deg,#3ddc97,#1f9e68)' : 'linear-gradient(180deg,#5cbcff,#1a6ff0)', transform: `scale(${press})`, position: 'relative', overflow: 'hidden' }}>
            {approved ? '✓ Approved' : 'Approve edit'}
            <span style={{ position: 'absolute', left: '50%', top: '50%', width: 400 * ripple, height: 400 * ripple, marginLeft: -200 * ripple, marginTop: -200 * ripple, borderRadius: '50%', background: `rgba(255,255,255,${0.4 * (1 - ripple)})` }} />
          </div>
        </div>
        {/* cursor */}
        <svg width={40} height={46} viewBox="0 0 40 46" style={{ position: 'absolute', left: cx - 120, top: cy - 250, opacity: ease(f, 26, 10) * (1 - ease(f, click + 30, 14)), transform: `scale(${press})` }}>
          <path d="M3 2 L3 36 L12 28 L19 43 L26 40 L19 25 L31 25 Z" fill="#fff" stroke="#011c47" strokeWidth={2.5} strokeLinejoin="round" />
        </svg>
      </div>
      {/* record */}
      <div style={{ position: 'absolute', left: 1160, top: 250, width: 640, ...glass, padding: '26px 30px', opacity: recIn, transform: `translateX(${(1 - recIn) * 60}px)` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: F.sans, fontWeight: 600, fontSize: 26, color: '#fff' }}>Utility GIS record</span>
          <span style={{ fontFamily: F.mono, fontSize: 15, color: C.green, border: '1px solid rgba(61,220,151,0.4)', padding: '5px 10px', borderRadius: 99, opacity: ease(f, 170, 10) }}>EXPORTED ✓</span>
        </div>
        <div style={{ marginTop: 16, fontFamily: F.mono, fontSize: 21, lineHeight: 1.75 }}>
          {RECORD.map(([k, v], i) => {
            const start = 116 + i * 9
            const n = Math.floor(interpolate(f, [start, start + 14], [0, v.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
            return (
              <div key={k} style={{ opacity: ease(f, start - 3, 6) }}>
                <span style={{ color: C.ice }}>{k}</span>
                <span style={{ color: C.faint }}>: </span>
                <span style={{ color: '#fff' }}>{v.slice(0, n)}</span>
              </div>
            )
          })}
        </div>
      </div>
      {/* audit */}
      <div style={{ position: 'absolute', left: 1160, top: 690, width: 640, ...glass, padding: '22px 30px', opacity: ease(f, 186, 18) }}>
        <div style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: '0.16em', color: C.muted }}>AUDIT TRAIL</div>
        {AUDIT.map(([t, l], i) => {
          const a = ease(f, 192 + i * 8, 14)
          return (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 14, marginTop: 12, opacity: a, transform: `translateX(${(1 - a) * 30}px)` }}>
              <span style={{ width: 24, height: 24, borderRadius: 99, background: C.green, display: 'grid', placeItems: 'center', color: '#04102a', fontSize: 15, fontWeight: 700 }}>✓</span>
              <span style={{ fontFamily: F.mono, fontSize: 18, color: C.ice }}>{t}</span>
              <span style={{ fontFamily: F.sans, fontSize: 20, color: '#fff' }}>{l}</span>
            </div>
          )
        })}
      </div>
    </SceneFade>
  )
}

/* ================================================================== 9. proof */
function Ring({ value, t, color }: { value: number; t: number; color: string }) {
  const r = 96, c = 2 * Math.PI * r
  return (
    <svg width={230} height={230} viewBox="0 0 230 230" style={{ position: 'absolute', right: 34, top: 34, opacity: 0.9 }}>
      <circle cx={115} cy={115} r={r} stroke="rgba(255,255,255,0.08)" strokeWidth={14} fill="none" />
      <circle cx={115} cy={115} r={r} stroke={color} strokeWidth={14} fill="none" strokeDasharray={`${c * value * t} ${c}`} strokeLinecap="round" transform="rotate(-90 115 115)" style={{ filter: `drop-shadow(0 0 10px ${color})` }} />
    </svg>
  )
}
function Tile({ x, start, land, children, ring, color }: { x: number; start: number; land: number; children: React.ReactNode; ring: number; color: string }) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - start, fps, config: { damping: 15, stiffness: 140 } })
  const t = ease(f, land, 40)
  return (
    <div style={{ position: 'absolute', left: x, top: 300, width: 540, height: 560, ...glass, padding: '40px 40px', overflow: 'hidden', transform: `translateY(${(1 - s) * 140}px) scale(${lerp(1.12, 1, s)})`, opacity: Math.min(1, s * 1.4), filter: `blur(${(1 - Math.min(1, s)) * 12}px)` }}>
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(400px 300px at 80% 0%, ${color}33, transparent 70%)` }} />
      <Ring value={ring} t={t} color={color} />
      <div style={{ position: 'relative', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>{children}</div>
    </div>
  )
}
export function Proof({ dur }: SceneProps) {
  const f = useCurrentFrame()
  return (
    <SceneFade>
      <Backdrop tint={0.55} />
      <Dust n={50} opacity={0.3} />
      <div style={{ position: 'absolute', left: 120, top: 120 }}>
        <Kicker start={6}>The proof</Kicker>
        <Words text="Cheap to run. Built on evidence." start={14} stagger={4} style={{ marginTop: 22, fontFamily: F.serif, fontSize: 72, color: '#fff' }} wordStyle={(i) => (i > 2 ? { fontStyle: 'italic', color: C.ice } : undefined)} />
      </div>
      <Tile x={120} start={10} land={50} ring={1} color={C.green}>
        <div style={{ fontFamily: F.serif, fontSize: 170, lineHeight: 0.9, color: '#fff', fontWeight: 500, letterSpacing: '-0.03em' }}>
          <span style={{ fontSize: 70, color: C.green, marginRight: 14 }}>JOD</span>
          <span style={{ display: 'inline-block', transform: `scale(${lerp(1.6, 1, ease(f, 50, 14))})`, opacity: ease(f, 48, 6) }}>0</span>
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 34, color: '#fff', marginTop: 18, fontWeight: 600 }}>satellite imagery</div>
        <div style={{ fontFamily: F.mono, fontSize: 18, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>SENTINEL-2 IS FREE AND OPEN · COPERNICUS</div>
      </Tile>
      <Tile x={690} start={84} land={88} ring={0.94} color={C.ice}>
        <div style={{ fontFamily: F.serif, fontSize: 170, lineHeight: 0.9, color: '#fff', fontWeight: 500, letterSpacing: '-0.03em' }}>
          <CountUp to={94} start={88} dur={50} />%
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 34, color: '#fff', marginTop: 18, fontWeight: 600 }}>of fields right · 0 invented</div>
        <div style={{ fontFamily: F.mono, fontSize: 18, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>235 OF 250 FIELDS · 25 HELD-OUT SYNTHETIC REPORTS</div>
      </Tile>
      <Tile x={1260} start={176} land={180} ring={0.22} color={C.amber}>
        <div style={{ fontFamily: F.serif, fontSize: 170, lineHeight: 0.9, color: '#fff', fontWeight: 500, letterSpacing: '-0.03em' }}>
          <CountUp to={2.2} start={180} dur={50} decimals={1} />
        </div>
        <div style={{ fontFamily: F.sans, fontSize: 34, color: '#fff', marginTop: 18, fontWeight: 600 }}>extra cases / 100 km / year</div>
        <div style={{ fontFamily: F.mono, fontSize: 18, color: C.muted, marginTop: 10, lineHeight: 1.5 }}>= BREAK-EVEN AT JOD 1.93 PER M³ (IGC) AND A MARKET PRICE PER KM</div>
      </Tile>
    </SceneFade>
  )
}

/* ================================================================== 10. close */
export function Close({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const { fps } = useVideoConfig()
  const s = spring({ frame: f - 4, fps, config: { damping: 18, stiffness: 70 } })
  const out = ease(f, dur - 40, 40, Easing.linear)
  return (
    <SceneFade>
      <AbsoluteFill style={{ background: '#01040d' }} />
      <AbsoluteFill style={{ background: 'radial-gradient(900px 600px at 50% 38%, rgba(42,139,255,0.30), transparent 65%)' }} />
      <Dust n={80} seed="cl" opacity={0.4} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: 120, display: 'flex', justifyContent: 'center', opacity: s, transform: `scale(${lerp(0.85, 1, s)})` }}>
        <LogoMark height={300} f={f} glowAmt={0.8} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 455, display: 'flex', justifyContent: 'center', alignItems: 'baseline', gap: 40, opacity: ease(f, 8, 26) }}>
        <span style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 104, color: '#fff', fontWeight: 500 }}>Missing Blue</span>
        <span dir="rtl" lang="ar" style={{ fontFamily: F.ar, fontSize: 84, color: C.ice, fontWeight: 600 }}>الأزرق المفقود</span>
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 640, display: 'flex', justifyContent: 'center' }}>
        <Words text="Where records end," start={58} stagger={5} style={{ fontFamily: F.serif, fontSize: 76, color: '#fff' }} />
        <span style={{ width: 22 }} />
        <Words text="evidence begins." start={112} stagger={5} style={{ fontFamily: F.serif, fontSize: 76, color: C.ice, fontStyle: 'italic' }} />
      </div>
      <div style={{ position: 'absolute', left: 960 - 470 * ease(f, 120, 40), top: 748, width: 940 * ease(f, 120, 40), height: 2, background: 'linear-gradient(90deg, transparent, #8fd3ff 20%, #ffffff 50%, #8fd3ff 80%, transparent)', boxShadow: '0 0 18px rgba(42,139,255,0.8)' }}>
        <div style={{ position: 'absolute', top: -3, width: 120, height: 8, left: `${((f * 6) % 1060) - 120}px`, background: 'radial-gradient(ellipse, rgba(255,255,255,0.95), transparent 70%)' }} />
      </div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 810, textAlign: 'center', fontFamily: F.mono, fontSize: 24, letterSpacing: '0.42em', color: '#fff', opacity: ease(f, 150, 24) }}>DETECT · VERIFY · REMEMBER</div>
      <div style={{ position: 'absolute', left: 0, right: 0, top: 892, display: 'flex', justifyContent: 'center', opacity: ease(f, 165, 24), transform: `translateY(${(1 - ease(f, 165, 30)) * 16}px)` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 22, padding: '14px 30px', borderRadius: 999, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(186,208,255,0.18)' }}>
          <span style={{ fontFamily: F.sans, fontWeight: 700, fontSize: 24, color: '#fff', letterSpacing: '0.04em' }}>AI QUEST 2026</span>
          <span style={{ width: 1, height: 26, background: 'rgba(186,208,255,0.3)' }} />
          <span style={{ fontFamily: F.sans, fontSize: 22, color: C.muted }}>Al Hussein Technical University · HTU</span>
          <span dir="rtl" lang="ar" style={{ fontFamily: F.sans, fontSize: 22, color: C.ice }}>جامعة الحسين التقنية</span>
          <span style={{ width: 1, height: 26, background: 'rgba(186,208,255,0.3)' }} />
          <span style={{ fontFamily: F.mono, fontSize: 18, color: C.faint, letterSpacing: '0.12em' }}>SECTOR 02 · next.society()</span>
        </div>
      </div>
      <AbsoluteFill style={{ background: '#000', opacity: out }} />
    </SceneFade>
  )
}


/* ================================================================== 0. competition ident */
export function Ident({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const out = ease(f, dur - 16, 16, Easing.bezier(0.5, 0, 0.75, 0))
  const title = ease(f, 10, 26)
  const scan = interpolate(f, [0, 40], [-0.1, 1.1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <SceneFade inF={8}>
      <Backdrop tint={0.5} />
      <Dust n={50} seed="id" opacity={0.35} />
      <div style={{ position: 'absolute', left: 0, right: 0, top: `${scan * 100}%`, height: 2, background: 'linear-gradient(90deg, transparent, rgba(143,211,255,0.9), transparent)', boxShadow: '0 0 30px 6px rgba(42,139,255,0.5)', opacity: 1 - ease(f, 36, 8) }} />
      <AbsoluteFill style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: 1 - out, transform: `scale(${1 + out * 0.06})`, filter: `blur(${out * 10}px)` }}>
        <Kicker start={4}>An entry to</Kicker>
        <div style={{ marginTop: 26, fontFamily: F.sans, fontWeight: 700, fontSize: 150, lineHeight: 1, color: '#fff', letterSpacing: `${lerp(0.4, 0.06, title)}em`, opacity: title, filter: `blur(${(1 - title) * 14}px)`, textShadow: '0 0 60px rgba(42,139,255,0.55)' }}>
          AI QUEST <span style={{ color: C.ice }}>2026</span>
        </div>
        <div style={{ marginTop: 34, display: 'flex', alignItems: 'center', gap: 24, opacity: ease(f, 26, 20), transform: `translateY(${(1 - ease(f, 26, 24)) * 20}px)` }}>
          <span style={{ fontFamily: F.sans, fontSize: 36, color: '#fff' }}>Al Hussein Technical University</span>
          <span style={{ fontFamily: F.mono, fontSize: 26, color: C.ice, padding: '4px 14px', border: '1px solid rgba(143,211,255,0.4)', borderRadius: 10 }}>HTU</span>
          <span dir="rtl" lang="ar" style={{ fontFamily: F.sans, fontSize: 36, color: C.muted }}>جامعة الحسين التقنية</span>
        </div>
        <div style={{ marginTop: 28, fontFamily: F.mono, fontSize: 24, letterSpacing: '0.3em', color: C.faint, opacity: ease(f, 40, 20) }}>SECTOR 02 · next.society()</div>
      </AbsoluteFill>
    </SceneFade>
  )
}

/** Small persistent tag so every frame says which competition this is for. */
export function Badge({ dur }: SceneProps) {
  const f = useCurrentFrame()
  const o = ease(f, 0, 20) * (1 - ease(f, dur - 14, 14))
  return (
    <div style={{ position: 'absolute', right: 56, bottom: 40, display: 'flex', alignItems: 'center', gap: 12, padding: '10px 18px', borderRadius: 999, background: 'rgba(4,16,42,0.55)', border: '1px solid rgba(186,208,255,0.18)', backdropFilter: 'blur(8px)', opacity: 0.85 * o }}>
      <span style={{ width: 8, height: 8, borderRadius: 99, background: C.ice, boxShadow: `0 0 10px ${C.ice}` }} />
      <span style={{ fontFamily: F.mono, fontSize: 17, letterSpacing: '0.16em', color: '#fff' }}>AI QUEST 2026</span>
      <span style={{ fontFamily: F.mono, fontSize: 17, letterSpacing: '0.16em', color: C.faint }}>· HTU</span>
    </div>
  )
}

/** A soft light leak that sweeps across at a cut. */
export function LightLeak({ warm = false }: { warm?: boolean }) {
  const f = useCurrentFrame()
  const t = ease(f, 0, 26, Easing.linear)
  const o = Math.sin(t * Math.PI) * 0.3
  const x = lerp(-30, 130, t)
  return <AbsoluteFill style={{ pointerEvents: 'none', mixBlendMode: 'screen', opacity: o, background: `radial-gradient(700px 520px at ${x}% 30%, ${warm ? 'rgba(255,170,90,0.9)' : 'rgba(92,188,255,0.9)'}, transparent 70%)` }} />
}
