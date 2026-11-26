import sys, glob, os, numpy as np
from PIL import Image
L = np.array([0.2126, 0.7152, 0.0722])
def ld(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.float64)
sets = sys.argv[1:]
base = '/tmp/n79/f/'
files = sorted(os.path.basename(p) for p in glob.glob(base + sets[-1] + '/*.png'))
print('frame | lower part median green ' + ' / '.join(sets) + ' | whole frame mean level ' + ' / '.join(sets) + ' | mean abs diff from ' + sets[0] + ': ' + ' / '.join(sets[1:]) + ' | ' + sets[-1] + ' against ' + sets[1] + ': px over 4, largest')
for b in files:
    fr = int(b[1:7]) // 2
    if not all(os.path.exists(base + s + '/' + b) for s in sets): continue
    im = [ld(base + s + '/' + b) for s in sets]
    med = ['%.0f' % np.median(a[600:1080][..., 1]) for a in im]
    lev = ['%.2f' % (a @ L).mean() for a in im]
    mad = ['%.2f' % np.abs(a - im[0]).mean() for a in im[1:]]
    m = np.abs(im[-1] - im[1]).max(axis=2)
    print(fr, '|', ' / '.join(med), '|', ' / '.join(lev), '|', ' / '.join(mad), '|', int((m > 4).sum()), int(m.max()))
