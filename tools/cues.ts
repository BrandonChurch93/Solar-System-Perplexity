import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { config, type Segment } from '../src/config'
import { clipRange, coverWindow, stopSegments } from '../src/director/timeline'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const CUES = join(ROOT, 'cut/CUES.md')
const SHOTS = join(ROOT, 'cut/SHOTS.md')
const fps = config.fps

interface Cue { segment: string; what: string; frame: number; seconds: number; sound: string }
interface Intro { stop: string; prompt: string; frames: number; fps: number; firstKeySeconds: number; lastKeySeconds: number; submitSeconds: number; keySeconds: number[] }

const time = (s: number): string => {
  const ms = Math.round(s * 1000)
  const m = Math.floor(ms / 60000)
  return String(m).padStart(2, '0') + ':' + ((ms - m * 60000) / 1000).toFixed(3).padStart(6, '0')
}
const code = (frame: number): string => {
  const two = (n: number): string => String(n).padStart(2, '0')
  const s = Math.floor(frame / fps)
  return two(Math.floor(s / 3600)) + ':' + two(Math.floor(s / 60) % 60) + ':' + two(s % 60) + ':' + two(frame % fps)
}

function sound(s: Segment): string {
  const plasma = s.stop === 'sun' ? ' Plasma: a low roar with crackle, loudest here.' : ''
  if (s.kind === 'hold') return 'Music lands on the first frame and carries the hold.' + (s.stop === 'sun' ? ' Plasma: a low roar, further off.' : '')
  if (s.kind === 'dive') return 'The rush of the dive: a rising rush of air from the first frame that peaks at the cover center.'
  if (s.kind === 'terrain') return (s.index === 0 ? 'The film opens here at full level, with no fade in. ' : '') + 'The hush: music drops to a quiet bed on the first frame, under a soft air tone.' + plasma
  if (s.kind === 'rise') return 'A shorter rush that peaks at the cover center and opens out after it.'
  if (s.kind === 'travel') return 'Music builds from the first frame toward the next hold.' + (s.id === 'mars.travel' ? ' A few rocks pass close to the lens: one low pass for each.' : '')
  if (s.kind === 'retreat') return 'Music begins to fall away.'
  if (s.kind === 'lookback') return 'Music lands for the last time and thins to one held tone.'
  return 'All sound fades with the picture. The last frame is silent.'
}

function cuesOf(segs: Segment[]): Cue[] {
  const out: Cue[] = []
  for (const s of segs) {
    out.push({ segment: s.id, what: 'start of ' + s.kind, frame: s.firstFrame, seconds: s.start, sound: sound(s) })
    const w = coverWindow(s)
    if (w) {
      const c = config.raw.cover
      const center = s.start + (s.kind === 'dive' ? c.diveCenterFraction : c.riseCenterFraction) * (s.end - s.start)
      out.push({ segment: s.id, what: 'center of the cover', frame: w.centerFrame, seconds: center, sound: 'The peak of the rush. The cover runs from frame ' + w.firstFrame + ' to ' + w.lastFrame + ' and the view changes under it.' })
    }
  }
  return out
}

function intro(stop: string): { rec: Intro; from: string } | null {
  for (const dir of ['out/posts', 'out/work/posts']) {
    const f = join(ROOT, dir, 'intro-' + stop + '.mp4.json')
    if (!existsSync(f)) continue
    const x = (JSON.parse(readFileSync(f, 'utf8')) as { extra?: Intro }).extra
    if (!x || typeof x.frames !== 'number' || typeof x.firstKeySeconds !== 'number' || typeof x.lastKeySeconds !== 'number' || typeof x.submitSeconds !== 'number') throw new Error(dir + '/intro-' + stop + '.mp4.json holds no key times')
    if (x.prompt !== (config.raw.posts.prompts as Record<string, string>)[stop]) throw new Error(dir + '/intro-' + stop + '.mp4.json holds another prompt than posts.prompts.' + stop)
    if (x.fps !== fps) throw new Error(dir + '/intro-' + stop + '.mp4.json is at ' + x.fps + ' frames per second')
    return { rec: x, from: dir }
  }
  return null
}

function build(): { text: string; missing: string[] } {
  const film = cuesOf(config.segments)
  const lines: string[] = [
    '# Cues',
    '',
    'Written by `npm run cues` (`tools/cues.ts`) from `segments`, `cover` and `posts` in `config/showcase.json` and from the records of the nine intros. `npm run cues -- --check` fails when this file or `cut/SHOTS.md` no longer matches the config.',
    '',
    'The film runs ' + time(config.durationSeconds) + ', ' + config.frameCount + ' frames at ' + fps + ' frames per second, with no sound. Time is minutes, seconds and thousandths. Timecode is hours, minutes, seconds and frames at ' + fps + ' frames per second, with no dropped frames. A frame number counts from 0.',
    '',
    '## The film',
    '',
    '| Segment | Cue | Time | Timecode | Frame | Sound |',
    '| --- | --- | --- | --- | --- | --- |',
    ...film.map((c) => '| `' + c.segment + '` | ' + c.what + ' | ' + time(c.seconds) + ' | ' + code(c.frame) + ' | ' + c.frame + ' | ' + c.sound + ' |'),
    '| | end of the film | ' + time(config.durationSeconds) + ' | ' + code(config.frameCount) + ' | ' + config.frameCount + ' | The last picture frame is frame ' + (config.frameCount - 1) + '. It is black and silent. |',
    '',
    '## Music',
    '',
  ]
  const holds = config.segments.filter((s) => s.kind === 'hold')
  const travels = config.segments.filter((s) => s.kind === 'travel')
  const terrains = config.segments.filter((s) => s.kind === 'terrain')
  const covers = film.filter((c) => c.what === 'center of the cover')
  const look = config.segments.find((s) => s.kind === 'lookback')
  const fade = config.segments.find((s) => s.kind === 'fade')
  lines.push(
    '- The opening: frame 0 is a finished picture with no fade in, so the sound starts at full level on the first frame. The hook is the first ' + config.raw.film.hookSeconds + ' seconds, to ' + time(config.raw.film.hookSeconds) + '.',
    '- Music builds through every travel, from its first frame to the first frame of the next hold: ' + travels.map((s) => time(s.start) + ' to ' + time(s.end)).join(', ') + '.',
    '- Music lands on the first frame of every hold: ' + holds.map((s) => time(s.start) + ' ' + s.stop).join(', ') + '.',
    '- Music drops to a quiet bed for every terrain view, the hush: ' + terrains.map((s) => time(s.start) + ' to ' + time(s.end)).join(', ') + '.',
    '- A rush of air peaks at the center of every cover: ' + covers.map((c) => time(c.seconds)).join(', ') + '.',
    ...(look && fade ? ['- The ending: music lands for the last time at ' + time(look.start) + ', the start of the lookback, and fades with the picture from ' + time(fade.start) + ' to silence at ' + time(fade.end) + '.'] : []),
    '',
    '## The clips',
    '',
    'A clip is cut from the same frames as the film. Its cues are the film\'s cues counted from the clip\'s first frame.',
    '',
    '| Clip | Segment | Cue | Time in the clip | Frame in the clip | Time in the film |',
    '| --- | --- | --- | --- | --- | --- |',
  )
  const clipCues = new Map<string, { cues: Cue[]; first: number; frames: number }>()
  for (const stop of config.stopIds) {
    const r = clipRange(stop)
    const cues = cuesOf(stopSegments(stop).filter((s) => s.kind !== 'travel' && s.firstFrame >= r.firstFrame && s.endFrame <= r.endFrame))
    clipCues.set(stop, { cues, first: r.firstFrame, frames: r.endFrame - r.firstFrame })
    for (const c of cues) lines.push('| `' + stop + '` | `' + c.segment + '` | ' + c.what + ' | ' + time(c.seconds - r.firstFrame / fps) + ' | ' + (c.frame - r.firstFrame) + ' | ' + time(c.seconds) + ' |')
    lines.push('| `' + stop + '` | | end of the clip | ' + time((r.endFrame - r.firstFrame) / fps) + ' | ' + (r.endFrame - r.firstFrame) + ' | ' + time(r.endFrame / fps) + ' |')
  }
  lines.push(
    '',
    '## The posts',
    '',
    'A post is the intro, then a hard cut to the first frame of the stop\'s clip. Times count from the first frame of the post. The submit is on the last frame of the intro and the cut is the next frame. Typing sound runs from the first key to the last key, with one key for each character of the prompt.',
    '',
    '| Post | Prompt | Keys | First key | Last key | Submit | Cut to the clip | Frame of the cut | End of the post | Record |',
    '| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |',
  )
  const missing: string[] = []
  const intros = new Map<string, Intro>()
  for (const stop of config.stopIds) {
    const got = intro(stop)
    const prompt = (config.raw.posts.prompts as Record<string, string>)[stop]!
    if (!got) {
      missing.push(stop)
      lines.push('| `' + stop + '` | ' + prompt + ' | | no intro record | | | | | | none in `out/posts/` or `out/work/posts/` |')
      continue
    }
    const x = got.rec
    intros.set(stop, x)
    const cut = x.frames / fps
    lines.push('| `' + stop + '` | ' + prompt + ' | ' + (x.keySeconds?.length ?? '') + ' | ' + time(x.firstKeySeconds) + ' | ' + time(x.lastKeySeconds) + ' | ' + time(x.submitSeconds) + ' | ' + time(cut) + ' | ' + x.frames + ' | ' + time(cut + clipCues.get(stop)!.frames / fps) + ' | `' + got.from + '/intro-' + stop + '.mp4.json` |')
  }
  if (intros.size) {
    lines.push('', 'The time of every key, in seconds from the first frame of the post:', '')
    for (const [stop, x] of intros) if (x.keySeconds?.length) lines.push('- `' + stop + '`: ' + x.keySeconds.map((k) => k.toFixed(3)).join(' '))
    lines.push('', 'The clip\'s cues inside each post, after the cut:', '', '| Post | Segment | Cue | Time in the post | Frame in the post |', '| --- | --- | --- | --- | --- |')
    for (const [stop, x] of intros) {
      const c = clipCues.get(stop)!
      for (const q of c.cues) lines.push('| `' + stop + '` | `' + q.segment + '` | ' + q.what + ' | ' + time(x.frames / fps + q.seconds - c.first / fps) + ' | ' + (x.frames + q.frame - c.first) + ' |')
    }
  }
  lines.push('')
  return { text: lines.join('\n'), missing }
}

function firstDifference(a: string, b: string): string {
  const x = a.split('\n')
  const y = b.split('\n')
  for (let i = 0; i < Math.max(x.length, y.length); i++) if (x[i] !== y[i]) return 'line ' + (i + 1) + ' is "' + (x[i] ?? '').slice(0, 160) + '", the config gives "' + (y[i] ?? '').slice(0, 160) + '"'
  return 'same'
}

function shotsNow(): string {
  const dir = mkdtempSync(join(tmpdir(), 'shots-'))
  mkdirSync(join(dir, 'cut'))
  const r = spawnSync(join(ROOT, 'node_modules/.bin/tsx'), [join(ROOT, 'tools/shots.ts')], { cwd: dir, encoding: 'utf8' })
  const f = join(dir, 'cut/SHOTS.md')
  const text = r.status === 0 && existsSync(f) ? readFileSync(f, 'utf8') : null
  rmSync(dir, { recursive: true, force: true })
  if (text === null) throw new Error('tools/shots.ts did not run: ' + (r.stderr ?? '').slice(-400))
  return text
}

function shotsRows(text: string): string[] {
  const bad: string[] = []
  const rows = text.split('\n').filter((l) => l.startsWith('| `')).map((l) => l.split('|').map((c) => c.trim()))
  if (rows.length !== config.segments.length) bad.push(rows.length + ' rows, the config has ' + config.segments.length + ' segments')
  config.segments.forEach((s, i) => {
    const r = rows[i]
    if (!r) return
    const frames = s.firstFrame + ' to ' + (s.endFrame - 1)
    if (r[1] !== '`' + s.id + '`') bad.push('row ' + (i + 1) + ' is ' + r[1] + ', the config has ' + s.id)
    else if (r[3] !== frames) bad.push(s.id + ' has frames ' + r[3] + ', the config gives ' + frames)
  })
  return bad
}

const { text, missing } = build()
if (process.argv.includes('--check')) {
  const fails: string[] = []
  if (!existsSync(CUES)) fails.push('cut/CUES.md does not exist')
  else {
    const d = firstDifference(readFileSync(CUES, 'utf8'), text)
    if (d !== 'same') fails.push('cut/CUES.md: ' + d)
  }
  if (!existsSync(SHOTS)) fails.push('cut/SHOTS.md does not exist')
  else {
    const have = readFileSync(SHOTS, 'utf8')
    const rows = shotsRows(have)
    if (rows.length) fails.push('cut/SHOTS.md against segments: ' + rows.slice(0, 4).join('; '))
    const d = firstDifference(have, shotsNow())
    if (d !== 'same') fails.push('cut/SHOTS.md is not what tools/shots.ts writes now: ' + d)
  }
  for (const f of fails) console.log('FAIL ' + f)
  if (missing.length) console.log('NOTE no intro record for ' + missing.join(', ') + '; the posts table says so')
  if (fails.length === 0) console.log('PASS cut/CUES.md and cut/SHOTS.md match the config: ' + config.segments.length + ' segments, ' + config.frameCount + ' frames, ' + (config.stopIds.length - missing.length) + ' posts with key times')
  process.exit(fails.length ? 1 : 0)
}
mkdirSync(dirname(CUES), { recursive: true })
writeFileSync(CUES, text)
console.log('cut/CUES.md: ' + config.segments.length + ' segments, ' + config.segments.filter((s) => coverWindow(s)).length + ' covers, ' + (config.stopIds.length - missing.length) + ' of ' + config.stopIds.length + ' posts with key times' + (missing.length ? '; no intro record for ' + missing.join(', ') : ''))
