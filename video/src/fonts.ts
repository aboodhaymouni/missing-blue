import { continueRender, delayRender, staticFile } from 'remotion'

const LATIN = 'U+0000-00FF, U+0131, U+0152-0153, U+02BB-02BC, U+02C6, U+02DA, U+02DC, U+2000-206F, U+2074, U+20AC, U+2122, U+2190-2199, U+2212, U+2215, U+FEFF, U+FFFD'
const ARABIC = 'U+0600-06FF, U+0750-077F, U+0870-088E, U+0890-0891, U+0898-08E1, U+08E3-08FF, U+200C-200E, U+2010-2011, U+204F, U+2E41, U+FB50-FDFF, U+FE70-FE74, U+FE76-FEFC'

const FONTS: [string, string, FontFaceDescriptors][] = [
  ['Newsreader', 'fonts/newsreader-latin-wght-normal.woff2', { weight: '200 800' }],
  ['Newsreader', 'fonts/newsreader-latin-wght-italic.woff2', { weight: '200 800', style: 'italic' }],
  ['Plex', 'fonts/ibm-plex-sans-arabic-latin-400-normal.woff2', { weight: '400', unicodeRange: LATIN }],
  ['Plex', 'fonts/ibm-plex-sans-arabic-latin-600-normal.woff2', { weight: '600', unicodeRange: LATIN }],
  ['Plex', 'fonts/ibm-plex-sans-arabic-latin-700-normal.woff2', { weight: '700', unicodeRange: LATIN }],
  ['Plex', 'fonts/ibm-plex-sans-arabic-arabic-400-normal.woff2', { weight: '400', unicodeRange: ARABIC }],
  ['Plex', 'fonts/ibm-plex-sans-arabic-arabic-600-normal.woff2', { weight: '600', unicodeRange: ARABIC }],
  ['Plex', 'fonts/ibm-plex-sans-arabic-arabic-700-normal.woff2', { weight: '700', unicodeRange: ARABIC }],
  ['PlexMono', 'fonts/ibm-plex-mono-latin-400-normal.woff2', { weight: '400' }],
  ['PlexMono', 'fonts/ibm-plex-mono-latin-500-normal.woff2', { weight: '500' }],
  ['Markazi', 'fonts/markazi-text-arabic-wght-normal.woff2', { weight: '400 700', unicodeRange: ARABIC }],
  ['Markazi', 'fonts/markazi-text-latin-wght-normal.woff2', { weight: '400 700', unicodeRange: LATIN }],
]

const handle = delayRender('Loading fonts')
Promise.all(
  FONTS.map(([family, file, desc]) => new FontFace(family, `url(${staticFile(file)}) format('woff2')`, desc).load().then((f) => (document.fonts as any).add(f))),
)
  .then(() => continueRender(handle))
  .catch((e) => {
    console.error(e)
    continueRender(handle)
  })
