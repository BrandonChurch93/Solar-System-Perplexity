"""The ground mask of film frame 90 for the Builder's bands.py (MAIL 1311): white where the approved close image
and the lab's frame both show ground. The approved's limb is read by eye at nine columns of the picture at 1920 by
1080 and joined by a cubic; the mask is every pixel more than 10 px below that line. The shot's horizon stands
above the approved's, so the rows between the two limbs are ground in the frame and sky in the approved: they are
out of the mask.
usage: python3 assets-src/sun/lab/mask.py OUT.png [OVERLAY.jpg]"""
import sys
import numpy as np
from PIL import Image, ImageDraw

LIMB = [(0, 600), (267, 567), (533, 537), (800, 517), (960, 511), (1200, 520), (1467, 547), (1733, 600), (1920, 653)]
c = np.polyfit([(p[0] - 960) / 960 for p in LIMB], [p[1] for p in LIMB], 3)
line = np.polyval(c, (np.arange(1920) - 960) / 960)
mask = np.arange(1080)[:, None] > line[None, :] + 10
Image.fromarray((mask * 255).astype(np.uint8)).save(sys.argv[1])
print('limb at x 0 480 960 1440 1919:', [round(float(line[x]), 1) for x in (0, 480, 960, 1440, 1919)], 'share', round(float(mask.mean()), 4))
if len(sys.argv) > 2:
    a = Image.open('references/approved/sun-close.jpg').convert('RGB').resize((1920, 1080), Image.LANCZOS)
    ImageDraw.Draw(a).line([(x, float(line[x]) + 10) for x in range(0, 1920, 4)], fill=(0, 255, 255), width=2)
    a.crop((0, 380, 1920, 700)).resize((1440, 240)).save(sys.argv[2], quality=88)
