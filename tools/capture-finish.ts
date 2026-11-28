// The last step after a capture on your own machine. It lays the subtitle strip over the captured picture, adds the approved
// sound without encoding it again, and writes the release films with the house names. It draws nothing.
//
//   node node_modules/tsx/dist/cli.mjs tools/capture-finish.ts                    after the 4K capture
//   node node_modules/tsx/dist/cli.mjs tools/capture-finish.ts --format master    after a 1920 by 1080 capture
//
//   --format NAME    uhd (default) or master: which capture is finished
//   --capture FILE   the captured film (default out/work/capture/<format>-r2-final/grand-tour-<format>-60fps.mp4)
//   --out DIR        where the release goes (default out/release)
//   --preset NAME    x264 preset (default slow)
//   --allow-short    for a test on a piece of the film: do not insist on the whole film and its manifest
//
// From a 4K capture it writes two films: the 4K release and a 1920 by 1080 film scaled from the same picture.
// From a 1920 by 1080 capture it writes one film. Exit code 0 when every check held, 1 otherwise.

import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { createReadStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { ROOT, WORK, args, formatId, freeGb, loadConfig } from './lib/common'
import { FFMPEG, FFPROBE } from './lib/encode'
import { HAND, ensureHandoffFiles, loadFacts } from './lib/handoff'

interface Probe { codec: string; width: number; height: number; fps: string; pixFmt: string; packets: number; seconds: number; audio: string | null; audioSeconds: number | null; formatSeconds: number; bytes: number }

const a = args()
const cfg = loadConfig()
const loaded = loadFacts()
if (!loaded) {
  console.error('capture-finish: STOP. handoff/local-render/facts.json is missing. Pull the newest main of the repo.')
  process.exit(1)
}
const facts = loaded
const format = formatId(cfg, a.format ?? 'uhd')
const size = cfg.formats[format]!
const fps = cfg.fps * 2
const wantFrames = cfg.frameCount * 2
const capture = resolve(a.capture ?? join(WORK, 'capture', format + '-r2-final', 'grand-tour-' + format + '-' + fps + 'fps.mp4'))
const OUT = resolve(a.out ?? join(ROOT, 'out', 'release'))
const preset = a.preset ?? 'slow'
const short = a['allow-short'] === 'true'
const TAGS = 'setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv'
const PROJECT = 'Solar System Fly-Through'

function fail(msg: string): never {
  console.error('capture-finish: STOP. ' + msg)
  process.exit(1)
}

function probe(file: string): Probe {
  const r = spawnSync(FFPROBE, ['-v', 'error', '-count_packets', '-show_entries', 'stream=codec_type,codec_name,width,height,r_frame_rate,pix_fmt,nb_read_packets,duration:format=duration', '-of', 'json', file], { encoding: 'utf8', maxBuffer: 1 << 24 })
  if (r.status !== 0) fail('ffprobe could not read ' + file + ': ' + (r.stderr ?? '').slice(-300))
  const j = JSON.parse(r.stdout) as { streams: Record<string, string | number>[]; format: { duration: string } }
  const v = j.streams.find((s) => s.codec_type === 'video')
  const au = j.streams.find((s) => s.codec_type === 'audio')
  if (!v) fail(file + ' has no picture.')
  return {
    codec: String(v.codec_name), width: Number(v.width), height: Number(v.height), fps: String(v.r_frame_rate), pixFmt: String(v.pix_fmt), packets: Number(v.nb_read_packets), seconds: Number(v.duration),
    audio: au ? String(au.codec_name) : null, audioSeconds: au ? Number(au.duration) : null, formatSeconds: Number(j.format.duration), bytes: statSync(file).size,
  }
}

function sha256(file: string): Promise<string> {
  return new Promise((done, bad) => {
    const h = createHash('sha256')
    createReadStream(file).on('data', (d) => h.update(d)).on('end', () => done(h.digest('hex'))).on('error', bad)
  })
}

function audioMd5(file: string, upTo: string): string | null {
  const r = spawnSync(FFMPEG, ['-hide_banner', '-loglevel', 'error', '-nostdin', '-i', file, '-t', upTo, '-map', '0:a:0', '-c', 'copy', '-f', 'md5', '-'], { encoding: 'utf8' })
  const m = /MD5=([0-9a-f]+)/.exec(r.stdout ?? '')
  return m ? m[1]! : null
}

// PSNR of the picture above the subtitles: frame kx of the film x against frame ky of the film y, both brought to 960 by 336.
function framePsnr(x: string, kx: number, xHeight: number, y: string, ky: number, yHeight: number, topShare: number): number | null {
  const at = (k: number): string => Math.max(0, k / fps - 0.004).toFixed(6)
  const cut = (h: number): string => 'crop=iw:' + Math.floor((h * topShare) / 2) * 2 + ':0:0,scale=960:336:flags=area,format=rgb24'
  const r = spawnSync(FFMPEG, ['-hide_banner', '-nostdin', '-ss', at(kx), '-i', x, '-ss', at(ky), '-i', y, '-frames:v', '1', '-lavfi', '[0:v]' + cut(xHeight) + '[p];[1:v]' + cut(yHeight) + '[q];[p][q]psnr', '-f', 'null', '-'], { encoding: 'utf8' })
  const m = /average:([0-9.]+|inf)/.exec(r.stderr ?? '')
  return m ? (m[1] === 'inf' ? Infinity : Number(m[1])) : null
}

// 1. what is there
if (!existsSync(capture)) fail('the captured film is not at ' + capture + '. Run the capture first, or name the file with --capture.')
const band = format === cfg.formatKeys.uhd ? facts.band : facts.bandMaster
if (!band) fail('there is no subtitle strip for the format ' + format + ' in handoff/local-render/facts.json.')
const bandFile = join(HAND, band.file)
const soundFile = join(HAND, facts.sound.file)
const got = ensureHandoffFiles(facts, [band.file, facts.sound.file])
if (got.problems.length > 0) fail(got.problems.join(' '))
if (band.width !== size.width) fail('the subtitle strip is ' + band.width + ' wide and the capture format is ' + size.width + ' wide.')
const enc = spawnSync(FFMPEG, ['-hide_banner', '-encoders'], { encoding: 'utf8' }).stdout ?? ''
const dec = spawnSync(FFMPEG, ['-hide_banner', '-decoders'], { encoding: 'utf8' }).stdout ?? ''
if (!/\blibx264\b/.test(enc) || !/\blibvpx-vp9\b/.test(dec)) fail('this ffmpeg lacks libx264 or the libvpx-vp9 decoder. Install a full build.')

const manifestFile = join(dirname(capture), 'manifest.json')
let graphics = 'not read'
if (existsSync(manifestFile)) {
  const m = JSON.parse(readFileSync(manifestFile, 'utf8')) as { complete: boolean; frames: number; rate: number; tier: string; format: string; engineHash: string; shutterDegrees: number; graphics: string; commit: string }
  graphics = m.graphics
  const wrong: string[] = []
  if (m.engineHash !== facts.engineHash) wrong.push('engine hash ' + m.engineHash + ' instead of ' + facts.engineHash)
  if (m.rate !== 2) wrong.push('rate ' + m.rate + ' instead of 2')
  if (m.tier !== 'final') wrong.push('tier ' + m.tier + ' instead of final')
  if (m.format !== format) wrong.push('format ' + m.format + ' instead of ' + format)
  if (m.shutterDegrees !== 360) wrong.push('shutter ' + m.shutterDegrees + ' instead of 360')
  if (!short && (!m.complete || m.frames !== wantFrames)) wrong.push('the capture is not complete (' + m.frames + ' of ' + wantFrames + ' frames)')
  if (/swiftshader|llvmpipe|software|basic render/i.test(m.graphics) && a['allow-software'] !== 'true') wrong.push('it was drawn in software (' + m.graphics + ')')
  if (wrong.length > 0) fail('the capture beside ' + capture + ' is not the film that was asked for: ' + wrong.join('; ') + '.')
} else if (!short) fail('there is no manifest.json beside ' + capture + '. The film must come from tools/capture.ts.')

const src = probe(capture)
if (src.width !== size.width || src.height !== size.height) fail('the captured film is ' + src.width + ' by ' + src.height + ', not ' + size.width + ' by ' + size.height + '.')
if (src.fps !== fps + '/1') fail('the captured film runs at ' + src.fps + ', not ' + fps + ' frames a second.')
if (!short && src.packets !== wantFrames) fail('the captured film has ' + src.packets + ' frames, not ' + wantFrames + '.')
const frames = src.packets
const seconds = (frames / fps).toFixed(6)
// The whole film needs up to 6 GB for the release files and the working files beside them. A test piece (--allow-short) needs its share of that, at least half a GB.
const needGb = short ? Math.max(0.5, Math.ceil(((6 * frames) / wantFrames) * 10) / 10) : 6
if (freeGb() < needGb) fail('only ' + freeGb().toFixed(1) + ' GB are free here; the release needs up to ' + needGb + ' GB.')
mkdirSync(OUT, { recursive: true })

// 2. the films
const x264 = (level: string, crf: number, maxMbps: number): string[] => [
  '-c:v', 'libx264', '-preset', preset, '-profile:v', 'high', '-level:v', level, '-crf', String(crf), '-maxrate', maxMbps + 'M', '-bufsize', maxMbps * 2 + 'M',
  '-g', String(fps), '-keyint_min', String(fps), '-sc_threshold', '0', '-flags', '+cgop', '-bf', '3', '-refs', '4',
  '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', '-color_range', 'tv',
  '-r', String(fps), '-fps_mode', 'cfr', '-video_track_timescale', String(fps * 512),
]
const over = '[0:v]settb=1/' + fps + ',setpts=N[m];[1:v]settb=1/' + fps + ',setpts=N[s];[m][s]overlay=0:' + band.y + ':format=auto:eof_action=pass'
const small = ',scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int:in_range=tv:out_range=tv:in_color_matrix=bt709:out_color_matrix=bt709'

interface Job { name: string; filter: string; level: string; crf: number; maxMbps: number; width: number; height: number }
const jobs: Job[] = format === cfg.formatKeys.uhd
  ? [
      { name: PROJECT + ' - Without Prompt 4K 60 fps - 3840x2160.mp4', filter: over + ',format=yuv420p,' + TAGS + '[v]', level: '5.2', crf: 15, maxMbps: 80, width: 3840, height: 2160 },
      { name: PROJECT + ' - Without Prompt 60 fps from the 4K picture - 1920x1080.mp4', filter: over + small + ',format=yuv420p,' + TAGS + '[v]', level: '4.2', crf: 15, maxMbps: 40, width: 1920, height: 1080 },
    ]
  : [{ name: PROJECT + ' - Without Prompt 60 fps - 1920x1080.mp4', filter: over + ',format=yuv420p,' + TAGS + '[v]', level: '4.2', crf: 15, maxMbps: 40, width: 1920, height: 1080 }]

const report: Record<string, unknown> = { at: new Date().toISOString(), capture, graphics, frames, seconds: Number(seconds), source: src, films: [] as unknown[] }
const soundMd5 = audioMd5(soundFile, seconds)
let bad = 0
for (const job of jobs) {
  const out = join(OUT, job.name)
  const tmp = join(OUT, 'writing-' + job.width + '.mp4')
  rmSync(tmp, { force: true })
  console.log('capture-finish: writing ' + job.name + ' ...')
  const r = spawnSync(FFMPEG, [
    '-hide_banner', '-loglevel', 'error', '-stats', '-nostdin', '-y', '-i', capture, '-c:v', 'libvpx-vp9', '-i', bandFile, '-i', soundFile,
    '-filter_complex', job.filter, '-map', '[v]', '-map', '2:a:0', ...x264(job.level, job.crf, job.maxMbps), '-c:a', 'copy', '-t', seconds, '-movflags', '+faststart', tmp,
  ], { stdio: 'inherit' })
  if (r.status !== 0 || !existsSync(tmp)) fail('ffmpeg did not write ' + job.name + '.')
  rmSync(out, { force: true })
  renameSync(tmp, out)
  const p = probe(out)
  const notes: string[] = []
  if (p.width !== job.width || p.height !== job.height) notes.push('size ' + p.width + ' by ' + p.height)
  if (p.fps !== fps + '/1') notes.push('rate ' + p.fps)
  if (p.packets !== frames) notes.push(p.packets + ' frames instead of ' + frames)
  if (p.pixFmt !== 'yuv420p' || p.codec !== 'h264') notes.push('codec ' + p.codec + ' ' + p.pixFmt)
  if (Math.abs(p.seconds - Number(seconds)) > 0.02) notes.push('picture length ' + p.seconds + ' s instead of ' + seconds)
  if (p.audio === null) notes.push('no sound')
  if (p.bytes >= 2e9) notes.push('the file is ' + (p.bytes / 1e9).toFixed(2) + ' GB, over the 2 GB limit of the house rule')
  const md5 = audioMd5(out, seconds)
  const soundSame = soundMd5 !== null && md5 === soundMd5
  if (!soundSame && !short) notes.push('the sound is not the approved sound bit for bit')
  const picks = [Math.floor(frames * 0.11), Math.floor(frames * 0.5), Math.floor(frames * 0.93)].filter((k) => k >= 1 && k + 1 < frames)
  const share = (band.y - 8) / size.height
  const sync = picks.map((k) => ({ frame: k, same: framePsnr(out, k, job.height, capture, k, size.height, share), before: framePsnr(out, k, job.height, capture, k - 1, size.height, share), after: framePsnr(out, k, job.height, capture, k + 1, size.height, share) }))
  for (const t of sync) {
    if (t.same === null || t.before === null || t.after === null) notes.push('frame ' + t.frame + ' could not be compared with the capture')
    else if (t.same + 0.01 < Math.max(t.before, t.after)) notes.push('frame ' + t.frame + ' of the film looks more like a neighbour frame of the capture than like its own (' + t.same.toFixed(2) + ' dB against ' + t.before.toFixed(2) + ' and ' + t.after.toFixed(2) + ' dB): the picture is out of step')
  }
  const sum = await sha256(out)
  ;(report.films as unknown[]).push({ name: job.name, file: out, bytes: p.bytes, sha256: sum, probe: p, soundSame, sync, notes })
  console.log('capture-finish: ' + job.name)
  console.log('  ' + p.width + ' by ' + p.height + ', ' + p.fps + ' fps, ' + p.packets + ' frames, ' + p.formatSeconds.toFixed(3) + ' s, ' + (p.bytes / 1e6).toFixed(1) + ' MB, sound ' + (p.audio ?? 'none') + (soundSame ? ' (the approved sound, bit for bit)' : ''))
  console.log('  sha256 ' + sum)
  console.log('  in step with the capture (PSNR above the subtitles, own frame against the frame before and after): ' + sync.map((t) => 'frame ' + t.frame + ' ' + [t.same, t.before, t.after].map((v) => (v === null ? 'n/a' : v === Infinity ? 'equal' : v.toFixed(1))).join(' / ')).join('; '))
  if (notes.length > 0) {
    bad++
    for (const n of notes) console.log('  WRONG: ' + n)
  }
}
report.ok = bad === 0
writeFileSync(join(OUT, 'finish-report.json'), JSON.stringify(report, null, 2) + '\n')
console.log('capture-finish: the report is ' + join(OUT, 'finish-report.json'))
console.log(bad === 0 ? 'FINISH: PASS' : 'FINISH: STOP, ' + bad + ' film(s) with wrong values above')
process.exit(bad === 0 ? 0 : 1)
