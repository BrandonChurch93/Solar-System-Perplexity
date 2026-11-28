import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream, createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createServer, type Server } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { chromium, type Browser, type Page } from 'playwright-core'
import { DIST, ROOT, WORK, args, ensureBuild, formatId, freeGb, loadConfig, machineId } from './lib/common'
import { FFMPEG, FFPROBE, concatCopy, probeVideo, rgbToYuvFilter } from './lib/encode'
import { needs } from '../src/core/caps'
import { chunksOf, clock, frameName, rangeOf, under, wholePng, type Chunk, type Limits } from './capture/plan'

// The capture of the film on a machine with a graphics card (kit/PROGRESS.md, second review note of 2026-11-23, plan H).
//   npm run capture -- [--stop ID] [--from K] [--to K] [--format uhd] [--rate 2] [--tier final] [--out DIR]
//                      [--chunk 600] [--keep-frames] [--keep-parts] [--no-join] [--crf 12] [--browser chrome|PATH] [--headless] [--allow-software] [--ignore-limits]
//                      [--shutter 360] [--expect-gpu WORDS] [--frames K,K,...] [--frame-timeout 3600] [--angle NAME]
// Opens the built app in the installed browser, steps every capture frame with showcase.renderFrame(k, tier) (after showcase.ahead when the page
// has it: the loads and the warm start, all of them at the first frame of a page) and saves it as a PNG named by its number. A run that was stopped goes on where it stopped: frames whose file is whole and chunks whose part is whole are skipped.
// With ffmpeg, every chunk of frames that is whole is encoded to a part at near lossless quality, the part is checked and the PNGs of that
// chunk are removed (--keep-frames keeps them); at the end the parts are joined to one MP4 at fps times rate. A manifest lies beside the film.
// --from and --to count capture frames (film frame times rate), both counted in. The limits of the machine's graphics are printed and written to
// the manifest; the run stops when one is under what the film needs at the format (src/core/caps.ts and smooth.machine in the config).
// --shutter is the open time of the camera in degrees of one capture frame. Left out, it is the film's own open time: film.shutterDegrees times
// the rate (360 at rate 2), so that every second frame of a rate 2 capture is the frame of the film at its own rate, with the same blur.
// --expect-gpu WORDS stops the run when the name of the graphics the browser draws on does not hold these words (for example "RTX 5080").
// --frames K,K,... draws only these capture frames and keeps them as PNG files (no parts, no film); the manifest then holds the time of each.
// --frame-timeout SECONDS closes the page when one frame takes longer and tries it again on a fresh page (0 is no limit, the value with --allow-software).
// --angle NAME passes --use-angle=NAME to the browser (d3d11, gl, vulkan, metal), for a machine where the browser's own choice does not draw.

const TYPES: Record<string, string> = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.mp4': 'video/mp4', '.bin': 'application/octet-stream', '.raw': 'application/octet-stream', '.svg': 'image/svg+xml', '.wasm': 'application/wasm',
}

function fail(text: string): never {
  console.error('capture: ' + text)
  process.exit(2)
}

const cfg = loadConfig()
const a = args()
const whole = (name: string, fallback: number | undefined): number | undefined => {
  if (a[name] === undefined) return fallback
  const v = Number(a[name])
  if (!Number.isInteger(v) || v < 0) fail('--' + name + ' is a whole number, 0 or more')
  return v
}
const format = formatId(cfg, a.format ?? 'uhd')
const size = cfg.formats[format]!
const rate = whole('rate', 2)!
if (rate < 1) fail('--rate is at least 1')
const filmShutter: number = cfg.raw.film.shutterDegrees
const shutter = whole('shutter', Math.min(360, filmShutter * rate))!
if (shutter > 360) fail('--shutter is 0 to 360 degrees')
const shutterQuery = rate > 1 || a.shutter !== undefined ? '&shutter=' + shutter : ''
const frameTimeout = whole('frame-timeout', a['allow-software'] === 'true' ? 0 : 3600)!
const tier = a.tier ?? 'final'
if (!Object.hasOwn(cfg.tiers, tier)) fail('--tier is one of ' + Object.keys(cfg.tiers).join(', '))
if (a.stop && !cfg.segments.some((s) => s.stop === a.stop)) fail('--stop is one of ' + [...new Set(cfg.segments.map((s) => s.stop))].join(', '))
const chunkSize = whole('chunk', 600)!
const keepFrames = a['keep-frames'] === 'true' || a.frames !== undefined
const join_ = a['no-join'] !== 'true' && a.frames === undefined
const crf = whole('crf', 12)!
const out = resolve(a.out ?? join(WORK, 'capture', format + '-r' + rate + '-' + tier + (a.stop ? '-' + a.stop : '')))
const frameDir = join(out, 'frames')
const partDir = join(out, 'parts')
const fps = cfg.fps * rate
const captureFrames = cfg.frameCount * rate
const only: Set<number> | null = a.frames === undefined ? null : new Set(a.frames.split(',').map((t) => Number(t.trim())))
if (only) {
  if (only.size === 0 || [...only].some((k) => !Number.isInteger(k) || k < 0 || k >= captureFrames)) fail('--frames is a list of capture frames from 0 to ' + (captureFrames - 1) + ', with commas between them')
  if (a.stop || a.from !== undefined || a.to !== undefined) fail('--frames stands alone: leave out --stop, --from and --to')
}
const range = (() => {
  try {
    return rangeOf(captureFrames, rate, cfg.segments, a.stop, only ? Math.min(...only) : whole('from', undefined), only ? Math.max(...only) : whole('to', undefined))
  } catch (e) {
    return fail((e as Error).message)
  }
})()
const span = range.to - range.from + 1
const total = only ? only.size : span
const filmFile = join(out, a.name ?? 'grand-tour-' + format + '-' + fps + 'fps' + (a.stop ? '-' + a.stop : '') + (total === captureFrames ? '' : '-' + range.from + '-' + range.to) + '.mp4')
const manifestFile = join(out, 'manifest.json')

const film = needs('full', format)
const wanted = {
  maxTextureSize: film.limits.MAX_TEXTURE_SIZE!, maxRenderbufferSize: film.limits.MAX_RENDERBUFFER_SIZE!, maxViewportDims: [size.width, size.height] as [number, number], pointSize: cfg.raw.smooth.machine.pointSize,
  samples: cfg.raw.smooth.machine.samples, maxTextureImageUnits: film.limits.MAX_TEXTURE_IMAGE_UNITS!, maxVertexAttribs: film.limits.MAX_VERTEX_ATTRIBS!,
}

const has = (bin: string): boolean => spawnSync(bin, ['-version'], { stdio: 'ignore' }).status === 0
const ffmpeg = has(FFMPEG) && has(FFPROBE)
const chunking = chunkSize > 0 && ffmpeg && !only
const chunks: Chunk[] = chunksOf(range, only ? span : chunkSize > 0 ? chunkSize : total)

interface PartNote { name: string; first: number; last: number; frames: number; bytes: number }
interface ShotNote { frame: number; seconds: number; render: number; bytes: number; warmed: number; firstOfPage: boolean }
interface Manifest {
  shutterDegrees: number; expectGpu: string | null; shots?: ShotNote[]
  film: string | null; complete: boolean; frames: number; from: number; to: number; format: string; width: number; height: number; fps: number; filmFps: number; rate: number; tier: string
  commit: string; engineHash: string; stopsHash?: string; browser: string; graphics: string; machineLimits: Limits | null; filmNeeds: typeof wanted; underNeeds: string[]; machine: string; secondsPerFrame: number | null; renderSecondsPerFrame: number | null; bytesPerFrame: number | null
  framesRendered: number; warmStart: boolean | null; warmDraws: number; framesKept: boolean; crf: number; chunk: number; parts: PartNote[]; started: string; updated: string; note?: string
}

function commit(): string {
  const r = spawnSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8' })
  if (r.status !== 0) return 'unknown'
  const dirty = spawnSync('git', ['status', '--porcelain', '--untracked-files=no', '--', 'src', 'tools', 'config', 'package.json', 'index.html'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim()
  return r.stdout.trim() + (dirty ? ' with changes that are not committed' : '')
}

function serve(root: string): Promise<{ server: Server; url: string }> {
  return new Promise((done) => {
    const server = createServer((req, res) => {
      const path = decodeURIComponent((req.url ?? '/').split('?')[0]!)
      const save = /^\/__frame\/(\d+)$/.exec(path)
      if (req.method === 'POST' && save) {
        const file = join(frameDir, frameName(Number(save[1])))
        const temp = file + '.part'
        const w = createWriteStream(temp)
        req.pipe(w)
        w.on('finish', () => {
          if (wholePng(temp, size.width, size.height)) {
            renameSync(temp, file)
            res.writeHead(200).end('ok')
          } else {
            rmSync(temp, { force: true })
            res.writeHead(422).end('the picture is not a whole PNG of ' + size.width + ' by ' + size.height)
          }
        })
        w.on('error', () => res.writeHead(500).end('the frame could not be written'))
        return
      }
      const file = join(root, normalize(path.endsWith('/') ? path + 'index.html' : path))
      if (!file.startsWith(root) || !existsSync(file) || statSync(file).isDirectory()) {
        res.writeHead(404).end()
        return
      }
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'content-length': statSync(file).size, 'cache-control': 'no-store' })
      createReadStream(file).pipe(res)
    })
    server.listen(0, '127.0.0.1', () => {
      const at = server.address()
      done({ server, url: 'http://127.0.0.1:' + (typeof at === 'object' && at ? at.port : 0) + '/' })
    })
  })
}

interface PageInfo { frameCount: number; fps: number; format: string; engineHash: string; rate?: number; captureFrames?: number; shutterDegrees?: number }
interface Open { browser: Browser; page: Page; info: PageInfo; limits: Limits; version: string; warm: boolean; fresh: boolean }

async function openPage(url: string): Promise<Open> {
  const name = a.browser ?? 'chrome'
  const own = name.includes('/') || name.includes('\\')
  const flags = ['--ignore-gpu-blocklist', '--disable-gpu-watchdog', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--disable-backgrounding-occluded-windows', '--js-flags=--max-old-space-size=8192']
  if (process.platform === 'darwin' || process.platform === 'win32') flags.push('--force_high_performance_gpu')
  if (a.angle && a.angle !== 'true') flags.push('--use-angle=' + a.angle)
  if (process.platform === 'linux') flags.push('--no-sandbox', '--disable-dev-shm-usage')
  if (a['allow-software'] === 'true') flags.push('--enable-unsafe-swiftshader')
  let browser: Browser
  try {
    browser = await chromium.launch({ ...(own ? { executablePath: name } : { channel: name }), headless: a.headless === 'true', args: flags, handleSIGINT: false })
  } catch (e) {
    return fail('the browser "' + name + '" did not start. Install Google Chrome, or name another one with --browser (chrome, msedge, or the path of a Chromium browser). ' + String(e).split('\n')[0])
  }
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 })
  page.on('pageerror', (e) => console.error('[page error] ' + e.message))
  // The first start can be slow (a busy machine, software drawing, or Direct3D building the drawing programs), so the page gets 15 minutes
  // to load and to start instead of the browser's own 30 seconds. A page that is really dead still ends here with a clear error.
  await page.goto(url + '?mode=capture&format=' + format + '&assets=full' + (rate > 1 ? '&rate=' + rate : '') + shutterQuery, { waitUntil: 'domcontentloaded', timeout: 900000 })
  await page.waitForFunction(() => 'showcase' in window, undefined, { timeout: 900000 })
  await page.evaluate(() => (window as unknown as { showcase: { ready: Promise<void> } }).showcase.ready)
  const info = await page.evaluate(() => (window as unknown as { showcase: { info(): PageInfo } }).showcase.info())
  const limits = await page.evaluate((names) => {
    const gl = document.querySelector('canvas')?.getContext('webgl2') ?? document.createElement('canvas').getContext('webgl2')
    if (!gl) return null
    const ext = gl.getExtension('WEBGL_debug_renderer_info')
    const view = gl.getParameter(gl.MAX_VIEWPORT_DIMS) as Int32Array
    const point = gl.getParameter(gl.ALIASED_POINT_SIZE_RANGE) as Float32Array
    return {
      renderer: String(ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER)), maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE) as number, maxRenderbufferSize: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE) as number,
      maxViewportDims: [view[0]!, view[1]!] as [number, number], aliasedPointSizeRange: [point[0]!, point[1]!] as [number, number], maxSamples: gl.getParameter(gl.MAX_SAMPLES) as number,
      maxTextureImageUnits: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) as number, maxVertexAttribs: gl.getParameter(gl.MAX_VERTEX_ATTRIBS) as number, missingExtensions: names.filter((n) => !gl.getExtension(n)),
    }
  }, film.extensions)
  if (!limits) {
    await browser.close()
    return fail('the browser has no WebGL 2. The film cannot be drawn in it.')
  }
  const warm = await page.evaluate(() => typeof (window as unknown as { showcase: { ahead?: unknown } }).showcase.ahead === 'function')
  return { browser, page, info, limits, version: browser.version(), warm, fresh: true }
}

interface Shot { seconds: number; render: number; bytes: number; warmed: number }

async function shoot(page: Page, k: number, warm: boolean, all: boolean): Promise<Shot> {
  const t0 = Date.now()
  const r = await page.evaluate(async ([frame, t, filmFrame, ahead, every]) => {
    const s = (window as unknown as { showcase: { renderFrame(f: number, t: string): Promise<void>; ahead?(f: number, t: string, all?: boolean): Promise<number> } }).showcase
    const warmed = ahead ? Number(await s.ahead!(filmFrame as number, t as string, every as boolean)) || 0 : 0
    const before = performance.now()
    await s.renderFrame(frame as number, t as string)
    const render = (performance.now() - before) / 1000
    const canvas = document.querySelector('canvas')
    if (!canvas) throw new Error('the page has no canvas')
    const gl = (canvas.getContext('webgl2') ?? canvas.getContext('webgl')) as WebGLRenderingContext | null
    if (gl && gl.isContextLost()) throw new Error('the graphics context was lost')
    const blob = await new Promise<Blob>((ok, no) => canvas.toBlob((b) => (b ? ok(b) : no(new Error('the canvas gave no picture'))), 'image/png'))
    const reply = await fetch('/__frame/' + frame, { method: 'POST', body: blob })
    if (!reply.ok) throw new Error('frame ' + frame + ' was not saved: ' + (await reply.text()))
    return { render, bytes: blob.size, warmed }
  }, [k, tier, k / rate, warm, all] as const)
  return { seconds: (Date.now() - t0) / 1000, render: r.render, bytes: r.bytes, warmed: r.warmed }
}

function timed<T>(p: Promise<T>, k: number): Promise<T> {
  if (frameTimeout <= 0) return p
  let timer: ReturnType<typeof setTimeout> | undefined
  const late = new Promise<never>((_, no) => {
    timer = setTimeout(() => no(new Error('frame ' + k + ' took longer than ' + frameTimeout + ' s (--frame-timeout)')), frameTimeout * 1000)
  })
  return Promise.race([p, late]).finally(() => clearTimeout(timer))
}

function encodePart(c: Chunk): PartNote {
  mkdirSync(partDir, { recursive: true })
  const file = join(partDir, c.name)
  const temp = file + '.tmp.mp4'
  const r = spawnSync(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-framerate', String(fps), '-start_number', String(c.first), '-i', join(frameDir, '%06d.png'), '-frames:v', String(c.frames),
    '-vf', rgbToYuvFilter(), '-c:v', 'libx264', '-preset', 'medium', '-profile:v', 'high', '-crf', String(crf), '-g', String(fps), '-keyint_min', String(fps), '-sc_threshold', '0', '-flags', '+cgop',
    '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv', '-r', String(fps), '-fps_mode', 'cfr', '-video_track_timescale', String(fps * 512), '-an', temp,
  ], { encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.status !== 0) throw new Error('the part ' + c.name + ' could not be encoded: ' + (r.stderr ?? '').slice(-600))
  const p = probeVideo(temp)
  if (!p || p.frames !== c.frames || p.width !== size.width || p.height !== size.height) {
    rmSync(temp, { force: true })
    throw new Error('the part ' + c.name + ' is not whole: ' + (p ? p.frames + ' frames of ' + p.width + ' by ' + p.height : 'unreadable') + ', wanted ' + c.frames + ' of ' + size.width + ' by ' + size.height)
  }
  renameSync(temp, file)
  return { name: c.name, first: c.first, last: c.last, frames: c.frames, bytes: statSync(file).size }
}

function wholePart(c: Chunk, known: PartNote[]): PartNote | null {
  const file = join(partDir, c.name)
  if (!existsSync(file)) return null
  const bytes = statSync(file).size
  const note = known.find((p) => p.name === c.name && p.frames === c.frames && p.bytes === bytes)
  if (note) return note
  const p = probeVideo(file)
  return p && p.frames === c.frames && p.width === size.width && p.height === size.height ? { name: c.name, first: c.first, last: c.last, frames: c.frames, bytes } : null
}

async function main(): Promise<void> {
  mkdirSync(frameDir, { recursive: true })
  console.log('capture: ' + total + ' frames (' + range.from + ' to ' + range.to + ') of ' + size.width + ' by ' + size.height + ' at ' + fps + ' frames a second, tier ' + tier + ', into ' + out)
  if (!ffmpeg) console.log('capture: ffmpeg is not installed. The frames are kept as PNG files and no film is made. Install it (on a Mac: brew install ffmpeg) and run the same command again: it goes on from the frames that are there.')
  const hashes = ensureBuild()
  const old: Partial<Manifest> = existsSync(manifestFile) ? (JSON.parse(readFileSync(manifestFile, 'utf8')) as Partial<Manifest>) : {}
  if (old.format && (old.format !== format || old.rate !== rate || old.tier !== tier) && a.mixed !== 'true') fail('the folder ' + out + ' holds a capture of format ' + old.format + ', rate ' + old.rate + ', tier ' + old.tier + '. Name another folder with --out.')
  // The engine hash leaves the code of the nine stops out, so a cure inside a stop needs its own check: frames drawn before it are another picture.
  const stopsHash = createHash('sha256').update(JSON.stringify(Object.entries(hashes.stops).sort())).digest('hex').slice(0, 16)
  const oldDrawn = (old.framesRendered ?? 0) > 0 || (old.parts ?? []).length > 0
  if (oldDrawn && old.stopsHash !== stopsHash && a.mixed !== 'true') fail('the folder ' + out + ' holds frames drawn before a change to the code of a stop (stops ' + (old.stopsHash ?? 'not recorded, so drawn by an older tool') + ', now ' + stopsHash + '). Name another folder with --out, or remove the folder, or pass --mixed if the Builder wrote that the frames that are there stay good.')
  if (old.complete && old.film && old.from === range.from && old.to === range.to && old.engineHash === hashes.engine && existsSync(old.film)) {
    console.log('capture: the film is already there: ' + old.film + '. Remove the folder ' + out + ' to capture it again.')
    return
  }
  const oldShutter = old.format ? (old.shutterDegrees ?? filmShutter) : undefined
  if (oldShutter !== undefined && oldShutter !== shutter && a.mixed !== 'true') fail('the folder ' + out + ' holds frames drawn with the shutter open for ' + oldShutter + ' degrees of a capture frame, this run asks for ' + shutter + '. Name another folder with --out, or remove that one.')
  if (old.engineHash && old.engineHash !== hashes.engine && a.mixed !== 'true') fail('the folder ' + out + ' holds frames of another state of the film (engine ' + old.engineHash + ', now ' + hashes.engine + '). Name another folder with --out, or remove this one, or pass --mixed to go on in it.')
  const m: Manifest = {
    stopsHash, shutterDegrees: shutter, expectGpu: a['expect-gpu'] !== undefined && a['expect-gpu'] !== 'true' ? a['expect-gpu'] : null, ...(only ? { shots: (old.shots ?? []).filter((t) => only.has(t.frame)) } : {}),
    film: null, complete: false, frames: total, from: range.from, to: range.to, format, width: size.width, height: size.height, fps, filmFps: cfg.fps, rate, tier, commit: commit(), engineHash: hashes.engine,
    browser: old.browser ?? '', graphics: old.graphics ?? '', machineLimits: old.machineLimits ?? null, filmNeeds: wanted, underNeeds: [], machine: machineId(), secondsPerFrame: old.secondsPerFrame ?? null, renderSecondsPerFrame: old.renderSecondsPerFrame ?? null, bytesPerFrame: old.bytesPerFrame ?? null,
    framesRendered: old.framesRendered ?? 0, warmStart: old.warmStart ?? null, warmDraws: old.warmDraws ?? 0, framesKept: keepFrames || !chunking, crf, chunk: chunking ? chunkSize : 0, parts: (old.parts ?? []).filter((p) => chunks.some((c) => c.name === p.name)), started: old.started ?? new Date().toISOString(), updated: new Date().toISOString(),
  }
  let spent = (old.secondsPerFrame ?? 0) * (old.framesRendered ?? 0)
  let renderSpent = (old.renderSecondsPerFrame ?? 0) * (old.framesRendered ?? 0)
  let byteSum = (old.bytesPerFrame ?? 0) * (old.framesRendered ?? 0)
  const write = (): void => {
    m.updated = new Date().toISOString()
    m.secondsPerFrame = m.framesRendered > 0 ? Number((spent / m.framesRendered).toFixed(3)) : null
    m.renderSecondsPerFrame = m.framesRendered > 0 ? Number((renderSpent / m.framesRendered).toFixed(3)) : null
    m.bytesPerFrame = m.framesRendered > 0 ? Math.round(byteSum / m.framesRendered) : null
    writeFileSync(manifestFile, JSON.stringify(m, null, 2) + '\n')
  }

  const todo: { chunk: Chunk; frames: number[] }[] = []
  let left = 0
  for (const c of chunks) {
    const part = chunking ? wholePart(c, m.parts) : null
    if (part) {
      if (!m.parts.some((p) => p.name === part.name)) m.parts.push(part)
      continue
    }
    m.parts = m.parts.filter((p) => p.name !== c.name)
    const frames: number[] = []
    for (let k = c.first; k <= c.last; k++) if ((!only || only.has(k)) && !wholePng(join(frameDir, frameName(k)), size.width, size.height)) frames.push(k)
    left += frames.length
    todo.push({ chunk: c, frames })
  }
  write()
  console.log('capture: ' + (total - left) + ' of ' + total + ' frames are already there, ' + left + ' to render' + (chunking ? ', in chunks of ' + chunkSize : '') + '.')

  let open: Open | null = null
  let server: Server | null = null
  let stopped = false
  process.on('SIGINT', () => {
    if (stopped) process.exit(130)
    stopped = true
    console.log('\ncapture: stopping after this frame. Run the same command again to go on.')
  })
  const close = async (): Promise<void> => {
    await open?.browser.close().catch(() => undefined)
    open = null
    server?.close()
    server = null
  }
  const ready = async (): Promise<Open> => {
    if (open) return open
    const s = await serve(DIST)
    server = s.server
    const o = await openPage(s.url)
    open = o
    if (o.info.format !== format) {
      await close()
      fail('the page runs format ' + o.info.format + ', not ' + format)
    }
    if ((o.info.rate ?? 1) !== rate) {
      await close()
      fail('this build of the film has no capture rate ' + rate + ' (the page reports ' + (o.info.rate ?? 'none') + '). Update the code, or pass --rate 1 for the film at ' + cfg.fps + ' frames a second.')
    }
    if (shutterQuery && o.info.shutterDegrees !== shutter) {
      await close()
      fail('the page holds the shutter open for ' + (o.info.shutterDegrees ?? 'an unknown number of') + ' degrees, the tool asked for ' + shutter + '. Update the code.')
    }
    if ((o.info.captureFrames ?? o.info.frameCount * (o.info.rate ?? 1)) !== captureFrames) {
      await close()
      fail('the page counts ' + (o.info.captureFrames ?? o.info.frameCount) + ' frames, the tool ' + captureFrames)
    }
    const g = o.limits
    // The same film comes out differently under Direct3D, OpenGL and Vulkan (report of the RTX 5080, 2026-11-27), so frames of two do not go into one film without a word.
    if (old.graphics && old.graphics !== g.renderer && (total - left > 0 || m.parts.length > 0) && a.mixed !== 'true') {
      await close()
      fail('the folder ' + out + ' holds frames drawn on "' + old.graphics + '", and this run draws on "' + g.renderer + '". Frames of two graphics do not go into one film. Name another folder with --out, or remove the folder, or pass --mixed if both are meant to be joined.')
    }
    if (m.graphics !== g.renderer || m.browser !== o.version) {
      console.log('capture: browser ' + o.version)
      console.log('capture: this machine: ' + g.renderer + '; largest texture ' + g.maxTextureSize + ', largest render buffer ' + g.maxRenderbufferSize + ', largest viewport ' + g.maxViewportDims.join(' by ') + ', point sizes ' + g.aliasedPointSizeRange.join(' to ') + ', ' + g.maxSamples + ' samples.')
    }
    m.browser = o.version
    m.graphics = g.renderer
    m.machineLimits = g
    m.underNeeds = under(g, wanted)
    if (m.underNeeds.length > 0 && a['ignore-limits'] !== 'true') {
      await close()
      write()
      fail('this machine cannot draw the film at ' + format + ' (' + size.width + ' by ' + size.height + '): ' + m.underNeeds.join('; ') + '. Tell the Builder these lines. To run anyway pass --ignore-limits; the film may then differ from the one the machines draw.')
    }
    if (m.underNeeds.length > 0) console.log('capture: WARNING, --ignore-limits: ' + m.underNeeds.join('; ') + '.')
    if (/swiftshader|llvmpipe|software|basic render/i.test(g.renderer) && a['allow-software'] !== 'true') {
      await close()
      fail('the browser draws without the graphics card (' + g.renderer + '). In Chrome open Settings, System, switch on "Use graphics acceleration when available" and start Chrome again; chrome://gpu shows what it uses. To run like this anyway pass --allow-software.')
    }
    const expect = m.expectGpu
    if (expect !== null && !g.renderer.toLowerCase().includes(expect.toLowerCase())) {
      await close()
      write()
      fail('the browser draws on "' + g.renderer + '", and that name does not hold "' + expect + '" (--expect-gpu). The run is stopped so that no frame is drawn on other graphics than the named card. On Windows: Settings, System, Display, Graphics, add Google Chrome and choose High performance; plug the screen into the graphics card and not into the mainboard; start the run again. chrome://gpu shows what Chrome uses.')
    }
    return o
  }

  let done = total - left
  let sinceStart = 0
  const startedAt = Date.now()
  try {
    for (const { chunk, frames } of todo) {
      for (const k of frames) {
        if (stopped) break
        for (let attempt = 1; ; attempt++) {
          try {
            const o = await ready()
            const shot = await timed(shoot(o.page, k, o.warm, o.fresh), k)
            if (only) m.shots = [...(m.shots ?? []).filter((t) => t.frame !== k), { frame: k, seconds: Number(shot.seconds.toFixed(3)), render: Number(shot.render.toFixed(3)), bytes: shot.bytes, warmed: shot.warmed, firstOfPage: o.fresh }]
            o.fresh = false
            m.warmStart = o.warm
            m.warmDraws += shot.warmed
            spent += shot.seconds
            renderSpent += shot.render
            byteSum += shot.bytes
            m.framesRendered++
            done++
            sinceStart++
            if (sinceStart === 1) {
              const perChunk = chunking && !keepFrames ? Math.min(chunkSize, total) : left
              console.log('capture: the first frame took ' + shot.seconds.toFixed(1) + ' s (' + shot.render.toFixed(1) + ' s to render) and is ' + (shot.bytes / 1e6).toFixed(1) + ' MB. At that pace ' + left + ' frames take about ' + clock(shot.seconds * left) + ' and the frames on disk at one time about ' + ((shot.bytes * perChunk) / 1e9).toFixed(1) + ' GB; ' + freeGb(out).toFixed(0) + ' GB are free.')
              if ((shot.bytes * perChunk) / 1e9 > freeGb(out)) console.log('capture: WARNING: that is more than the free disk. Use a smaller --chunk, or another disk with --out.')
            }
            if (sinceStart % 10 === 0 || done === total || only) {
              const pace = (Date.now() - startedAt) / 1000 / sinceStart
              console.log('capture: frame ' + k + ', ' + done + ' of ' + total + ', ' + pace.toFixed(1) + ' s a frame, about ' + clock(pace * (total - done)) + ' left')
              write()
            }
            break
          } catch (e) {
            await close()
            if (stopped) break
            if (attempt >= 3) throw e
            console.error('capture: frame ' + k + ' failed (' + String(e).split('\n')[0]!.slice(0, 200) + '). A fresh page, try ' + (attempt + 1) + ' of 3.')
          }
        }
        if (freeGb(out) < 1) {
          stopped = true
          console.log('capture: less than 1 GB of disk is free. Stopping; free some space and run the same command again.')
        }
      }
      if (stopped) break
      if (chunking) {
        const note = encodePart(chunk)
        m.parts.push(note)
        if (!keepFrames) for (let k = chunk.first; k <= chunk.last; k++) rmSync(join(frameDir, frameName(k)), { force: true })
        console.log('capture: part ' + (chunk.index + 1) + ' of ' + chunks.length + ' is encoded and checked (' + note.frames + ' frames, ' + (note.bytes / 1e6).toFixed(0) + ' MB)' + (keepFrames ? '' : '; its PNG files are removed') + '.')
        write()
      }
    }
  } finally {
    await close()
    write()
  }
  if (stopped) {
    console.log('capture: stopped with ' + done + ' of ' + total + ' frames. Run the same command again to go on.')
    process.exit(130)
  }

  const missing: number[] = []
  if (chunking) {
    for (const c of chunks) if (!m.parts.some((p) => p.name === c.name && p.frames === c.frames)) missing.push(c.first)
    if (m.parts.reduce((n, p) => n + p.frames, 0) !== total) missing.push(-1)
  } else {
    for (let k = range.from; k <= range.to; k++) if ((!only || only.has(k)) && !wholePng(join(frameDir, frameName(k)), size.width, size.height)) missing.push(k)
  }
  if (missing.length > 0) {
    console.error('capture: the count is wrong: ' + missing.length + (chunking ? ' parts' : ' frames') + ' are missing or not whole (first ' + missing[0] + '). Run the same command again.')
    process.exit(1)
  }
  console.log('capture: all ' + total + ' frames are there, each ' + size.width + ' by ' + size.height + '.')
  if (!ffmpeg) {
    m.note = 'ffmpeg is not installed: the frames are PNG files in frames/, no film was made'
    write()
    console.log('capture: no film was made because ffmpeg is not installed. The frames are in ' + frameDir + '. Install ffmpeg and run the same command again.')
    return
  }
  if (!join_) {
    write()
    console.log('capture: --no-join was given. ' + (chunking ? 'The parts are in ' + partDir : 'The frames are in ' + frameDir) + '.')
    return
  }
  if (chunking) concatCopy(chunks.map((c) => join(partDir, c.name)), filmFile, true)
  else {
    const one = chunksOf(range, total)[0]!
    const note = encodePart(one)
    renameSync(join(partDir, note.name), filmFile)
  }
  const p = probeVideo(filmFile)
  if (!p || p.frames !== total || p.width !== size.width || p.height !== size.height || p.fps !== fps + '/1') {
    console.error('capture: the film is not right: ' + (p ? p.frames + ' frames of ' + p.width + ' by ' + p.height + ' at ' + p.fps : 'unreadable') + ', wanted ' + total + ' of ' + size.width + ' by ' + size.height + ' at ' + fps + '.')
    process.exit(1)
  }
  m.film = filmFile
  m.complete = true
  if (chunking && a['keep-parts'] !== 'true') {
    for (const c of chunks) rmSync(join(partDir, c.name), { force: true })
    m.parts = []
  }
  write()
  console.log('capture: the film is ' + filmFile + ' (' + p.frames + ' frames, ' + p.durationSeconds.toFixed(2) + ' s, ' + (statSync(filmFile).size / 1e6).toFixed(0) + ' MB). The manifest is ' + manifestFile + '.')
}

void main().catch((e) => {
  console.error('capture: ' + String(e instanceof Error ? e.message : e))
  process.exit(1)
})
