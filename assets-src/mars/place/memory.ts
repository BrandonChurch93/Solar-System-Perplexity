// Memory of the Mars set as the loader counts it (what G15 checks), for both asset sets.
//   npx tsx assets-src/mars/place/memory.ts
import { DIST, ensureBuild, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'

const cfg = loadConfig()
ensureBuild()
for (const set of Object.keys(cfg.assetSets)) {
  const s = await openCapture({ dist: DIST, format: cfg.formatKeys.master, assets: set })
  try {
    await renderPng(s.page, 2325, 'draft')
    const m = await s.page.evaluate(() => (window as unknown as { showcase: { memory(): { perSet: Record<string, number> } } }).showcase.memory())
    console.log(set, ((m.perSet.mars ?? 0) / 1e6).toFixed(1), 'MB of', cfg.assetSets[set]!.maxSetMemoryMb)
  } finally {
    await s.close()
  }
}
