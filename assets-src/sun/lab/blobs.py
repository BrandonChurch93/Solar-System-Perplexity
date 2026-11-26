import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
def wmed(sizes):
    s=np.sort(sizes); c=np.cumsum(s); return s[np.searchsorted(c,c[-1]/2)]
for p in ['references/approved/sun-close.jpg']+sys.argv[1:]:
    x=np.asarray(Image.open(p).convert('RGB').resize((1920,1080),Image.LANCZOS)).astype(float)/255
    m=x.max(axis=2)
    for r0,r1 in ((620,800),(800,1080)):
        s=m[r0:r1]
        out=[]
        for name,mask in (('bright>0.8',s>0.8),('bright>0.65',s>0.65),('dark<0.3',s<0.3),('dark<0.4',s<0.4)):
            lab,k=ndi.label(mask)
            sz=ndi.sum(mask,lab,range(1,k+1))
            out.append('%s share %.3f n %d wmed %d largest %.2f'%(name,mask.mean(),k,wmed(sz),sz.max()/sz.sum()))
        print(p.split('/')[-1][:16],r0,r1,' | '.join(out))
