import { spawnSync } from 'node:child_process'
import { appendFileSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { args, loadConfig, ROOT, WORK } from './lib/common'
import { LOOKS, pickLooks, readLooks, type Look } from './lib/looks'

const cfg = loadConfig()
const a = args()
const rule = cfg.raw.status
const stops = a.stop ? a.stop.split(',') : []
for (const s of stops) if (cfg.stopIds.includes(s) === false) throw new Error('unknown stop ' + s)
const out = join(ROOT, 'out/stills/status')
const state = join(WORK, 'status')
const lastFile = join(state, 'last.json')
mkdirSync(out, { recursive: true })
mkdirSync(state, { recursive: true })
const last = existsSync(lastFile) ? (JSON.parse(readFileSync(lastFile, 'utf8')) as { time: string; count: number; shown: string[]; large?: Record<string, number> }) : { time: '', count: 0, shown: [] }
const large: Record<string, number> = { ...(last.large ?? {}) }
const sinceMinutes = last.time ? (Date.now() - Date.parse(last.time)) / 60000 : Infinity

if (a.due) {
  const word = sinceMinutes >= rule.maxGapMinutes ? 'OVERDUE' : sinceMinutes >= rule.maxGapMinutes - 6 ? 'DUE NOW' : sinceMinutes >= rule.minGapMinutes ? 'allowed, not due' : 'too soon'
  console.log('last status ' + (last.time ? sinceMinutes.toFixed(0) + ' min ago' : 'never') + ': ' + word + ' (a status at least every ' + rule.maxGapMinutes + ' min, never closer than ' + rule.minGapMinutes + ')')
  process.exit(0)
}

function run(script: string, argv: string[]): string[] {
  const r = spawnSync('npx', ['tsx', join('tools', script), ...argv], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 })
  if (r.status !== 0) throw new Error(script + ' failed: ' + (r.stderr || r.stdout).slice(-600))
  return r.stdout.trim().split('\n').filter((l) => l.startsWith('/'))
}

function jpg(from: string, to: string, edge: number, q: number): void {
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', from, '-vf', 'scale=w=' + edge + ':h=' + edge + ':force_original_aspect_ratio=decrease:flags=lanczos', '-frames:v', '1', '-q:v', String(q), to], { encoding: 'utf8' })
  if (r.status !== 0) throw new Error('ffmpeg failed: ' + r.stderr.slice(-400))
}

function beside(left: string, right: string, to: string): boolean {
  const h = 540
  const r = spawnSync('ffmpeg', ['-y', '-v', 'error', '-i', left, '-i', right, '-filter_complex', '[0:v]scale=-2:' + h + ':flags=lanczos[a];[1:v]scale=-2:' + h + ':flags=lanczos[b];[a][b]hstack=inputs=2', '-frames:v', '1', '-q:v', '4', to], { encoding: 'utf8' })
  return r.status === 0
}

if (a.fetch) spawnSync('npx', ['tsx', 'tools/looks.ts', '--fetch'], { cwd: ROOT, stdio: 'inherit' })

if (a.render) {
  const tier = a.tier ?? 'review'
  if (stops.length) for (const s of stops) {
    for (const view of ['hold', 'terrain']) run('compare.ts', ['--stop', s, '--view', view, '--tier', tier])
    if (cfg.segments.some((x) => x.id === s + '.dive')) run('sheet.ts', ['--segment', s + '.dive', '--format', 'preview', '--tier', tier])
  } else run('sheet.ts', ['--film', '--format', 'preview', '--tier', tier])
}

interface Pic { path: string; caption: string; name: string; kept?: boolean; edge?: number }
const nameOf = (id: string): string => cfg.stops.find((s) => s.id === id)?.name ?? id
const ago = (time: string): string => {
  const m = Math.round((Date.now() - Date.parse(time)) / 60000)
  return m < 90 ? m + ' min ago' : (m / 60).toFixed(1) + ' h ago'
}

function gather(): (Look & { path: string })[] {
  const all: (Look & { path: string })[] = readLooks().map((l) => ({ ...l, path: join(LOOKS, l.file) }))
  const remote = join(LOOKS, 'remote')
  if (existsSync(remote)) for (const folder of readdirSync(remote)) for (const l of readLooks(join(remote, folder))) all.push({ ...l, stop: l.stop ?? folder, path: join(remote, folder, l.file), from: l.from ?? 'agent/' + folder })
  return all.sort((x, y) => (x.time < y.time ? 1 : -1))
}

function caption(l: Look): string {
  const stop = l.stop ? nameOf(l.stop) + ': ' : ''
  const label = l.stop && l.label.toLowerCase().startsWith(l.stop + '.') ? l.label.slice(l.stop.length + 1) : l.label
  return stop + label + ' (' + (l.from ? 'from the supporting agent building it, ' : '') + ago(l.time) + ')'
}

const pics: Pic[] = []
const used = new Set<string>()
const all = gather()
const max = rule.maxPictures
const fresh = (l: Look): boolean => a.all === 'true' || last.shown.includes(l.file) === false

function keyPicture(stop: string): Pic | null {
  const mine = all.filter((l) => l.stop === stop)
  const compare = mine.find((l) => l.kind === 'compare')
  const def = cfg.stops.find((s) => s.id === stop)!
  const frame = mine.find((l) => (l.kind === 'still' || l.kind === 'frame' || l.kind === 'job') && l.frame !== undefined && (l.segment === stop + '.hold' || l.segment === stop + '.terrain') && (!l.diag || l.diag === 'beauty'))
  if (compare && (!frame || compare.time >= frame.time)) {
    used.add(compare.path)
    return { path: compare.path, caption: caption(compare), name: stop + '-key' }
  }
  if (frame) {
    const to = join(state, stop + '-key.jpg')
    const approved = join(ROOT, frame.segment === stop + '.hold' ? def.hero : def.close)
    if (beside(approved, frame.path, to)) {
      used.add(frame.path)
      return { path: to, caption: nameOf(stop) + ': approved image left, newest ' + frame.segment!.split('.')[1] + ' frame ' + frame.frame + ' right' + (frame.tier ? ', ' + frame.tier + ' tier' : '') + ' (' + (frame.from ? 'from the supporting agent building it, ' : '') + ago(frame.time) + ')', name: stop + '-key' }
    }
  }
  if (compare) {
    used.add(compare.path)
    return { path: compare.path, caption: caption(compare), name: stop + '-key' }
  }
  const kept = join(ROOT, 'out/stills/compare-' + stop + '-hold.jpg')
  if (existsSync(kept)) return { path: kept, caption: nameOf(stop) + ': approved image left, kept film frame right (the build this stop was finished on)', name: stop + '-key', kept: true }
  return null
}

function boards(list: string[]): void {
  for (const view of ['hold', 'terrain'] as const) {
    const tiles = list.map((stop) => {
      const def = cfg.stops.find((s) => s.id === stop)!
      const frame = all.find((l) => l.stop === stop && l.frame !== undefined && l.segment === stop + '.' + view && (!l.diag || l.diag === 'beauty') && (l.kind === 'still' || l.kind === 'frame' || l.kind === 'job'))
      const done = finished.has(stop)
      const keptName = done ? readdirSync(join(ROOT, 'out/stills')).filter((f) => new RegExp('^f\\d+-' + stop + '\\.' + view + '\\.jpg$').test(f)).sort().pop() : undefined
      const kept = keptName ? join(ROOT, 'out/stills', keptName) : undefined
      const useKept = kept !== undefined && (!frame || Date.parse(frame.time) < statSync(kept).mtimeMs)
      const right = useKept ? kept! : frame ? frame.path : null
      const sub = useKept ? 'kept frame of the build it was finished on' : frame ? 'frame ' + frame.frame + (frame.tier ? ', ' + frame.tier + ' tier' : '') + ', ' + ago(frame.time) + (frame.from ? '' : ', Builder') : ''
      return { label: def.name + (done ? ' (finished)' : ''), sub, left: join(ROOT, view === 'hold' ? def.hero : def.close), right, empty: 'no ' + (view === 'hold' ? 'orbit' : 'terrain') + ' frame from this stop yet' }
    })
    const to = join(state, 'board-' + view + '.jpg')
    const job = join(state, 'board-' + view + '.json')
    const title = (view === 'hold' ? 'Orbit views' : 'Terrain views') + ': approved image left, newest film frame right'
    writeFileSync(job, JSON.stringify({ output: to, title, tiles, columns: 2, imageWidth: 464 }))
    const r = spawnSync('python3', ['tools/img/board.py', job], { cwd: ROOT, encoding: 'utf8' })
    if (r.status !== 0) throw new Error('board failed: ' + r.stderr.slice(-400))
    const names = list.map(nameOf)
    const half = Math.ceil(names.length / 2)
    pics.push({ path: to, caption: title + '. Left column, top to bottom: ' + names.slice(0, half).join(', ') + '. Right column: ' + names.slice(half).join(', ') + '.', name: 'board-' + (view === 'hold' ? 'orbit' : 'terrain'), edge: 1920 })
  }
  const order = [...list].sort((x, y) => (large[x] ?? 0) - (large[y] ?? 0))
  const rank = (k: string): number => (k === 'note' ? 0 : k === 'crops' ? 1 : k === 'sheet' ? 2 : k === 'compare' ? 3 : 4)
  const cands = order.map((stop) => {
    const mine = all.filter((l) => l.stop === stop && fresh(l))
    if (mine.length === 0) return null
    const newest = Date.parse(mine[0]!.time)
    const near = mine.filter((l) => newest - Date.parse(l.time) < 20 * 60000).sort((x, y) => rank(x.kind) - rank(y.kind) || (x.time < y.time ? 1 : -1))
    return near[0]!
  }).filter((l): l is Look & { path: string } => l !== null)
  for (const l of cands) {
    if (pics.length >= max) break
    large[l.stop!] = (large[l.stop!] ?? 0) + 1
    used.add(l.path)
    pics.push({ path: l.path, caption: caption(l), name: l.stop + '-look-1' })
  }
}

const finished = new Set<string>()
for (const m of readFileSync(join(ROOT, 'kit/PROGRESS.md'), 'utf8').matchAll(/^\| ([a-z]+) \| finished/gm)) finished.add(m[1]!)

if (a.board) {
  boards(stops.length ? stops : (cfg.raw as unknown as { buildOrderAfterLookLock: string[] }).buildOrderAfterLookLock)
} else if (stops.length) {
  for (const s of stops) {
    if (pics.length >= max) break
    const k = keyPicture(s)
    if (k) pics.push(k)
  }
  const rest = pickLooks(all.filter((l) => l.stop !== undefined && stops.includes(l.stop) && used.has((l as Look & { path: string }).path) === false && l.kind !== 'compare' && fresh(l)), max * 3)
  const perStop = new Map<string, number>()
  for (const l of rest as (Look & { path: string })[]) {
    if (pics.length >= max) break
    const n = perStop.get(l.stop!) ?? 0
    if (stops.length > 1 && n >= Math.max(1, Math.floor(max / stops.length) - 1)) continue
    perStop.set(l.stop!, n + 1)
    used.add(l.path)
    pics.push({ path: l.path, caption: caption(l), name: l.stop + '-look-' + (n + 1) })
  }
} else {
  const recent = pickLooks(all.filter((l) => fresh(l) && Date.parse(l.time) > (last.time ? Date.parse(last.time) - 60000 : 0)), max) as (Look & { path: string })[]
  for (const [i, l] of recent.entries()) {
    used.add(l.path)
    pics.push({ path: l.path, caption: caption(l), name: 'film-look-' + (i + 1) })
  }
}
if (pics.length < max) {
  const stills = join(ROOT, 'out/stills')
  const sheets = readdirSync(stills).filter((f) => /^sheet-film-\d+\.jpg$/.test(f)).sort()
  const want = stops.length || a.board ? [] : sheets.map((_, i) => sheets[(last.count + i) % sheets.length]!)
  for (const f of want) {
    if (pics.length >= max) break
    pics.push({ path: join(stills, f), caption: 'Whole film contact sheet, part ' + Number(/(\d+)/.exec(f)![1]) + ' of ' + sheets.length + ' (kept ' + ago(statSync(join(stills, f)).mtime.toISOString()) + ')', name: basename(f, '.jpg'), kept: true })
  }
}
if (pics.length === 0) {
  const stills = join(ROOT, 'out/stills')
  const newest = readdirSync(stills).filter((f) => /\.(jpg|png)$/.test(f)).map((f) => ({ f, t: statSync(join(stills, f)).mtimeMs })).sort((x, y) => y.t - x.t).slice(0, max)
  for (const n of newest) pics.push({ path: join(stills, n.f), caption: 'Newest kept still: ' + basename(n.f).replace(/\.[a-z]+$/, '').split('-').join(' '), name: basename(n.f, '.jpg'), kept: true })
}

const made: string[] = []
const packed: { caption: string; src: string; wide?: boolean }[] = []
for (const p of pics) {
  let shown = p.path
  if (!p.kept) {
    shown = join(out, p.name + '.jpg')
    jpg(p.path, shown, p.edge ?? 1200, 5)
  }
  made.push(shown)
  const small = join(state, 'inline-' + made.length + '.jpg')
  jpg(shown, small, p.edge ? 1600 : 1100, 6)
  packed.push({ caption: p.caption, src: 'data:image/jpeg;base64,' + readFileSync(small).toString('base64'), ...(p.edge || (stops.length > 0 && made.length === 1) ? { wide: true } : {}) })
}

const progressFile = join(ROOT, 'kit/PROGRESS.md')
const progress = readFileSync(progressFile, 'utf8')
const review = /review page: (https?:\/\/[^\s)]+)/i.exec(progress)?.[1] ?? ''
const lines = [a.line1, a.line2].filter((l): l is string => !!l && l !== 'true')
const pack = a.pack ?? join(state, 'status.json')
writeFileSync(pack, JSON.stringify({ lines: [...lines, ...(review ? ['Review page: ' + review] : [])], pics: packed }))
const now = new Date().toISOString()
if (a['no-log'] !== 'true' && lines.length) {
  const rel = (f: string): string => f.slice(ROOT.length + 1)
  appendFileSync(progressFile, (progress.endsWith('\n') ? '' : '\n') + '  - Status, ' + now.slice(0, 16).replace('T', ' ') + ' UTC. ' + lines.join(' ') + ' Pictures shown inline: ' + pics.map((p, i) => p.caption + ' (`' + rel(made[i]!) + '`)').join('; ') + '.\n')
}
if (a['no-log'] !== 'true') writeFileSync(lastFile, JSON.stringify({ time: now, count: last.count + 1, shown: pics.filter((p) => !p.kept).map((p) => basename(p.path)), large }))
if (existsSync(join(ROOT, 'dist/index.html'))) spawnSync('npx', ['tsx', 'tools/review.ts', '--no-build'], { cwd: ROOT, encoding: 'utf8' })
if (a.push) {
  const git = (argv: string[]): number => spawnSync('git', argv, { cwd: ROOT, encoding: 'utf8' }).status ?? 1
  git(['add', 'out/stills/status', 'kit/PROGRESS.md'])
  git(['commit', '-q', '-m', 'Status: ' + (lines[0] ?? 'pictures').slice(0, 72) + '\n\nCo-authored-by: Perplexity <noreply@perplexity.ai>', '--', 'out/stills/status', 'kit/PROGRESS.md'])
  const merged = git(['fetch', '-q', 'origin', cfg.raw.repo.branch]) === 0 && git(['merge', '-q', '--no-edit', 'origin/' + cfg.raw.repo.branch]) === 0
  const pushed = merged && git(['push', '-q', 'origin', 'HEAD:' + cfg.raw.repo.branch]) === 0
  console.log(pushed ? 'committed and pushed' : 'committed; the push did not go through and is retried with the next commit')
}
console.log('pack: ' + pack + ' (' + (statSync(pack).size / 1e6).toFixed(2) + ' MB)')
for (const [i, p] of pics.entries()) console.log(made[i] + '  |  ' + p.caption)
