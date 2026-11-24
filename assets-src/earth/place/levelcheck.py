import json, math, os, subprocess, sys
from pathlib import Path
import numpy as np, cv2
R=str(Path(__file__).resolve().parents[3])+'/'
W=R+'out/work/earth/place/levelcheck/'
os.makedirs(W, exist_ok=True)
which=sys.argv[1] if len(sys.argv)>1 else 'full'
D=R+'public/assets/earth/'+which
tag=sys.argv[2] if len(sys.argv)>2 else ''
pj=json.load(open(R+'src/stops/earth/place.json'))
P=pj['plates']
spot=(-77.4757, 18.1499)
centre=(P['centre']['lon'], P['centre']['lat'])
def frame(lon,lat):
    lo,la=math.radians(lon),math.radians(lat)
    n=np.array([math.cos(la)*math.cos(lo), math.cos(la)*math.sin(lo), math.sin(la)])
    e=np.array([-math.sin(lo), math.cos(lo), 0.0])
    u=np.cross(n,e)
    return n,e,u
def lev(l):
    t=math.tan(math.radians(l['widthDeg'])/2)
    r=l.get('raster'); s=l.get('size'); o=l.get('offset',[0,0])
    half=t*(s/r if r else 1)
    c=(o[0]/r*2*t, o[1]/r*2*t) if r else (0,0)
    return half,c
def arg(name,half,c):
    return '%s:%.6f:%.6f,%.6f'%(name, 2*math.degrees(math.atan(half)), math.degrees(math.atan(c[0])), math.degrees(math.atan(c[1])))
def run(args, panel=None):
    cmd=['python3', R+'assets-src/shared/globe-levels.py','--dir',D]+sum([['--level',a] for a in args],[])
    if panel: cmd+=['--panel',panel]
    r=subprocess.run(cmd,capture_output=True,text=True)
    print(r.stdout.strip()); 
    if r.stderr.strip(): print('ERR', r.stderr.strip()[-400:])
    print('exit', r.returncode)
under=P['under']; levels=P['levels']
print('== under, the plane about the spot:', which)
run([arg(l['file'],*lev(l)) for l in under], W+'under-%s%s.png'%(which,tag))
print('== place, the plane about the centre:', which)
run([arg(l['file'],*lev(l)) for l in levels], W+'place-%s%s.png'%(which,tag))
low=P['low']
if 'file' in low:
    lw=dict(low['window']); lw['widthDeg']=levels[0]['widthDeg']
    print('== plate against the low look (place-12 -> place-12-low):', which)
    run([arg(levels[0]['file'],*lev(levels[0])), arg(low['file'],*lev(lw))], W+'low-%s%s.png'%(which,tag))
else:
    print('== no low look: the plate holds the lay back itself:', which)
def warp(l, out):
    from PIL import Image
    Image.MAX_IMAGE_PIXELS=None
    im=cv2.imread(os.path.join(D,l['file']))
    n=im.shape[0]
    half,c=lev(l)
    nc,ec,uc=frame(*centre); ns,es,us=frame(*spot)
    pts=[]
    for sx in (-1,0,1):
        for sy in (-1,0,1):
            d=nc+ec*(c[0]+sx*half)+uc*(c[1]+sy*half)
            pts.append((d@es/(d@ns), d@us/(d@ns)))
    xs=[p[0] for p in pts]; ys=[p[1] for p in pts]
    cx=(max(xs)+min(xs))/2; cy=(max(ys)+min(ys))/2
    h2=min(max(xs)-min(xs), max(ys)-min(ys))/2*0.97
    m=n
    gx=(np.arange(m)+0.5)/m*2-1
    X,Y=np.meshgrid(cx+gx*h2, cy-gx*h2)
    d=ns[None,None,:]+X[...,None]*es[None,None,:]+Y[...,None]*us[None,None,:]
    dn=d@nc; a=(d@ec)/dn; b=(d@uc)/dn
    u=((a-c[0])/half*0.5+0.5)*n-0.5; v=(0.5-(b-c[1])/half*0.5)*n-0.5
    o=cv2.remap(im,u.astype(np.float32),v.astype(np.float32),cv2.INTER_LINEAR,borderMode=cv2.BORDER_REFLECT)
    inside=float(((u>=0)&(u<=n-1)&(v>=0)&(v<=n-1)).mean())
    cv2.imwrite(out,o)
    return h2,(cx,cy),inside
out=W+'place-on-spot-%s.png'%which
h2,c2,inside=warp(levels[0], out)
print('== last level under against the first place level, carried onto the plane about the spot (inside the file: %.3f):'%inside, which)
cmd=['python3', R+'assets-src/shared/globe-levels.py','--dir','/','--level',arg(os.path.join(D,under[-1]['file']).lstrip('/'),*lev(under[-1])),'--level',arg(out.lstrip('/'),h2,c2),'--panel',W+'cross-%s%s.png'%(which,tag)]
r=subprocess.run(cmd,capture_output=True,text=True); print(r.stdout.strip()); print(r.stderr.strip()[-300:]); print('exit', r.returncode)
