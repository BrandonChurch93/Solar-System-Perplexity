import json
import os
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SRC = ROOT / 'src/stops/mercury'
KEEP = ROOT / 'out/work/mercury/place/orig'
STATE = KEEP / 'state.json'
SPEC = json.loads((Path(__file__).parent / 'tiles.json').read_text())
FILES = ['plan.ts', 'set.ts']


def rep(s, a, b):
    assert a in s, a[:80]
    return s.replace(a, b, 1)


def noglare(f):
    f['set.ts'] = rep(f['set.ts'], "glare.update(on ? glow(state.time, first ? 0 : 1) : 0, lowSunAt(", "glare.update(on && first ? 0 : 0, lowSunAt(")


def every(s, a, b):
    assert a in s, a[:80]
    return s.replace(a, b)


def tiles(f, kind, matte=False, sky=False, dim=False):
    noglare(f)
    s = f['set.ts']
    for line in ["ground.update(state.time - terrainMid, gain, shot.post.vignette, view)", "under.update(state.time - terrainMid, gain, shot.post.vignette, view)"]:
        s = every(s, line, line.replace('shot.post.vignette', '0').replace('gain', 'gain * %r' % SPEC['dim'] if dim else 'gain'))
    s = rep(s, "limb.update(low.gain * shot.skyGlow * shot.skyExposure * halo, shot.post.vignette, aspect)", "limb.update(halo > 2 ? low.gain : 0, 0, aspect)")
    s = rep(s, "const shown = on && (kind === 'dive' || kind === 'rise') ? 1 - Math.pow(1 - THREE.MathUtils.clamp(Math.log(plan.low(state.time).position.dot(nearUp) / floor) / Math.log(look.under.top[kind] / floor), 0, 1), look.under.power) : 0", "const shown = on && floor > -1 ? 1 : 1")
    s = rep(s, "shell.mesh.visible = past > 0", "shell.mesh.visible = false")
    s = rep(s, "border.value.z = past", "border.value.z = 0")
    s = rep(s, "if (past > 0) {\n          shellCut.cut.set(", "if (past > 2) {\n          shellCut.cut.set(")
    if sky:
        s = rep(s, "near.visible = shows > 0", "near.visible = shows > 2")
    if matte:
        s = rep(s, ".replace(BORDER_CUT, BORDER_GLSL + BORDER_CUT)", ".replace(BORDER_CUT, BORDER_GLSL + BORDER_CUT).replace('vec3 col = inverseFilmic(texel.rgb) * uGain * vig;', 'vec3 col = vec3(%r) * uGain * vig;')" % SPEC['matte'])
    f['set.ts'] = s
    t = SPEC[kind]
    s = f['plan.ts']
    s = rep(s, "import { mix, ramp, slerpDir } from '../../director/rig'", "import { drift, mix, ramp, slerpDir } from '../../director/rig'")
    s = rep(s, "import { StopPlan, type Fit, type MoveParams } from '../../director/moves'", "import { StopPlan, type Fit, type MoveParams, type OrbitShot } from '../../director/moves'")
    s = rep(s, "  override divePose(time: number, view: ViewKind): Pose {", """  override dive(time: number): OrbitShot {
    if (time * config.fps >= %d) return this.tile(time)
    return super.dive(time)
  }

  tile(time: number): OrbitShot {
    const views: [number, number][] = %s
    const k = Math.min(Math.max(Math.floor(time * config.fps + 1e-6) - %d, 0), views.length - 1)
    const low = this.low(%r / config.fps)
    const [yaw, pitch] = views[k]!
    const q = low.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(pitch), THREE.MathUtils.degToRad(yaw), 0, 'YXZ'))).multiply(drift(time).invert())
    return { pose: { position: low.position, quaternion: q, vfov: %r }, view: 'terrain' }
  }

  override divePose(time: number, view: ViewKind): Pose {""" % (t['firstFrame'], json.dumps(t['views']), t['firstFrame'], t['atFrame'], t['vfovDeg']))
    f['plan.ts'] = s


def topdown(f):
    s = f['plan.ts']
    s = rep(s, "    return { position: position.applyQuaternion(turn), quaternion: turn.multiply(q), vfov: THREE.MathUtils.radToDeg(2 * Math.atan(Math.exp(lens))) }", """    const over = l.place.clone().normalize().multiplyScalar(position.length())
    const down = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().lookAt(over, new THREE.Vector3(), new THREE.Vector3(0, 1, 0)))
    return { position: over.applyQuaternion(turn), quaternion: turn.multiply(down), vfov: THREE.MathUtils.radToDeg(2 * Math.atan(Math.exp(lens))) }""")
    s = rep(s, "handover: { dive: { place:", "handover: { dive: { picture: false, place:")
    f['plan.ts'] = s
    f['set.ts'] = rep(f['set.ts'], "glare.update(diving ? keep(1) * smoother(ramp(-look.glare.span.dive, 0, fromDive)) : rising ? keep(1) * (1 - smoother(ramp(0, look.glare.span.rise, fromRise))) : 0,", "glare.update(0,")


def on(name):
    assert not STATE.exists(), 'already patched: run off first'
    KEEP.mkdir(parents=True, exist_ok=True)
    f = {n: (SRC / n).read_text() for n in FILES}
    for n, s in f.items():
        (KEEP / n).write_text(s)
    if name == 'noglare':
        noglare(f)
    elif name == 'topdown':
        topdown(f)
    else:
        tiles(f, name.split('-')[0], name.endswith('-matte'), name.endswith('-sky'), name.endswith('-dim'))
    for n, s in f.items():
        (SRC / n).write_text(s)
        (KEEP / (n + '.patched')).write_text(s)
    STATE.write_text(json.dumps({'mode': name}))


def off():
    assert STATE.exists(), 'not patched'
    for n in FILES:
        assert (SRC / n).read_text() == (KEEP / (n + '.patched')).read_text(), n + ' changed while patched'
        shutil.copy(KEEP / n, SRC / n)
    os.remove(STATE)


if __name__ == '__main__':
    if sys.argv[1] == 'on':
        on(sys.argv[2])
    else:
        off()
