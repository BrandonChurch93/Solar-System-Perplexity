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
const PICK = [0, 3, 5, 7, 10, 15, 20]
const where = (time: number, frame: number) => {
  const s = d.shotAt(frame, time)
  const set = s.sets[0]!
  const to = set.origin.clone().sub(s.camera.position)
  const ty = Math.tan(s.camera.vfov / DEG / 2)
  const scale = set.scale ?? 1
  const px = (scale / Math.sqrt(Math.max(to.lengthSq() - scale * scale, 1e-9))) / ty * (fmt.height / 2)
  const v = to.clone().applyQuaternion(s.camera.quaternion.clone().invert())
  const x = (v.x / -v.z / (ty * aspect) * 0.5 + 0.5) * fmt.width
  const y = (0.5 - v.y / -v.z / ty * 0.5) * fmt.height
  const seen = v.z < 0 && x > -px && x < fmt.width + px && y > -px && y < fmt.height + px
  return { x, y, px, seen, q: s.camera.quaternion.clone() }
}
plans.slice(0, -1).forEach((p) => {
  if (only && only !== p.id) return
  const seg = config.segments.find((s) => s.id === p.id + '.travel')!
  const rows: string[] = []
  const picks: string[] = []
  let gone = -1
  let blur = 0
  let blurAt = 0
  let turn = 0
  let turnAt = 0
  let r0 = 0
  let c0: [number, number] = [0, 0]
  for (let f = seg.firstFrame - 2; f <= seg.endFrame; f++) {
    const open = where((f + 0.25) / config.fps, f)
    const shut = where((f + 0.25 + config.shutterFraction) / config.fps, f)
    const next = where((f + 1.25) / config.fps, f + 1)
    const k = f - seg.firstFrame
    if (k === 0) { r0 = open.px; c0 = [open.x, open.y] }
    const smear = Math.hypot(shut.x - open.x, shut.y - open.y)
    const rate = open.q.angleTo(next.q) * DEG
    if (k >= 0 && f < seg.endFrame && rate > turn) { turn = rate; turnAt = f }
    if (k >= 0 && gone < 0 && open.seen && smear > blur) { blur = smear; blurAt = f }
    if (k >= 0 && !open.seen && gone < 0) gone = k
    if (gone >= 0 && k > gone) open.seen = false
    if (PICK.includes(k)) picks.push(`${k}: ${open.seen ? Math.round(open.x) + ',' + Math.round(open.y) : 'out'} (${(Math.hypot(open.x - c0[0], open.y - c0[1]) / r0).toFixed(2)} r)`)
    if (mode === 'frames' && k < 30) rows.push(`${f} k ${k} at ${Math.round(open.x)},${Math.round(open.y)} r ${open.px.toFixed(0)} step ${Math.hypot(next.x - open.x, next.y - open.y).toFixed(1)} shutter ${smear.toFixed(1)} turn ${rate.toFixed(2)} ${open.seen ? '' : 'out'}`)
  }
  if (mode === 'frames') console.log(rows.join('\n'))
  console.log(`${p.id}.travel | r ${r0.toFixed(0)} px | ${picks.join(' | ')} | gone at frame ${gone} | largest shutter motion of the body ${blur.toFixed(1)} px at ${blurAt} | top turn ${turn.toFixed(2)} at ${turnAt}`)
})
