# The far twin as the files the film loads: the bytes of bake.ts (rows from the bottom) turned the right way up,
# brought down to the level's size and to half of it.
#   python3 assets-src/sun/lab/level.py [folder of bake.ts]
import json, os, sys
import numpy as np
from PIL import Image

src = sys.argv[1] if len(sys.argv) > 1 else 'out/work/sun/lab/level'
meta = json.load(open(src + '/place-far-0.json'))
n = meta['drawn']
a = np.fromfile(src + '/place-far-0.rgba', dtype=np.uint8).reshape(n, n, 4)[::-1, :, :3]
im = Image.fromarray(np.ascontiguousarray(a))
for name, size in (('full', meta['size']), ('web', meta['size'] // 2)):
    os.makedirs('public/assets/sun/' + name + '/lab', exist_ok=True)
    to = 'public/assets/sun/' + name + '/lab/place-far-0.jpg'
    im.resize((size, size), Image.LANCZOS).save(to, quality=92, subsampling=0)
    print(to, size, os.path.getsize(to))
