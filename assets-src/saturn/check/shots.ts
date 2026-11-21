import * as THREE from 'three'
import { plan } from '../../../src/stops/saturn/plan'
import { shotMatrix } from '../../../src/stops/saturn/shot'

const toTilt = new THREE.Quaternion().fromArray(plan.fit.globe.quaternion).invert()
const heroPose = plan.hold(plan.holdMid - plan.seg.hold.start)
const heroL = heroPose.position.clone().applyQuaternion(toTilt)
const heroM = shotMatrix(heroL, toTilt.clone().multiply(heroPose.quaternion), heroPose.vfov, 16 / 9)
const skimL = plan.skimPosition.clone().applyQuaternion(toTilt)
const skimM = shotMatrix(skimL, toTilt.clone().multiply(plan.skimQuaternion), plan.p.terrain.vfov, 16 / 9)
console.log(JSON.stringify({ polar: plan.fit.globe.scale[1], hero: { camera: heroL.toArray(), matrix: heroM.elements }, skim: { camera: skimL.toArray(), matrix: skimM.elements } }))
