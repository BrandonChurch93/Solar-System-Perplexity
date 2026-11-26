import { existsSync, mkdirSync, readdirSync, renameSync, rmSync } from 'node:fs'
import { join } from 'node:path'

const record = (file: string): string => file + '.json'

export function kept(dir: string): string[] {
  if (existsSync(dir) === false) return []
  return readdirSync(dir).filter((f) => f.endsWith('.png') && existsSync(record(join(dir, f)))).sort()
}

export function framesFolder(stage: string): { dir: string; waiting: string[] } {
  const dir = join(stage, '.frames')
  mkdirSync(dir, { recursive: true })
  for (const name of readdirSync(stage).sort()) {
    if (name.startsWith('.frames-') === false) continue
    const old = join(stage, name)
    for (const file of kept(old)) {
      if (existsSync(record(join(dir, file)))) continue
      renameSync(join(old, file), join(dir, file))
      renameSync(record(join(old, file)), record(join(dir, file)))
    }
    rmSync(old, { recursive: true, force: true })
  }
  return { dir, waiting: kept(dir) }
}

export function leave(dir: string, used: Iterable<string>, good: boolean): string[] {
  if (good) {
    for (const file of used) {
      rmSync(file, { force: true })
      rmSync(record(file), { force: true })
    }
  }
  const left = kept(dir)
  if (left.length === 0) rmSync(dir, { recursive: true, force: true })
  return left
}
