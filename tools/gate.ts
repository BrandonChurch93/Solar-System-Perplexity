import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, ROOT, WORK, args, ensureBuild, loadConfig } from './lib/common'
import { openCapture, renderPng } from './lib/browser'
import { needs } from '../src/core/caps'
import { judgedFrames } from '../src/director/timeline'

const cfg = loadConfig()
const a = args()
const phase = Number(a.phase ?? 0)
const only = a.only ? a.only.split(',') : null

interface Result { id: string; pass: boolean; note: string }
const results: Result[] = []

function run(cmd: string, argv: string[]): { ok: boolean; out: string } {
  const r = spawnSync(cmd, argv, { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 26 })
  return { ok: r.status === 0, out: ((r.stdout ?? '') + (r.stderr ?? '')).replace(/\x1b\[[0-9;]*m/g, '') }
}

function tracked(): string[] {
  return execFileSync('git', ['ls-files', '-z'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 1 << 28 }).split('\0').filter(Boolean)
}

function pngSize(b: Buffer): [number, number] {
  return [b.readUInt32BE(16), b.readUInt32BE(20)]
}

function probe(file: string): { frames: number; width: number; height: number; fps: string } | null {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames,width,height,r_frame_rate', '-of', 'json', file], { encoding: 'utf8' })
  if (r.status !== 0) return null
  const s = (JSON.parse(r.stdout) as { streams: { nb_read_frames: string; width: number; height: number; r_frame_rate: string }[] }).streams[0]
  if (!s) return null
  return { frames: Number(s.nb_read_frames), width: s.width, height: s.height, fps: s.r_frame_rate }
}

const checks: Record<string, () => Promise<Result> | Result> = {
  G1: () => {
    const r = run('npm', ['run', 'build', '--silent'])
    return { id: 'G1', pass: r.ok, note: r.ok ? 'build clean' : r.out.slice(-600) }
  },
  G2: () => {
    const r = run('npx', ['vitest', 'run', '--reporter=dot'])
    const m = /Tests\s+(.*)/.exec(r.out)
    return { id: 'G2', pass: r.ok, note: r.ok ? (m?.[1] ?? 'tests pass').trim() : r.out.slice(-600) }
  },
  G3: () => {
    const r = run('npx', ['tsx', 'tools/determinism.ts'])
    return { id: 'G3', pass: r.ok, note: r.out.trim().split('\n').slice(-6).join('; ') }
  },
  G4: async () => {
    ensureBuild()
    const notes: string[] = []
    let pass = true
    for (const f of Object.values(cfg.formats)) {
      const s = await openCapture({ dist: DIST, format: f.id, assets: 'web' })
      const info = await s.page.evaluate(() => (window as unknown as { showcase: { info(): { frameCount: number } } }).showcase.info())
      const { png } = await renderPng(s.page, cfg.hookFrame, 'draft')
      await s.close()
      const [w, h] = pngSize(png)
      const ok = w === f.width && h === f.height && info.frameCount === cfg.fps * cfg.durationSeconds
      if (!ok) pass = false
      notes.push(f.id + ' ' + w + 'x' + h + ' frames ' + info.frameCount)
    }
    return { id: 'G4', pass, note: notes.join('; ') }
  },
  G7: () => {
    const computed = judgedFrames().map((j) => j.frame)
    const progress = readFileSync(join(ROOT, 'kit/PROGRESS.md'), 'utf8')
    const section = progress.split('## Judged frames')[1]?.split('\n## ')[0] ?? ''
    const listed = new Set((section.match(/\|\s*(\d+)\s*\|/g) ?? []).map((x) => Number(x.replace(/\D/g, ''))))
    const missing = computed.filter((f) => !listed.has(f))
    return { id: 'G7', pass: missing.length === 0, note: missing.length === 0 ? computed.length + ' judged frames listed' : 'not listed: ' + missing.join(',') }
  },
  G10: () => {
    const p = cfg.raw.platform
    const m = cfg.raw.formats.master
    const clipsOk = cfg.stopIds.every((id) => {
      const segs = cfg.segments.filter((s) => s.stop === id && s.kind !== 'travel')
      return segs[segs.length - 1]!.end - segs[0]!.start <= p.loopsAtOrUnderSeconds
    })
    const pass = m.width <= p.maxWidth && m.height <= p.maxHeight && cfg.fps <= p.maxFps && cfg.raw.export.bitrateMbps <= p.maxBitrateMbps && clipsOk
    return { id: 'G10', pass, note: m.width + 'x' + m.height + ' ' + cfg.fps + ' fps ' + cfg.raw.export.bitrateMbps + ' Mbps, clips ' + (clipsOk ? 'fit' : 'too long') }
  },
  G11: () => {
    const assets = readFileSync(join(ROOT, 'ASSETS.md'), 'utf8')
    const bad: string[] = []
    const walk = (dir: string, fn: (p: string) => void): void => {
      if (!existsSync(dir)) return
      for (const n of readdirSync(dir)) {
        const p = join(dir, n)
        if (statSync(p).isDirectory()) walk(p, fn)
        else fn(p)
      }
    }
    walk(join(ROOT, 'public/assets/third-party'), (p) => {
      const rel = p.slice(ROOT.length + 1)
      if (!assets.includes(rel)) bad.push(rel)
    })
    const recipes: Record<string, string> = {}
    walk(join(ROOT, 'assets-src'), (p) => {
      if (p.endsWith('RECIPE.md')) recipes[p] = readFileSync(p, 'utf8')
    })
    const all = Object.values(recipes).join('\n')
    walk(join(ROOT, 'public/assets'), (p) => {
      const rel = p.slice(ROOT.length + 1)
      if (rel.startsWith('public/assets/third-party/')) return
      const generic = rel.replace(/\/(web|full)\//, '/<set>/')
      if (!all.includes(rel) && !all.includes(generic)) bad.push(rel)
    })
    return { id: 'G11', pass: bad.length === 0, note: bad.length === 0 ? 'every asset has a row or a recipe' : 'missing: ' + bad.slice(0, 8).join(', ') }
  },
  G12: () => {
    const files = tracked()
    const bad: string[] = []
    let total = 0
    for (const f of files) {
      const p = join(ROOT, f)
      if (!existsSync(p)) continue
      const size = statSync(p).size
      total += size
      if (size > cfg.raw.repo.maxFileMb * 1e6) bad.push(f + ' is over the file limit')
      if (f.startsWith('references/cache/') || f.startsWith('out/work/')) bad.push(f + ' must not be tracked')
      if (/(^|\/)\.env|id_rsa|\.pem$|credentials/i.test(f)) bad.push(f + ' looks like a secret')
    }
    if (total > cfg.raw.repo.maxTreeGb * 1e9) bad.push('tree is ' + (total / 1e9).toFixed(2) + ' GB')
    const manifest = join(ROOT, 'references/approved/MANIFEST.sha256')
    for (const line of readFileSync(manifest, 'utf8').split('\n')) {
      const m = /^([0-9a-f]{64})\s+\*?(.+)$/.exec(line.trim())
      if (!m) continue
      const candidates = [join(ROOT, m[2]!), join(ROOT, 'references/approved', m[2]!)]
      const p = candidates.find((c) => existsSync(c))
      if (!p) bad.push('missing ' + m[2])
      else if (createHash('sha256').update(readFileSync(p)).digest('hex') !== m[1]) bad.push('changed ' + m[2])
    }
    const text = spawnSync('git', ['grep', '-I', '-l', '-E', '(ghp_[A-Za-z0-9]{30,}|github_pat_[A-Za-z0-9_]{30,}|sk-[A-Za-z0-9]{32,}|AKIA[0-9A-Z]{16})'], { cwd: ROOT, encoding: 'utf8' }).stdout.trim()
    if (text) bad.push('secret pattern in ' + text.split('\n').join(', '))
    return { id: 'G12', pass: bad.length === 0, note: bad.length === 0 ? files.length + ' tracked files, ' + (total / 1e9).toFixed(2) + ' GB' : bad.slice(0, 8).join('; ') }
  },
  G14: () => {
    const caps = JSON.parse(readFileSync(join(ROOT, 'config/webgl-caps.json'), 'utf8')) as { limits: Record<string, number>; extensions: string[] }
    const bad: string[] = []
    for (const f of [cfg.formatKeys.master, cfg.formatKeys.preview]) {
      const n = needs('full', f)
      for (const e of n.extensions) if (!caps.extensions.includes(e)) bad.push(e)
      for (const [k, v] of Object.entries(n.limits)) if ((caps.limits[k] ?? 0) < v) bad.push(k + ' needs ' + v)
    }
    const src = run('git', ['grep', '-h', '-o', '-E', "getExtension\\('[A-Za-z0-9_]+'\\)", '--', 'src'])
    const used = new Set((src.out.match(/'([A-Za-z0-9_]+)'/g) ?? []).map((x) => x.slice(1, -1)))
    for (const e of used) if (!caps.extensions.includes(e)) bad.push('source asks for ' + e)
    const uhd = needs('full', cfg.formatKeys.uhd)
    const uhdOk = Object.entries(uhd.limits).every(([k, v]) => (caps.limits[k] ?? 0) >= v)
    return { id: 'G14', pass: bad.length === 0, note: bad.length === 0 ? 'needs are inside the recorded set' + (uhdOk ? '' : ' (uhd is outside it here and is not gated)') : bad.join('; ') }
  },
  G16: () => {
    const p = probe(join(ROOT, 'out/roughcut.mp4'))
    const f = cfg.formats[cfg.formatKeys.preview]!
    const pass = !!p && p.frames === cfg.frameCount && p.width === f.width && p.height === f.height
    return { id: 'G16', pass, note: p ? p.frames + ' frames ' + p.width + 'x' + p.height + ' ' + p.fps : 'out/roughcut.mp4 missing' }
  },
}

const byPhase: Record<number, string[]> = {
  0: ['G1', 'G2', 'G3', 'G4', 'G14'],
  1: ['G1', 'G2', 'G12', 'G16'],
}
const list = only ?? byPhase[phase] ?? Object.keys(checks)
for (const id of list) {
  const fn = checks[id]
  if (!fn) {
    results.push({ id, pass: false, note: 'check not built yet' })
    continue
  }
  try {
    results.push(await fn())
  } catch (e) {
    results.push({ id, pass: false, note: String(e).slice(0, 400) })
  }
  const r = results[results.length - 1]!
  console.log((r.pass ? 'PASS ' : 'FAIL ') + r.id + '  ' + r.note)
}
mkdirSync(join(WORK, 'gate'), { recursive: true })
writeFileSync(join(WORK, 'gate', 'phase-' + phase + '.json'), JSON.stringify(results, null, 1))
process.exit(results.every((r) => r.pass) ? 0 : 1)
