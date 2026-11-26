import sys
from PIL import Image, ImageDraw
# usage: sheet.py OUT COLS W label=file ...
out = sys.argv[1]; cols = int(sys.argv[2]); w = int(sys.argv[3]); items = [a.split('=', 1) for a in sys.argv[4:]]
h = w * 9 // 16; pad = 14; rows = (len(items) + cols - 1) // cols
sh = Image.new('RGB', (cols * w, rows * (h + pad)), (0, 0, 0)); d = ImageDraw.Draw(sh)
for i, (lab, f) in enumerate(items):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    x = (i % cols) * w; y = (i // cols) * (h + pad)
    sh.paste(im, (x, y + pad)); d.text((x + 3, y + 1), lab, fill=(255, 255, 255))
sh.save(out, quality=90); print(out, sh.size)
