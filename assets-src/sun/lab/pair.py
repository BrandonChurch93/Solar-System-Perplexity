"""Pairs of a render of film frame 90 beside the approved close image, approved left, both at the render's size.
usage: python3 assets-src/sun/lab/pair.py RENDER.png OUT_PREFIX [label]"""
import sys
import numpy as np
from PIL import Image, ImageDraw

render = Image.open(sys.argv[1]).convert('RGB')
w, h = render.size
approved = Image.open('references/approved/sun-close.jpg').convert('RGB').resize((w, h), Image.LANCZOS)
label = sys.argv[3] if len(sys.argv) > 3 else 'lab'
k = w / 1920
boxes = {'spot': (696, 462, 720, 420), 'near': (60, 640, 720, 420), 'far': (1150, 400, 720, 300)}
for name, (x, y, bw, bh) in boxes.items():
    x, y, bw, bh = [int(round(v * k)) for v in (x, y, bw, bh)]
    out = Image.new('RGB', (bw * 2, bh))
    out.paste(approved.crop((x, y, x + bw, y + bh)), (0, 0))
    out.paste(render.crop((x, y, x + bw, y + bh)), (bw, 0))
    d = ImageDraw.Draw(out)
    d.text((6, 4), 'approved', fill=(255, 255, 255))
    d.text((bw + 6, 4), label + ' frame 90 ' + name, fill=(255, 255, 255))
    out.save(sys.argv[2] + '-' + name + '.jpg', quality=92)
for name, im in (('approved', approved), ('render', render)):
    a = np.asarray(im).astype(np.float32) / 255
    g = a[int(h * 0.72):, :, :]
    lum = g.max(axis=2)
    print(name, 'near ground: mean rgb', np.round(g.reshape(-1, 3).mean(axis=0), 3), 'max channel percentiles 5 25 50 75 95 99', np.round(np.percentile(lum, [5, 25, 50, 75, 95, 99]), 3))
