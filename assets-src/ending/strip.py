import sys
from PIL import Image, ImageDraw
# usage: strip.py OUT.jpg COLS CELLWIDTH file...   tiles stills with their frame numbers
out, cols, w = sys.argv[1], int(sys.argv[2]), int(sys.argv[3])
files = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]
h = round(w * ims[0].height / ims[0].width)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w, rows * h), (12, 12, 12))
for i, (f, im) in enumerate(zip(files, ims)):
    cell = im.resize((w, h), Image.LANCZOS)
    ImageDraw.Draw(cell).text((6, 4), f.split('/')[-1].split('-')[0].lstrip('f'), fill=(255, 255, 255))
    sheet.paste(cell, ((i % cols) * w, (i // cols) * h))
sheet.save(out, quality=88)
