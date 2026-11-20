import { writeFileSync } from 'node:fs'
import { config } from '../src/config'
import { plans } from '../src/director/plans'
import { coverWindow } from '../src/director/timeline'

const inFrame: Record<string, { hold: string; terrain: string; next: string }> = {
  sun: { hold: 'the full disc, sunspots, bright regions, prominences on both limbs, corona, stars', terrain: 'boiling granulation, a sunspot, plasma loops arching over it, the curved horizon, stars above', next: 'Mercury as a dark speck beside the glare' },
  mercury: { hold: 'the globe lit hard from one side, the huge Sun and its flare at the frame edge, stars', terrain: 'the terraced crater, the curved horizon, the Sun glow on the horizon, stars', next: 'Venus as a pale gold point' },
  venus: { hold: 'the golden cloud globe, chevron bands, the polar vortex, the glowing limb, stars', terrain: 'cloud towers and canyons, shafts of sunlight, the low Sun, stars above', next: 'Earth as a blue point' },
  earth: { hold: 'the Americas, the hurricane, the blue limb, city lights past the terminator, aurora, the Moon far off, stars', terrain: 'the tropical coast, turquoise shallows, sun glint, thunderheads, the blue limb', next: 'Mars as a rust point' },
  mars: { hold: 'Valles Marineris, the Tharsis volcanoes, the polar cap, the dust storm, limb haze, Phobos in front, stars', terrain: 'canyon walls and mesas at dawn, mist on the canyon floor, the glowing horizon, stars above', next: 'Jupiter as a cream point, asteroid rocks passing the lens' },
  jupiter: { hold: 'the bands, the Great Red Spot, white ovals, Io and its shadow, stars', terrain: 'the Great Red Spot from just above the cloud tops, the limb, stars', next: 'Saturn as a pale gold point' },
  saturn: { hold: 'the globe inside open rings, the Cassini Division, both shadows, Titan far off, stars', terrain: 'the ring plane racing under the lens, Saturn huge behind, stars', next: 'Uranus as a cyan point' },
  uranus: { hold: 'the cyan globe, thin upright rings, Miranda and Ariel, stars', terrain: 'the upper haze near the limb, ring arcs overhead, the Sun as a bright star', next: 'Neptune as a blue point' },
  neptune: { hold: 'the blue globe, white cirrus, the dark storm, the faint ring, Triton, the Sun as a star', terrain: 'white cirrus streaming round the dark storm, the limb, stars', next: '' },
}
const side = (v: number, a: string, b: string): string => (v >= 0 ? a : b)
const tc = (s: number): string => {
  const m = Math.floor(s / 60)
  const r = s - m * 60
  return String(m).padStart(2, '0') + ':' + r.toFixed(1).padStart(4, '0')
}
const rows: string[] = []
for (const seg of config.segments) {
  const at = config.stopIds.indexOf(seg.stop)
  const plan = at >= 0 ? plans[at]! : null
  const p = plan?.p
  const f = plan ? inFrame[plan.id]! : null
  const hero = plan ? plan.fit.vfovDeg : 0
  let lens = ''
  let move = ''
  let start = ''
  let end = ''
  let what = ''
  if (seg.kind === 'hold' && p && f) {
    lens = hero + ' deg'
    move = 'slow orbit arc of ' + p.hold.orbitDeg + ' deg with a ' + Math.abs(p.hold.push * 100).toFixed(1) + ' percent push in, seeded drift, globe turning ' + Math.abs(p.spinDegPerSecond) + ' deg per second'
    start = 'the hero framing seen from half the arc before it'
    end = 'the hero framing seen from half the arc past it. The midpoint matches the approved hero image'
    what = f.hold
  } else if (seg.kind === 'dive' && p && f) {
    const w = coverWindow(seg)!
    lens = hero + ' to ' + p.terrain.vfov + ' deg'
    move = 'fall on a logarithmic altitude curve toward the spot, heading ' + p.dive.headingDeg + ' deg, bowing ' + side(p.dive.bow, 'right', 'left') + ', roll ' + p.dive.rollDeg + ' deg. Cover from frame ' + w.firstFrame + ' to ' + w.lastFrame
    start = 'the end of the hold'
    end = 'the first frame of the terrain move, still slowing'
    what = 'the globe growing until the spot fills the frame, the cover haze, then the terrain'
  } else if (seg.kind === 'terrain' && p && f) {
    lens = p.terrain.vfov + ' deg'
    move = plan!.id === 'sun' ? 'low flight forward ' + p.terrain.forward + ' units with a ' + p.terrain.rise + ' rise' : 'low flight forward ' + p.terrain.forward + ' units, ' + side(p.terrain.side, 'sliding right', 'sliding left') + ' ' + Math.abs(p.terrain.side) + ', rising ' + p.terrain.rise + ', yaw ' + p.terrain.yawDeg + ' deg'
    start = plan!.id === 'sun' ? 'frame 0, the poster frame, a little behind the approved close framing' : 'behind and slightly above the approved close framing'
    end = 'past the approved close framing. The midpoint matches the approved close image'
    what = f.terrain
  } else if (seg.kind === 'rise' && p && f) {
    const w = coverWindow(seg)!
    lens = p.terrain.vfov + ' to ' + hero + ' deg'
    move = plan!.id === 'sun' ? 'pull back and up through the flare. Cover from frame ' + w.firstFrame + ' to ' + w.lastFrame : 'climb on its own line, azimuth ' + p.rise.azimuthDeg + ' deg, elevation ' + p.rise.elevationDeg + ' deg, to distance ' + p.rise.distance + ', roll ' + p.rise.rollDeg + ' deg. Cover from frame ' + w.firstFrame + ' to ' + w.lastFrame
    start = 'the last frame of the terrain move'
    end = plan!.id === 'sun' ? 'the whole disc centered, arriving at the hold' : 'the whole body in frame, set ' + side(p.rise.offset[0], 'right', 'left') + ' of center, still drifting out'
    what = 'the terrain, the cover, then the whole body'
  } else if (seg.kind === 'travel' && p && f) {
    const next = plans[at + 1]!
    lens = hero + ' deg'
    move = plan!.id === 'sun' ? 'pull straight back until the Sun is the size it has at Mercury, then turn ' + p.travel.turnDeg + ' deg to Mercury and approach' : 'turn ' + p.travel.turnDeg + ' deg to the ' + side(p.travel.side, 'right', 'left') + ' onto open sky, then approach ' + next.id + ' on a logarithmic curve'
    start = 'the end of the rise, the body leaving frame behind the camera'
    end = 'the first frame of the ' + next.id + ' hold'
    what = 'stars, dust motes, the Sun glare where this stop puts it, ' + f.next
  } else if (seg.kind === 'retreat') {
    lens = '30 to 34 deg'
    move = 'keep pulling away from Neptune past Triton, then turn back to face the way the film came'
    start = 'the end of the Neptune rise'
    end = 'the lookback framing'
    what = 'Neptune and Triton shrinking, then the inner solar system'
  } else if (seg.kind === 'lookback') {
    lens = '34 deg'
    move = 'almost still: a slow drift and a slight roll'
    start = 'the Sun as one bright star, Neptune a thin crescent at the left edge'
    end = 'the same, a little further out'
    what = 'the Sun as a star with a small glare, thousands of stars, the Milky Way, the Neptune crescent'
  } else if (seg.kind === 'fade') {
    lens = '34 deg'
    move = 'the lookback move continues while the picture falls to black'
    start = 'the lookback framing'
    end = 'black'
    what = 'the same picture, fading'
  }
  rows.push('| `' + seg.id + '` | ' + tc(seg.start) + ' to ' + tc(seg.end) + ' | ' + seg.firstFrame + ' to ' + (seg.endFrame - 1) + ' | ' + lens + ' | ' + move + ' | ' + start + ' | ' + end + ' | ' + what + ' |')
}
const text = [
  '# Shots',
  '',
  'Written by `npx tsx tools/shots.ts` from `config/showcase.json` and each stop\'s `src/stops/<id>/plan.ts`. Lens is the vertical field of view. Distances are in body radii. Angles are in degrees.',
  '',
  'Every stop approaches from its own side, dives on its own heading and leaves on its own line. Left and right alternate from stop to stop.',
  '',
  '| Segment | Time | Frames | Lens | Move | Start framing | End framing | In frame |',
  '| --- | --- | --- | --- | --- | --- | --- | --- |',
  ...rows,
  '',
].join('\n')
writeFileSync('cut/SHOTS.md', text)
console.log(rows.length + ' segments')
