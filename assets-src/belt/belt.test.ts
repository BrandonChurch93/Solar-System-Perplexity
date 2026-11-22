import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { BeltMotion, beltJudgedFrame, beltSegment, beltSpec } from '../../src/space/belt/motion'

const director = new FilmDirector(plans)
const segment = beltSegment()
const format = config.formats[config.formatKeys.master]!

interface Seen { inside: boolean; gap: number; depth: number; share: number; x: number; y: number; radius: number; sun: THREE.Vector3 }

function look(motion: BeltMotion, index: number, time: number, frame: number): Seen {
  const shot = director.shotAt(frame, time)
  const pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
  motion.pose(index, shot, pose)
  const inv = shot.camera.quaternion.clone().invert()
  const c = pose.position.clone().applyQuaternion(inv)
  const rock = motion.rocks[index]!
  const focal = format.height / 2 / Math.tan(THREE.MathUtils.degToRad(shot.camera.vfov) / 2)
  const dist = c.length()
  const depth = -c.z
  const coc = beltSpec.aperture * Math.max(0, 1 / dist - 1 / beltSpec.focus)
  const hx = format.width / 2 + coc / 2
  const hy = format.height / 2 + coc / 2
  const inside = !(depth < -rock.radius || (focal * Math.abs(c.x) - hx * depth) / Math.hypot(focal, hx) > rock.radius || (focal * Math.abs(c.y) - hy * depth) / Math.hypot(focal, hy) > rock.radius)
  let gap = 1e9
  for (const set of shot.sets) {
    const j = set.origin.clone().sub(shot.camera.position).applyQuaternion(inv)
    gap = Math.min(gap, (c.angleTo(j) - Math.asin(Math.min(1, rock.radius / dist)) - Math.asin(Math.min(1, 1 / j.length()))) * focal - coc / 2)
  }
  const reach = (focal * rock.radius) / Math.max(depth, 1e-6) + coc / 2
  const x = format.width / 2 + (c.x / Math.max(depth, 1e-6)) * focal
  const y = format.height / 2 - (c.y / Math.max(depth, 1e-6)) * focal
  const w = Math.max(0, Math.min(format.width, x + reach) - Math.max(0, x - reach))
  const h = Math.max(0, Math.min(format.height, y + reach) - Math.max(0, y - reach))
  return { inside, gap, depth: depth - rock.radius, share: Math.min(Math.PI * reach * reach, w * h) / (format.width * format.height), x, y, radius: (focal * rock.radius) / Math.max(depth, 1e-6), sun: shot.sun.dir.clone().applyQuaternion(inv) }
}

describe('belt motion', () => {
  const motion = new BeltMotion(director)

  it('has three to five rocks', () => {
    expect(motion.rocks.length).toBeGreaterThanOrEqual(3)
    expect(motion.rocks.length).toBeLessThanOrEqual(5)
  })

  it('is a closed form of film time', () => {
    const other = new BeltMotion(new FilmDirector(plans))
    const a = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
    const b = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
    for (const frame of [segment.firstFrame, beltJudgedFrame(), segment.endFrame - 1]) {
      const shot = director.shotAt(frame, (frame + 0.4) / config.fps)
      motion.rocks.forEach((_, i) => {
        other.pose(i, shot, b)
        motion.pose(i, shot, a)
        motion.pose(i, shot, a)
        expect(a.position.toArray()).toEqual(b.position.toArray())
        expect(a.quaternion.toArray()).toEqual(b.quaternion.toArray())
      })
    }
  })

  it('brings every rock in from outside the frame and takes it out again, once', () => {
    motion.rocks.forEach((rock, i) => {
      const flags: boolean[] = []
      for (let f = segment.firstFrame; f < segment.endFrame; f++) for (let k = 0; k < 4; k++) flags.push(look(motion, i, (f + k / 4) / config.fps, f).inside)
      expect(flags[0], rock.id + ' at the first frame').toBe(false)
      expect(flags[flags.length - 1], rock.id + ' at the last frame').toBe(false)
      const runs = flags.filter((v, n) => v && !flags[n - 1]).length
      expect(runs, rock.id + ' visits').toBe(1)
    })
  })

  it('shows the hero and one more rock in the judged frame, each sharp or a long streak', () => {
    const judged = beltJudgedFrame()
    const inside: string[] = []
    motion.rocks.forEach((rock, i) => {
      const a = look(motion, i, (judged + 0.25) / config.fps, judged)
      const b = look(motion, i, (judged + 0.75) / config.fps, judged)
      if (!a.inside && !b.inside) return
      inside.push(rock.id)
      const blur = Math.hypot(b.x - a.x, b.y - a.y)
      expect(blur < 6 || blur > 60, rock.id + ' blur ' + blur.toFixed(1)).toBe(true)
    })
    expect(inside).toContain('hero')
    expect(inside.length).toBeGreaterThanOrEqual(2)
  })

  it('keeps every rock off the discs of Mars and Jupiter, out of the lens and under a fifth of the frame', () => {
    motion.rocks.forEach((rock, i) => {
      for (let f = segment.firstFrame; f < segment.endFrame; f++) {
        for (let k = 0; k < 4; k++) {
          const s = look(motion, i, (f + k / 4) / config.fps, f)
          if (!s.inside) continue
          expect(s.gap, rock.id + ' gap at frame ' + f).toBeGreaterThan(0)
          expect(s.depth, rock.id + ' clear depth at frame ' + f).toBeGreaterThan(0.3)
          expect(s.share, rock.id + ' share at frame ' + f).toBeLessThan(0.2)
        }
      }
    })
  })
  it('leaves the first and the last frame empty', () => {
    motion.rocks.forEach((rock, i) => {
      for (const f of [segment.firstFrame, segment.endFrame - 1]) {
        for (let k = 0; k <= 4; k++) expect(look(motion, i, (f + k / 4) / config.fps, f).inside, rock.id + ' at frame ' + f).toBe(false)
      }
    })
  })

  it('keeps every rock 150 px or more from the grown Jupiter in the last twelve frames', () => {
    motion.rocks.forEach((rock, i) => {
      for (let f = segment.endFrame - 12; f < segment.endFrame; f++) {
        for (let k = 0; k < 4; k++) {
          const s = look(motion, i, (f + k / 4) / config.fps, f)
          if (s.inside) expect(s.gap, rock.id + ' at frame ' + f).toBeGreaterThan(150)
        }
      }
    })
  })

  it('passes the near rock as a long streak with firm sides: blur over its own width, focus blur under 3 px', () => {
    const i = motion.rocks.findIndex((r) => r.id === 'near')
    let seen = 0
    for (let f = segment.firstFrame; f < segment.endFrame - 1; f++) {
      const a = look(motion, i, (f + 0.25) / config.fps, f)
      const b = look(motion, i, (f + 0.75) / config.fps, f)
      if (!a.inside) continue
      seen++
      const blur = Math.hypot(b.x - a.x, b.y - a.y)
      expect(blur, 'blur at frame ' + f).toBeGreaterThan(2 * a.radius)
      expect(blur, 'blur at frame ' + f).toBeGreaterThan(60)
      const pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
      motion.pose(i, director.shotAt(f, (f + 0.25) / config.fps), pose)
      const shot = director.shotAt(f, (f + 0.25) / config.fps)
      const dist = pose.position.clone().sub(shot.camera.position).length()
      expect(beltSpec.aperture * Math.max(0, 1 / Math.min(dist, pose.position.length()) - 1 / beltSpec.focus)).toBeLessThan(3)
    }
    expect(seen).toBeGreaterThanOrEqual(4)
  })

  it('moves the hero at one even pace across a quarter of the frame width or more, sharp in every frame', () => {
    const i = motion.rocks.findIndex((r) => r.id === 'hero')
    let slow = 1e9
    let fast = 0
    const xs: number[] = []
    for (let f = segment.firstFrame; f < segment.endFrame - 1; f++) {
      const a = look(motion, i, (f + 0.25) / config.fps, f)
      const b = look(motion, i, (f + 1.25) / config.fps, f + 1)
      if (!a.inside) continue
      const speed = Math.hypot(b.x - a.x, b.y - a.y)
      xs.push(a.x)
      slow = Math.min(slow, speed)
      fast = Math.max(fast, speed)
    }
    expect(slow).toBeGreaterThan(6)
    expect(fast * config.shutterFraction).toBeLessThan(6)
    expect(fast / slow).toBeLessThan(1.15)
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(format.width / 4)
  })

  it('brings the hero in lit: the part that enters first, between its heading and the lens, faces the Sun', () => {
    const i = motion.rocks.findIndex((r) => r.id === 'hero')
    let seen = 0
    for (let f = segment.firstFrame; f < segment.endFrame - 1 && seen < 12; f++) {
      const a = look(motion, i, (f + 0.25) / config.fps, f)
      if (!a.inside) continue
      seen++
      const b = look(motion, i, (f + 1.25) / config.fps, f + 1)
      const lead = new THREE.Vector3(b.x - a.x, a.y - b.y, 0).normalize().add(new THREE.Vector3(0, 0, 1)).normalize()
      expect(lead.dot(a.sun), 'frame ' + f + ' sun ' + a.sun.toArray().map((v) => v.toFixed(2)).join(' ')).toBeGreaterThan(0.25)
    }
    expect(seen).toBe(12)
  })
})
