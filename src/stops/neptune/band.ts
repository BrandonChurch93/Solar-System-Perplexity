import * as THREE from 'three'
import fit from './close.json'
import frame from './closeup.json'
import move from './move.json'

// The ground frame of the surface view (the frame of the fitted camera of the approved close image, close.json): up is the point under
// that camera, axis the pole of the band the first streamer lies on (closeup.json, band: two pixels of the approved image on that
// line), e0 the point of the band's equator nearest to up, e1 along the band. The scene from code is laid out in these (deep.ts).
function unproject(px: number, py: number, radius: number, centre: THREE.Vector3): THREE.Vector3 {
  const ty = Math.tan(THREE.MathUtils.degToRad(fit.vfovDeg) / 2)
  const d = new THREE.Vector3(((px / frame.image[0]!) * 2 - 1) * ty * (frame.image[0]! / frame.image[1]!), (1 - (py / frame.image[1]!) * 2) * ty, -1).normalize()
  const b = d.dot(centre)
  const t = b - Math.sqrt(Math.max(b * b - (centre.lengthSq() - radius * radius), 0))
  return d.multiplyScalar(t).sub(centre)
}

const up = new THREE.Vector3().fromArray(fit.nadir).negate()
const centre = new THREE.Vector3().fromArray(fit.nadir).multiplyScalar(fit.radius + 1)
const axis = new THREE.Vector3().crossVectors(unproject(frame.band[0]!, frame.band[1]!, fit.radius, centre), unproject(frame.band[2]!, frame.band[3]!, fit.radius, centre)).normalize()
const e0 = up.clone().addScaledVector(axis, -up.dot(axis)).normalize()
const e1 = new THREE.Vector3().crossVectors(axis, e0)

export const ground = { up, centre, axis, e0, e1 }

// Where the place stands on the globe (move.json, place): the turn, in the scene's own frame, from where the fit of the close image put
// the scene (place.json) to where it stands. The whole scene and the camera of the surface view turn with it as one body.
export const placeTurn = new THREE.Quaternion().setFromAxisAngle(e1, move.place.across / fit.radius)
