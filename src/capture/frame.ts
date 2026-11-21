import { config } from '../config'
import type { Engine, Sanity } from '../core/engine'

declare const __ENGINE_HASH__: string
declare const __STOP_HASHES__: Record<string, string>
declare const __VERSIONS__: Record<string, string>

export interface ShowcaseInfo { frameCount: number; fps: number; format: string; tier: string; assets: string; engineHash: string; stopHashes: Record<string, string>; versions: Record<string, string> }

export interface Showcase {
  ready: Promise<void>
  info(): ShowcaseInfo
  setFormat(id: string): Promise<void>
  setAssets(id: string): Promise<void>
  setDiagnostic(view: string): void
  renderFrame(frameIndex: number, tier: string): Promise<void>
  png(): Promise<string>
  sanity(): Sanity
  samples(): number
  memory(): { textureBytes: number; peakBytes: number; skyBytes: number; loaded: string[]; perSet: Record<string, number> }
}

export function installShowcase(engine: Engine, ready: Promise<void>, tier: string): Showcase {
  let lastTier = tier
  const api: Showcase = {
    ready,
    info: () => ({ frameCount: config.frameCount, fps: config.fps, format: engine.format.id, tier: lastTier, assets: engine.assets, engineHash: __ENGINE_HASH__, stopHashes: __STOP_HASHES__, versions: __VERSIONS__ }),
    setFormat: async (id) => engine.setFormat(id),
    setAssets: async (id) => engine.setAssets(id),
    setDiagnostic: (view) => {
      engine.diag = view
    },
    renderFrame: async (frameIndex, t) => {
      lastTier = t
      await engine.renderFrame(frameIndex, t)
    },
    png: async () => {
      const blob = await new Promise<Blob>((resolve, reject) => engine.canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('no blob'))), 'image/png'))
      const bytes = new Uint8Array(await blob.arrayBuffer())
      let s = ''
      const step = 0x8000
      for (let i = 0; i < bytes.length; i += step) s += String.fromCharCode(...bytes.subarray(i, i + step))
      return btoa(s)
    },
    sanity: () => engine.sanity(),
    samples: () => engine.samples,
    memory: () => {
      const perSet: Record<string, number> = {}
      for (const id of engine.sets.loadedIds()) perSet[id] = engine.sets.bytesOf(id)
      return { textureBytes: engine.sets.totalBytes(), peakBytes: engine.sets.peakBytes, skyBytes: engine.skyBytes, loaded: engine.sets.loadedIds(), perSet }
    },
  }
  ;(window as unknown as { showcase: Showcase }).showcase = api
  return api
}
