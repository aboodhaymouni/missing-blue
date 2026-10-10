import { createContext, useContext, useMemo, useState, type ReactNode } from 'react'

/** Live map coordinates shared between the hero map and the HUD bar (Felt-style). */
type Hud = { lat: number; lon: number; label: string; set: (lat: number, lon: number, label?: string) => void }
const Ctx = createContext<Hud | null>(null)

export function HudProvider({ children, initial }: { children: ReactNode; initial: { lat: number; lon: number; label: string } }) {
  const [s, setS] = useState(initial)
  const value = useMemo<Hud>(() => ({ ...s, set: (lat, lon, label) => setS((p) => ({ lat, lon, label: label ?? p.label })) }), [s])
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useHud() {
  const c = useContext(Ctx)
  if (!c) throw new Error('useHud must be used inside <HudProvider>')
  return c
}

/** Bilinear interpolation inside an image whose four corners are known (TL, TR, BR, BL as [lon, lat]). */
export function lonLatAt(corners: number[][], fx: number, fy: number): [number, number] {
  const [tl, tr, br, bl] = corners
  const top = [tl[0] + (tr[0] - tl[0]) * fx, tl[1] + (tr[1] - tl[1]) * fx]
  const bot = [bl[0] + (br[0] - bl[0]) * fx, bl[1] + (br[1] - bl[1]) * fx]
  return [top[0] + (bot[0] - top[0]) * fy, top[1] + (bot[1] - top[1]) * fy]
}
