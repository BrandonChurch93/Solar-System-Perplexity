import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { stream } from '../../src/core/random'
import { Flow, FLOW } from '../../src/space/travel/flow'
import { DUST } from '../../src/space/dust'

const d = new FilmDirector(plans)
const flow = new Flow(d, process.env.RAW ? 0 : FLOW.ease)
const fmt = config.formats[config.formatKeys.master]!
const COUNT = 4000
const rnd = stream('dust')
const base: THREE.Vector3[] = []
for (let i = 0; i < COUNT; i++) { base.push(new THREE.Vector3(rnd.next(), rnd.next(), rnd.next())); rnd.next() }
const fr = (x: number): number => x - Math.floor(x)
const n = (x: number, k = 3): string => (x >= 0 ? '+' : '') + x.toFixed(k)
const steps = Math.round(config.shutterFraction * FLOW.stepsPerFrame)
const only = process.argv[2]

for (const seg of config.segments.filter((s) => FLOW.kinds.includes(s.kind) && (!only || s.id === only))) {
  const rows: string[] = []
  let sumV = 0, sumN = 0, cnt = 0, minV = 1, maxSpeed = 0, out = 0, outN = 0, fastV = 0, fastN = 0, fastMin = 1
  const speeds: number[] = []
  const reals: number[] = []
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const t0 = f / config.fps
    const open = d.shotAt(f, t0)
    const close = d.shotAt(f, t0 + config.shutterFraction / config.fps)
    const v = close.camera.position.clone().sub(open.camera.position)
    const real = v.length() * config.fps / config.shutterFraction
    const f0 = flow.at(seg, f, 0, new THREE.Vector3())
    const f1 = flow.at(seg, f, steps, new THREE.Vector3())
    const mote = f0.clone().sub(f1)
    const speed = mote.length() * config.fps / config.shutterFraction
    speeds.push(speed)
    reals.push(real)
    if (mote.length() < 1e-9 || v.length() < 1e-12) { rows.push(`f${f} still`); continue }
    const next = open.sets[open.sets.length - 1]!.origin.clone().sub(open.camera.position).normalize()
    const cv = mote.clone().normalize().dot(v.clone().normalize())
    const cn = mote.clone().normalize().dot(next)
    const inv = open.camera.quaternion.clone().invert()
    const fly = v.clone().normalize().applyQuaternion(inv)
    const tan = Math.tan((open.camera.vfov * Math.PI) / 360)
    const px = (c: THREE.Vector3): THREE.Vector2 => new THREE.Vector2((c.x / -c.z / (tan * fmt.width / fmt.height)) * 0.5 * fmt.width, (c.y / -c.z / tan) * 0.5 * fmt.height)
    const foe = fly.z < 0 ? px(fly) : null
    let o = 0, m = 0
    for (const b of base) {
      const w0 = new THREE.Vector3(fr(b.x - f0.x / DUST.span) - 0.5, fr(b.y - f0.y / DUST.span) - 0.5, fr(b.z - f0.z / DUST.span) - 0.5).multiplyScalar(DUST.span)
      const w1 = w0.clone().add(mote)
      const v0 = w0.applyQuaternion(inv)
      const v1 = w1.applyQuaternion(inv)
      if (v0.z > -0.05 || v1.z > -0.05) continue
      const s0 = px(v0)
      const s1 = px(v1)
      if (Math.abs(s0.x) > fmt.width / 2 || Math.abs(s0.y) > fmt.height / 2) continue
      if (!foe) continue
      m++
      if (s1.clone().sub(s0).dot(s0.clone().sub(foe)) > 0) o++
    }
    sumV += cv; sumN += cn; cnt++
    if (real > 1) { fastV += cv; fastN++; fastMin = Math.min(fastMin, -cv) }
    minV = Math.max(Math.min(minV, -cv), -1)
    maxSpeed = Math.max(maxSpeed, speed)
    out += o; outN += m
    if ((f - seg.firstFrame) % 8 === 0 || f === seg.endFrame - 1) rows.push(`f${f} mote.flight ${n(cv)} mote.next ${n(cn)} flow ${speed.toFixed(3)} u/s real ${real.toExponential(2)} flight in view [${fly.toArray().map((x) => n(x, 2)).join(' ')}]${foe ? ` point of flight at ${(foe.x + fmt.width / 2).toFixed(0)},${(fmt.height / 2 - foe.y).toFixed(0)} px, ${m ? ((100 * o) / m).toFixed(0) : 'no'} percent of ${m} motes move away from it` : ' (flight point behind the lens)'}`)
  }
  let mono = 0
  for (let i = 1; i < speeds.length; i++) if ((speeds[i]! - speeds[i - 1]!) * (reals[i]! - reals[i - 1]!) < -1e-12) mono++
  let step = 0
  for (let i = 1; i < speeds.length; i++) step = Math.max(step, Math.abs(speeds[i]! - speeds[i - 1]!))
  console.log(`== ${seg.id}: mean cos(mote velocity, flight) ${n(sumV / Math.max(cnt, 1))}, weakest ${n(-minV)}; in the ${fastN} frames where the camera moves faster than 1 unit a second mean ${n(fastV / Math.max(fastN, 1))}, weakest ${n(-fastMin)}; mean cos(mote velocity, direction to the next body) ${n(sumN / Math.max(cnt, 1))}; motes moving away from the point of flight ${outN ? ((100 * out) / outN).toFixed(1) : 'n/a'} percent of ${outN}; flow speed first ${speeds[0]!.toFixed(4)}, peak ${maxSpeed.toFixed(3)}, last ${speeds[speeds.length - 1]!.toFixed(4)} units a second; largest change between frames ${step.toFixed(4)}; frames where flow speed and real speed change in opposite senses ${mono}`)
  if (only) for (const r of rows) console.log('  ' + r)
}
