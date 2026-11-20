import { config } from '../config'
import type { Engine } from '../core/engine'
import type { ViewKind } from '../core/types'
import type { FilmDirector, LiveControl } from './film'
import { clipRange, segmentAtFrame, setsForFrame } from './timeline'

export interface Range { first: number; last: number }

export function rangeFrom(params: URLSearchParams): Range {
  const stop = params.get('stop')
  let first = 0
  let last = config.frameCount - 1
  if (stop && config.stopIds.includes(stop)) {
    const r = clipRange(stop)
    first = r.firstFrame
    last = r.endFrame - 1
  }
  const f = params.get('first')
  const l = params.get('last')
  if (f !== null && Number.isFinite(Number(f))) first = Math.min(Math.max(Math.floor(Number(f)), 0), config.frameCount - 1)
  if (l !== null && Number.isFinite(Number(l))) last = Math.min(Math.max(Math.floor(Number(l)), first), config.frameCount - 1)
  return { first, last }
}

export interface Loading { show(on: boolean): void }

export function runAutopilot(engine: Engine, range: Range, loading: Loading): void {
  let origin = -1
  let shown = -1
  let busy = false
  let asked = ''
  const next = (ts: number): void => {
    requestAnimationFrame(next)
    if (busy) return
    if (origin < 0) origin = ts
    let frame = range.first + Math.floor(((ts - origin) / 1000) * config.fps)
    if (frame > range.last) frame = range.last
    if (frame === shown) return
    if (!engine.ready(frame)) {
      busy = true
      loading.show(shown < 0)
      const began = ts
      void engine.prepare(frame).then(() => {
        requestAnimationFrame((now) => {
          origin += now - began
          loading.show(false)
          busy = false
        })
      })
      return
    }
    const segment = segmentAtFrame(frame)
    const at = config.stopIds.indexOf(segment.stop)
    if (segment.kind !== 'travel' && at >= 0 && at + 1 < config.stopIds.length && segment.endFrame <= range.last) {
      const want = [segment.stop, config.stopIds[at + 1]!]
      const key = want.join('|')
      if (asked !== key && setsForFrame(frame).length === 1) {
        asked = key
        void engine.prefetch(want)
      }
    }
    busy = true
    void engine.renderFrame(frame, 'draft').then(() => {
      shown = frame
      busy = false
    })
  }
  requestAnimationFrame(next)
  const restart = (): void => {
    if (shown >= range.last) {
      origin = -1
      shown = -1
    }
  }
  window.addEventListener('pointerdown', restart)
  window.addEventListener('keydown', restart)
}

export interface LiveState {
  kind: 'free' | 'frame'
  control: LiveControl
  frame: number
  tier: string
}

export interface LiveHandle {
  state: LiveState
  goStop(id: string, view: ViewKind): void
  goFrame(frame: number): void
  refresh(): void
  onChange: (() => void) | null
}

const TERRAIN_LOOK = 0.11
const ORBIT_PITCH = 1.35

export function runLive(engine: Engine, director: FilmDirector, loading: Loading, start: { stop: string; view: ViewKind; frame: number | null; tier: string }): LiveHandle {
  const control: LiveControl = { stop: start.stop, view: start.view, yaw: 0, pitch: 0, zoom: 1, time: 0 }
  const state: LiveState = { kind: start.frame === null ? 'free' : 'frame', control, frame: start.frame ?? 0, tier: start.tier }
  let ready = false
  let dirty = true
  let token = 0
  let counter = 0
  let clock = -1
  let elapsed = 0
  const handle: LiveHandle = { state, goStop, goFrame, refresh, onChange: null }

  function baseTime(): number {
    const plan = director.plans[Math.max(config.stopIds.indexOf(control.stop), 0)]!
    const seg = control.view === 'terrain' ? plan.seg.terrain : plan.seg.hold
    return (seg.start + seg.end) / 2
  }

  function load(): void {
    const mine = ++token
    ready = false
    loading.show(true)
    const job = state.kind === 'frame' ? engine.prepare(state.frame) : engine.prepare(0).then(() => engine.prefetch([control.stop]))
    void job.then(() => {
      if (mine !== token) return
      ready = true
      dirty = true
      loading.show(false)
    })
  }

  function goStop(id: string, view: ViewKind): void {
    control.stop = id
    control.view = view
    control.yaw = 0
    control.pitch = 0
    control.zoom = 1
    elapsed = 0
    state.kind = 'free'
    load()
    handle.onChange?.()
  }

  function goFrame(frame: number): void {
    state.kind = 'frame'
    state.frame = Math.min(Math.max(Math.floor(frame), 0), config.frameCount - 1)
    if (engine.ready(state.frame)) dirty = true
    else load()
    handle.onChange?.()
  }

  function refresh(): void {
    load()
  }

  const canvas = engine.canvas
  let dragging = false
  let px = 0
  let py = 0
  canvas.addEventListener('pointerdown', (e) => {
    dragging = true
    px = e.clientX
    py = e.clientY
    canvas.setPointerCapture(e.pointerId)
  })
  canvas.addEventListener('pointerup', () => {
    dragging = false
  })
  canvas.addEventListener('pointermove', (e) => {
    if (!dragging || state.kind !== 'free') return
    const k = (control.view === 'terrain' ? 0.0006 : 0.005) * (control.view === 'terrain' ? 1 : control.zoom)
    control.yaw -= (e.clientX - px) * k
    control.pitch -= (e.clientY - py) * k
    px = e.clientX
    py = e.clientY
    const lim = control.view === 'terrain' ? TERRAIN_LOOK : ORBIT_PITCH
    control.pitch = Math.min(Math.max(control.pitch, -lim), lim)
    if (control.view === 'terrain') control.yaw = Math.min(Math.max(control.yaw, -lim), lim)
  })
  canvas.addEventListener('wheel', (e) => {
    if (state.kind !== 'free' || control.view !== 'orbit') return
    e.preventDefault()
    const plan = director.plans[Math.max(config.stopIds.indexOf(control.stop), 0)]!
    const hold = plan.hold(0).position.length()
    control.zoom = Math.min(Math.max(control.zoom * Math.exp(e.deltaY * 0.0012), 1.35 / hold), 6)
  }, { passive: false })

  let busy = false
  const loop = (ts: number): void => {
    requestAnimationFrame(loop)
    if (!ready || busy) return
    if (state.kind === 'frame') {
      if (!dirty) return
      dirty = false
      busy = true
      void engine.renderFrame(state.frame, state.tier).then(() => {
        busy = false
      })
      return
    }
    if (clock >= 0) elapsed += (ts - clock) / 1000
    clock = ts
    control.time = baseTime() + elapsed
    if (!engine.sets.has(control.stop, engine.assets)) return
    engine.renderLive(director.liveShot(control, counter++ % config.frameCount))
  }
  load()
  requestAnimationFrame(loop)
  return handle
}
