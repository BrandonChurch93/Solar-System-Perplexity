import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { config } from '../src/config'
import { setCapture } from '../src/core/clock'
import { FilmDirector } from '../src/director/film'
import { plans } from '../src/director/plans'
import { WORK, args } from './lib/common'
import { STILL, WINDOW, standing, tableOf, verdict, where, type SeamRow } from './seams/rule'
import { read, seamsOf, type Read, type Seam } from './seams/speeds'

// Does the picture stand at a seam? A report and not a gate: it draws nothing, reads the film's own shots and always exits 0.
//   npx tsx tools/seams.ts [--stop ID]
// One row a seam (tools/seams/speeds.ts says how the speed is read, tools/seams/rule.ts when a picture stands). Writes
// out/work/seams/seams.md and seams.json (every step of every window).

const a = args()
const rate = config.raw.smooth.rate
const size = { w: config.formats[config.formatKeys.preview]!.width, h: config.formats[config.formatKeys.preview]!.height, rate }
setCapture(rate)
const film = new FilmDirector(plans)
const seams = seamsOf().filter((s) => !a.stop || s.stop === a.stop)
const read_: (Seam & { rows: Read[] })[] = seams.map((s) => ({ ...s, rows: read(film, s, size) }))
const rows: (SeamRow & { from: number; to: number })[] = read_.map((s) => ({ stop: s.stop, seam: s.seam, frame: s.frame, from: s.from, to: s.to, verdict: verdict(s.rows) }))
const stood = standing(rows)

const lines = [
  '# Seams: does the picture stand',
  '',
  'Read from the film\'s own shots, nothing drawn: preview size ' + size.w + ' by ' + size.h + ', ' + (rate === 2 ? 'half frames' : 'steps of 1/' + rate + ' film frame') + ' (rate ' + rate + ', time at the shutter\'s middle). A report, not a gate.',
  '',
  '- middle: how far the point of the scene under the picture\'s middle goes from one step to the next, in px. Read only where that point lies on the stop\'s own body.',
  '- limb: the shift of the body\'s centre plus the change of its outline\'s radius. Read only where the outline crosses the picture and the stop\'s set is drawn.',
  '- mean of the frame: the same reading at 48 by 27 points spread over the picture, averaged.',
  '- where: a film frame, with 1/' + rate + ' steps. A lowest speed is named by the step\'s start; a change of speed by the moment its two steps share.',
  '- stands: under ' + STILL.px + ' px a step at both points for ' + STILL.steps + ' or more steps in a row, with ' + STILL.px + ' or more before and after inside the window. The count of steps is in brackets.',
  '- Windows: the last ' + WINDOW.before + ' film frames of a rise and the first ' + WINDOW.after + ' after; the last ' + WINDOW.after + ' of a flight and the first ' + WINDOW.before + ' of the hold.',
  '',
  ...tableOf(rows, rate),
  '',
  stood.length === 0 ? 'No seam stands at both points.' : stood.length + ' of ' + rows.length + ' seams stand at both points: ' + stood.map((r) => r.stop + ' at ' + r.frame + ' (' + (r.verdict.both.kind === 'stands' ? where(r.verdict.both.run.first, rate) + ' to ' + where(r.verdict.both.run.end, rate) + ', ' + r.verdict.both.run.steps + ' steps' : '') + ')').join(', ') + '.',
  '',
]
const dir = join(WORK, 'seams')
mkdirSync(dir, { recursive: true })
const name = a.stop ? 'seams-' + a.stop : 'seams'
writeFileSync(join(dir, name + '.md'), lines.join('\n'))
writeFileSync(join(dir, name + '.json'), JSON.stringify({ size, limits: STILL, windows: WINDOW, standing: stood.map((r) => ({ stop: r.stop, frame: r.frame })), seams: read_.map((s, i) => ({ ...rows[i], rows: s.rows })) }))
console.log(lines.slice(11).join('\n'))
console.log('seams: ' + join(dir, name + '.md'))
