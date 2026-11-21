import * as THREE from 'three'

export const SHOT_GLSL = /* glsl */ `
vec2 shotUv(mat4 m, vec3 p, float edge, out float inside) {
  vec4 c = m * vec4(p, 1.0);
  vec2 uv = c.xy / max(c.w, 1e-4) * 0.5 + 0.5;
  vec2 e = min(uv, 1.0 - uv);
  inside = c.w > 1e-3 ? smoothstep(0.0, edge, min(e.x, e.y)) : 0.0;
  return uv;
}`

export function shotMatrix(position: THREE.Vector3, quaternion: THREE.Quaternion, vfov: number, aspect: number): THREE.Matrix4 {
  const cam = new THREE.PerspectiveCamera(vfov, aspect, 0.01, 100)
  cam.position.copy(position)
  cam.quaternion.copy(quaternion)
  cam.updateMatrixWorld(true)
  cam.updateProjectionMatrix()
  return new THREE.Matrix4().multiplyMatrices(cam.projectionMatrix, cam.matrixWorldInverse)
}

export interface Shot { map: THREE.Texture; mask: THREE.Texture; matrix: THREE.Matrix4; weight: THREE.IUniform<number> }

export function shotUniforms(tag: string, shot: Shot): Record<string, THREE.IUniform> {
  const size = shot.map.image as unknown as { width: number; height: number }
  return {
    ['u' + tag + 'Map']: { value: shot.map },
    ['u' + tag + 'Mask']: { value: shot.mask },
    ['u' + tag + 'M']: { value: shot.matrix },
    ['u' + tag + 'Size']: { value: new THREE.Vector2(size.width, size.height) },
    ['u' + tag + 'W']: shot.weight,
  }
}
