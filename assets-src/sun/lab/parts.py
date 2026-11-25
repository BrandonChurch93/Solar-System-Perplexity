"""The plain match of a frame against the approved close image on the three parts of mask.py's png (MAIL 1318):
mean absolute difference over R, G, B in display values, on the ground (255), the strip between the two limbs
(128) and the sky above the film's limb (0), and the rows the strip covers.
usage: python3 assets-src/sun/lab/parts.py PARTS.png FRAME.png [FRAME.png ...]"""
import sys
import numpy as np
from PIL import Image

m = np.asarray(Image.open(sys.argv[1]).convert('L'))
a = np.asarray(Image.open('references/approved/sun-close.jpg').convert('RGB').resize((1920, 1080), Image.BOX)).astype(float)
rows = np.where((m == 128).any(axis=1))[0]
print('strip rows', int(rows.min()), 'to', int(rows.max()), 'shares ground strip sky', [round(float((m == v).mean()), 4) for v in (255, 128, 0)])
for f in sys.argv[2:]:
    d = np.abs(np.asarray(Image.open(f).convert('RGB')).astype(float) - a).mean(axis=2)
    print(f.split('/')[-1], 'ground', round(float(d[m == 255].mean()), 4), 'strip', round(float(d[m == 128].mean()), 4), 'sky', round(float(d[m == 0].mean()), 4), 'whole', round(float(d.mean()), 4))
