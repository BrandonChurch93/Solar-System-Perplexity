import { execSync } from 'node:child_process'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DIST, WORK, args, ensureBuild, loadConfig, machineId } from './lib/common'
import { openCapture } from './lib/browser'

const cfg = loadConfig()
ensureBuild()
const rssMb = (): number => {
  const out = execSync("ps -eo rss,args | grep -i 'chrome' | grep -v grep | awk '{s+=$1} END {print s}'", { encoding: 'utf8' })
  return Number(out.trim() || 0) / 1024
}
const a = args()
const own = (kind: string) => cfg.segments.find((s) => s.kind === kind && (!a.stop || s.stop === a.stop))!
const hold = own('hold')
const travel = own('travel')
const holdFrame = hold.firstFrame + Math.floor(hold.frames / 2)
const travelFrame = travel.firstFrame + Math.floor(travel.frames / 2)
const result: Record<string, unknown> = { machine: machineId(), stop: hold.stop, formats: {} }

for (const assets of ['full', 'web']) {
  const t0 = Date.now()
  const s = await openCapture({ dist: DIST, format: cfg.formatKeys.master, assets })
  const startup = (Date.now() - t0) / 1000
  const base = rssMb()
  const time = async (frame: number, tier: string): Promise<number> =>
    s.page.evaluate(async ([f, t]) => {
      const a = performance.now()
      await (window as unknown as { showcase: { renderFrame(f: number, t: string): Promise<void> } }).showcase.renderFrame(f as number, t as string)
      return (performance.now() - a) / 1000
    }, [frame, tier] as const)
  type Mem = { textureBytes: number; skyBytes: number; loaded: string[]; perSet: Record<string, number> }
  const mem = async (): Promise<Mem> => s.page.evaluate(() => (window as unknown as { showcase: { memory(): Mem } }).showcase.memory())
  const loadOne = await time(holdFrame, 'draft')
  const warmOne = await time(holdFrame, 'draft')
  const m1 = await mem()
  const rss1 = rssMb()
  const loadTwo = await time(travelFrame, 'draft')
  const warmTwo = await time(travelFrame, 'draft')
  const m2 = await mem()
  const rss2 = rssMb()
  result[assets] = {
    startupSeconds: startup,
    loadOneSetSeconds: loadOne - warmOne,
    loadSecondSetSeconds: loadTwo - warmTwo,
    oneSet: { textureMb: m1.textureBytes / 1e6, skyMb: m1.skyBytes / 1e6, browserRssMb: rss1, baseRssMb: base, perSetMb: Object.fromEntries(Object.entries(m1.perSet).map(([k, v]) => [k, v / 1e6])) },
    twoSets: { textureMb: m2.textureBytes / 1e6, skyMb: m2.skyBytes / 1e6, browserRssMb: rss2, loaded: m2.loaded },
  }
  if (assets === 'full') {
    for (const f of Object.values(cfg.formats)) {
      await s.page.evaluate((id) => (window as unknown as { showcase: { setFormat(id: string): Promise<void> } }).showcase.setFormat(id), f.id)
      await time(holdFrame, 'draft')
      const one = (await time(holdFrame, 'draft') + (await time(holdFrame, 'draft'))) / 2
      const four = await time(holdFrame, 'review')
      const n = cfg.tiers.review!.samplesPerFrame
      const perSample = (four - one) / (n - 1)
      ;(result.formats as Record<string, unknown>)[f.id] = { draftFrameSeconds: one, reviewHoldFrameSeconds: four, secondsPerSample: perSample, fixedPerFrameSeconds: one - perSample, rssMb: rssMb() }
    }
    if (a.stop) {
      await s.page.evaluate((id) => (window as unknown as { showcase: { setFormat(id: string): Promise<void> } }).showcase.setFormat(id), cfg.formatKeys.master)
      const kinds: Record<string, unknown> = {}
      for (const kind of ['hold', 'dive', 'terrain', 'rise']) {
        const seg = own(kind)
        if (!seg) continue
        const frame = seg.firstFrame + Math.floor(seg.frames / 4)
        await time(frame, 'draft')
        kinds[kind] = { frame, draftSeconds: await time(frame, 'draft'), reviewSeconds: await time(frame, 'review'), finalSeconds: await time(frame, 'final') }
      }
      result.kinds = kinds
    }
  }
  await s.close()
}
mkdirSync(join(WORK, 'budget'), { recursive: true })
writeFileSync(join(WORK, 'budget', 'budget.json'), JSON.stringify(result, null, 1))
console.log(JSON.stringify(result, null, 1))
