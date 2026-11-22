import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

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
  for (let f = seg.firstFrame; f <= seg.endFrame; f++) {
    const s = at(f)
    const t = at(f + 1)
    const full = s.camera.quaternion.angleTo(t.camera.quaternion) * DEG
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
    if (f < seg.endFrame) {
      if (inside && enter < 0) { enter = f; enterPx = px; enterAt = `${Math.round(sx)},${Math.round(sy)}` }
      if (px > LIMIT && over < 0) over = f
      if (px > GONE && gone < 0) gone = f
      if (px > LIMIT && full > peak) { peak = full; peakAt = f }
      if (px > GONE && full > peakGone) peakGone = full
      if (px <= LIMIT) before = Math.max(before, full)
      if (full > whole) { whole = full; wholeAt = f }
      if (px > LIMIT && g > grow) { grow = g; growAt = f }
    }
    prev = px
    if (mode === 'frames') rows.push(`${f} r ${px.toFixed(2)} px grow ${g.toFixed(1)}% at ${inside ? Math.round(sx) + ',' + Math.round(sy) : 'out'} turn ${full.toFixed(2)} w ${set.weight.toFixed(2)}`)
  }
  if (mode === 'frames') console.log(p.id + '\n' + rows.join('\n'))
  else console.log(`${p.id}.travel | enters ${enter} at ${enterAt} r ${enterPx.toFixed(2)} px | over ${LIMIT.toFixed(2)} px from ${over}, over ${GONE.toFixed(1)} px from ${gone} | peak turn while over the limit ${peak.toFixed(2)} at ${peakAt} (disc over ${GONE.toFixed(1)} px: ${peakGone.toFixed(2)}) | peak turn before ${before.toFixed(2)}, whole ${whole.toFixed(2)} at ${wholeAt} | largest growth ${grow.toFixed(1)}% at ${growAt}`)
})
