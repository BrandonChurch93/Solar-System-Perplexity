# side.py OUT W H X,Y[,ZOOM] LABEL=FILE ... : crops of W x H at X, Y from each file, side by side at one to one (or ZOOM), a label over each
import sys
from PIL import Image, ImageDraw, ImageFont
out, w, h = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
xy = sys.argv[4].split(',')
x, y = int(xy[0]), int(xy[1])
z = int(xy[2]) if len(xy) > 2 else 1
items = [a.split('=', 1) for a in sys.argv[5:]]
try:
    font = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf', 15)
except Exception:
    font = ImageFont.load_default()
pad, bar = 6, 24
W = len(items) * (w * z) + (len(items) - 1) * pad
sheet = Image.new('RGB', (W, h * z + bar), (18, 18, 22))
d = ImageDraw.Draw(sheet)
for i, (label, path) in enumerate(items):
    im = Image.open(path).convert('RGB').crop((x, y, x + w, y + h))
    if z > 1: im = im.resize((w * z, h * z), Image.NEAREST)
    sheet.paste(im, (i * (w * z + pad), bar))
    d.text((i * (w * z + pad) + 4, 3), label, fill=(235, 235, 235), font=font)
if out.endswith('.jpg'): sheet.save(out, quality=93)
else: sheet.save(out)
print(out, sheet.size)
