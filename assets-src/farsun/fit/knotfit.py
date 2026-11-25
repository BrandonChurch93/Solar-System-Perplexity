"""Recipe of the fitted knots of the face in src/space/farsun/look.json (`knot.at`, the entries with `out` 0).

The law of the far Sun's face is a function. Where the approved hero is brighter or darker than that law
over a region of the sphere, a knot stands: a bell on the sphere at a longitude and a latitude that lifts
the face toward white (gain over 0) or shades it with `knot.shadeColour` (gain under 0). This recipe finds
them: it blurs the approved image and a picture of frame 615 drawn with the look as it stands, lays
candidates on a hexagonal grid over the disc inside 0.9 radii, solves for their gains by bounded least
squares (0 to 0.8 bright, 0 to 0.9 dark), keeps the NMAX strongest, solves again and writes them with their
places on the sphere (fit/geopx.mts turns a pixel of frame 615 into the body's longitude and latitude with
the film's own camera, so every knot comes in by an angle).

Run from the repository root with the look of the picture in src/space/farsun/look.json:
  python3 assets-src/farsun/fit/knotfit.py PICTURE.png WIDTH OUT.json BLUR NMAX
The look of this commit: WIDTH 0.09 (radii), BLUR 12, NMAX 50, on a picture drawn with no fitted knot.
"""
import sys, json, os, subprocess, tempfile
import numpy as np
from PIL import Image, ImageFilter
from scipy.optimize import lsq_linear
A=Image.open('references/approved/mercury-hero.png').convert('RGB').resize((1920,1080),Image.LANCZOS)
M=Image.open(sys.argv[1]).convert('RGB')
w=float(sys.argv[2]); out=sys.argv[3]; S=float(sys.argv[4]) if len(sys.argv)>4 else 12
ab=np.asarray(A.filter(ImageFilter.GaussianBlur(S))).astype(np.float64)
mb=np.asarray(M.filter(ImageFilter.GaussianBlur(S))).astype(np.float64)
cx,cy,R=1892.1,63.4,443.7
X0,X1,Y0,Y1=1180,1920,0,760
yy,xx=np.mgrid[Y0:Y1,X0:X1]
res=(ab-mb)[Y0:Y1,X0:X1]; m0=mb[Y0:Y1,X0:X1]
rr=np.hypot(xx-cx,yy-cy)/R
face=(rr<0.93)
head=np.maximum(253.7-m0,1.0)
step=w*R*0.95
pts=[]
j=0; y=Y0+10
while y<Y1:
    x=X0+10+(step/2 if j%2 else 0)
    while x<X1+step:
        r=np.hypot(x-cx,y-cy)/R
        if r<0.9 and x<1915: pts.append((x,y))
        x+=step
    y+=step*0.866; j+=1
print(len(pts),'candidates, step %.0f px'%step)
sub=face[::3,::3]; idx=np.nonzero(sub)
def col(px,py,sign):
    e=np.exp(-((np.hypot(xx-px,yy-py)/(w*R))**2))[::3,::3]
    h=head[::3,::3]
    if sign>0: b=e[...,None]*h
    else:
        b=-e[...,None]*h[...,2:3]*np.array([0.09,0.36,1.0])
    return b[idx].ravel()
cols=[]; meta=[]
for p in pts:
    cols.append(col(p[0],p[1],1)); meta.append((p,1)); cols.append(col(p[0],p[1],-1)); meta.append((p,-1))
Amat=np.stack(cols,1); bvec=res[::3,::3][idx].ravel()
print('face mean abs residual before %.2f'%np.abs(bvec).mean())
sol=lsq_linear(Amat,bvec,bounds=(0,[0.8 if s>0 else 0.9 for _,s in meta]),max_iter=200)
g=sol.x
NMAX=int(sys.argv[5]) if len(sys.argv)>5 else 50
score={}
for i,((p,s_),v) in enumerate(zip(meta,g)): score[p]=score.get(p,0)+v*np.abs(Amat[:,i]).sum()
top=set(sorted(score,key=lambda p:-score[p])[:NMAX])
sel=[i for i,(p,s_) in enumerate(meta) if p in top]
sol=lsq_linear(Amat[:,sel],bvec,bounds=(0,[0.8 if meta[i][1]>0 else 0.9 for i in sel]),max_iter=200)
g=np.zeros(len(meta)); g[sel]=sol.x; fit=Amat@g
print('after (model) %.2f'%np.abs(bvec-fit).mean())
kn=[]
for (p,s),v in zip(meta,g):
    if v>0.04: kn.append((p[0],p[1],round(float(s*v),3)))
d={}
for x,y,v in kn: d[(x,y)]=d.get((x,y),0)+v
kn=[(x,y,round(v,3)) for (x,y),v in d.items() if abs(v)>0.04]
print(len(kn),'knots kept')
px=os.path.join(tempfile.mkdtemp(),'px.json'); json.dump([[k[0],k[1]] for k in kn],open(px,'w'))
ats=json.loads(subprocess.run(['npx','tsx','assets-src/farsun/fit/geopx.mts',px],capture_output=True,text=True).stdout.strip().splitlines()[-1])
res_k=[{"at":a,"width":w,"gain":k[2],"edge":1,"out":0,"rays":{"gain":0,"fine":20,"sharp":8,"reach":0.0383,"radius":0.2296,"cone":0}} for a,k in zip(ats,kn) if a]
json.dump(res_k,open(out,'w')); print(len(res_k),'written to',out)
