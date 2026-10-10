import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Lang = 'ar' | 'en'
export type Text = { ar: string; en: string }

type LangCtx = {
  lang: Lang
  dir: 'rtl' | 'ltr'
  setLang: (l: Lang) => void
  toggle: () => void
  /** Pick the string for the current language. */
  t: (x: Text) => string
  /** Format a number with Western digits (used across Jordanian government documents). */
  n: (v: number, opts?: Intl.NumberFormatOptions) => string
}

const Ctx = createContext<LangCtx | null>(null)
const KEY = 'mb.lang'

function readStored(): Lang {
  try {
    const v = localStorage.getItem(KEY)
    return v === 'en' ? 'en' : 'ar'
  } catch {
    return 'ar'
  }
}

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(KEY, l)
    } catch {
      /* private mode: keep it in memory only */
    }
  }, [])

  useEffect(() => {
    const el = document.documentElement
    el.lang = lang
    el.dir = lang === 'ar' ? 'rtl' : 'ltr'
  }, [lang])

  const value = useMemo<LangCtx>(() => {
    const fmt = new Intl.NumberFormat('en-US')
    return {
      lang,
      dir: lang === 'ar' ? 'rtl' : 'ltr',
      setLang,
      toggle: () => setLang(lang === 'ar' ? 'en' : 'ar'),
      t: (x) => x[lang],
      n: (v, opts) => (opts ? new Intl.NumberFormat('en-US', opts).format(v) : fmt.format(v)),
    }
  }, [lang, setLang])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useLang() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useLang must be used inside <LangProvider>')
  return c
}

/** Small helper for inline bilingual strings: tx('عربي', 'English'). */
export const tx = (ar: string, en: string): Text => ({ ar, en })
