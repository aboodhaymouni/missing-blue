import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { Map as MLMap, StyleSpecification, GeoJSONSourceSpecification, MapMouseEvent, GeoJSONSource, Marker } from 'maplibre-gl'
// MapLibre 6 loads its worker as an ES module next to its own file; bundle it explicitly so it
// works both in the dev server (pre-bundled deps) and in the static build.
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url'

maplibregl.setWorkerUrl(workerUrl)
import { useLang } from '../i18n/lang'
import { useStore } from '../lib/store'
import routeJson from '../data/generated/demo_route.json'
import qatranaMeta from '../data/imagery/qatrana.json'
import mudMeta from '../data/imagery/mudawwara-wide.json'
import './map.css'

export type AoiKey = 'qatrana' | 'mudawwara'
export const AOI_IMAGES: Record<AoiKey, { before: string; after: string; beforeYear: string; afterYear: string; corners: number[][] }> = {
  qatrana: { before: './imagery/qatrana-2017.webp', after: './imagery/qatrana-2025.webp', beforeYear: '2017', afterYear: '2025', corners: qatranaMeta.corners_lonlat_tl_tr_br_bl },
  mudawwara: { before: './imagery/mudawwara-wide-2017.webp', after: './imagery/mudawwara-wide-2024.webp', beforeYear: '2017', afterYear: '2024', corners: mudMeta.corners_lonlat_tl_tr_br_bl },
}

/** Sentinel-2 cloudless 2021 mosaic by EOX (10 m data: native around z14 here; z15 tiles are served,
 *  beyond that MapLibre overzooms). */
const SAT_TILES = 'https://tiles.maps.eox.at/wmts/1.0.0/s2cloudless-2021_3857/default/g/{z}/{y}/{x}.jpg'
const SAT_ATTRIBUTION = 'Sentinel-2 cloudless – <a href="https://s2maps.eu" target="_blank" rel="noopener noreferrer">https://s2maps.eu</a> by EOX IT Services GmbH (contains modified Copernicus Sentinel data 2021)'
/** Night navy under the imagery: what shows while tiles load, or if the tile service is unreachable. */
const BASE_BG = '#04102a'

/** Satellite basemap, with place names and borders from OpenFreeMap on top when that loads (hybrid look). */
async function loadBaseStyle(): Promise<{ style: StyleSpecification; labels: boolean }> {
  const style: StyleSpecification = {
    version: 8,
    sources: { sat: { type: 'raster', tiles: [SAT_TILES], tileSize: 256, maxzoom: 15, attribution: SAT_ATTRIBUTION } },
    layers: [
      { id: 'bg', type: 'background', paint: { 'background-color': BASE_BG } },
      { id: 'sat', type: 'raster', source: 'sat' },
    ],
  }
  try {
    const ctl = new AbortController()
    const t = setTimeout(() => ctl.abort(), 3500)
    const r = await fetch('https://tiles.openfreemap.org/styles/positron', { signal: ctl.signal })
    clearTimeout(t)
    if (!r.ok) throw new Error(String(r.status))
    const s = (await r.json()) as StyleSpecification
    if (!s.sources.openmaptiles) return { style, labels: false }
    style.sources.openmaptiles = s.sources.openmaptiles
    if (s.glyphs) style.glyphs = s.glyphs
    if (s.sprite) style.sprite = s.sprite
    // Only borders and place names; every fill, road and water layer stays off the imagery.
    for (const l of s.layers) {
      if (l.type === 'line' && /^boundary/.test(l.id)) {
        style.layers.push({ ...l, paint: { ...l.paint, 'line-color': l.id === 'boundary_3' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.6)' } })
      } else if (l.type === 'symbol' && /^label_/.test(l.id)) {
        style.layers.push({ ...l, paint: { ...l.paint, 'text-color': '#f4f7fb', 'text-halo-color': 'rgba(2,8,23,0.85)', 'text-halo-width': 1.4, 'text-halo-blur': 0.4 } })
      }
    }
    return { style, labels: true }
  } catch {
    return { style, labels: false }
  }
}

function bounds(c: number[][]): [[number, number], [number, number]] {
  const xs = c.map((p) => p[0])
  const ys = c.map((p) => p[1])
  return [[Math.min(...xs), Math.min(...ys)], [Math.max(...xs), Math.max(...ys)]]
}

/** The AOI framing: fit, then push in past the fit and tilt, so the study area fills the screen. */
const AOI_ZOOM_BOOST = 0.65
const AOI_PITCH = 40
const AOI_BEARING = -10

const WORLD: number[][] = [[-180, -85], [180, -85], [180, 85], [-180, 85], [-180, -85]]
/** Everything outside the AOI image quad (the quad is wound opposite to the world ring, so it is a hole). */
function aoiMask(c: number[][]) {
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'Polygon' as const, coordinates: [WORLD, [...c, c[0]]] } }
}
function aoiRing(c: number[][]) {
  return { type: 'Feature' as const, properties: {}, geometry: { type: 'LineString' as const, coordinates: [...c, c[0]] } }
}

export type MapEvent = { id: string; register: 'theft' | 'supply'; lat: number; lon: number; label: string; date: string }

/** Jordan's extent, for the national view of the news-event layers. */
export const JORDAN_BOUNDS: [[number, number], [number, number]] = [[34.9, 29.15], [39.35, 33.4]]

export default function MapView({ aoi, year, selected, onSelect, onCursor, focus, events = [], showEvents = { theft: false, supply: false }, national = 0, reframe = 0 }: { aoi: AoiKey; year: 'before' | 'after'; selected: string | null; onSelect: (id: string) => void; onCursor?: (ll: [number, number] | null) => void; focus?: { lon: number; lat: number; zoom?: number; key: number } | null; events?: MapEvent[]; showEvents?: { theft: boolean; supply: boolean }; national?: number; /** Bump to fly back to the AOI framing. */ reframe?: number }) {
  const { lang } = useLang()
  const { sites, edits } = useStore()
  const el = useRef<HTMLDivElement>(null)
  const map = useRef<MLMap | null>(null)
  const markers = useRef<Map<string, Marker>>(new Map())
  const [ready, setReady] = useState(false)

  // Create the map once.
  useEffect(() => {
    let cancelled = false
    loadBaseStyle().then(({ style, labels }) => {
      if (cancelled || !el.current) return
      const img = AOI_IMAGES[aoi]
      const m = new maplibregl.Map({
        container: el.current,
        style,
        bounds: bounds(img.corners),
        fitBoundsOptions: { padding: 24 },
        attributionControl: { compact: true, customAttribution: labels ? 'Contains modified Copernicus Sentinel data · © OpenStreetMap contributors · OpenFreeMap' : 'Contains modified Copernicus Sentinel data' },
        maxZoom: 17,
      })
      // Zoom + compass; the compass also shows the tilt and, clicked, resets to north-up and flat.
      // Scale under it (the bottom edge belongs to the attribution, which must stay readable).
      m.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), lang === 'ar' ? 'top-right' : 'top-left')
      m.addControl(new maplibregl.ScaleControl({ unit: 'metric', maxWidth: 120 }), lang === 'ar' ? 'top-right' : 'top-left')
      m.on('load', () => {
        // AOI imagery, focus mask and outline sit under the place names; route, edits and events go on top.
        const under = m.getStyle().layers.find((l) => l.type === 'symbol')?.id
        for (const k of Object.keys(AOI_IMAGES) as AoiKey[]) {
          const a = AOI_IMAGES[k]
          m.addSource(`img-${k}-before`, { type: 'image', url: a.before, coordinates: a.corners as [[number, number], [number, number], [number, number], [number, number]] })
          m.addSource(`img-${k}-after`, { type: 'image', url: a.after, coordinates: a.corners as [[number, number], [number, number], [number, number], [number, number]] })
          m.addLayer({ id: `img-${k}-before`, type: 'raster', source: `img-${k}-before`, paint: { 'raster-opacity': 0, 'raster-fade-duration': 0 } }, under)
          m.addLayer({ id: `img-${k}-after`, type: 'raster', source: `img-${k}-after`, paint: { 'raster-opacity': 0, 'raster-fade-duration': 0 } }, under)
        }
        m.addSource('aoi-mask', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        m.addLayer({ id: 'aoi-mask', type: 'fill', source: 'aoi-mask', paint: { 'fill-color': 'rgba(2,8,23,0.45)', 'fill-opacity': 1, 'fill-opacity-transition': { duration: 700, delay: 0 } } }, under)
        m.addSource('aoi-outline', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        m.addLayer({ id: 'aoi-glow', type: 'line', source: 'aoi-outline', layout: { 'line-join': 'round' }, paint: { 'line-color': '#2a8bff', 'line-width': 12, 'line-blur': 8, 'line-opacity': 0.9 } }, under)
        m.addLayer({ id: 'aoi-line', type: 'line', source: 'aoi-outline', layout: { 'line-join': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 1.5, 'line-opacity': 0.95 } }, under)
        // The route is illustrative; dashed blue on a white halo so it reads on any imagery.
        m.addSource('route', { type: 'geojson', data: routeJson as unknown as GeoJSONSourceSpecification['data'] })
        m.addLayer({ id: 'route-glow', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#8fd3ff', 'line-width': 16, 'line-blur': 10, 'line-opacity': 0.45 } })
        m.addLayer({ id: 'route-halo', type: 'line', source: 'route', layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 7, 'line-opacity': 0.95 } })
        m.addLayer({ id: 'route', type: 'line', source: 'route', layout: { 'line-join': 'round' }, paint: { 'line-color': '#2a8bff', 'line-width': 3.5, 'line-dasharray': [3, 2] } })
        // Drafts: violet dashes on a white halo. Approved/exported: solid white on a blue glow.
        m.addSource('edits', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        m.addLayer({
          id: 'edits-halo', type: 'line', source: 'edits', layout: { 'line-join': 'round', 'line-cap': 'round' },
          paint: {
            'line-color': ['match', ['get', 'status'], 'draft', '#ffffff', '#2a8bff'],
            'line-width': ['match', ['get', 'status'], 'draft', 8, 14],
            'line-blur': ['match', ['get', 'status'], 'draft', 0, 6],
            'line-opacity': ['match', ['get', 'status'], 'draft', 0.95, 0.9],
          },
        })
        m.addLayer({ id: 'edits-draft', type: 'line', source: 'edits', filter: ['==', ['get', 'status'], 'draft'], paint: { 'line-color': '#7c4dff', 'line-width': 4, 'line-dasharray': [1.6, 1.2] } })
        m.addLayer({ id: 'edits-approved', type: 'line', source: 'edits', filter: ['in', ['get', 'status'], ['literal', ['approved', 'exported']]], layout: { 'line-join': 'round', 'line-cap': 'round' }, paint: { 'line-color': '#ffffff', 'line-width': 4 } })
        // News events (town-level places from public reporting): thefts and supply breaks/outages.
        m.addSource('events', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } })
        for (const reg of ['supply', 'theft'] as const) {
          m.addLayer({
            id: `events-${reg}`, type: 'circle', source: 'events', filter: ['==', ['get', 'register'], reg],
            layout: { visibility: 'none' },
            paint: {
              'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 10, 7, 14, 10],
              'circle-color': reg === 'theft' ? '#e5484d' : '#1a6ff0',
              'circle-opacity': 0.78,
              'circle-stroke-color': '#ffffff',
              'circle-stroke-width': 1.5,
            },
          })
          m.on('click', `events-${reg}`, (e) => {
            const f = e.features?.[0]
            if (!f) return
            const p = f.properties as { label: string; date: string }
            new maplibregl.Popup({ closeButton: false, offset: 10 }).setLngLat(e.lngLat).setText(`${p.date} · ${p.label}`).addTo(m)
          })
          m.on('mouseenter', `events-${reg}`, () => { m.getCanvas().style.cursor = 'pointer' })
          m.on('mouseleave', `events-${reg}`, () => { m.getCanvas().style.cursor = '' })
        }
        setReady(true)
      })
      m.on('mousemove', (e: MapMouseEvent) => onCursor?.([e.lngLat.lng, e.lngLat.lat]))
      m.on('mouseout', () => onCursor?.(null))
      map.current = m
      if (import.meta.env.DEV) (window as unknown as { __mbmap?: MLMap }).__mbmap = m
      m.on('error', (e) => console.warn('[map]', e.error?.message ?? e))
    })
    return () => {
      cancelled = true
      map.current?.remove()
      map.current = null
      markers.current.clear()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Image visibility follows AOI + year.
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return
    for (const k of Object.keys(AOI_IMAGES) as AoiKey[]) {
      m.setPaintProperty(`img-${k}-before`, 'raster-opacity', k === aoi && year === 'before' ? 1 : 0)
      m.setPaintProperty(`img-${k}-after`, 'raster-opacity', k === aoi && year === 'after' ? 1 : 0)
    }
  }, [aoi, year, ready])

  // Frame the AOI when it changes (or on request): mask + glowing outline, then a tight, tilted view.
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return
    const c = AOI_IMAGES[aoi].corners
    ;(m.getSource('aoi-mask') as GeoJSONSource | undefined)?.setData(aoiMask(c))
    ;(m.getSource('aoi-outline') as GeoJSONSource | undefined)?.setData(aoiRing(c))
    m.setPaintProperty('aoi-mask', 'fill-opacity', 1)
    // cameraForBounds ignores pitch, so this is the flat fit; the boost, tilt and bearing go on top.
    const cam = m.cameraForBounds(bounds(c), { padding: 24 })
    if (cam) m.flyTo({ ...cam, zoom: (cam.zoom ?? m.getZoom()) + AOI_ZOOM_BOOST, pitch: AOI_PITCH, bearing: AOI_BEARING, duration: 1600, essential: true })
  }, [aoi, ready, reframe])

  // Explicit focus requests (selecting a site, demo steps).
  useEffect(() => {
    const m = map.current
    if (!m || !ready || !focus) return
    m.setPaintProperty('aoi-mask', 'fill-opacity', 1)
    m.flyTo({ center: [focus.lon, focus.lat], zoom: focus.zoom ?? 15, speed: 1.4, curve: 1.3, essential: true })
  }, [focus, ready])

  // Site markers (HTML, so they need no glyph server and work offline).
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return
    const seen = new Set<string>()
    for (const s of sites) {
      seen.add(s.id)
      let mk = markers.current.get(s.id)
      if (!mk) {
        const node = document.createElement('button')
        node.type = 'button'
        node.addEventListener('click', (ev) => {
          ev.stopPropagation()
          onSelect(s.id)
        })
        mk = new maplibregl.Marker({ element: node, anchor: 'center' }).setLngLat([s.lon, s.lat]).addTo(m)
        markers.current.set(s.id, mk)
      }
      const node = mk.getElement() as HTMLButtonElement
      const isSel = selected === s.id
      // Look lives in map.css (.mb-site, per data-status). Toggle classes rather than rewriting
      // style/className: MapLibre owns this element's transform and its maplibregl-marker classes.
      node.classList.add('mb-site')
      node.classList.toggle('is-sel', isSel)
      node.dataset.status = s.status
      node.setAttribute('aria-label', `${s.id}`)
      node.title = `${s.id} · ${s.area_ha} ha`
      node.textContent = String(s.rank)
    }
    for (const [id, mk] of markers.current) {
      if (!seen.has(id)) {
        mk.remove()
        markers.current.delete(id)
      }
    }
  }, [sites, selected, ready, onSelect])

  // News-event layers.
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return
    const src = m.getSource('events') as GeoJSONSource | undefined
    src?.setData({
      type: 'FeatureCollection' as const,
      features: events.map((e) => ({ type: 'Feature' as const, properties: { register: e.register, label: e.label, date: e.date }, geometry: { type: 'Point' as const, coordinates: [e.lon, e.lat] } })),
    })
  }, [events, ready])
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return
    m.setLayoutProperty('events-theft', 'visibility', showEvents.theft ? 'visible' : 'none')
    m.setLayoutProperty('events-supply', 'visibility', showEvents.supply ? 'visible' : 'none')
  }, [showEvents.theft, showEvents.supply, ready])
  useEffect(() => {
    const m = map.current
    if (!m || !ready || !national) return
    // National view: flat, north-up, mask lifted so the whole country reads.
    m.setPaintProperty('aoi-mask', 'fill-opacity', 0)
    const cam = m.cameraForBounds(JORDAN_BOUNDS, { padding: 30 })
    if (cam) m.flyTo({ ...cam, pitch: 0, bearing: 0, duration: 1000, essential: true })
  }, [national, ready])

  // Map edits.
  useEffect(() => {
    const m = map.current
    if (!m || !ready) return
    const src = m.getSource('edits') as GeoJSONSource | undefined
    src?.setData({
      type: 'FeatureCollection' as const,
      features: edits.filter((e) => e.status !== 'rejected').map((e) => ({ type: 'Feature', properties: { id: e.id, status: e.status }, geometry: { type: 'LineString', coordinates: e.geometry } })),
    })
  }, [edits, ready])

  return (
    <div className="mb-map absolute inset-0 bg-[#04102a]">
      <div ref={el} className="h-full w-full" aria-label={lang === 'ar' ? 'الخريطة' : 'Map'} />
    </div>
  )
}
