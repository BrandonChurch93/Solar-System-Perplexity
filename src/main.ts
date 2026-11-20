import { config } from './config'
import { Engine } from './core/engine'
import { installShowcase } from './capture/frame'
import { SpikeDirector } from './director/spike'
import { createSpikeSet } from './stops/spike/set'

const params = new URLSearchParams(location.search)
const mode = params.get('mode') ?? 'live'
const offline = mode === 'capture' || mode === 'export'
const formatId = params.get('format') ?? (offline ? config.formatKeys.master : config.formatKeys.master)
const assets = params.get('assets') ?? (offline ? 'full' : 'web')
const tier = params.get('tier') ?? 'draft'

document.body.classList.add(mode)
const engine = new Engine(formatId, assets)
engine.diag = params.get('diag') ?? 'beauty'
engine.director = new SpikeDirector()
for (const id of config.stopIds) engine.sets.register(id, createSpikeSet)
document.getElementById('stage')!.appendChild(engine.canvas)

const startFrame = Number(params.get('frame') ?? 0)
const ready = (async () => {
  if (mode === 'capture') return
  await engine.prepare(startFrame)
})()
installShowcase(engine, ready, tier)

if (mode === 'live' || mode === 'autopilot') {
  void ready.then(async () => {
    let frame = startFrame
    const loop = async (): Promise<void> => {
      await engine.renderFrame(frame, 'draft')
      frame = (frame + 1) % config.frameCount
      requestAnimationFrame(() => void loop())
    }
    await loop()
  })
}
