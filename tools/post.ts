import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { join, relative, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import type { Config } from '../src/config'
import { ROOT, WORK, args, loadConfig, machineId, readRecord, writeRecord, type OutputRecord } from './lib/common'
import { FFMPEG, FFPROBE, decodeFramePng, probeVideo, psnrPng, rateFor, regularTiming, tempDir, x264Args, yuvScaleFilter, type Probe } from './lib/encode'

export interface PostsConfig { introMaxSeconds: number; readHoldSeconds: number; introMaxTries: number; checkMaxFixes: number; prompts: Record<string, string> }
export interface Box { x: number; y: number; width: number; height: number }
export interface IntroExtra {
  stop: string
  prompt: string
  frames: number
  fps: number
  durationSeconds: number
  firstKeySeconds: number
  lastKeySeconds: number
  submitSeconds: number
  holdBeforeSubmitSeconds: number
  keySeconds: number[]
  promptBox: Box
  sha256: string
  [key: string]: unknown
}

export const POSTS = join(WORK, 'posts')

export function postsConfig(cfg: Config): PostsConfig {
  return cfg.raw.posts
}

export function sha256(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

export function introFile(stop: string): string {
  return join(POSTS, 'intro-' + stop + '.mp4')
}

function postFile(stop: string): string {
  return join(POSTS, stop + '.mp4')
}

function clipFile(stop: string): string | null {
  for (const dir of [join(WORK, 'clips'), join(ROOT, 'out/clips')]) if (existsSync(join(dir, stop + '.mp4'))) return join(dir, stop + '.mp4')
  return null
}

function ff(argv: string[], what: string): void {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-nostdin', ...argv], { encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.status !== 0) throw new Error(what + ' failed: ' + (r.stderr ?? '').slice(-800))
}

const STREAM_KEYS = ['codec_name', 'profile', 'level', 'width', 'height', 'pix_fmt', 'sample_aspect_ratio', 'field_order', 'r_frame_rate', 'time_base', 'has_b_frames', 'color_range', 'color_space', 'color_transfer', 'color_primaries'] as const

export interface StreamInfo { video: Record<string, string>; sps: string; pps: string; audioStreams: number; streams: number }

function parameterSets(dump: string): { sps: string; pps: string } {
  const hex = dump.split('\n').map((l) => /^[0-9a-f]{8}: ((?:[0-9a-f]{2,4} ?)+)/.exec(l)?.[1] ?? '').join('').replace(/ /g, '')
  const b = Buffer.from(hex, 'hex')
  if (b.length < 7 || b[0] !== 1) return { sps: hex, pps: '' }
  const sets: string[][] = [[], []]
  let at = 5
  for (const [kind, mask] of [[0, 0x1f], [1, 0xff]] as const) {
    const count = b[at++]! & mask
    for (let i = 0; i < count; i++) {
      const len = b.readUInt16BE(at)
      sets[kind]!.push(b.subarray(at + 2, at + 2 + len).toString('hex'))
      at += 2 + len
    }
  }
  return { sps: sets[0]!.join(','), pps: sets[1]!.join(',') }
}

export function streamInfo(file: string): StreamInfo {
  const r = spawnSync(FFPROBE, ['-v', 'error', '-show_streams', '-show_data', '-of', 'json', file], { encoding: 'utf8', maxBuffer: 1 << 24 })
  if (r.status !== 0) throw new Error('cannot read ' + file + ': ' + (r.stderr ?? '').slice(-300))
  const streams = (JSON.parse(r.stdout) as { streams: Record<string, string | number>[] }).streams
  const v = streams.find((s) => s.codec_type === 'video')
  if (!v) throw new Error('no video stream in ' + file)
  return { video: Object.fromEntries(STREAM_KEYS.map((k) => [k, String(v[k] ?? '')])), ...parameterSets(String(v.extradata ?? '')), audioStreams: streams.filter((s) => s.codec_type === 'audio').length, streams: streams.length }
}

function differences(a: StreamInfo, b: StreamInfo): string[] {
  const out = STREAM_KEYS.filter((k) => a.video[k] !== b.video[k]).map((k) => k + ' ' + a.video[k] + ' / ' + b.video[k])
  if (a.sps !== b.sps) out.push('sequence parameter sets differ')
  if (a.audioStreams || b.audioStreams) out.push('audio streams ' + a.audioStreams + ' / ' + b.audioStreams)
  return out
}

function framePts(file: string): number[] {
  const r = spawnSync(FFPROBE, ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'packet=pts', '-of', 'csv=p=0', file], { encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.status !== 0) throw new Error('cannot read packets of ' + file)
  return r.stdout.split('\n').map((l) => l.trim().replace(/,$/, '')).filter((l) => l !== '').map(Number).sort((x, y) => x - y)
}

function evenSteps(file: string): boolean {
  const pts = framePts(file)
  if (pts.length < 2) return false
  const step = pts[1]! - pts[0]!
  return step > 0 && pts.every((p, i) => p === pts[0]! + i * step)
}

function timesKept(post: string, intro: string, clip: string): boolean {
  const p = framePts(post)
  const i = framePts(intro)
  const c = framePts(clip)
  if (p.length !== i.length + c.length || i.length < 2) return false
  const cut = i.length * (i[1]! - i[0]!)
  return i.every((t, n) => p[n] === t) && c.every((t, n) => p[i.length + n] === cut + t - c[0]!)
}

function frameHashes(file: string): string[] {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', file, '-map', '0:v:0', '-f', 'framemd5', '-'], { encoding: 'utf8', maxBuffer: 1 << 28 })
  if (r.status !== 0) throw new Error('cannot decode ' + file + ': ' + (r.stderr ?? '').slice(-300))
  return r.stdout.split('\n').filter((l) => l !== '' && !l.startsWith('#')).map((l) => l.slice(l.lastIndexOf(',') + 1).trim())
}

function sameFrames(post: string, intro: string, clip: string): boolean {
  const p = frameHashes(post)
  const want = [...frameHashes(intro), ...frameHashes(clip)]
  return p.length === want.length && p.every((h, n) => h === want[n])
}

function joinCopy(intro: string, clip: string, introSeconds: number, out: string): void {
  const list = out + '.list.txt'
  const quote = (f: string): string => "file '" + f.replace(/'/g, "'\\''") + "'"
  writeFileSync(list, [quote(intro), 'duration ' + introSeconds.toFixed(6), quote(clip)].join('\n') + '\n')
  try {
    ff(['-y', '-f', 'concat', '-safe', '0', '-i', list, '-c', 'copy', '-map', '0:v:0', '-movflags', '+faststart', out], 'join')
  } finally {
    rmSync(list, { force: true })
  }
}

function joinEncode(cfg: Config, intro: string, clip: string, out: string): string[] {
  const master = cfg.formats[cfg.formatKeys.master]!
  const rate = rateFor(cfg, cfg.formatKeys.master)
  const conform = yuvScaleFilter(master.width, master.height) + ',fps=' + cfg.fps + ',setsar=1'
  const graph = '[0:v:0]' + conform + '[a];[1:v:0]' + conform + '[b];[a][b]concat=n=2:v=1:a=0[v]'
  const passlog = join(tempDir(WORK, 'post'), 'post.pass')
  const common = ['-i', intro, '-i', clip, '-filter_complex', graph, '-map', '[v]', ...x264Args(cfg.fps, rate), '-passlogfile', passlog]
  ff(['-y', ...common, '-pass', '1', '-f', 'null', '/dev/null'], 'pass 1')
  ff(['-y', ...common, '-pass', '2', '-movflags', '+faststart', out], 'pass 2')
  for (const ext of ['-0.log', '-0.log.mbtree', '-0.log.temp', '-0.log.mbtree.temp']) rmSync(passlog + ext, { force: true })
  return x264Args(cfg.fps, rate)
}

function introExtra(stop: string): IntroExtra | null {
  const rec = readRecord(introFile(stop))
  return rec?.extra ? (rec.extra as IntroExtra) : null
}

function makePost(cfg: Config, stop: string, forceEncode: boolean): boolean {
  const intro = introFile(stop)
  const clip = clipFile(stop)
  if (!existsSync(intro)) {
    console.log(stop + ': skipped, no intro at ' + relative(ROOT, intro))
    return false
  }
  if (!clip) {
    console.log(stop + ': skipped, no clip yet in out/work/clips or out/clips')
    return false
  }
  const ip = probeVideo(intro)
  const cp = probeVideo(clip)
  if (!ip || !cp) throw new Error(stop + ': the intro or the clip cannot be read')
  const a = streamInfo(intro)
  const b = streamInfo(clip)
  const diff = differences(a, b)
  const out = postFile(stop)
  const tmp = out + '.tmp.mp4'
  const want = ip.frames + cp.frames
  let copied = false
  let why = forceEncode ? ['--encode was given'] : diff
  let encodeArgs: string[] | null = null
  const t0 = Date.now()
  if (!forceEncode && diff.length === 0) {
    joinCopy(intro, clip, ip.frames / cfg.fps, tmp)
    regularTiming(tmp, true)
    const p = probeVideo(tmp)
    if (p?.frames !== want) why = ['the join without encoding gave ' + (p?.frames ?? 0) + ' frames, expected ' + want]
    else if (!timesKept(tmp, intro, clip)) why = ['the join without encoding moved frame times']
    else if (!sameFrames(tmp, intro, clip)) why = ['the join without encoding does not decode to the frames of the intro and the clip']
    else copied = true
  }
  if (!copied) encodeArgs = joinEncode(cfg, intro, clip, tmp)
  const p = probeVideo(tmp)
  if (!p || p.frames !== want) {
    rmSync(tmp, { force: true })
    throw new Error(stop + ': the post has ' + (p?.frames ?? 0) + ' frames, expected ' + want)
  }
  renameSync(tmp, out)
  const clipRec = readRecord(clip)
  const ix = introExtra(stop)
  const base: OutputRecord = clipRec
    ? { engineHash: clipRec.engineHash, stopHashes: clipRec.stopHashes, format: clipRec.format, tier: clipRec.tier, assets: clipRec.assets, diag: clipRec.diag, browser: clipRec.browser, machine: clipRec.machine }
    : { engineHash: '', stopHashes: {}, format: cfg.formatKeys.master, tier: '', assets: '', diag: 'beauty', browser: '', machine: machineId() }
  writeRecord(out, {
    ...base,
    extra: {
      kind: 'post',
      stop,
      frames: { intro: ip.frames, clip: cp.frames, post: p.frames },
      joinedWithoutEncoding: copied,
      ...(copied ? { proof: 'every decoded frame of the post has the hash of the same frame of the intro or the clip, and every frame time is kept', pictureParameterSets: a.pps === b.pps ? 'same in both' : 'differ, each travels in its own part of the stream as between the parts of a clip' } : {}),
      ...(copied ? {} : { encodedBecause: why, encode: { codec: 'libx264', twoPass: true, rate: rateFor(cfg, cfg.formatKeys.master), args: encodeArgs!.join(' ') } }),
      sha256: sha256(out),
      cutSeconds: Number((ip.frames / cfg.fps).toFixed(4)),
      durationSeconds: Number((p.frames / cfg.fps).toFixed(4)),
      intro: { file: relative(ROOT, intro), sha256: sha256(intro), prompt: ix?.prompt ?? null, firstKeySeconds: ix?.firstKeySeconds ?? null, lastKeySeconds: ix?.lastKeySeconds ?? null, submitSeconds: ix?.submitSeconds ?? null },
      clip: { file: relative(ROOT, clip), sha256: sha256(clip), first: clipRec?.first ?? null, last: clipRec?.last ?? null },
      probe: p,
      seconds: (Date.now() - t0) / 1000,
      date: new Date().toISOString(),
    },
  })
  console.log(stop + ': ' + relative(ROOT, out) + ', ' + ip.frames + ' + ' + cp.frames + ' = ' + p.frames + ' frames, ' + (copied ? 'joined without encoding' : 'encoded once at ' + cfg.raw.export.bitrateMbps + ' Mbps (' + why.join('; ') + ')'))
  return true
}

interface CheckLine { stop: string; pass: boolean; failures: string[]; frames: { intro: number | null; clip: number | null; post: number | null }; format: string | null; fps: string | null; introSeconds: number | null; holdBeforeSubmitSeconds: number | null; joinedWithoutEncoding: boolean | null; cutPsnr: number | string | null; lastIntroPsnr: number | string | null }

function db(v: number): number | string {
  return v === Infinity ? 'identical' : Number(v.toFixed(2))
}

function checkStop(cfg: Config, posts: PostsConfig, stop: string): CheckLine {
  const master = cfg.formats[cfg.formatKeys.master]!
  const fails: string[] = []
  const intro = introFile(stop)
  const clip = clipFile(stop)
  const post = postFile(stop)
  const ip = probeVideo(intro)
  const cp = clip ? probeVideo(clip) : null
  const pp = probeVideo(post)
  const line: CheckLine = { stop, pass: false, failures: fails, frames: { intro: ip?.frames ?? null, clip: cp?.frames ?? null, post: pp?.frames ?? null }, format: null, fps: null, introSeconds: null, holdBeforeSubmitSeconds: null, joinedWithoutEncoding: null, cutPsnr: null, lastIntroPsnr: null }
  const wantFps = cfg.fps + '/1'
  const formatOf = (name: string, file: string, p: Probe): void => {
    const s = streamInfo(file)
    if (p.width !== master.width || p.height !== master.height) fails.push(name + ' is ' + p.width + ' x ' + p.height)
    if (p.fps !== wantFps) fails.push(name + ' runs at ' + p.fps)
    if (p.codec !== cfg.raw.export.videoCodec) fails.push(name + ' codec is ' + p.codec)
    if (p.pixFmt !== 'yuv420p') fails.push(name + ' pixel format is ' + p.pixFmt)
    if (s.audioStreams !== 0 || s.streams !== 1) fails.push(name + ' has ' + s.streams + ' streams, ' + s.audioStreams + ' of them audio')
  }
  if (!ip) fails.push('no intro')
  else {
    formatOf('intro', intro, ip)
    if (!evenSteps(intro)) fails.push('intro has uneven frame times')
    line.introSeconds = ip.frames / cfg.fps
    if (line.introSeconds > posts.introMaxSeconds + 1e-9 || ip.durationSeconds > posts.introMaxSeconds + 1e-3) fails.push('intro is ' + line.introSeconds.toFixed(3) + ' s, over posts.introMaxSeconds')
    const ix = introExtra(stop)
    if (!ix) fails.push('intro has no record')
    else {
      line.holdBeforeSubmitSeconds = ix.holdBeforeSubmitSeconds
      if (ix.prompt !== posts.prompts[stop]) fails.push('intro record holds another prompt')
      if (ix.frames !== ip.frames) fails.push('intro record says ' + ix.frames + ' frames')
      if (ix.sha256 !== sha256(intro)) fails.push('intro record is of another file')
      if (ix.holdBeforeSubmitSeconds < posts.readHoldSeconds - 1e-9) fails.push('full prompt is held ' + ix.holdBeforeSubmitSeconds.toFixed(3) + ' s, under posts.readHoldSeconds')
      if (Math.round(ix.submitSeconds * cfg.fps) !== ip.frames - 1) fails.push('the submit is not the last frame')
    }
  }
  if (!cp) fails.push('no clip yet')
  if (!pp) fails.push('no post')
  else {
    formatOf('post', post, pp)
    line.format = pp.width + 'x' + pp.height + ' ' + pp.codec + ' ' + pp.pixFmt
    line.fps = pp.fps
    const rec = readRecord(post)
    line.joinedWithoutEncoding = (rec?.extra?.joinedWithoutEncoding as boolean | undefined) ?? null
    if (!rec) fails.push('post has no record')
    else if (rec.extra?.sha256 !== sha256(post)) fails.push('post record is of another file')
  }
  if (ip && cp && pp && clip) {
    if (pp.frames !== ip.frames + cp.frames) fails.push('post has ' + pp.frames + ' frames, intro and clip have ' + (ip.frames + cp.frames))
    const rec = readRecord(post)
    const made = rec?.extra as { intro?: { sha256?: string }; clip?: { sha256?: string } } | undefined
    if (made?.intro?.sha256 !== sha256(intro)) fails.push('post was made from another intro')
    if (made?.clip?.sha256 !== sha256(clip)) fails.push('post was made from another clip')
    if (line.joinedWithoutEncoding ? !timesKept(post, intro, clip) : !evenSteps(post)) fails.push('post has frame times that are not those of the intro and the clip')
    const dir = join(tempDir(WORK, 'post'), 'check-' + stop)
    rmSync(dir, { recursive: true, force: true })
    mkdirSync(dir, { recursive: true })
    const png = (name: string, video: string, index: number): string => {
      const f = join(dir, name + '.png')
      decodeFramePng(video, index, f)
      return f
    }
    const cut = png('post-cut', post, ip.frames)
    const before = png('post-before-cut', post, ip.frames - 1)
    const clip0 = png('clip-0', clip, 0)
    const clip1 = png('clip-1', clip, 1)
    const introLast = png('intro-last', intro, ip.frames - 1)
    const cutPsnr = psnrPng(cut, clip0)
    const lastPsnr = psnrPng(before, introLast)
    line.cutPsnr = db(cutPsnr)
    line.lastIntroPsnr = db(lastPsnr)
    if (line.joinedWithoutEncoding) {
      if (cutPsnr !== Infinity) fails.push('first frame after the intro differs from the first frame of the clip (' + line.cutPsnr + ' dB)')
      if (lastPsnr !== Infinity) fails.push('last intro frame in the post differs from the intro (' + line.lastIntroPsnr + ' dB)')
    } else {
      if (cutPsnr <= psnrPng(cut, clip1) || cutPsnr <= psnrPng(cut, introLast)) fails.push('first frame after the intro is not the first frame of the clip (' + line.cutPsnr + ' dB)')
      if (lastPsnr <= psnrPng(before, clip0)) fails.push('frame before the cut is not the last intro frame (' + line.lastIntroPsnr + ' dB)')
    }
    rmSync(dir, { recursive: true, force: true })
  }
  line.pass = fails.length === 0
  return line
}

function check(cfg: Config, posts: PostsConfig, stops: string[]): boolean {
  const lines = stops.map((s) => checkStop(cfg, posts, s))
  for (const l of lines) {
    const f = l.frames
    console.log(
      l.stop.padEnd(8) + (l.pass ? 'PASS' : 'FAIL') + '  frames ' + (f.intro ?? '-') + ' + ' + (f.clip ?? '-') + ' = ' + (f.post ?? '-') + '  ' + (l.format ?? '-') + ' ' + (l.fps ?? '-') +
        '  intro ' + (l.introSeconds?.toFixed(3) ?? '-') + ' s of ' + posts.introMaxSeconds + '  hold ' + (l.holdBeforeSubmitSeconds?.toFixed(3) ?? '-') + ' s' +
        '  ' + (l.joinedWithoutEncoding === null ? '-' : l.joinedWithoutEncoding ? 'joined without encoding' : 'encoded once') + '  cut frame ' + (l.cutPsnr ?? '-') + (typeof l.cutPsnr === 'number' ? ' dB' : '') + (l.failures.length ? '  [' + l.failures.join('; ') + ']' : ''),
    )
  }
  const pass = lines.every((l) => l.pass)
  mkdirSync(POSTS, { recursive: true })
  writeFileSync(join(POSTS, 'check.json'), JSON.stringify({ date: new Date().toISOString(), pass, limits: { introMaxSeconds: posts.introMaxSeconds, readHoldSeconds: posts.readHoldSeconds, format: cfg.formatKeys.master, fps: cfg.fps }, stops: lines }, null, 1) + '\n')
  console.log('check ' + (pass ? 'passed' : 'failed') + ': ' + lines.filter((l) => l.pass).length + ' of ' + lines.length + ' stops, written to ' + relative(ROOT, join(POSTS, 'check.json')))
  return pass
}

function sheet(cfg: Config, stop: string): boolean {
  const intro = introFile(stop)
  const ix = introExtra(stop)
  const p = probeVideo(intro)
  if (!p || !ix) {
    console.log(stop + ': skipped, no intro with a record')
    return false
  }
  const { phonePreviewWidthPx: cell, contactSheetFrames: count, maxImageLongEdgePx: limit } = cfg.raw.critics
  const columns = Math.max(1, Math.floor(limit / cell))
  const last = p.frames - 1
  const picks = [...new Set(Array.from({ length: count }, (_, i) => Math.round((i * last) / (count - 1))))]
  const rows = Math.ceil(picks.length / columns)
  const gap = 8
  const cellH = Math.round((cell * p.height) / p.width / 2) * 2
  const box = ix.promptBox
  const margin = 24
  const cropW = Math.min(limit, p.width, box.width + 2 * margin)
  const cropH = Math.min(p.height, box.height + 2 * margin)
  const cropX = Math.max(0, Math.min(p.width - cropW, Math.round(box.x + box.width / 2 - cropW / 2)))
  const cropY = Math.max(0, Math.min(p.height - cropH, box.y - margin))
  const gridW = columns * cell + (columns + 1) * gap
  const width = Math.max(gridW, cropW)
  const height = rows * cellH + (rows + 1) * gap + cropH + gap
  if (Math.max(width, height) > limit) throw new Error('sheet of ' + stop + ' would be ' + width + ' x ' + height + ', over critics.maxImageLongEdgePx')
  const rgb = 'scale=flags=lanczos+accurate_rnd+full_chroma_int:in_range=tv:in_color_matrix=bt709:out_range=pc,format=rgb24'
  const ground = '0x1c1c1c'
  const graph =
    '[0:v]' + rgb + ',split[a][b];' +
    "[a]select='" + picks.map((n) => 'eq(n\\,' + n + ')').join('+') + "',scale=" + cell + ':' + cellH + ':flags=lanczos,tile=' + columns + 'x' + rows + ':margin=' + gap + ':padding=' + gap + ':color=' + ground + ',pad=' + width + ':ih:(ow-iw)/2:0:color=' + ground + ',setpts=0[grid];' +
    "[b]select='eq(n\\," + (last - 1) + ")',crop=" + cropW + ':' + cropH + ':' + cropX + ':' + cropY + ',pad=' + width + ':ih+' + gap + ':(ow-iw)/2:0:color=' + ground + ',setpts=0[box];' +
    '[grid][box]vstack=inputs=2[v]'
  const out = join(POSTS, 'sheet-' + stop + '.png')
  ff(['-y', '-i', intro, '-filter_complex', graph, '-map', '[v]', '-frames:v', '1', '-fps_mode', 'passthrough', out], 'sheet')
  writeFileSync(out + '.json', JSON.stringify({ stop, intro: relative(ROOT, intro), introSha256: ix.sha256, frames: picks, frameWidthPx: cell, columns, crop: { frame: last - 1, x: cropX, y: cropY, width: cropW, height: cropH, scale: 1 }, width, height, date: new Date().toISOString() }, null, 1) + '\n')
  console.log(stop + ': ' + relative(ROOT, out) + ', ' + picks.length + ' frames at ' + cell + ' px and the prompt box of frame ' + (last - 1) + ' at native size, ' + width + ' x ' + height)
  return true
}

function main(): void {
  const cfg = loadConfig()
  const a = args()
  if (a.stop && !cfg.stopIds.includes(a.stop)) {
    console.error('post: --stop must be one of ' + cfg.stopIds.join(', '))
    process.exit(2)
  }
  const stops = a.stop ? [a.stop] : cfg.stopIds
  const posts = postsConfig(cfg)
  mkdirSync(POSTS, { recursive: true })
  if (a.check) {
    if (!check(cfg, posts, stops)) process.exit(1)
    return
  }
  if (a.sheets) {
    const made = stops.filter((s) => sheet(cfg, s)).length
    console.log(made + ' of ' + stops.length + ' sheets made')
    if (made !== stops.length) process.exit(1)
    return
  }
  const made = stops.filter((s) => makePost(cfg, s, Boolean(a.encode))).length
  console.log(made + ' of ' + stops.length + ' posts made')
  if (a.stop && made === 0) process.exit(1)
}

if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try {
    main()
  } catch (e: unknown) {
    console.error('post failed: ' + (e instanceof Error ? e.message : String(e)))
    process.exit(1)
  }
}
