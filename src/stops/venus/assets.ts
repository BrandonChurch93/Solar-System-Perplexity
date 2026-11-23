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

export const patches = {
  levels: [
    { file: 'patch-a.jpg', widthDeg: 90 },
    { file: 'patch-b.jpg', widthDeg: 53.13010235 },
    { file: 'patch-c.jpg', widthDeg: 28.07248694 },
    { file: 'patch-d.jpg', widthDeg: 14.2500327 },
  ] as { file: string; widthDeg: number }[],
  feather: 0.12,
  fade: [1.02, 1.5] as [number, number],
}

const ahead = (platesJson.aheadDeg * Math.PI) / 180
const under = placeJson.place.under.direction
const heading = placeJson.place.heading

export const place = {
  // The levels made again for each handover (assets-src/venus/place/tlay.py) have one picture for the dive and one for the rise.
  levels: platesJson.levels.map((l) => {
    const twice = platesJson.atT.tags.includes(l.tag)
    return { ...l, dive: twice ? l.file.replace('.jpg', '-dive.jpg') : l.file, rise: twice ? l.file.replace('.jpg', '-rise.jpg') : l.file }
  }) as { tag: string; file: string; widthDeg: number; dive: string; rise: string }[],
  rim: platesJson.rim,
  forms: platesJson.forms.look as [number, number, number],
  tone: { dive: platesJson.tone.files.dive, rise: platesJson.tone.files.rise, size: platesJson.tone.size, widthDeg: platesJson.tone.widthDeg, cos: platesJson.tone.cos as [number, number], power: platesJson.tone.curve, floor: platesJson.tone.floor, heights: platesJson.tone.heights as [number, number] },
  air: { heights: platesJson.air.heights as [number, number], sunHeights: platesJson.air.sun.heights as [number, number], haze: platesJson.air.haze },
  centre: [0, 1, 2].map((i) => under[i]! * Math.cos(ahead) + heading[i]! * Math.sin(ahead)) as [number, number, number],
  feather: platesJson.feather,
  fade: platesJson.fade as [number, number],
  heading: heading as [number, number, number],
  show: { heights: platesJson.show.heights as [number, number] },
  dusk: { gain: platesJson.dusk.gain, limbHeights: platesJson.dusk.limbHeights as [number, number], tint: platesJson.dusk.tint as [number, number, number], dive: platesJson.dusk.dive as [number, number], rise: platesJson.dusk.rise as [number, number] },
}

const TINTS: [number, number, number][] = [[0.85, 0.3, 0.25], [0.3, 0.75, 0.35], [0.9, 0.75, 0.2], [0.4, 0.5, 0.9]]

function reliefDef(key: 'full' | 'web'): CloudReliefDef {
  const k = key === 'full' ? 1 : 0.5
  const layers = { ...apronJson.layers, ...reliefJson.layers } as Record<string, { box: number[]; distSize: Record<string, number[]>; alpha: boolean; under?: boolean }>
  const box = (b: number[]): [number, number, number, number] => [b[0]! * k, b[1]! * k, b[2]! * k, b[3]! * k]
  return {
    imageSize: reliefJson.imageSize[key] as [number, number],
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
    airSun: { file: platesJson.air.sun.file, limbFile: platesJson.air.sun.limbFile, atDeg: platesJson.air.sun.atDeg as [number, number], boxDeg: platesJson.air.sun.boxDeg as [number, number, number] },
  }
}

export const relief: Record<'full' | 'web', CloudReliefDef> = { full: reliefDef('full'), web: reliefDef('web') }
