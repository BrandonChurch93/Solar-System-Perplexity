import { writeFileSync } from 'node:fs'
import { config } from '../../src/config'
import { flightField, type FlightDef } from '../../src/space/travel/field'

const def = (config.raw.travel as { sky: { flightStars: FlightDef } }).sky.flightStars
const f = flightField(def)
const out = process.argv[2] ?? '/tmp/field'
writeFileSync(out + '.pos', Buffer.from(f.position.buffer))
writeFileSync(out + '.star', Buffer.from(f.star.buffer))
writeFileSync(out + '.col', Buffer.from(f.color.buffer))
writeFileSync(out + '.glow', Buffer.from(f.glow.buffer))
writeFileSync(out + '.json', JSON.stringify({ count: def.count, width: f.width, height: f.height, level: def.level, glow: def.glow, glowTint: def.glowTint }))
