import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { BeltMotion, beltJudgedFrame, beltSegment, beltSpec } from '../../src/space/belt/motion'

const d = new FilmDirector(plans)
const seg = beltSegment()
const m = new BeltMotion(d)
const fmt = config.formats[config.formatKeys.master]!
const wide = process.argv.includes('--all')
const pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
const jup = config.stopIds.indexOf(seg.stop) + 1
const px = (c: THREE.Vector3, vfov: number): [number, number, number] => {
  const t = Math.tan(THREE.MathUtils.degToRad(vfov) / 2)
  const f = fmt.height / 2 / t
  return [fmt.width / 2 + (c.x / -c.z) * f, fmt.height / 2 - (c.y / -c.z) * f, f]
}
console.log('judged', beltJudgedFrame(), 'time', m.time.toFixed(4))
const seen: Record<string, number[]> = {}
const last: Record<string, [number, number]> = {}
for (let f = seg.firstFrame; f < seg.endFrame; f++) {
  const s = d.shotAt(f, (f + 0.25) / config.fps)
  const inv = s.camera.quaternion.clone().invert()
  const js = s.sets.find((x) => x.id === config.stopIds[jup])
  let jx = -1e5, jy = -1e5, jr = 0
  if (js) {
    const c = js.origin.clone().sub(s.camera.position).applyQuaternion(inv)
    if (c.z < 0) { const [x, y, fl] = px(c, s.camera.vfov); jx = x; jy = y; jr = fl / c.length() }
  }
  const cols: string[] = []
  m.rocks.forEach((r, i) => {
    m.pose(i, s, pose)
    const c = pose.position.clone().applyQuaternion(inv)
    const dist = c.length()
    let text = 'behind'
    if (c.z < -r.radius * 0.2) {
      const [x, y, fl] = px(c, s.camera.vfov)
      const rad = (r.radius / -c.z) * fl
      const coc = beltSpec.aperture * Math.max(0, 1 / dist - 1 / beltSpec.focus)
      const reach = rad + coc / 2
      const inside = x + reach > 0 && x - reach < fmt.width && y + reach > 0 && y - reach < fmt.height
      const prev = last[r.id]
      const speed = prev ? Math.hypot(x - prev[0], y - prev[1]) : 0
      last[r.id] = [x, y]
      const gap = Math.hypot(x - jx, y - jy) - rad - jr - coc / 2
      if (inside) (seen[r.id] ??= []).push(f)
      text = (inside ? '*' : ' ') + x.toFixed(0) + ',' + y.toFixed(0) + ' r' + rad.toFixed(0) + ' c' + coc.toFixed(0) + ' v' + speed.toFixed(0) + ' d' + dist.toFixed(1) + (inside && gap < 0 ? ' JUP' : '')
    }
    cols.push(r.id + ' ' + text)
  })
  if (wide || f % 3 === 0 || Math.abs(f - beltJudgedFrame()) < 3) console.log('f' + f + ' jup ' + jx.toFixed(0) + ',' + jy.toFixed(0) + ' r' + jr.toFixed(0) + ' | ' + cols.join(' | '))
}
for (const [id, fr] of Object.entries(seen)) console.log(id, 'in frame', fr[0], 'to', fr[fr.length - 1], '(' + fr.length + ' frames)', fr.length !== fr[fr.length - 1]! - fr[0]! + 1 ? 'NOT CONTIGUOUS' : '')
const a = d.shotAt(2782, 2782.25 / 30), b = d.shotAt(2800, 2800.25 / 30)
const js = a.sets.find((x) => x.id === config.stopIds[jup])!
console.log('flow dir . jupiter dir', b.dustOffset.clone().sub(a.dustOffset).normalize().negate().dot(js.origin.clone().sub(a.camera.position).normalize()).toFixed(3))
