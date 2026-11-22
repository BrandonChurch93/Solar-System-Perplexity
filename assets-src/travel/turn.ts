import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { inFrame } from '../../src/space/travel/path'

const d = new FilmDirector(plans)
const fmt = config.formats[config.formatKeys.master]!
const aspect = fmt.width / fmt.height
const DEG = 180 / Math.PI
const mode = process.argv[2] ?? 'turn'
const only = process.argv[3]
const at = (f: number) => d.shotAt(f, (f + 0.25) / config.fps)
const axis = (q: THREE.Quaternion) => new THREE.Vector3(0, 0, -1).applyQuaternion(q)
plans.slice(0, -1).forEach((p, i) => {
  if (only && only !== p.id) return
  const seg = config.segments.find((s) => s.id === p.id + '.travel')!
  const rows: string[] = []
  let first = -1
  let last = -1
  let peak = 0
  let peakAt = 0
  let all = 0
  let allAt = 0
  let par = 0
  let n = 0
  let turned = 0
  let sunFirst = -1
  let sunLast = -1
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const s = at(f)
    const t = at(f + 1)
    const rate = axis(s.camera.quaternion).angleTo(axis(t.camera.quaternion)) * DEG
    const full = s.camera.quaternion.angleTo(t.camera.quaternion) * DEG
    const from = d.leavingThings(i, s.time)
    const lead = s.sets[0]!
    const body = lead.origin.clone().sub(s.camera.position)
    const next = t.sets[0]!.origin.clone().sub(t.camera.position)
    const cam = d.leavingThings(i, s.time)[0]!.to.clone().negate().add(lead.origin)
    const seen = lead.weight > 0 && from.some((t) => inFrame(s.camera.quaternion, s.camera.vfov, aspect, t.to.clone().add(cam).sub(s.camera.position), t.radius, 0))
    const slide = body.angleTo(next) * DEG
    if (full > all) { all = full; allAt = f }
    if (seen) {
      if (first < 0) first = f
      last = f
      turned += full
      if (full > peak) { peak = full; peakAt = f }
      par += slide
      n++
    }
    const sun = s.sun.dir.clone().applyQuaternion(s.camera.quaternion.clone().invert())
    const ty = Math.tan(s.camera.vfov / DEG / 2)
    const off = axis(s.camera.quaternion).angleTo(s.sun.dir) * DEG
    const px = sun.z < 0 ? [Math.round((sun.x / -sun.z / (ty * aspect) * 0.5 + 0.5) * fmt.width), Math.round((0.5 - sun.y / -sun.z / ty * 0.5) * fmt.height)] : null
    const inside = px !== null && px[0]! >= 0 && px[0]! < fmt.width && px[1]! >= 0 && px[1]! < fmt.height
    if (inside) { if (sunFirst < 0) sunFirst = f; sunLast = f }
    if (mode === 'sun' && (f - seg.firstFrame) % 5 === 0) rows.push(`${f} | ${off.toFixed(1)} | ${(s.camera.vfov / 2).toFixed(1)} | ${(Math.atan(ty * aspect) * DEG).toFixed(1)} | ${(Math.atan(ty * Math.hypot(1, aspect)) * DEG).toFixed(1)} | ${inside ? px!.join(',') : 'out'} | ${(s.sun.angularRadius * DEG).toFixed(3)} | ${s.sun.glare.toFixed(3)}`)
    if (mode === 'frames') rows.push(`${f} turn ${full.toFixed(2)} axis ${rate.toFixed(2)} body ${seen ? 'in' : 'out'} w ${lead.weight.toFixed(2)} slide ${slide.toFixed(2)} dist ${body.length().toFixed(2)} vfov ${s.camera.vfov.toFixed(2)} sun ${off.toFixed(1)}`)
  }
  const la = plans[i]!.p.light
  const lb = plans[i + 1]!.p.light
  if (mode === 'sun') console.log(`\n${p.id}.travel ${seg.firstFrame} to ${seg.endFrame - 1}: Sun radius deg ${la.sunRadiusDeg} to ${lb.sunRadiusDeg}, glare ${la.sunGlare} to ${lb.sunGlare}\nframe | axis to Sun | half fov v | h | diagonal | Sun px | radius deg | glare\n` + rows.join('\n'))
  else if (mode === 'frames') console.log(p.id + '\n' + rows.join('\n'))
  else console.log(`${p.id}.travel | body in frame ${first} to ${last} (${n} frames) | turned while in frame ${turned.toFixed(1)} deg | peak ${peak.toFixed(2)} deg per frame at ${peakAt} | body slides ${(par / Math.max(n, 1)).toFixed(2)} deg per frame mean | peak of whole travel ${all.toFixed(2)} at ${allAt} | slide ${d.slideOf(i).toFixed(2)} clear ${d.clearAtOf(i + 1).toFixed(3)} | Sun centre in frame ${sunFirst < 0 ? 'never' : sunFirst + ' to ' + sunLast}`)
})
