import { createHash } from 'node:crypto'
import * as THREE from 'three'
import { config } from '../../src/config'
import { setCapture, shutterSpan, spanMid } from '../../src/core/clock'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'
import { Flow, FLOW } from '../../src/space/travel/flow'

// npx tsx assets-src/travel/shothash.ts [--rate 2]: capture frame, segment, hash of the shot, hash of the dust's flow (reads the path 8 frames ahead)
const i = process.argv.indexOf('--rate')
const rate = i > 0 ? Number(process.argv[i + 1]) : 1
setCapture(rate)
const film = new FilmDirector(plans)
const flow = new Flow(film, FLOW.ease)
const a = new THREE.Vector3()
const b = new THREE.Vector3()
const sha = (x: unknown): string => createHash('sha256').update(JSON.stringify(x)).digest('hex').slice(0, 16)
for (let k = 0; k < config.frameCount * rate; k++) {
  const p = k / rate
  const frame = Math.floor(p)
  const shot = film.shotAt(frame, (p + spanMid()) / config.fps)
  const seg = config.segments.find((s) => frame >= s.firstFrame && frame < s.endFrame)!
  flow.at(seg, p, 0, a)
  flow.at(seg, p, shutterSpan() * FLOW.stepsPerFrame, b)
  console.log(p, seg.id, sha(shot), sha([a.toArray(), b.toArray()]))
}
