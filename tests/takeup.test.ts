import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'

interface Job { name: string; message: string; takeUp?: string }

const root = fileURLToPath(new URL('..', import.meta.url))
const round = 987654
const dir = join(root, 'out/work/rounds/round-' + round)
const cache = 'out/work/packs/.cache/round-' + round
const run = (...more: string[]): string => execFileSync('python3', ['tools/round.py', 'jobs', '--round', String(round), '--scratch', ...more], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
let jobs: Job[] = []
let written = ''

beforeAll(() => {
  if (existsSync(dir)) throw new Error(dir + ' exists: the test would write over it')
  mkdirSync(dir, { recursive: true })
  writeFileSync(join(dir, 'state.json'), JSON.stringify({ commit: '0123456789abcdef0123456789abcdef01234567', phase: 4, stop: 'earth', tier: 'draft', engineHash: 'e', stopHash: 's' }))
  run('--stop', 'earth')
  written = readFileSync(join(dir, 'jobs.json'), 'utf8')
  jobs = JSON.parse(written) as Job[]
})

afterAll(() => rmSync(dir, { recursive: true, force: true }))

describe('the jobs of a round', () => {
  it('leave the frame folder of a stopped pack out of every tar', () => {
    expect(jobs.length).toBe(8)
    for (const j of jobs) {
      const tar = /`(tar -cf [^`]+)`/.exec(j.message)![1]!
      expect(tar.startsWith('tar -cf /tmp/' + j.name + ".tar --exclude='.frames*' out/work/")).toBe(true)
    }
    const source = readFileSync(join(root, 'tools/round.py'), 'utf8').split('\n').filter((l) => l.includes('tar -cf '))
    expect(source.length).toBe(2)
    for (const l of source) expect(l).toContain("`tar -cf /tmp/%s.tar --exclude=\\'.frames*\\' %s`")
  })

  it('wipe the cache of the round in the first sending of a pack part only', () => {
    const packs = jobs.filter((j) => j.message.includes('npm run pack -- '))
    expect(packs.map((j) => j.name)).toEqual(['stills', 'views', 'dive', 'dive-cover', 'rise', 'rise-cover'].map((x) => 'r' + round + '-earth-' + x))
    for (const j of packs) {
      const wipe = 'Before the command: `rm -rf ' + cache + ' out/work/stills/*-draft-full.png*`. '
      expect(j.message).toContain(wipe)
      expect(j.takeUp).toBeDefined()
      expect(j.takeUp).not.toContain('rm -')
      expect(j.takeUp).not.toContain('Before the command')
      const [head, tail] = j.message.split(wipe)
      expect(j.takeUp!.startsWith(head!)).toBe(true)
      expect(j.takeUp!.endsWith(tail!)).toBe(true)
      expect(j.takeUp!.slice(head!.length, j.takeUp!.length - tail!.length)).toBe('Take up of a stopped run: remove nothing first, the command draws only what this build does not hold yet. ')
    }
    for (const j of jobs.filter((x) => packs.includes(x) === false)) expect(j.takeUp).toBeUndefined()
  })

  it('prints the take up form of the named jobs and writes nothing', () => {
    const cover = jobs.find((j) => j.name.endsWith('-rise-cover'))!
    const measure = jobs.find((j) => j.name.endsWith('-measure'))!
    expect(run('--take-up', cover.name + ',' + measure.name)).toBe(cover.takeUp + '\n' + measure.message + '\n')
    expect(readFileSync(join(dir, 'jobs.json'), 'utf8')).toBe(written)
    expect(() => run('--take-up', 'r' + round + '-earth-nothing')).toThrow(/not a job of round/)
  })

  it('gives the film jobs the same second form', () => {
    const lines = readFileSync(join(root, 'tools/round.py'), 'utf8').split('\n')
    const at = lines.findIndex((l) => l.startsWith('def film_jobs('))
    const body = lines.slice(at, lines.findIndex((l, i) => i > at && l.startsWith('def film_place('))).join('\n')
    expect(body).toContain("if a.take_up:\n        return take_up(n, a.take_up)")
    expect(body).toContain("'message': text(before), **({'takeUp': text(TAKE_UP)} if before else {})")
    expect(body.match(/'message': 'JOB /g)!.length).toBe(2)
  })
})
