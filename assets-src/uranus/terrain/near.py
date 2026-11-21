import json
import subprocess
import sys
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter

Image.MAX_IMAGE_PIXELS = None
ROOT = Path(__file__).resolve().parents[3]
PUB = ROOT / 'public/assets/uranus'
WORK = ROOT / 'out/work/u/t/near'
CROP = (2576, 848, 4752, 1936)
EDGE = 0.04
SIGMA = 6.0

WORK.mkdir(parents=True, exist_ok=True)
plate = Image.open(PUB / 'full/deck-color.jpg').convert('RGB')
crop = plate.crop(CROP)
crop.save(WORK / 'crop.png')
big = WORK / 'crop-2x.png'
if not big.exists() or 'again' in sys.argv:
    subprocess.run([sys.executable, str(ROOT / 'tools/ml/upscale.py'), '--in', str(WORK / 'crop.png'), '--out', str(big), '--width', str(crop.width * 2)], check=True)
fine = np.asarray(Image.open(big).convert('RGB')).astype(np.float32)
base = np.asarray(crop.resize((crop.width * 2, crop.height * 2), Image.BICUBIC)).astype(np.float32)
low = lambda a: np.stack([gaussian_filter(a[..., c], SIGMA) for c in range(3)], axis=-1)
out = np.clip(fine + low(base) - low(fine), 0, 255)
print('mean abs change of the low frequencies', float(np.abs(low(base) - low(fine)).mean()))
full = Image.fromarray(np.round(out).astype(np.uint8))
full.save(PUB / 'full/deck-near.jpg', quality=93, subsampling=0)
full.resize((crop.width, crop.height), Image.LANCZOS).save(PUB / 'web/deck-near.jpg', quality=91, subsampling=0)
w, h = plate.size
table = {'window': [CROP[0] / w, 1 - CROP[3] / h, CROP[2] / w, 1 - CROP[1] / h], 'crop': list(CROP), 'edge': EDGE, 'size': {'full': [crop.width * 2, crop.height * 2], 'web': [crop.width, crop.height]}}
(ROOT / 'src/stops/uranus/deck-near.json').write_text(json.dumps(table, indent=1) + '\n')
side = Image.new('RGB', (1600, 400))
box = (1600, 900, 2000, 1300)
side.paste(Image.fromarray(base.astype(np.uint8)).crop(box).resize((800, 800), Image.NEAREST).crop((0, 200, 800, 600)), (0, 0))
side.paste(full.crop(box).resize((800, 800), Image.NEAREST).crop((0, 200, 800, 600)), (800, 0))
side.save(WORK / 'near-v.png')
print('wrote', table)
