import json
import sys
import numpy as np
from PIL import Image, ImageDraw

data = json.loads(sys.stdin.read())
withdir, baredir, out = sys.argv[1:4]
W, H = int(sys.argv[4]), int(sys.argv[5])
GAP, BAR, UP, COLS = 4, 16, 40, 4
frames = data['frames']
bands = (len(frames) + COLS - 1) // COLS
sheet = Image.new('RGB', (COLS * W + (COLS - 1) * GAP, bands * 2 * (H + BAR) + (bands * 2 - 1) * GAP), (24, 24, 24))
draw = ImageDraw.Draw(sheet)
for k, f in enumerate(frames):
    a = Image.open('%s/f%05d-final.png' % (withdir, f)).convert('RGB')
    n = Image.open('%s/f%05d-final.png' % (baredir, f)).convert('RGB')
    x0 = int(round(data['win'][k][0] - W / 2))
    y0 = int(round(data['win'][k][1] - H / 2))
    box = (x0, y0, x0 + W, y0 + H)
    col, band = k % COLS, k // COLS
    left = col * (W + GAP)
    top = band * 2 * (H + BAR + GAP)
    low = top + H + BAR + GAP
    draw.text((left + 3, top + 2), 'frame %d, native, corner x %d y %d' % (f, x0, y0), fill=(200, 200, 200))
    draw.text((left + 3, low + 2), 'frame %d, the dust alone, times %d' % (f, UP), fill=(200, 200, 200))
    sheet.paste(a.crop(box), (left, top + BAR))
    d = np.asarray(a.crop(box)).astype(float) - np.asarray(n.crop(box)).astype(float)
    sheet.paste(Image.fromarray(np.clip(d * UP, 0, 255).astype(np.uint8)), (left, low + BAR))
sheet.save(out, quality=93, subsampling=0)
print(out, sheet.size)
