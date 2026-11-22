import * as THREE from 'three'
import { config } from '../../src/config'
import { shutterMid } from '../../src/core/sampler'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { BeltMotion, beltJudgedFrame, beltSegment, beltSpec } from '../../src/space/belt/motion'

const d = new FilmDirector(plans)
const seg = beltSegment()
const m = new BeltMotion(d)
const fmt = config.formats[config.formatKeys.master]!
const wide = process.argv.includes('--all')
const pose = { position: new THREE.Vector3(), quaternion: new THREE.Quaternion() }
console.log('judged', beltJudgedFrame())
const seen: Record<string, number[]> = {}
const last: Record<string, [number, number]> = {}
const worst: Record<string, { area: number; disc: number; speed: number; depth: number; who: string }> = {}
for (let f = seg.firstFrame; f < seg.endFrame; f++) {
  const s = d.shotAt(f, (f + shutterMid()) / config.fps)
  const inv = s.camera.quaternion.clone().invert()
  const fl = fmt.height / 2 / Math.tan(THREE.MathUtils.degToRad(s.camera.vfov) / 2)
  const discs = s.sets.filter((x) => x.id === s.segment.stop || s.farLight === undefined || s.farLight > 0).map((x) => {
    const c = x.origin.clone().sub(s.camera.position).applyQuaternion(inv)
    return { id: x.id, c, r: Math.asin(Math.min(1, 1 / c.length())) }
  })
  const cols: string[] = []
  m.rocks.forEach((r, i) => {
    m.pose(i, s, pose)
    const c = pose.position.clone().applyQuaternion(inv)
    const dist = c.length()
    const w = (worst[r.id] ??= { area: 0, disc: 1e9, speed: 0, depth: 1e9, who: '' })
    let text = 'behind'
    if (c.z < -r.radius * 0.2) {
      const x = fmt.width / 2 + (c.x / -c.z) * fl
      const y = fmt.height / 2 - (c.y / -c.z) * fl
      const rad = (r.radius / -c.z) * fl
      const coc = beltSpec.aperture * Math.max(0, 1 / dist - 1 / beltSpec.focus)
      const reach = rad + coc / 2
      const inside = x + reach > 0 && x - reach < fmt.width && y + reach > 0 && y - reach < fmt.height
      const prev = last[r.id]
      const speed = prev ? Math.hypot(x - prev[0], y - prev[1]) : 0
      last[r.id] = [x, y]
      let flag = ''
      if (inside) {
        (seen[r.id] ??= []).push(f)
        const blur = speed * config.shutterFraction
        const x0 = Math.max(0, x - reach), x1 = Math.min(fmt.width, x + reach), y0 = Math.max(0, y - reach), y1 = Math.min(fmt.height, y + reach)
        const area = (Math.min(Math.PI * reach * reach, (x1 - x0) * (y1 - y0)) + 2 * reach * blur) / (fmt.width * fmt.height)
        w.area = Math.max(w.area, area)
        w.speed = Math.max(w.speed, speed)
        w.depth = Math.min(w.depth, -c.z - r.radius)
        for (const k of discs) {
          const gap = (c.angleTo(k.c) - Math.asin(Math.min(1, r.radius / dist)) - k.r) * fl - coc / 2
          if ((k.c.z < 0 || k.r > 0.5) && gap < w.disc) {
            w.disc = gap
            w.who = k.id + ' at ' + f
          }
          if (gap < 0) flag += ' ON-' + k.id
        }
      }
      text = (inside ? '*' : ' ') + x.toFixed(0) + ',' + y.toFixed(0) + ' r' + rad.toFixed(0) + ' c' + coc.toFixed(0) + ' v' + speed.toFixed(0) + ' d' + dist.toFixed(2) + flag
    }
    cols.push(r.id + ' ' + text)
  })
  if (wide || f % 3 === 0 || f === beltJudgedFrame()) console.log('f' + f + ' | ' + cols.join(' | '))
}
for (const [id, fr] of Object.entries(seen)) {
  const w = worst[id]!
  console.log(id, 'in frame', fr[0], 'to', fr[fr.length - 1], '(' + fr.length + ')', fr.length !== fr[fr.length - 1]! - fr[0]! + 1 ? 'NOT CONTIGUOUS' : '', 'max area', (w.area * 100).toFixed(1) + '%', 'min gap to a disc', w.disc.toFixed(0), 'px (' + w.who + '), max speed', w.speed.toFixed(0), 'px per frame, min clear depth', w.depth.toFixed(2), fr[0] === seg.firstFrame || fr[fr.length - 1] === seg.endFrame - 1 ? 'TOUCHES SEGMENT END' : '')
}
