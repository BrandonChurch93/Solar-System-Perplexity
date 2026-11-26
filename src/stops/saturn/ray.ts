import * as THREE from 'three'

// The ray of a pixel in a body's own coordinates, by the lens alone.
//
// ray times (x, y, 1), with x and y the pixel's place in the buffer (gl_FragCoord), is the direction from the eye
// through that pixel in the coordinates of the mesh. It is laid at each draw from the camera of that draw, the
// place of the mesh and the viewport, so a shader reads its direction from the pixel and not from the triangle
// that happens to cover the pixel.
//
// Why: a direction interpolated over the mesh is right at the pixel itself, but its change from one pixel to the
// next (dFdx, dFdy) is taken along the plane of the one triangle that covers the pixel. Where the triangles are
// slivers thinner than a pixel, at the poles of a sphere and at its outline where they stand edge on, that change
// came out wrong by any factor, and whatever was built on it, the soft edge of the globe first of all, was wrong
// in that one pixel for that one frame. A direction that is a function of the pixel alone has the same change in
// every triangle, so the tessellation no longer shows.
export function lensRay(mesh: THREE.Mesh, ray: THREE.Matrix3): void {
  const toView = new THREE.Matrix4()
  const port = new THREE.Vector4()
  mesh.onBeforeRender = (renderer, _scene, camera) => {
    renderer.getCurrentViewport(port)
    const m = toView.multiplyMatrices(camera.matrixWorldInverse, mesh.matrixWorld).invert().elements
    const p = camera.projectionMatrix.elements
    // in the camera's coordinates the direction through the pixel is (ax x + ox, ay y + oy, -1)
    const ax = 2 / (port.z * p[0]!)
    const ay = 2 / (port.w * p[5]!)
    const ox = (p[8]! - 1 - 2 * port.x / port.z) / p[0]!
    const oy = (p[9]! - 1 - 2 * port.y / port.w) / p[5]!
    ray.set(
      m[0]! * ax, m[4]! * ay, m[0]! * ox + m[4]! * oy - m[8]!,
      m[1]! * ax, m[5]! * ay, m[1]! * ox + m[5]! * oy - m[9]!,
      m[2]! * ax, m[6]! * ay, m[2]! * ox + m[6]! * oy - m[10]!,
    )
  }
}
