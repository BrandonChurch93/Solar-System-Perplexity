import { describe, expect, it } from 'vitest'
import * as THREE from 'three'
import { config } from '../src/config'
import type { Shot } from '../src/core/types'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { aimAt, STAR_LEVEL, starShare } from '../src/space/aim'

const SECOND: [number, number, number] = [50, -15, 50]
const deg = (a: THREE.Quaternion, b: THREE.Quaternion): number => THREE.MathUtils.radToDeg(a.clone().normalize().angleTo(b.clone().normalize()))

describe('two sky aims of a stop', () => {
  const base = new FilmDirector(plans)
  const plan = [...plans].reverse().find((p) => p.p.skyAim?.terrain && !p.p.skyAim.dive && base.sky.turns[p.id])!
  const id = plan.id
  const seg = (kind: string) => config.segments.find((s) => s.id === id + '.' + kind)!
  const surface = seg('terrain')
  const judged = surface.firstFrame + Math.floor(config.raw.judged.fractions.terrain * surface.frames + 1e-9)
  const span: [number, number] = [judged - 6, judged + 6]
  const kept = plan.p.skyAim
  const build = (aim: typeof kept): FilmDirector => {
    plan.p.skyAim = aim
    try {
      return new FilmDirector(plans)
    } finally {
      plan.p.skyAim = kept
    }
  }
  const film = build({ ...kept, dive: SECOND, turn: span })
  const times: number[] = []
  for (let f = seg('dive').firstFrame; f < seg('rise').endFrame; f += 3.5) times.push(f)
  for (let f = span[0] - 1; f <= span[1] + 2; f += 0.125) times.push(f)
  const pair = (f: number): [Shot, Shot] => [base.shotAt(Math.floor(f), f / config.fps), film.shotAt(Math.floor(f), f / config.fps)]
  const rest = (s: Shot): string => {
    const o = JSON.parse(JSON.stringify(s)) as Record<string, unknown>
    delete o.skyTurn
    delete o.skyPlate
    return JSON.stringify(o)
  }

  it('a stop that names one aim has no second turn and its shots carry no plate aim', () => {
    expect(base.sky.dives[id]).toBeUndefined()
    for (const f of times) expect(base.shotAt(Math.floor(f), f / config.fps).skyPlate).toBeUndefined()
  })

  it('the second aim is read as the first: the judged surface view lies on it under the dive turn', () => {
    const d = film.sky.dives[id]!
    const cam = film.shotAt(judged, judged / config.fps).camera.quaternion
    const seen = film.sky.frame.clone().multiply(d.turn.clone().invert()).multiply(cam)
    expect(Math.abs(seen.dot(aimAt(SECOND[0], SECOND[1], SECOND[2])))).toBeGreaterThan(1 - 1e-6)
    expect(d.from).toBeCloseTo(span[0] / config.fps, 12)
    expect(d.to).toBeCloseTo((span[1] + 1) / config.fps, 12)
    expect(film.sky.turns[id]!.toArray()).toEqual(base.sky.turns[id]!.toArray())
    expect(film.sky.patches[id]!.terrain.toArray()).toEqual(base.sky.patches[id]!.terrain.toArray())
  })

  it('the surface view holds the dive turn before the named frames and the first turn after them', () => {
    const d = film.sky.dives[id]!
    const before = film.shotAt(span[0] - 1, (span[0] - 0.01) / config.fps)
    const after = film.shotAt(span[1] + 1, (span[1] + 1.01) / config.fps)
    expect(before.skyTurn.toArray()).toEqual(d.turn.toArray())
    expect(before.skyPlate).toEqual({ aim: d.aim, turning: false })
    expect(after.skyTurn.toArray()).toEqual(film.sky.turns[id]!.toArray())
    expect(after.skyPlate).toEqual({ aim: film.sky.patches[id]!.terrain, turning: false })
    const mid = film.shotAt(judged, (judged + 0.5) / config.fps)
    expect(mid.skyPlate!.turning).toBe(true)
    expect(deg(mid.skyTurn, d.turn)).toBeCloseTo(deg(d.turn, film.sky.turns[id]!) / 2, 3)
  })

  it('the turn is a function of time without a step', () => {
    const d = film.sky.dives[id]!
    const whole = deg(d.turn, film.sky.turns[id]!)
    expect(whole).toBeGreaterThan(1)
    const step = 1 / 64
    let largest = 0
    let sum = 0
    for (let f = span[0] - 1; f < span[1] + 2; f += step) {
      const a = film.shotAt(Math.floor(f), f / config.fps).skyTurn
      const b = film.shotAt(Math.floor(f + step), (f + step) / config.fps).skyTurn
      largest = Math.max(largest, deg(a, b))
      sum += deg(a, b)
    }
    expect(sum).toBeCloseTo(whole, 3)
    expect(largest).toBeLessThan(((whole * 1.875) / (span[1] + 1 - span[0])) * step * 1.001)
  })

  it('nothing but the star turn and the plate aim moves: the camera, the Sun and the sky of the lens keep their values', () => {
    for (const f of times) {
      const [a, b] = pair(f)
      expect(rest(b)).toBe(rest(a))
      expect(b.sun.dir.toArray()).toEqual(a.sun.dir.toArray())
      expect(b.skyQuaternion.toArray()).toEqual(a.skyQuaternion.toArray())
    }
  })

  it('after the named frames every shot is the shot of the one aim, to the bit', () => {
    for (const f of times.filter((t) => t >= span[1] + 1)) {
      const [a, b] = pair(f)
      expect(b.skyTurn.toArray()).toEqual(a.skyTurn.toArray())
      expect(b.skyPlate!.aim.toArray()).toEqual(base.sky.patches[id]!.terrain.toArray())
    }
  })

  it('the surface plate keeps its place in the picture while the stars turn under it', () => {
    const place = (s: Shot, aim: THREE.Quaternion): THREE.Quaternion => aim.clone().invert().multiply(film.sky.frame).multiply(s.skyTurn.clone().invert()).multiply(s.skyQuaternion)
    let moved = 0
    for (let f = span[0] - 1; f <= span[1] + 2; f += 0.125) {
      const [a, b] = pair(f)
      expect(b.sets[0]!.view).toBe('terrain')
      moved = Math.max(moved, 1 - Math.abs(place(b, b.skyPlate!.aim).dot(place(a, base.sky.patches[id]!.terrain))))
    }
    expect(moved).toBeLessThan(1e-6)
  })

  it('a second aim without its frames, with frames out of order or outside the stop is refused when the film is built', () => {
    expect(() => build({ ...kept, dive: SECOND })).toThrow(/second sky aim/)
    expect(() => build({ ...kept, dive: SECOND, turn: [span[1], span[0]] })).toThrow(/second sky aim/)
    expect(() => build({ ...kept, dive: SECOND, turn: [seg('dive').firstFrame - 1, span[1]] })).toThrow(/second sky aim/)
    expect(() => build({ ...kept, dive: SECOND, turn: [span[0], seg('rise').endFrame] })).toThrow(/second sky aim/)
    expect(() => build({ ...kept, dive: SECOND, turn: [seg('dive').firstFrame, seg('rise').endFrame - 1] })).not.toThrow()
  })
})

describe('the share of the stars a plate leaves in the frame', () => {
  const frame = new THREE.Quaternion()
  const still = new THREE.Quaternion()
  const tan = Math.tan(THREE.MathUtils.degToRad(30))
  const plate = (margin: number, more: Partial<{ add: boolean; ring: [number, number, number, number]; unfold: [number, number] }> = {}, vfovDeg = 60) => {
    const wide = 1 + 2 * margin
    const reach = Math.tan(THREE.MathUtils.degToRad(vfovDeg / 2)) * wide
    return { aim: new THREE.Quaternion(), tan: [(reach * 16) / 9, reach] as [number, number], add: false, ring: [0.5, 0.5, -1, 0] as [number, number, number, number], edge: margin / wide, ...more }
  }
  const shot = (yawDeg: number, vfov = 60) => ({ skyQuaternion: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), THREE.MathUtils.degToRad(yawDeg)), skyTurn: still, camera: { vfov } })
  const share = (yawDeg: number, weight = 1, p = plate(0.125)): number => starShare(p, weight, shot(yawDeg), frame, 16 / 9)

  it('is nothing where every corner lies inside the full plate and grows as a corner leaves it', () => {
    expect(share(0, 1, plate(0.125, {}, 80))).toBe(0)
    expect(share(2, 1, plate(0.125, {}, 80))).toBe(0)
    expect(share(0, 1, plate(0.25))).toBeLessThan(1e-9)
    expect(share(0)).toBeLessThan(1e-9)
    let last = share(0)
    for (const yaw of [0.5, 1, 2, 3, 4, 5]) {
      const now = share(yaw)
      expect(now).toBeGreaterThan(last)
      last = now
    }
    expect(share(40)).toBe(1)
    expect(share(180)).toBe(1)
  })

  it('follows the feather of the sky shader at a corner', () => {
    const p = plate(0.125)
    const yaw = 3
    const v = new THREE.Vector3(-tan * 16 / 9, tan, -1).applyQuaternion(shot(yaw).skyQuaternion)
    const u = (v.x / -v.z / p.tan[0]) * 0.5 + 0.5
    const k = Math.min(u, 1 - u) / p.edge
    expect(share(-yaw)).toBeCloseTo(share(yaw), 12)
    expect(share(yaw)).toBeCloseTo(1 - k * k * (3 - 2 * k), 9)
  })

  it('counts the plate\'s weight, and an additive plate or a plate with a hole hides nothing', () => {
    expect(share(0, 0.4, plate(0.125, {}, 80))).toBeCloseTo(0.6, 12)
    expect(share(0, 1, plate(0.125, { add: true }, 80))).toBe(1)
    expect(share(0, 1, plate(0.125, { ring: [0.5, 0.5, 0.1, 0.3] }, 80))).toBe(1)
    expect(share(0, 1, plate(0.125, { ring: [0.5, 0.5, 0, -1] }, 80))).toBe(1)
  })

  it('the level under which the stars may turn is one percent', () => {
    expect(STAR_LEVEL).toBe(0.01)
  })
})
