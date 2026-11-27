import { existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { inflateSync } from 'node:zlib'
import { DIST, WORK, loadConfig } from './common'
import { openCapture, pageFaults, type Session } from './browser'
import { JobLooks } from './looks'
import { basename } from 'node:path'

export type GrabMode = 'png' | 'raw' | 'none'

export interface Grab { frame: number; data: Buffer | null; invalid: number; coverage: number; renderSeconds: number; sanitySeconds: number; grabSeconds: number }

export interface FrameSource {
  session: Session
  width: number
  height: number
  render(frame: number, tier: string, grab: GrabMode, sanity: boolean): Promise<Grab>
  setDiagnostic(view: string): Promise<void>
  close(): Promise<void>
}

export class PageFailure extends Error {}

interface PageResult { b64: string; invalid: number; coverage: number; lost: boolean; r: number; s: number; g: number }

const LOCKS = join(WORK, 'locks')
const myLock = join(LOCKS, 'render-' + process.pid)

function alive(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  } catch {
    return false
  }
}

export function takeRenderSlot(): void {
  if (existsSync(myLock)) return
  mkdirSync(LOCKS, { recursive: true })
  const max = loadConfig().raw.sandbox.maxRenderProcesses
  const others = readdirSync(LOCKS).filter((n) => n.startsWith('render-')).filter((n) => {
    const pid = Number(n.slice(7))
    if (alive(pid)) return true
    rmSync(join(LOCKS, n), { force: true })
    return false
  })
  if (others.length >= max) throw new Error('another render process is running (' + others.join(', ') + '); sandbox.maxRenderProcesses is ' + max)
  writeFileSync(myLock, String(Date.now()))
  process.on('exit', () => rmSync(myLock, { force: true }))
}

export async function openSource(opts: { format: string; assets: string; diag?: string; mode?: string; job?: string }): Promise<FrameSource> {
  takeRenderSlot()
  const looks = new JobLooks(opts.job ?? basename(process.argv[1] ?? 'render').replace(/\.[a-z]+$/, ''))
  let diag = opts.diag ?? 'beauty'
  const session = await openCapture({ dist: DIST, format: opts.format, assets: opts.assets, diag: opts.diag, mode: opts.mode })
  let crashed = ''
  session.page.on('crash', () => {
    crashed = 'the page crashed'
  })
  session.page.on('close', () => {
    if (!crashed) crashed = 'the page closed'
  })
  const size = await session.page.evaluate(() => {
    const c = document.querySelector('canvas')!
    return { w: c.width, h: c.height }
  })
  const src: FrameSource = {
    session,
    width: size.w,
    height: size.h,
    async setDiagnostic(view) {
      diag = view
      await session.page.evaluate((v) => (window as unknown as { showcase: { setDiagnostic(v: string): void } }).showcase.setDiagnostic(v), view)
    },
    async render(frame, tier, grab, sanity) {
      if (crashed) throw new PageFailure(crashed)
      let res: PageResult
      try {
        res = await session.page.evaluate(async ([f, t, g, s]) => {
          type S = { renderFrame(f: number, t: string): Promise<void>; png(): Promise<string>; sanity(): { invalid: number; coverage: number } }
          const sc = (window as unknown as { showcase: S }).showcase
          const t0 = performance.now()
          await sc.renderFrame(f as number, t as string)
          const t1 = performance.now()
          let invalid = -1
          let coverage = -1
          if (s) {
            const r = sc.sanity()
            invalid = r.invalid
            coverage = r.coverage
          }
          const t2 = performance.now()
          let b64 = ''
          const c = document.querySelector('canvas')!
          if (g === 'png') b64 = await sc.png()
          else if (g === 'raw') {
            const o = new OffscreenCanvas(c.width, c.height)
            const x = o.getContext('2d')!
            x.drawImage(c, 0, 0)
            const bytes = new Uint8Array(x.getImageData(0, 0, c.width, c.height).data.buffer)
            let str = ''
            const step = 0x8000
            for (let i = 0; i < bytes.length; i += step) str += String.fromCharCode(...bytes.subarray(i, i + step))
            b64 = btoa(str)
          }
          const t3 = performance.now()
          const gl = (c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null
          const lost = !gl || gl.isContextLost() || ((window as unknown as { __glLost?: number }).__glLost ?? 0) > 0
          return { b64, invalid, coverage, lost, r: (t1 - t0) / 1000, s: (t2 - t1) / 1000, g: (t3 - t2) / 1000 }
        }, [process.env.GT_HALF === '1' ? 2 * frame + 1 : frame, tier, grab, sanity] as const)
      } catch (e) {
        throw new PageFailure((crashed || 'page call failed') + ' at frame ' + frame + ': ' + String(e).split('\n')[0]!.slice(0, 200))
      }
      if (res.lost) throw new PageFailure('WebGL context lost at frame ' + frame)
      const fault = pageFaults(session.page)[0]
      if (fault) throw new PageFailure('frame ' + frame + ' is not usable: ' + fault)
      const data = res.b64 ? Buffer.from(res.b64, 'base64') : null
      if (looks.due()) {
        try {
          const meta = { frame, tier, format: opts.format, diag }
          if (data && grab === 'raw') looks.add({ raw: { data, width: size.w, height: size.h } }, meta)
          else {
            const png = data ?? Buffer.from(await session.page.evaluate(() => (window as unknown as { showcase: { png(): Promise<string> } }).showcase.png()), 'base64')
            looks.add({ png }, meta)
          }
        } catch {
          /* a look is never a reason to fail a render */
        }
      }
      return { frame, data, invalid: res.invalid, coverage: res.coverage, renderSeconds: res.r, sanitySeconds: res.s, grabSeconds: res.g }
    },
    close: () => session.close(),
  }
  return src
}

export interface Pixels { width: number; height: number; channels: number; data: Uint8Array }

export function decodePng(buf: Buffer): Pixels {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not a png')
  let off = 8
  let width = 0
  let height = 0
  let depth = 0
  let ctype = 0
  let interlace = 0
  const idat: Buffer[] = []
  while (off < buf.length) {
    const len = buf.readUInt32BE(off)
    const type = buf.toString('ascii', off + 4, off + 8)
    const body = buf.subarray(off + 8, off + 8 + len)
    if (type === 'IHDR') {
      width = body.readUInt32BE(0)
      height = body.readUInt32BE(4)
      depth = body[8]!
      ctype = body[9]!
      interlace = body[12]!
    } else if (type === 'IDAT') idat.push(body)
    else if (type === 'IEND') break
    off += 12 + len
  }
  const channels = ({ 0: 1, 2: 3, 4: 2, 6: 4 } as Record<number, number>)[ctype]
  if (depth !== 8 || !channels || interlace !== 0) throw new Error('unsupported png: depth ' + depth + ' type ' + ctype + ' interlace ' + interlace)
  const raw = inflateSync(Buffer.concat(idat))
  const stride = width * channels
  const out = new Uint8Array(stride * height)
  for (let y = 0; y < height; y++) {
    const ft = raw[y * (stride + 1)]!
    const src = y * (stride + 1) + 1
    const dst = y * stride
    for (let x = 0; x < stride; x++) {
      const v = raw[src + x]!
      const a = x >= channels ? out[dst + x - channels]! : 0
      const b = y > 0 ? out[dst - stride + x]! : 0
      const c = y > 0 && x >= channels ? out[dst - stride + x - channels]! : 0
      let p = 0
      if (ft === 1) p = a
      else if (ft === 2) p = b
      else if (ft === 3) p = (a + b) >> 1
      else if (ft === 4) {
        const q = a + b - c
        const pa = Math.abs(q - a)
        const pb = Math.abs(q - b)
        const pc = Math.abs(q - c)
        p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c
      }
      out[dst + x] = (v + p) & 255
    }
  }
  return { width, height, channels, data: out }
}
