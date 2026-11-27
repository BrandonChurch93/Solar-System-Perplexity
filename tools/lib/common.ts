import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { closeSync, existsSync, linkSync, mkdirSync, openSync, readFileSync, readSync, readdirSync, renameSync, rmSync, statSync, statfsSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { hostname, cpus } from 'node:os'
import { buildConfig, type Config } from '../../src/config'
import { computeHashes, type Hashes } from './hashes'
import { lookFromRecord } from './looks'

export const ROOT = process.cwd()
export const DIST = join(ROOT, 'dist')
export const WORK = join(ROOT, 'out/work')

export function loadConfig(): Config {
  const raw = JSON.parse(readFileSync(join(ROOT, 'config/showcase.json'), 'utf8')) as unknown
  return buildConfig(raw, (p) => existsSync(join(ROOT, p)))
}

export function args(argv = process.argv.slice(2)): Record<string, string> {
  const out: Record<string, string> = {}
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i]!
    if (!a.startsWith('--')) continue
    const next = argv[i + 1]
    if (next === undefined || next.startsWith('--')) out[a.slice(2)] = 'true'
    else {
      out[a.slice(2)] = next
      i++
    }
  }
  return out
}

export function freeGb(path = ROOT): number {
  const s = statfsSync(path)
  return (s.bavail * s.bsize) / 1e9
}

export function requireDisk(cfg: Config): void {
  const min = cfg.raw.sandbox.minFreeDiskGb
  const free = freeGb()
  if (free < min) {
    console.error('refusing to start: ' + free.toFixed(1) + ' GB free, need ' + min)
    process.exit(2)
  }
}

function treeStamp(): string {
  const parts: string[] = []
  const walk = (dir: string): void => {
    if (!existsSync(dir)) return
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name)
      const st = statSync(p)
      if (st.isDirectory()) walk(p)
      else parts.push(p + ':' + st.size + ':' + Math.floor(st.mtimeMs))
    }
  }
  walk(join(ROOT, 'src'))
  walk(join(ROOT, 'public'))
  for (const f of ['index.html', 'vite.config.ts', 'config/showcase.json']) parts.push(f + ':' + Math.floor(statSync(join(ROOT, f)).mtimeMs))
  return createHash('sha256').update(parts.join('|')).digest('hex').slice(0, 16)
}

export function ensureBuild(force = false): Hashes {
  const h = computeHashes(ROOT) as Hashes & { tree?: string }
  h.tree = treeStamp()
  const stamp = join(DIST, 'build.json')
  let current: (Hashes & { tree?: string }) | null = null
  if (existsSync(stamp)) current = JSON.parse(readFileSync(stamp, 'utf8')) as Hashes & { tree?: string }
  if (force || !current || current.tree !== h.tree || current.engine !== h.engine || JSON.stringify(current.stops) !== JSON.stringify(h.stops)) {
    // On Windows npx is a command file, which Node starts through the shell only.
    execFileSync('npx', ['vite', 'build', '--logLevel', 'warn'], { cwd: ROOT, stdio: 'inherit', shell: process.platform === 'win32' })
    writeFileSync(stamp, JSON.stringify(h))
    linkDist()
  }
  return h
}

function sameBytes(a: string, b: string): boolean {
  const fa = openSync(a, 'r')
  const fb = openSync(b, 'r')
  try {
    const x = Buffer.alloc(1 << 20)
    const y = Buffer.alloc(1 << 20)
    for (;;) {
      const n = readSync(fa, x, 0, x.length, null)
      const m = readSync(fb, y, 0, y.length, null)
      if (n !== m) return false
      if (n === 0) return true
      if (x.compare(y, 0, n, 0, n) !== 0) return false
    }
  } finally {
    closeSync(fa)
    closeSync(fb)
  }
}

// A build copies everything under public/ into dist/. On this small disk each copy that is byte for byte the file under public/ is replaced by a hard link to it, so the textures are held once.
export function linkDist(): number {
  let linked = 0
  const walk = (dir: string): void => {
    for (const name of readdirSync(dir)) {
      const p = join(dir, name)
      const st = statSync(p)
      if (st.isDirectory()) {
        walk(p)
        continue
      }
      const src = join(ROOT, 'public', relative(DIST, p))
      if (!st.isFile() || st.size < 65536 || !existsSync(src)) continue
      const ss = statSync(src)
      if (!ss.isFile() || ss.size !== st.size || (ss.ino === st.ino && ss.dev === st.dev) || ss.dev !== st.dev) continue
      if (!sameBytes(p, src)) continue
      const tmp = p + '.lnk~'
      try {
        linkSync(src, tmp)
        renameSync(tmp, p)
        linked++
      } catch {
        rmSync(tmp, { force: true })
      }
    }
  }
  const assets = join(DIST, 'assets')
  if (existsSync(assets)) walk(assets)
  return linked
}

export interface OutputRecord {
  engineHash: string
  stopHashes: Record<string, string>
  format: string
  tier: string
  assets: string
  diag: string
  browser: string
  machine: string
  frame?: number
  first?: number
  last?: number
  extra?: Record<string, unknown>
}

export function machineId(): string {
  return hostname() + ' ' + cpus().length + 'x ' + (cpus()[0]?.model ?? 'cpu')
}

export function writeRecord(file: string, r: OutputRecord): void {
  mkdirSync(dirname(file), { recursive: true })
  writeFileSync(file + '.json', JSON.stringify(r, null, 1))
  lookFromRecord(file, r)
}

export function readRecord(file: string): OutputRecord | null {
  if (!existsSync(file + '.json') || !existsSync(file)) return null
  return JSON.parse(readFileSync(file + '.json', 'utf8')) as OutputRecord
}

export function recordMatches(r: OutputRecord | null, want: OutputRecord, stops: string[]): boolean {
  if (!r) return false
  if (r.engineHash !== want.engineHash || r.format !== want.format || r.tier !== want.tier || r.assets !== want.assets || r.diag !== want.diag) return false
  return stops.every((s) => r.stopHashes[s] === want.stopHashes[s])
}

export function formatId(cfg: Config, name: string | undefined): string {
  const n = name ?? 'master'
  if (cfg.formats[n]) return n
  const keys = cfg.formatKeys as Record<string, string>
  const id = keys[n]
  if (!id) throw new Error('unknown format ' + n)
  return id
}
