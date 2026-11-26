import sys
import numpy as np
from PIL import Image
def read(p):
    a=np.asarray(Image.open(p).convert('RGB')).astype(np.float64)
    l=a[...,0]*0.2126+a[...,1]*0.7152+a[...,2]*0.0722
    h=l.shape[0]
    step=np.abs(np.diff(l,axis=1)).mean()+np.abs(np.diff(l,axis=0)).mean()
    c=a.reshape(-1,3).mean(axis=0)
    return l.mean(), l[h//2:].mean(), step, c
for p in sys.argv[1:]:
    m,lo,s,c=read(p)
    print('%-52s level %.2f lower half %.2f step %.3f colour %.2f %.2f %.2f'%(p[-40:],m,lo,s,c[0],c[1],c[2]))
