import sys
from PIL import Image, ImageDraw
# usage: crop.py OUT X0,Y0,X1,Y1 SCALE COLS label=file ...
out = sys.argv[1]; box = tuple(int(v) for v in sys.argv[2].split(',')); sc = int(sys.argv[3]); cols = int(sys.argv[4])
items = [a.split('=', 1) for a in sys.argv[5:]]
w = (box[2] - box[0]) * sc; h = (box[3] - box[1]) * sc; pad = 14
rows = (len(items) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * (h + pad)), (0, 0, 0)); d = ImageDraw.Draw(sheet)
for i, (lab, f) in enumerate(items):
    im = Image.open(f).convert('RGB').crop(box).resize((w, h), Image.LANCZOS if sc == 1 else Image.NEAREST)
    x = (i % cols) * w; y = (i // cols) * (h + pad)
    sheet.paste(im, (x, y + pad)); d.text((x + 3, y + 1), lab, fill=(255, 255, 255))
sheet.save(out, quality=92)
print(out, sheet.size)
