import json
import sys
from pathlib import Path

import numpy as np

src = Path(sys.argv[1] if len(sys.argv) > 1 else 'public/assets/shared/belt/full')
dst = Path(sys.argv[2] if len(sys.argv) > 2 else 'public/assets/shared/belt/web')
dst.mkdir(parents=True, exist_ok=True)


def half(a):
    s = a.shape
    return a.reshape(s[0], s[1] // 2, 2, s[2] // 2, 2, *s[3:]).mean(axis=(2, 4))


man = json.loads((src / 'manifest.json').read_text())
for rid, r in man['rocks'].items():
    n, h = r['size'], r['aux']
    m = np.fromfile(src / f'rock-{rid}.map.bin', dtype=np.uint8).reshape(6, n, n, 4).astype(np.float32)
    m = half(m)
    v = m[..., :3] / 127.5 - 1
    v /= np.maximum(np.linalg.norm(v, axis=-1, keepdims=True), 1e-6)
    m[..., :3] = v * 127.5 + 127.5
    np.clip(np.rint(m), 0, 255).astype(np.uint8).tofile(dst / f'rock-{rid}.map.bin')
    raw = (src / f'rock-{rid}.aux.bin').read_bytes()
    rad = np.frombuffer(raw[: 6 * h * h * 2], dtype='<u2').reshape(6, h, h).astype(np.float32)
    ao = np.frombuffer(raw[6 * h * h * 2 :], dtype=np.uint8).reshape(6, h, h).astype(np.float32)
    out = np.clip(np.rint(half(rad)), 0, 65535).astype('<u2').tobytes() + np.clip(np.rint(half(ao)), 0, 255).astype(np.uint8).tobytes()
    (dst / f'rock-{rid}.aux.bin').write_bytes(out)
    r['size'], r['aux'] = n // 2, h // 2
d = man['detail']['size']
t = np.fromfile(src / 'detail.bin', dtype=np.uint8).reshape(1, d, d, 4).astype(np.float32)
np.clip(np.rint(half(t)), 0, 255).astype(np.uint8).tofile(dst / 'detail.bin')
man['detail']['size'] = d // 2
(dst / 'manifest.json').write_text(json.dumps(man, indent=1))
print('web set written', sum(f.stat().st_size for f in dst.iterdir()) / 1e6, 'MB')
