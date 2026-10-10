import Header from './Header'
import Hero from './Hero'
import Problem from './Problem'
import Reach from './Reach'
import How from './How'
import { AIHonesty, Closing, DataStack, DemoBand, Different, Footer, Pilot, Sources } from './Sections'
import { HudProvider } from '../components/Hud'
import heroMeta from '../data/imagery/hero.json'

const c = heroMeta.corners_lonlat_tl_tr_br_bl
const centre = { lat: (c[0][1] + c[2][1]) / 2, lon: (c[0][0] + c[2][0]) / 2, label: 'Sentinel-2 L2A · Mudawwara, Ma’an' }

export default function Landing() {
  return (
    <HudProvider initial={centre}>
      <div className="min-h-dvh bg-canvas text-ink">
        <a href="#problem" className="sr-only focus:not-sr-only focus:fixed focus:start-4 focus:top-4 focus:z-[60] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-white">
          تخطَّ إلى المحتوى
        </a>
        <Header />
        <main>
          <Hero />
          <Problem />
          <Reach />
          <How />
          <AIHonesty />
          <DemoBand />
          <Different />
          <Pilot />
          <DataStack />
          <Closing />
          <Sources />
        </main>
        <Footer />
      </div>
    </HudProvider>
  )
}
