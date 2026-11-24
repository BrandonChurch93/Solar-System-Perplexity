"""Do the five levels of the place show one picture? (MAIL 596)

assets-src/shared/globe-levels.py judges a level against the part of its parent that it covers with the smooth report's own
pattern function. It reads files. Three of the five files of a handover hold their light alone, as a ratio to the plate of their
colour level (plates.json, lightNote): such a file is no picture, and a pair of it with a plate with colour, or with a light
file of another colour level, is no test. So here every level is first put together as the film shows it (tlay.present: the
light of the level times the plate of its colour level at the same ground point) and written as a picture to
out/work/venus/place/levels/<kind>-<tag>.png; then the tool judges the pairs w to a, a to b, b to c, c to d, and b to d.

python3 assets-src/venus/place/levels.py [dive] [rise]      (run from the root of the repository)
"""
import subprocess
import sys

import cv2
import numpy as np

import tlay

OUT = tlay.WORK / 'levels'
OUT.mkdir(parents=True, exist_ok=True)
for kind in sys.argv[1:] or ['dive', 'rise']:
    args = []
    for level in tlay.SPEC['levels']:
        p = OUT / f"{kind}-{level['tag']}.png"
        cv2.imwrite(str(p), np.clip(tlay.present(kind, level['tag']) * 255 + 0.5, 0, 255).astype(np.uint8))
        args += ['--level', f"{p.name}:{level['widthDeg']}"]
    print(kind, flush=True)
    subprocess.run(['python3', str(tlay.ROOT / 'assets-src/shared/globe-levels.py'), '--dir', str(OUT), *args, '--pairs', '0-1,1-2,2-3,3-4,2-4', '--panel', str(OUT / f'{kind}-panel.png')])
