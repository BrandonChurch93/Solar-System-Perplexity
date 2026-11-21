import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
name, film_path, out = sys.argv[1], sys.argv[2], sys.argv[3]
boxes = [tuple(int(v) for v in b.split(",")) for b in sys.argv[4:]]
ref = cv2.imread(str(ROOT / "references/approved" / ("saturn-hero.png" if name == "hero" else "saturn-close.jpg")))
film = cv2.imread(film_path)
film = cv2.resize(film, (ref.shape[1], ref.shape[0]), interpolation=cv2.INTER_CUBIC)
rows = []
for x, y, w, h in boxes:
    a = ref[y:y + h, x:x + w]
    b = film[y:y + h, x:x + w]
    pair = np.hstack([a, np.full((h, 6, 3), 255, np.uint8), b])
    rows.append(pair)
width = max(r.shape[1] for r in rows)
rows = [cv2.copyMakeBorder(r, 0, 6, 0, width - r.shape[1], cv2.BORDER_CONSTANT, value=(40, 40, 40)) for r in rows]
cv2.imwrite(out, np.vstack(rows), [cv2.IMWRITE_JPEG_QUALITY, 92])
