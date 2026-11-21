import { copyFileSync, existsSync, mkdtempSync, readdirSync, renameSync, rmSync, statSync } from 'node:fs'
import { basename, dirname, extname, join } from 'node:path'
import { judgedFrames, segmentAtFrame } from '../src/director/timeline'
import { args, loadConfig, readRecord, recordMatches, ROOT, WORK, writeRecord, type OutputRecord } from './lib/common'
import { computeHashes } from './lib/hashes'
import { cached, fingerprint, image, imageRevision, jpgQuality, outputFolder, padFrame, padImage, stopDependencies } from './lib/render'

const cfg = loadConfig()
const a = args()
if (a.stop && cfg.stopIds.includes(a.stop) === false) throw new Error('unknown stop ' + a.stop)
if (a.stop && a.phase) throw new Error('choose --stop ID or --phase N')
const phase = a.phase ? Number(a.phase) : undefined
if (a.phase && [1, 2, 3, 4, 5, 6].includes(Number(a.phase)) === false) throw new Error('unknown phase ' + a.phase)
const scopedStop = a.stop ?? (phase === 3 ? cfg.raw.lookLockStop : undefined)
const wantedStops = scopedStop ? [scopedStop] : cfg.stopIds
const interior = new Set(['hold', 'dive', 'terrain', 'rise'])
const hashes = computeHashes(ROOT)
const out = outputFolder(join(ROOT, 'out'))
const bytes = cfg.raw.repo.maxFileMb * 1e6
const imageExt = new Set(['.png', '.jpg', '.jpeg'])
const tiers = Object.keys(cfg.tiers)

interface Item { file: string; record: OutputRecord }

function list(dir: string): string[] {
  return existsSync(dir) ? readdirSync(dir, { withFileTypes: true }).filter((f) => f.isFile()).map((f) => join(dir, f.name)) : []
}

function candidates(paths: string[], filters: (file: string) => boolean): Item[] {
  return paths.filter(filters).flatMap((file) => {
    try {
      const record = readRecord(file)
      return record ? [{ file, record }] : []
    } catch { return [] }
  })
}

function current(item: Item, stops: string[]): boolean {
  return recordMatches(item.record, { ...item.record, engineHash: hashes.engine, stopHashes: hashes.stops }, stops)
}

function ensureSize(file: string): void {
  if (statSync(file).size > bytes) throw new Error('refusing ' + file + ': exceeds repo.maxFileMb (' + cfg.raw.repo.maxFileMb + ' MB)')
}

function keep(item: Item, target: string, convert: boolean): void {
  ensureSize(item.file)
  const stops = Object.keys(item.record.stopHashes)
  const signature = JSON.stringify([fingerprint(item.file), convert ? [imageRevision(), jpgQuality] : 'copy'])
  if (cached(target, item.record, stops, signature)) {
    console.log(target + ' (current)')
    return
  }
  const tmp = mkdtempSync(join(outputFolder(dirname(target)), '.keep-'))
  try {
    const path = join(tmp, basename(target))
    if (convert) image({ op: 'single', input: item.file, output: path, quality: jpgQuality })
    else copyFileSync(item.file, path)
    ensureSize(path)
    renameSync(path, target)
    writeRecord(target, { ...item.record, extra: { ...item.record.extra, signature, ...(convert ? { quality: jpgQuality } : {}) } })
  } finally { rmSync(tmp, { recursive: true, force: true }) }
  console.log(target)
}

function score(item: Item): number {
  return tiers.indexOf(item.record.tier) * Object.keys(cfg.formats).length + (item.record.format === cfg.formatKeys.master ? Object.keys(cfg.formats).length - 1 : item.record.format === cfg.formatKeys.uhd ? 1 : 0)
}

function best(items: Item[]): Item | undefined {
  return items.sort((left, right) => score(right) - score(left) || statSync(right.file).mtimeMs - statSync(left.file).mtimeMs)[0]
}

const stillDir = join(out, 'stills')
const judged = judgedFrames().filter((j) => scopedStop === undefined || (j.stop === scopedStop && interior.has(segmentAtFrame(j.frame).kind)))
const raw = candidates(list(join(WORK, 'stills')), (f) => imageExt.has(extname(f)))
let missing = 0
for (const j of judged) {
  const item = best(raw.filter((i) => i.record.frame === j.frame && i.record.assets === 'full' && i.record.diag === 'beauty' && current(i, stopDependencies([j.frame]))))
  if (item) keep(item, join(stillDir, 'f' + padFrame(j.frame) + '-' + j.segment + '.jpg'), true)
  else missing++
}
if (missing) console.log('Note: ' + missing + ' judged stills were not available from this build')

const compare = candidates(list(join(WORK, 'compare')), (f) => /^compare-.*-(hold|terrain)\.jpg$/.test(basename(f)))
for (const item of compare) {
  const stop = wantedStops.find((s) => ['hold', 'terrain'].some((view) => basename(item.file) === 'compare-' + s + '-' + view + '.jpg'))
  if (stop && item.record.assets === 'full' && current(item, [stop])) keep(item, join(stillDir, basename(item.file)), false)
}

const solo = list(join(WORK, 'sheets'))
const staged = join(WORK, 'packs', '.cache')
const packSheets = existsSync(staged) ? readdirSync(staged, { withFileTypes: true }).filter((f) => f.isDirectory()).flatMap((f) => list(join(staged, f.name))) : []
const sheets = candidates([...solo, ...packSheets], (f) => imageExt.has(extname(f)))
const groups = new Map<string, Item[]>()
for (const item of sheets) {
  const { extra } = item.record
  const id = extra?.segment
  const segment = cfg.segments.find((s) => s.id === id)
  const frames = extra?.frames as number[] | undefined
  if (frames === undefined || current(item, stopDependencies(frames)) === false) continue
  let name: string
  if (segment && (scopedStop === undefined || segment.stop === scopedStop)) name = 'sheet-' + segment.id + (extra?.cover || extra?.kind === 'cover' ? '-cover' : '')
  else if (scopedStop === undefined && (extra?.film || extra?.kind === 'film')) name = 'sheet-film-' + padImage(Number(extra?.part))
  else continue
  const group = groups.get(name) ?? []
  group.push(item)
  groups.set(name, group)
}
for (const [name, items] of groups) {
  const item = best(items)
  if (item) keep(item, join(stillDir, name + '.jpg'), true)
}

const preview = cfg.formatKeys.preview
const fullFilms = tiers.map((tier) => join(WORK, 'film-' + preview + '-' + tier + '.mp4'))
const newest = candidates(fullFilms, existsSync).filter((i) => i.record.format === preview && current(i, cfg.stopIds)).sort((l, r) => statSync(r.file).mtimeMs - statSync(l.file).mtimeMs)[0]
if (newest) keep(newest, join(out, 'preview.mp4'), false)
else console.log('Note: no preview film matches the current build')

if (a.clips) {
  for (const stop of a.stop ? [a.stop] : cfg.stopIds) {
    const path = join(WORK, 'clips', stop + '.mp4')
    const item = candidates([path], existsSync)[0]
    if (item && current(item, [stop])) keep(item, join(out, 'clips', stop + '.mp4'), false)
    else console.log('Note: no current clip for ' + stop)
  }
}

if (a.posts) {
  for (const stop of a.stop ? [a.stop] : cfg.stopIds) {
    for (const name of ['intro-' + stop + '.mp4', stop + '.mp4']) {
      const item = candidates([join(WORK, 'posts', name)], existsSync)[0]
      const post = name === stop + '.mp4'
      if (item && (post === false || current(item, [stop]))) keep(item, join(out, 'posts', name), false)
      else console.log('Note: no ' + (post ? 'current post' : 'intro') + ' for ' + stop)
    }
  }
}
