import { execFileSync, spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { CHROME } from './lib/browser'
import { ROOT, WORK, args, ensureBuild, loadConfig, machineId, requireDisk } from './lib/common'
import { PageFailure, decodePng, openSource } from './lib/frames'
import { detailFrames } from './lib/render'
import { CARRIED, carried } from './measure/carried'
import { countTexels } from './measure/texels'
import { Keeper, forget, holding, note, sha256, takeUp, type RecordKey } from './measure/pages'
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
const only = a.only ? a.only.split(',') : ['G5', 'G13', 'G17']
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
requireDisk(cfg)
const hashes = ensureBuild()
const master = cfg.formatKeys.master
const kinds = ['hold', 'dive', 'terrain', 'rise']
const segs = stopSegments(stop).filter((s) => kinds.includes(s.kind))
const dir = join(WORK, 'measure')
const frameDir = join(dir, stop)
mkdirSync(frameDir, { recursive: true })
const open = (): ReturnType<typeof openSource> => openSource({ format: master, assets })
const first = await open()
const info = await first.session.page.evaluate(() => (window as unknown as { showcase: { info(): Record<string, unknown> } }).showcase.info())
const reportedNoCover = Array.isArray(info.noCover) ? (info.noCover as string[]) : []
const noCover = noCoverArg.includes(stop) || reportedNoCover.includes(stop)
const t0 = Date.now()
const out: Record<string, unknown> = {
  stop, engineHash: hashes.engine, stopHashes: hashes.stops, stopHash: hashes.stops[stop], format: master, assets, browser: first.session.browserVersion, machine: machineId(), every, noCover,
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

type TexelRow = { frame: number; segment: string; counted: number; soft: number; fraction: number; meanTexels: number; pass: boolean }
type FinalRow = { frame: number; tier: string; invalid: number; coverage: number; png: string | null }
const record = join(dir, stop + '.progress.jsonl')
const key: RecordKey = {
  engineHash: hashes.engine, stopHash: hashes.stops[stop]!, format: master, assets, browser: first.session.browserVersion, machine: machineId(), noCover,
  texelsTier: g13Tier, texelsView: 'texels', finalsView: 'nograin', detail: JSON.stringify(d), texelsRule: sha256(readFileSync(join(ROOT, 'tools/measure/texels.ts'))),
}
const taken = takeUp<TexelRow, FinalRow>(record, key, a.fresh === 'true')
if (taken.said) console.log(taken.said)
const tookUp = { G13: 0, finals: 0 }

if (only.includes('G13')) {
  const frames = detailFrames(segs, noCover)
  const picked = frames.filter((_, i) => i % every === 0)
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
    if (++n % 10 === 0) console.log('G13 ' + n + '/' + picked.length + ' frames' + (tookUp.G13 ? ', ' + tookUp.G13 + ' taken up' : '') + '; page ' + keeper.pages + ' has drawn ' + keeper.onPage + holding(CHROME))
  }
  const failed = results.filter((r) => !r.pass)
  const empty = results.filter((r) => r.counted === 0).map((r) => r.frame)
  const worst = [...results].sort((x, y) => y.fraction - x.fraction).slice(0, 10)
  const pass = failed.length === 0
  out.G13 = { pass, tier: g13Tier, view: 'texels', frames: results.length, of: frames.length, failed: failed.map((r) => r.frame), zeroCounted: empty, worst, results, rule: 'counted when green > 0.5; soft when red byte < 127.5 x detail.minTexelsPerPixel; pass when soft/counted <= detail.maxSoftPixelFraction' }
  lines.push((pass ? 'PASS' : 'FAIL') + ' G13 ' + stop + ': ' + failed.length + ' of ' + results.length + ' frames over ' + d.maxSoftPixelFraction + ' soft' + (every > 1 ? ' (every ' + every + 'th frame)' : '') + '; worst ' + worst.slice(0, 3).map((w) => 'frame ' + w.frame + ' ' + (w.fraction * 100).toFixed(2) + '%').join(', ') + (empty.length ? '; ' + empty.length + ' frames had no counted pixels' : ''))
}

if (only.includes('G5') || only.includes('G17')) {
  const judged = judgedFrames().filter((j) => segs.some((s) => s.id === j.segment))
  const before = keeper.drawn
  await keeper.fresh()
  run.finalsPage = before > 0 ? 'fresh, after ' + before + ' frames drawn before' : 'first'
  await keeper.setView(nograin)
  const g5: { frame: number; segment: string; kind: string; invalid: number; coverage: number; pass: boolean }[] = []
  const g17: Record<string, unknown>[] = []
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
    const failed = g5.filter((x) => !x.pass)
    out.G5 = { pass: failed.length === 0, tier, diag: 'nograin', frames: g5 }
    lines.push((failed.length === 0 ? 'PASS' : 'FAIL') + ' G5 ' + stop + ': ' + g5.map((x) => x.frame + ' ' + x.kind + ' invalid ' + x.invalid + ' coverage ' + x.coverage.toFixed(3)).join('; '))
  }
  if (only.includes('G17')) {
    const definition = JSON.parse(execFileSync('python3', [join(ROOT, 'tools/measure/g17.py'), '--definition'], { encoding: 'utf8' })) as Record<string, unknown>
    const pass = g17.length > 0 && g17.every((x) => x.pass)
    out.G17 = { pass, tier, diag: 'nograin', minSharpnessRatio: d.minSharpnessRatio, definition, frames: g17 }
    lines.push((pass ? 'PASS' : 'FAIL') + ' G17 ' + stop + ': ' + g17.map((x) => x.frame + ' median ' + (x.median === null ? 'none' : (x.median as number).toFixed(3)) + ' p25 ' + (x.p25 === null ? 'none' : (x.p25 as number).toFixed(3)) + ' over ' + x.tiles + ' tiles').join('; '))
  }
}
await keeper.close()
out.run = { ...run, restarts: keeper.restarts, pages: keeper.pages, takenUp: tookUp }
out.seconds = (Date.now() - t0) / 1000
out.pass = only.every((id) => (out[id] as { pass: boolean } | undefined)?.pass === true)
writeFileSync(join(dir, stop + '.json'), JSON.stringify(out, null, 1))
forget(record)
for (const l of lines) console.log(l)
console.log('wrote ' + join(dir, stop + '.json') + ' in ' + (out.seconds as number).toFixed(0) + ' s; ' + keeper.restarts.length + ' restart(s), ' + keeper.pages + ' page(s), ' + (tookUp.G13 + tookUp.finals) + ' frame(s) taken up')
process.exit(0)
