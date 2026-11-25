"""Measures the tone of the takes against the laid picture under the picture's reach (plates.json takes.tone): scene values, medians.
  python3 assets-src/mars/place/taketone.py
"""
import sys,cv2,numpy as np
sys.path.insert(0,'assets-src/mars/place')
import geom
wl=np.array([0.2126,0.7152,0.0722],np.float32)
for n,p in (('r03','0p3'),('r07','0p7'),('r16','1p6'),('r38','3p8')):
    L=cv2.cvtColor(cv2.imread('assets-src/mars/place/laid/land-%s.jpg'%p),cv2.COLOR_BGR2RGB); c=1024
    L=cv2.resize(L,(c,c),interpolation=cv2.INTER_AREA).astype(np.float32)
    m=cv2.resize(cv2.imread('assets-src/mars/place/laid/land-%s-laid.png'%p,0),(c,c),interpolation=cv2.INTER_AREA)>250
    T=cv2.resize(cv2.cvtColor(cv2.imread('assets-src/mars/place/takes/%s-take1.png'%n),cv2.COLOR_BGR2RGB),(c,c),interpolation=cv2.INTER_AREA).astype(np.float32)
    SL=geom.scene_of(L/255.0); ST=geom.scene_of(T/255.0)
    a=np.log(np.maximum(SL[m],1e-4)); b=np.log(np.maximum(ST[m],1e-4))
    print(p,'mask %.3f'%m.mean(),'laid scene median',np.round(np.exp(np.median(a,0)),4),'take',np.round(np.exp(np.median(b,0)),4),'ratio',np.round(np.exp(np.median(a,0)-np.median(b,0)),3),
          'lum spread (log, 10th to 90th) laid %.2f take %.2f'%(np.subtract(*np.percentile(np.log(np.maximum(SL[m]@wl,1e-4)),[90,10])),np.subtract(*np.percentile(np.log(np.maximum(ST[m]@wl,1e-4)),[90,10]))),
          'take outside mask median',np.round(np.exp(np.median(np.log(np.maximum(ST[~m],1e-4)),0)),4))
