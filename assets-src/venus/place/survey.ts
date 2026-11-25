import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname } from 'node:path'
import * as THREE from 'three'
import { DIST, args, ensureBuild, formatId, loadConfig } from '../../../tools/lib/common'
import { openCapture, renderPng } from '../../../tools/lib/browser'
import plates from '../../../src/stops/venus/plates.json'

// The survey draws for the plates round the frame of T (tlay.py round): the film's eye at the T of a handover, turned on the spot and
// with the field of plates.json (atT.survey), drawn still (no grain) from the close side (close), from the close side in the layers
// view (layers) and from the globe side (globe: with ground.heights of plates.json set to [1e-9, 2e-9] for that draw only, see RECIPE).
// npx tsx assets-src/venus/place/survey.ts --kind dive --what close,layers [--names down,left] [--format uhd]
// With --json FILE the cameras are written in the body fixed frame of the globe, as tcam.ts writes the one of T (run tcam.ts first).
// THE HOOK: the film draws the eye of StopPlan.eyeShot (src/director/moves.ts), and no stop may define that method
// (tests/onemove.test.ts, "cannot be replaced by the class of a stop"). So the turn of a survey is not in src/stops/venus/plan.ts. It is
// kept beside this tool as survey-hook.patch (13 lines of plan.ts: an eyeShot that reads globalThis.__venusSurvey). For survey draws
// only: git apply assets-src/venus/place/survey-hook.patch, run this tool (it builds), git apply -R the same file, npm run -s build.
// Never commit plan.ts with the hook in. Without the hook --json and the draws give the plain eye of T for every name.
const a = args()
const cfg = loadConfig()
const kind = a.kind === 'rise' ? 'rise' : 'dive'
const work = 'out/work/venus/place/'
const cam = JSON.parse(readFileSync(work + 'tcam.json', 'utf8'))[kind] as { frame: number; time: number; x: number[]; y: number[]; z: number[]; position: number[]; vfovDeg: number; height: number }
const list = (plates.atT.survey as { name: string; yaw: number; pitch: number; vfov: number }[]).filter((s) => a.names === undefined || a.names.split(',').includes(s.name))
if (a.json !== undefined) {
  // As tcam.ts: the plan's pose, turned by the survey as plan.eyeShot turns it, times the film's drift, in the body fixed frame of the
  // globe; the field is read from the film's own shot with the survey set.
  const { FilmDirector } = await import('../../../src/director/film')
  const { plans } = await import('../../../src/director/plans')
  const { handoverOf } = await import('../../../src/director/handover')
  const { plan } = await import('../../../src/stops/venus/plan')
  const { drift } = await import('../../../src/director/rig')
  const fit = (await import('../../../src/stops/venus/fit.json')).default
  const film = new FilmDirector(plans)
  const h = handoverOf('venus', kind)
  if (!h) throw new Error('venus has not opted in')
  const p = plan.eye(kind, h.time, 'orbit')
  const back = new THREE.Quaternion().fromArray(fit.globe.quaternion).invert().multiply(plan.turn(h.time).invert())
  const pos = p.position.clone().applyQuaternion(back)
  const out: Record<string, object> = {}
  for (const s of list) {
    ;(globalThis as { __venusSurvey?: object }).__venusSurvey = { yaw: s.yaw, pitch: s.pitch, vfov: s.vfov }
    const shot = film.shotAt(cam.frame, h.time, 'orbit')
    const turn = new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(s.pitch), THREE.MathUtils.degToRad(s.yaw), 0, 'YXZ'))
    const q = back.clone().multiply(p.quaternion.clone().multiply(turn).multiply(drift(h.time)))
    const x = new THREE.Vector3(), y = new THREE.Vector3(), z = new THREE.Vector3()
    new THREE.Matrix4().makeRotationFromQuaternion(q).extractBasis(x, y, z)
    out[s.name] = { frame: cam.frame, time: h.time, position: pos.toArray(), x: x.toArray(), y: y.toArray(), z: z.toArray(), vfovDeg: shot.camera.vfov, height: pos.length() - 1 }
    console.log(kind, s.name, 'field', shot.camera.vfov, 'position against tcam.json', pos.distanceTo(new THREE.Vector3().fromArray(cam.position)).toExponential(2))
  }
  delete (globalThis as { __venusSurvey?: object }).__venusSurvey
  writeFileSync(a.json, JSON.stringify(out, null, 1))
  console.log('written', a.json)
}
const whats = (a.what ?? '').split(',').filter((w) => w !== '')
if (whats.length > 0) ensureBuild()
for (const what of whats) {
  const diag = what === 'close' ? 'nograin/side=terrain/t=' + cam.time : what === 'layers' ? 'layers/side=terrain/t=' + cam.time : what === 'globe' ? 'nograin/side=orbit/t=' + cam.time : null
  if (diag === null) throw new Error('what: close, layers or globe')
  const s = await openCapture({ dist: DIST, format: formatId(cfg, a.format ?? 'uhd'), assets: a.assets ?? 'full', diag })
  for (const view of list) {
    await s.page.evaluate((v) => {
      ;(globalThis as { __venusSurvey?: object }).__venusSurvey = v
    }, { yaw: view.yaw, pitch: view.pitch, vfov: view.vfov })
    const { png, seconds } = await renderPng(s.page, cam.frame, a.tier ?? 'draft')
    const file = work + 't/' + what + '-' + cam.frame + '-' + view.name + '.png'
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, png)
    console.log(file + ' ' + seconds.toFixed(1) + 's')
  }
  await s.close()
}
