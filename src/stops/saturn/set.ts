import * as THREE from 'three'
import type { SetFactory } from '../../core/types'
import { smooth } from '../../director/rig'
import { createKept } from './kept/set'
import { createModel } from './model'
import { plan } from './plan'
import skimJson from './skim.json'

// One set of two scenes that are never drawn together. The approach and the hold are the set of the kept build,
// so the hold is the kept picture. The skim, the rise and the way out are the ring model (model.ts). In a
// window of the dive every take of a frame draws one of the two whole scenes from the same lens, and the share
// of the model's takes rises from 0 to 1 (skim.json, handover.kept).
const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

export const createSet: SetFactory = async (ctx) => {
  const kept = await createKept(ctx)
  const model = await createModel(ctx)
  const world = new THREE.Group()
  world.add(kept.world, model.world)
  const window = skimJson.handover.kept
  const dive = plan.seg.dive!
  const from = dive.start + window.from * (dive.end - dive.start)
  const to = dive.start + window.to * (dive.end - dive.start)

  return {
    id: plan.id,
    world,
    sky: model.sky,
    update: (state, shot, view) => {
      const share = smooth((state.time - from) / (to - from))
      const count = Math.max(view.samples, 1)
      const stride = window.strides.find((s) => gcd(s, count) === 1) ?? 1
      const order = ((view.sample * stride) % count + 0.5) / count
      const alone: string = state.time >= plan.seg.hold.end ? window.alone : ''
      const drawn = (alone === 'model' || (alone !== 'kept' && order < share)) ? model : kept
      const idle = drawn === model ? kept : model
      drawn.world.position.copy(world.position)
      drawn.world.quaternion.copy(world.quaternion)
      world.position.set(0, 0, 0)
      world.quaternion.identity()
      idle.world.visible = false
      drawn.update(state, shot, view)
    },
    dispose: () => {
      kept.dispose()
      model.dispose()
    },
  }
}
