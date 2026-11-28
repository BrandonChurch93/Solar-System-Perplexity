// The files of the local render handoff. The small ones (facts.json, the cost table) are on main under handoff/local-render.
// The large ones (the subtitle strips, the sound, the reference frames) are on the branch named in facts.json, so that the
// tree of main stays small. ensureHandoffFiles fetches what is missing with git and proves every file by size and sha256.

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { ROOT } from './common'

export const HAND = join(ROOT, 'handoff', 'local-render')

export interface FileFact { path: string; bytes: number; sha256: string }
export interface BandFact { file: string; width: number; height: number; y: number; frames: number; fps: number; probeSeconds: number }
export interface FrameFact { capture: number; ref: string | null; what: string; lookPsnr?: number; lookSsim?: number; limitNote?: string }
export interface TestFact { id: string; format: string; refWidth: number; refHeight: number; frames: FrameFact[] }
export interface Facts {
  engineHash: string
  assetsBranch: string
  band: BandFact
  bandMaster?: BandFact
  sound: { file: string }
  files: FileFact[]
  tests: TestFact[]
  costTable: string
  thresholds: { stopPsnr: number; lookPsnr: number; lookSsim: number; lookHours: number; minGpuUtil: number }
}

export function loadFacts(): Facts | null {
  const p = join(HAND, 'facts.json')
  return existsSync(p) ? (JSON.parse(readFileSync(p, 'utf8')) as Facts) : null
}

export function sha256File(file: string): string {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

function good(f: FileFact): boolean {
  const p = join(HAND, f.path)
  return existsSync(p) && statSync(p).size === f.bytes && sha256File(p) === f.sha256
}

// Returns the number of files fetched and one line for every file that is still missing or wrong.
export function ensureHandoffFiles(facts: Facts, only?: string[]): { fetched: number; problems: string[] } {
  const list = facts.files.filter((f) => !only || only.includes(f.path))
  const todo = list.filter((f) => !good(f))
  const problems: string[] = []
  if (todo.length === 0) return { fetched: 0, problems }
  try {
    execFileSync('git', ['fetch', '--depth', '1', 'origin', facts.assetsBranch], { cwd: ROOT, stdio: ['ignore', 'ignore', 'pipe'] })
  } catch (e) {
    const err = String((e as { stderr?: Buffer }).stderr ?? e).trim().split(/\r?\n/).slice(-3).join(' ')
    return { fetched: 0, problems: ['git could not fetch the branch ' + facts.assetsBranch + ' that holds ' + todo.length + ' handoff files: ' + err] }
  }
  const tip = execFileSync('git', ['rev-parse', 'FETCH_HEAD'], { cwd: ROOT, encoding: 'utf8' }).trim()
  let fetched = 0
  for (const f of todo) {
    const p = join(HAND, f.path)
    try {
      const blob = execFileSync('git', ['cat-file', 'blob', tip + ':' + f.path], { cwd: ROOT, maxBuffer: 1 << 28 })
      mkdirSync(dirname(p), { recursive: true })
      writeFileSync(p, blob)
      fetched++
    } catch {
      problems.push('the handoff file ' + f.path + ' is not on the branch ' + facts.assetsBranch + '.')
      continue
    }
    if (!good(f)) problems.push('the handoff file ' + f.path + ' is not the recorded one (' + statSync(p).size + ' bytes here, ' + f.bytes + ' recorded, or another sha256).')
  }
  return { fetched, problems }
}
