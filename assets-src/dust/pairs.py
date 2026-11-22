import sys
import numpy as np
from PIL import Image, ImageDraw
from scipy import ndimage

frame, before, after, bare, out = sys.argv[1:6]
places = [tuple(int(v) for v in p.split(',')) for p in sys.argv[6:]]
W, H, GAP, BAR, UP, FINE = 640, 300, 8, 16, 8, 40
b = Image.open(before).convert('RGB')
a = Image.open(after).convert('RGB')
n = Image.open(bare).convert('RGB')
if not places:
    d = (np.abs(np.asarray(b).astype(float) - np.asarray(n).astype(float)).max(axis=2) >= 3).astype(float)
    box = ndimage.uniform_filter(d, size=(H, W), mode='constant')
    for _ in range(2):
        y, x = np.unravel_index(box.argmax(), box.shape)
        places.append((int(x), int(y)))
        box[max(y - H, 0):y + H, max(x - W, 0):x + W] = -1

def alone(im, x0, y0, up):
    c = np.asarray(im.crop((x0, y0, x0 + W, y0 + H))).astype(float) - np.asarray(n.crop((x0, y0, x0 + W, y0 + H))).astype(float)
    return Image.fromarray(np.clip(c * up, 0, 255).astype(np.uint8))

rows = len(places) * 2
sheet = Image.new('RGB', (2 * W + GAP, rows * (H + BAR) + (rows - 1) * GAP), (24, 24, 24))
draw = ImageDraw.Draw(sheet)
for i, (cx, cy) in enumerate(places):
    x0 = min(max(cx - W // 2, 0), b.width - W)
    y0 = min(max(cy - H // 2, 0), b.height - H)
    top = 2 * i * (H + BAR + GAP)
    low = top + H + BAR + GAP
    draw.text((4, top + 2), 'frame %s final, before: native crop, left top corner x %d y %d' % (frame, x0, y0), fill=(200, 200, 200))
    draw.text((W + GAP + 4, top + 2), 'after: same place', fill=(200, 200, 200))
    draw.text((4, low + 2), 'before, the dust alone (still minus the same still without dust), times %d' % UP, fill=(200, 200, 200))
    draw.text((W + GAP + 4, low + 2), 'after, the dust alone, times %d' % FINE, fill=(200, 200, 200))
    sheet.paste(b.crop((x0, y0, x0 + W, y0 + H)), (0, top + BAR))
    sheet.paste(a.crop((x0, y0, x0 + W, y0 + H)), (W + GAP, top + BAR))
    sheet.paste(alone(b, x0, y0, UP), (0, low + BAR))
    sheet.paste(alone(a, x0, y0, FINE), (W + GAP, low + BAR))
sheet.save(out, quality=93, subsampling=0)
print(out, sheet.size, places)
