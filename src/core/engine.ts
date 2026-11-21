import * as THREE from 'three'
import { config, type FormatDef } from '../config'
import { Accumulator } from './accumulator'
import { OPTIONAL_EXTENSIONS, missing, needs } from './caps'
import { floatTarget } from './pass'
import { TILE, openTiles, type Tiles } from './tiles'
import { sampleCount, samplesFor, shutterMid } from './sampler'
import { SetLoader } from './sets'
import type { RenderView, Shot, SkyPatch } from './types'
import { isRaw, setDiag, setSamples } from '../diagnostics/diag'
import { PostChain } from '../post/chain'
import { Belt } from '../space/belt/belt'
import { Dust } from '../space/dust'
import { Sky } from '../space/sky'
import { implicitUniform } from './texel'
import type { SkyAims } from '../space/aim'
import { Cover } from '../terrain/cover'
import type { Relief } from '../terrain/relief'
import { marksIn } from '../terrain/shield'
import { segmentAtFrame, setsForFrame } from '../director/timeline'

export interface Director {
  shotAt(frame: number, time: number): Shot
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
  readonly sky: Sky
  format: FormatDef
  assets: string
  diag = 'beauty'
  director: Director | null = null
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
  private skyTexture: THREE.Texture | null = null
  private skyBand: THREE.Texture | null = null
  private attached: string[] = []
  private lastShot: Shot | null = null
  private readonly solid: THREE.Material[] = []
  private readonly veiled: THREE.Material[] = []
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
    const lacking = missing(gl, needs(assets, format.id))
    if (lacking.length > 0) throw new Error('this browser lacks: ' + lacking.join(', '))
    for (const e of OPTIONAL_EXTENSIONS) gl.getExtension(e)
    this.sets = new SetLoader(this.renderer, () => this.format, this.renderer.capabilities.getMaxAnisotropy())
    this.sky = new Sky(STAR_COUNT)
    this.sampleTarget = floatTarget(format.width, format.height, THREE.HalfFloatType, true, true)
    this.accumulator = new Accumulator(format.width, format.height)
    this.applySize()
  }

  private applySize(): void {
    const { width, height } = this.format
    this.renderer.setSize(width, height, false)
    this.canvas.style.aspectRatio = width + ' / ' + height
    this.sampleTarget.dispose()
    this.accumulator.dispose()
    this.sampleTarget = floatTarget(width, height, THREE.HalfFloatType, true, true)
    this.accumulator = new Accumulator(width, height)
    this.post.resize(width, height)
    this.camera.aspect = width / height
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

  private async skyMap(name: string): Promise<{ tex: THREE.Texture; bytes: number }> {
    const res = await fetch(new URL('./assets/shared/' + this.assets + '/' + name, document.baseURI))
    if (!res.ok) throw new Error('sky map missing: ' + name)
    const bitmap = await createImageBitmap(await res.blob(), { imageOrientation: 'flipY', colorSpaceConversion: 'none' })
    const tex = new THREE.Texture(bitmap as unknown as HTMLImageElement)
    tex.flipY = false
    tex.colorSpace = THREE.SRGBColorSpace
    tex.wrapS = THREE.RepeatWrapping
    tex.wrapT = THREE.ClampToEdgeWrapping
    tex.minFilter = THREE.LinearMipmapLinearFilter
    tex.magFilter = THREE.LinearFilter
    tex.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy())
    tex.needsUpdate = true
    this.renderer.initTexture(tex)
    const bytes = bitmap.width * bitmap.height * 4 * (4 / 3)
    bitmap.close()
    return { tex, bytes }
  }

  private async ensureSky(): Promise<void> {
    if (this.skyAssets === this.assets && this.skyTexture) return
    const glow = await this.skyMap('sky.jpg')
    const band = await this.skyMap('skyband.jpg')
    this.skyBytes = glow.bytes + band.bytes
    this.skyTexture?.dispose()
    this.skyBand?.dispose()
    this.skyTexture = glow.tex
    this.skyBand = band.tex
    this.skyAssets = this.assets
    this.sky.setTexture(glow.tex, band.tex)
  }

  skyBytes = 0

  async prepare(frame: number): Promise<void> {
    await this.ensureSky()
    await this.sets.ensure(setsForFrame(frame), this.assets)
    await this.belt.prepare(frame, this.assets, this.renderer)
  }

  async renderFrame(frame: number, tier: string): Promise<void> {
    if (!this.director) throw new Error('no director')
    const f = Math.min(Math.max(Math.floor(frame), 0), config.frameCount - 1)
    await this.prepare(f)
    const segment = segmentAtFrame(f)
    const samples = samplesFor(sampleCount(tier, segment.kind))
    const mid = this.director.shotAt(f, (f + shutterMid()) / config.fps)
    this.accumulator.begin()
    samples.forEach((s, i) => {
      const shot = samples.length === 1 ? mid : this.director!.shotAt(f, (f + s.timeOffset) / config.fps)
      this.renderSample(shot, mid, s.jitterX, s.jitterY, i, samples.length)
      this.accumulator.add(this.renderer, this.sampleTarget.texture, s.weight)
    })
    this.post.render(this.renderer, this.accumulator.texture, mid.post, f, this.diag, samples.length > 1)
    this.lastShot = mid
    this.flush()
  }

  renderLive(shot: Shot): void {
    this.accumulator.begin()
    this.renderSample(shot, shot, 0, 0, 0, 1)
    this.accumulator.add(this.renderer, this.sampleTarget.texture, 1)
    this.post.render(this.renderer, this.accumulator.texture, shot.post, shot.frame, this.diag)
    this.lastShot = shot
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
    const raw = isRaw(this.diag)
    setDiag(this.diag)
    setSamples(count, GRAD_FLOOR)
    implicitUniform.value = this.sky.cull ? 1 : 0
    r.setRenderTarget(this.sampleTarget)
    r.clear(true, true, true)
    if (!raw) {
      this.skyPatches.length = 0
      const aims = this.director!.sky
      for (const state of shot.sets) {
        for (const patch of this.sets.get(state.id)?.sky ?? []) {
          if (patch.view !== state.view) continue
          const kind = shot.segment.kind
          const arriving = kind === 'travel' && state.id !== shot.segment.stop
          const base = shot.segment.stop === config.endingId ? 0 : kind === 'travel' ? (arriving ? THREE.MathUtils.smoothstep(shot.u, 0.2, 0.8) : 0) : kind === 'rise' && state.view === 'orbit' ? 0 : 1
          const weight = patch.weight ? base * patch.weight(shot.time, state.view) : base
          if (weight <= 0) continue
          const aim = aims?.patches[state.id]?.[patch.view]
          if (aim) patch.aim.copy(aim)
          this.skyPatches.push({ patch, weight })
        }
      }
      if (aims) this.sky.setFrame(aims.frame)
      this.sky.setPatches(this.skyPatches)
    }
    const view: RenderView = { camera: cam, diag: this.diag, format: this.format, sample: index, samples: count, cameraPosition: shot.camera.position }
    const wanted = shot.sets.map((s) => s.id)
    if (wanted.join('|') !== this.attached.join('|')) {
      this.world.clear()
      this.near.clear()
      for (const id of wanted) {
        const set = this.sets.get(id)
        if (!set) throw new Error('set not loaded: ' + id)
        this.world.add(set.world)
        if (set.near) this.near.add(set.near)
      }
      this.attached = wanted
    }
    for (const state of shot.sets) {
      const set = this.sets.get(state.id)!
      set.world.position.copy(state.origin).sub(shot.camera.position)
      set.world.quaternion.copy(state.rotation)
      set.update(state, shot, view)
    }
    const ground = !raw && this.sky.cull ? this.shield() : null
    const covered = ground !== null && ground.screen(r, cam, width, height, TILE)
    r.setRenderTarget(this.sampleTarget)
    const early = !covered && !raw && this.sky.cull && this.sortWorld()
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
      this.sky.render(r, this.sampleTarget, cam, mid.skyQuaternion, shot.skyExposure, shot.skyGlow, mid.skyTurn, height, shot.sun, shot.post.vignette, width / height, open)
      cam.fov = shot.camera.vfov
      cam.updateProjectionMatrix()
      r.setRenderTarget(this.sampleTarget)
    }
    if (early) this.renderWorld(cam, this.solid)
    else r.render(this.world, cam)
    if (ground && covered) ground.show()
    if (this.near.children.length > 0) {
      r.clearDepth()
      r.render(this.near, cam)
    }
    this.belt.render(r, this.sampleTarget, this.director!, shot, view)
    if (raw) return
    if (shot.dust > 0) this.dust.render(r, this.sampleTarget, this.director!, shot, view)
    if (shot.cover.amount > 0) this.cover.render(r, this.sampleTarget, shot.cover, shot.post.exposure, shot.camera.vfov, width / height)
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

  async prefetch(ids: string[]): Promise<void> {
    await this.sets.ensure(ids, this.assets)
  }

  ready(frame: number): boolean {
    return this.skyTexture !== null && this.skyAssets === this.assets && setsForFrame(frame).every((id) => this.sets.has(id, this.assets)) && this.belt.ready(frame, this.assets)
  }

  flush(): void {
    const gl = this.renderer.getContext()
    this.renderer.setRenderTarget(null)
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(4))
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
