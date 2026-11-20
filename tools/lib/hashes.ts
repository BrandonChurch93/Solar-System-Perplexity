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

function hashFiles(root: string, files: string[]): string {
  const h = createHash('sha256')
  for (const f of files.sort()) {
    h.update(relative(root, f).split('\\').join('/'))
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
  const stopsDir = join(root, 'src/stops') + '/'
  for (const f of src) if (!f.startsWith(stopsDir)) engineFiles.push(f)
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
