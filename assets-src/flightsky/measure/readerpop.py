import sys, numpy as np
from PIL import Image
sys.path.insert(0, 'tools/img')
import smooth as S
base = '/home/user/workspace/scratch/m1012/'
d, k0, k1 = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
fr = {k: S.small(np.asarray(Image.open(base + '%s/k%06d.png' % (d, k)).convert('RGB')).astype(np.float64) @ S.LUMA, 0.25) for k in range(k0, k1 + 1)}
res = {}
for k in range(k0, k1):
    dd, m, u = S.left(fr[k], fr[k + 1], S.motion(fr[k], fr[k + 1]), S.motion(fr[k + 1], fr[k]), False)
    res[k] = float(np.nanmean(dd))
np.save(base + 'res-%s.npy' % d, np.array([res[k] for k in range(k0, k1)]))
for k in range(k0 + 16, k1 - 16):
    rest = [res[j] for j in range(k - 16, k + 17) if j != k and j in res]
    m = float(np.median(rest))
    print(f'{d} frame {k / 2:.1f}: left {res[k]:.2f} median round it {m:.2f} pop, every pixel {res[k] / max(m, 0.25):.2f}')
