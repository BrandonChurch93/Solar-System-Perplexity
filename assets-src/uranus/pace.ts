import * as THREE from 'three'
import { writeFileSync } from 'node:fs'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { sideAt } from '../../src/director/handover'
import { handoverOf, handoverFrame } from '../../src/director/handover'
import type { Pose } from '../../src/core/types'
import { rawMotion } from '../../src/core/motion'

const stop = process.argv[2] ?? 'uranus'
const pad = Number(process.argv[3] ?? 2)
const film = new FilmDirector(plans)
const plan = plans.find((p) => p.id === stop)! as any
const fps = config.fps
const master = (config as any).formats?.master ?? { width: 1920, height: 1080 }
const W = master.width ?? 1920
const H = master.height ?? 1080
const RAD = Math.PI / 180

function carried(frame: number, time: number): Pose {
  const shot = film.shotAt(frame, time)
  const s = shot.sets.find((x: any) => x.id === stop)! as any
  const back = s.rotation.clone().invert()
  const local: Pose = { position: shot.camera.position.clone().sub(s.origin).applyQuaternion(back), quaternion: back.clone().multiply(shot.camera.quaternion), vfov: shot.camera.vfov }
  return s.view === 'terrain' ? plan.twin(local, time) : local
}

function project(p: Pose, point: THREE.Vector3): [number, number] {
  const v = point.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert())
  const k = H / 2 / Math.tan((p.vfov * RAD) / 2)
  const z = Math.min(v.z, -1e-9)
  return [W / 2 + (v.x / -z) * k, H / 2 - (v.y / -z) * k]
}

const out: any = {}
const lines: string[] = []
for (const kind of (process.env.PACE_KIND ? [process.env.PACE_KIND] : ['dive', 'rise']) as ('dive' | 'rise')[]) {
  const seg = config.segments.find((s: any) => s.stop === stop && s.kind === kind)! as any
  const h = handoverOf(stop, kind)
  const T = h ? handoverFrame(h) : -1
  const first = seg.firstFrame - pad
  const last = seg.endFrame - 1 + pad
  const mid = config.shutterFraction / 2
  const at = (x: number): { h: number; pose: Pose; spot: [number, number] } => {
    const frame = Math.floor(x + 1e-9)
    const time = (x + mid) / fps
    const pose = carried(frame, time)
    return { h: pose.position.length() - 1, pose, spot: project(pose, plan.place(kind, time)) }
  }
  const rows: { x: number; h: number; rate: number; turn: number; pic: number; flow: number; mid: number }[] = []
  for (let x = first; x <= last + 1e-9; x += 0.5) {
    const a = at(x - 1)
    const b = at(x)
    const sign = kind === 'dive' ? 1 : -1
    const rate = Math.log(a.h / b.h) * sign
    const turn = 2 * Math.acos(Math.min(1, Math.abs(a.pose.quaternion.dot(b.pose.quaternion)))) / RAD
    const pic = Math.hypot(b.spot[0] - a.spot[0], b.spot[1] - a.spot[1])
    const fr = Math.floor(x + 1e-9)
    const inSeg = x - 1 >= seg.firstFrame && x < seg.endFrame
    const sd = inSeg ? sideAt(seg, (x + mid) / fps) : undefined
    let centre = 0
    const flow = process.env.PACE_FLOW !== '1' ? 1 : rawMotion(film.shotAt(fr, (x - 1 + mid) / fps, sd as any), film.shotAt(fr, (x - 0.5 + mid) / fps, sd as any), film.shotAt(fr, (x + mid) / fps, sd as any), (cx, cy, px) => { if (cx === 8 && cy === 4) centre = px })
    rows.push({ x, h: b.h, rate, turn, pic, flow, mid: centre })
  }
  const inside = rows.filter((r) => r.x >= seg.firstFrame + 1 && r.x <= seg.endFrame - 1 && Number.isInteger(r.x))
  const report = (name: 'rate' | 'turn' | 'pic' | 'flow' | 'mid'): string => {
    const mean = inside.reduce((s, r) => s + r[name], 0) / inside.length
    const v = rows.map((r) => r[name] / mean)
    let step = { x: 0, d: 0 }
    for (let i = 2; i < rows.length; i++) {
      const d = Math.abs(v[i]! - v[i - 2]!)
      if (d > step.d) step = { x: rows[i]!.x, d }
    }
    let top = 0
    v.forEach((y, i) => { if (y > v[top]!) top = i })
    let fallBefore = { x: 0, d: 0 }
    let most = -Infinity
    for (let i = 0; i <= top; i++) {
      most = Math.max(most, v[i]!)
      if (most - v[i]! > fallBefore.d) fallBefore = { x: rows[i]!.x, d: most - v[i]! }
    }
    let climbAfter = { x: 0, d: 0 }
    let least = Infinity
    for (let i = top; i < v.length; i++) {
      least = Math.min(least, v[i]!)
      if (v[i]! - least > climbAfter.d) climbAfter = { x: rows[i]!.x, d: v[i]! - least }
    }
    const ok = step.d <= 0.08 && fallBefore.d <= 0.03 && climbAfter.d <= 0.03
    out[kind + '.' + name] = { mean, v: v.map((y) => Number(y.toFixed(4))) }
    return (ok ? 'PASS ' : 'FAIL ') + kind + ' ' + name + ': mean ' + mean.toFixed(5) + ', largest ' + v[top]!.toFixed(3) + ' at ' + rows[top]!.x + ', step per film frame at most ' + step.d.toFixed(3) + ' at ' + step.x + ' (limit 0.08), fall before the largest ' + fallBefore.d.toFixed(3) + ' at ' + fallBefore.x + ', climb after it ' + climbAfter.d.toFixed(3) + ' at ' + climbAfter.x + ' (limit 0.03)'
  }
  lines.push(kind + ' frames ' + seg.firstFrame + ' to ' + (seg.endFrame - 1) + ', T ' + T + ', measured ' + first + ' to ' + last + ' at whole and half frames')
  lines.push(report('rate'), report('turn'), report('pic'))
  if (process.env.PACE_FLOW === '1') lines.push(report('flow'), report('mid'))
  out[kind] = rows.map((r) => ({ x: r.x, h: Number(r.h.toExponential(4)) }))
}
console.log(lines.join('\n'))
writeFileSync(process.argv[4] ?? '/tmp/pace.json', JSON.stringify(out))
