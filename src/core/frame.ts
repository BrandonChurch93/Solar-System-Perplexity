import type * as THREE from 'three'

export const frameUniform: THREE.IUniform<number> = { value: 1 }

export function setFrame(height: number, master: number): void {
  if (!(height > 0 && master > 0)) throw new Error('the frame has no height')
  frameUniform.value = height / master
}
