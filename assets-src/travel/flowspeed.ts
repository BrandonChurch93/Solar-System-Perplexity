import * as THREE from 'three'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { Flow, FLOW } from '../../src/space/travel/flow'
const d = new FilmDirector(plans)
const flow = new Flow(d, process.env.RAW ? 0 : FLOW.ease)
const seg = config.segments.find((s) => s.id === process.argv[2])!
const out: string[] = []
for (let f = seg.firstFrame; f < seg.endFrame; f++) {
  const a = flow.at(seg, f, 0, new THREE.Vector3())
  const b = flow.at(seg, f, FLOW.stepsPerFrame, new THREE.Vector3())
  const p0 = d.shotAt(f, f / config.fps).camera.position
  const p1 = d.shotAt(f, (f + 0.999) / config.fps).camera.position
  out.push(`${f}:${(a.distanceTo(b) * config.fps).toFixed(3)}/${(p0.distanceTo(p1) * config.fps / 0.999).toExponential(1)}`)
}
console.log(out.join(' '))
