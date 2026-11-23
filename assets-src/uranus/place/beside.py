import sys
from PIL import Image, ImageDraw

out, width = sys.argv[1], int(sys.argv[2])
pairs = [a.split('=') for a in sys.argv[3:]]
rows = []
for label, new, kept in pairs:
    a = Image.open(new).convert('RGB')
    b = Image.open(kept).convert('RGB')
    h = round(width * a.height / a.width)
    row = Image.new('RGB', (width * 2 + 6, h + 22), (18, 18, 18))
    row.paste(a.resize((width, h), Image.LANCZOS), (0, 0))
    row.paste(b.resize((width, h), Image.LANCZOS), (width + 6, 0))
    d = ImageDraw.Draw(row)
    d.text((4, h + 4), label + ' this tree', fill=(200, 200, 200))
    d.text((width + 10, h + 4), label + ' kept still', fill=(200, 200, 200))
    rows.append(row)
sheet = Image.new('RGB', (rows[0].width, sum(r.height for r in rows)), (18, 18, 18))
y = 0
for r in rows:
    sheet.paste(r, (0, y))
    y += r.height
sheet.save(out, quality=88)
