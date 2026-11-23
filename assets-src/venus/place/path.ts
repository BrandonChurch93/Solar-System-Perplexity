import * as THREE from 'three'
import { config } from '../../../src/config'
import { plan } from '../../../src/stops/venus/plan'
import placeJson from '../../../src/stops/venus/place.json'
import fit from '../../../src/stops/venus/fit.json'

// Prints the new dive and rise frame by frame: height, the ratio of height to the frame before, where
// the camera stands and looks in the frame of the place, where the anchor is in the frame, the range
// to it, the turn of the camera since the frame before, and the largest image motion of the anchor.
// --every N prints every Nth frame; --json FILE writes all frames.
// The steady move is asked for by the probe of the plan, so this prints it whether or not the stop has opted in to the handover.
;(globalThis as { __venusProbe?: object }).__venusProbe = { side: 'orbit', path: true }
const deg = THREE.MathUtils.radToDeg
const args = process.argv.slice(2)
const opt = (k: string, d: string): string => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1]! : d }
const every = Number(opt('every', '3'))
const globe = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const under = new THREE.Vector3().fromArray(placeJson.place.under.direction)
const head = new THREE.Vector3().fromArray(placeJson.place.heading)
const right = head.clone().cross(under)
const t = (f: number): number => (f + config.shutterFraction * 0.5) / config.fps
interface Row { frame: number; h: number; ratio: number; ahead: number; right: number; pitch: number; roll: number; vfov: number; sx: number; sy: number; range: number; turnDeg: number; limb: number; closeGap: number }
const rows = (kind: 'dive' | 'rise'): Row[] => {
  const seg = kind === 'dive' ? plan.seg.dive! : plan.seg.rise
  const out: Row[] = []
  let before: { h: number; q: THREE.Quaternion } | null = null
  for (let f = seg.firstFrame - 1; f <= seg.endFrame; f++) {
    const time = t(f)
    const p = f < seg.firstFrame ? (kind === 'dive' ? plan.hold(time - plan.seg.hold.start) : plan.twin(plan.terrain(time - plan.seg.terrain.start), time)) : f >= seg.endFrame ? (kind === 'dive' ? plan.twin(plan.terrain(time - plan.seg.terrain.start), time) : plan.after(time)) : kind === 'dive' ? plan.divePose(time, 'orbit') : plan.risePose(time, 'orbit')
    const back = globe.clone().invert().multiply(plan.turn(time).invert())
    const pos = p.position.clone().applyQuaternion(back)
    const fwd = new THREE.Vector3(0, 0, -1).applyQuaternion(p.quaternion).applyQuaternion(back)
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(p.quaternion).applyQuaternion(back)
    const n = pos.clone().normalize()
    const h = pos.length() - 1
    const lvl = n.clone().addScaledVector(fwd, -n.dot(fwd)).normalize()
    const a = plan.anchor(time)
    const d = a.clone().sub(p.position).applyQuaternion(p.quaternion.clone().invert())
    const th = Math.tan(THREE.MathUtils.degToRad(p.vfov) / 2)
    const turnDeg = before ? deg(before.q.angleTo(p.quaternion)) : 0
    // the limb: angle between the view axis and the nadir, less the angular radius of the globe, in half frame heights
    const toCentre = Math.acos(THREE.MathUtils.clamp(fwd.dot(n.clone().negate()), -1, 1))
    const limb = Math.tan(Math.asin(1 / (1 + h)) - toCentre) / th
    const close = f >= seg.firstFrame && f < seg.endFrame ? (kind === 'dive' ? plan.divePose(time, 'terrain') : plan.risePose(time, 'terrain')) : null
    const closeGap = close ? plan.twin(close, time).position.distanceTo(p.position) : 0
    out.push({ frame: f, h, ratio: before ? h / before.h : 1, ahead: deg(Math.atan2(n.dot(head), n.dot(under))), right: deg(Math.asin(n.dot(right))), pitch: deg(Math.asin(fwd.dot(n))), roll: deg(Math.atan2(up.clone().cross(lvl).dot(fwd), up.dot(lvl))), vfov: p.vfov, sx: 0.5 + (d.x / -d.z / th / (16 / 9)) * 0.5, sy: 0.5 - (d.y / -d.z / th) * 0.5, range: d.length(), turnDeg, limb, closeGap })
    before = { h, q: p.quaternion.clone() }
  }
  return out
}
const all: Record<string, Row[]> = {}
for (const kind of ['dive', 'rise'] as const) {
  const r = rows(kind)
  all[kind] = r
  const body = r.slice(1, -1)
  const logs = body.map((x) => Math.abs(Math.log(x.ratio)))
  const mean = Math.abs(Math.log(r[r.length - 1]!.h / r[0]!.h)) / (r.length - 1)
  console.log(kind, 'frames', body.length, 'mean rate per frame', (Math.exp(mean) - 1).toFixed(4), 'largest over mean', (Math.max(...logs) / mean).toFixed(3), 'at a fifth', (logs[Math.round(body.length / 5)]! / mean).toFixed(3), 'largest turn deg per frame', Math.max(...body.map((x) => x.turnDeg)).toFixed(2), 'largest gap of the close side twin', Math.max(...r.map((x) => x.closeGap)).toExponential(2))
  for (const x of r) if ((x.frame - r[0]!.frame) % every === 0 || x.frame === r[r.length - 1]!.frame || x.frame === r[1]!.frame) console.log(' ', x.frame, 'h', x.h.toFixed(5), 'ratio', x.ratio.toFixed(4), 'ahead', x.ahead.toFixed(2), 'right', x.right.toFixed(2), 'pitch', x.pitch.toFixed(1), 'roll', x.roll.toFixed(1), 'vfov', x.vfov.toFixed(1), 'anchor', x.sx.toFixed(3), x.sy.toFixed(3), 'range', x.range.toFixed(4), 'turn', x.turnDeg.toFixed(2), 'limb', x.limb.toFixed(2))
}
const file = opt('json', '')
if (file) (await import('node:fs')).writeFileSync(file, JSON.stringify(all))
