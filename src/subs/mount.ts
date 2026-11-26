import { config } from '../config'
import type { Engine } from '../core/engine'
import fontUrl from './font/subs-sans-medium.woff2?url'
import { FAMILY, Layer } from './layer'

export async function mount(engine: Engine): Promise<void> {
  const face = new FontFace(FAMILY, 'url(' + fontUrl + ')')
  await face.load()
  document.fonts.add(face)
  const layer = new Layer(engine.renderer)
  engine.subs = (frame) => {
    layer.draw(frame / config.fps)
  }
  ;(globalThis as unknown as { __subs: Layer }).__subs = layer
}
