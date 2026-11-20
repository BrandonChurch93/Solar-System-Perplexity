import * as THREE from 'three'
import { config, type FormatDef } from '../config'
import { Accumulator } from './accumulator'
import { OPTIONAL_EXTENSIONS, missing, needs } from './caps'
import { floatTarget } from './pass'
import { sampleCount, samplesFor, shutterMid } from './sampler'
import { SetLoader } from './sets'
import type { RenderView, Shot } from './types'
import { isRaw, setDiag } from '../diagnostics/diag'
import { PostChain } from '../post/chain'
import { Dust } from '../space/dust'
import { Sky } from '../space/sky'
import { Cover } from '../terrain/cover'
import { segmentAtFrame, setsForFrame } from '../director/timeline'

export interface Director {
  shotAt(frame: number, time: number): Shot
}

export interface Sanity { invalid: number; coverage: number }

const STAR_COUNT = 420000
const DUST_COUNT = 2600

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
  private skyAssets = ''
  private skyTexture: THREE.Texture | null = null
  private attached: string[] = []
  private lastShot: Shot | null = null

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
    this.sampleTarget = floatTarget(format.width, format.height, THREE.HalfFloatType, true)
    this.accumulator = new Accumulator(format.width, format.height)
    this.applySize()
  }

  private applySize(): void {
    const { width, height } = this.format
    this.renderer.setSize(width, height, false)
    this.canvas.style.aspectRatio = width + ' / ' + height
    this.sampleTarget.dispose()
    this.accumulator.dispose()
    this.sampleTarget = floatTarget(width, height, THREE.HalfFloatType, true)
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

  private async ensureSky(): Promise<void> {
    if (this.skyAssets === this.assets && this.skyTexture) return
    const res = await fetch(new URL('./assets/shared/' + this.assets + '/sky.jpg', document.baseURI))
    if (!res.ok) throw new Error('sky map missing')
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
    this.skyBytes = bitmap.width * bitmap.height * 4 * (4 / 3)
    bitmap.close()
    this.skyTexture?.dispose()
    this.skyTexture = tex
    this.skyAssets = this.assets
    this.sky.setTexture(tex)
  }

  skyBytes = 0

  async prepare(frame: number): Promise<void> {
    await this.ensureSky()
    await this.sets.ensure(setsForFrame(frame), this.assets)
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
    this.post.render(this.renderer, this.accumulator.texture, mid.post, f, this.diag)
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
    r.setRenderTarget(this.sampleTarget)
    r.clear(true, true, false)
    if (!raw) this.sky.render(r, this.sampleTarget, cam, mid.skyQuaternion, shot.skyExposure, height, shot.sun)
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
    r.setRenderTarget(this.sampleTarget)
    r.render(this.world, cam)
    if (this.near.children.length > 0) {
      r.clearDepth()
      r.render(this.near, cam)
    }
    if (raw) return
    if (shot.dust > 0) this.dust.render(r, this.sampleTarget, cam, shot.dustOffset, shot.dust, height)
    if (shot.cover.amount > 0) this.cover.render(r, this.sampleTarget, shot.cover, shot.post.exposure, shot.camera.vfov, width / height)
  }

  async prefetch(ids: string[]): Promise<void> {
    await this.sets.ensure(ids, this.assets)
  }

  ready(frame: number): boolean {
    return this.skyTexture !== null && this.skyAssets === this.assets && setsForFrame(frame).every((id) => this.sets.has(id, this.assets))
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
