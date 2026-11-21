import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { aimAt, type SkyAimArgs } from './skyaim'

const FILE = 'src/space/skyframe.json'
const given = process.argv.slice(2)
const keep = given.includes('--keep') && existsSync(FILE)
const stored: Record<string, string> = keep ? Object.fromEntries(Object.entries((JSON.parse(readFileSync(FILE, 'utf8')) as { args: Record<string, unknown> }).args).map(([k, v]) => [k, String(v)])) : {}
const raw: Record<string, string> = { ...stored, ...Object.fromEntries(given.filter((s) => s !== '--keep').map((s) => s.replace(/^--/, '').split('='))) }
const defaults = {
  stop: 'mars',
  along: 158,
  tilt: -8,
  lift: 2,
  tstop: 'mars',
  talong: 60,
  ttilt: 0,
  tlift: 33,
  r: 0.95,
  g: 1.38,
  b: 1.6,
  gamma: 1.7,
  fr: 0.004,
  fg: 0.008,
  fb: 0.011,
  repeats: 2,
  boffset: 0,
  blat: 33.75,
  bfade: 0.34,
  bgain: 1,
  bgamma: 1.3,
  bregion: 0.1,
  boff: 0.6,
  br: 1,
  bg: 1,
  bb: 1,
  bsat: 1,
  bcrowd: 0.016,
  blod: 2,
  btgain: 1,
  bclean: 0,
  bkeep: 1,
  bblur: 1,
  bwiden: 1,
  bfadeend: 0.49,
  bcpow: 0.75,
  bcmin: 0.12,
  sbright: 0.012,
  sslope: 1,
  scount: 1,
  swidth: 0.2,
  shalo: 0.35,
  sfloor: 0.3,
  smicro: 0,
  smwidth: 0.1,
  smbright: 0.003,
  svivid: 0.2,
  scolor: 1,
  score: 0.55,
  stgain: 1,
  stcrowd: 0.25,
  stcore: 1,
  stcap: 14,
}
type Args = typeof defaults & SkyAimArgs
for (const k of Object.keys(raw)) if (!(k in defaults)) throw new Error('unknown argument ' + k)
const a = Object.fromEntries(
  Object.entries(defaults).map(([k, d]) => [k, k in raw ? (typeof d === 'number' ? Number(raw[k]) : raw[k]) : d]),
) as unknown as Args
if (a.stop !== a.tstop) throw new Error('stop and tstop name the one stop the sky is fitted to')
const list = (q: { toArray(): number[] }): number[] => q.toArray().map((x) => Number(x.toFixed(7)))
const patches = { [a.stop]: { orbit: list(aimAt(a.along, a.tilt, a.lift)), terrain: list(aimAt(a.talong, a.ttilt, a.tlift)) } }
const json = {
  args: a,
  patches,
  grade: { tint: [a.r, a.g, a.b], gamma: a.gamma, floor: [a.fr, a.fg, a.fb] },
  band: {
    repeats: a.repeats,
    offsetDeg: a.boffset,
    latSpanDeg: a.blat,
    fadeStart: a.bfade,
    gain: a.bgain,
    gamma: a.bgamma,
    regionRef: a.bregion,
    offGain: a.boff,
    tint: [a.br, a.bg, a.bb],
    saturation: a.bsat,
    crowdRef: a.bcrowd,
    crowdLod: a.blod,
    terrainGain: a.btgain,
    cleanRadius: a.bclean,
    cleanKeep: a.bkeep,
    cleanBlur: a.bblur,
    widen: a.bwiden,
    fadeEnd: a.bfadeend,
    crowdPow: a.bcpow,
    crowdMin: a.bcmin,
  },
  stars: {
    brightness: a.sbright,
    slope: a.sslope,
    countScale: a.scount,
    bandWidth: a.swidth,
    halo: a.shalo,
    floor: a.sfloor,
    micro: a.smicro,
    microWidth: a.smwidth,
    microBright: a.smbright,
    vivid: a.svivid,
    color: a.scolor,
    core: a.score,
    terrainGain: a.stgain,
    terrainCrowd: a.stcrowd,
    terrainCore: a.stcore,
    terrainCap: a.stcap,
  },
}
writeFileSync(FILE, JSON.stringify(json, null, 1) + '\n')
console.log('sky arguments written; the sky frame, the terrain turns and every patch aim follow from them and the plans when the film starts')
