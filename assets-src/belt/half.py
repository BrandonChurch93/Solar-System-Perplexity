import json
import sys
from pathlib import Path

import numpy as np

root = Path(sys.argv[1])
rid = sys.argv[2]


def half(a):
    s = a.shape
    return a.reshape(s[0], s[1] // 2, 2, s[2] // 2, 2, *s[3:]).mean(axis=(2, 4))


man = json.loads((root / 'manifest.json').read_text())
r = man['rocks'][rid]
n, h = r['size'], r['aux']
m = half(np.fromfile(root / f'rock-{rid}.map.bin', dtype=np.uint8).reshape(6, n, n, 4).astype(np.float32))
v = m[..., :3] / 127.5 - 1
v /= np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-6)
m[..., :3] = v * 127.5 + 127.5
np.clip(np.rint(m), 0, 255).astype(np.uint8).tofile(root / f'rock-{rid}.map.bin')
raw = (root / f'rock-{rid}.aux.bin').read_bytes()
rad = np.frombuffer(raw[: 6 * h * h * 2], dtype='<u2').reshape(6, h, h).astype(np.float32)
ao = np.frombuffer(raw[6 * h * h * 2 :], dtype=np.uint8).reshape(6, h, h).astype(np.float32)
(root / f'rock-{rid}.aux.bin').write_bytes(np.clip(np.rint(half(rad)), 0, 65535).astype('<u2').tobytes() + np.clip(np.rint(half(ao)), 0, 255).astype(np.uint8).tobytes())
r['size'], r['aux'] = n // 2, h // 2
(root / 'manifest.json').write_text(json.dumps(man, indent=1))
print(rid, 'halved to', n // 2, h // 2)
