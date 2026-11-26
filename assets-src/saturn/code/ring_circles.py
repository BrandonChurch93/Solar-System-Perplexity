# ring_circles.py LENS OUT LABEL=IMG...: frame 3465 with the true circles of the rings' outer edge (2.3389 radii), the B ring's
# outer edge (1.9545) and the B ring's inner edge (1.5237) drawn through the frame's own lens, one picture under the other
import sys, json, os, numpy as np
from PIL import Image, ImageDraw
HERE = os.path.dirname(os.path.abspath(__file__)); ROOT = os.path.normpath(os.path.join(HERE, '..', '..', '..')); sys.path.insert(0, HERE)
import ring_edges as e4
L = json.load(open(sys.argv[1])); s = L['frames']['3465']; out = sys.argv[2]; items = [a.split('=', 1) for a in sys.argv[3:]]
az = np.arange(-180, 180.01, 0.25)
tiles = []
for lab, p in items:
    im = Image.open(p).convert('RGB')
    if not (im.size == (1920, 1080)): im = im.resize((1920, 1080), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    for r, col in ((2.3389, (0, 255, 255)), (1.9545, (255, 0, 255)), (1.5237, (0, 255, 0))):
        x, y = e4.proj(s, e4.ring_pt(az, np.full(len(az), r)))
        pts = list(zip(x.tolist(), y.tolist()))
        for i in range(len(pts) - 1):
            if i % 8 < 4: d.line([pts[i], pts[i + 1]], fill=col, width=1)   # dashed, so that the edge shows between
    d.text((8, 6), lab, fill=(255, 255, 0)); tiles.append(im)
sh = Image.new('RGB', (1920, len(tiles) * 1086 - 6), (40, 0, 60))
for i, t in enumerate(tiles): sh.paste(t, (0, i * 1086))
sh.save(out, quality=92); print(out, sh.size)
