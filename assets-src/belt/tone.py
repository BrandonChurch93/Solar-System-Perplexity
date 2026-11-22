import sys
import numpy as np
from PIL import Image

path = sys.argv[1]
x, y, w, h = [int(v) for v in sys.argv[2].split(',')]
p = np.asarray(Image.open(path).convert('RGB')).astype(np.float64)[y:y + h, x:x + w].reshape(-1, 3)
luma = p @ np.array([0.2126, 0.7152, 0.0722])
print(path, 'rect', x, y, w, h, 'mean sRGB %.1f %.1f %.1f' % tuple(p.mean(0)), 'luma mean %.1f p5 %.1f p50 %.1f p95 %.1f' % (luma.mean(), *np.percentile(luma, [5, 50, 95])))
