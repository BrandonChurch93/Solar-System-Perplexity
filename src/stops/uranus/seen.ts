import type * as THREE from 'three'
import { config } from '../../config'

const rows = config.formats[config.formatKeys.master]!.height

export const seenUniform: THREE.IUniform<number> = { value: 1 }

export function setSeen(height: number): number {
  seenUniform.value = height / rows
  return seenUniform.value
}
