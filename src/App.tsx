import { lazy, Suspense } from 'react'
import { HashRouter, Route, Routes } from 'react-router'
import { LangProvider } from './i18n/lang'
import { StoreProvider } from './lib/store'
import Landing from './landing/Landing'

const AppShell = lazy(() => import('./app/AppShell'))
const Overview = lazy(() => import('./app/Overview'))
const DataLibrary = lazy(() => import('./app/DataLibrary'))
const AuditPage = lazy(() => import('./app/AuditPage'))
const Console = lazy(() => import('./app/Console'))
const Crew = lazy(() => import('./crew/Crew'))
const Eval = lazy(() => import('./app/Eval'))
const Canvas = lazy(() => import('./bmc/Canvas'))
const Poster = lazy(() => import('./bmc/Poster'))

function Loading() {
  return <div className="grid min-h-dvh place-items-center font-mono text-[12px] text-muted">…</div>
}

export default function App() {
  return (
    <LangProvider>
      <StoreProvider>
        <HashRouter>
          <Suspense fallback={<Loading />}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/app" element={<AppShell />}>
                <Route index element={<Overview />} />
                <Route path="map" element={<Console />} />
                <Route path="data" element={<DataLibrary />} />
                <Route path="eval" element={<Eval embedded />} />
                <Route path="audit" element={<AuditPage />} />
              </Route>
              <Route path="/crew" element={<Crew />} />
              <Route path="/bmc" element={<Canvas />} />
              <Route path="/bmc/poster" element={<Poster />} />
              <Route path="*" element={<Landing />} />
            </Routes>
          </Suspense>
        </HashRouter>
      </StoreProvider>
    </LangProvider>
  )
}
