import React from 'react'
import { AbsoluteFill, Audio, Sequence, interpolate, staticFile, useCurrentFrame } from 'remotion'
import { Grain } from './kit'
import { Attacks, Badge, Close, Desert, Detect, Ident, LightLeak, Loss, Records, Remember, Reveal, Verify, Proof, type SceneProps } from './scenes'
import T from './timeline.json'

const SCENES: Record<string, (p: SceneProps) => React.ReactElement> = {
  ident: Ident, desert: Desert, loss: Loss, attacks: Attacks, records: Records, reveal: Reveal, detect: Detect, verify: Verify, remember: Remember, proof: Proof, close: Close,
}
const OVERLAP = 12

/** A slow, steady push-in so no shot ever sits still. */
function Push({ dur, amt, children }: { dur: number; amt: number; children: React.ReactNode }) {
  const f = useCurrentFrame()
  const s = 1 + amt * Math.min(1, f / Math.max(1, dur + OVERLAP))
  return <AbsoluteFill style={{ transform: `scale(${s})` }}>{children}</AbsoluteFill>
}
const PUSH: Record<string, number> = { ident: 0.04, desert: 0.025, loss: 0.03, attacks: 0, records: 0.04, reveal: 0, detect: 0.035, verify: 0.035, remember: 0.035, proof: 0.04, close: 0.03 }
const S = Object.fromEntries(T.scenes.map((s) => [s.id, s.start])) as Record<string, number>
const END = Object.fromEntries(T.scenes.map((s) => [s.id, s.end])) as Record<string, number>

/** The score's silence-then-hit (32 s into the track) lands on the logo reveal. */
const MUSIC_AT = S.reveal + 27 - 32 * 30

/**
 * Narration windows for ducking. Lines closer than ~1.3 s are merged, so the music doesn't swell back
 * up in the short breaths between sentences (that pumping is what made it sound too loud).
 */
const DUCK: [number, number][] = (() => {
  const w: [number, number][] = []
  for (const v of T.vo) {
    if (v.id === '06') continue // the logo reveal: let the score's hit play at full strength
    const a = v.start - 10, b = v.start + v.dur + 6
    const last = w[w.length - 1]
    if (last && a - last[1] < 40) last[1] = b
    else w.push([a, b])
  }
  return w
})()

const BASE = 0.36 // music level with no voice
const UNDER = 0.13 // music level under the voice
/** The reveal: from the riser through "This is Missing Blue" the score comes up to full. */
const REVEAL = 0.62
function musicLevel(abs: number) {
  let duck = 0
  for (const [a, b] of DUCK) {
    duck = Math.max(duck, interpolate(abs, [a - 18, a, b, b + 24], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  }
  const fadeOut = interpolate(abs, [T.total - 75, T.total], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const reveal = interpolate(abs, [S.reveal - 20, S.reveal + 20, S.reveal + 140, S.reveal + 175], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const level = BASE - (BASE - UNDER) * duck
  return (level + (REVEAL - level) * reveal) * fadeOut
}

type Fx = { at: number; src: string; vol: number }
const FX: Fx[] = [
  ...['desert', 'loss', 'attacks', 'records', 'verify', 'remember', 'proof', 'close'].map((id) => ({ at: S[id] - 6, src: 'whoosh', vol: 0.16 })),
  { at: S.detect - 16, src: 'whoosh', vol: 0.3 },
  { at: S.reveal + 27 - 48, src: 'riser', vol: 0.3 },
  { at: S.reveal + 26, src: 'impact', vol: 0.6 },
  { at: S.attacks + 290, src: 'hit', vol: 0.26 },
  { at: S.records + 150, src: 'hit', vol: 0.22 },
  { at: S.proof + 48, src: 'hit', vol: 0.22 },
  { at: S.proof + 86, src: 'hit', vol: 0.2 },
  { at: S.proof + 178, src: 'hit', vol: 0.2 },
  { at: S.verify + 270, src: 'hit', vol: 0.2 },
  { at: S.remember + 82, src: 'blip', vol: 0.32 },
  ...[0, 1, 2].map((i) => ({ at: S.detect + 118 + i * 9, src: 'blip', vol: 0.14 })),
  ...[0, 1, 2, 3, 4].map((i) => ({ at: S.detect + 168 + i * 6, src: 'blip', vol: 0.09 })),
  ...[0, 1, 2, 3].map((i) => ({ at: S.verify + 156 + i * 12, src: 'blip', vol: 0.12 })),
  ...[0, 1, 2, 3].map((i) => ({ at: S.remember + 192 + i * 8, src: 'blip', vol: 0.11 })),
  ...[56, 82, 112].map((d) => ({ at: S.verify + d, src: 'blip', vol: 0.12 })),
]

const LEAKS: { at: number; warm: boolean }[] = [
  { at: S.desert, warm: false }, { at: S.loss, warm: true }, { at: S.records, warm: true }, { at: S.detect, warm: false },
  { at: S.verify, warm: false }, { at: S.remember, warm: false }, { at: S.proof, warm: true }, { at: S.close, warm: false },
]

export function Video() {
  return (
    <AbsoluteFill style={{ background: '#020817' }}>
      {T.scenes.map((s, i) => {
        const Comp = SCENES[s.id]
        const last = i === T.scenes.length - 1
        return (
          <Sequence key={s.id} from={s.start} durationInFrames={s.end - s.start + (last ? 0 : OVERLAP)} name={s.id}>
            <Push dur={s.end - s.start} amt={PUSH[s.id] ?? 0}>
              <Comp dur={s.end - s.start} />
            </Push>
          </Sequence>
        )
      })}
      {LEAKS.map((l) => (
        <Sequence key={l.at} from={l.at - 8} durationInFrames={30} name="leak">
          <LightLeak warm={l.warm} />
        </Sequence>
      ))}
      {/* competition tag on every story scene (not over the ident, the reveal or the close) */}
      <Sequence from={S.desert + 20} durationInFrames={S.reveal - S.desert - 20} name="badge 1"><Badge dur={S.reveal - S.desert - 20} /></Sequence>
      <Sequence from={S.detect + 10} durationInFrames={S.close - S.detect - 10} name="badge 2"><Badge dur={S.close - S.detect - 10} /></Sequence>
      <Grain />

      {/* narration */}
      {T.vo.map((v) => (
        <Sequence key={v.id} from={v.start} durationInFrames={v.dur + 4} name={`vo ${v.id}`}>
          <Audio src={staticFile(v.file)} volume={1} />
        </Sequence>
      ))}
      {/* music: a tense bed under the ident and opening, then the score */}
      <Sequence from={0} durationInFrames={MUSIC_AT + 90} name="tension bed">
        <Audio src={staticFile('audio/tension_clip.mp3')} volume={(f) => interpolate(f, [0, 20, MUSIC_AT, MUSIC_AT + 90], [0, 0.3, 0.2, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) * (1 - 0.55 * interpolate(f, [S.desert + 30, S.desert + 42], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))} />
      </Sequence>
      <Sequence from={MUSIC_AT} name="score">
        <Audio src={staticFile('audio/music_pro.mp3')} volume={(f) => musicLevel(f + MUSIC_AT) * interpolate(f, [0, 90], [0.3, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })} />
      </Sequence>
      {/* sound design */}
      {FX.map((x, i) => (
        <Sequence key={i} from={Math.max(0, x.at)} durationInFrames={110} name={x.src}>
          <Audio src={staticFile(`audio/${x.src}.wav`)} volume={x.vol} />
        </Sequence>
      ))}
    </AbsoluteFill>
  )
}
