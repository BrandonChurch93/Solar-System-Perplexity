import { config } from './config'
import { Engine } from './core/engine'
import { installShowcase } from './capture/frame'
import { mountExport } from './capture/export'
import type { ViewKind } from './core/types'
import { FilmDirector } from './director/film'
import { mountLoading, mountMenu } from './director/menu'
import { rangeFrom, runAutopilot, runLive } from './director/modes'
import { factories, plans } from './director/plans'

const params = new URLSearchParams(location.search)
const asked = params.get('mode') ?? 'live'
const mode = ['live', 'autopilot', 'capture', 'export'].includes(asked) ? asked : 'live'
const offline = mode === 'capture' || mode === 'export'
const formatId = params.get('format') ?? config.formatKeys.master
const assets = params.get('assets') ?? (offline ? 'full' : 'web')
const tier = params.get('tier') ?? 'draft'

document.body.classList.add(mode)
const engine = new Engine(formatId, assets)
engine.diag = params.get('diag') ?? 'beauty'
const director = new FilmDirector(plans)
engine.director = director
for (const id of config.stopIds) engine.sets.register(id, factories[id]!)
document.getElementById('stage')!.appendChild(engine.canvas)
const ui = document.getElementById('ui')!

const frameParam = params.get('frame')
const startFrame = frameParam === null ? null : Number(frameParam)
const ready = mode === 'export' ? engine.prepare(startFrame ?? 0) : Promise.resolve()
installShowcase(engine, ready, tier)

if (mode === 'export') mountExport(engine, params)
else if (mode === 'autopilot') runAutopilot(engine, rangeFrom(params), mountLoading(ui))
else if (mode === 'live') {
  const stop = params.get('stop')
  const view: ViewKind = params.get('view') === 'terrain' ? 'terrain' : 'orbit'
  const live = runLive(engine, director, mountLoading(ui), { stop: stop && config.stopIds.includes(stop) ? stop : config.stopIds[0]!, view, frame: startFrame, tier })
  mountMenu(ui, engine, live)
}
