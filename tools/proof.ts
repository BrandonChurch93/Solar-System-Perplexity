import { execFileSync, spawnSync } from 'node:child_process'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import type { Page } from 'playwright-core'
import { DIST, WORK, args, ensureBuild, loadConfig, machineId, requireDisk, writeRecord } from './lib/common'
import { openCapture, renderPng } from './lib/browser'

interface MemorySample { frame: number; textureBytes: number; loaded: string[]; jsHeap: number | null }
interface Status { state: string; framesDone: number; framesTotal: number; message: string; memory: MemorySample[]; codec: string; h264: boolean; file: string; seconds: number; sink: string }

const cfg = loadConfig()
const a = args()
const memoryMode = a.memory === 'true'
const fps = cfg.fps
const preview = cfg.formatKeys.preview
const pf = cfg.formats[preview]!
const tier = 'draft'
const assets = 'full'
const dir = join(WORK, 'export')
mkdirSync(dir, { recursive: true })
requireDisk(cfg)
const hashes = ensureBuild()

function fail(msg: string): never {
  console.error('FAIL ' + msg)
  process.exit(1)
}

const status = (page: Page): Promise<Status | null> => page.evaluate(() => ((window as unknown as { exportStatus?: Status }).exportStatus ?? null))

async function runExport(first: number, last: number, file: string, onTick?: (s: Status) => void): Promise<{ status: Status; browser: string; wall: number }> {
  const t0 = Date.now()
  const s = await openCapture({ dist: DIST, format: preview, assets, mode: 'export', query: '&tier=' + tier + '&first=' + first + '&last=' + last + '&auto=1' })
  let downloaded = false
  const dl = s.page.waitForEvent('download', { timeout: 0 }).then(async (d) => {
    await d.saveAs(file)
    downloaded = true
  }).catch(() => undefined)
  let st: Status | null = null
  let lastLog = 0
  for (;;) {
    st = await status(s.page)
    if (st && (st.state === 'done' || st.state === 'error')) break
    if (st && onTick && Date.now() - lastLog > 15000) {
      lastLog = Date.now()
      onTick(st)
    }
    await new Promise((r) => setTimeout(r, 1000))
  }
  if (st.state === 'error') {
    await s.close()
    fail('export page reported an error: ' + st.message)
  }
  await Promise.race([dl, new Promise((r) => setTimeout(r, 10000))])
  if (!downloaded) {
    const b64 = await s.page.evaluate(() => {
      const bytes = (window as unknown as { exportResult?: Uint8Array }).exportResult
      if (!bytes) return null
      let out = ''
      for (let i = 0; i < bytes.length; i += 0x8000) out += String.fromCharCode(...bytes.subarray(i, i + 0x8000))
      return btoa(out)
    })
    if (!b64) fail('no download and no exportResult on the page')
    writeFileSync(file, Buffer.from(b64, 'base64'))
    console.log('download event not caught, saved exportResult instead')
  }
  const browser = s.browserVersion
  await s.close()
  return { status: st, browser, wall: (Date.now() - t0) / 1000 }
}

interface Probe { codec: string; width: number; height: number; rate: string; frames: number; keyIndices: number[]; colorSpace: string }

function probe(file: string): Probe {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,avg_frame_rate,nb_read_frames,nb_frames,color_space', '-of', 'json', file], { encoding: 'utf8' })) as { streams: Record<string, string | number>[] }
  const st = j.streams[0]!
  const frames = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'frame=key_frame', '-of', 'json', file], { encoding: 'utf8' })) as { frames: { key_frame: number }[] }
  const keyIndices = frames.frames.flatMap((f, i) => (f.key_frame === 1 ? [i] : []))
  return { codec: String(st.codec_name), width: Number(st.width), height: Number(st.height), rate: String(st.avg_frame_rate), frames: Number(st.nb_read_frames), keyIndices, colorSpace: String(st.color_space ?? 'unknown') }
}

function checkProbe(p: Probe, expectFrames: number, expectCodec: string): string[] {
  const errs: string[] = []
  if (p.codec !== expectCodec) errs.push('codec ' + p.codec + ', expected ' + expectCodec)
  if (p.width !== pf.width || p.height !== pf.height) errs.push('size ' + p.width + 'x' + p.height + ', expected ' + pf.width + 'x' + pf.height)
  const [n, d] = p.rate.split('/').map(Number)
  if (!n || !d || Math.abs(n / d - fps) > 1e-6) errs.push('frame rate ' + p.rate + ', expected ' + fps)
  if (p.frames !== expectFrames) errs.push('frame count ' + p.frames + ', expected ' + expectFrames)
  for (let i = 0; i < expectFrames; i += fps) if (!p.keyIndices.includes(i)) errs.push('frame ' + i + ' is not a key frame')
  return errs
}

function psnrOf(a: string, b: string): number {
  const r = spawnSync('ffmpeg', ['-hide_banner', '-i', a, '-i', b, '-lavfi', '[0:v]format=rgb24[x];[1:v]format=rgb24[y];[x][y]psnr', '-f', 'null', '-'], { encoding: 'utf8' })
  const m = /average:(inf|[0-9.]+)/.exec(r.stderr + r.stdout)
  if (!m) throw new Error('no psnr in ffmpeg output: ' + r.stderr)
  return m[1] === 'inf' ? Infinity : Number(m[1])
}

function decodeFrame(file: string, index: number, out: string, matrix: string): void {
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', file, '-vf', 'select=eq(n\\,' + index + '),scale=in_color_matrix=' + matrix + ':in_range=tv:out_range=pc,format=rgb24', '-frames:v', '1', '-update', '1', out])
}

const yuvMatrix = (p: Probe): string => (p.colorSpace === 'bt470bg' || p.colorSpace === 'smpte170m' ? 'bt601' : 'bt709')

if (!memoryMode) {
  const frames = Math.round(cfg.raw.export.proofSeconds * fps)
  const last = frames - 1
  const file = join(dir, cfg.raw.export.files.preview)
  console.log('proof: export frames 0..' + last + ' at ' + preview + ' ' + pf.width + 'x' + pf.height + ', tier ' + tier + ', assets ' + assets)
  const { status: st, browser, wall } = await runExport(0, last, file)
  const loud: string[] = []
  if (!st.h264) loud.push('WARNING: this browser could not encode H.264. The pipeline was proven with ' + st.codec + '. export.videoCodec (' + cfg.raw.export.videoCodec + ') is UNPROVEN here.')
  for (const l of loud) console.log('\n' + l + '\n')
  const p = probe(file)
  const expectCodec = st.h264 ? 'h264' : st.codec.startsWith('vp09') ? 'vp9' : 'av1'
  const errs = checkProbe(p, frames, expectCodec)
  console.log('ffprobe: codec ' + p.codec + ', ' + p.width + 'x' + p.height + ', ' + p.rate + ' fps, ' + p.frames + ' frames, key frames at ' + p.keyIndices.join(' ') + ', color space ' + p.colorSpace + ', encoder codec string ' + st.codec)
  const cap = await openCapture({ dist: DIST, format: preview, assets })
  const results: Record<string, number> = {}
  for (const f of [0, last]) {
    const still = join(dir, 'still-' + f + '.png')
    const dec = join(dir, 'decoded-' + f + '.png')
    writeFileSync(still, (await renderPng(cap.page, f, tier)).png)
    decodeFrame(file, f, dec, yuvMatrix(p))
    const v = psnrOf(dec, still)
    results[String(f)] = v
    console.log('frame ' + f + ': PSNR ' + v.toFixed(2) + ' dB against a capture still')
    if (!(v >= 30)) errs.push('frame ' + f + ' PSNR ' + v.toFixed(2) + ' dB is under 30')
  }
  await cap.close()
  const size = readFileSync(file).length
  writeRecord(file, { engineHash: hashes.engine, stopHashes: hashes.stops, format: preview, tier, assets, diag: 'beauty', browser, machine: machineId(), first: 0, last, extra: { codec: st.codec, h264: st.h264, videoCodecProven: st.h264, warnings: loud, probe: p, psnr: results, bytes: size, exportSeconds: st.seconds, wallSeconds: wall, sink: st.sink, pass: errs.length === 0, errors: errs } })
  console.log('export took ' + st.seconds.toFixed(1) + ' s in the page, ' + wall.toFixed(1) + ' s wall, file ' + (size / 1024).toFixed(1) + ' KB: ' + file)
  for (const l of loud) console.log(l)
  if (errs.length > 0) fail(errs.join('; '))
  console.log('PASS proof')
} else {
  const travel = cfg.segments.find((s) => s.kind === 'travel')
  if (!travel) fail('no travel segment')
  const pad = Math.round(cfg.raw.export.memoryTestSeconds * fps)
  const first = Math.max(0, travel.firstFrame - pad)
  const last = Math.min(cfg.frameCount - 1, travel.endFrame - 1 + pad)
  const file = join(dir, 'memory-test.mp4')
  console.log('memory: export frames ' + first + '..' + last + ' across ' + travel.id + ' (' + travel.firstFrame + '..' + (travel.endFrame - 1) + ') at ' + preview + ', tier ' + tier + ', assets ' + assets)
  const mb = (b: number | null): string => (b === null ? 'n/a' : (b / 1048576).toFixed(1) + ' MB')
  const line = (m: MemorySample): string => 'frame ' + m.frame + ': textures ' + mb(m.textureBytes) + ', sets ' + m.loaded.length + ' [' + m.loaded.join(', ') + '], js heap ' + mb(m.jsHeap)
  let shown = 0
  const { status: st, browser, wall } = await runExport(first, last, file, (s) => {
    for (; shown < s.memory.length; shown++) console.log(line(s.memory[shown]!))
  })
  for (; shown < st.memory.length; shown++) console.log(line(st.memory[shown]!))
  const mem = st.memory
  const before = [...mem].reverse().find((m) => m.frame < travel.firstFrame)
  const after = mem[mem.length - 1]
  const errs: string[] = []
  if (!before) errs.push('no memory sample before the travel')
  if (!after || after.frame < travel.endFrame) errs.push('no memory sample after the travel')
  if (before && after) {
    if (after.loaded.length !== 1) errs.push('after the travel ' + after.loaded.length + ' sets are loaded, expected 1')
    if (after.textureBytes > before.textureBytes * 1.05) errs.push('texture total after the travel ' + mb(after.textureBytes) + ' is over ' + mb(before.textureBytes) + ' plus 5 percent')
  }
  const peakSets = Math.max(...mem.map((m) => m.loaded.length))
  if (peakSets > cfg.maxLoadedSets) errs.push('peak loaded sets ' + peakSets + ' over ' + cfg.maxLoadedSets)
  const p = probe(file)
  const pe = checkProbe(p, last - first + 1, st.h264 ? 'h264' : p.codec)
  errs.push(...pe)
  const out = join(dir, 'memory.json')
  const report = { travel: travel.id, first, last, before: before ?? null, after: after ?? null, peakSets, peakTextureBytes: Math.max(...mem.map((m) => m.textureBytes)), samples: mem, exportSeconds: st.seconds, wallSeconds: wall, codec: st.codec, pass: errs.length === 0, errors: errs }
  writeFileSync(out, JSON.stringify(report, null, 1))
  writeRecord(out, { engineHash: hashes.engine, stopHashes: hashes.stops, format: preview, tier, assets, diag: 'beauty', browser, machine: machineId(), first, last, extra: { pass: errs.length === 0 } })
  console.log('before the travel: ' + (before ? line(before) : 'none'))
  console.log('after the travel:  ' + (after ? line(after) : 'none'))
  console.log('export took ' + st.seconds.toFixed(1) + ' s in the page, ' + wall.toFixed(1) + ' s wall. Report: ' + out)
  if (errs.length > 0) fail(errs.join('; '))
  console.log('PASS memory')
}
