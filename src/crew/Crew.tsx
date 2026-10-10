import clsx from 'clsx'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { Camera, Check, MapPin, Mic, MicOff, Send, WifiOff } from 'lucide-react'
import { LogoMark } from '../components/Logo'
import { useLang } from '../i18n/lang'
import { useStore } from '../lib/store'
import { extractRules, FIELD_ORDER } from '../lib/extract/rules'
import { SAMPLE_REPORTS } from '../data/reports'

type SpeechRec = { lang: string; interimResults: boolean; continuous: boolean; start: () => void; stop: () => void; onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> & { length: number } }) => void) | null; onend: (() => void) | null; onerror: (() => void) | null }

function getRecognizer(): SpeechRec | null {
  const W = window as unknown as { SpeechRecognition?: new () => SpeechRec; webkitSpeechRecognition?: new () => SpeechRec }
  const C = W.SpeechRecognition ?? W.webkitSpeechRecognition
  return C ? new C() : null
}

async function shrink(file: File): Promise<string> {
  const url = URL.createObjectURL(file)
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url })
    const k = Math.min(1, 640 / Math.max(img.width, img.height))
    const c = document.createElement('canvas')
    c.width = Math.round(img.width * k); c.height = Math.round(img.height * k)
    c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height)
    return c.toDataURL('image/jpeg', 0.7)
  } finally {
    URL.revokeObjectURL(url)
  }
}

function CrewScreen() {
  const { lang, t, toggle } = useLang()
  const ar = lang === 'ar'
  const { sites, addReport, reports } = useStore()
  const [crew, setCrew] = useState('C3')
  const assigned = sites.filter((s) => s.status === 'dispatched' && s.crew === crew)
  const [siteId, setSiteId] = useState<string>('')
  const [text, setText] = useState('')
  const [photo, setPhoto] = useState<string | null>(null)
  const [listening, setListening] = useState(false)
  const [sent, setSent] = useState<string | null>(null)
  const [online, setOnline] = useState(navigator.onLine)
  const rec = useRef<SpeechRec | null>(null)
  const voiceOk = useMemo(() => !!getRecognizer(), [])
  const x = useMemo(() => (text.trim() ? extractRules(text) : null), [text])

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false)
    window.addEventListener('online', on); window.addEventListener('offline', off)
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off) }
  }, [])
  useEffect(() => { if (!siteId && assigned[0]) setSiteId(assigned[0].id) }, [assigned, siteId])

  const startVoice = () => {
    const r = getRecognizer()
    if (!r) return
    r.lang = 'ar-JO'
    r.interimResults = true
    r.continuous = false
    const before = text
    r.onresult = (e) => {
      let s = ''
      for (let i = 0; i < e.results.length; i++) s += e.results[i][0].transcript
      setText((before ? before + ' ' : '') + s)
    }
    r.onend = () => setListening(false)
    r.onerror = () => setListening(false)
    rec.current = r
    setListening(true)
    r.start()
  }

  const submit = () => {
    if (!text.trim()) return
    addReport({ siteId: siteId || null, crew, channel: photo ? 'photo' : listening ? 'voice' : 'text', text: text.trim(), synthetic: false, photo })
    setSent(siteId || '—')
    setText(''); setPhoto(null)
  }
  const last = reports.find((r) => r.crew === crew)

  if (sent) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center px-6 text-center">
        <span className="grid size-16 place-items-center rounded-full bg-verified text-white"><Check className="size-8" /></span>
        <p className="mt-5 font-display text-[26px] text-navy-900">{ar ? 'وصل البلاغ' : 'Report received'}</p>
        <p className="mt-2 text-[15px] text-ink-2">{ar ? 'وصل إلى مكتب الفاقد ويظهر الآن «غير مؤكّد» حتى يراجعه المهندس.' : 'It reached the water-loss desk and shows as “unconfirmed” until the engineer reviews it.'}</p>
        {last && <p className="mt-3 font-mono text-[12px] text-muted">{last.id} · {sent}</p>}
        <button type="button" onClick={() => setSent(null)} className="mt-8 h-12 w-full rounded-[3px] bg-navy-900 text-[16px] font-semibold text-white">{ar ? 'بلاغ جديد' : 'New report'}</button>
      </div>
    )
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex items-center gap-3 border-b border-navy-900/20 bg-surface px-4 py-3">
        <LogoMark className="h-7 w-auto text-navy-900" />
        <div className="min-w-0">
          <p className="text-[15px] font-semibold leading-tight text-navy-900">{ar ? 'تطبيق الفريق الميداني' : 'Field crew app'}</p>
          <p className="font-mono text-[10.5px] text-muted">{ar ? 'الأزرق المفقود' : 'Missing Blue'}</p>
        </div>
        <select value={crew} onChange={(e) => { setCrew(e.target.value); setSiteId('') }} className="ms-auto h-9 border border-navy-900/40 bg-surface px-2 text-[13px]" aria-label={ar ? 'الفريق' : 'Crew'}>
          {['C1', 'C2', 'C3', 'C4'].map((c) => <option key={c} value={c}>{ar ? `الفريق ${c.slice(1)}` : `Crew ${c.slice(1)}`}</option>)}
        </select>
        <button type="button" onClick={toggle} className="text-[12px] font-semibold text-navy-900 underline underline-offset-4">{ar ? 'EN' : 'ع'}</button>
      </header>

      {!online && (
        <p className="flex items-center gap-2 bg-candidate/20 px-4 py-2 text-[13px] text-candidate-ink"><WifiOff className="size-4" />{ar ? 'لا اتصال — يُحفظ البلاغ ويُرسل لاحقًا' : 'Offline — the report is saved and sent later'}</p>
      )}

      <main className="flex-1 space-y-5 px-4 py-5">
        <section>
          <p className="font-mono text-[11px] text-muted">{ar ? 'مهماتي' : 'My assignments'}</p>
          {assigned.length ? (
            <div className="mt-2 grid gap-2">
              {assigned.map((s) => (
                <button key={s.id} type="button" onClick={() => setSiteId(s.id)} className={clsx('flex items-center gap-3 border p-3 text-start', siteId === s.id ? 'border-navy-900 bg-signal-50' : 'border-navy-900/25 bg-surface')}>
                  <img src={`./${s.crop.after}`} alt="" className="size-14 object-cover" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-mono text-[13px] font-semibold text-navy-900">{s.id}</span>
                    <span className="block text-[12.5px] text-ink-2">{ar ? 'رقعة جديدة · يستحق الفحص' : 'New patch · worth inspecting'}</span>
                    <span className="mt-0.5 flex items-center gap-1 font-mono text-[11px] text-muted" dir="ltr"><MapPin className="size-3" />{s.lat.toFixed(5)}, {s.lon.toFixed(5)}</span>
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <p className="mt-2 border border-dashed border-navy-900/30 p-3 text-[13.5px] text-ink-2">{ar ? 'لا مهمات مرسلة لهذا الفريق بعد. يمكنك الإبلاغ عن موقع جديد.' : 'No assignments for this crew yet. You can still report a new site.'}</p>
          )}
        </section>

        <section>
          <label className="font-mono text-[11px] text-muted" htmlFor="crew-text">{ar ? 'بلاغك بلهجتك' : 'Your report, in your own words'}</label>
          <textarea id="crew-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} dir="rtl" lang="ar" placeholder="لقينا وصلة غير مرخصة 2 إنش بلاستيك على الخط الرئيسي…" className="mt-2 w-full resize-none border border-navy-900/40 bg-surface p-3 text-[18px] leading-relaxed text-navy-900 outline-none focus:border-signal-600" />
          <div className="mt-2 grid grid-cols-3 gap-2">
            <button type="button" disabled={!voiceOk} onClick={() => (listening ? rec.current?.stop() : startVoice())} className={clsx('flex h-14 flex-col items-center justify-center gap-0.5 border text-[12px] font-semibold disabled:opacity-40', listening ? 'border-illegal bg-illegal text-white' : 'border-navy-900/40 bg-surface text-navy-900')}>
              {listening ? <MicOff className="size-5" /> : <Mic className="size-5" />}
              {listening ? (ar ? 'إيقاف' : 'Stop') : ar ? 'صوت' : 'Voice'}
            </button>
            <label className="flex h-14 cursor-pointer flex-col items-center justify-center gap-0.5 border border-navy-900/40 bg-surface text-[12px] font-semibold text-navy-900">
              <Camera className="size-5" />
              {ar ? 'صورة' : 'Photo'}
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={async (e) => { const f = e.target.files?.[0]; if (f) setPhoto(await shrink(f)) }} />
            </label>
            <button type="button" onClick={() => setText(SAMPLE_REPORTS[Math.floor(Math.random() * 6)].text)} className="flex h-14 flex-col items-center justify-center gap-0.5 border border-dashed border-navy-900/40 bg-surface text-[12px] font-semibold text-navy-900">
              <span className="font-mono text-[15px]">“…”</span>
              {ar ? 'مثال' : 'Example'}
            </button>
          </div>
          {!voiceOk && <p className="mt-1.5 text-[11.5px] text-muted">{ar ? 'الإملاء الصوتي غير متاح في هذا المتصفح؛ جرّب Chrome.' : 'Voice dictation is not available in this browser; try Chrome.'}</p>}
          {photo && <img src={photo} alt="" className="mt-2 max-h-40 border border-navy-900/20 object-cover" />}
        </section>

        {x && (
          <section className="border border-navy-900/20 bg-surface p-3">
            <p className="font-mono text-[11px] text-muted">{ar ? 'ما فهمه النظام (قبل الإرسال)' : 'What the system understood (before sending)'}</p>
            <ul className="mt-2 flex flex-wrap gap-1.5 text-[12.5px]">
              {FIELD_ORDER.map(({ key, label }) => {
                const f = x[key] as { label: { ar: string; en: string } } | null
                return f ? <li key={key} className="bg-signal-50 px-2 py-1 text-navy-900"><span className="text-muted">{t(label)}: </span>{t(f.label)}</li> : null
              })}
            </ul>
          </section>
        )}
      </main>

      <footer className="sticky bottom-0 border-t border-navy-900/20 bg-surface p-4">
        <button type="button" disabled={!text.trim()} onClick={submit} className="flex h-14 w-full items-center justify-center gap-2 rounded-[3px] bg-navy-900 text-[17px] font-semibold text-white disabled:opacity-40">
          <Send className="size-5" />
          {ar ? 'أرسل البلاغ' : 'Send report'}
        </button>
      </footer>
    </div>
  )
}

/** On a phone it fills the screen; on a laptop it sits in a device frame for the live demo. */
export default function Crew() {
  const { lang } = useLang()
  return (
    <div className="min-h-dvh bg-paper-2 md:grid md:place-items-center md:py-8">
      <div className="hidden w-[400px] text-center md:mb-4 md:block">
        <Link to="/app/map?tab=reports" className="font-mono text-[12px] text-navy-900 underline underline-offset-4">{lang === 'ar' ? '← لوحة العمليات' : '← Operations console'}</Link>
      </div>
      <div className="min-h-dvh bg-bg md:h-[780px] md:min-h-0 md:w-[390px] md:overflow-y-auto md:rounded-[36px] md:border-[10px] md:border-navy-900 md:shadow-[0_30px_80px_-30px_rgb(1_28_71/0.6)] scrollbar-thin">
        <CrewScreen />
      </div>
    </div>
  )
}
