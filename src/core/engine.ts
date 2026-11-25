import * as THREE from 'three'
import { config, type FormatDef } from '../config'
import { Accumulator } from './accumulator'
import { OPTIONAL_EXTENSIONS, REQUIRED_EXTENSIONS, missing, needs } from './caps'
import { Counter } from './counts'
import { Warm } from './warm'
import { floatTarget } from './pass'
import { TILE, openTiles, type Tiles } from './tiles'
import { midShutterCarry } from './held'
import { framePlan } from './motion'
import { captureFrames, captureRate, shutterSeconds, spanMid, wholeFrame } from './clock'
import { samplesFor } from './sampler'
import { SetLoader } from './sets'
import type { PlaceState, RenderView, Shot, SkyFloor, SkyPatch, ViewKind } from './types'
import { floorRing, sharedSkyWeight } from './skyfloor'
import { Place, placeCamera, placeLayout, type PlaceMode, type PlacePicture } from './place'
import { gradUniform, isRaw, setDiag, setFine, setSamples } from '../diagnostics/diag'
import { applyProbe, parseProbe, type Probe } from '../diagnostics/probe'
import { PostChain } from '../post/chain'
import { Belt } from '../space/belt/belt'
import { Dust } from '../space/dust'
import { Sky } from '../space/sky'
import { implicitUniform } from './texel'
import { setFrame, setPass } from './frame'
import type { SkyAims } from '../space/aim'
import { Cover, coverReaches } from '../terrain/cover'
import type { Relief } from '../terrain/relief'
import type { Trim } from '../bodies/trim'
import { marksIn } from '../terrain/shield'
import { setsForFrame } from '../director/timeline'

export interface Director {
  shotAt(frame: number, time: number, side?: ViewKind): Shot
  glareOf?(shot: Shot): THREE.Vector3 | null
  readonly sky?: SkyAims
}

export interface Sanity { invalid: number; coverage: number }

const STAR_COUNT = 900000
const DUST_COUNT = 12000
const GRAD_FLOOR = 0.5

export class Engine {
  readonly renderer: THREE.WebGLRenderer
  readonly canvas: HTMLCanvasElement
  readonly sets: SetLoader
  readonly counter: Counter
  readonly warm = new Warm()
  readonly sky: Sky
  format: FormatDef
  assets: string
  private asked_ = 'beauty'
  private probe: Probe = parseProbe('beauty')
  director: Director | null = null
  private readonly place = new Place()
  private readonly over = new THREE.Scene()
  private readonly camera = new THREE.PerspectiveCamera(30, 16 / 9, 0.01, 1000)
  private readonly world = new THREE.Scene()
  private readonly near = new THREE.Scene()
  private sampleTarget: THREE.WebGLRenderTarget
  private accumulator: Accumulator
  private readonly post = new PostChain()
  private readonly dust = new Dust(DUST_COUNT)
  private readonly cover = new Cover()
  readonly belt = new Belt()
  private skyAssets = ''
  private readonly skyPatches: { patch: SkyPatch; weight: number }[] = []
  private readonly floors = new WeakMap<SkyPatch, { floor: SkyFloor; patch: SkyPatch }>()
  private skyTexture: THREE.Texture | null = null
  private skyBand: THREE.Texture | null = null
  private skyStrip: THREE.Texture | null = null
  private attached: string[] = []
  private lastShot: Shot | null = null
  private readonly solid: THREE.Material[] = []
  private readonly veiled: THREE.Material[] = []
  private readonly trims: Trim[] = []
  private readonly held: THREE.Object3D[] = []
  private readonly carry = new THREE.Matrix4()
  private sampleCount = 1
  private soft = 0
  private shutter = 1
  private asked = 0
  private lastFrame: { frame: number; tier: string } | null = null
  private readonly marked = new WeakSet<THREE.Material>()
  private alpha = new Uint16Array(0)

  constructor(formatId: string, assets: string) {
    const format = config.formats[formatId]
    if (!format) throw new Error('unknown format ' + formatId)
    this.format = format
    this.assets = assets
    this.canvas = document.createElement('canvas')
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: false, alpha: false, depth: false, stencil: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' })
    this.renderer.setPixelRatio(1)
    this.renderer.outputColorSpace = THREE.LinearSRGBColorSpace
    this.renderer.toneMapping = THREE.NoToneMapping
    this.renderer.autoClear = false
    this.renderer.setClearColor(0x000000, 0)
    const gl = this.renderer.getContext() as WebGL2RenderingContext
    this.counter = new Counter(gl)
    const lacking = missing(gl, needs(assets, format.id))
    if (lacking.length > 0) throw new Error('this browser lacks: ' + lacking.join(', '))
    for (const e of OPTIONAL_EXTENSIONS) gl.getExtension(e)
    this.sets = new SetLoader(this.renderer, () => this.format, this.renderer.capabilities.getMaxAnisotropy())
    this.sky = new Sky(STAR_COUNT)
    this.sky.setFlightStars(config.raw.travel.sky.flightStars)
    this.sampleTarget = floatTarget(format.width, format.height, THREE.HalfFloatType, true, true)
    this.accumulator = new Accumulator(format.width, format.height)
    this.applySize()
    this.canvas.addEventListener('webglcontextlost', (e) => e.preventDefault())
    this.canvas.addEventListener('webglcontextrestored', () => void this.revive().catch((e: unknown) => console.error(e)))
  }

  get diag(): string {
    return this.asked_
  }

  set diag(value: string) {
    this.probe = parseProbe(value)
    this.asked_ = value
  }

  private async revive(): Promise<void> {
    const gl = this.renderer.getContext()
    for (const e of [...REQUIRED_EXTENSIONS, ...OPTIONAL_EXTENSIONS]) gl.getExtension(e)
    this.renderer.setClearColor(0x000000, 0)
    this.place.reset()
    const ids = this.sets.loadedIds()
    const last = this.lastFrame
    const shot = this.lastShot
    const mine = ++this.asked
    this.sets.reset()
    this.world.clear()
    this.near.clear()
    this.over.clear()
    this.attached = []
    this.skyAssets = ''
    await this.ensureSky()
    await this.sets.ensure(ids, this.assets)
    if (last) await this.prepare(last.frame)
    if (mine !== this.asked) return
    if (last) this.drawFrame(last.frame, last.tier)
    else if (shot && shot.sets.every((x) => this.sets.has(x.id, this.assets))) this.renderLive(shot)
  }

  private applySize(): void {
    const { width, height } = this.format
    this.renderer.setSize(width, height, false)
    setFrame(height, config.raw.formats.master.height)
    this.canvas.style.aspectRatio = width + ' / ' + height
    this.sampleTarget.dispose()
    this.accumulator.dispose()
    this.sampleTarget = floatTarget(width, height, THREE.HalfFloatType, true, true)
    this.accumulator = new Accumulator(width, height)
    this.post.resize(width, height)
    this.camera.aspect = width / height
    this.place.reset()
  }

  setFormat(id: string): void {
    const f = config.formats[id]
    if (!f) throw new Error('unknown format ' + id)
    if (f.id === this.format.id) return
    this.format = f
    this.applySize()
  }

  setAssets(id: string): void {
    if (!config.assetSets[id]) throw new Error('unknown asset set ' + id)
    if (id === this.assets) return
    this.assets = id
    this.sets.freeAll()
  }

  private async skyMap(name: string, smooth = false): Promise<{ tex: THREE.Texture; bytes: number }> {
    const res = await fetch(new URL('./assets/shared/' + this.assets + '/' + name, document.baseURI))
    if (!res.ok) throw new Error('sky map missing: ' + name)
    const bitmap = await createImageBitmap(await res.blob(), { imageOrientation: 'flipY', colorSpaceConversion: 'none' })
    const tex = new THREE.Texture(bitmap as unknown as HTMLImageElement)
    tex.flipY = false
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.minFilter = smooth ? THREE.LinearFilter : THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.generateMipmaps = !smooth
    tex.anisotropy = smooth ? 1 : Math.min(4, this.renderer.capabilities.getMaxAnisotropy())
    tex.needsUpdate = true
    this.renderer.initTexture(tex)
    const bytes = bitmap.width * bitmap.height * 4 * (smooth ? 1 : 4 / 3)
    bitmap.close()
    return { tex, bytes }
  }

  private async skyStars(name: string): Promise<ArrayBuffer> {
    const res = await fetch(new URL('./assets/shared/' + this.assets + '/' + name, document.baseURI))
    if (!res.ok) throw new Error('sky stars missing: ' + name)
    return res.arrayBuffer()
  }

  private async ensureSky(): Promise<void> {
    if (this.skyAssets === this.assets && this.skyTexture) return
    const epoch = this.sets.epoch
    const glow = await this.skyMap('sky.jpg')
    const band = await this.skyMap('skyband.jpg')
    const strip = await this.skyMap('skybandglow.png', true)
    const points = await this.skyStars('skybandstars.bin')
    if (epoch !== this.sets.epoch) {
      glow.tex.dispose()
      band.tex.dispose()
      strip.tex.dispose()
      return this.ensureSky()
    }
    this.skyBytes = glow.bytes + band.bytes + strip.bytes
    this.skyTexture?.dispose()
    this.skyBand?.dispose()
    this.skyStrip?.dispose()
    this.skyTexture = glow.tex
    this.skyBand = band.tex
    this.skyStrip = strip.tex
    this.skyAssets = this.assets
    this.sky.setTexture(glow.tex, band.tex)
    this.sky.setFlightBand(strip.tex, points, config.raw.travel.sky.flightStrip)
  }

  skyBytes = 0

  async prepare(at: number): Promise<void> {
    const frame = wholeFrame(at)
    await this.ensureSky()
    await this.sets.ensure(setsForFrame(frame), this.assets)
    await this.belt.prepare(frame, this.assets, this.renderer)
  }

  async renderFrame(frame: number, tier: string): Promise<void> {
    if (!this.director) throw new Error('no director')
    const f = Math.min(Math.max(frame, 0), (captureFrames() - 1) / captureRate())
    const epoch = this.sets.epoch
    this.asked++
    await this.prepare(f)
    if (epoch !== this.sets.epoch) return this.renderFrame(f, tier)
    this.drawFrame(f, tier)
  }

  private drawFrame(f: number, tier: string): void {
    if (!this.director) return
    this.lastFrame = { frame: f, tier }
    const probe = this.probe
    applyProbe(probe)
    const plan = framePlan(this.director, f, tier)
    const samples = samplesFor(plan.samples, plan.shutter)
    this.soft = plan.soft
    this.shutter = plan.shutter
    const still = probe.shut
    const middle = probe.time ?? (f + spanMid()) / config.fps
    const mid = this.director.shotAt(f, middle)
    let other: Shot | null = null
    const midOf = (shot: Shot): Shot => {
      const view = shot.sets[0]?.view
      if (!plan.split || !view || view === mid.sets[0]?.view) return mid
      other ??= this.director!.shotAt(f, middle, view)
      return other
    }
    this.accumulator.begin()
    samples.forEach((s, i) => {
      const shot = samples.length === 1 || still ? mid : this.director!.shotAt(f, (f + s.timeOffset) / config.fps)
      this.renderSample(shot, midOf(shot), s.jitterX, s.jitterY, i, samples.length)
      this.accumulator.add(this.renderer, this.sampleTarget.texture, s.weight)
    })
    applyProbe(null)
    this.post.render(this.renderer, this.accumulator.texture, mid.post, f, probe.view, samples.length > 1)
    this.lastShot = mid
    this.sampleCount = samples.length
    this.flush()
  }

  renderLive(shot: Shot): void {
    this.lastFrame = null
    this.soft = 0
    this.shutter = 1
    this.accumulator.begin()
    this.renderSample(shot, shot, 0, 0, 0, 1)
    this.accumulator.add(this.renderer, this.sampleTarget.texture, 1)
    this.post.render(this.renderer, this.accumulator.texture, shot.post, shot.frame, this.probe.view)
    this.lastShot = shot
    this.sampleCount = 1
  }

  private renderSample(shot: Shot, mid: Shot, jx: number, jy: number, index: number, count: number): void {
    const { width, height } = this.format
    const cam = this.camera
    cam.fov = shot.camera.vfov
    cam.near = shot.near
    cam.far = shot.far
    cam.setViewOffset(width, height, jx, jy, width, height)
    cam.position.set(0, 0, 0)
    cam.quaternion.copy(shot.camera.quaternion)
    cam.updateProjectionMatrix()
    cam.updateMatrixWorld(true)
    const r = this.renderer
    const diag = this.probe.view
    const raw = isRaw(diag)
    setDiag(diag)
    setSamples(count, GRAD_FLOOR, this.soft)
    implicitUniform.value = this.sky.cull ? 1 : 0
    const wanted = shot.sets.map((s) => s.id)
    if (wanted.join('|') !== this.attached.join('|')) {
      this.world.clear()
      this.near.clear()
      this.over.clear()
      for (const id of wanted) {
        const set = this.sets.get(id)
        if (!set) throw new Error('set not loaded: ' + id)
        this.world.add(set.world)
        if (set.near) this.near.add(set.near)
        if (set.over) this.over.add(set.over)
      }
      this.attached = wanted
    }
    const placed = this.probe.place && shot.place && (shot.place.weight > 0 || (shot.place.horizon ?? 0) > 0) && (!raw || diag === 'texels') ? shot.place : null
    const limbed = placed && this.probe.limb !== undefined ? { ...placed, limbReachDeg: this.probe.limb } : placed
    const lapped = limbed && this.probe.lap !== undefined ? { ...limbed, limbLap: this.probe.lap } : limbed
    const edged = lapped && this.probe.edgeIn !== undefined ? { ...lapped, edgeIn: this.probe.edgeIn } : lapped
    const place = edged && this.probe.toneIn !== undefined ? { ...edged, toneIn: this.probe.toneIn } : edged
    const picture = place ? this.picture(place, shot) : null
    r.setRenderTarget(this.sampleTarget)
    r.clear(true, true, true)
    if (!raw) {
      this.skyPatches.length = 0
      const aims = this.director!.sky
      const share = shot.skyShare ?? 0
      const high = shot.skyShareHigh
      const shared = share > 0 || high !== undefined
      for (const state of shot.sets) {
        for (const patch of this.sets.get(state.id)?.sky ?? []) {
          const kind = shot.segment.kind
          let weight: number
          if (shared) {
            const w = sharedSkyWeight(patch.view, state.view, kind, share, high)
            weight = w > 0 ? w * (patch.weight ? patch.weight(shot.time, patch.view === 'terrain' ? 'terrain' : state.view) : 1) : 0
          } else {
            if (patch.view !== state.view) continue
            const arriving = kind === 'travel' && state.id !== shot.segment.stop
            const base = shot.segment.stop === config.endingId ? 0 : kind === 'travel' ? (arriving ? shot.skyPatch ?? THREE.MathUtils.smoothstep(shot.u, 0.2, 0.8) : 0) : kind === 'rise' && state.view === 'orbit' ? 0 : 1
            weight = patch.weight ? base * patch.weight(shot.time, state.view) : base
          }
          if (weight <= 0) continue
          const aim = aims?.patches[state.id]?.[patch.view]
          if (aim) patch.aim.copy(aim)
          this.skyPatches.push({ patch: share > 0 && shot.skyFloor && patch.view === 'terrain' ? this.floored(patch, shot.skyFloor) : patch, weight })
        }
      }
      if (shared && this.skyPatches.length > 1) this.skyPatches.sort((a, b) => (a.patch.view === 'terrain' ? 0 : 1) - (b.patch.view === 'terrain' ? 0 : 1))
      if (aims) this.sky.setFrame(aims.frame)
      this.sky.setPatches(this.skyPatches)
      this.sky.setStarLift(shot.skyStars ?? 0, config.raw.travel.sky.starLevel / Math.max(shot.skyExposure, 1e-3), config.raw.travel.sky.flightStars.level)
      this.sky.setBandLook(shot.skyLook ?? 0)
    }
    const view: RenderView = { camera: cam, diag, format: this.format, sample: index, samples: count, cameraPosition: shot.camera.position, farLight: shot.farLight, shutter: this.shutter, shutterSeconds: shutterSeconds() }
    for (const state of shot.sets) {
      const set = this.sets.get(state.id)!
      set.world.position.copy(state.origin).sub(shot.camera.position)
      set.world.quaternion.copy(state.rotation)
      if (set.over) {
        set.over.position.copy(set.world.position)
        set.over.quaternion.copy(set.world.quaternion)
      }
      set.update(state, shot, view)
    }
    const held = this.held
    held.length = 0
    if (shot !== mid) this.hold(shot, mid)
    const trims = this.trims
    trims.length = 0
    if (!raw && this.sky.cull) {
      this.world.traverseVisible((o) => {
        const t = o.userData.trim as Trim | undefined
        if (t) trims.push(t)
      })
    }
    for (const t of trims) t.hide()
    const ground = !raw && this.sky.cull ? this.shield() : null
    const covered = ground !== null && ground.screen(r, cam, width, height, TILE)
    r.setRenderTarget(this.sampleTarget)
    const early = !place && !covered && !raw && this.sky.cull && this.sortWorld()
    let open: Tiles | null = null
    if (early) {
      this.renderWorld(cam, this.veiled)
      if (this.alpha.length !== width * height * 4) this.alpha = new Uint16Array(width * height * 4)
      r.readRenderTargetPixels(this.sampleTarget, 0, 0, width, height, this.alpha)
      open = openTiles(this.alpha, width, height)
    }
    if (ground && covered) {
      ground.mark(r, cam)
      if (this.alpha.length !== width * height * 4) this.alpha = new Uint16Array(width * height * 4)
      r.readRenderTargetPixels(this.sampleTarget, 0, 0, width, height, this.alpha)
      const marks = marksIn(this.alpha, width, height, TILE)
      const cols = Math.ceil(width / TILE)
      ground.hide(marks, cols)
      open = { tile: TILE, cols, rows: Math.ceil(height / TILE), open: Uint8Array.from(marks, (m) => m & 1) }
      r.clear(true, true, true)
    }
    if (!raw) {
      cam.fov = mid.camera.vfov
      cam.updateProjectionMatrix()
      const glare = this.director?.glareOf?.(mid)
      const sun = glare ? { ...shot.sun, dir: glare } : shot.sun
      this.sky.setTerrain(shot.skyShare === undefined ? null : shot.skyGlow < 1 ? shot.skyShare : 0)
      this.sky.render(r, this.sampleTarget, cam, mid.skyQuaternion, shot.skyExposure, shot.skyGlow, mid.skyTurn, height, sun, shot.post.vignette, width / height, open)
      if (shot.dust > 0) this.dust.render(r, this.sampleTarget, this.director!, shot, view, sun)
      cam.fov = shot.camera.vfov
      cam.updateProjectionMatrix()
      if (picture) this.place.keepSky(r, this.sampleTarget)
      r.setRenderTarget(this.sampleTarget)
    }
    if (early) this.renderWorld(cam, this.solid)
    else r.render(this.world, cam)
    if (ground && covered) ground.show()
    for (const t of trims) t.show()
    for (const o of held) o.matrixWorldAutoUpdate = true
    if (this.near.children.length > 0) {
      r.clearDepth()
      r.render(this.near, cam)
    }
    this.belt.render(r, this.sampleTarget, this.director!, shot, view)
    if (place && picture) {
      const mode: PlaceMode = raw ? 'texels' : this.probe.mask ? 'mask' : this.probe.picture ? 'picture' : 'beauty'
      this.place.render(r, this.sampleTarget, picture, place, shot.camera, cam, mode, shot.post.vignette, width / height, gradUniform.value, this.probe.dump, this.sets.get(place.stop)?.placeMatte?.[place.kind] ?? null)
    }
    if (this.over.children.length > 0) {
      r.setRenderTarget(this.sampleTarget)
      r.render(this.over, cam)
    }
    if (raw) return
    if (shot.cover.amount > 0 && coverReaches(shot.cover, shot.camera.vfov, width / height)) this.cover.render(r, this.sampleTarget, shot.cover, shot.post.exposure, shot.camera.vfov, width / height)
  }

  private floored(patch: SkyPatch, floor: SkyFloor): SkyPatch {
    if (patch.ring[2] >= 0) return patch
    const hit = this.floors.get(patch)
    if (hit && hit.floor === floor) return hit.patch
    const ring = floorRing(floor, patch.tan, config.raw.handover.skyFloor)
    const cut = ring ? { ...patch, ring } : patch
    this.floors.set(patch, { floor, patch: cut })
    return cut
  }

  private picture(place: PlaceState, shot: Shot): PlacePicture | null {
    const director = this.director!
    const r = this.renderer
    const diag = this.probe.view
    const raw = isRaw(diag)
    const caps = r.capabilities
    const edge = Math.min(caps.maxTextureSize, r.getContext().getParameter(r.getContext().MAX_RENDERBUFFER_SIZE) as number)
    const layout = placeLayout(this.format, place, edge)
    const grad = gradUniform.value
    const key = [place.stop, place.kind, place.live ? 'live' : place.time, this.assets, this.format.id, raw ? diag : 'beauty', grad, layout.scale, layout.left, layout.right, layout.bottom, layout.top, place.matte ?? 'pair'].join('|')
    if (!place.live) {
      const kept = this.place.find(key)
      if (kept) return kept
    }
    const at = director.shotAt(place.frame, place.time, 'terrain')
    const now = place.live ? director.shotAt(shot.frame, shot.time, 'terrain') : at
    const states = at.sets.map((s, i) => {
      const n = now.sets[i]
      return n && n !== s && n.id === s.id ? { ...s, time: n.time, local: n.local, u: n.u } : s
    })
    if (states.map((s) => s.id).join('|') !== this.attached.join('|')) return null
    const pshot: Shot = { ...at, time: now.time, u: now.u, sets: states, post: { ...at.post, vignette: 0 } }
    const cam = this.place.camera
    placeCamera(cam, this.format, layout, at.camera, at.near, at.far)
    const view: RenderView = { camera: cam, diag, format: { ...this.format, width: this.format.width * layout.scale, height: this.format.height * layout.scale }, sample: 0, samples: 1, cameraPosition: at.camera.position, farLight: at.farLight, place: true, placeScale: layout.scale }
    const master = config.formats[config.formatKeys.master]!
    setPass(this.format.id === master.id ? 1 : layout.scale / placeLayout(master, place, edge).scale)
    for (const state of states) {
      const set = this.sets.get(state.id)!
      set.world.position.copy(state.origin).sub(at.camera.position)
      set.world.quaternion.copy(state.rotation)
      set.update(state, pshot, view)
    }
    gradUniform.value = grad * layout.scale
    setFine(layout.scale)
    const draw = (target: THREE.WebGLRenderTarget, white: boolean): void => {
      r.setRenderTarget(target)
      r.setClearColor(white ? 0xffffff : 0x000000, white ? 1 : 0)
      r.clear(true, true, true)
      r.render(this.world, cam)
      if (this.near.children.length > 0) {
        r.clearDepth()
        r.render(this.near, cam)
      }
    }
    const picture = this.place.build(r, key, layout, raw ? 'raw' : place.matte ?? 'pair', place.live, Math.min(8, caps.getMaxAnisotropy()), draw)
    r.setClearColor(0x000000, 0)
    gradUniform.value = grad
    setFine(1)
    setPass(1)
    return picture
  }

  private hold(shot: Shot, mid: Shot): void {
    const held = this.held
    shot.sets.forEach((state, i) => {
      const from = held.length
      const find = (o: THREE.Object3D): void => {
        if (!o.visible) return
        if (o.userData.skyClock === true) held.push(o)
        else for (const c of o.children) find(c)
      }
      const world = this.sets.get(state.id)!.world
      find(world)
      const at = mid.sets[i]
      if (held.length === from || !at || at.id !== state.id) {
        held.length = from
        return
      }
      world.updateMatrixWorld(true)
      const carry = midShutterCarry(this.carry, shot, state, mid, at)
      for (let k = from; k < held.length; k++) {
        const o = held[k]!
        o.matrixWorld.premultiply(carry)
        o.matrixWorldAutoUpdate = false
        for (const c of o.children) c.updateMatrixWorld(true)
      }
    })
  }

  private shield(): Relief | null {
    let found: Relief | null = null
    let count = 0
    this.world.traverseVisible((o) => {
      const s = o.userData.shield as Relief | undefined
      if (s) {
        found = s
        count++
      }
    })
    const ground = found as Relief | null
    if (!ground || count !== 1) return null
    let plain = true
    this.world.traverseVisible((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
      if (!m || ground.owns(o)) return
      for (const x of Array.isArray(m) ? m : [m]) if (x.visible && (x.depthWrite || x.stencilWrite)) plain = false
    })
    return plain ? ground : null
  }

  private sortWorld(): boolean {
    const solid = this.solid
    const veiled = this.veiled
    solid.length = 0
    veiled.length = 0
    let plain = true
    this.world.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.Material | THREE.Material[] | undefined
      if (!m) return
      for (const x of Array.isArray(m) ? m : [m]) {
        if (x.transparent) {
          if (!veiled.includes(x)) veiled.push(x)
        } else if ((x.blending === THREE.NormalBlending || x.blending === THREE.NoBlending) && x.colorWrite && !x.alphaToCoverage && !((x as THREE.MeshPhysicalMaterial).transmission > 0) && (!x.stencilWrite || this.marked.has(x))) {
          if (!solid.includes(x)) solid.push(x)
        } else plain = false
      }
    })
    if (!plain || solid.length === 0) return false
    for (const x of solid) {
      if (this.marked.has(x)) continue
      x.stencilWrite = true
      x.stencilFunc = THREE.AlwaysStencilFunc
      x.stencilRef = 1
      x.stencilFuncMask = 0xff
      x.stencilWriteMask = 0xff
      x.stencilFail = THREE.KeepStencilOp
      x.stencilZFail = THREE.KeepStencilOp
      x.stencilZPass = THREE.ReplaceStencilOp
      this.marked.add(x)
    }
    return true
  }

  private renderWorld(cam: THREE.PerspectiveCamera, hidden: THREE.Material[]): void {
    const was = hidden.map((m) => m.visible)
    for (const m of hidden) m.visible = false
    this.renderer.render(this.world, cam)
    hidden.forEach((m, i) => {
      m.visible = was[i]!
    })
  }

  ahead(p: number, tier = 'draft', last = config.frameCount - 1, all = false): number {
    return this.warm.step(this, p, tier, last, all)
  }

  warmDraw(frame: number, tier: string): void {
    const kept = [this.lastFrame, this.lastShot, this.sampleCount] as const
    this.drawFrame(frame, tier)
    ;[this.lastFrame, this.lastShot, this.sampleCount] = kept
  }

  async prefetch(ids: string[]): Promise<void> {
    await this.sets.ensure(ids, this.assets)
  }

  ready(at: number): boolean {
    const frame = wholeFrame(at)
    return this.skyTexture !== null && this.skyAssets === this.assets && setsForFrame(frame).every((id) => this.sets.has(id, this.assets)) && this.belt.ready(frame, this.assets)
  }

  flush(): void {
    const gl = this.renderer.getContext()
    this.renderer.setRenderTarget(null)
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
  }

  get samples(): number {
    return this.sampleCount
  }

  sanity(): Sanity {
    const { width, height } = this.format
    const buf = new Float32Array(width * height * 4)
    this.renderer.readRenderTargetPixels(this.accumulator.target, 0, 0, width, height, buf)
    let invalid = 0
    let cover = 0
    for (let i = 0; i < buf.length; i += 4) {
      if (!Number.isFinite(buf[i]!) || !Number.isFinite(buf[i + 1]!) || !Number.isFinite(buf[i + 2]!)) invalid++
      cover += Math.min(Math.max(buf[i + 3]!, 0), 1)
    }
    return { invalid, coverage: cover / (width * height) }
  }

  get shot(): Shot | null {
    return this.lastShot
  }
}
