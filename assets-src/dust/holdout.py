import sys
import numpy as np
from PIL import Image, ImageDraw

out = sys.argv[1]
jobs = [a.split(',') for a in sys.argv[2:]]
W, H, GAP, BAR, UP = 640, 300, 8, 16, 4
sheet = Image.new('RGB', (2 * W + GAP, len(jobs) * (H + BAR) + (len(jobs) - 1) * GAP), (24, 24, 24))
draw = ImageDraw.Draw(sheet)
for i, (frame, bright, bare, cx, cy) in enumerate(jobs):
    a = Image.open(bright).convert('RGB')
    n = Image.open(bare).convert('RGB')
    x0 = min(max(int(cx) - W // 2, 0), a.width - W)
    y0 = min(max(int(cy) - H // 2, 0), a.height - H)
    box = (x0, y0, x0 + W, y0 + H)
    top = i * (H + BAR + GAP)
    draw.text((4, top + 2), 'frame %s review, test build with the dust 25 times brighter: native crop, corner x %d y %d' % (frame, x0, y0), fill=(200, 200, 200))
    draw.text((W + GAP + 4, top + 2), 'the test dust alone (minus the same still without dust), times %d' % UP, fill=(200, 200, 200))
    sheet.paste(a.crop(box), (0, top + BAR))
    d = np.asarray(a.crop(box)).astype(float) - np.asarray(n.crop(box)).astype(float)
    sheet.paste(Image.fromarray(np.clip(d * UP, 0, 255).astype(np.uint8)), (W + GAP, top + BAR))
sheet.save(out, quality=93, subsampling=0)
print(out, sheet.size)
