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
    if (set.id !== shot.segment.stop && shot.farLight !== undefined && shot.farLight <= 0) continue
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

  it('shows the hero alone in the judged frame: whole, 80 px clear, a third in from the right, 360 px or more across, under 2 px of blur', () => {
    const judged = beltJudgedFrame()
    const seen: { id: string; s: Seen; blur: number }[] = []
    motion.rocks.forEach((rock, i) => {
      const a = look(motion, i, (judged + 0.25) / config.fps, judged)
      const b = look(motion, i, (judged + 0.75) / config.fps, judged)
      if (!a.inside && !b.inside) return
      seen.push({ id: rock.id, s: a, blur: Math.hypot(b.x - a.x, b.y - a.y) })
    })
    expect(seen.map((v) => v.id)).toEqual(['hero'])
    const hero = seen[0]!
    expect(hero.blur).toBeLessThan(2)
    expect(2 * hero.s.radius).toBeGreaterThanOrEqual(360)
    expect(Math.min(hero.s.x, format.width - hero.s.x, hero.s.y, format.height - hero.s.y) - hero.s.radius).toBeGreaterThanOrEqual(80)
    expect(hero.s.x / format.width).toBeGreaterThan(0.6)
    expect(hero.s.x / format.width).toBeLessThan(0.72)
    const rock = motion.rocks.find((r) => r.id === 'hero')!
    const turn = THREE.MathUtils.degToRad(Math.abs(rock.spin)) * hero.s.radius * (0.5 / config.fps)
    expect(turn).toBeLessThan(1.5)
    expect(Math.abs(rock.spin)).toBeGreaterThanOrEqual(10)
  })

  it('keeps every rock off the discs of Mars and Jupiter (Jupiter from the frame its light comes on), out of the lens and under a fifth of the frame', () => {
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
  it('leaves 2745 to 2757 and 2803 to 2819 empty', () => {
    motion.rocks.forEach((rock, i) => {
      for (let f = segment.firstFrame; f < segment.endFrame; f++) {
        if (f > segment.firstFrame + 12 && f < segment.endFrame - 17) continue
        for (let k = 0; k <= 2; k++) expect(look(motion, i, (f + k / 4) / config.fps, f).inside, rock.id + ' at frame ' + f).toBe(false)
      }
    })
  })

  it('keeps every rock 150 px or more from Jupiter from 2780 to 2799', () => {
    motion.rocks.forEach((rock, i) => {
      for (let f = beltJudgedFrame() - 2; f <= beltJudgedFrame() + 17; f++) {
        for (let k = 0; k <= 2; k++) {
          const s = look(motion, i, (f + k / 4) / config.fps, f)
          if (s.inside) expect(s.gap, rock.id + ' at frame ' + f).toBeGreaterThanOrEqual(150)
        }
      }
    })
  })

  it('lets no rock pass as a bar: the blur of one shutter stays under half the width of the rock', () => {
    motion.rocks.forEach((rock, i) => {
      let seen = 0
      for (let f = segment.firstFrame; f < segment.endFrame - 1; f++) {
        const a = look(motion, i, (f + 0.25) / config.fps, f)
        const b = look(motion, i, (f + 0.75) / config.fps, f)
        if (!a.inside) continue
        seen++
        expect(Math.hypot(b.x - a.x, b.y - a.y), rock.id + ' blur at frame ' + f).toBeLessThan(a.radius)
      }
      expect(seen, rock.id).toBeGreaterThanOrEqual(8)
    })
  })

  it('weights the shutter steps by a window from 0 (even) to 1 (raised cosine) so no step counts against the picture, and keeps them 1.5 px apart', () => {
    expect(beltSpec.steps.window).toBeGreaterThanOrEqual(0)
    expect(beltSpec.steps.window).toBeLessThanOrEqual(1)
    expect(beltSpec.steps.gap).toBe(1.5)
  })

  it('passes the near rock out of focus by 8 px or more and takes it out four frames or more before the judged frame', () => {
    const i = motion.rocks.findIndex((r) => r.id === 'near')
    let last = 0
    for (let f = segment.firstFrame; f < segment.endFrame - 1; f++) {
      const time = (f + 0.25) / config.fps
      if (!look(motion, i, time, f).inside) continue
      last = f
      const shot = director.shotAt(f, time)
      const pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
      motion.pose(i, shot, pose)
      const dist = pose.position.clone().sub(shot.camera.position).length()
      expect(beltSpec.aperture * Math.max(0, 1 / Math.min(dist, pose.position.length()) - 1 / beltSpec.focus), 'focus blur at frame ' + f).toBeGreaterThanOrEqual(8)
    }
    expect(last).toBeLessThanOrEqual(beltJudgedFrame() - 4)
  })

  it('holds the hero whole and 80 px clear of every edge for six frames each side of the judged frame, and passes it in and out at 40 px per frame or more', () => {
    const i = motion.rocks.findIndex((r) => r.id === 'hero')
    const speeds: number[] = []
    for (let f = segment.firstFrame; f < segment.endFrame - 1; f++) {
      const a = look(motion, i, (f + 0.25) / config.fps, f)
      const b = look(motion, i, (f + 1.25) / config.fps, f + 1)
      if (!a.inside) continue
      speeds.push(Math.hypot(b.x - a.x, b.y - a.y))
      if (Math.abs(f - beltJudgedFrame()) <= 6) {
        for (const k of [0.25, 0.75]) {
          const s = look(motion, i, (f + k) / config.fps, f)
          expect(Math.min(s.x, format.width - s.x, s.y, format.height - s.y) - s.radius, 'clear at frame ' + f).toBeGreaterThanOrEqual(80)
        }
      }
    }
    expect(speeds[0]!).toBeGreaterThanOrEqual(40)
    expect(speeds[speeds.length - 1]!).toBeGreaterThanOrEqual(40)
    expect(Math.min(...speeds)).toBeLessThan(4)
  })

  it('lights the hero from the side at the judged frame so the terminator crosses its face', () => {
    const i = motion.rocks.findIndex((r) => r.id === 'hero')
    const judged = beltJudgedFrame()
    const time = (judged + 0.25) / config.fps
    const shot = director.shotAt(judged, time)
    const pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
    motion.pose(i, shot, pose)
    const toLens = shot.camera.position.clone().sub(pose.position).normalize()
    const phase = THREE.MathUtils.radToDeg(toLens.angleTo(shot.sun.dir))
    expect(phase).toBeGreaterThan(55)
    expect(phase).toBeLessThan(110)
  })

  it('turns the hero on screen at 30 degrees a second or less and never holds it still: 3 px or more between every frame pair', () => {
    const i = motion.rocks.findIndex((r) => r.id === 'hero')
    const seen = (f: number): { q: THREE.Quaternion; s: Seen } => {
      const time = (f + 0.25) / config.fps
      const shot = director.shotAt(f, time)
      const pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
      motion.pose(i, shot, pose)
      return { q: shot.camera.quaternion.clone().invert().multiply(pose.quaternion), s: look(motion, i, time, f) }
    }
    let count = 0
    for (let f = segment.firstFrame; f < segment.endFrame - 1; f++) {
      const a = seen(f)
      const b = seen(f + 1)
      if (!a.s.inside || !b.s.inside) continue
      count++
      expect(THREE.MathUtils.radToDeg(a.q.angleTo(b.q)) * config.fps, 'turn at frame ' + f).toBeLessThanOrEqual(30)
      expect(Math.hypot(b.s.x - a.s.x, b.s.y - a.s.y), 'step at frame ' + f).toBeGreaterThanOrEqual(3)
    }
    expect(count).toBeGreaterThanOrEqual(30)
  })
})
