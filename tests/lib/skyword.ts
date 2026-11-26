import { existsSync, readFileSync } from 'node:fs'
import { ownSkyDrawn, ownSkyWeight, sharedSkyWeight } from '../../src/core/skyfloor'
import type { Shot } from '../../src/core/types'
import type { StopPlan } from '../../src/director/moves'
import { plans } from '../../src/director/plans'

// The word both of a stop's sky pictures (SkyPatch.both, core/types.ts), as far as a unit can know it. A unit has no set to ask. So
// the word is read where a stop of the film writes its sky pictures down, src/stops/ID/sky.json: under the view a picture names
// (orbit, terrain) one definition or a list of them, and both: true on a definition is the word. A stop that says the word anywhere
// else is not seen here and is held to the laws of a stop without it. A plan made in memory has no such file, whatever its id: it
// carries the word where the test that makes it says so (sayBoth), and nowhere else.
const VIEWS = ['orbit', 'terrain']
const said = new WeakMap<StopPlan, string[]>()
const files = new Map<string, string[]>()

function written(id: string): string[] {
  let views = files.get(id)
  if (!views) {
    const url = new URL('../../src/stops/' + id + '/sky.json', import.meta.url)
    const file = existsSync(url) ? (JSON.parse(readFileSync(url, 'utf8')) as Record<string, unknown>) : {}
    views = VIEWS.filter((view) => ([] as unknown[]).concat(file[view] ?? []).some((def) => (def as { both?: unknown } | null)?.both === true))
    files.set(id, views)
  }
  return views
}

// Says for a plan made in memory which of its sky pictures say both, by the views they name. Returns the plan.
export function sayBoth<T extends StopPlan>(plan: T, views: string[]): T {
  said.set(plan, [...views])
  return plan
}

// The views named by the sky pictures of a plan's stop that say both. None: the stop does not carry the word.
export function bothViews(plan: StopPlan): string[] {
  return said.get(plan) ?? (plans.includes(plan) ? written(plan.id) : [])
}

// The weight the engine gives a sky picture of the shot's own stop in a dive or a rise, before the picture's own weight by time, as
// its loop takes it (core/engine.ts, the sky patches of a sample): by the shot's two shares where it has one, and where it has none
// by the picture's word. view: the view the picture names. both: whether it says the word.
export function skyDrawn(shot: Shot, view: string, both: boolean): number {
  const kind = shot.segment.kind
  const side = shot.sets[0]!.view
  const share = shot.skyShare ?? 0
  if (share > 0 || shot.skyShareHigh !== undefined) return sharedSkyWeight(view, side, kind, share, shot.skyShareHigh)
  const word = both ? true : undefined
  return ownSkyDrawn(view, side, kind, word) ? ownSkyWeight(kind, side, false, false, 0, undefined, word) : 0
}
