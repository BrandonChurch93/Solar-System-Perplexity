import sys
from PIL import Image
import numpy as np
from scipy import ndimage as ndi
def load(p):
    return np.asarray(Image.open(p).convert('RGB').resize((1920,1080),Image.LANCZOS),dtype=np.float32)/255
box=(700,860,1050,1040)
names=sys.argv[1:]
out=Image.new('RGB',(1404,364*len(names)))
for k,n in enumerate(names):
    p='references/approved/sun-close.jpg' if n=='appr' else f'out/work/sun/lab/lab-90-{n}.png'
    a=load(p); r=a[...,0]
    g=np.hypot(ndi.sobel(r,1)/8,ndi.sobel(r,0)/8)
    q=r[800:1080]; gq=g[800:1080]
    print(n,'grad p25 p50 p99',np.round(np.percentile(gq,[25,50,99]),4),'flat<0.005',round(float((gq<0.005).mean()),3),'dark flat<0.01 (r<0.5)',round(float(((gq<0.01)&(q<0.5)).mean()),3),'bright flat',round(float(((gq<0.01)&(q>=0.5)).mean()),3),'hard>0.15',round(float((gq>0.15).mean()),4))
    b=a.copy()
    f=(g<0.01)
    b[f&(r<0.5)]=[0.1,0.3,1.0]
    b[f&(r>=0.5)]=[0.0,0.8,0.8]
    b[g>0.15]=[0.1,1.0,0.1]
    out.paste(Image.fromarray((a*255).astype(np.uint8)).crop(box).resize((700,360),Image.LANCZOS),(0,k*364))
    out.paste(Image.fromarray((b*255).astype(np.uint8)).crop(box).resize((700,360),Image.NEAREST),(704,k*364))
out.save('/home/user/workspace/v/flat-'+names[-1]+'.jpg',quality=90)
