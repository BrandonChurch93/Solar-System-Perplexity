import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { StopPlan, type Fit, type MoveParams } from '../../src/director/moves'
import { plans } from '../../src/director/plans'
import { setCoverWindow, setHandover } from '../../src/director/timeline'
import frozen from '../fixtures/covered.json'

export const COVERED = 'mars'

export const coveredFit = frozen.fit as Fit

export function coveredParams(): MoveParams {
  return JSON.parse(JSON.stringify(frozen.params)) as MoveParams
}

export function coveredPlan(more: Partial<MoveParams> = {}): StopPlan {
  return new StopPlan(COVERED, coveredFit, { ...coveredParams(), ...more })
}

export function filmWith(plan: StopPlan): FilmDirector {
  return new FilmDirector(plans.map((p) => (p.id === plan.id ? plan : p)))
}

// The covered stop on a path of its own class (the generic descent and ascent of moves.ts, which the stops named in handover.ownPath still
// fly) or on the engine's one move. A test file that tests the paths of the classes calls ownPath(true) before it makes a plan; every test
// file has a config of its own, so the list needs no restoring.
export function ownPath(on: boolean): void {
  const list = config.raw.handover.ownPath as string[]
  const at = list.indexOf(COVERED)
  if (on && at < 0) list.push(COVERED)
  if (!on && at >= 0) list.splice(at, 1)
}

export function restorePlans(): void {
  for (const p of plans) {
    setCoverWindow(p.id, p.p.coverWindow)
    setHandover(p.id, p.p.handover)
  }
}
