/**
 * Demo state for the console and the crew app: sites (real, from Sentinel-2), reports (synthetic),
 * map edits and an append-only audit log. Persisted in localStorage and synced live between tabs
 * (console ⇄ crew app) with BroadcastChannel, so a report sent from the "phone" appears on the desk.
 */
import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import sitesJson from '../data/generated/sites.json'
import { SAMPLE_REPORTS } from '../data/reports'
import { extractRules, OUTCOME_LABEL, type Extraction, type Outcome } from './extract/rules'

export type SiteStatus = 'new' | 'dispatched' | 'visited' | 'licensed' | 'dismissed'
export type RawSite = (typeof sitesJson)['aois'][number]['sites'][number]
export type Site = RawSite & { status: SiteStatus; crew?: string; outcome?: Outcome | null }

export type Report = {
  id: string
  siteId: string | null
  crew: string
  channel: 'voice' | 'text' | 'photo'
  text: string
  receivedAt: string
  synthetic: boolean
  extraction: Extraction
  engine: 'rules' | 'claude'
  status: 'unconfirmed' | 'confirmed'
  confirmedOutcome?: Outcome | null
  photo?: string | null
}

export type EditStatus = 'draft' | 'approved' | 'rejected' | 'exported'
export type MapEdit = {
  id: string
  siteId: string | null
  reportId: string
  status: EditStatus
  geometry: [number, number][]
  attrs: { MATERIAL: string | null; WP_MAT_TXT_S: string | null; DIAMETER: number | null; CIP_WP_TYPE: number; OWNEDBY: number; WP_COND: number; WP_STATUS: number | null; ORDER_ID: string; NOTES: string }
  candidates: string[]
  createdAt: string
  approvedAt?: string
  approvedBy?: string
}

export type AuditEvent = { id: string; at: string; actor: string; action: string; target: string; detail: string }

type State = { v: 1; sites: Site[]; reports: Report[]; edits: MapEdit[]; audit: AuditEvent[]; seq: number }

const KEY = 'mb.state.v1'
const CHANNEL = 'mb-sync'

const now = () => new Date().toISOString()
const hhmm = (iso: string) => iso.slice(11, 16)

export const AOIS = sitesJson.aois.map((a) => ({ key: a.key, label: a.label, dates: a.dates }))

function seed(): State {
  const sites: Site[] = sitesJson.aois.flatMap((a) => a.sites.map((s) => ({ ...s, status: 'new' as SiteStatus })))
  // A few sites already have history, so the desk is not empty when the demo starts.
  const q = sites.filter((s) => s.aoi === 'qatrana')
  if (q[3]) { q[3].status = 'licensed' }
  if (q[5]) { q[5].status = 'dismissed' }
  const t0 = new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString()
  const r9 = SAMPLE_REPORTS.find((r) => r.id === 'R-03')!
  const reports: Report[] = []
  if (q[3]) {
    reports.push({ id: 'B-0098', siteId: q[3].id, crew: 'C2', channel: r9.channel, text: r9.text, receivedAt: t0, synthetic: true, extraction: extractRules(r9.text), engine: 'rules', status: 'confirmed', confirmedOutcome: 'licensed_use' })
    q[3].outcome = 'licensed_use'
  }
  const audit: AuditEvent[] = [
    { id: 'A-1', at: t0, actor: 'C2', action: 'report', target: 'B-0098', detail: 'بلاغ نصي · استخدام مرخّص' },
    { id: 'A-2', at: t0, actor: 'GIS-1', action: 'confirm', target: 'B-0098', detail: 'تأكيد: استخدام مرخّص — يُضاف إلى قائمة الاستثناء' },
  ]
  return { v: 1, sites, reports, edits: [], audit, seq: 142 }
}

type Action =
  | { type: 'replace'; state: State }
  | { type: 'dispatch'; siteId: string; crew: string }
  | { type: 'licensed'; siteId: string }
  | { type: 'dismiss'; siteId: string }
  | { type: 'addReport'; report: Omit<Report, 'id' | 'receivedAt' | 'extraction' | 'engine' | 'status'> & { extraction?: Extraction; engine?: 'rules' | 'claude' } }
  | { type: 'setExtraction'; reportId: string; extraction: Extraction; engine: 'rules' | 'claude' }
  | { type: 'confirmReport'; reportId: string; outcome: Outcome | null }
  | { type: 'createEdit'; reportId: string }
  | { type: 'approveEdit'; editId: string; material: string | null }
  | { type: 'rejectEdit'; editId: string }
  | { type: 'exportEdit'; editId: string }
  | { type: 'reset' }

function log(s: State, actor: string, action: string, target: string, detail: string): AuditEvent[] {
  return [...s.audit, { id: `A-${s.audit.length + 1}`, at: now(), actor, action, target, detail }]
}

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'replace':
      return a.state
    case 'reset':
      return seed()
    case 'dispatch':
      return { ...s, sites: s.sites.map((x) => (x.id === a.siteId ? { ...x, status: 'dispatched', crew: a.crew } : x)), audit: log(s, 'WL-1', 'dispatch', a.siteId, `أُرسل الفريق ${a.crew}`) }
    case 'licensed':
      return { ...s, sites: s.sites.map((x) => (x.id === a.siteId ? { ...x, status: 'licensed' } : x)), audit: log(s, 'WL-1', 'licensed', a.siteId, 'وُسم استخدامًا مرخّصًا — لن يتكرّر الإنذار') }
    case 'dismiss':
      return { ...s, sites: s.sites.map((x) => (x.id === a.siteId ? { ...x, status: 'dismissed' } : x)), audit: log(s, 'WL-1', 'dismiss', a.siteId, 'تجاهل بعد المراجعة') }
    case 'addReport': {
      const seq = s.seq + 1
      const id = `B-${String(seq).padStart(4, '0')}`
      const r: Report = {
        id,
        siteId: a.report.siteId,
        crew: a.report.crew,
        channel: a.report.channel,
        text: a.report.text,
        synthetic: a.report.synthetic,
        photo: a.report.photo ?? null,
        receivedAt: now(),
        extraction: a.report.extraction ?? extractRules(a.report.text),
        engine: a.report.engine ?? 'rules',
        status: 'unconfirmed',
      }
      const sites = s.sites.map((x) => (x.id === a.report.siteId ? { ...x, status: 'visited' as SiteStatus } : x))
      return { ...s, seq, reports: [r, ...s.reports], sites, audit: log({ ...s }, a.report.crew, 'report', id, `بلاغ ${a.report.channel === 'voice' ? 'صوتي' : a.report.channel === 'photo' ? 'بصورة' : 'نصي'}${a.report.siteId ? ` عن ${a.report.siteId}` : ''}`) }
    }
    case 'setExtraction':
      // Fields are locked once an engineer has confirmed them.
      if (s.reports.find((r) => r.id === a.reportId)?.status === 'confirmed') return s
      return { ...s, reports: s.reports.map((r) => (r.id === a.reportId ? { ...r, extraction: a.extraction, engine: a.engine } : r)), audit: log(s, 'SYS', 'extract', a.reportId, a.engine === 'claude' ? 'استخراج بالذكاء الاصطناعي (Claude) مع الاستشهاد بالكلمات' : 'استخراج بالقواعد') }
    case 'confirmReport': {
      const rep = s.reports.find((r) => r.id === a.reportId)
      const sites = rep?.siteId ? s.sites.map((x) => (x.id === rep.siteId ? { ...x, outcome: a.outcome, status: a.outcome === 'licensed_use' ? ('licensed' as SiteStatus) : x.status } : x)) : s.sites
      return { ...s, sites, reports: s.reports.map((r) => (r.id === a.reportId ? { ...r, status: 'confirmed', confirmedOutcome: a.outcome } : r)), audit: log(s, 'GIS-1', 'confirm', a.reportId, `تأكيد الحقول${a.outcome ? ` · ${OUTCOME_LABEL[a.outcome].ar}` : ''}`) }
    }
    case 'createEdit': {
      const rep = s.reports.find((r) => r.id === a.reportId)
      if (!rep) return s
      const site = s.sites.find((x) => x.id === rep.siteId)
      const x = rep.extraction
      const seq = s.seq + 1
      const id = `MB-${String(seq).padStart(4, '0')}`
      const base: [number, number] = site ? [site.lon, site.lat] : [36.05, 31.37]
      // Illustrative geometry: a short service line from the site towards the route, ~60 m long.
      const geometry: [number, number][] = [base, [base[0] + 0.0005, base[1] - 0.0002], [base[0] + 0.0009, base[1] - 0.0002]]
      const edit: MapEdit = {
        id,
        siteId: rep.siteId,
        reportId: rep.id,
        status: 'draft',
        geometry,
        attrs: {
          MATERIAL: x.material?.value ?? null,
          WP_MAT_TXT_S: x.material?.evidence[0]?.text ?? null,
          DIAMETER: x.diameter?.value ?? null,
          CIP_WP_TYPE: 6,
          OWNEDBY: -1,
          WP_COND: 4,
          WP_STATUS: null,
          ORDER_ID: id,
          NOTES: `MB:${id} · ${rep.id} · «${x.outcome?.evidence[0]?.text ?? ''}»`.slice(0, 254),
        },
        candidates: x.material?.candidates ?? [],
        createdAt: now(),
      }
      return { ...s, seq, edits: [edit, ...s.edits], audit: log(s, 'SYS', 'draft', id, `مسودة wMain من ${rep.id} · WP_COND=4 قيد الفحص`) }
    }
    case 'approveEdit':
      return {
        ...s,
        edits: s.edits.map((e) => (e.id === a.editId ? { ...e, status: 'approved', approvedAt: now(), approvedBy: 'GIS-1', attrs: { ...e.attrs, MATERIAL: a.material ?? e.attrs.MATERIAL, WP_COND: 3, WP_STATUS: 1 } } : e)),
        audit: log(s, 'GIS-1', 'approve', a.editId, `اعتماد${a.material ? ` · MATERIAL=${a.material}` : ''} · WP_STATUS=1`),
      }
    case 'rejectEdit':
      return { ...s, edits: s.edits.map((e) => (e.id === a.editId ? { ...e, status: 'rejected' } : e)), audit: log(s, 'GIS-1', 'reject', a.editId, 'رُفضت المسودة') }
    case 'exportEdit':
      return { ...s, edits: s.edits.map((e) => (e.id === a.editId ? { ...e, status: 'exported' } : e)), audit: log(s, 'GIS-1', 'export', a.editId, 'تصدير wMain · EPSG:28191 (GeoJSON)') }
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) {
      const s = JSON.parse(raw) as State
      if (s && s.v === 1 && Array.isArray(s.sites) && s.sites.length) return s
    }
  } catch {
    /* fall through to seed */
  }
  return seed()
}

type Store = State & {
  dispatchCrew: (siteId: string, crew: string) => void
  markLicensed: (siteId: string) => void
  dismiss: (siteId: string) => void
  addReport: (r: Extract<Action, { type: 'addReport' }>['report']) => void
  setExtraction: (reportId: string, extraction: Extraction, engine: 'rules' | 'claude') => void
  confirmReport: (reportId: string, outcome: Outcome | null) => void
  createEdit: (reportId: string) => void
  approveEdit: (editId: string, material: string | null) => void
  rejectEdit: (editId: string) => void
  exportEdit: (editId: string) => void
  reset: () => void
}

const Ctx = createContext<Store | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const chan = useRef<BroadcastChannel | null>(null)
  const fromRemote = useRef(false)

  useEffect(() => {
    if (typeof BroadcastChannel === 'undefined') return
    const c = new BroadcastChannel(CHANNEL)
    chan.current = c
    c.onmessage = (ev) => {
      if (ev.data?.type === 'state') {
        fromRemote.current = true
        dispatch({ type: 'replace', state: ev.data.state })
      }
    }
    const onStorage = (e: StorageEvent) => {
      if (e.key === KEY && e.newValue) {
        try {
          fromRemote.current = true
          dispatch({ type: 'replace', state: JSON.parse(e.newValue) })
        } catch {
          /* ignore */
        }
      }
    }
    window.addEventListener('storage', onStorage)
    return () => {
      c.close()
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      /* storage full or blocked: keep in memory */
    }
    if (fromRemote.current) {
      fromRemote.current = false
      return
    }
    chan.current?.postMessage({ type: 'state', state })
  }, [state])

  const d = useCallback((a: Action) => dispatch(a), [])
  const value = useMemo<Store>(
    () => ({
      ...state,
      dispatchCrew: (siteId, crew) => d({ type: 'dispatch', siteId, crew }),
      markLicensed: (siteId) => d({ type: 'licensed', siteId }),
      dismiss: (siteId) => d({ type: 'dismiss', siteId }),
      addReport: (report) => d({ type: 'addReport', report }),
      setExtraction: (reportId, extraction, engine) => d({ type: 'setExtraction', reportId, extraction, engine }),
      confirmReport: (reportId, outcome) => d({ type: 'confirmReport', reportId, outcome }),
      createEdit: (reportId) => d({ type: 'createEdit', reportId }),
      approveEdit: (editId, material) => d({ type: 'approveEdit', editId, material }),
      rejectEdit: (editId) => d({ type: 'rejectEdit', editId }),
      exportEdit: (editId) => d({ type: 'exportEdit', editId }),
      reset: () => d({ type: 'reset' }),
    }),
    [state, d],
  )
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStore() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useStore must be used inside <StoreProvider>')
  return c
}

export { hhmm }
