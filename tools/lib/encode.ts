import { spawn, spawnSync, type ChildProcess } from 'node:child_process'
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import type { Config } from '../../src/config'

export const FFMPEG = process.env.SHOWCASE_FFMPEG ?? 'ffmpeg'
export const FFPROBE = process.env.SHOWCASE_FFPROBE ?? 'ffprobe'

export interface Rate { bitrateMbps: number; maxrateMbps: number; bufsizeMbps: number }

export function rateFor(cfg: Config, format: string): Rate {
  const preview = format === cfg.formatKeys.preview
  const b = preview ? cfg.raw.previewFilm.bitrateMbps : cfg.raw.export.bitrateMbps
  const max = preview ? b * 1.5 : Math.min(cfg.raw.platform.maxBitrateMbps, b * 1.5)
  return { bitrateMbps: b, maxrateMbps: max, bufsizeMbps: max * 2 }
}

export const X264_PRESET = 'slow'
export const X264_LEVEL = '4.1'

export function x264Args(fps: number, rate: Rate): string[] {
  return [
    '-c:v', 'libx264', '-preset', X264_PRESET, '-profile:v', 'high', '-level:v', X264_LEVEL,
    '-b:v', rate.bitrateMbps + 'M', '-maxrate', rate.maxrateMbps + 'M', '-bufsize', rate.bufsizeMbps + 'M',
    '-g', String(fps), '-keyint_min', String(fps), '-sc_threshold', '0', '-flags', '+cgop', '-bf', '3', '-refs', '4',
    '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
    '-r', String(fps), '-fps_mode', 'cfr', '-video_track_timescale', String(fps * 512), '-an',
  ]
}

const TAGS = 'setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv'

export function rgbToYuvFilter(width?: number, height?: number): string {
  const size = width && height ? width + ':' + height + ':' : ''
  return 'scale=' + size + 'flags=lanczos+accurate_rnd+full_chroma_int:in_range=pc:out_range=tv:out_color_matrix=bt709,format=yuv420p,' + TAGS
}

export function yuvScaleFilter(width: number, height: number): string {
  return 'scale=' + width + ':' + height + ':flags=lanczos+accurate_rnd+full_chroma_int:in_range=tv:out_range=tv:in_color_matrix=bt709:out_color_matrix=bt709,format=yuv420p,' + TAGS
}

function runFf(argv: string[], what: string): void {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-nostdin', ...argv], { encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.status !== 0) throw new Error(what + ' failed: ' + (r.stderr ?? '').slice(-800))
}

export interface Intermediate { file: string; frames: number; write(buf: Buffer): Promise<void>; end(): Promise<void>; kill(): void }

export function openIntermediate(file: string, width: number, height: number, fps: number, input: 'png' | 'raw'): Intermediate {
  mkdirSync(dirname(file), { recursive: true })
  if (existsSync(file)) rmSync(file)
  const inArgs = input === 'png' ? ['-f', 'image2pipe', '-c:v', 'png', '-framerate', String(fps), '-i', 'pipe:0'] : ['-f', 'rawvideo', '-pix_fmt', 'rgba', '-s', width + 'x' + height, '-framerate', String(fps), '-i', 'pipe:0']
  const proc: ChildProcess = spawn(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-y', ...inArgs, '-c:v', 'ffv1', '-level', '3', '-slices', '4', '-pix_fmt', 'gbrp', '-r', String(fps), file], { stdio: ['pipe', 'ignore', 'pipe'] })
  let err = ''
  proc.stderr!.on('data', (d: Buffer) => (err += d.toString()))
  const done = new Promise<void>((resolve, reject) => {
    proc.on('close', (code) => (code === 0 ? resolve() : reject(new Error('lossless intermediate failed (' + code + '): ' + err.slice(-600)))))
  })
  done.catch(() => undefined)
  const it: Intermediate = {
    file,
    frames: 0,
    write: (buf) =>
      new Promise<void>((resolve, reject) => {
        it.frames++
        proc.stdin!.write(buf, (e) => (e ? reject(e) : resolve()))
      }),
    end: async () => {
      proc.stdin!.end()
      await done
    },
    kill: () => {
      proc.kill('SIGKILL')
    },
  }
  return it
}

export function encodeTwoPass(src: string, dst: string, opts: { fps: number; rate: Rate; filter: string; faststart?: boolean; passlog: string }): void {
  mkdirSync(dirname(dst), { recursive: true })
  mkdirSync(dirname(opts.passlog), { recursive: true })
  const common = ['-i', src, '-vf', opts.filter, ...x264Args(opts.fps, opts.rate), '-passlogfile', opts.passlog]
  runFf(['-y', ...common, '-pass', '1', '-f', 'null', '/dev/null'], 'pass 1')
  const tmp = dst + '.tmp.mp4'
  runFf(['-y', ...common, '-pass', '2', ...(opts.faststart ? ['-movflags', '+faststart'] : []), tmp], 'pass 2')
  for (const ext of ['-0.log', '-0.log.mbtree', '-0.log.temp', '-0.log.mbtree.temp']) if (existsSync(opts.passlog + ext)) rmSync(opts.passlog + ext)
  spawnSync('mv', [tmp, dst])
}

export function encodeOnePass(src: string, dst: string, opts: { fps: number; rate: Rate; filter?: string; preset?: string }): void {
  mkdirSync(dirname(dst), { recursive: true })
  const args = x264Args(opts.fps, opts.rate)
  if (opts.preset) args[args.indexOf('-preset') + 1] = opts.preset
  runFf(['-y', '-i', src, ...(opts.filter ? ['-vf', opts.filter] : []), ...args, '-movflags', '+faststart', dst], 'encode')
}

export function concatCopy(files: string[], dst: string, faststart: boolean): { step: number; delay: number; fixed: number } {
  if (files.length === 0) throw new Error('nothing to join')
  mkdirSync(dirname(dst), { recursive: true })
  const list = dst + '.list.txt'
  const span = (f: string): string => {
    const r = spawnSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=nb_frames,r_frame_rate', '-of', 'json', f], { encoding: 'utf8' })
    const st = r.status === 0 ? (JSON.parse(r.stdout) as { streams: { nb_frames?: string; r_frame_rate?: string }[] }).streams[0] : undefined
    const [num, den] = (st?.r_frame_rate ?? '').split('/').map(Number)
    const frames = Number(st?.nb_frames)
    return frames > 0 && num! > 0 && den! > 0 ? '\nduration ' + (frames * den! / num!).toFixed(6) : ''
  }
  writeFileSync(list, files.map((f) => "file '" + f.replace(/'/g, "'\\''") + "'" + span(f)).join('\n') + '\n')
  const tmp = dst + '.tmp.mp4'
  runFf(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-map', '0:v:0', ...(faststart ? ['-movflags', '+faststart'] : []), tmp], 'join')
  rmSync(list)
  const timing = regularTiming(tmp, faststart)
  spawnSync('mv', [tmp, dst])
  return timing
}

interface Timing { pts: number[]; dts: number[]; dur: number[]; tbNum: number; tbDen: number }

function readTiming(file: string): Timing {
  const r = spawnSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=time_base:packet=pts,dts,duration', '-of', 'json', file], { encoding: 'utf8', maxBuffer: 1 << 28 })
  if (r.status !== 0) throw new Error('timing probe failed: ' + (r.stderr ?? '').slice(-400))
  const j = JSON.parse(r.stdout) as { packets: { pts: number; dts: number; duration: number }[]; streams: { time_base: string }[] }
  const [tbNum, tbDen] = j.streams[0]!.time_base.split('/').map(Number)
  return { pts: j.packets.map((p) => Number(p.pts)), dts: j.packets.map((p) => Number(p.dts)), dur: j.packets.map((p) => Number(p.duration)), tbNum: tbNum!, tbDen: tbDen! }
}

function timingFaults(t: Timing): { step: number; delay: number; faults: number } {
  const n = t.pts.length
  if (n < 2) return { step: 0, delay: 0, faults: 0 }
  const sorted = [...t.pts].sort((x, y) => x - y)
  const step = sorted[1]! - sorted[0]!
  if (step <= 0) throw new Error('timing: two frames share one time')
  for (let i = 1; i < n; i++) if (sorted[i]! - sorted[i - 1]! !== step) throw new Error('timing: frame ' + i + ' is not one frame after frame ' + (i - 1))
  let delay = 0
  let faults = 0
  for (let k = 0; k < n; k++) {
    delay = Math.max(delay, k - (t.pts[k]! - sorted[0]!) / step)
    if (t.dur[k] !== step || (k > 0 && t.dts[k]! - t.dts[k - 1]! !== step)) faults++
  }
  return { step, delay, faults }
}

// Spans encoded with and without reordered frames are joined without encoding again. The join then leaves decode times that
// jump at each seam (a packet three frames long, then packets one tick long). Every frame still shows at its right time, but a
// converter that reads packet lengths repeats and drops frames there. This writes the same stream again with even decode times.
export function regularTiming(file: string, faststart: boolean): { step: number; delay: number; fixed: number } {
  const before = readTiming(file)
  const f = timingFaults(before)
  if (f.faults === 0) return { step: f.step, delay: f.delay, fixed: 0 }
  const tick = '(' + f.step * before.tbNum + '/(' + before.tbDen + '*TB))'
  const tmp = file + '.even.mp4'
  runFf(['-y', '-i', file, '-c', 'copy', '-map', '0:v:0', '-bsf:v', 'setts=pts=PTS:dts=(N-' + f.delay + ')*' + tick + ':duration=' + tick, ...(faststart ? ['-movflags', '+faststart'] : []), tmp], 'even timing')
  const after = readTiming(tmp)
  const g = timingFaults(after)
  const first = Math.min(...before.pts)
  const firstAfter = Math.min(...after.pts)
  const same = after.pts.length === before.pts.length && after.pts.every((p, k) => (p - firstAfter) * after.tbNum * before.tbDen === (before.pts[k]! - first) * before.tbNum * after.tbDen)
  if (g.faults !== 0 || !same || after.dts.some((d, k) => d > after.pts[k]!)) throw new Error('even timing failed on ' + file + ': ' + g.faults + ' uneven packets left, frame times kept: ' + same)
  spawnSync('mv', [tmp, file])
  return { step: f.step, delay: f.delay, fixed: f.faults }
}

export interface Probe { frames: number; width: number; height: number; fps: string; codec: string; profile: string; pixFmt: string; colorSpace: string; colorRange: string; durationSeconds: number }

export function probeVideo(file: string): Probe | null {
  if (!existsSync(file)) return null
  const r = spawnSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames,width,height,r_frame_rate,codec_name,profile,pix_fmt,color_space,color_range,duration', '-of', 'json', file], { encoding: 'utf8', maxBuffer: 1 << 24 })
  if (r.status !== 0) return null
  const s = (JSON.parse(r.stdout) as { streams: Record<string, string | number>[] }).streams[0]
  if (!s) return null
  return { frames: Number(s.nb_read_frames), width: Number(s.width), height: Number(s.height), fps: String(s.r_frame_rate), codec: String(s.codec_name), profile: String(s.profile), pixFmt: String(s.pix_fmt), colorSpace: String(s.color_space), colorRange: String(s.color_range), durationSeconds: Number(s.duration) }
}

export function decodeFramePng(video: string, index: number, out: string): void {
  mkdirSync(dirname(out), { recursive: true })
  runFf(['-y', '-i', video, '-vf', 'select=eq(n\\,' + index + '),scale=flags=lanczos+accurate_rnd+full_chroma_int:in_range=tv:in_color_matrix=bt709:out_range=pc,format=rgb24', '-frames:v', '1', '-fps_mode', 'passthrough', out], 'decode frame')
}

export function psnrPng(a: string, b: string): number {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-i', a, '-i', b, '-lavfi', '[0:v]format=rgb24[x];[1:v]format=rgb24[y];[x][y]psnr', '-f', 'null', '-'], { encoding: 'utf8' })
  const m = /average:([0-9.inf]+)/.exec(r.stderr ?? '')
  if (!m) throw new Error('psnr failed: ' + (r.stderr ?? '').slice(-400))
  return m[1] === 'inf' ? Infinity : Number(m[1])
}

export function tempDir(work: string, name: string): string {
  const d = join(work, 'tmp', name)
  mkdirSync(d, { recursive: true })
  return d
}
