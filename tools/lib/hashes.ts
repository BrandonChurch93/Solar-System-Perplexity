import { createHash } from 'node:crypto'
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'

function walk(dir: string, out: string[]): void {
  if (!existsSync(dir)) return
  for (const name of readdirSync(dir).sort()) {
    const p = join(dir, name)
    if (statSync(p).isDirectory()) walk(p, out)
    else out.push(p)
  }
}

// Paths are named with forward slashes and sorted by that name, so the hashes are the same on Windows as on Linux and macOS.
const slash = (p: string): string => p.split('\\').join('/')

function hashFiles(root: string, files: string[]): string {
  const h = createHash('sha256')
  const named = files.map((f) => [slash(relative(root, f)), f] as const).sort((x, y) => (x[0] < y[0] ? -1 : x[0] > y[0] ? 1 : 0))
  for (const [name, f] of named) {
    h.update(name)
    h.update('\0')
    h.update(readFileSync(f))
    h.update('\0')
  }
  return h.digest('hex').slice(0, 16)
}

export interface Hashes { engine: string; stops: Record<string, string>; versions: Record<string, string> }

export function computeHashes(root: string): Hashes {
  const cfg = JSON.parse(readFileSync(join(root, 'config/showcase.json'), 'utf8')) as { stops: { id: string }[] }
  const engineFiles: string[] = []
  const src: string[] = []
  walk(join(root, 'src'), src)
  const stopsDir = slash(join(root, 'src/stops')) + '/'
  for (const f of src) if (!slash(f).startsWith(stopsDir)) engineFiles.push(f)
  walk(join(root, 'public/assets/shared'), engineFiles)
  walk(join(root, 'public/assets/third-party'), engineFiles)
  walk(join(root, 'config'), engineFiles)
  const lock = join(root, 'package-lock.json')
  if (existsSync(lock)) engineFiles.push(lock)
  const stops: Record<string, string> = {}
  for (const s of cfg.stops) {
    const files: string[] = []
    walk(join(root, 'src/stops', s.id), files)
    walk(join(root, 'public/assets', s.id), files)
    stops[s.id] = hashFiles(root, files)
  }
  const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { dependencies: Record<string, string>; devDependencies: Record<string, string> }
  const versions: Record<string, string> = { ...pkg.dependencies, vite: pkg.devDependencies.vite ?? '', typescript: pkg.devDependencies.typescript ?? '' }
  return { engine: hashFiles(root, engineFiles), stops, versions }
}
