import { config } from '../../config'
import type { RenderView } from '../../core/types'

export const frameUniform = { value: 1 }

export function setFrame(view: RenderView): number {
  frameUniform.value = view.format.height / config.raw.formats.master.height
  return frameUniform.value
}
