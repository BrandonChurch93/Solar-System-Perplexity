import sys
sys.path.insert(0, '/home/user/workspace/repo/tools/measure')
import numpy as np
from g17 import luma, band, tiles
NAMED = [(i, 0) for i in range(4, 12)] + [(i, 1) for i in range(7, 12)]
def read(path, size=None, named=NAMED):
    y = luma(path, size); t = {(i, j): (l, e) for i, j, l, e in tiles(y, band(y), 12, 8)}
    return t, y.shape
def line(tag, t, named=NAMED):
    e = [t[k][1] * 1e5 for k in named]; l = [t[k][0] for k in named]
    print(f'{tag}: energy e-5 min {min(e):.1f} median {np.median(e):.1f} max {max(e):.1f} | luma min {min(l):.3f} median {np.median(l):.3f} max {max(l):.3f}')
    print('   e:', ' '.join(f'{v:.1f}' for v in e)); print('   l:', ' '.join(f'{v:.3f}' for v in l))
if __name__ == '__main__':
    stop = sys.argv[1]; films = sys.argv[2:]
    t0, shape = read(films[0])
    a, _ = read(f'/home/user/workspace/repo/references/approved/{stop}-close.jpg', (shape[1], shape[0]))
    line('approved', a)
    for f in films:
        t, _ = read(f); line(f.split('/')[-1], t)
