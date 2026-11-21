import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
from lib import HERE, ROOT, normalize
from common import mat_to_quat, quat_to_mat

SUN = normalize([-0.78962, 0.58085, -0.19775])
NORMAL = normalize([0.19599, 0.88115, 0.4303])
INNER = 1.2458
OUTER = 2.3394


def arc(a, b):
    v = np.cross(a, b)
    c = float(a @ b)
    k = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return np.eye(3) + k + k @ k / (1 + c)


src = HERE / "fit.json"
fit = json.loads(src.read_text())
if "refit" not in fit:
    old = normalize(fit["rings"]["normal"])
    turn = arc(old, NORMAL)
    q = mat_to_quat(turn @ quat_to_mat(fit["globe"]["quaternion"]))
    qm = mat_to_quat(turn @ quat_to_mat(fit["globe"]["meshQuaternionForThreeSphereGeometry"]))
    fit["refit"] = {
        "sunDirBefore": fit["sunDir"], "normalBefore": fit["rings"]["normal"], "globeQuaternionBefore": fit["globe"]["quaternion"],
        "sun": "grid search of the globe's shadow on the rings against the hero (assets-src/saturn/rings/fit_sun.py): overlap 0.79, was 0.48 with the Sun fitted on the terminator alone",
        "normal": "ring edges straightest in the polar view (assets-src/saturn/rings/fit_plane.py): edge wander 0.038 radii rms, was 0.060",
    }
    fit["sunDir"] = [round(float(x), 6) for x in SUN]
    fit["rings"]["normal"] = [round(float(x), 6) for x in NORMAL]
    fit["rings"]["inner"] = INNER
    fit["rings"]["outer"] = OUTER
    fit["globe"]["quaternion"] = [round(float(x), 7) for x in q]
    fit["globe"]["meshQuaternionForThreeSphereGeometry"] = [round(float(x), 7) for x in qm]
    fit["globe"]["northPole"] = fit["rings"]["normal"]
    src.write_text(json.dumps(fit, indent=2) + "\n")
dst = ROOT / "src/stops/saturn/fit.json"
small = json.loads(dst.read_text())
small["sunDir"] = fit["sunDir"]
small["rings"] = {"normal": fit["rings"]["normal"], "inner": fit["rings"]["inner"], "outer": fit["rings"]["outer"]}
small["globe"]["quaternion"] = fit["globe"]["quaternion"]
dst.write_text(json.dumps(small, indent=2) + "\n")
print(json.dumps(small["globe"]), small["sunDir"], small["rings"])
