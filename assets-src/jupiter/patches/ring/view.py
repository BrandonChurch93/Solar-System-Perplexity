# view.py TAG OUT ZOOM cx,cy ... : plane crops, the wrap beside the wrap with the carried finish; a first tile shows the true mid level beside its base
import os
import sys, numpy as np, cv2
from PIL import Image, ImageDraw
OUT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..', '..', '..')) + '/out/work/jupiter/ring/'
tag, out, zoom = sys.argv[1], sys.argv[2], int(sys.argv[3][0])
B = np.load(OUT + 'B.npy'); H = np.load(OUT + 'H-' + tag + '.npy'); A2 = np.load(OUT + 'A2.npy'); q = np.load(OUT + 'q.npy')
N = B.shape[0]
w, h = (300, 220) if len(sys.argv[3]) == 1 else (600, 330)
rows = []
for k, a in enumerate(sys.argv[4:]):
    cx, cy = [float(v) for v in a.split(',')]
    x0, y0 = int(cx * N) - w // 2, int(cy * N) - h // 2
    left = B[y0:y0 + h, x0:x0 + w]
    right = (A2 if k == 0 else B + H)[y0:y0 + h, x0:x0 + w]
    t = np.concatenate([left, np.zeros((h, 6, 3)), right], 1)
    im = Image.fromarray(np.clip(t + 0.5, 0, 255).astype(np.uint8)).resize(((2 * w + 6) * zoom, h * zoom), Image.LANCZOS if zoom < 3 else Image.NEAREST)
    ImageDraw.Draw(im).text((4, 3), ('the wrap | the true mid level (the dictionary)' if k == 0 else 'the wrap | with the carried finish') + '  plane %.2f, %.2f  q %.2f' % (cx, cy, float(q[int(cy * N), int(cx * N)])), fill=(255, 255, 0))
    rows.append(np.asarray(im))
Image.fromarray(np.concatenate(rows, 0)).save(out)
print(out, len(rows))
