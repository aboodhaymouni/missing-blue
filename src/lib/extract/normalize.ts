/**
 * Arabic normalisation that keeps a map back to the original text, so every extracted
 * field can point at the exact words the crew wrote (the brief's "show the exact words").
 */
export type Normalised = { norm: string; map: number[] }

const TASHKEEL = /[ؐ-ًؚ-ٰٟۖ-ۭ]/
const TATWEEL = 'ـ'
const ALEFS = 'أإآٱ'

export function normaliseAr(src: string): Normalised {
  let norm = ''
  const map: number[] = []
  for (let i = 0; i < src.length; i++) {
    let ch = src[i]
    if (ch === TATWEEL || TASHKEEL.test(ch)) continue
    const code = ch.charCodeAt(0)
    if (code >= 0x0660 && code <= 0x0669) ch = String.fromCharCode(code - 0x0660 + 48)
    else if (code >= 0x06f0 && code <= 0x06f9) ch = String.fromCharCode(code - 0x06f0 + 48)
    else if (ALEFS.includes(ch)) ch = 'ا'
    else if (ch === 'ى') ch = 'ي'
    else if (ch === 'ة') ch = 'ه'
    else if (ch === 'ؤ') ch = 'و'
    else if (ch === 'ئ') ch = 'ي'
    else if (ch === '٫') ch = '.'
    else if (ch === '،' || ch === '؛') ch = ','
    else if (ch === '”' || ch === '“' || ch === '″' || ch === '«' || ch === '»') ch = '"'
    else if (ch === '/' || ch === '⁄') ch = '/'
    norm += ch.toLowerCase()
    map.push(i)
  }
  return { norm, map }
}

/** Convert a [start, end) range in the normalised string back to the original string. */
export function toOriginal(n: Normalised, start: number, end: number): [number, number] {
  const s = n.map[start] ?? 0
  const e = (n.map[end - 1] ?? n.map[n.map.length - 1] ?? 0) + 1
  return [s, e]
}
