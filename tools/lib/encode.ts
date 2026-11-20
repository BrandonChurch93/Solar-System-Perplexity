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

export function concatCopy(files: string[], dst: string, faststart: boolean): void {
  if (files.length === 0) throw new Error('nothing to join')
  mkdirSync(dirname(dst), { recursive: true })
  const list = dst + '.list.txt'
  writeFileSync(list, files.map((f) => "file '" + f.replace(/'/g, "'\\''") + "'").join('\n') + '\n')
  const tmp = dst + '.tmp.mp4'
  runFf(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-map', '0:v:0', ...(faststart ? ['-movflags', '+faststart'] : []), tmp], 'join')
  rmSync(list)
  spawnSync('mv', [tmp, dst])
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
