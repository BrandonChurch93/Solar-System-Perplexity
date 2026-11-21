import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import frame from '../src/space/skyframe.json'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'

describe('sky frame', () => {
  const director = new FilmDirector(plans)
  const sky = director.sky
  const close = (a: number[], b: number[]): void => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6))

  it('the fitted stop keeps the patch aims stored with the arguments', () => {
    const stored = (frame.patches as Record<string, { orbit: number[]; terrain: number[] }>)[frame.args.stop]!
    close(sky.patches[frame.args.stop]!.orbit.toArray(), stored.orbit)
    close(sky.patches[frame.args.tstop]!.terrain.toArray(), stored.terrain)
  })

  it('every stop has an orbit patch aim on the view of its judged hold frame', () => {
    for (const p of plans) {
      const aim = sky.patches[p.id]
      expect(aim).toBeDefined()
      const frameNo = config.segments.find((s) => s.id === p.id + '.hold')!
      const judged = frameNo.firstFrame + Math.floor(config.raw.judged.fractions.hold * frameNo.frames + 1e-9)
      const cam = director.shotAt(judged, judged / config.fps).camera.quaternion
      const turn = sky.orbits[p.id]
      const want = (turn ? sky.frame.clone().multiply(turn.clone().invert()) : sky.frame.clone()).multiply(cam)
      expect(Math.abs(want.dot(aim!.orbit))).toBeGreaterThan(1 - 1e-6)
    }
  })

  it('a terrain turn puts the judged terrain view on the aim its plan asks for', () => {
    for (const [id, turn] of Object.entries(sky.turns)) {
      const seg = config.segments.find((s) => s.id === id + '.terrain')!
      const judged = seg.firstFrame + Math.floor(config.raw.judged.fractions.terrain * seg.frames + 1e-9)
      const cam = director.shotAt(judged, judged / config.fps).camera.quaternion
      const seen = sky.frame.clone().multiply(turn.clone().invert()).multiply(cam)
      expect(Math.abs(seen.dot(sky.patches[id]!.terrain))).toBeGreaterThan(1 - 1e-6)
      expect(turn).toBeInstanceOf(THREE.Quaternion)
    }
  })
})
