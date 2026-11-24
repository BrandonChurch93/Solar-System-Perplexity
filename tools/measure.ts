import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { CHROME } from './lib/browser'
import { ROOT, WORK, args, ensureBuild, loadConfig, machineId, requireDisk } from './lib/common'
import { PageFailure, decodePng, openSource } from './lib/frames'
import { computeHashes } from './lib/hashes'
import { detailFrames } from './lib/render'
import { CARRIED, carried } from './measure/carried'
import { countTexels } from './measure/texels'
import { Keeper, forget, holding, note, sha256, takeUp, type RecordKey } from './measure/pages'
import { joinParts, listHash, parsePart, share, sumG13, sumG17, sumG5, type Build, type G17Row, type G5Row, type PartFile, type TexelRow } from './measure/parts'
import { judgedFrames, stopSegments } from '../src/director/timeline'
import '../src/director/plans' // each plan sets its stop's cover window or its handover

const PAGE_FRAMES = 0
const cfg = loadConfig()
const a = args()
const stop = a.stop
if (!stop || !cfg.stopIds.includes(stop)) {
  console.error('measure: --stop must be one of ' + cfg.stopIds.join(', '))
  process.exit(2)
}
const every = Math.max(1, Number(a.every ?? 1))
const tier = a.tier ?? 'final'
const g13Tier = 'draft'
const assets = a.assets ?? 'full'
const stopNow = (why: string): never => {
  console.error('measure: ' + why)
  process.exit(2)
}
let part: ReturnType<typeof parsePart> | null = null
try {
  part = a.part ? parsePart(a.part) : null
} catch (e) {
  stopNow((e as Error).message)
}
const asked = a.only ? a.only.split(',') : null
if (part !== null && part !== 'finals' && asked && asked.join() !== 'G13') stopNow('a part I/N draws the texel frames of G13 only; the judged finals are --part finals')
if (part === 'finals' && asked && asked.some((id) => id !== 'G5' && id !== 'G17')) stopNow('--part finals draws the judged finals of G5 and G17 only')
if (part !== null && (a.join || a.carried)) stopNow('--part goes with neither --join nor --carried')
const only = part === 'finals' ? (asked ?? ['G5', 'G17']) : part !== null ? ['G13'] : (asked ?? ['G5', 'G13', 'G17'])
const label = part === null ? '' : part === 'finals' ? 'finals' : part.part + '-of-' + part.parts
const noCoverArg = a['no-cover'] ? a['no-cover'].split(',') : []
const whole = (name: string, fallback: number): number => {
  const v = Number(a[name] ?? fallback)
  if (!Number.isInteger(v) || v < 0) {
    console.error('measure: --' + name + ' takes a whole number, 0 or more')
    process.exit(2)
  }
  return v
}
const maxRestarts = whole('restarts', 3)
const pageFrames = whole('page-frames', PAGE_FRAMES)
const hook = (name: string): number[] => (a[name] ? a[name].split(',').map(Number) : [])
const closeAt = hook('close-page-at')
const killAt = new Set(hook('kill-browser-at'))
const d = cfg.raw.detail
const master = cfg.formatKeys.master
const kinds = ['hold', 'dive', 'terrain', 'rise']
const segs = stopSegments(stop).filter((s) => kinds.includes(s.kind))
const dir = join(WORK, 'measure')
const frameDir = join(dir, stop)
const partDir = join(dir, 'parts')
const commit = ((): string => {
  try {
    return execFileSync('git', ['rev-parse', 'HEAD'], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim()
  } catch {
    return 'unknown'
  }
})()
const build = (h: { engine: string; stops: Record<string, string> }): Build => ({
  stop, commit, engineHash: h.engine, stopHashes: h.stops, stopHash: h.stops[stop]!, format: master, assets, detail: JSON.stringify(d),
  texelsRule: sha256(readFileSync(join(ROOT, 'tools/measure/texels.ts'))), finalsRule: sha256(readFileSync(join(ROOT, 'tools/measure/g17.py'))),
})

if (a.join) {
  const t0 = Date.now()
  const folder = a.join === 'true' ? partDir : resolve(a.join)
  try {
    if (!existsSync(folder)) throw new Error('join refused: no folder ' + folder)
    const files = readdirSync(folder).filter((n) => n.endsWith('.json')).sort().map((name) => {
      try {
        return { name, part: JSON.parse(readFileSync(join(folder, name), 'utf8')) as PartFile }
      } catch {
        throw new Error('join refused: ' + name + ' is not a whole json file')
      }
    })
    const { out, lines } = joinParts(files, { build: build(computeHashes(ROOT)), every, only, tier, texelsTier: g13Tier, maxSoft: d.maxSoftPixelFraction, frames: (noCover) => detailFrames(segs, noCover), acceptCommit: a.commit })
    out.machine = machineId()
    out.seconds = (Date.now() - t0) / 1000
    mkdirSync(dir, { recursive: true })
    writeFileSync(join(dir, stop + '.json'), JSON.stringify(out, null, 1))
    for (const l of lines) console.log(l)
    console.log('wrote ' + join(dir, stop + '.json') + ' from ' + (out.run as { joined: unknown[] }).joined.length + ' part(s) in ' + folder)
    process.exit(0)
  } catch (e) {
    console.error('measure: ' + (e as Error).message)
    process.exit(1)
  }
}

requireDisk(cfg)
const hashes = ensureBuild()
mkdirSync(frameDir, { recursive: true })
const open = (): ReturnType<typeof openSource> => openSource({ format: master, assets })
const first = await open()
const info = await first.session.page.evaluate(() => (window as unknown as { showcase: { info(): Record<string, unknown> } }).showcase.info())
const reportedNoCover = Array.isArray(info.noCover) ? (info.noCover as string[]) : []
const noCover = noCoverArg.includes(stop) || reportedNoCover.includes(stop)
const t0 = Date.now()
const out: Record<string, unknown> = {
  stop, commit, engineHash: hashes.engine, stopHashes: hashes.stops, stopHash: hashes.stops[stop], format: master, assets, browser: first.session.browserVersion, machine: machineId(), every, noCover,
}
const lines: string[] = []
const keeper = new Keeper(first, {
  open,
  maxRestarts,
  pageFrames,
  lost: (e) => (e instanceof PageFailure ? e.message : null),
  say: (line) => console.log(line),
  closeAt: [...closeAt, ...killAt],
  kill: async (s, frame) => {
    setTimeout(() => {
      if (killAt.has(frame)) spawnSync('pkill', ['-KILL', '-P', String(process.pid), '-f', 'chrom'])
      else void s.session.page.close().catch(() => undefined)
    }, 300)
    await Promise.resolve()
  },
})
console.log('measure ' + stop + ': a lost page is replaced at most ' + maxRestarts + ' time(s) in this run (--restarts), ' + (pageFrames > 0 ? 'a fresh page every ' + pageFrames + ' frames (--page-frames)' : 'no fresh page by count (--page-frames 0)'))
const texels = (s: typeof first): Promise<void> => s.setDiagnostic('texels')
const nograin = (s: typeof first): Promise<void> => s.setDiagnostic('nograin')
const run: Record<string, unknown> = { maxRestarts, pageFrames }

if (a.carried) {
  const frames = [...new Set(a.carried.split(',').flatMap((x) => {
    const m = /^(\d+)(?:-(\d+))?$/.exec(x.trim())
    if (m === null) throw new Error('--carried takes frames and ranges: 3804,3810-3812')
    return Array.from({ length: Number(m[2] ?? m[1]) - Number(m[1]) + 1 }, (_, i) => Number(m[1]) + i)
  }))]
  if (frames.length === 0 || frames.some((f) => f < 0 || f >= cfg.frameCount)) throw new Error('--carried: frames from 0 to ' + (cfg.frameCount - 1))
  const pictureTier = a.tier ?? 'review'
  const pad = (f: number): string => String(f).padStart(5, '0')
  const shots: { frame: number; texels: Buffer; picture?: Buffer }[] = []
  await keeper.setView(texels)
  for (const f of frames) shots.push({ frame: f, texels: (await keeper.draw(f, (p) => p.render(f, g13Tier, 'png', false))).data! })
  await keeper.setView(nograin)
  for (const s of shots) s.picture = (await keeper.draw(s.frame, (p) => p.render(s.frame, pictureTier, 'png', false))).data!
  await keeper.close()
  const results = shots.map((s) => {
    writeFileSync(join(frameDir, 'carried-' + pad(s.frame) + '-' + g13Tier + '-texels.png'), s.texels)
    writeFileSync(join(frameDir, 'carried-' + pad(s.frame) + '-' + pictureTier + '-nograin.png'), s.picture!)
    const tx = decodePng(s.texels)
    const g13 = countTexels(tx, d.minTexelsPerPixel)
    const c = carried(tx, decodePng(s.picture!), d.minTexelsPerPixel)
    const sci = (v: number | null): string => (v === null ? 'none' : v.toExponential(2))
    const num = (v: number | null): string => (v === null ? 'none' : v.toFixed(3))
    console.log('frame ' + s.frame + ' ' + (cfg.segments.find((x) => s.frame >= x.firstFrame && s.frame < x.endFrame)?.id ?? '') + ': G13 soft share ' + (g13.fraction * 100).toFixed(2) + '%, ' + c.judged + ' tiles judged, ' + c.dark + ' dark; says sharp: ' + c.sharp.tiles + ' tiles, band energy median ' + sci(c.sharp.energy) + ', fine over coarse ' + num(c.sharp.fineOverCoarse) + '; says soft: ' + c.soft.tiles + ' tiles, ' + sci(c.soft.energy) + ', ' + num(c.soft.fineOverCoarse) + '; flagged ' + c.flagged.length + (c.flagged.length ? ': ' + c.flagged.slice(0, 12).map((t) => t.join(',')).join(' ') + (c.flagged.length > 12 ? ' ...' : '') : ''))
    for (const b of c.byReport) if (b.tiles) console.log('  report ' + (b.under === null ? b.from + ' and over' : b.from === 0 ? 'under ' + b.under : b.from + ' to under ' + b.under) + ': ' + b.tiles + ' tiles, report median ' + num(b.reported) + ', luma ' + num(b.luma) + ', band energy median ' + sci(b.energy) + ', least ' + sci(b.leastEnergy) + ', fine over coarse ' + num(b.fineOverCoarse) + ', flagged ' + b.flagged)
    return { frame: s.frame, g13: { counted: g13.counted, soft: g13.soft, fraction: Number(g13.fraction.toFixed(5)), minTexels: Number(g13.minTexels.toFixed(3)) }, ...c }
  })
  const file = join(dir, stop + '-carried.json')
  writeFileSync(file, JSON.stringify({ ...out, run: { ...run, restarts: keeper.restarts, pages: keeper.pages }, texelsTier: g13Tier, pictureTier, minTexelsPerPixel: d.minTexelsPerPixel, definition: CARRIED, frames: results }, null, 1))
  console.log('wrote ' + file + '; a report beside G13, no gate reads it')
  process.exit(0)
}

type FinalRow = { frame: number; tier: string; invalid: number; coverage: number; png: string | null }
const record = join(dir, stop + (label ? '.part-' + label : '') + '.progress.jsonl')
const key: RecordKey = {
  engineHash: hashes.engine, stopHash: hashes.stops[stop]!, format: master, assets, browser: first.session.browserVersion, machine: machineId(), noCover,
  texelsTier: g13Tier, texelsView: 'texels', finalsView: 'nograin', detail: JSON.stringify(d), texelsRule: sha256(readFileSync(join(ROOT, 'tools/measure/texels.ts'))),
}
const taken = takeUp<TexelRow, FinalRow>(record, key, a.fresh === 'true')
if (taken.said) console.log(taken.said)
process.on('exit', (code) => {
  if (code !== 0 && existsSync(record)) console.error('measure: the run did not end. The same command takes up the ' + (readFileSync(record, 'utf8').split('\n').filter((l) => l).length - 1) + ' finished frame(s) of ' + record)
})
const tookUp = { G13: 0, finals: 0 }

if (only.includes('G13')) {
  const frames = detailFrames(segs, noCover)
  const list = frames.filter((_, i) => i % every === 0)
  const picked = part !== null && part !== 'finals' ? share(list, part.part, part.parts) : list
  const name = part !== null && part !== 'finals' ? 'G13 part ' + part.part + '/' + part.parts + ' ' : 'G13 '
  await keeper.setView(texels)
  const results: TexelRow[] = []
  let n = 0
  for (const f of picked) {
    let row = taken.g13.get(f)
    if (row) tookUp.G13++
    else {
      const g = await keeper.draw(f, (p) => p.render(f, g13Tier, 'png', false))
      const c = countTexels(decodePng(g.data!), d.minTexelsPerPixel)
      const seg = segs.find((s) => f >= s.firstFrame && f < s.endFrame)!.id
      row = { frame: f, segment: seg, counted: c.counted, soft: c.soft, fraction: Number(c.fraction.toFixed(5)), meanTexels: Number(c.meanTexels.toFixed(3)), pass: c.fraction <= d.maxSoftPixelFraction }
      note(record, { g13: row })
    }
    results.push(row)
    if (++n % 10 === 0) console.log(name + n + '/' + picked.length + ' frames' + (tookUp.G13 ? ', ' + tookUp.G13 + ' taken up' : '') + '; page ' + keeper.pages + ' has drawn ' + keeper.onPage + holding(CHROME))
  }
  if (part === null) {
    const sum = sumG13(stop, results, frames.length, every, g13Tier, d.maxSoftPixelFraction)
    out.G13 = sum.record
    lines.push(sum.line)
  } else {
    const over = results.filter((r) => !r.pass)
    Object.assign(out, { tier: g13Tier, view: 'texels', list: listHash(list), listFrames: list.length, of: frames.length, frames: picked, results })
    console.log(name + stop + ': ' + results.length + ' of the ' + list.length + ' frames of the list, ' + over.length + ' over ' + d.maxSoftPixelFraction + ' soft' + (over.length ? ' (first ' + over[0]!.frame + ')' : '') + '; the join gives the verdict')
  }
}

if (only.includes('G5') || only.includes('G17')) {
  const judged = judgedFrames().filter((j) => segs.some((s) => s.id === j.segment))
  const before = keeper.drawn
  await keeper.fresh()
  run.finalsPage = before > 0 ? 'fresh, after ' + before + ' frames drawn before' : 'first'
  await keeper.setView(nograin)
  const g5: G5Row[] = []
  const g17: G17Row[] = []
  for (const j of judged) {
    const s = segs.find((x) => x.id === j.segment)!
    const needPng = only.includes('G17') && (s.kind === 'hold' || s.kind === 'terrain')
    const file = join(frameDir, 'g17-' + String(j.frame).padStart(5, '0') + '-' + tier + '-nograin.png')
    const done = taken.finals.get(tier + ' ' + j.frame)
    let g: FinalRow
    if (done && (!needPng || (done.png !== null && existsSync(file) && sha256(readFileSync(file)) === done.png))) {
      g = done
      tookUp.finals++
    } else {
      const drawn = await keeper.draw(j.frame, (p) => p.render(j.frame, tier, needPng ? 'png' : 'none', true))
      if (needPng) writeFileSync(file, drawn.data!)
      g = { frame: j.frame, tier, invalid: drawn.invalid, coverage: drawn.coverage, png: needPng ? sha256(drawn.data!) : null }
      note(record, { final: g })
    }
    const coverageRule = s.kind === 'hold' || s.kind === 'terrain'
    g5.push({ frame: j.frame, segment: s.id, kind: s.kind, invalid: g.invalid, coverage: Number(g.coverage.toFixed(5)), pass: g.invalid === 0 && (!coverageRule || g.coverage >= d.minBodyCoverage) })
    if (needPng) {
      const stopDef = cfg.stops.find((x) => x.id === stop)!
      const approved = s.kind === 'hold' ? stopDef.hero : stopDef.close
      const r = JSON.parse(execFileSync('python3', [join(ROOT, 'tools/measure/g17.py'), file, join(ROOT, approved)], { encoding: 'utf8' })) as { median: number | null; p25: number | null; tiles: number }
      g17.push({ frame: j.frame, segment: s.id, approved, ...r, pass: r.median !== null && r.median >= d.minSharpnessRatio })
    }
  }
  if (only.includes('G5')) {
    const sum = sumG5(stop, tier, g5)
    out.G5 = sum.record
    lines.push(sum.line)
  }
  if (only.includes('G17')) {
    const definition = JSON.parse(execFileSync('python3', [join(ROOT, 'tools/measure/g17.py'), '--definition'], { encoding: 'utf8' })) as Record<string, unknown>
    const sum = sumG17(stop, tier, d.minSharpnessRatio, definition, g17)
    out.G17 = sum.record
    lines.push(sum.line)
  }
  if (part === 'finals') Object.assign(out, { tier, view: 'nograin', lines: [...lines] })
}
await keeper.close()
out.run = { ...run, restarts: keeper.restarts, pages: keeper.pages, takenUp: tookUp }
out.seconds = (Date.now() - t0) / 1000
const target = part === null ? join(dir, stop + '.json') : join(partDir, stop + '-part-' + label + '.json')
if (part === null) out.pass = only.every((id) => (out[id] as { pass: boolean } | undefined)?.pass === true)
else {
  mkdirSync(partDir, { recursive: true })
  const b = build(hashes)
  Object.assign(out, { kind: 'measure part', part: part === 'finals' ? 'finals' : part.part, parts: part === 'finals' ? 1 : part.parts, detail: b.detail, texelsRule: b.texelsRule, finalsRule: b.finalsRule })
}
writeFileSync(target, JSON.stringify(out, null, 1))
forget(record)
for (const l of lines) console.log(l)
console.log('wrote ' + target + ' in ' + (out.seconds as number).toFixed(0) + ' s; ' + keeper.restarts.length + ' restart(s), ' + keeper.pages + ' page(s), ' + (tookUp.G13 + tookUp.finals) + ' frame(s) taken up')
process.exit(0)
