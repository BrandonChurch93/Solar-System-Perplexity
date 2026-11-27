import { chromium, type Browser, type Page } from 'playwright-core'
import { createServer, type Server } from 'node:http'
import { createReadStream, existsSync, statSync } from 'node:fs'
import { extname, join, normalize } from 'node:path'
import { homedir } from 'node:os'

export const CHROME = process.env.SHOWCASE_CHROME ?? join(homedir(), '.cache/ms-playwright/chromium-1217/chrome-linux64/chrome')
export const CHROME_FLAGS = ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--disable-dev-shm-usage', '--js-flags=--max-old-space-size=4096']

const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.bin': 'application/octet-stream', '.raw': 'application/octet-stream', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
}

export function serve(root: string, prefix = ''): Promise<{ server: Server; url: string }> {
  return new Promise((resolve) => {
    const server = createServer((req, res) => {
      let path = decodeURIComponent((req.url ?? '/').split('?')[0]!)
      if (prefix) {
        if (!path.startsWith(prefix)) {
          res.writeHead(404).end()
          return
        }
        path = path.slice(prefix.length) || '/'
      }
      if (path.endsWith('/')) path += 'index.html'
      const file = join(root, normalize(path))
      if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404).end()
        return
      }
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'content-length': statSync(file).size, 'cache-control': 'no-store' })
      createReadStream(file).pipe(res)
    })
    server.listen(0, '127.0.0.1', () => {
      const a = server.address()
      const port = typeof a === 'object' && a ? a.port : 0
      resolve({ server, url: 'http://127.0.0.1:' + port + prefix + '/' })
    })
  })
}

export interface Session { browser: Browser; page: Page; url: string; close(): Promise<void>; browserVersion: string }

export class RenderFault extends Error {}

const FAULTS = new WeakMap<Page, string[]>()
const FAULT_TEXT = /THREE\.WebGLState:|THREE\.WebGLProgram: Shader Error|Context Lost|CONTEXT_LOST_WEBGL/

export function pageFaults(page: Page): string[] {
  return FAULTS.get(page) ?? []
}

export async function pageFault(page: Page): Promise<string> {
  const seen = pageFaults(page)
  if (seen.length) return seen[0]!
  const lost = await page.evaluate(() => {
    const c = document.querySelector('canvas')
    const gl = c ? ((c.getContext('webgl2') ?? c.getContext('webgl')) as WebGLRenderingContext | null) : null
    return ((window as unknown as { __glLost?: number }).__glLost ?? 0) > 0 || !gl || gl.isContextLost()
  })
  return lost ? 'the WebGL context was lost' : ''
}

export async function openCapture(opts: { dist: string; format: string; assets: string; diag?: string; prefix?: string; mode?: string; query?: string }): Promise<Session> {
  const { server, url } = await serve(opts.dist, opts.prefix ?? '')
  const browser = await chromium.launch({ executablePath: CHROME, headless: true, args: CHROME_FLAGS })
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } })
  page.on('pageerror', (e) => console.error('[page error]', e.message))
  const faults: string[] = []
  FAULTS.set(page, faults)
  await page.addInitScript(() => {
    window.addEventListener('webglcontextlost', () => {
      const w = window as unknown as { __glLost?: number }
      w.__glLost = (w.__glLost ?? 0) + 1
    }, true)
  })
  page.on('console', (m) => {
    const text = m.text()
    if (m.type() === 'error') console.error('[page console]', text)
    if (FAULT_TEXT.test(text)) faults.push(text.split('\n')[0]!.slice(0, 200))
  })
  const q = '?mode=' + (opts.mode ?? 'capture') + '&format=' + opts.format + '&assets=' + opts.assets + (opts.diag ? '&diag=' + opts.diag : '') + (opts.query ?? '') + (process.env.GT_HALF === '1' ? '&rate=2&shutter=360' : '')
  await page.goto(url + q)
  await page.waitForFunction(() => 'showcase' in window, undefined, { timeout: 120000 })
  await page.evaluate(() => (window as unknown as { showcase: { ready: Promise<void> } }).showcase.ready)
  return {
    browser,
    page,
    url,
    browserVersion: browser.version(),
    close: async () => {
      await browser.close()
      server.close()
    },
  }
}

export async function renderPng(page: Page, frame: number, tier: string): Promise<{ png: Buffer; seconds: number; samples: number }> {
  const t0 = Date.now()
  const [b64, samples] = await page.evaluate(async ([f, t]) => {
    const s = (window as unknown as { showcase: { renderFrame(f: number, t: string): Promise<void>; png(): Promise<string>; samples(): number } }).showcase
    await s.renderFrame(f as number, t as string)
    return [await s.png(), s.samples()] as const
  }, [frame, tier] as const)
  const fault = await pageFault(page)
  if (fault) throw new RenderFault('frame ' + frame + ' is not usable: ' + fault)
  return { png: Buffer.from(b64, 'base64'), seconds: (Date.now() - t0) / 1000, samples }
}

export async function renderPngFresh(open: () => Promise<Session>, held: { session?: Session }, frame: number, tier: string, tries = 3): Promise<{ png: Buffer; seconds: number; samples: number }> {
  for (let attempt = 1; ; attempt++) {
    held.session ??= await open()
    try {
      return await renderPng(held.session.page, frame, tier)
    } catch (e) {
      await held.session.close().catch(() => undefined)
      held.session = undefined
      if (attempt >= tries) throw e
      console.error('[render] ' + String(e).split('\n')[0]!.slice(0, 240) + '. Fresh page, try ' + (attempt + 1) + ' of ' + tries)
    }
  }
}
