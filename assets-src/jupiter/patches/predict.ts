import * as THREE from 'three'
import { FilmDirector } from '../../../src/director/film'
import { plans } from '../../../src/director/plans'
import { config } from '../../../src/config'
import { plan as jplan } from '../../../src/stops/jupiter/plan'

const args = process.argv.slice(2)
const stop = 'jupiter'
const mapWidth = Number(args[0] ?? 8192)
const levels = args.slice(1).map((a) => a.split(':').map(Number) as [number, number])
const [clon, clat] = (process.env.CENTRE ?? '-17.5,-10').split(',').map(Number) as [number, number]
const spot = { lon: clon, lat: clat }
const brief = !!process.env.BRIEF
Object.assign(jplan.p.dive, JSON.parse(process.env.DIVE ?? '{}'))
Object.assign(jplan.p.rise, JSON.parse(process.env.RISE ?? '{}'))
Object.assign(jplan.p.terrain, JSON.parse(process.env.TERRAIN ?? '{}'))
const director = new FilmDirector(plans)
const width = config.raw.formats.master.width as number
const height = config.raw.formats.master.height as number
const deg = THREE.MathUtils.radToDeg
const rad = THREE.MathUtils.degToRad
const body = (lon: number, lat: number): THREE.Vector3 => new THREE.Vector3(Math.cos(rad(lat)) * Math.sin(rad(lon)), Math.sin(rad(lat)), Math.cos(rad(lat)) * Math.cos(rad(lon)))
const centre = body(spot.lon, spot.lat)

const east = new THREE.Vector3(0, 1, 0).cross(centre).normalize()
const north = centre.clone().cross(east)
const feather = Number(process.env.FEATHER ?? 0.12)
const fade = (process.env.FADE ?? '1.02,1.5').split(',').map(Number) as [number, number]
const sstep = (a: number, b: number, x: number): number => { const t = Math.min(Math.max((x - a) / (b - a), 0), 1); return t * t * (3 - 2 * t) }

function sample(frame: number): string | null {
  const shot = director.shotAt(frame, frame / config.fps)
  const set = shot.sets.find((s) => s.id === stop)
  if (!set || set.view !== 'orbit') return null
  const inv = set.rotation.clone().invert()
  const cam = shot.camera.position.clone().sub(set.origin).applyQuaternion(inv)
  const q = inv.clone().multiply(shot.camera.quaternion)
  const tanY = Math.tan(rad(shot.camera.vfov) / 2)
  const hit = (px: number, py: number): THREE.Vector3 | null => {
    const d = new THREE.Vector3(((px + 0.5) / width * 2 - 1) * tanY * width / height, (1 - (py + 0.5) / height * 2) * tanY, -1).normalize().applyQuaternion(q)
    const b = cam.dot(d)
    const disc = b * b - cam.lengthSq() + 1
    if (disc <= 0 || b >= 0) return null
    return cam.clone().addScaledVector(d, -b - Math.sqrt(disc)).normalize()
  }
  const gn = (p: THREE.Vector3): [number, number] => { const k = 1 / Math.max(p.dot(centre), 0.05); return [p.dot(east) * k, p.dot(north) * k] }
  let worst = Infinity
  let worstAt = ''
  let far = 0
  let softOff = 0
  const need: number[] = []
  const used = levels.map(() => 0)
  for (let py = 4; py < height; py += 12) for (let px = 4; px < width; px += 12) {
    const p = hit(px, py)
    const px1 = hit(px + 1, py)
    const py1 = hit(px, py + 1)
    if (!p || !px1 || !py1) continue
    let texels = Math.sqrt(Math.max(px1.clone().sub(p).lengthSq(), py1.clone().sub(p).lengthSq())) * mapWidth / (2 * Math.PI)
    const g = gn(p)
    const gx = gn(px1)
    const gy = gn(py1)
    const gd = Math.sqrt(Math.max((gx[0] - g[0]) ** 2 + (gx[1] - g[1]) ** 2, (gy[0] - g[0]) ** 2 + (gy[1] - g[1]) ** 2))
    const front = p.dot(centre) >= 0.3 ? 1 : 0
    let parent = texels
    levels.forEach(([w, size], i) => {
      const scale = 1 / (2 * Math.tan(rad(w) / 2))
      const m = Math.max(Math.abs(g[0] * scale), Math.abs(g[1] * scale))
      const wgt = front * sstep(0.5, 0.5 - feather, m) * (1 - sstep(fade[0], fade[1], parent))
      parent = gd * scale * size
      if (wgt >= 0.5) { texels = parent; used[i]++ }
    })
    const off = deg(p.angleTo(centre))
    far = Math.max(far, off)
    need.push(texels)
    if (texels < 1) softOff = Math.max(softOff, off)
    if (texels < worst) { worst = texels; worstAt = off.toFixed(1) }
  }
  if (!need.length) return null
  need.sort((a, b) => a - b)
  const soft = need.filter((x) => x < 1).length / need.length
  const sub = cam.clone().normalize()
  const cs = config.segments.find((s) => frame >= s.firstFrame && frame < s.endFrame)!
  const cover = jplan.coverAmount(cs, frame / config.fps)
  return frame + ' alt ' + (cam.length() - 1).toFixed(3) + ' sub ' + deg(Math.atan2(sub.x, sub.z)).toFixed(1) + ',' + deg(Math.asin(sub.y)).toFixed(1) + ' (' + deg(sub.angleTo(centre)).toFixed(1) + ' off) min ' + worst.toFixed(2) + ' at ' + worstAt + ' med ' + need[need.length >> 1]!.toFixed(2) + ' soft ' + soft.toFixed(3) + ' softest reach ' + softOff.toFixed(0) + ' reach ' + far.toFixed(0) + ' used ' + used.map((u) => (u / need.length).toFixed(2)).join('/') + ' cover ' + cover.toFixed(2)
}

for (const id of [stop + '.dive', stop + '.rise']) {
  const seg = config.segments.find((s) => s.id === id)!
  if (!brief) console.log(id)
  const bad: string[] = []
  let low = Infinity
  let lowAt = 0
  for (let f = seg.firstFrame; f < seg.endFrame; f++) {
    const line = sample(f)
    if (!line) continue
    if (!brief) console.log('  ' + line)
    const soft = Number(line.split(' soft ')[1]!.split(' ')[0])
    const cover = Number(line.split(' cover ')[1])
    const min = Number(line.split(' min ')[1]!.split(' ')[0])
    if (cover === 0 && f !== 3016 && min < low) { low = min; lowAt = f }
    if (soft > 0.02 && cover === 0) bad.push(f + ':' + soft.toFixed(3) + '@' + line.split('softest reach ')[1]!.split(' ')[0])
  }
  console.log(id + ' frames over 0.02 outside the cover: ' + (bad.join(' ') || 'none') + '; lowest min ' + low.toFixed(2) + ' at ' + lowAt)
}
