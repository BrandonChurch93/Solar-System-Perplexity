"""Reads swing.ts's pictures: the swing at a place between the live cells and their bake on the globe, in levels of
255 (largest channel of the difference), over the places where the live ground stands (where the two pictures differ
at all or the ground's mask says so: here every place under the row of the limb that is not sky in both), and a
picture of the three with the difference of the far form and the bake times 4.
usage: python3 assets-src/sun/lab/swing.py out/work/sun/lab/swing [blur px]"""
import sys, glob, re
import numpy as np
from PIL import Image
from scipy import ndimage

d = sys.argv[1]
blur = float(sys.argv[2]) if len(sys.argv) > 2 else 0.0
frames = sorted({int(re.search(r'f(\d+)-', f).group(1)) for f in glob.glob(d + '/f*-live.png')})
def read(f, name):
    x = np.asarray(Image.open('%s/f%d-%s.png' % (d, f, name)).convert('RGB')).astype(float)
    return ndimage.gaussian_filter(x, (blur, blur, 0)) if blur > 0 else x
for f in frames:
    live, flat, bake = read(f, 'live'), read(f, 'flat'), read(f, 'bake')
    # the places of the ground: where the picture with the live ground differs from the one without it at all, grown
    # a little, and not the sky
    on = ndimage.binary_dilation(np.abs(live - bake).max(axis=2) > 2, iterations=6) & (live.max(axis=2) > 40) & (bake.max(axis=2) > 40)
    for name, a, b in (('live to bake', live, bake), ('far form to bake', flat, bake), ('live to far form', live, flat)):
        sw = np.abs(a - b).max(axis=2)
        v = sw[on]
        print('frame %d %s: places %d, swing largest %.1f levels, 99th percentile %.1f, 90th %.1f, median %.1f, mean %.2f; means %.1f and %.1f' % (f, name, v.size, v.max(), np.percentile(v, 99), np.percentile(v, 90), np.median(v), v.mean(), a.max(axis=2)[on].mean(), b.max(axis=2)[on].mean()))
    sw = np.abs(flat - bake).max(axis=2)
    o = np.concatenate([live, flat, bake, np.repeat(np.clip(sw * 4, 0, 255)[:, :, None], 3, axis=2)], axis=1)
    Image.fromarray(o.astype(np.uint8)).resize((o.shape[1] // 2, o.shape[0] // 2), Image.LANCZOS).save('%s/swing-%d.jpg' % (d, f), quality=88)
