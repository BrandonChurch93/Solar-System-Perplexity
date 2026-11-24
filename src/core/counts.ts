export interface Counts { programs: number; textures: number; buffers: number }

const WORK: Record<keyof Counts, string[]> = {
  programs: ['linkProgram'],
  textures: ['texImage2D', 'texSubImage2D', 'texStorage2D', 'compressedTexImage2D', 'compressedTexSubImage2D', 'texImage3D', 'texSubImage3D', 'texStorage3D', 'copyTexImage2D'],
  buffers: ['createBuffer', 'createFramebuffer', 'createRenderbuffer', 'createVertexArray'],
}

export class Counter {
  private now: Counts = { programs: 0, textures: 0, buffers: 0 }

  constructor(gl: WebGL2RenderingContext) {
    const host = gl as unknown as Record<string, (...args: unknown[]) => unknown>
    for (const key of Object.keys(WORK) as (keyof Counts)[]) {
      for (const name of WORK[key]) {
        const inner = host[name]
        if (typeof inner !== 'function') continue
        host[name] = (...args: unknown[]) => {
          this.now[key]++
          return inner.apply(gl, args)
        }
      }
    }
  }

  take(): Counts {
    const out = this.now
    this.now = { programs: 0, textures: 0, buffers: 0 }
    return out
  }
}
