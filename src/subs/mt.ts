export class MT {
  private readonly mt = new Uint32Array(624)
  private at = 624

  constructor(seed: number) {
    const mt = this.mt
    mt[0] = seed >>> 0
    for (let i = 1; i < 624; i++) {
      const p = mt[i - 1]! ^ (mt[i - 1]! >>> 30)
      mt[i] = (Math.imul(1812433253, p) + i) >>> 0
    }
  }

  private turn(): void {
    const mt = this.mt
    for (let k = 0; k < 624; k++) {
      const y = (mt[k]! & 0x80000000) | (mt[(k + 1) % 624]! & 0x7fffffff)
      mt[k] = (mt[(k + 397) % 624]! ^ (y >>> 1) ^ (y & 1 ? 0x9908b0df : 0)) >>> 0
    }
    this.at = 0
  }

  int(): number {
    if (this.at >= 624) this.turn()
    let y = this.mt[this.at++]!
    y ^= y >>> 11
    y ^= (y << 7) & 0x9d2c5680
    y ^= (y << 15) & 0xefc60000
    y ^= y >>> 18
    return y >>> 0
  }

  rand(): number {
    const a = this.int() >>> 5
    const b = this.int() >>> 6
    return (a * 67108864 + b) / 9007199254740992
  }
}
