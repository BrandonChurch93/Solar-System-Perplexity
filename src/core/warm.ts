import table from './warm.json'
import { config } from '../config'
import { clipRange, segmentAtFrame, setsForFrame } from '../director/timeline'
import { beltSegment } from '../space/belt/motion'
import type { Engine } from './engine'
import type { StopSet } from './types'

interface Done { sets: (StopSet | undefined)[]; format: string; assets: string; tier: string }

const OPEN = ['hold']

export class Warm {
  private readonly done = new Map<number, Done>()
  private readonly frames: number[] = [...(table.frames as number[])].sort((a, b) => a - b)
  private loading = ''
  private pending: Promise<void> = Promise.resolve()

  private wait(job: Promise<void>): void {
    this.pending = Promise.all([this.pending, job.catch((e: unknown) => console.error(e))]).then(() => undefined)
  }

  load(engine: Engine, p: number, last: number): void {
    const frame = Math.min(Math.max(Math.floor(p), 0), config.frameCount - 1)
    const segment = segmentAtFrame(frame)
    const at = config.stopIds.indexOf(segment.stop)
    if (segment.kind === 'travel' || at < 0 || at + 1 >= config.stopIds.length || segment.endFrame > last || setsForFrame(frame).length !== 1) return
    const want = [segment.stop, config.stopIds[at + 1]!]
    const key = want.join('|') + '|' + engine.assets
    if (this.loading !== key && !want.every((id) => engine.sets.has(id, engine.assets))) {
      this.loading = key
      this.wait(engine.prefetch(want).finally(() => {
        if (this.loading === key) this.loading = ''
      }))
    }
    const belt = beltSegment()
    if (belt.stop === segment.stop && want.every((id) => engine.sets.has(id, engine.assets)) && !engine.belt.ready(belt.firstFrame, engine.assets)) {
      engine.belt.keep(clipRange(segment.stop).firstFrame)
      this.wait(engine.belt.prepare(belt.firstFrame, engine.assets, engine.renderer))
    }
  }

  private due(engine: Engine, stop: string, tier: string): number[] {
    return this.frames.filter((g) => {
      const ids = setsForFrame(g)
      if (ids[0] !== stop || !engine.ready(g)) return false
      const was = this.done.get(g)
      return !was || was.format !== engine.format.id || was.assets !== engine.assets || was.tier !== tier || ids.some((id, i) => was.sets[i] !== engine.sets.get(id))
    })
  }

  async run(engine: Engine, p: number, tier: string, last: number, all: boolean): Promise<number> {
    if (all) await engine.prepare(p)
    for (let i = 0; i < 2; i++) {
      this.load(engine, p, last)
      await this.pending
    }
    return this.step(engine, p, tier, last, all)
  }

  step(engine: Engine, p: number, tier: string, last: number, all: boolean): number {
    const frame = Math.min(Math.max(Math.floor(p), 0), config.frameCount - 1)
    this.load(engine, p, last)
    const segment = segmentAtFrame(frame)
    if (!all && !OPEN.includes(segment.kind)) return 0
    let drawn = 0
    for (const g of this.due(engine, setsForFrame(frame)[0]!, tier)) {
      engine.warmDraw(g, tier)
      this.done.set(g, { sets: setsForFrame(g).map((id) => engine.sets.get(id)), format: engine.format.id, assets: engine.assets, tier })
      drawn++
      if (!all) break
    }
    return drawn
  }
}
