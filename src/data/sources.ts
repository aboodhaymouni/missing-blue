/**
 * Footnote registry: every source cited on the landing page gets one number, in order of first
 * appearance, and the "Sources" list at the end of the page prints them all.
 */
import { FACTS, MARKET, type Source } from './facts'
import { BIZ_ORDER } from './business'

const EXTRA: Record<string, Source> = {
  disiMonthly: { publisher: 'JO24 — MWI figures on the Disi line, Jan–Jul 2026', date: '2026-08', url: 'https://jo24.net/article/575288' },
  disi2015: { publisher: 'JO24 — Disi attacks 2015 vs 2025', date: '2026-08', url: 'https://jo24.net/article/574777' },
  chirps: { publisher: 'CHIRPS v3 monthly rainfall (UCSB Climate Hazards Center)', date: '2015–2025', url: 'https://data.chc.ucsb.edu/products/CHIRPS/v3.0/' },
  sentinel: { publisher: 'Copernicus Sentinel-2 L2A via Earth Search (AWS)', date: '2017–2026', url: 'https://earth-search.aws.element84.com/v1/collections/sentinel-2-c1-l2a' },
  worldcover: { publisher: 'ESA WorldCover 10 m (CC BY 4.0)', date: '2021', url: 'https://esa-worldcover.org/' },
  ywcTender: { publisher: 'Yarmouk Water Co. — tender for repairing breaks on carrier lines', date: '—', url: 'https://www.yw.com.jo/ImageUpload/%D8%B9%D8%B7%D8%A7%D8%A1%20%D8%A7%D8%B5%D9%84%D8%A7%D8%AD%20%D8%A7%D9%84%D9%83%D8%B3%D9%88%D8%B1%20%D9%88%D9%85%D8%B9%D8%A7%D9%84%D8%AC%D8%A9%20%D8%A7%D9%84%D8%AA%D8%B3%D8%B1%D8%A8%20%D9%81%D9%8A%20%D8%AE%D8%B7%D9%88%D8%B7%20%D9%86%D8%A7%D9%82%D9%84%D9%87%20(1).pdf' },
  wmain: { publisher: 'GIZ National Water Master Plan ArcGIS service — Miyahuna wMain schema (fields and code lists only)', date: '2021', url: 'https://services8.arcgis.com/e2P0yl96f4HnYCDY/arcgis/rest/services' },
}

const ORDER: Source[] = [
  ...FACTS.nrw.sources,
  ...FACTS.attacks.sources,
  ...FACTS.disi.sources,
  ...FACTS.target.sources,
  ...FACTS.stress.sources,
  EXTRA.disiMonthly,
  EXTRA.disi2015,
  ...FACTS.theftShare.sources,
  ...FACTS.smallLeaks.sources,
  ...FACTS.aqaba.sources,
  ...FACTS.supplyHours.sources,
  ...FACTS.noWater.sources,
  ...FACTS.continuous.sources,
  ...FACTS.gisKm.sources,
  EXTRA.ywcTender,
  EXTRA.sentinel,
  EXTRA.chirps,
  EXTRA.worldcover,
  MARKET.pe63.source,
  EXTRA.wmain,
  MARKET.originThames.source,
  MARKET.asterra.source,
  MARKET.flowless.source,
  MARKET.nisar.source,
  MARKET.jica.source,
  MARKET.spain.source,
  ...FACTS.kac.sources,
  ...BIZ_ORDER,
]

export const SOURCE_LIST: Source[] = []
const index = new Map<string, number>()
for (const s of ORDER) {
  if (index.has(s.url)) continue
  SOURCE_LIST.push(s)
  index.set(s.url, SOURCE_LIST.length)
}

export const SRC = EXTRA

/** Footnote number for a source URL (1-based); 0 if the source is not in the registry. */
export function fnOf(url: string) {
  return index.get(url) ?? 0
}
