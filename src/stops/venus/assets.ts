import apronJson from './aprons.json'
import placeJson from './place.json'
import platesJson from './plates.json'
import reliefJson from './relief.json'
import type { CloudReliefDef } from './relief'
import wrapJson from './wrap.json'

export const wrap = {
  top: wrapJson.top,
  sets: {
    full: { color: wrapJson.color.full as [number, number], flow: wrapJson.flow.full as [number, number], bolt: wrapJson.bolt.full },
    web: { color: wrapJson.color.web as [number, number], flow: wrapJson.flow.web as [number, number], bolt: wrapJson.bolt.web },
  },
  bolt: { lon: wrapJson.bolt.lon, lat: wrapJson.bolt.lat, widthDeg: wrapJson.bolt.widthDeg },
}

// Two levels. The two deeper ones (28 and 14 deg about the old spot) left the set for the memory limit of gate G15: they showed in
// the lower left corner of frames 1291 to 1307 only, where the camera does not go, and G13 holds without them.
export const patches = {
  levels: [
    { file: 'patch-a.jpg', widthDeg: 90 },
    { file: 'patch-b.jpg', widthDeg: 53.13010235 },
  ] as { file: string; widthDeg: number }[],
  // The width of each patch in the full set, in texels: what the exchange of the levels counts in both sets (plates.json, texelsNote).
  full: platesJson.texels.patches as number[],
  feather: 0.12,
  fade: [1.02, 1.5] as [number, number],
}

const ahead = (platesJson.aheadDeg * Math.PI) / 180
const under = placeJson.place.under.direction
const heading = placeJson.place.heading

export const place = {
  // The levels made again for each handover (assets-src/venus/place/tlay.py) have one picture for the dive and one for the rise.
  // colourOf: the index of the level whose plate gives the colour of a level that holds its light alone (plates.json, lightNote), or -1.
  // most: the light of such a level over the light of that plate at the top of its channel.
  levels: (platesJson.levels as { tag: string; file: string; widthDeg: number; colour?: string; most?: number }[]).map((l) => {
    const twice = platesJson.atT.tags.includes(l.tag)
    const colourOf = l.colour ? platesJson.levels.findIndex((x) => x.tag === l.colour) : -1
    if (l.colour && (colourOf < 0 || 'colour' in platesJson.levels[colourOf]!)) throw new Error('plates.json: level ' + l.tag + ' needs a level with its own colour')
    if (l.colour && (l.most ?? 0) <= 0) throw new Error('plates.json: level ' + l.tag + ' needs most')
    const full = (platesJson.texels.plates as Record<string, number>)[l.tag]
    if (!full) throw new Error('plates.json: texels.plates has no width for level ' + l.tag)
    return { tag: l.tag, file: l.file, widthDeg: l.widthDeg, full, colourOf, most: l.most ?? 1, dive: twice ? l.file.replace('.jpg', '-dive.jpg') : l.file, rise: twice ? l.file.replace('.jpg', '-rise.jpg') : l.file }
  }),
  wide: { file: platesJson.wide.file, widthDeg: platesJson.wide.widthDeg, full: platesJson.texels.wide, rim: platesJson.wide.rim, forms: platesJson.wide.forms, formsDeg: platesJson.wide.formsDeg as [number, number], own: platesJson.wide.own },
  rim: platesJson.rim,
  forms: platesJson.forms.look as [number, number, number],
  tone: { cos: platesJson.tone.cos as [number, number], power: platesJson.tone.curve, air: platesJson.tone.air, heights: platesJson.tone.heights as [number, number], live: platesJson.tone.live },
  air: { heights: platesJson.air.heights as [number, number], sunHeights: platesJson.air.sun.heights as [number, number], exactHeights: platesJson.air.sun.exactHeights as [number, number], haze: platesJson.air.haze },
  centre: [0, 1, 2].map((i) => under[i]! * Math.cos(ahead) + heading[i]! * Math.sin(ahead)) as [number, number, number],
  feather: platesJson.feather,
  fade: platesJson.fade as [number, number],
  heading: heading as [number, number, number],
  show: { heights: platesJson.show.heights as [number, number] },
  dusk: { gain: platesJson.dusk.gain, hue: platesJson.dusk.hue, tint: platesJson.dusk.tint as [number, number, number], heights: platesJson.dusk.heights as [number, number] },
  leave: { heights: platesJson.leave.heights as [number, number] },
  ground: { heights: platesJson.ground.heights as [number, number], bandHeights: platesJson.ground.bandHeights as [number, number], true: platesJson.ground.true as [number, number], skin: platesJson.ground.skin as [number, number], tall: platesJson.ground.tall as [number, number], release: platesJson.ground.release as [number, number], keep: platesJson.ground.keep as [number, number], matte: platesJson.ground.matte, frustum: { margin: platesJson.ground.frustum.margin as [number, number], near: platesJson.ground.frustum.near as [number, number], forms: platesJson.ground.frustum.forms, wide: platesJson.ground.frustum.wide }, flat: { sinElevation: platesJson.ground.flat.sinElevation as [number, number], horizon: platesJson.ground.flat.horizon as [number, number] }, band: [(platesJson.ground.bandDeg[0]! * Math.PI) / 180, (platesJson.ground.bandDeg[1]! * Math.PI) / 180] as [number, number], tone: { broad: platesJson.ground.tone.broad, under: platesJson.ground.tone.under as Record<'dive' | 'rise', [number, number, number]> } },
  sky: { low: platesJson.sky.low as [number, number], carry: platesJson.sky.carry as [number, number], lift: platesJson.sky.lift },
}

const TINTS: [number, number, number][] = [[0.85, 0.3, 0.25], [0.3, 0.75, 0.35], [0.9, 0.75, 0.2], [0.4, 0.5, 0.9]]

function reliefDef(key: 'full' | 'web'): CloudReliefDef {
  const k = key === 'full' ? 1 : 0.5
  const layers = { ...apronJson.layers, ...reliefJson.layers } as Record<string, { box: number[]; distSize: Record<string, number[]>; alpha: boolean; under?: boolean }>
  const box = (b: number[]): [number, number, number, number] => [b[0]! * k, b[1]! * k, b[2]! * k, b[3]! * k]
  return {
    imageSize: reliefJson.imageSize[key] as [number, number],
    perFull: reliefJson.imageSize.full[0]! / reliefJson.imageSize[key][0]!,
    vfovDeg: reliefJson.camera.vfovDeg,
    up: reliefJson.camera.up as [number, number, number],
    radius: reliefJson.camera.radius,
    sun: reliefJson.camera.sun as [number, number],
    layers: [...apronJson.order, ...reliefJson.drawOrder].map((id, i) => {
      const l = layers[id]!
      const d = l.distSize[key]!
      return { color: `relief-${id}-color.jpg`, ...(l.alpha ? { alpha: `relief-${id}-alpha.png` } : {}), dist: `relief-${id}-dist.bin`, box: box(l.box), distSize: [d[0]!, d[1]!], tint: TINTS[i % TINTS.length]!, ...(l.under ? { under: true } : {}), ...(id === 'L0' ? { edge: apronJson.edge as [number, number] } : {}) }
    }),
    masks: 'relief-masks.png',
    maskBox: box(reliefJson.masks.box),
    air: 'relief-air.png',
    airSun: { file: platesJson.air.sun.file, limbFile: platesJson.air.sun.limbFile, atDeg: platesJson.air.sun.atDeg as [number, number], boxDeg: platesJson.air.sun.boxDeg as [number, number, number], exactCoreDeg: platesJson.air.sun.exactCoreDeg as [number, number], exactUnderDeg: platesJson.air.sun.exactUnderDeg },
  }
}

export const relief: Record<'full' | 'web', CloudReliefDef> = { full: reliefDef('full'), web: reliefDef('web') }
