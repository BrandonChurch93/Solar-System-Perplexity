// The short test before a capture on your own machine. It draws a few single frames and never the film.
//
//   node node_modules/tsx/dist/cli.mjs tools/capture-check.ts --expect-gpu "RTX 5080"
//
//   --expect-gpu WORDS   words the name of the graphics must hold; the test stops when the browser draws on anything else
//   --tests LIST         which draw tests run: preview, master, uhd (default: all three, in this order)
//   --limit N            only the first N frames of each draw test
//   --out DIR            where the test writes (default out/work/capture-check)
//   --browser, --headless, --angle, --allow-software, --ignore-limits, --frame-timeout   handed on to tools/capture.ts
//   --keep-frames   uses frames an earlier run left in the test folders again; for trying out this tool only, the verdict then cannot be PASS
//
// What it does, in order:
//   1. reads the machine (system, processor, memory, free disk, Node, git commit) and stops inside WSL;
//   2. proves that the code is the approved build (engine hash) and that every handoff file has its recorded sha256;
//   3. proves that ffmpeg has libx264 and can read the see through subtitle strip (the libvpx-vp9 decoder);
//   4. draws the test frames of handoff/local-render/facts.json through tools/capture.ts, so the film's own checks run
//      (the graphics by name, the machine limits, the engine hash of the page), and watches the NVIDIA card while it draws;
//   5. compares every frame with its reference from the approved film (PSNR and SSIM), writes side by side pictures,
//      measures how much fine detail the 4K frames hold, and works out the hours and the disk the whole film needs;
//   6. writes REPORT.md and report.json and ends with one line: VERDICT: PASS, LOOK or STOP.
//
// Exit code: 0 for PASS and LOOK, 1 for STOP.

import { execFile, spawn, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { arch, cpus, hostname, platform, release, totalmem } from 'node:os'
import { join, resolve } from 'node:path'
import { ROOT, WORK, args, formatId, freeGb, loadConfig } from './lib/common'
import { FFMPEG, FFPROBE } from './lib/encode'
import { HAND, ensureHandoffFiles, loadFacts } from './lib/handoff'
import { computeHashes } from './lib/hashes'

interface Shot { frame: number; seconds: number; render: number; bytes: number; warmed: number; firstOfPage: boolean }
interface Row { test: string; capture: number; film: number; odd: boolean; what: string; psnr: number | null; ssim: number | null; seconds: number | null; render: number | null; bytes: number | null; warmed: number | null; detail: number | null; side: string | null }
interface GpuNote { samples: number; maxUtil: number; maxMemoryMb: number }

const a = args()
const cfg = loadConfig()
const OUT = resolve(a.out ?? join(WORK, 'capture-check'))
const SIDE = join(OUT, 'side')
const TSX = join(ROOT, 'node_modules', 'tsx', 'dist', 'cli.mjs')
const stops: string[] = []
const looks: string[] = []
const keepFrames = a['keep-frames'] === 'true'
if (keepFrames) looks.push('--keep-frames was given: frames of an earlier run may have been used again, so this run does not count as the test of this machine.')
const lines: string[] = []
const say = (t = ''): void => {
  lines.push(t)
  console.log(t)
}

function run(bin: string, argv: string[], maxBuffer = 1 << 26): { status: number | null; out: string; err: string } {
  const r = spawnSync(bin, argv, { encoding: 'utf8', maxBuffer, cwd: ROOT })
  return { status: r.error ? null : r.status, out: r.stdout ?? '', err: (r.stderr ?? '') + (r.error ? String(r.error) : '') }
}

function readText(file: string): string {
  try {
    return readFileSync(file, 'utf8')
  } catch {
    return ''
  }
}

function finish(): never {
  const verdict = stops.length > 0 ? 'STOP' : looks.length > 0 ? 'LOOK' : 'PASS'
  say()
  say('## Verdict')
  say()
  if (stops.length > 0) {
    say('STOP. Do not start the film. Reasons:')
    for (const t of stops) say('- ' + t)
  }
  if (looks.length > 0) {
    say((stops.length > 0 ? 'Also to look at' : 'LOOK. Nothing forbids the run, but a person reads these first') + ':')
    for (const t of looks) say('- ' + t)
  }
  if (verdict === 'PASS') say('PASS. Every check held.')
  say()
  say('VERDICT: ' + verdict)
  mkdirSync(OUT, { recursive: true })
  writeFileSync(join(OUT, 'REPORT.md'), lines.join('\n') + '\n')
  writeFileSync(join(OUT, 'report.json'), JSON.stringify({ verdict, stops, looks, machine, tools, rows, estimate, gpu: gpuNotes, at: new Date().toISOString() }, null, 2) + '\n')
  console.log('capture-check: the report is ' + join(OUT, 'REPORT.md'))
  process.exit(verdict === 'STOP' ? 1 : 0)
}

const machine: Record<string, string | number | boolean | null> = {}
const tools: Record<string, string | number | boolean | null> = {}
const rows: Row[] = []
const estimate: Record<string, number | string | null> = {}
const gpuNotes: Record<string, GpuNote | null> = {}

// 1. the machine
say('# Capture check')
say()
say('Made by tools/capture-check.ts at ' + new Date().toISOString() + '. It drew single test frames and no film.')
say()
say('## Machine')
say()
const wsl = process.platform === 'linux' && (process.env.WSL_DISTRO_NAME !== undefined || /microsoft/i.test(readText('/proc/version')))
const cpu = cpus()
machine.system = platform() + ' ' + release() + ' ' + arch()
machine.host = hostname()
machine.processor = (cpu[0]?.model ?? 'unknown').trim()
machine.cores = cpu.length
machine.memoryGb = Number((totalmem() / 1e9).toFixed(1))
machine.freeDiskGb = Number(freeGb().toFixed(1))
machine.node = process.version
machine.wsl = wsl
const commit = run('git', ['rev-parse', 'HEAD'])
machine.commit = commit.status === 0 ? commit.out.trim() : null
const changed = run('git', ['status', '--porcelain', '--untracked-files=no'])
machine.trackedChanges = changed.status === 0 ? changed.out.split(/\r?\n/).filter((t) => t.trim() !== '').length : null
say('- System: ' + machine.system + (wsl ? ' (inside WSL)' : ''))
say('- Processor: ' + machine.processor + ', ' + machine.cores + ' threads')
say('- Memory: ' + machine.memoryGb + ' GB')
say('- Free disk here: ' + machine.freeDiskGb + ' GB')
say('- Node: ' + machine.node)
say('- Git commit: ' + (machine.commit ?? 'not read') + ', changed tracked files: ' + (machine.trackedChanges ?? 'not read'))
if (wsl) stops.push('this shell runs inside WSL, where the browser draws in software or through a translation layer. Run the same command in a native Windows shell (PowerShell or Git Bash) on a clone on the Windows disk.')
if (Number(process.versions.node.split('.')[0]) < 20) stops.push('Node ' + process.version + ' is older than 20. Install Node 20 or newer.')
if (machine.commit === null) stops.push('git did not answer here; the test must run inside the clone of the repo.')
if (typeof machine.trackedChanges === 'number' && machine.trackedChanges > 0) {
  stops.push(machine.trackedChanges + ' tracked files differ from the commit (git status). A clone for the film must be clean: make a fresh clone with "git clone -c core.autocrlf=false" and do not edit it.')
}
const nv = run('nvidia-smi', ['--query-gpu=name,driver_version,memory.total', '--format=csv,noheader'])
const hasNv = nv.status === 0 && nv.out.trim() !== ''
machine.nvidia = hasNv ? nv.out.trim().split(/\r?\n/).join(' | ') : null
say('- NVIDIA card by nvidia-smi: ' + (machine.nvidia ?? 'none found (nvidia-smi did not answer)'))

// 2. the code and the handoff files
say()
say('## Code and handoff files')
say()
const loaded = loadFacts()
if (!loaded) {
  stops.push('handoff/local-render/facts.json is missing. Pull the newest main of the repo.')
  finish()
}
const facts = loaded
const hashes = computeHashes(ROOT)
tools.engineHash = hashes.engine
say('- Engine hash: ' + hashes.engine + (hashes.engine === facts.engineHash ? ', the approved build' : ', NOT the approved ' + facts.engineHash))
if (hashes.engine !== facts.engineHash) {
  stops.push('the engine hash is ' + hashes.engine + ' and the approved film has ' + facts.engineHash + '. The files on this disk differ from the commit: most often git changed the line endings on Windows. Make a fresh clone with "git clone -c core.autocrlf=false", run "npm ci" and try again.')
}
const got = ensureHandoffFiles(facts)
for (const t of got.problems) stops.push(t)
tools.handoffFiles = facts.files.length
tools.handoffFilesFetched = got.fetched
tools.handoffFilesBad = got.problems.length
say('- Handoff files: ' + facts.files.length + ' proved by size and sha256' + (got.fetched > 0 ? ' (' + got.fetched + ' fetched from the branch ' + facts.assetsBranch + ' just now)' : '') + ', ' + got.problems.length + ' wrong')

// 3. ffmpeg
say()
say('## ffmpeg')
say()
const ffv = run(FFMPEG, ['-hide_banner', '-version'])
const fpv = run(FFPROBE, ['-hide_banner', '-version'])
tools.ffmpeg = ffv.status === 0 ? (ffv.out.split(/\r?\n/)[0] ?? '').trim() : null
say('- ffmpeg: ' + (tools.ffmpeg ?? 'not found'))
if (ffv.status !== 0 || fpv.status !== 0) {
  stops.push('ffmpeg or ffprobe did not start. Install a full build (Windows: "winget install Gyan.FFmpeg", then a new shell; Mac: "brew install ffmpeg").')
} else {
  const enc = run(FFMPEG, ['-hide_banner', '-encoders']).out
  const dec = run(FFMPEG, ['-hide_banner', '-decoders']).out
  tools.libx264 = /\blibx264\b/.test(enc)
  tools.libvpxVp9 = /\blibvpx-vp9\b/.test(dec)
  say('- libx264 encoder: ' + (tools.libx264 ? 'yes' : 'NO') + '; libvpx-vp9 decoder: ' + (tools.libvpxVp9 ? 'yes' : 'NO'))
  if (!tools.libx264) stops.push('this ffmpeg has no libx264 encoder. Install a full build.')
  if (!tools.libvpxVp9) stops.push('this ffmpeg has no libvpx-vp9 decoder, so it cannot read the see through part of the subtitle strip. Install a full build.')
  const band = join(HAND, facts.band.file)
  if (tools.libvpxVp9 && existsSync(band)) {
    const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-c:v', 'libvpx-vp9', '-ss', String(facts.band.probeSeconds), '-i', band, '-frames:v', '1', '-f', 'rawvideo', '-pix_fmt', 'rgba', '-'], { maxBuffer: 1 << 27 })
    const want = facts.band.width * facts.band.height * 4
    const buf = r.stdout
    if (r.status !== 0 || !buf || buf.length !== want) {
      stops.push('ffmpeg could not read a frame of the subtitle strip (' + (buf ? buf.length : 0) + ' bytes, ' + want + ' expected). ' + String(r.stderr ?? '').slice(-300))
    } else {
      let lo = 255
      let hi = 0
      for (let i = 3; i < buf.length; i += 4) {
        const v = buf[i]!
        if (v < lo) lo = v
        if (v > hi) hi = v
      }
      tools.bandAlphaMin = lo
      tools.bandAlphaMax = hi
      say('- Subtitle strip at ' + facts.band.probeSeconds + ' s: see through values from ' + lo + ' to ' + hi + (lo < 255 && hi > 0 ? ', alive' : ', DEAD'))
      if (!(lo < 255 && hi > 0)) stops.push('the see through part of the subtitle strip did not come through ffmpeg (values ' + lo + ' to ' + hi + '). Laid over like this the strip would cover the picture. Install a full ffmpeg build.')
    }
  }
}

if (stops.length > 0) finish()

// 4. the draw tests
const wantTests = (a.tests ?? 'preview,master,uhd').split(',').map((t) => t.trim()).filter((t) => t !== '')
const limit = a.limit === undefined ? Infinity : Number(a.limit)
const pass: string[] = []
for (const k of ['expect-gpu', 'browser', 'angle', 'frame-timeout']) if (a[k] !== undefined && a[k] !== 'true') pass.push('--' + k, a[k]!)
for (const k of ['headless', 'allow-software', 'ignore-limits']) if (a[k] === 'true') pass.push('--' + k)
if (a['expect-gpu'] === undefined && a['allow-software'] !== 'true') {
  stops.push('--expect-gpu is missing. Name the card the film must be drawn on, for example --expect-gpu "RTX 5080".')
  finish()
}

function sampleGpu(): Promise<{ util: number; memoryMb: number } | null> {
  return new Promise((done) => {
    execFile('nvidia-smi', ['--query-gpu=utilization.gpu,memory.used', '--format=csv,noheader,nounits'], { timeout: 5000 }, (err, stdout) => {
      if (err) return done(null)
      let util = 0
      let memoryMb = 0
      for (const line of String(stdout).trim().split(/\r?\n/)) {
        const [u, m] = line.split(',').map((t) => Number(t.trim()))
        if (u !== undefined && m !== undefined && Number.isFinite(u) && Number.isFinite(m)) {
          util = Math.max(util, u)
          memoryMb = Math.max(memoryMb, m)
        }
      }
      done({ util, memoryMb })
    })
  })
}

function draw(argv: string[]): Promise<{ code: number; gpu: GpuNote | null }> {
  return new Promise((done) => {
    const note: GpuNote = { samples: 0, maxUtil: 0, maxMemoryMb: 0 }
    const child = spawn(process.execPath, argv, { cwd: ROOT, stdio: 'inherit' })
    const timer = hasNv
      ? setInterval(() => {
          void sampleGpu().then((s) => {
            if (!s) return
            note.samples++
            note.maxUtil = Math.max(note.maxUtil, s.util)
            note.maxMemoryMb = Math.max(note.maxMemoryMb, s.memoryMb)
          })
        }, 2000)
      : null
    const end = (code: number): void => {
      if (timer) clearInterval(timer)
      done({ code, gpu: hasNv ? note : null })
    }
    child.on('exit', (code) => end(code ?? 1))
    child.on('error', () => end(1))
  })
}

function measure(local: string, ref: string, localW: number, refW: number, refH: number): { psnr: number | null; ssim: number | null } {
  const pre = '[0:v]' + (localW === refW ? '' : 'scale=' + refW + ':' + refH + ':flags=area,') + 'format=rgb24[x];[1:v]format=rgb24[y];[x][y]'
  const p = run(FFMPEG, ['-hide_banner', '-nostdin', '-i', local, '-i', ref, '-lavfi', pre + 'psnr', '-f', 'null', '-'])
  const mp = /average:([0-9.]+|inf)/.exec(p.err)
  const s = run(FFMPEG, ['-hide_banner', '-nostdin', '-i', local, '-i', ref, '-lavfi', pre + 'ssim', '-f', 'null', '-'])
  const ms = /All:([0-9.]+)/.exec(s.err)
  return { psnr: mp ? (mp[1] === 'inf' ? Infinity : Number(mp[1])) : null, ssim: ms ? Number(ms[1]) : null }
}

// How much of a frame is lost when it is made half as large and large again: the root mean square of the loss in 8 bit levels.
// A frame with fine detail loses a lot; a frame that is only a smooth enlargement of a smaller picture loses next to nothing.
function fineDetail(local: string): number | null {
  const p = run(FFMPEG, ['-hide_banner', '-nostdin', '-i', local, '-lavfi', '[0:v]format=rgb24,split[a][b];[b]scale=iw/2:ih/2:flags=area,scale=iw*2:ih*2:flags=bicubic[c];[a][c]psnr', '-f', 'null', '-'])
  const m = /average:([0-9.]+|inf)/.exec(p.err)
  if (!m) return null
  return m[1] === 'inf' ? 0 : Number((255 / Math.pow(10, Number(m[1]) / 20)).toFixed(3))
}

function sideBySide(local: string, ref: string, out: string, big: boolean): boolean {
  const whole = '[0:v]scale=960:540:flags=area,format=rgb24[a];[1:v]scale=960:540:flags=area,format=rgb24[b];[a][b]hstack=inputs=2[w]'
  const fc = big
    ? whole + ';[0:v]crop=480:270:(iw-480)/2:(ih-270)/2,scale=960:540:flags=bicubic,format=rgb24[c];[1:v]crop=960:540:(iw-960)/2:(ih-540)/2,format=rgb24[d];[c][d]hstack=inputs=2[z];[w][z]vstack=inputs=2[v]'
    : whole.replace('[w]', '[v]')
  const r = run(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-y', '-i', ref, '-i', local, '-filter_complex', fc, '-map', '[v]', '-frames:v', '1', '-update', '1', '-q:v', '3', out])
  return r.status === 0 && existsSync(out)
}

const frameName = (k: number): string => String(k).padStart(6, '0') + '.png'
let renderer: string | null = null
let browserName: string | null = null

for (const id of wantTests) {
  const t = facts.tests.find((x) => x.id === id)
  if (!t) {
    looks.push('the draw test "' + id + '" is not in facts.json and was left out.')
    continue
  }
  const size = cfg.formats[formatId(cfg, t.format)]
  if (!size) {
    stops.push('the format ' + t.format + ' of the draw test ' + id + ' is not in config/showcase.json.')
    break
  }
  const frames = t.frames.slice(0, Math.min(t.frames.length, limit))
  const dir = join(OUT, id)
  say()
  say('## Draw test ' + id + ': ' + frames.length + ' frames at ' + size.width + ' by ' + size.height)
  say()
  console.log('capture-check: drawing ' + frames.length + ' frames at ' + size.width + ' by ' + size.height + ' through tools/capture.ts ...')
  // A test stands for this machine and this state of the film: frames an earlier run left in the folder (drawn on another backend, or before a cure) are removed first.
  if (keepFrames) {
    say('- NOTE: --keep-frames was given, so frames that were already in ' + dir + ' were used again.')
    say()
  } else {
    try {
      rmSync(dir, { recursive: true, force: true, maxRetries: 8, retryDelay: 500 })
    } catch (e) {
      stops.push('the folder ' + dir + ' of the draw test ' + id + ' could not be emptied (' + String((e as Error).message ?? e) + '). Close what holds files in it, or remove it by hand, and run the test again.')
      break
    }
  }
  const before = hasNv ? await sampleGpu() : null
  const res = await draw([TSX, 'tools/capture.ts', '--format', t.format, '--rate', '2', '--tier', 'final', '--frames', frames.map((f) => f.capture).join(','), '--out', dir, ...pass])
  gpuNotes[id] = res.gpu
  if (res.code !== 0) {
    stops.push('the capture tool stopped in the draw test ' + id + ' (exit code ' + res.code + '). Its own last lines above say why; copy them whole into the report.')
    break
  }
  const manifestFile = join(dir, 'manifest.json')
  if (!existsSync(manifestFile)) {
    stops.push('the draw test ' + id + ' left no manifest.json in ' + dir + '.')
    break
  }
  const man = JSON.parse(readFileSync(manifestFile, 'utf8')) as { graphics: string; browser: string; engineHash: string; shutterDegrees: number; underNeeds: string[]; shots?: Shot[] }
  renderer = man.graphics
  browserName = man.browser
  say('- Browser: ' + man.browser)
  say('- Graphics the browser drew on: ' + man.graphics)
  const wantGpu = a['expect-gpu'] !== undefined && a['expect-gpu'] !== 'true' ? a['expect-gpu']! : null
  if (wantGpu !== null && !String(man.graphics ?? '').toLowerCase().includes(wantGpu.toLowerCase())) {
    // second proof, beside the one in tools/capture.ts: the name written down by the draw test itself must hold the words asked for
    stops.push('the draw test ' + id + ' names the graphics "' + String(man.graphics ?? '') + '", and that name does not hold "' + wantGpu + '" (--expect-gpu). No frame of the film may be drawn on other graphics than the named card.')
    break
  }
  say('- Engine hash of the page: ' + man.engineHash + '; shutter ' + man.shutterDegrees + ' degrees')
  if (man.underNeeds.length > 0) looks.push('draw test ' + id + ': the machine is under the film\'s needs and --ignore-limits let it pass: ' + man.underNeeds.join('; ') + '.')
  if (res.gpu) {
    say('- NVIDIA card while drawing: busiest ' + res.gpu.maxUtil + ' percent, most memory in use ' + res.gpu.maxMemoryMb + ' MB (' + res.gpu.samples + ' readings; before the draw ' + (before ? before.util + ' percent and ' + before.memoryMb + ' MB' : 'not read') + ')')
  }
  say()
  say('| capture frame | film frame | what | PSNR dB | SSIM | seconds | render s | PNG MB | fine detail |')
  say('|---|---|---|---|---|---|---|---|---|')
  mkdirSync(SIDE, { recursive: true })
  for (const f of frames) {
    const local = join(dir, 'frames', frameName(f.capture))
    const shot = (man.shots ?? []).find((x) => x.frame === f.capture)
    const row: Row = { test: id, capture: f.capture, film: Math.floor(f.capture / 2), odd: f.capture % 2 === 1, what: f.what, psnr: null, ssim: null, seconds: shot?.seconds ?? null, render: shot?.render ?? null, bytes: shot?.bytes ?? null, warmed: shot?.warmed ?? null, detail: null, side: null }
    if (!existsSync(local)) {
      stops.push('draw test ' + id + ': the frame ' + f.capture + ' was not written.')
      rows.push(row)
      continue
    }
    if (row.bytes === null) row.bytes = statSync(local).size
    if (f.ref) {
      const ref = join(HAND, f.ref)
      const m = measure(local, ref, size.width, t.refWidth, t.refHeight)
      row.psnr = m.psnr
      row.ssim = m.ssim
      const side = join(SIDE, id + '-' + frameName(f.capture).replace('.png', '.jpg'))
      if (sideBySide(local, ref, side, size.width > t.refWidth)) row.side = side
      if (m.psnr === null || m.ssim === null) stops.push('draw test ' + id + ': frame ' + f.capture + ' could not be compared with ' + f.ref + '.')
      else if (m.psnr < facts.thresholds.stopPsnr) stops.push('draw test ' + id + ': frame ' + f.capture + ' (' + f.what + ') is another picture than the approved one: PSNR ' + m.psnr.toFixed(2) + ' dB, SSIM ' + m.ssim.toFixed(4) + '. Look at ' + side + '.')
      else if (m.psnr < (f.lookPsnr ?? facts.thresholds.lookPsnr) || m.ssim < (f.lookSsim ?? facts.thresholds.lookSsim)) looks.push('draw test ' + id + ': frame ' + f.capture + ' (' + f.what + ') differs from the approved picture more than an encode explains: PSNR ' + m.psnr.toFixed(2) + ' dB, SSIM ' + m.ssim.toFixed(4) + '. Look at ' + side + '.')
    }
    if (size.width >= 3840) row.detail = fineDetail(local)
    rows.push(row)
    const own = f.lookPsnr !== undefined || f.lookSsim !== undefined ? ' (this frame has its own limit: ' + (f.lookPsnr ?? facts.thresholds.lookPsnr) + ' dB, SSIM ' + (f.lookSsim ?? facts.thresholds.lookSsim) + ')' : ''
    const num = (v: number | null, d: number): string => (v === null ? 'n/a' : v === Infinity ? 'equal' : v.toFixed(d))
    say('| ' + f.capture + ' | ' + row.film + (row.odd ? ' and a half' : '') + ' | ' + f.what + own + ' | ' + num(row.psnr, 2) + ' | ' + num(row.ssim, 4) + ' | ' + num(row.seconds, 1) + ' | ' + num(row.render, 1) + ' | ' + num(row.bytes === null ? null : row.bytes / 1e6, 1) + ' | ' + num(row.detail, 2) + ' |')
  }
  if (res.gpu && res.gpu.samples >= 3 && res.gpu.maxUtil < facts.thresholds.minGpuUtil) {
    looks.push('draw test ' + id + ': the NVIDIA card was never busier than ' + res.gpu.maxUtil + ' percent while the frames were drawn, although the browser names it. Check in the Task Manager (Performance, GPU) that the card works while a frame is drawn.')
  }
  if (stops.length > 0) break
}

// 5. hours and disk for the whole film
say()
say('## The whole film')
say()
const filmFrames = cfg.frameCount
const captureFrames = filmFrames * 2
const best = rows.some((r) => r.test === 'uhd' && r.seconds !== null) ? 'uhd' : rows.some((r) => r.test === 'master' && r.seconds !== null) ? 'master' : null
if (best === null) {
  say('No frame was drawn at 3840 by 2160 or at 1920 by 1080, so there is no time per frame for the film.')
  if (stops.length === 0) looks.push('no draw test at the film\'s size ran, so the hours of the full run are not known.')
} else {
  const timed = rows.filter((r) => r.test === best && r.seconds !== null && r.render !== null)
  const calm = timed.filter((r) => (r.warmed ?? 0) === 0)
  const overheads = (calm.length > 0 ? calm : timed).map((r) => Math.max(0, r.seconds! - r.render!)).sort((x, y) => x - y)
  const overhead = overheads[Math.floor(overheads.length / 2)] ?? 0
  const perFrame = timed.map((r) => ({ film: r.film, seconds: (r.warmed ?? 0) === 0 ? r.seconds! : r.render! + overhead }))
  const mean = perFrame.reduce((s, r) => s + r.seconds, 0) / perFrame.length
  const slowest = perFrame.reduce((m, r) => Math.max(m, r.seconds), 0)
  const flatHours = (mean * captureFrames) / 3600
  let byCostHours: number | null = null
  const costFile = join(HAND, facts.costTable)
  if (existsSync(costFile) && perFrame.length >= 4) {
    const known = JSON.parse(readFileSync(costFile, 'utf8')) as Record<string, number>
    const cost: number[] = new Array<number>(filmFrames).fill(NaN)
    for (const [k, v] of Object.entries(known)) if (Number(k) >= 0 && Number(k) < filmFrames) cost[Number(k)] = v
    let last = NaN
    for (let i = 0; i < filmFrames; i++) {
      if (!Number.isNaN(cost[i]!)) last = cost[i]!
      else if (!Number.isNaN(last)) cost[i] = last
    }
    last = NaN
    for (let i = filmFrames - 1; i >= 0; i--) {
      if (!Number.isNaN(cost[i]!)) last = cost[i]!
      else if (!Number.isNaN(last)) cost[i] = last
    }
    const xs = perFrame.map((r) => cost[r.film] ?? NaN)
    if (xs.every((x) => !Number.isNaN(x))) {
      const ys = perFrame.map((r) => r.seconds)
      const mx = xs.reduce((s, x) => s + x, 0) / xs.length
      const my = ys.reduce((s, y) => s + y, 0) / ys.length
      const sxx = xs.reduce((s, x) => s + (x - mx) * (x - mx), 0)
      const sxy = xs.reduce((s, x, i) => s + (x - mx) * (ys[i]! - my), 0)
      let b = sxx > 0 ? sxy / sxx : 0
      let c = my - b * mx
      if (b < 0) {
        b = 0
        c = my
      }
      if (c < 0) {
        c = 0
        b = xs.reduce((s, x, i) => s + x * ys[i]!, 0) / Math.max(1e-9, xs.reduce((s, x) => s + x * x, 0))
      }
      byCostHours = (cost.reduce((s, x) => s + 2 * (c + b * x), 0)) / 3600
    }
  }
  const pngMean = timed.reduce((s, r) => s + (r.bytes ?? 0), 0) / timed.length
  const scale = best === 'uhd' ? 1 : 4
  const pngChunkGb = (600 * pngMean * scale) / 1e9
  const needGb = Math.ceil(pngChunkGb * 1.5 + 20)
  estimate.basedOn = best
  estimate.secondsPerFrameMean = Number(mean.toFixed(2))
  estimate.secondsPerFrameSlowest = Number(slowest.toFixed(2))
  estimate.hoursFlat = Number((flatHours * (best === 'uhd' ? 1 : 4)).toFixed(1))
  estimate.hoursByCost = byCostHours === null ? null : Number((byCostHours * (best === 'uhd' ? 1 : 4)).toFixed(1))
  estimate.pngMbPerFrame = Number(((pngMean * scale) / 1e6).toFixed(1))
  estimate.diskNeedGb = needGb
  say('- Time per frame at ' + (best === 'uhd' ? '3840 by 2160' : '1920 by 1080') + ' on this machine: mean ' + mean.toFixed(1) + ' s, slowest ' + slowest.toFixed(1) + ' s (' + perFrame.length + ' test frames; the test holds more heavy frames than the film does)')
  if (best !== 'uhd') say('- No 4K frame was drawn. The hours below are the 1080p times taken four times, which is a guess.')
  say('- Hours for the ' + captureFrames + ' frames of the 4K film, every frame at the mean of the test: ' + estimate.hoursFlat)
  say('- Hours for the 4K film, every part of the film weighed by what it cost in the cloud: ' + (estimate.hoursByCost ?? 'not worked out'))
  say('- These are estimates from ' + perFrame.length + ' frames, not a promise. The run prints its own remaining time from the first minutes on.')
  say('- Disk: a 4K frame is about ' + estimate.pngMbPerFrame + ' MB as PNG; the run holds at most 600 of them at a time (' + pngChunkGb.toFixed(1) + ' GB) beside the parts and the films. Keep ' + needGb + ' GB free; ' + machine.freeDiskGb + ' GB are free here.')
  if (typeof machine.freeDiskGb === 'number' && machine.freeDiskGb < needGb) looks.push('the disk has ' + machine.freeDiskGb + ' GB free and the 4K run wants ' + needGb + ' GB. Free space first, or clone onto a larger disk.')
  const worst = Math.max(Number(estimate.hoursFlat), Number(estimate.hoursByCost ?? 0))
  if (worst > facts.thresholds.lookHours) looks.push('the 4K film is estimated at up to ' + worst.toFixed(1) + ' hours on this machine, more than ' + facts.thresholds.lookHours + '. Decide whether to run it, to run it on the other machine, or to draw the 1080p 60 fps film here instead.')
}
if (renderer !== null) {
  say('- Graphics named by the browser in every test: ' + renderer + (browserName ? ' (' + browserName + ')' : ''))
  if (a['expect-gpu'] !== undefined && a['expect-gpu'] !== 'true') say('- The words asked for (--expect-gpu): ' + a['expect-gpu'])
}
say('- Side by side pictures (left the approved film, right this machine; for 4K frames a second row at full size from the middle): ' + SIDE)
finish()
