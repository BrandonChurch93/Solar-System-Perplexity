# usage: python3 assets-src/sun/lab/side.py PICTURE ... : is a cell lit from a side. In the box of the near field
# (cols 538 to 1190, rows 670 to 1037) the mean light 6 to 24 px from a lane pixel in eight directions; a lane
# pixel is one under 0.55 of its 12 px mean. Ground that gives its own light reads the same below and above a lane
import sys, numpy as np
from PIL import Image
from scipy import ndimage as ni
def lum(p):
    a=np.asarray(Image.open(p).convert('RGB')).astype(float)/255
    if a.shape[1]!=1920: a=np.asarray(Image.open(p).convert('RGB').resize((1920,1080),Image.LANCZOS)).astype(float)/255
    return a@np.array([0.3,0.5,0.2])
def run(p,box=(538,670,1190,1037)):
    L=lum(p); x0,y0,x1,y1=box
    S=ni.gaussian_filter(L,1.5)
    big=ni.gaussian_filter(L,12)
    lane=(S<0.55*big)
    out=[]
    for k in range(8):
        th=k*np.pi/4; dx,dy=np.cos(th),np.sin(th)
        acc=0;n=0
        for t in (6,10,14,18,24):
            sh=ni.shift(S,(-dy*t,-dx*t),order=1,mode='nearest')
            m=lane[y0:y1,x0:x1]
            acc+=sh[y0:y1,x0:x1][m].mean(); n+=1
        out.append(acc/n)
    out=np.array(out)
    return lane[y0:y1,x0:x1].mean(), out
names=['right','down-right','down','down-left','left','up-left','up','up-right']
for p in sys.argv[1:]:
    sh,o=run(p)
    print(p.split('/')[-1],'lane share %.3f'%sh,' '.join('%s %.3f'%(n,v) for n,v in zip(names,o)), '| down minus up %.3f, right minus left %.3f, dr minus ul %.3f'%(o[2]-o[6],o[0]-o[4],o[1]-o[5]))
