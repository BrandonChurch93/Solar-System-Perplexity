import * as THREE from 'three'

const tri = new THREE.BufferGeometry()
tri.setAttribute('position', new THREE.BufferAttribute(new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0]), 3))
const cam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)

export const FULLSCREEN_VERT = /* glsl */ `
out vec2 vUv;
void main() {
  vUv = position.xy * 0.5 + 0.5;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}`

export class Pass {
  readonly material: THREE.ShaderMaterial
  private readonly mesh: THREE.Mesh
  private readonly scene = new THREE.Scene()

  constructor(fragment: string, uniforms: Record<string, THREE.IUniform>, options: Partial<THREE.ShaderMaterialParameters> = {}) {
    this.material = new THREE.ShaderMaterial({
      glslVersion: THREE.GLSL3,
      vertexShader: FULLSCREEN_VERT,
      fragmentShader: fragment,
      uniforms,
      depthTest: false,
      depthWrite: false,
      ...options,
    })
    this.mesh = new THREE.Mesh(tri, this.material)
    this.mesh.frustumCulled = false
    this.scene.add(this.mesh)
  }

  render(renderer: THREE.WebGLRenderer, target: THREE.WebGLRenderTarget | null): void {
    renderer.setRenderTarget(target)
    renderer.render(this.scene, cam)
  }

  dispose(): void {
    this.material.dispose()
  }
}

export function floatTarget(width: number, height: number, type: THREE.TextureDataType, depth = false, stencil = false): THREE.WebGLRenderTarget {
  const t = new THREE.WebGLRenderTarget(width, height, {
    type,
    format: THREE.RGBAFormat,
    depthBuffer: depth,
    stencilBuffer: stencil,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    generateMipmaps: false,
    colorSpace: THREE.LinearSRGBColorSpace,
  })
  t.texture.wrapS = THREE.ClampToEdgeWrapping
  t.texture.wrapT = THREE.ClampToEdgeWrapping
  return t
}
