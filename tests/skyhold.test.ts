import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config } from '../src/config'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { bandHeld, galactic } from '../src/space/sky'
import skyFrame from '../src/space/skyframe.json'

const HOLD = config.raw.travel.sky.bandHold as Record<string, number[]>
const CLEAR: Record<string, number> = { uranus: skyFrame.band.latSpanDeg * skyFrame.band.fadeEnd, neptune: 5 }
const NX = 49
const NY = 29

describe('the hold of the band of the sky in a rise', () => {
  const director = new FilmDirector(plans)
  const gal = galactic()
  const v = new THREE.Vector3()
  const clear = (frame: number): number => {
    const s = director.shotAt(frame, frame / config.fps)
    const rot = new THREE.Matrix4().makeRotationFromQuaternion(s.skyQuaternion)
    const turn = new THREE.Matrix4().makeRotationFromQuaternion(s.skyTurn.clone().invert().premultiply(director.sky ? director.sky.frame : new THREE.Quaternion()))
    const th = Math.tan(THREE.MathUtils.degToRad(s.camera.vfov) / 2)
    let min = 90
    for (let j = 0; j < NY; j++) for (let i = 0; i < NX; i++) {
      v.set((i / (NX - 1) * 2 - 1) * th * 16 / 9, (j / (NY - 1) * 2 - 1) * th, -1).normalize().applyMatrix4(rot).applyMatrix4(turn).applyMatrix3(gal)
      min = Math.min(min, Math.abs(THREE.MathUtils.radToDeg(Math.asin(Math.min(Math.max(v.z, -1), 1)))))
    }
    return min
  }

  it('is whole at the start of a rise, gone at its end and never rises between', () => {
    for (const id of Object.keys(HOLD)) {
      expect(bandHeld(id, 0)).toBe(1)
      expect(bandHeld(id, HOLD[id]![0]!)).toBe(1)
      expect(bandHeld(id, HOLD[id]![1]!)).toBe(0)
      expect(HOLD[id]![1]!).toBeLessThan(1)
      let last = 1
      for (let k = 0; k <= 1000; k++) {
        const now = bandHeld(id, k / 1000)
        expect(now).toBeLessThanOrEqual(last)
        last = now
      }
    }
    expect(bandHeld('saturn', 0.5)).toBe(0)
  })

  for (const id of Object.keys(HOLD)) {
    it('falls in the rise of ' + id + ' only while the middle line of the band stands off the frame, and is gone before the rise ends', () => {
      const seg = config.segments.find((x) => x.stop === id && x.kind === 'rise')!
      const first = Math.ceil(seg.start * config.fps)
      const last = Math.ceil(seg.end * config.fps) - 1
      const broken: string[] = []
      let falling = 0
      for (let f = first; f <= last; f++) {
        const s = director.shotAt(f, f / config.fps)
        expect(s.segment.stop).toBe(id)
        expect(s.segment.kind).toBe('rise')
        const w = bandHeld(id, s.u)
        if (w > 0.01 && w < 0.99) {
          falling++
          const c = clear(f)
          if (c < CLEAR[id]!) broken.push('frame ' + f + ': weight ' + w.toFixed(3) + ', the band ' + c.toFixed(1) + ' degrees off the frame, wanted ' + CLEAR[id])
        }
        if ((s.skyStars ?? 0) < 0.999 && w < 0.99 && w > 0 && clear(f) === 0) broken.push('frame ' + f + ': the band crosses the frame under a lift of ' + (s.skyStars ?? 0).toFixed(3) + ' with the hold at ' + w.toFixed(3))
      }
      if (broken.length) console.log(broken.join('\n'))
      expect(broken).toEqual([])
      expect(falling).toBeGreaterThan(3)
      expect(bandHeld(id, director.shotAt(last, last / config.fps).u)).toBe(0)
    })
  }
})
