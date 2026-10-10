/**
 * Export approved map edits in Miyahuna's format: wMain attribute names, EPSG:28191 (Palestine Grid,
 * the CRS of Miyahuna's ArcGIS server). The datum shift is the explicit 7-parameter transformation
 * "Palestine 1923 to WGS 84 (1)" — the default "ballpark" path in PROJ is ~80 m off in Jordan.
 */
import proj4 from 'proj4'
import type { MapEdit } from './store'

proj4.defs(
  'EPSG:28191',
  '+proj=cass +lat_0=31.7340969444444 +lon_0=35.2120805555556 +x_0=170251.555 +y_0=126867.909 +a=6378300.789 +b=6356566.435 +towgs84=-275.7224,94.7824,340.8944,-8.001,-4.42,-11.821,1 +units=m +no_defs',
)

export function toPalestineGrid([lon, lat]: [number, number]): [number, number] {
  const [x, y] = proj4('EPSG:4326', 'EPSG:28191', [lon, lat]) as [number, number]
  return [Math.round(x * 1000) / 1000, Math.round(y * 1000) / 1000]
}

export function editsToGeoJSON(edits: MapEdit[]) {
  return {
    type: 'FeatureCollection',
    name: 'wMain_missing_blue_export',
    crs: { type: 'name', properties: { name: 'urn:ogc:def:crs:EPSG::28191' } },
    features: edits.map((e) => ({
      type: 'Feature',
      properties: {
        ...e.attrs,
        LASTEDITOR: 'MissingBlue',
        LASTUPDATE: e.approvedAt ?? e.createdAt,
        USER_UPDATE: e.approvedBy ?? null,
        GPS_SURVEY: 'No',
      },
      geometry: { type: 'LineString', coordinates: e.geometry.map(toPalestineGrid) },
    })),
  }
}

export function download(name: string, content: string, type = 'application/geo+json') {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
