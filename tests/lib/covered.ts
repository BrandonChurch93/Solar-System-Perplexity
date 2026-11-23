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

export function restorePlans(): void {
  for (const p of plans) {
    setCoverWindow(p.id, p.p.coverWindow)
    setHandover(p.id, p.p.handover)
  }
}
