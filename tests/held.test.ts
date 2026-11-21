import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { config } from '../src/config'
import { midShutterCarry } from '../src/core/held'
import type { Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'

const director = new FilmDirector(plans)
const ends = (f: number): [Shot, Shot, Shot] => [0, config.shutterFraction / 2, config.shutterFraction].map((o) => director.shotAt(f, (f + o) / config.fps)) as [Shot, Shot, Shot]
const first = (kind: string, stop: string): number => {
  const s = config.segments.find((x) => x.kind === kind && x.stop === stop)!
  return s.firstFrame + Math.floor(s.frames / 2)
}

describe('mid shutter carry', () => {
  it('shows a point of the set in a sample where the mid shutter view shows it', () => {
    const f = first('rise', 'sun')
    const [open, mid] = ends(f)
    const carry = midShutterCarry(new THREE.Matrix4(), open, open.sets[0]!, mid, mid.sets[0]!)
    const world = (shot: Shot): THREE.Matrix4 => new THREE.Matrix4().compose(shot.sets[0]!.origin.clone().sub(shot.camera.position), shot.sets[0]!.rotation, new THREE.Vector3(1, 1, 1))
    const seen = (shot: Shot, p: THREE.Vector3): [number, number] => {
      const v = p.clone().applyQuaternion(shot.camera.quaternion.clone().invert())
      const k = 1 / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2) / -v.z
      return [v.x * k, v.y * k]
    }
    for (const local of [new THREE.Vector3(0.3, 0.2, 0.9), new THREE.Vector3(-40, 12, 5), new THREE.Vector3(0, 900, -300)]) {
      const want = seen(mid, local.clone().applyMatrix4(world(mid)))
      const plain = seen(open, local.clone().applyMatrix4(world(open)))
      const got = seen(open, local.clone().applyMatrix4(world(open)).applyMatrix4(carry))
      expect(got[0]).toBeCloseTo(want[0], 9)
      expect(got[1]).toBeCloseTo(want[1], 9)
      expect(Math.hypot(plain[0] - want[0], plain[1] - want[1])).toBeGreaterThan(1e-6)
    }
  })
})
