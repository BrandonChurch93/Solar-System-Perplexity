import * as THREE from 'three'
import { config, type FormatDef } from '../config'
import { bindImplicit } from './texel'
import type { SetContext, SetFactory, StopSet, TextureOptions } from './types'
import { capHeightBytes, capHeights } from '../bodies/cap'

interface Loaded { set: StopSet; bytes: number; assets: string; lastUsed: number }

type Keep = (tex: THREE.Texture, bytes: number) => void
const KEEP = Symbol('keep')

export function heightTexture(ctx: SetContext, data: Uint16Array, size: number): THREE.DataTexture {
  const keep = (ctx as unknown as Record<symbol, Keep | undefined>)[KEEP]
  if (!keep) throw new Error('heightTexture needs the context a set was made with')
  const tex = capHeights(data, size)
  keep(tex, capHeightBytes(size))
  return tex
}

export class SetLoader {
  private readonly loaded = new Map<string, Loaded>()
  private readonly pending = new Map<string, Promise<void>>()
  private readonly factories = new Map<string, SetFactory>()
  private clock = 0
  peakBytes = 0
  epoch = 0

  constructor(private readonly renderer: THREE.WebGLRenderer, private readonly getFormat: () => FormatDef, private readonly maxAnisotropy: number) {}

  register(id: string, factory: SetFactory): void {
    this.factories.set(id, factory)
  }

  has(id: string, assets: string): boolean {
    const l = this.loaded.get(id)
    return !!l && l.assets === assets
  }

  get(id: string): StopSet | undefined {
    return this.loaded.get(id)?.set
  }

  loadedIds(): string[] {
    return [...this.loaded.keys()]
  }

  bytesOf(id: string): number {
    return this.loaded.get(id)?.bytes ?? 0
  }

  totalBytes(): number {
    let n = 0
    for (const l of this.loaded.values()) n += l.bytes
    return n
  }

  async ensure(ids: string[], assets: string): Promise<void> {
    if (ids.length > config.maxLoadedSets) throw new Error('a frame may not need more than ' + config.maxLoadedSets + ' sets')
    this.clock++
    for (const id of ids) {
      const l = this.loaded.get(id)
      if (l && l.assets === assets) l.lastUsed = this.clock
    }
    for (const id of ids) {
      if (this.has(id, assets)) continue
      const stale = this.loaded.get(id)
      if (stale) this.free(id)
      while (this.loaded.size >= config.maxLoadedSets) {
        let victim: string | null = null
        let oldest = Infinity
        for (const [key, l] of this.loaded) {
          if (ids.includes(key)) continue
          if (l.lastUsed < oldest) {
            oldest = l.lastUsed
            victim = key
          }
        }
        if (victim === null) throw new Error('set loader has nothing to free')
        this.free(victim)
      }
      let p = this.pending.get(id + '|' + assets)
      if (!p) {
        p = this.load(id, assets).finally(() => this.pending.delete(id + '|' + assets))
        this.pending.set(id + '|' + assets, p)
      }
      await p
      const l = this.loaded.get(id)
      if (l) l.lastUsed = this.clock
    }
  }

  free(id: string): void {
    const l = this.loaded.get(id)
    if (!l) return
    l.set.dispose()
    this.loaded.delete(id)
  }

  release(keep: string[]): void {
    for (const id of [...this.loaded.keys()]) if (!keep.includes(id)) this.free(id)
  }

  freeAll(): void {
    for (const id of [...this.loaded.keys()]) this.free(id)
  }

  reset(): void {
    this.epoch++
    this.freeAll()
  }

  private async load(id: string, assets: string): Promise<void> {
    for (;;) {
      const epoch = this.epoch
      let built: Loaded | null = null
      try {
        built = await this.build(id, assets)
      } catch (e) {
        if (epoch === this.epoch) throw e
      }
      if (built && epoch === this.epoch) {
        this.loaded.set(id, built)
        this.peakBytes = Math.max(this.peakBytes, this.totalBytes())
        return
      }
      built?.set.dispose()
    }
  }

  private async build(id: string, assets: string): Promise<Loaded> {
    const factory = this.factories.get(id)
    if (!factory) throw new Error('no set registered for ' + id)
    let bytes = 0
    const textures: THREE.Texture[] = []
    const base = new URL('./assets/', document.baseURI).toString()
    const ctx = {
      assets,
      format: this.getFormat(),
      url: (path) => base + path,
      texture: async (path, options: TextureOptions = {}) => {
        const one = options.channels === 1
        if (one && options.srgb !== false) throw new Error('a one channel texture needs srgb: false: ' + path)
        const res = await fetch(base + path)
        if (!res.ok) throw new Error('asset missing: ' + path)
        const blob = await res.blob()
        const bitmap = await createImageBitmap(blob, { imageOrientation: options.flipY === false ? 'none' : 'flipY', premultiplyAlpha: 'none', colorSpaceConversion: 'none' })
        const tex = new THREE.Texture(bitmap as unknown as HTMLImageElement)
        tex.flipY = false
        if (one) tex.format = THREE.RedFormat
        tex.colorSpace = options.srgb === false ? THREE.NoColorSpace : THREE.SRGBColorSpace
        const mips = options.mips !== false
        tex.generateMipmaps = mips
        tex.minFilter = mips ? THREE.LinearMipmapLinearFilter : THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.wrapS = options.mirror ? THREE.MirroredRepeatWrapping : options.repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
        tex.wrapT = options.mirror ? THREE.MirroredRepeatWrapping : THREE.ClampToEdgeWrapping
        tex.anisotropy = Math.min(options.anisotropy ?? 8, this.maxAnisotropy)
        tex.needsUpdate = true
        this.renderer.initTexture(tex)
        const size = { width: bitmap.width, height: bitmap.height }
        bytes += size.width * size.height * (one ? 1 : 4) * (mips ? 4 / 3 : 1)
        bitmap.close()
        tex.image = size as unknown as HTMLImageElement
        textures.push(tex)
        return tex
      },
      dataTexture: async (path, width, height, channels) => {
        const res = await fetch(base + path)
        if (!res.ok) throw new Error('asset missing: ' + path)
        const data = new Float32Array(await res.arrayBuffer())
        if (data.length !== width * height * channels) throw new Error('data texture size mismatch: ' + path)
        const tex = new THREE.DataTexture(data, width, height, channels === 1 ? THREE.RedFormat : THREE.RGBAFormat, THREE.FloatType)
        tex.minFilter = THREE.LinearFilter
        tex.magFilter = THREE.LinearFilter
        tex.wrapS = tex.wrapT = THREE.ClampToEdgeWrapping
        tex.needsUpdate = true
        this.renderer.initTexture(tex)
        bytes += data.byteLength
        textures.push(tex)
        return tex
      },
    } as SetContext
    ctx.buffer = async (path) => {
      const res = await fetch(base + path)
      if (!res.ok) throw new Error('asset missing: ' + path)
      return res.arrayBuffer()
    }
    ctx.floatTexture = (data, width, height, repeat = false) => {
      if (data.length !== width * height) throw new Error('float texture size mismatch')
      const tex = new THREE.DataTexture(data, width, height, THREE.RedFormat, THREE.FloatType)
      tex.minFilter = THREE.LinearFilter
      tex.magFilter = THREE.LinearFilter
      tex.wrapS = repeat ? THREE.RepeatWrapping : THREE.ClampToEdgeWrapping
      tex.wrapT = THREE.ClampToEdgeWrapping
      tex.needsUpdate = true
      this.renderer.initTexture(tex)
      bytes += data.byteLength
      textures.push(tex)
      return tex
    }
    ;(ctx as unknown as Record<symbol, Keep>)[KEEP] = (tex, n) => {
      this.renderer.initTexture(tex)
      bytes += n
      textures.push(tex)
    }
    const set = await factory(ctx)
    bindImplicit(set.world)
    bindImplicit(set.near)
    const dispose = set.dispose.bind(set)
    set.dispose = () => {
      dispose()
      for (const t of textures) t.dispose()
    }
    return { set, bytes, assets, lastUsed: this.clock }
  }
}

export function planLoads(loaded: string[], wanted: string[], max: number): { after: string[]; peak: number; freed: string[] } {
  if (wanted.length > max) throw new Error('a frame may not need more than ' + max + ' sets')
  let now = loaded.filter((id) => !wanted.includes(id)).concat(loaded.filter((id) => wanted.includes(id)))
  let peak = now.length
  const freed: string[] = []
  for (const id of wanted) {
    if (now.includes(id)) continue
    while (now.length >= max) {
      const victim = now.find((x) => !wanted.includes(x))
      if (victim === undefined) throw new Error('set loader has nothing to free')
      freed.push(victim)
      now = now.filter((x) => x !== victim)
    }
    now.push(id)
    peak = Math.max(peak, now.length)
  }
  return { after: now, peak, freed }
}
