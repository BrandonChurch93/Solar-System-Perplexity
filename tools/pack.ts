import { copyFileSync, existsSync, readFileSync, readdirSync, rmSync } from 'node:fs'
import { basename, join, relative } from 'node:path'
import type { Segment, StopDef } from '../src/config'
import { judgedFrames } from '../src/director/timeline'
import { samplesOf } from './lib/samples'
import { framesFolder, leave } from './pack/frames'
import { polishBuilds, type Selection } from './select'
import { args, loadConfig, recordMatches, requireDisk, ROOT, WORK, writeRecord, type OutputRecord } from './lib/common'
import { Capture, cached, chunk, filmSheets, fingerprint, image, imageRevision, json, judged, outputFolder, padFrame, padImage, safeRecord, sheetFrames, spread, stopDependencies, type FrameSpec, type Rect } from './lib/render'

type Critic = 'R1' | 'R2' | 'R3' | 'R4' | 'R5' | 'R6' | 'R7' | 'R8'
interface Art { path: string; record: OutputRecord; signature: string; key: Record<string, unknown>; name?: string }
interface Page { path: string; rectangles: Rect[] }
interface Source { path: string; key: Record<string, unknown>; record?: OutputRecord }

const cfg = loadConfig()
requireDisk(cfg)
const a = args()
const phase = Number(a.phase)
const round = Number(a.round)
if ([2, 3, 4, 5, 6].includes(phase) === false || Number.isSafeInteger(round) === false || round < 1) throw new Error('expected --phase 2|3|4|5|6 --round R [--stop ID]')
const selectedStop = cfg.stops.find((s) => s.id === a.stop)
if ((a.stop && selectedStop === undefined) || ((phase === 3 || phase === 4) && selectedStop === undefined)) throw new Error('expected --stop ID')
const whole = phase === 5 || phase === 6
const roundId = 'round-' + String(round).padStart(3, '0')
const allPacks = outputFolder(join(WORK, 'packs'))
const roundDir = outputFolder(join(allPacks, roundId))
const privateDir = outputFolder(join(allPacks, 'keys'))
const stage = outputFolder(join(allPacks, '.cache', roundId))
const waiting = framesFolder(stage)
const temp = waiting.dir
const used = new Set<string>()
if (waiting.waiting.length > 0) console.log('pack ' + roundId + ': frames of a stopped run under ' + relative(ROOT, temp) + ' with their records: ' + waiting.waiting.length + ', taken up where this build asks for them')
const capture = new Capture(cfg, a.format ?? (phase === 2 ? 'preview' : 'master'))
const tier = a.tier ?? (phase === 2 ? 'draft' : 'final')
const motionTier = a['motion-tier'] ?? (phase === 2 ? tier : a.tier === 'final' ? 'final' : 'review')
const { maxImageLongEdgePx: limit, maxFilesPerMessage, contactSheetFrames, phonePreviewWidthPx } = cfg.raw.critics
const maxImages = maxFilesPerMessage - 1
if (maxImages < 1) throw new Error('critics.maxFilesPerMessage must allow a manifest and an image')
const revision = imageRevision()
const frameDims = cfg.formats[capture.format]
const size = [frameDims.width, frameDims.height]
const key: Record<string, Record<string, unknown>> = {}
const outputDirs = new Set<string>()
const stopKinds = new Set(['hold', 'dive', 'terrain', 'rise'])
const only = a.only ? new Set(a.only.split(',')) : null
const stressTier = a['stress-tier'] ?? cfg.raw.quality.stress.tier
const span = a.frames ? /^(\d+)-(\d+)$/.exec(a.frames) : null
const placeWindow = a['place-window'] !== undefined
if (a.frames && (span === null || only === null || only.size !== 1)) throw new Error('--frames A-B goes with --only and one sheet')
const started = Date.now()

function renderSegment(segment: Segment, fallback: string): Promise<Source> {
  return renderSource(judged(cfg, segment), fallback, true)
}

async function renderSource(frame: number, fallback: string, keep: boolean): Promise<Source> {
  const specific = keep ? undefined : join(temp, 'f' + padFrame(frame) + '-' + fallback + '.png')
  if (specific) used.add(specific)
  const still = await capture.still(frame, fallback, specific)
  return { path: still.file, record: still.record, key: { kind: 'frame', frame, segment: cfg.segments.find((s) => frame >= s.firstFrame && frame < s.endFrame)?.id } }
}

function approvedSource(stop: StopDef, view: 'hold' | 'terrain'): Source {
  const asset = view === 'hold' ? stop.hero : stop.close
  return { path: join(ROOT, asset), key: { kind: 'approved', stop: stop.id, view, asset } }
}

function simple(s: Source, name: string, extra: object = {}): Art {
  const file = join(stage, name + '.png')
  const record = s.record ?? capture.record(tier, [])
  const signature = JSON.stringify([s.key, fingerprint(s.path), extra, limit, revision])
  const prior = cached(file, record, Object.keys(record.stopHashes), signature)
  if (prior) return { path: file, record: prior, signature, key: s.key }
  image({ op: 'single', input: s.path, output: file, limit, ...extra })
  const outputRecord = { ...record, extra: { signature, ...s.key } }
  writeRecord(file, outputRecord)
  return { path: file, record: outputRecord, signature, key: s.key }
}

function pages(op: 'pair' | 'crops', name: string, inputs: Source[], knobs: object = {}): Art[] {
  const output = join(stage, name)
  const index = output + '-index.json'
  const frameRecord = inputs.find((s) => s.record)?.record ?? capture.record(tier, [])
  const signature = JSON.stringify([op, inputs.map((s) => [s.key, fingerprint(s.path)]), knobs, limit, revision])
  let generated = (cached(index, frameRecord, Object.keys(frameRecord.stopHashes), signature)?.extra?.pages ?? []) as Page[]
  if (generated.length === 0 || generated.some((p) => cached(p.path, frameRecord, Object.keys(frameRecord.stopHashes), signature) === null)) {
    generated = image<Page[]>({ op, output, limit, input: inputs[0].path, a: inputs[0].path, b: inputs[1]?.path, ...knobs })
    if (op === 'pair') {
      const configs = (knobs as { together?: boolean }).together ? [output + '.png'] : [output + '-a.png', output + '-b.png']
      generated.unshift(...configs.map((path) => ({ path, rectangles: [] })))
    }
    for (const p of generated) writeRecord(p.path, { ...frameRecord, extra: { signature, rectangles: p.rectangles } })
    json(index, generated)
    writeRecord(index, { ...frameRecord, extra: { signature, pages: generated } })
  }
  return generated.map((p) => {
    const index = p.path.endsWith('-a.png') ? 0 : p.path.endsWith('-b.png') ? 1 : null
    const key = { sources: index === null ? inputs.map((s) => s.key) : [inputs[index].key], rectangles: p.rectangles }
    return { path: p.path, record: frameRecord, signature, key }
  })
}

async function contact(name: string, frames: FrameSpec[], quality: string, info: Record<string, unknown>): Promise<Art> {
  const path = join(stage, name + '.png')
  const record = await capture.sheet(path, frames, quality, temp, info, limit)
  return { path, record, signature: String(record.extra?.signature), key: { ...info, frames: frames.map((f) => f.frame) } }
}

function shuffle<T>(input: T[]): T[] {
  let state = (cfg.seed + round) >>> 0
  const shuffled = [...input]
  for (let i = shuffled.length - 1; i > 0; i--) {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0
    const j = Math.floor(state / 0x100000000 * (i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function divided(groups: Art[][]): Art[][] {
  const parts: Art[][] = []
  let current: Art[] = []
  for (const group of groups) {
    if (group.length > maxImages) throw new Error('a pack group does not fit in a critic folder')
    if (current.length + group.length > maxImages) {
      parts.push(current)
      current = []
    }
    current.push(...group)
  }
  if (current.length > 0) parts.push(current)
  return parts
}

function publish(critic: Critic, groups: Art[][], pattern = 'image', scope?: string): void {
  const parts = divided(groups)
  const base = scope ? critic + '-' + scope : critic
  for (const [i, files] of parts.entries()) {
    const name = parts.length === 1 ? base : base + '-part' + (i + 1)
    const dir = outputFolder(join(roundDir, name))
    outputDirs.add(name)
    const manifest: string[] = []
    for (const art of files) {
      const neutral = art.name ?? pattern + '-' + padImage(groups.flat().indexOf(art) + 1) + '.png'
      const output = join(dir, neutral)
      const provenance = join(privateDir, '.records', roundId, name, neutral)
      if (existsSync(output) === false || cached(provenance, art.record, Object.keys(art.record.stopHashes), art.signature) === null) {
        copyFileSync(art.path, output)
        json(provenance, { file: neutral })
        writeRecord(provenance, { ...art.record, extra: { ...art.record.extra, signature: art.signature } })
      }
      manifest.push(neutral)
      key[name + '/' + neutral] = art.key
    }
    for (const file of readdirSync(dir)) if (file.endsWith('.png') && manifest.includes(file) === false) rmSync(join(dir, file))
    const manifestPath = join(dir, 'manifest.json')
    json(manifestPath, { files: manifest })
    const provenance = join(privateDir, '.records', roundId, name, 'manifest.json')
    json(provenance, { files: manifest })
    const records = files.map((f) => f.record)
    writeRecord(provenance, { ...records[0], stopHashes: Object.assign({}, ...records.map((r) => r.stopHashes)), extra: { files: manifest } })
    console.log(dir + ' (' + manifest.length + ' images)')
  }
}

const singles = (items: Art[]): Art[][] => items.map((item) => [item])

async function blockout(): Promise<void> {
  const list: Art[] = []
  for (const [i, frames] of filmSheets(cfg, true).entries()) list.push(await contact('block-film-' + i, frames, tier, { kind: 'film', part: i + 1 }))
  for (const id of ['sun.terrain', 'mars.dive', 'mars.travel', 'ending.lookback']) {
    const s = cfg.segments.find((x) => x.id === id)
    if (s === undefined) throw new Error('blockout segment missing: ' + id)
    list.push(await contact('block-' + id, sheetFrames(cfg, s, false), tier, { kind: 'sheet', segment: id }))
  }
  publish('R4', singles(list), 'sheet')
}

async function stopImages(stops: StopDef[], withJury = whole === false): Promise<{ match: Art[][]; jury: Art[]; recognition: Art[] }> {
  const match: Art[][] = []
  const recognition: Art[] = []
  const jury: Art[] = []
  let pairIndex = 0
  for (const stop of stops) {
    for (const view of ['hold', 'terrain'] as const) {
      const segment = cfg.segments.find((x) => x.stop === stop.id && x.kind === view)
      if (segment === undefined) throw new Error('missing ' + view + ' segment for ' + stop.id)
      const film = await renderSegment(segment, tier)
      const approval = approvedSource(stop, view)
      const inputs = [approval, film]
      const images = pages('pair', 'match-' + segment.id, inputs)
      match.push(...chunk(images, 2).map((pair) => {
        const prefix = 'pair-' + padImage(++pairIndex)
        return pair.map((item, j) => ({ ...item, name: prefix + (j === 0 ? '-a.png' : '-b.png') }))
      }))
      if (withJury || view === 'hold') {
        const prepared = inputs.map((source, i) => simple(source, 'jury-' + segment.id + '-' + i, { size }))
        if (withJury) jury.push(...prepared)
        if (view === 'hold') recognition.push(...prepared)
      }
    }
  }
  return { match, jury, recognition }
}

async function stopPacks(stops: StopDef[]): Promise<void> {
  const { match, jury, recognition } = await stopImages(stops)
  publish('R1', match)
  if (jury.length > 0) publish('R2', singles(shuffle(jury)))
  publish('R8', singles(shuffle(recognition)))
}

async function recordPacks(stops: StopDef[]): Promise<void> {
  const recognition: Art[] = []
  for (const stop of stops) {
    const images = await stopImages([stop])
    publish('R1', images.match, 'image', stop.id)
    recognition.push(...images.recognition)
    const segments = cfg.segments.filter((s) => s.stop === stop.id && stopKinds.has(s.kind))
    await detail(segments, stop.id)
    await motion(segments, stop.id)
  }
  publish('R8', singles(shuffle(recognition)))
}

async function detail(segments: Segment[], scope?: string, frames?: Set<number>): Promise<void> {
  const groups: Art[][] = []
  const ids = new Set(segments.map((s) => s.id))
  const mine = judgedFrames().filter((x) => ids.has(x.segment))
  const strangers = [...(frames ?? [])].filter((f) => mine.some((x) => x.frame === f) === false)
  if (strangers.length > 0) throw new Error('select: not a judged frame of ' + (scope ?? 'the travels and the ending') + ': ' + strangers.join(', '))
  for (const j of mine.filter((x) => frames === undefined || frames.has(x.frame))) {
    const film = await renderSource(j.frame, tier, true)
    const items = [simple(film, 'detail-' + j.frame), ...pages('crops', 'detail-crop-' + j.frame, [film], { cover: true })]
    groups.push(...chunk(items, maxImages))
  }
  publish('R3', groups, 'image', scope)
}

const tile = (part: string, frame: number): string => join(stage, 'tiles', part, 'f' + padFrame(frame) + '-' + motionTier + '.png')

function tiles(part: string, specs: FrameSpec[], info: Record<string, unknown>): number[] | null {
  if (existsSync(join(stage, 'tiles', part)) === false) return null
  const frames = specs.map((s) => s.frame)
  if (cached(join(stage, 'motion-' + part + '.png'), capture.record(motionTier, frames), stopDependencies(frames), JSON.stringify([specs, info, limit, revision]))) return null
  const missing = frames.filter((frame) => {
    const record = safeRecord(tile(part, frame))
    return (record?.frame === frame && recordMatches(record, capture.record(motionTier, [frame]), stopDependencies([frame]))) === false
  })
  if (missing.length > 0) return missing
  for (const frame of frames) {
    const home = join(temp, 'f' + padFrame(frame) + '-' + motionTier + '.png')
    copyFileSync(tile(part, frame), home)
    copyFileSync(tile(part, frame) + '.json', home + '.json')
  }
  return []
}

async function sheet(part: string, specs: FrameSpec[], info: Record<string, unknown>): Promise<Art | null> {
  if (span) {
    for (const s of specs) if (s.frame >= Number(span[1]) && s.frame <= Number(span[2])) console.log((await capture.still(s.frame, motionTier, tile(part, s.frame))).file)
    return null
  }
  const missing = tiles(part, specs, info)
  if (missing && missing.length > 0) {
    if (a.join === undefined) throw new Error('sheet ' + part + ': no tile of this build for frames ' + missing.join(', ') + '; nothing rendered')
    console.log('sheet ' + part + ': not joined, no tile of this build for frames ' + missing.join(', '))
    return null
  }
  if (a.join && missing === null) return null
  const art = await contact('motion-' + part, specs, motionTier, info)
  if (a.join) console.log('sheet ' + part + ': joined from ' + specs.length + ' tiles')
  return art
}

async function motion(segments: Segment[], scope?: string, sheets?: Set<string>): Promise<void> {
  const list: Art[] = []
  const pick = sheets ?? only
  const known = segments.flatMap((s) => (s.kind === 'dive' || s.kind === 'rise' ? [s.id, s.id + '-cover'] : [s.id]))
  const strangers = [...(sheets ?? [])].filter((id) => known.includes(id) === false)
  if (strangers.length > 0) throw new Error('select: not a sheet of ' + (scope ?? 'the travels and the ending') + ': ' + strangers.join(', '))
  for (const s of segments) {
    if (pick === null || pick.has(s.id)) {
      const art = await sheet(s.id, sheetFrames(cfg, s, false), { kind: 'sheet', segment: s.id })
      if (art) list.push(art)
    }
    if ((s.kind === 'dive' || s.kind === 'rise') && (pick === null || pick.has(s.id + '-cover'))) {
      const art = await sheet(s.id + '-cover', sheetFrames(cfg, s, true, placeWindow), { kind: 'cover', segment: s.id })
      if (art) list.push(art)
    }
  }
  if (only === null && a.join === undefined) publish('R4', singles(list), 'sheet', scope)
}

async function part(segments: Segment[]): Promise<void> {
  const ids = new Set(segments.map((s) => s.id))
  if (only!.has('stills')) for (const j of judgedFrames().filter((x) => ids.has(x.segment))) console.log((await renderSource(j.frame, tier, true)).path)
  await motion(segments)
}

async function wholeJury(): Promise<void> {
  const judgedKinds = new Set(['hold', 'terrain', 'travel', 'lookback'])
  const items: Art[] = []
  for (const s of cfg.segments.filter((s) => judgedKinds.has(s.kind))) {
    const film = await renderSegment(s, tier)
    items.push(simple(film, 'whole-jury-' + s.id, { size }))
    if (s.kind === 'hold' || s.kind === 'terrain') {
      const stop = cfg.stops.find((x) => x.id === s.stop)
      if (stop) items.push(simple(approvedSource(stop, s.kind), 'whole-control-' + s.id, { size }))
    }
  }
  publish('R2', singles(shuffle(items)))
}

const hookFrames = (): number[] => spread(0, Math.min(cfg.hookFrame, cfg.frameCount - 1), Math.min(contactSheetFrames, maxImages))

function finalFrames(): number[] {
  const frames = new Set([...judgedFrames().map((j) => j.frame), ...filmSheets(cfg, true).flat().map((f) => f.frame), ...hookFrames()])
  return [...frames].sort((x, y) => x - y)
}

function filmSheet(i: number, frames: FrameSpec[]): Promise<Art> {
  return contact('whole-film-' + i, frames, tier, { kind: 'film', part: i + 1 })
}

async function holdSheets(): Promise<Art[]> {
  const list: Art[] = []
  const holds = cfg.segments.filter((s) => s.kind === 'hold').map((s) => {
    const frame = judged(cfg, s)
    return { frame, label: String(frame) }
  })
  for (const [i, frames] of chunk(holds, contactSheetFrames).entries()) list.push(await contact('whole-holds-' + i, frames, tier, { kind: 'hold', part: i + 1 }))
  return list
}

async function continuity(): Promise<void> {
  const list: Art[] = []
  for (const [i, frames] of filmSheets(cfg, true).entries()) list.push(await filmSheet(i, frames))
  list.push(...await holdSheets())
  publish('R5', singles(list), 'sheet')
}

async function hook(): Promise<Art[]> {
  const list: Art[] = []
  for (const frame of hookFrames()) list.push(simple(await renderSource(frame, tier, true), 'hook-' + frame, { width: phonePreviewWidthPx }))
  return list
}

function plan(): object {
  const cost = (frames: FrameSpec[]): number => frames.reduce((sum, f) => sum + samplesOf(f.frame, motionTier), 0)
  const sheets: { part: string; stop: string | null; samples: number; tiles: number[][] }[] = []
  for (const s of cfg.segments) {
    const between = s.kind === 'travel' || s.stop === cfg.endingId
    if (between === false && (phase !== 6 || stopKinds.has(s.kind) === false)) continue
    const each = (frames: FrameSpec[]): number[][] => frames.map((f) => [f.frame, samplesOf(f.frame, motionTier)])
    sheets.push({ part: s.id, stop: between ? null : s.stop, samples: cost(sheetFrames(cfg, s, false)), tiles: each(sheetFrames(cfg, s, false)) })
    if (between === false && (s.kind === 'dive' || s.kind === 'rise')) sheets.push({ part: s.id + '-cover', stop: s.stop, samples: cost(sheetFrames(cfg, s, true, placeWindow)), tiles: each(sheetFrames(cfg, s, true, placeWindow)) })
  }
  const frames = a.judged ? { judged: judgedFrames().map((j) => ({ frame: j.frame, segment: j.segment, stop: j.stop, kind: cfg.segments.find((s) => s.id === j.segment)?.kind, why: j.why })) } : {}
  return {
    ...frames,
    tier, motionTier, sheets,
    finals: finalFrames().map((frame) => ({ frame, samples: samplesOf(frame, tier) })),
    composites: [
      ...filmSheets(cfg, true).map((frames, i) => ({ part: 'film-' + (i + 1), frames: frames.map((f) => f.frame) })),
      { part: 'holds', frames: cfg.segments.filter((s) => s.kind === 'hold').map((s) => judged(cfg, s)) },
      { part: 'hook', frames: hookFrames() },
    ],
  }
}

async function wholePart(): Promise<void> {
  const left = new Set(only)
  const ranges: [number, number][] = []
  for (const token of left) {
    const range = /^stills:(\d+)-(\d+)$/.exec(token)
    if (range && left.delete(token)) ranges.push([Number(range[1]), Number(range[2])])
  }
  const sheets = filmSheets(cfg, true).map((frames, i) => ({ frames, i, wanted: left.delete('film-' + (i + 1)) }))
  const holds = left.delete('holds')
  const opening = left.delete('hook')
  const segments = cfg.segments.filter((s) => phase === 6 || s.kind === 'travel' || s.stop === cfg.endingId)
  for (const s of segments) {
    left.delete(s.id)
    if (s.kind === 'dive' || s.kind === 'rise') left.delete(s.id + '-cover')
  }
  if (left.size > 0) throw new Error('unknown part: ' + [...left].join(', '))
  for (const frame of finalFrames()) if (ranges.some(([first, last]) => frame >= first && frame <= last)) console.log((await renderSource(frame, tier, true)).path)
  for (const sheet of sheets) if (sheet.wanted) console.log((await filmSheet(sheet.i, sheet.frames)).path)
  if (holds) for (const art of await holdSheets()) console.log(art.path)
  if (opening) for (const art of await hook()) console.log(art.path)
  await motion(segments)
}

function stressRecord(segment: string): OutputRecord | null {
  try { return JSON.parse(readFileSync(join(WORK, 'stress', segment + '.json'), 'utf8')) as OutputRecord } catch { return null }
}

function compression(chosen?: string[]): void {
  const dir = join(WORK, 'stress')
  const groups: Art[][] = []
  const entries = existsSync(dir) ? readdirSync(dir).sort() : []
  const listed: string[] = cfg.raw.quality.stress.segments
  const strangers = (chosen ?? []).filter((id) => listed.includes(id) === false)
  if (strangers.length > 0) throw new Error('select: not a stress segment: ' + strangers.join(', '))
  for (const segment of listed) {
    if (chosen && chosen.includes(segment) === false) continue
    for (const file of entries) {
      if (file.startsWith(segment + '-before-') === false || /-before-\d{5}\.png$/.test(file) === false) continue
      const stem = basename(file, '.png').split('-').pop()
      const frame = Number(stem)
      const before = join(dir, file)
      const after = join(dir, segment + '-after-' + stem + '.png')
      if (existsSync(after) === false) continue
      const original = safeRecord(before)
      const deps = stopDependencies([frame])
      if (original && (original.engineHash === capture.hashes.engine && deps.every((s) => original.stopHashes[s] === capture.hashes.stops[s])) === false) continue
      const made = stressRecord(segment)
      if (original === null && (made === null || made.engineHash !== capture.hashes.engine || made.tier !== stressTier || made.format !== capture.format || deps.some((s) => made.stopHashes[s] !== capture.hashes.stops[s]))) {
        console.log('R7: ' + file + ' is not from this build at the ' + stressTier + ' tier, left out')
        continue
      }
      const record = original ?? { ...capture.record(stressTier, [frame]), format: cfg.formatKeys.master }
      const inputs: Source[] = [
        { path: before, key: { segment, frame, kind: 'before' }, record },
        { path: after, key: { segment, frame, kind: 'after' }, record: safeRecord(after) ?? record },
      ]
      groups.push(...chunk(pages('pair', 'compression-' + segment + '-' + stem, inputs, { together: true }), maxImages))
    }
  }
  if (groups.length === 0) console.log('R7 skipped: no matching before and after stills in out/work/stress; run npm run stress')
  else publish('R7', groups)
}

async function polish(): Promise<void> {
  const selection = JSON.parse(readFileSync(String(a.select), 'utf8')) as Selection
  const between = cfg.segments.filter((s) => s.kind === 'travel' || s.stop === cfg.endingId)
  for (const b of polishBuilds(selection, cfg.stops.map((s) => s.id))) {
    const stops = cfg.stops.filter((s) => b.stops.includes(s.id))
    const segments = b.scope ? cfg.segments.filter((s) => s.stop === b.scope && stopKinds.has(s.kind)) : between
    const scope = b.scope || undefined
    if (b.critic === 'R1') publish('R1', (await stopImages(stops)).match, 'image', scope)
    else if (b.critic === 'R3') await detail(segments, scope, new Set(b.frames))
    else if (b.critic === 'R4') await motion(segments, scope, new Set(b.sheets))
    else if (b.critic === 'R8') {
      const recognition: Art[] = []
      for (const stop of stops) recognition.push(...(await stopImages([stop])).recognition)
      publish('R8', singles(shuffle(recognition)))
    } else if (b.critic === 'R2') {
      if (b.jury === 'film') await wholeJury()
      else publish('R2', singles(shuffle((await stopImages(stops, true)).jury)))
    } else if (b.critic === 'R7') compression(b.segments)
    else if (b.critic === 'R6') publish('R6', singles(await hook()))
    else if (b.critic === 'R5') await continuity()
  }
}

let rendered = false
let good = false
try {
  if (a.plan) console.log('PLAN ' + JSON.stringify(plan()))
  else if (a.join) {
    if (phase < 4 || only) throw new Error('--join goes without --only, from phase 4 on')
    await motion(cfg.segments.filter((s) => (selectedStop === undefined || s.stop === selectedStop.id) && (stopKinds.has(s.kind) ? phase !== 5 : whole && (s.kind === 'travel' || s.stop === cfg.endingId))))
  } else if (only) {
    if (whole && selectedStop === undefined) await wholePart()
    else {
      const stops = selectedStop ? [selectedStop] : cfg.stops
      await part(cfg.segments.filter((s) => stops.some((p) => p.id === s.stop) && stopKinds.has(s.kind)))
    }
  } else if (phase === 2) await blockout()
  else {
    const stops = selectedStop ? [selectedStop] : cfg.stops
    if (whole === false) {
      await stopPacks(stops)
      const segments = cfg.segments.filter((s) => stops.some((p) => p.id === s.stop) && stopKinds.has(s.kind))
      await detail(segments)
      await motion(segments)
    } else if (a.select) {
      if (phase !== 6 || selectedStop) throw new Error('--select is for --phase 6 without --stop')
      await polish()
    } else {
      if (phase === 6) await recordPacks(stops)
      compression()
      publish('R6', singles(await hook()))
      await wholeJury()
      await continuity()
      const between = cfg.segments.filter((s) => s.kind === 'travel' || s.stop === cfg.endingId)
      await detail(between)
      await motion(between)
    }
  }
  if (only === null && a.plan === undefined && a.join === undefined) {
    for (const entry of readdirSync(roundDir, { withFileTypes: true })) {
      if (entry.isDirectory() && /^R[1-8](?:-[a-z]+)?(?:-part\d+)?$/.test(entry.name) && outputDirs.has(entry.name) === false) rmSync(join(roundDir, entry.name), { recursive: true })
    }
    const keyFile = join(privateDir, roundId + '.json')
    json(keyFile, { phase, round, files: key })
    writeRecord(keyFile, { ...capture.record(tier, []), stopHashes: capture.hashes.stops, extra: { phase, round } })
  }
  const inside = capture as unknown as { session?: object; held?: { session?: object } }
  rendered = inside.session !== undefined || inside.held?.session !== undefined
  good = true
} finally {
  try { await capture.close() } finally {
    const left = leave(temp, used, good)
    if (left.length > 0) console.log('pack ' + roundId + ': frames kept under ' + relative(ROOT, temp) + ' with their records for the next run: ' + left.length)
  }
}
console.log('pack ' + roundId + (only ? ' part ' + [...only].join(',') : '') + ': ' + (rendered ? 'frames were rendered' : 'nothing was rendered, no render session was opened') + ', ' + ((Date.now() - started) / 1000).toFixed(1) + ' s')
