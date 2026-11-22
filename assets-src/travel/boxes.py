import sys
from PIL import Image
import numpy as np
for f in sys.argv[1:]:
    im = Image.open(f).convert('RGB')
    t = im.resize((456, 256), Image.LANCZOS)
    a = np.asarray(t.convert('L')).astype(float)
    out = []
    for r in range(2):
        for c in range(3):
            b = a[r * 128:(r + 1) * 128, c * 152:(c + 1) * 152]
            out.append('%.1f/%d' % (b.mean(), (b > 24).sum()))
    print(f.split('/')[-1], ' '.join(out), 'max', int(a.max()))
