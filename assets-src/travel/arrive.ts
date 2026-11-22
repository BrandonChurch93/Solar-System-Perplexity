import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { TRAVEL } from '../../src/space/travel/path'

if (process.env.OVER) for (const [k, v] of Object.entries(JSON.parse(process.env.OVER) as Record<string, object>)) TRAVEL[k] = { ...TRAVEL[k], ...v }

const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const aspect = fmt.width / fmt.height
const DEG = 180 / Math.PI
const mode = process.argv[2] ?? 'table'
const only = process.argv[3]
const LIMIT = 0.0015 * fmt.height
const GONE = 0.0155 * fmt.height
const at = (f: number) => d.shotAt(f, (f + 0.25) / config.fps)
plans.slice(0, -1).forEach((p, i) => {
  if (only && only !== p.id) return
  const seg = config.segments.find((s) => s.id === p.id + '.travel')!
  const rows: string[] = []
  let enter = -1
  let enterPx = 0
  let enterAt = ''
  let peak = 0
  let peakAt = 0
  let peakGone = 0
  let grow = 0
  let growAt = 0
  let over = -1
  let gone = -1
  let before = 0
  let whole = 0
  let wholeAt = 0
  let prev = 0
  let peak60 = 0
  let peak250 = 0
  let step = 0
  let stepAt = 0
  let last: [number, number] | null = null
  let jerk = 0
  let jerkAt = 0
  let rate = -1
  let lit = -1
  let litOff = 0
  let litStep = 0
  let fullAt = -1
  let light = 0
  let home: [number, number] = [0, 0]
  {
    const h = at(seg.endFrame)
    const o = h.sets[h.sets.length - 1]!.origin.clone().sub(h.camera.position).applyQuaternion(h.camera.quaternion.clone().invert())
    const ty = Math.tan(h.camera.vfov / DEG / 2)
    home = [(o.x / -o.z / (ty * aspect) * 0.5 + 0.5) * fmt.width, (0.5 - o.y / -o.z / ty * 0.5) * fmt.height]
  }
  for (let f = seg.firstFrame; f <= seg.endFrame; f++) {
    const s = at(f)
    const t = at(f + 1)
    const full = s.camera.quaternion.angleTo(t.camera.quaternion) * DEG
    if (rate >= 0 && Math.abs(full - rate) > jerk) { jerk = Math.abs(full - rate); jerkAt = f }
    rate = full
    const fl = s.farLight ?? 1
    const set = s.sets[s.sets.length - 1]!
    const to = set.origin.clone().sub(s.camera.position)
    const dist = to.length()
    const ty = Math.tan(s.camera.vfov / DEG / 2)
    const px = (1 / Math.sqrt(Math.max(dist * dist - 1, 1e-9))) / ty * (fmt.height / 2)
    const v = to.clone().applyQuaternion(s.camera.quaternion.clone().invert())
    const sx = v.z < 0 ? (v.x / -v.z / (ty * aspect) * 0.5 + 0.5) * fmt.width : NaN
    const sy = v.z < 0 ? (0.5 - v.y / -v.z / ty * 0.5) * fmt.height : NaN
    const inside = v.z < 0 && sx > -px && sx < fmt.width + px && sy > -px && sy < fmt.height + px
    const g = prev > 0 ? (px / prev - 1) * 100 : 0
    if (fl > 0 && lit < 0) { lit = f; litOff = Math.hypot(sx - home[0], sy - home[1]) }
    if (fl >= 1 && fullAt < 0) fullAt = f
    litStep = Math.max(litStep, fl - light)
    light = fl
    const moved = last && inside ? Math.hypot(sx - last[0], sy - last[1]) : 0
    last = inside ? [sx, sy] : null
    if (f < seg.endFrame) {
      if (inside && enter < 0) { enter = f; enterPx = px; enterAt = `${Math.round(sx)},${Math.round(sy)}` }
      if (px > LIMIT && over < 0) over = f
      if (px > GONE && gone < 0) gone = f
      if (px > LIMIT && full > peak) { peak = full; peakAt = f }
      if (px > GONE && full > peakGone) peakGone = full
      if (px > 60 && full > peak60) peak60 = full
      if (px > 250 && full > peak250) peak250 = full
      if (px > LIMIT && moved > step) { step = moved; stepAt = f }
      if (px <= LIMIT) before = Math.max(before, full)
      if (full > whole) { whole = full; wholeAt = f }
      if (px > LIMIT && g > grow) { grow = g; growAt = f }
    }
    prev = px
    if (mode === 'frames') rows.push(`${f} r ${px.toFixed(2)} px grow ${g.toFixed(1)}% at ${inside ? Math.round(sx) + ',' + Math.round(sy) : 'out'} step ${moved.toFixed(1)} light ${fl.toFixed(3)} turn ${full.toFixed(2)} off ${(to.angleTo(new THREE.Vector3(0, 0, -1).applyQuaternion(s.camera.quaternion)) * DEG).toFixed(1)} w ${set.weight.toFixed(2)}`)
  }
  if (mode === 'frames') console.log(p.id + '\n' + rows.join('\n'))
  else console.log(`${p.id}.travel | enters ${enter} at ${enterAt} r ${enterPx.toFixed(2)} px | over ${LIMIT.toFixed(2)} px from ${over}, over ${GONE.toFixed(1)} px from ${gone} | peak turn while over the limit ${peak.toFixed(2)} at ${peakAt} (disc over ${GONE.toFixed(1)} px: ${peakGone.toFixed(2)}) | peak turn before ${before.toFixed(2)}, whole ${whole.toFixed(2)} at ${wholeAt} | over 60 px ${peak60.toFixed(2)}, over 250 px ${peak250.toFixed(2)} | largest growth ${grow.toFixed(1)}% at ${growAt} | largest step of the body over the limit ${step.toFixed(1)} px at ${stepAt} | largest change of turn rate ${jerk.toFixed(2)} at ${jerkAt} | light from ${lit} (${litOff.toFixed(1)} px from its hold place) full at ${fullAt}, largest step ${(litStep * 100).toFixed(1)}%`)
})
