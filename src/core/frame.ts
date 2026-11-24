import type * as THREE from 'three'

export const frameUniform: THREE.IUniform<number> = { value: 1 }

let pass = 1

export function setFrame(height: number, master: number): void {
  if (!(height > 0 && master > 0)) throw new Error('the frame has no height')
  frameUniform.value = height / master
}

export function setPass(scale: number): void {
  if (!(scale > 0)) throw new Error('a pass has a scale above 0')
  pass = scale
}

export const bufferFrame = (): number => frameUniform.value * pass
