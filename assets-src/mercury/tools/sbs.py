import sys

import numpy as np
from PIL import Image

film, out = sys.argv[1], sys.argv[2]
gain = float(sys.argv[3]) if len(sys.argv) > 3 else 1
box = [int(v) for v in sys.argv[4].split(',')] if len(sys.argv) > 4 else None
ref = sys.argv[5] if len(sys.argv) > 5 else 'references/approved/mercury-hero.png'
f = Image.open(film).convert('RGB')
h = Image.open(ref).convert('RGB').resize(f.size, Image.LANCZOS)
if box:
    f, h = f.crop(box), h.crop(box)
k = max(1, round(900 / f.size[0]))
a = np.concatenate([np.asarray(h), np.asarray(f)], 1).astype(np.float32) * gain
im = Image.fromarray(np.clip(a, 0, 255).astype(np.uint8))
if k > 1:
    im = im.resize((im.size[0] * k, im.size[1] * k), Image.NEAREST)
im.save(out, quality=90)
