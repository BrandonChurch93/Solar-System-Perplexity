import * as THREE from 'three'

export class LandMatte {
  readonly texture: THREE.DataTexture
  private readonly data: Uint8Array
  private amount = -1

  constructor(private readonly edge: readonly number[], private readonly rows: number, private readonly band: readonly [number, number]) {
    this.data = new Uint8Array(edge.length * rows)
    this.texture = new THREE.DataTexture(this.data, edge.length, rows, THREE.RedFormat, THREE.UnsignedByteType)
    this.texture.minFilter = THREE.LinearFilter
    this.texture.magFilter = THREE.LinearFilter
    this.texture.unpackAlignment = 1
    this.set(0)
  }

  set(amount: number): void {
    if (amount === this.amount) return
    this.amount = amount
    const columns = this.edge.length
    const span = this.band[1] - this.band[0]
    for (let x = 0; x < columns; x++) {
      const from = this.edge[x]! + this.band[0]
      for (let y = 0; y < this.rows; y++) {
        const t = Math.min(Math.max(((y + 0.5) / this.rows - from) / span, 0), 1)
        this.data[(this.rows - 1 - y) * columns + x] = Math.round(255 * (1 - amount * (1 - t * t * (3 - 2 * t))))
      }
    }
    this.texture.needsUpdate = true
  }

  dispose(): void {
    this.texture.dispose()
  }
}
