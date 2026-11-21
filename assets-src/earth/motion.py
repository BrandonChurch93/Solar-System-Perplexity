import json
import sys
from pathlib import Path

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parent))
import geo
from common import lonlat_to_local

J = json.loads((geo.ROOT / "src" / "stops" / "earth" / "motion.json").read_text())
HOLD = (56.0, 61.0)
EASE = J["drift"]["ease"]
RATE = np.radians(J["drift"]["degPerSecond"])
STORM = J["storm"]
C0 = lonlat_to_local(STORM["lon"], STORM["lat"])
AURORA_GATE = tuple(J["auroraGate"])
EMISSIVE_PEAK = J["emissivePeak"]


def s_of(t):
    x = HOLD[1] - t
    return -x * x / (x + EASE) if x > 0 else 0.0


S_MID = s_of((HOLD[0] + HOLD[1]) / 2)


def profile(y):
    return -np.cos(3 * np.arcsin(np.clip(y[..., 1], -1, 1)))


def drift(y, s):
    return geo.spin_y(y, RATE * profile(y) * s)


def undrift(q, s):
    return geo.spin_y(q, -RATE * profile(q) * s)


def theta(y, c):
    ang = np.degrees(np.arccos(np.clip(y @ c, -1, 1)))
    return np.radians(STORM["degPerSecond"]) * geo.smooth(STORM["fadeDeg"][1], STORM["fadeDeg"][0], ang) / (1 + (ang / STORM["coreDeg"]) ** 2)


def centre(s):
    return undrift(C0, s)


def twist(y, s):
    c = centre(s)
    return geo.turn_about(y, c, -theta(y, c) * s)


def untwist(y, s):
    c = centre(s)
    return geo.turn_about(y, c, theta(y, c) * s)


def warp(y, s):
    return drift(twist(y, s), s)


def unwarp(q, s):
    return untwist(undrift(q, s), s)
