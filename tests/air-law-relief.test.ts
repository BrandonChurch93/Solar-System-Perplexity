import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import type { SetContext } from '../src/core/types'
import { AIR_LAW_GLSL, AIR_LAW_SCALE_HEIGHT, airLaw, airLawDepth, airLawDepth32, airLawDepthOut, airLawDepthOut32, airLawFactor, airLawFactorSeen, airLawSingle, type AirVec } from '../src/terrain/air'
import { AIR_LAW_FRAG, AIR_LAW_LAYER, AIR_LAW_VERT, Relief, airLawCentre, airLawPoint, withAirLaw, withEdge, withEdgeEye, withEyeScale, withPresence, type ReliefAir, type ReliefAirLaw, type ReliefDef, type ReliefMotion } from '../src/terrain/relief'

// The relief under the air law (ReliefMotion.airLaw, src/terrain/relief.ts): the field is off until a set names it, the chunk stands
// once in each shader, the relief's other shares still find their places, and the set's frame gives the law the same two points as a
// globe's frame built on its own does. The law and its twins are tests/air-law.test.ts; the pixels are tests/air-law-gl.test.ts.

const LIT = 'vec4(col * alpha, alpha)'
const AIR_LIT = 'vec4(glow * uGain * vig, cut)'

const picture = (): THREE.Texture => {
  const t = new THREE.Texture()
  t.image = { width: 8, height: 8 }
  return t
}

const ctx = {
  texture: async () => picture(),
  buffer: async () => new Float32Array(4).fill(5).buffer,
} as unknown as SetContext

const def: ReliefDef = {
  imageSize: [32, 16],
  vfovDeg: 40,
  layers: [
    { color: 'far-color.jpg', dist: 'far.bin', box: [0, 0, 32, 16], distSize: [2, 2], tint: [1, 1, 1] },
    { color: 'near-color.jpg', alpha: 'near-alpha.png', dist: 'near.bin', box: [8, 4, 16, 8], distSize: [2, 2], tint: [1, 1, 1] },
  ],
  masks: 'masks.png',
  maskBox: [0, 0, 32, 16],
  mistDir: [1, 0],
}

const air: ReliefAir = { pitchDeg: 0, dipDeg: 0, cool: [0.1, 0.2, 0.3], coolScaleDeg: 10, warm: [0.3, 0.2, 0.1], warmScaleDeg: 5, side: [1, 1], warmSide: [1, 1, 0, 1], starScaleDeg: 10, starCut: 0.5, veil: 0.2 }
const law: ReliefAirLaw = { light: [0.5, 0.3, 0.2], density: 30, scaleHeight: 0.0045, radius: 972.27, eyeHeight: 1 }
const PITCH = 21.028
const motion = (withAir: boolean, withLaw: boolean): ReliefMotion => ({ mistSpeed: 0, dustSpeed: 0, dustDir: [1, 0], mesh: 4, pitchDeg: PITCH, ...(withAir ? { air } : {}), ...(withLaw ? { airLaw: law } : {}) })

const materials = (r: Relief): THREE.ShaderMaterial[] => {
  const out: THREE.ShaderMaterial[] = []
  r.group.traverse((o) => {
    const m = (o as THREE.Mesh).material as THREE.ShaderMaterial | undefined
    if (m) out.push(m)
  })
  return out
}

const count = (text: string, part: string): number => text.split(part).length - 1
const isAir = (m: THREE.ShaderMaterial): boolean => !m.fragmentShader.includes(LIT)

describe('the air law in a relief: the field', () => {
  it('is off until a set names it: no word of the law in any shader, no uniform of it', async () => {
    for (const withAir of [false, true]) {
      const all = materials(await Relief.load(ctx, '', def, motion(withAir, false)))
      expect(all.length).toBe(withAir ? 3 : 2)
      for (const m of all) {
        for (const text of [m.fragmentShader, m.vertexShader]) expect(/airLaw|uAir[A-Z]|vAirEye/.test(text)).toBe(false)
        expect(Object.keys(m.uniforms).some((k) => k.startsWith('uAir'))).toBe(false)
      }
    }
  })

  it('named, every layer is its own shader with the chunk once and the one line of the law, and the air is the law dome, with or without the old air', async () => {
    for (const withAir of [false, true]) {
      const plain = materials(await Relief.load(ctx, '', def, motion(withAir, false))).filter((m) => !isAir(m))
      const all = materials(await Relief.load(ctx, '', def, motion(withAir, true)))
      // The dome is there with the law alone: the sky is a point behind air like the ground.
      expect(all.length).toBe(3)
      const layers = all.filter((m) => !isAir(m))
      const domes = all.filter(isAir)
      expect(layers.length).toBe(2)
      expect(domes.length).toBe(1)
      layers.forEach((m, i) => {
        expect(m.fragmentShader).toBe(withAirLaw(plain[i]!.fragmentShader))
        expect(m.vertexShader).toBe(plain[i]!.vertexShader)
        expect(count(m.fragmentShader, AIR_LAW_GLSL)).toBe(1)
        expect(count(m.fragmentShader, AIR_LAW_LAYER)).toBe(1)
        expect(m.fragmentShader.length).toBe(plain[i]!.fragmentShader.length + AIR_LAW_GLSL.length + AIR_LAW_LAYER.length + '\nuniform vec4 uAirCentre;\nuniform vec3 uAirLight;\nuniform vec3 uAirNumbers;'.length)
      })
      const dome = domes[0]!
      expect(dome.fragmentShader).toBe(AIR_LAW_FRAG)
      expect(dome.vertexShader).toBe(AIR_LAW_VERT)
      expect(count(dome.fragmentShader, AIR_LAW_GLSL)).toBe(1)
      expect(dome.fragmentShader.includes(AIR_LIT)).toBe(true)
      // The old air's terms by the angle and by the clock are not in the law dome.
      for (const word of ['uDrift', 'uCool', 'uWarm', 'uVeil', 'uScale', 'vnoise', 'uDip']) expect(dome.fragmentShader.includes(word)).toBe(false)
      expect(dome.uniforms.uDrift).toBeUndefined()
      expect((dome.blending as number)).toBe(THREE.CustomBlending)
      expect(dome.blendSrc).toBe(THREE.OneFactor)
      expect(dome.blendDst).toBe(THREE.OneMinusSrcAlphaFactor)
    }
  })

  it('all shaders of one relief read the same three uniforms: the centre and one over the radius, the light, the three numbers', async () => {
    const least = 0.25
    const r = await Relief.load(ctx, '', def, { ...motion(true, true), airLaw: { ...law, least } })
    const all = materials(r)
    const first = all[0]!.uniforms
    for (const m of all) {
      expect(m.uniforms.uAirCentre).toBe(first.uAirCentre)
      expect(m.uniforms.uAirLight).toBe(first.uAirLight)
      expect(m.uniforms.uAirNumbers).toBe(first.uAirNumbers)
    }
    const c = first.uAirCentre!.value as THREE.Vector4
    const far = law.radius + law.eyeHeight
    expect(c.x).toBe(0)
    expect(c.y).toBeCloseTo(-far * Math.cos((PITCH * Math.PI) / 180), 9)
    expect(c.z).toBeCloseTo(-far * Math.sin((PITCH * Math.PI) / 180), 9)
    expect(c.w).toBe(1 / law.radius)
    expect((first.uAirLight!.value as THREE.Vector3).toArray()).toEqual(law.light)
    expect((first.uAirNumbers!.value as THREE.Vector3).toArray()).toEqual([law.density, law.scaleHeight, least])
    // Without a least the third number is 0: the design as written.
    const none = materials(await Relief.load(ctx, '', def, motion(false, true)))[0]!.uniforms
    expect((none.uAirNumbers!.value as THREE.Vector3).z).toBe(0)
  })

  it('the eye enters as a place and nowhere else: the law line reads the eye, the point and the picture own eye, and no height', () => {
    expect(AIR_LAW_LAYER.includes('airLawDepth((vEye - uAirCentre.xyz) * uAirCentre.w, airPoint, uAirNumbers.y)')).toBe(true)
    expect(AIR_LAW_LAYER.includes('airLawDepth(-uAirCentre.xyz * uAirCentre.w, airPoint, uAirNumbers.y)')).toBe(true)
    expect(AIR_LAW_LAYER.includes('vec3 airPoint = (vLocal - uAirCentre.xyz) * uAirCentre.w;')).toBe(true)
    expect(AIR_LAW_LAYER.includes('uAirLight * uGain * vig')).toBe(true)
    for (const text of [AIR_LAW_LAYER, AIR_LAW_FRAG.replace(AIR_LAW_GLSL, '')]) for (const word of ['uUpL', 'uUp', 'uTime', 'smoothstep', 'clamp', 'mix(uAir']) expect(text.includes(word)).toBe(false)
    expect(AIR_LAW_FRAG.includes('airLawFactor(airLawDepthOut((vAirEye - uAirCentre.xyz) * uAirCentre.w, d, uAirNumbers.y), uAirNumbers.x)')).toBe(true)
  })

  it('refuses numbers the law was not measured for, by name', async () => {
    const bad = async (patch: Partial<ReliefAirLaw>): Promise<string> => {
      try {
        await Relief.load(ctx, '', def, { ...motion(false, true), airLaw: { ...law, ...patch } })
      } catch (e) {
        return (e as Error).message
      }
      return ''
    }
    expect(await bad({ scaleHeight: AIR_LAW_SCALE_HEIGHT[1] * 1.01 })).toContain('scale height')
    expect(await bad({ scaleHeight: AIR_LAW_SCALE_HEIGHT[0] * 0.99 })).toContain('scale height')
    expect(await bad({ density: -1 })).toContain('density')
    expect(await bad({ density: Number.NaN })).toContain('density')
    expect(await bad({ radius: 0 })).toContain('radius')
    expect(await bad({ eyeHeight: Number.POSITIVE_INFINITY })).toContain('eye height')
    expect(await bad({ light: [0.1, -0.2, 0.3] })).toContain('light')
    expect(await bad({ least: 1.5 })).toContain('least')
    expect(await bad({})).toBe('')
    expect(await bad({ scaleHeight: AIR_LAW_SCALE_HEIGHT[0] })).toBe('')
    expect(await bad({ scaleHeight: AIR_LAW_SCALE_HEIGHT[1] })).toBe('')
    // The picture's eye may stand under the datum (a place in a basin).
    expect(await bad({ eyeHeight: -2 })).toBe('')
  })

  it('a shader with no single place for the law is refused, and so is one that has it already', () => {
    expect(() => withAirLaw('void main() {\n}')).toThrow('no single place')
    expect(() => withAirLaw(AIR_LAW_FRAG)).toThrow('no single place')
  })
})

describe('the air law in a relief: with the other shares', () => {
  it('the presence, the air apart, the edge and a law of a stop find their places in the shaders with the law', async () => {
    const plain = materials(await Relief.load(ctx, '', def, motion(true, true)))
    const r = await Relief.load(ctx, '', def, motion(true, true))
    const all = materials(r)
    r.presence(0.4, { air: 0 })
    all.forEach((m, i) => {
      const lit = isAir(plain[i]!) ? AIR_LIT : LIT
      expect(m.fragmentShader).toBe(withPresence(plain[i]!.fragmentShader, lit))
      expect(count(m.fragmentShader, AIR_LAW_GLSL)).toBe(1)
    })
    // The air apart: the dome has a share of its own, which is how a set gives its air away where the globe draws the shell.
    const dome = all.find(isAir)!
    const layer = all.find((m) => !isAir(m))!
    expect(dome.uniforms.uPresence!.value).toBe(0)
    expect(layer.uniforms.uPresence!.value).toBe(0.4)
    r.presenceEdge([0, 4, 0, 0])
    for (const m of all) {
      expect(m.fragmentShader.includes('edgeShare(')).toBe(true)
      expect(count(m.fragmentShader, AIR_LAW_GLSL)).toBe(1)
    }
    expect(dome.vertexShader).toBe(withEdgeEye(AIR_LAW_VERT))
    expect(dome.fragmentShader).toBe(withEdge(withPresence(AIR_LAW_FRAG, AIR_LIT), AIR_LIT))
    r.presenceLaw('float lawShare(vec3 p, vec3 eye, vec2 im) { return 1.0; }')
    for (const m of all.filter((x) => !isAir(x))) {
      expect(m.fragmentShader.includes('lawShare(vLocal, vEye, vImage)')).toBe(true)
      expect(count(m.fragmentShader, AIR_LAW_GLSL)).toBe(1)
      expect(count(m.fragmentShader, AIR_LAW_LAYER)).toBe(1)
    }
  })

  it('a scaled group gives the eye of the layers and of the law dome the same scale, with one number for both', async () => {
    const r = await Relief.load(ctx, '', def, motion(false, true))
    const all = materials(r)
    const dome = all.find(isAir)!
    const layers = all.filter((m) => !isAir(m))
    const cam = new THREE.PerspectiveCamera(40, 2, 0.1, 100)
    const view = { format: { width: 32, height: 16 }, camera: cam } as unknown as Parameters<Relief['update']>[3]
    r.group.scale.setScalar(0.001)
    r.update(0, 1, 0, view)
    for (const m of layers) {
      expect(m.vertexShader.includes('uEyeScale')).toBe(true)
      expect(m.uniforms.uEyeScale).toBe(dome.uniforms.uAirEyeScale)
    }
    expect(dome.vertexShader).toBe(AIR_LAW_VERT)
    expect((dome.uniforms.uAirEyeScale!.value as number)).toBeCloseTo(1e6, 3)
    expect(layers[0]!.vertexShader).toBe(withEyeScale(materials(await Relief.load(ctx, '', def, motion(false, true))).find((m) => !isAir(m))!.vertexShader))
    // The dome has no drift under the law: an update with the old air's drift named beside the law does not reach for it.
    const both = await Relief.load(ctx, '', def, { ...motion(true, true), air: { ...air, drift: [0.5, 1, 1, 1] } as ReliefAir })
    expect(() => both.update(1, 1, 0, view)).not.toThrow()
  })
})

// The frame. A globe's shader has the eye and the fragment from the planet's centre in radii, in the world's axes. The set's shader has
// them in the relief's frame, whose origin is the picture's eye. Built here on its own: a planet anywhere in the world, the set stood on
// it at a place with a heading, scaled to the world, and the two frames asked for the same two points.
describe('the air law in a relief: the frame against a globe', () => {
  const sub = (a: AirVec, b: AirVec): [number, number, number] => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
  const len = (a: AirVec): number => Math.hypot(a[0], a[1], a[2])
  const arr = (v: THREE.Vector3): [number, number, number] => [v.x, v.y, v.z]

  // Mars's set as it stands (src/stops/mars/relief.json, camera.groundModel and camera.pitchDeg): a sphere of 972.27 under an eye at 1.
  const mars: ReliefAirLaw = { light: [0.62, 0.43, 0.3], density: 60, scaleHeight: 0.0045, radius: 972.27, eyeHeight: 1 }
  const pitch = 21.028

  const world = (centre: THREE.Vector3, radiusWorld: number, place: THREE.Vector3, headingDeg: number): THREE.Group => {
    const g = new THREE.Group()
    const n = place.clone().normalize()
    const up = new THREE.Vector3(0, Math.cos((pitch * Math.PI) / 180), Math.sin((pitch * Math.PI) / 180))
    const stand = new THREE.Quaternion().setFromUnitVectors(up, n)
    const spin = new THREE.Quaternion().setFromAxisAngle(n, (headingDeg * Math.PI) / 180)
    g.quaternion.copy(spin.multiply(stand))
    g.scale.setScalar(radiusWorld / mars.radius)
    g.position.copy(centre).addScaledVector(n, radiusWorld * (1 + mars.eyeHeight / mars.radius))
    g.updateMatrixWorld(true)
    return g
  }

  it('the picture own eye stands one eye height over the datum, straight over the centre, and the ground under it at the datum', () => {
    const eye = airLawPoint([0, 0, 0], mars, pitch)
    expect(len(eye)).toBeCloseTo(1 + mars.eyeHeight / mars.radius, 12)
    const c = airLawCentre(mars, pitch)
    const up: AirVec = [0, Math.cos((pitch * Math.PI) / 180), Math.sin((pitch * Math.PI) / 180)]
    const foot = airLawPoint([-up[0] * mars.eyeHeight, -up[1] * mars.eyeHeight, -up[2] * mars.eyeHeight], mars, pitch)
    expect(len(foot)).toBeCloseTo(1, 12)
    expect(len(sub(eye, foot))).toBeCloseTo(mars.eyeHeight / mars.radius, 12)
    expect(c[3]).toBe(1 / mars.radius)
    // The shader's own line.
    const p: AirVec = [3.5, -0.4, -20]
    expect(airLawPoint(p, mars, pitch)).toEqual([(p[0] - c[0]) * c[3], (p[1] - c[1]) * c[3], (p[2] - c[2]) * c[3]])
  })

  it('at the heights of the dive the set and the globe have the same path: depth, factor and colour, in doubles and in 32 bit', () => {
    const centre = new THREE.Vector3(31.5, -12.25, 407.75)
    const radiusWorld = 2.5
    const g = world(centre, radiusWorld, new THREE.Vector3(0.31, 0.52, -0.8), 137)
    const back = new THREE.Matrix4().copy(g.matrixWorld).invert()
    const texel: AirVec = [0.21, 0.12, 0.07]
    let worst = 0
    let worst32 = 0
    let paths = 0
    // The eye from the picture's own place up to a twentieth of a radius over it, off to a side and behind; the points on the set's
    // ground from the near foreground to the horizon, and one under the datum.
    const heights = [0, 0.4, 2, 9.7227, 19.4454, 48.6135]
    const points: AirVec[] = [[0.5, -0.9, -2], [-6, -1.4, -12], [14, -2.5, -40], [-30, -5, -160], [80, -30, -900], [3, -40, -44], [0, -3.2, -3]]
    for (const h of heights) {
      for (const side of [0, -3.5, 12]) {
        const eyeLocal = new THREE.Vector3(side, h * Math.cos((pitch * Math.PI) / 180), h * Math.sin((pitch * Math.PI) / 180) + side * 0.25)
        const eyeWorld = eyeLocal.clone().applyMatrix4(g.matrixWorld)
        for (const p of points) {
          const pointWorld = new THREE.Vector3(...p).applyMatrix4(g.matrixWorld)
          // The globe: from its centre, in its radius, in the world's axes.
          const a = arr(eyeWorld.clone().sub(centre).divideScalar(radiusWorld))
          const b = arr(pointWorld.clone().sub(centre).divideScalar(radiusWorld))
          // The set: what its shader is given, the eye through the inverse of the group as its vertex shader finds it.
          const as = airLawPoint(arr(eyeWorld.clone().applyMatrix4(back)), mars, pitch)
          const bs = airLawPoint(p, mars, pitch)
          expect(Math.abs(len(as) - len(a))).toBeLessThan(1e-9)
          expect(Math.abs(len(bs) - len(b))).toBeLessThan(1e-9)
          const globe = airLawDepth(a, b, mars.scaleHeight)
          const set = airLawDepth(as, bs, mars.scaleHeight)
          expect(Number.isFinite(globe) && globe >= 0).toBe(true)
          worst = Math.max(worst, Math.abs(set - globe) / Math.max(globe, 1e-9))
          const single = Math.abs(airLawDepth32(as, bs, mars.scaleHeight) - airLawDepth32(a, b, mars.scaleHeight))
          worst32 = Math.max(worst32, single / (2 * airLawSingle(mars.scaleHeight, globe)))
          const fg = airLawFactor(globe, mars.density)
          const fs = airLawFactor(set, mars.density)
          expect(Math.abs(fs - fg)).toBeLessThan(1e-6)
          const cg = airLaw(texel, mars.light, fg)
          const cs = airLaw(texel, mars.light, fs)
          for (let i = 0; i < 3; i++) expect(Math.abs(cs[i]! - cg[i]!)).toBeLessThan(1e-6)
          // The sky over the point: the whole path out of the shell along the same sight line.
          const dir = sub(b, a)
          const dirSet = sub(bs, as)
          const n = len(dir)
          const out = airLawDepthOut(a, [dir[0] / n, dir[1] / n, dir[2] / n], mars.scaleHeight)
          const outSet = airLawDepthOut(as, [dirSet[0] / len(dirSet), dirSet[1] / len(dirSet), dirSet[2] / len(dirSet)], mars.scaleHeight)
          worst = Math.max(worst, Math.abs(outSet - out) / Math.max(out, 1e-9))
          expect(Math.abs(airLawDepthOut32(as, [dirSet[0] / len(dirSet), dirSet[1] / len(dirSet), dirSet[2] / len(dirSet)], mars.scaleHeight) - airLawDepthOut32(a, [dir[0] / n, dir[1] / n, dir[2] / n], mars.scaleHeight))).toBeLessThan(2 * airLawSingle(mars.scaleHeight, out))
          paths++
        }
      }
    }
    console.log('AIR-FRAME paths ' + paths + ' worst share off between the frames ' + worst.toExponential(3) + ', 32 bit against twice the stated bound ' + worst32.toFixed(3))
    expect(paths).toBe(126)
    // Two frames, one path: the difference is the rounding of the turn, nothing of the law.
    expect(worst).toBeLessThan(1e-6)
    expect(worst32).toBeLessThan(1)
  })

  it('from the picture own eye the layers give their texel back for any numbers, and with a least the law of the cleaned body', () => {
    const p: AirVec = [14, -2.5, -400]
    const eye = airLawPoint([0, 0, 0], mars, pitch)
    const point = airLawPoint(p, mars, pitch)
    const seen = airLawDepth(eye, point, mars.scaleHeight)
    for (const density of [0, 3, 60, 4000]) {
      expect(airLawFactorSeen(seen, seen, density, 0)).toBe(1)
      expect(airLaw([0.21, 0.12, 0.07], mars.light, airLawFactorSeen(seen, seen, density, 0))).toEqual([0.21, 0.12, 0.07])
    }
    // A texel painted as body * max(f, least) + light * (1 - max(f, least)) comes out as body * f + light * (1 - f).
    const body: AirVec = [0.3, 0.2, 0.1]
    for (const least of [0.05, 0.5, 1]) {
      const density = 60
      const f = airLawFactor(seen, density)
      const kept = Math.max(f, least)
      const texel = body.map((v, i) => v * kept + mars.light[i]! * (1 - kept)) as [number, number, number]
      const drawn = airLaw(texel, mars.light, airLawFactorSeen(seen, seen, density, least))
      const lawful = airLaw(body, mars.light, f)
      for (let i = 0; i < 3; i++) expect(drawn[i]!).toBeCloseTo(lawful[i]!, 12)
    }
  })
})
