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
    f['set.ts'] = rep(f['set.ts'], "glare.update(on ? Math.pow(Math.max((above(plan.low(state.time)) - above(null)) / (above(plan.low(covers[first ? 0 : 1]!)) - above(null)), 0), look.glare.height) : 0,", "glare.update(0,")


def tiles(f, kind):
    noglare(f)
    for line in ["ground.update(state.time - terrainMid, gain, shot.post.vignette, view)", "under.update(state.time - terrainMid, gain, shot.post.vignette, view)", "limb.update(low.gain * shot.skyGlow * shot.skyExposure, shot.post.vignette, aspect)", "rim.update(gain, shot.post.vignette, aspect)"]:
        f['set.ts'] = rep(f['set.ts'], line, line.replace('shot.post.vignette', '0'))
    t = SPEC[kind]
    s = f['plan.ts']
    s = rep(s, "import { ramp, smoother } from '../../director/rig'", "import { drift, ramp, smoother } from '../../director/rig'")
    s = rep(s, "  override dive(time: number): OrbitShot {\n", "  override dive(time: number): OrbitShot {\n    if (time * config.fps >= %d) return this.tile(time)\n" % t['firstFrame'])
    s = rep(s, "  private lowShot(time: number): OrbitShot {", """  tile(time: number): OrbitShot {
    const views: [number, number][] = %s
    const k = Math.min(Math.max(Math.floor(time * config.fps + 1e-6) - %d, 0), views.length - 1)
    const low = this.low(%r / config.fps)
    const [yaw, pitch] = views[k]!
    const q = low.quaternion.clone().multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(pitch), THREE.MathUtils.degToRad(yaw), 0, 'YXZ'))).multiply(drift(time).invert())
    return { pose: { position: low.position, quaternion: q, vfov: %r }, view: 'terrain' }
  }

  private lowShot(time: number): OrbitShot {""" % (json.dumps(t['views']), t['firstFrame'], t['atFrame'], t['vfovDeg']))
    f['plan.ts'] = s


def on(name):
    assert not STATE.exists(), 'already patched: run off first'
    KEEP.mkdir(parents=True, exist_ok=True)
    f = {n: (SRC / n).read_text() for n in FILES}
    for n, s in f.items():
        (KEEP / n).write_text(s)
    if name == 'noglare':
        noglare(f)
    else:
        tiles(f, name)
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
