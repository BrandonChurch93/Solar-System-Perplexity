import sys
import numpy as np
from PIL import Image
from scipy import ndimage as ndi
a=np.asarray(Image.open('references/approved/sun-close.jpg').convert('RGB')).astype(float)/255
H,W=a.shape[:2]
pics=[('appr',a)]
for p in sys.argv[1:]:
    pics.append((p.split('/')[-1][:14],np.asarray(Image.open(p).convert('RGB').resize((W,H),Image.LANCZOS)).astype(float)/255))
res={}
yy,xx=np.mgrid[0:H,0:W]
for n,x in pics:
    m=x.max(axis=2)
    g=ndi.gaussian_filter(m,6)
    reg=np.zeros_like(g,dtype=bool)
    reg[int(0.55*H):int(0.7*H),int(0.4*W):int(0.65*W)]=g[int(0.55*H):int(0.7*H),int(0.4*W):int(0.65*W)]<0.12
    if not reg.any():
        reg[int(0.55*H):int(0.7*H),int(0.4*W):int(0.65*W)]=g[int(0.55*H):int(0.7*H),int(0.4*W):int(0.65*W)]<0.22
        print('threshold 0.22')
    lab,k=ndi.label(reg)
    sizes=ndi.sum(reg,lab,range(1,k+1))
    i=1+int(np.argmax(sizes))
    ys,xs=np.nonzero(lab==i)
    cx,cy=xs.mean(),ys.mean()
    print(n,'umbra px',len(xs),'centre',round(cx/W,3),round(cy/H,3),'x extent',round((xs.max()-xs.min())/W,3),'y extent',round((ys.max()-ys.min())/H,3),'mean',round(m[lab==i].mean(),3),'p90',round(np.percentile(m[lab==i],90),3))
    res[n]=(cx,cy,(xs.max()-xs.min())/2,(ys.max()-ys.min())/2)
ax,ay=res['appr'][2],res['appr'][3]
cx,cy=res['appr'][0],res['appr'][1]
rr=np.hypot((xx-cx)/ax,(yy-cy)/ay)
print('rings about the approved umbra centre, in its half widths, from 0.4 by 0.3: p10/p50/p90')
for n,x in pics:
    m=x.max(axis=2)
    for side,msk in (('near',yy>cy+0.3*ay),('far',yy<cy-0.3*ay),('side',np.abs(yy-cy)<0.3*ay)):
        out=[]
        for r0 in np.arange(0.1,4.01,0.3):
            k=(rr>=r0)&(rr<r0+0.3)&msk
            v=m[k]
            if v.size<50:
                out.append('-'); continue
            out.append('%.2f/%.2f/%.2f'%(np.percentile(v,10),np.percentile(v,50),np.percentile(v,90)))
        print(n,side,' '.join(out))
