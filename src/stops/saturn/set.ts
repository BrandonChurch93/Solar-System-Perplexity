import * as THREE from 'three'
import { sampleOrder } from '../../core/sampler'
import type { SetFactory } from '../../core/types'
import { isRaw } from '../../diagnostics/diag'
import { smooth } from '../../director/rig'
import { nameSkyLook } from '../../space/sky'
import fit from './fit.json'
import { createKept } from './kept/set'
import { createModel, thinOnly } from './model'
import { plan } from './plan'
import skimJson from './skim.json'
import { Veil } from './veil'

// One set of two scenes; a take draws one of them (and, of the model, the thin sheet inside the inner rim in
// every take, below). The approach and the hold are the set of the kept build, so the hold is the kept picture.
// The skim, the rise and the way out are the ring model (model.ts). In the dive the picture goes from the one
// to the other by the height of the lens over the ring plane and by nothing else: between the two heights of
// skim.json handover.kept.heights every take of a frame draws one of the two scenes from the same lens, and the
// share of the model's takes rises from 0 at the upper to 1 at the lower. The kept set is not drawn after the dive.
//
// The air of the stop (veil.ts: the glow of the dust over the ring plane under the stars) belongs to neither
// scene: it is drawn under whichever of the two is drawn, from the same lens, and how much of it shows follows
// the height of the lens over the ring plane alone (plan.lowAt), so it does not know which scene is on.
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

export const createSet: SetFactory = async (ctx) => {
  const kept = await createKept(ctx)
  const model = await createModel(ctx)
  const world = new THREE.Group()
  const veil = new Veil(skimJson.sky.glow, fit.globe.scale[1]!)
  world.add(kept.world, model.world, veil.mesh)
  const tilt = new THREE.Quaternion().fromArray(fit.globe.quaternion)
  const toTerrain = plan.terrainFrame.clone().invert()
  const terrainOffset = plan.spot.clone().negate().applyQuaternion(toTerrain)
  const polar = fit.globe.scale[1]!
  const centre = new THREE.Vector3()
  const total = new THREE.Quaternion()
  const toRing = new THREE.Quaternion()
  const lensTurn = new THREE.Quaternion()
  const eye = new THREE.Vector3()
  const sun = new THREE.Vector3()
  const window = skimJson.handover.kept
  const dive = plan.seg.dive!
  const logLo = Math.log(window.heights[0]!)
  const logHi = Math.log(window.heights[1]!)

  return {
    id: plan.id,
    world,
    sky: model.sky,
    update: (state, shot, view) => {
      // the height of the lens over the ring plane, from the pose the engine gave the set for this take (not from
      // a clock of the stop): the same number the model and the air read below
      const inOrbit = state.view === 'orbit'
      if (inOrbit) centre.set(0, 0, 0)
      else centre.copy(terrainOffset)
      centre.applyQuaternion(world.quaternion).add(world.position)
      total.copy(world.quaternion)
      if (!inOrbit) total.multiply(toTerrain)
      toRing.copy(total).multiply(tilt).invert()
      const height = Math.max(eye.copy(centre).negate().applyQuaternion(toRing).y, 1e-6)
      const share = state.time < dive.start ? 0 : state.time >= dive.end ? 1 : 1 - smooth((Math.log(height) - logLo) / (logHi - logLo))
      const count = Math.max(view.samples, 1)
      const stride = window.strides.find((s) => gcd(s, count) === 1) ?? 1
      const order = view.weights ? sampleOrder(view.weights, view.sample, stride) : ((view.sample * stride) % count + 0.5) / count
      const alone: string = state.time >= plan.seg.hold.end ? window.alone : ''
      const drawn = (alone === 'model' || (alone !== 'kept' && order < share)) ? model : kept
      const idle = drawn === model ? kept : model
      drawn.world.position.copy(world.position)
      drawn.world.quaternion.copy(world.quaternion)
      // The thin sheet of dust and ice inside the inner rim is one body at every height of the lens (skim.json
      // inner): in a take of the kept build's set the model draws it from the same lens, and nothing else of
      // itself (model.ts thinOnly), so that sheet is in every take of the stop by one law of cover
      thinOnly.value = drawn === kept
      if (thinOnly.value) {
        idle.world.position.copy(world.position)
        idle.world.quaternion.copy(world.quaternion)
      }
      world.position.set(0, 0, 0)
      world.quaternion.identity()
      if (thinOnly.value) idle.update(state, shot, view)
      else idle.world.visible = false
      drawn.update(state, shot, view)
      // the lens and the Sun in the frame of the rings, as the scene that was just drawn stands
      if (inOrbit) centre.set(0, 0, 0)
      else centre.copy(terrainOffset)
      centre.applyQuaternion(drawn.world.quaternion).add(drawn.world.position)
      total.copy(drawn.world.quaternion)
      if (!inOrbit) total.multiply(toTerrain)
      toRing.copy(total).multiply(tilt).invert()
      eye.copy(centre).negate().applyQuaternion(toRing)
      const low = plan.lowAt(eye.y)
      if (low > 0 && !isRaw(view.diag)) nameSkyLook(plan.id, { ...skimJson.sky.look, stars: plan.starsAt(low) }, low)
      const ending = state.segment.stop !== plan.id && state.segment.kind !== 'travel'
      const lit = ending ? (state.segment.kind === 'retreat' ? smooth(state.u * 1.5) : 1) : 0
      sun.copy(plan.lightDir).applyQuaternion(total).lerp(shot.sun.dir, lit).normalize().applyQuaternion(toRing)
      eye.y /= polar
      sun.y /= polar
      veil.set(lensTurn.copy(toRing).multiply(view.camera.quaternion), eye, sun.normalize(), isRaw(view.diag) || !drawn.world.visible ? 0 : low * state.weight / shot.post.exposure)
    },
    dispose: () => {
      kept.dispose()
      model.dispose()
      veil.dispose()
    },
  }
}
