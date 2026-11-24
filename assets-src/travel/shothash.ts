import { createHash } from 'node:crypto'
import { config } from '../../src/config'
import { FilmDirector } from '../../src/director/film'
import { plans } from '../../src/director/plans'

// One hash of the whole shot (camera, sets, light, post) for every capture frame of the film, to show which frames an edit of the path moves.
//   npx tsx assets-src/travel/shothash.ts [--rate 2] > file ; diff two files
const i = process.argv.indexOf('--rate')
const rate = i > 0 ? Number(process.argv[i + 1]) : 1
const film = new FilmDirector(plans)
for (let k = 0; k < config.frameCount * rate; k++) {
  const frame = Math.floor(k / rate)
  const shot = film.shotAt(frame, (k + 0.25) / (config.fps * rate))
  const seg = config.segments.find((s) => frame >= s.firstFrame && frame < s.endFrame)!
  console.log(k / rate, seg.id, createHash('sha256').update(JSON.stringify(shot)).digest('hex').slice(0, 16))
}
