/**
 * The dashboard's data pack, built from the FORCAST water collection by scripts/build_dashboard_data.py.
 * dashboard.json (charts, registers, domains) is bundled with the dashboard; library.json (every
 * source and fact) is loaded on demand by the data library.
 */
import raw from '../data/generated/dashboard.json'
import type { Text } from '../i18n/lang'

export type Src = { publisher: string; date: string; url: string }
export type Finding = { en: string; ar: string }

export type Domain = {
  id: string
  name_en: string
  name_ar: string
  bytes_c: number
  bytes_d: number
  files: number
  sources: number
  downloaded: number
  facts: number
  confirmed: number
  partial: number
  corrected: number
  unverified: number
  verdict: string | null
  summary_en: string
  summary_ar: string
  findings: Finding[]
  blocked: Finding[]
}

export type EventRow = {
  id: string
  date: string
  type: string
  gov_en: string
  place_en: string
  place_ar: string
  lat: number | null
  lon: number | null
  quantity: string | null
  source_name: string
  source_url: string
  confidence: string
}

export type Register = {
  total: number
  by_type: { type: string; label_en: string; label_ar: string; count: number }[]
  by_governorate: { gov_en: string; gov_ar: string; count: number }[]
  by_year: { year: number; count: number }[]
  events: EventRow[]
  complaints?: { year: number; no_water: number | null; breaks: number | null }[]
}

export type Dashboard = {
  generated_at: string | null
  totals: {
    sources: number
    sources_downloaded: number
    facts: number
    facts_confirmed: number
    facts_partial_or_corrected: number
    facts_unverified: number
    domains: number
    files_c: number
    files_d: number
    bytes_c: number
    bytes_d: number
    theft_events: number
    supply_events: number
    opendata_datasets_scanned: number | null
    opendata_water_datasets: number | null
  }
  domains: Domain[]
  nrw_national: { period: string; value: number; label_en?: string; source?: Src }[]
  nrw_by_governorate: { gov_en: string; gov_ar: string; base: number | null; latest: number | null; base_period?: string; latest_period?: string }[]
  nrw_by_governorate_source: Src | null
  enforcement: {
    annual: { year: number; main_line_attacks: number | null; kac_attacks: number | null; wells_backfilled: number | null; mcm_saved: number | null; partial_year?: boolean; source?: Src }[]
    disi_by_year: { year: number; attacks: number; partial_year?: boolean; source?: Src }[]
    cumulative: { main_line_attacks: number; wells_backfilled: number; kac_attacks: number; period: string; source?: Src } | null
  }
  theft: Register
  supply: Register
  corridors: { id: string; name_en: string; name_ar: string; operator: string; length_km_reported: string; length_km_mapped: number | null; diameter: string; material: string; year: string; governorates: string; best_pos_error_m: number | null }[]
  feasibility: {
    aois: number
    scenes: number | null
    noise_ndvi: string
    noise_ndmi: string
    separation: string
    detect_green_m2: number
    detect_wet_m2: number
    candidates_default_2km: number
    sites_default_2km: number
    review_top40: { false_positive: number; new_farm: number; unexplained: number }
    review_all_estimate: { false_positive: number; new_farm: number; unexplained: number }
    rain_note_en: string
    rain_note_ar: string
  } | null
  landcover: { new_et_patches: number | null; new_et_hectares: number | null; summer_irrigated_km2: string; summer_use_mcm: string; largest_cluster_en: string; largest_cluster_ar: string } | null
  opendata: { datasets_scanned: number | null; water_selected: number | null; files_downloaded: number | null; megabytes: number | null; by_org: { org: string; count: number }[] } | null
  notes: string[]
}

export const DASH = raw as unknown as Dashboard

export type Library = {
  sources: { id: string; domain: string; title: string; publisher: string; url: string; type: string; licence: string; status: string; date: string }[]
  facts: { id: string; domain: string; claim_en: string; claim_ar: string; value: string; unit: string; period: string; status: string; safe_en: string; source_url: string; publisher: string; date: string }[]
}

let libraryPromise: Promise<Library> | null = null
export function loadLibrary(): Promise<Library> {
  if (!libraryPromise) libraryPromise = import('../data/generated/library.json').then((m) => (m.default ?? m) as unknown as Library)
  return libraryPromise
}

/** Human file size, in the units people read on a disk. */
export function bytes(n: number, lang: 'ar' | 'en') {
  if (!n) return lang === 'ar' ? '—' : '—'
  const gb = n / 1024 ** 3
  if (gb >= 1) return lang === 'ar' ? `${gb.toFixed(1)} جيجا` : `${gb.toFixed(1)} GB`
  const mb = n / 1024 ** 2
  return lang === 'ar' ? `${Math.max(1, Math.round(mb))} ميجا` : `${Math.max(1, Math.round(mb))} MB`
}

export const GOV_AR: Record<string, string> = {
  Amman: 'عمّان', Zarqa: 'الزرقاء', Irbid: 'إربد', Balqa: 'البلقاء', Mafraq: 'المفرق', Jerash: 'جرش', Ajloun: 'عجلون', Ajlun: 'عجلون',
  Madaba: 'مادبا', Karak: 'الكرك', Tafilah: 'الطفيلة', Tafiela: 'الطفيلة', Tafileh: 'الطفيلة', Maan: 'معان', "Ma'an": 'معان', Aqaba: 'العقبة',
}

export const STATUS_LABEL: Record<string, Text> = {
  confirmed: { ar: 'مؤكَّد', en: 'Confirmed' },
  partially: { ar: 'مؤكَّد جزئيًا', en: 'Partly confirmed' },
  partial: { ar: 'مؤكَّد جزئيًا', en: 'Partly confirmed' },
  corrected: { ar: 'مصحَّح', en: 'Corrected' },
  unverified: { ar: 'غير مؤكَّد', en: 'Unverified' },
  refuted: { ar: 'غير صحيح', en: 'Refuted' },
  downloaded: { ar: 'منزَّل', en: 'Downloaded' },
}
