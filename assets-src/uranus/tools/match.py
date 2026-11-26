import sys, numpy as np
from PIL import Image
ref = Image.open(sys.argv[1]).convert('RGB')
for p in sys.argv[2:]:
    a = Image.open(p).convert('RGB')
    for name, rs in (('lanczos', Image.LANCZOS), ('bicubic', Image.BICUBIC), ('bilinear', Image.BILINEAR)):
        r = np.asarray(ref.resize(a.size, rs)).astype(np.float64)
        print(p, name, '%.4f' % np.abs(np.asarray(a).astype(np.float64) - r).mean())
