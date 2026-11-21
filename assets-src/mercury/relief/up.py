import os
import sys

from PIL import Image

sys.path.insert(0, 'assets-src/mercury/relief')
import geom

WORK = 'out/work/mercury/relief/'
CLOSE2 = 'out/work/mercury/close-db-2x.png'
OV = 64
ML, MB, W, H, CW, CH = geom.ML, geom.MB, geom.W, geom.H, geom.CW, geom.CH
STRIPS = {'left': (0, 0, ML + OV, CH), 'right': (ML + W - OV, 0, CW, CH), 'bottom': (ML, H - OV, ML + W, CH)}

if sys.argv[1] == 'cut':
    im = Image.open(WORK + 'ext-2816.png').convert('RGB')
    for k, box in STRIPS.items():
        im.crop(box).save(WORK + 'strip-' + k + '.png')
        print(k, box[2] - box[0], box[3] - box[1])
else:
    im = Image.open(WORK + 'ext-2816.png').convert('RGB').resize((CW * 2, CH * 2), Image.LANCZOS)
    for k, box in STRIPS.items():
        p = WORK + 'strip-' + k + '-2x.png'
        if os.path.exists(p):
            s = Image.open(p).convert('RGB')
            assert s.size == ((box[2] - box[0]) * 2, (box[3] - box[1]) * 2), s.size
            im.paste(s, (box[0] * 2, box[1] * 2))
        else:
            print('missing, resampled instead:', p)
    im.paste(Image.open(CLOSE2).convert('RGB'), (ML * 2, 0))
    im.save(WORK + 'ext-2x.png')
    print('joined', im.size)
