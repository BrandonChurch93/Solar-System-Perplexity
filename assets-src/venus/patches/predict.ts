import * as THREE from 'three'
import { config } from '../../../src/config'

const arg = (name: string, d: string): string => {
  const i = process.argv.indexOf('--' + name)
  return i > 0 ? process.argv[i + 1]! : d
}
const stop = arg('stop', 'venus')
const { plan } = await import('../../../src/stops/' + stop + '/plan')
const fit = plan.fit
const widths = arg('levels', '96,48,24,12').split(',').filter((s) => s.length > 0).map(Number)
const size = Number(arg('size', '4096'))
const mapWidth = Number(arg('map', '8192'))
const feather = 0.12
const fade = [1.02, 1.5]
const W = Number(arg('width', '1920'))
const H = (W * 9) / 16
const step = Number(arg('step', '20'))
const kinds = arg('kinds', 'dive,rise').split(',')
const every = Number(arg('every', '3'))

const globeTurn = new THREE.Quaternion().fromArray(fit.globe.quaternion)
const spotBody = plan.spot.clone().applyQuaternion(globeTurn.clone().invert()).normalize()
const east = new THREE.Vector3(0, 1, 0).cross(spotBody).normalize()
const north = spotBody.clone().cross(east)
const ss = (a: number, b: number, x: number): number => {
  const t = Math.min(Math.max((x - a) / (b - a), 0), 1)
  return t * t * (3 - 2 * t)
}

for (const seg of config.segments.filter((s) => s.stop === stop && kinds.includes(s.kind))) {
  for (let f = seg.firstFrame; f < seg.endFrame; f += every) {
    const time = (f + 0.5) / config.fps
    const shot = seg.kind === 'dive' ? plan.dive(time) : seg.kind === 'rise' ? plan.rise(time) : { pose: plan.hold(time - seg.start), view: 'orbit' as const }
    if (shot.view !== 'orbit') continue
    const pose = shot.pose
    const inv = plan.turn(time).clone().invert()
    const toBody = globeTurn.clone().invert().multiply(inv)
    const th = Math.tan(THREE.MathUtils.degToRad(pose.vfov) / 2)
    const hit = (x: number, y: number): THREE.Vector3 | null => {
      const ray = new THREE.Vector3(((2 * (x + 0.5)) / W - 1) * th * (W / H), (1 - (2 * (y + 0.5)) / H) * th, -1).normalize().applyQuaternion(pose.quaternion)
      const b = pose.position.dot(ray)
      const c = pose.position.lengthSq() - 1
      const disc = b * b - c
      if (disc <= 0 || -b - Math.sqrt(disc) <= 0) return null
      return pose.position.clone().addScaledVector(ray, -b - Math.sqrt(disc)).normalize().applyQuaternion(toBody)
    }
    const gn = (d: THREE.Vector3): [number, number] => {
      const k = 1 / Math.max(d.dot(spotBody), 0.05)
      return [d.dot(east) * k, d.dot(north) * k]
    }
    let n = 0
    let soft = 0
    let min = 99
    const deepest: number[] = widths.map(() => 0)
    let wrapOnly = 0
    for (let y = step / 2; y < H; y += step) {
      for (let x = step / 2; x < W; x += step) {
        const d = hit(x, y)
        const dx = hit(x + 1, y)
        const dy = hit(x, y + 1)
        if (!d || !dx || !dy) continue
        n++
        let texels = Math.max(dx.distanceTo(d), dy.distanceTo(d)) * mapWidth / (2 * Math.PI)
        let parent = texels
        const g = gn(d)
        const gx = gn(dx)
        const gy = gn(dy)
        const gd = Math.max(Math.hypot(gx[0] - g[0], gx[1] - g[1]), Math.hypot(gy[0] - g[0], gy[1] - g[1]))
        const front = d.dot(spotBody) >= 0.3 ? 1 : 0
        let deep = -1
        for (let i = 0; i < widths.length; i++) {
          const scale = 1 / (2 * Math.tan(THREE.MathUtils.degToRad(widths[i]!) / 2))
          const w = front * ss(0.5, 0.5 - feather, Math.max(Math.abs(g[0] * scale), Math.abs(g[1] * scale))) * (1 - ss(fade[0]!, fade[1]!, parent))
          parent = gd * scale * size
          if (w >= 0.5) { texels = parent; deep = i }
        }
        if (deep < 0) wrapOnly++
        else deepest[deep]!++
        if (texels < 1) soft++
        min = Math.min(min, texels)
      }
    }
    const alt = pose.position.length() - 1
    console.log(seg.kind, f, 'alt', alt.toFixed(4), 'vfov', pose.vfov.toFixed(1), 'body px share', (n / ((W / step) * (H / step))).toFixed(2), 'soft share', n ? (soft / n).toFixed(4) : '-', 'min', min.toFixed(2), 'wrap', wrapOnly, 'levels', deepest.join(' '))
  }
}
