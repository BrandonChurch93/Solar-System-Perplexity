import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { appendFileSync, existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs'

export interface Restart { frame: number; reason: string }

export interface KeeperOptions<T> {
  open: () => Promise<T>
  maxRestarts: number
  pageFrames: number
  lost: (e: unknown) => string | null
  say: (line: string) => void
  closeAt?: number[]
  kill?: (src: T, frame: number) => Promise<void>
  closeWaitMs?: number
}

// One page at a time for a whole run: the old one is closed before the next is opened, the two never live at once. A frame whose page
// is lost is drawn again on a new page, a bounded number of times in one run; a page is left for a new one after pageFrames frames; and
// the judged finals, the largest pictures a measure draws, get a page that has drawn nothing before them. No number of a measure is read
// from what a page has drawn before.
export class Keeper<T extends { close(): Promise<void> }> {
  readonly restarts: Restart[] = []
  pages = 1
  planned = 0
  onPage = 0
  drawn = 0
  private src: T
  private view: ((src: T) => Promise<void>) | null = null
  private readonly closeAt: Set<number>

  constructor(first: T, private readonly o: KeeperOptions<T>) {
    this.src = first
    this.closeAt = new Set(o.closeAt ?? [])
  }

  get page(): T {
    return this.src
  }

  async setView(set: (src: T) => Promise<void>): Promise<void> {
    this.view = set
    await set(this.src)
  }

  private async leave(): Promise<void> {
    const wait = this.o.closeWaitMs ?? 20000
    let timer: ReturnType<typeof setTimeout> | undefined
    await Promise.race([
      this.src.close().catch(() => undefined),
      new Promise<void>((resolve) => {
        timer = setTimeout(resolve, wait)
      }),
    ])
    clearTimeout(timer)
  }

  private async next(): Promise<void> {
    this.src = await this.o.open()
    this.pages++
    this.onPage = 0
    if (this.view) await this.view(this.src)
  }

  async fresh(): Promise<void> {
    if (this.onPage <= 0) return
    await this.leave()
    await this.next()
    this.planned++
  }

  async draw<R>(frame: number, fn: (src: T) => Promise<R>): Promise<R> {
    if (this.o.pageFrames > 0 && this.onPage >= this.o.pageFrames) {
      const had = this.onPage
      await this.fresh()
      this.o.say('a fresh page before frame ' + frame + ', after ' + had + ' frames on the last (page ' + this.pages + ')')
    }
    for (;;) {
      try {
        if (this.closeAt.delete(frame) && this.o.kill) await this.o.kill(this.src, frame)
        const r = await fn(this.src)
        this.onPage++
        this.drawn++
        return r
      } catch (e) {
        const reason = this.o.lost(e)
        if (reason === null) throw e
        if (this.restarts.length >= this.o.maxRestarts) {
          await this.leave()
          throw new Error('the page was lost at frame ' + frame + ' and ' + this.o.maxRestarts + ' restart(s) are used up (--restarts ' + this.o.maxRestarts + '): ' + reason)
        }
        this.restarts.push({ frame, reason })
        this.o.say('restart ' + this.restarts.length + ' of ' + this.o.maxRestarts + ' at frame ' + frame + ' on a new page: ' + reason)
        await this.leave()
        await this.next()
      }
    }
  }

  async close(): Promise<void> {
    await this.leave()
  }
}

export type RecordKey = Record<string, string | number | boolean>

export interface Taken<G, F> { g13: Map<number, G>; finals: Map<string, F>; said: string }

export function sha256(data: Buffer | string): string {
  return createHash('sha256').update(data).digest('hex')
}

function differs(a: RecordKey, b: RecordKey): string[] {
  return [...new Set([...Object.keys(a), ...Object.keys(b)])].filter((k) => a[k] !== b[k]).sort()
}

// The record of a run: its first line is what the run was drawn with, each further line one finished frame. A record whose first line
// is not this run's to the letter is not taken up; a last line torn by the run's end is dropped.
export function takeUp<G extends { frame: number }, F extends { frame: number; tier: string }>(file: string, key: RecordKey, fresh = false): Taken<G, F> {
  const none = (said: string): Taken<G, F> => {
    writeFileSync(file, JSON.stringify({ key }) + '\n')
    return { g13: new Map(), finals: new Map(), said }
  }
  if (!existsSync(file)) return none('')
  if (fresh) return none('a record of an earlier run is there and --fresh was given: not taken up')
  const rows = readFileSync(file, 'utf8').split('\n')
  let head: { key?: RecordKey } | null = null
  try {
    head = JSON.parse(rows[0] ?? '') as { key?: RecordKey }
  } catch {
    head = null
  }
  if (!head || typeof head.key !== 'object' || head.key === null) return none('the record of an earlier run has no readable first line: not taken up')
  const off = differs(head.key, key)
  if (off.length) return none('the record of an earlier run does not match this build (' + off.map((k) => k + ' ' + String(head.key![k]).slice(0, 16) + ' against ' + String(key[k]).slice(0, 16)).join('; ') + '): not taken up')
  const g13 = new Map<number, G>()
  const finals = new Map<string, F>()
  const good: string[] = [rows[0]!]
  let torn = 0
  for (const line of rows.slice(1)) {
    if (line === '') continue
    let row: { g13?: G; final?: F }
    try {
      row = JSON.parse(line) as { g13?: G; final?: F }
    } catch {
      torn++
      break
    }
    if (row.g13 && Number.isInteger(row.g13.frame)) g13.set(row.g13.frame, row.g13)
    else if (row.final && Number.isInteger(row.final.frame)) finals.set(row.final.tier + ' ' + row.final.frame, row.final)
    else {
      torn++
      break
    }
    good.push(line)
  }
  writeFileSync(file, good.join('\n') + '\n')
  return { g13, finals, said: 'took up the record of an earlier run of this build: ' + g13.size + ' texel frame(s) and ' + finals.size + ' judged final(s) done' + (torn ? '; its last line was torn and is dropped' : '') }
}

export function note(file: string, row: Record<string, unknown>): void {
  appendFileSync(file, JSON.stringify(row) + '\n')
}

export function forget(file: string): void {
  rmSync(file, { force: true })
}

export function holding(browserPath: string): string {
  try {
    const rows = execFileSync('ps', ['-eo', 'rss=,args='], { encoding: 'utf8' }).split('\n').filter((l) => l.includes(browserPath))
    const mb = (pick: (l: string) => boolean): number => Math.round(rows.filter(pick).reduce((t, l) => t + Number(l.trim().split(/\s+/)[0]), 0) / 1024)
    const free = /MemAvailable:\s+(\d+)/.exec(readFileSync('/proc/meminfo', 'utf8'))
    return '; the browser holds ' + mb(() => true) + ' MB (drawing process ' + mb((l) => l.includes('--type=gpu-process')) + ', page ' + mb((l) => l.includes('--type=renderer')) + '), ' + (free ? Math.round(Number(free[1]) / 1024) : 'unknown') + ' MB free on the machine'
  } catch {
    return ''
  }
}
