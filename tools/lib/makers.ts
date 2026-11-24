import type { Page } from 'playwright-core'

// Names what a frame makes on the card, for tools/warmcheck.ts: every program linked (its SHADER_NAME and the uniforms of its own it declares),
// every texture upload with its numbers, the bytes of every bufferData and how many buffers, frame buffers, render buffers and vertex arrays were made.
// The lines gather in window.made of the page; the caller empties it before a frame and reads it after.

const UPLOADS = ['texImage2D', 'texSubImage2D', 'texStorage2D', 'compressedTexImage2D', 'compressedTexSubImage2D', 'texImage3D', 'texSubImage3D', 'texStorage3D', 'copyTexImage2D']
const OBJECTS = ['createBuffer', 'createFramebuffer', 'createRenderbuffer', 'createVertexArray']

export async function watchMakers(page: Page): Promise<void> {
  await page.evaluate(([uploads, objects]) => {
    const gl = document.querySelector('canvas')!.getContext('webgl2')!
    const raw = gl as unknown as Record<string, (...x: unknown[]) => unknown>
    const made: string[] = []
    ;(window as unknown as { made: string[] }).made = made
    for (const name of [...uploads!, ...objects!, 'bufferData', 'linkProgram']) {
      const was = raw[name]!.bind(gl)
      raw[name] = (...x: unknown[]) => {
        if (uploads!.includes(name)) made.push(name + ' ' + x.filter((v) => typeof v === 'number').join(' '))
        else if (name === 'bufferData') made.push('bufferData ' + (typeof x[1] === 'number' ? x[1] : (x[1] as ArrayBufferView | null)?.byteLength ?? 0))
        else if (name === 'linkProgram') {
          const text = (gl.getAttachedShaders(x[0] as WebGLProgram) ?? []).map((s) => gl.getShaderSource(s) ?? '').join('\n')
          const own = [...new Set([...text.matchAll(/\b(?:uniform|in|attribute)\s+(?:(?:highp|mediump|lowp)\s+)?\w+\s+([ua][A-Z]\w*)/g)].map((m) => m[1]!))]
          made.push('linkProgram ' + (/#define SHADER_NAME (\S+)/.exec(text)?.[1] ?? 'unnamed') + ': ' + own.slice(0, 14).join(' ') + (own.length > 14 ? ' and ' + (own.length - 14) + ' more' : ''))
        } else made.push(name)
        return was(...x)
      }
    }
  }, [UPLOADS, OBJECTS] as const)
}

export function makerLines(made: string[]): string[] {
  const out: string[] = []
  const count = new Map<string, number>()
  for (const m of made) {
    if (m.startsWith('linkProgram') || m.startsWith('tex') || m.startsWith('compressed') || m.startsWith('copyTex')) out.push(m)
    else count.set(m, (count.get(m) ?? 0) + 1)
  }
  const sizes = [...count].filter(([k]) => k.startsWith('bufferData')).map(([k, n]) => k.slice(11) + (n > 1 ? ' x' + n : ''))
  const objects = [...count].filter(([k]) => !k.startsWith('bufferData')).map(([k, n]) => k + ' x' + n)
  if (objects.length) out.push(objects.join(', '))
  if (sizes.length) out.push('bufferData bytes: ' + sizes.slice(0, 24).join(', ') + (sizes.length > 24 ? ' and ' + (sizes.length - 24) + ' more sizes' : ''))
  return out
}
