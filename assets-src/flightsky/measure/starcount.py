import sys
sys.path.insert(0, '/home/user/workspace/repo/tools/measure')
import numpy as np, cv2
from g17 import luma
NAMED = [(i, 0) for i in range(4, 12)] + [(i, 1) for i in range(7, 12)]
def count(y, named=NAMED, thr=(0.03, 0.08, 0.2)):
    med = cv2.medianBlur((np.clip(y, 0, 1) * 255).astype(np.uint8), 21).astype(float) / 255
    mx = cv2.dilate(y, np.ones((5, 5)))
    out = []
    h, w = y.shape
    for t in thr:
        pk = (y >= mx) & (y - med > t)
        n = 0
        for i, j in named:
            n += int(pk[j * h // 8:(j + 1) * h // 8, i * w // 12:(i + 1) * w // 12].sum())
        out.append(n)
    floor = np.mean([np.median(med[j * h // 8:(j + 1) * h // 8, i * w // 12:(i + 1) * w // 12]) for i, j in named])
    return out, floor
if __name__ == '__main__':
    stop = sys.argv[1]
    for f in sys.argv[2:]:
        y = luma(f, (1920, 1080)) if f.endswith('.jpg') else luma(f)
        c, fl = count(y)
        print(f.split('/')[-1], 'stars over the local floor by 0.03, 0.08, 0.2 in the 13 tiles:', c, '| floor (median luma, mean of tiles)', round(float(fl), 3))
