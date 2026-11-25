"""Reads swing.ts's pictures: the swing at a place between the live cells and their bake on the globe, in levels of
255 (largest channel of the difference), over the places where the live ground stands (where the two pictures differ
at all or the ground's mask says so: here every place under the row of the limb that is not sky in both), and a
picture of both with the difference times 4.
usage: python3 assets-src/sun/lab/swing.py out/work/sun/lab/swing [blur px]"""
import sys, glob, re
import numpy as np
from PIL import Image
from scipy import ndimage

d = sys.argv[1]
blur = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
frames = sorted({int(re.search(r'f(\d+)-', f).group(1)) for f in glob.glob(d + '/f*-live.png')})
for f in frames:
    a = np.asarray(Image.open('%s/f%d-live.png' % (d, f)).convert('RGB')).astype(float)
    b = np.asarray(Image.open('%s/f%d-bake.png' % (d, f)).convert('RGB')).astype(float)
    if blur > 0:
        a = ndimage.gaussian_filter(a, (blur, blur, 0))
        b = ndimage.gaussian_filter(b, (blur, blur, 0))
    sw = np.abs(a - b).max(axis=2)
    on = (a.max(axis=2) > 40) & (b.max(axis=2) > 40)
    v = sw[on]
    print('frame %d places %d swing: largest %.1f levels, 99th percentile %.1f, 90th %.1f, median %.1f, mean %.2f; mean of live %.1f of bake %.1f' % (f, v.size, v.max(), np.percentile(v, 99), np.percentile(v, 90), np.median(v), v.mean(), a.max(axis=2)[on].mean(), b.max(axis=2)[on].mean()))
    o = np.concatenate([a, b, np.repeat(np.clip(sw * 4, 0, 255)[:, :, None], 3, axis=2)], axis=1)
    Image.fromarray(o.astype(np.uint8)).resize((o.shape[1] // 2, o.shape[0] // 2), Image.LANCZOS).save('%s/swing-%d.jpg' % (d, f), quality=88)
