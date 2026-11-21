import sys
from PIL import Image, ImageDraw

out = sys.argv[1]
files = sys.argv[2:]
cols = 5
rows = (len(files) + cols - 1) // cols
w, h = 768, 432
sheet = Image.new('RGB', (cols * w, rows * h))
for i, f in enumerate(files):
    im = Image.open(f).convert('RGB').resize((w, h), Image.LANCZOS)
    ImageDraw.Draw(im).text((10, 8), f.split('/')[-1][1:6].lstrip('0'), fill=(255, 255, 0))
    sheet.paste(im, ((i % cols) * w, (i // cols) * h))
sheet.save(out, quality=90)
