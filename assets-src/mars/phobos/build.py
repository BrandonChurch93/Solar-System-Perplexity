import argparse
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from scipy.interpolate import CubicSpline
from scipy.spatial.transform import Rotation

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
OUT = ROOT / "out/work/phobos"
CACHE = ROOT / "references/cache"
ASSETS = ROOT / "public/assets/mars"
FIT = json.loads((HERE.parent / "fit.json").read_text())
CAMERA = np.array(FIT["camera"]["position"])
CENTER = np.array(FIT["moons"][0]["position"])
SUN = np.array(FIT["sunDir"])
RADIUS = FIT["moons"][0]["radius"]
FOCAL = 792 / np.tan(np.deg2rad(FIT["vfovDeg"] / 2))
ORIGIN = np.array([1190., 1002.])
PRINCIPAL = np.array([1408., 792.]) - ORIGIN
DEPTH = np.linalg.norm(CAMERA - CENTER) / RADIUS
Z = (CAMERA - CENTER) / np.linalg.norm(CAMERA - CENTER)
X = np.cross([0, 1, 0], Z)
X /= np.linalg.norm(X)
B = np.column_stack([X, np.cross(Z, X), Z])
LO, HI = .53, 1.37
AZ = .91
RIM = np.array([
    [530,211],[526,196],[519,180],[508,162],[501,148],[490,132],[473,116],
    [449,94],[435,79],[415,63],[397,53],[382,42],[352,29],[332,26],
    [312,23],[289,23],[267,25],[247,26],[225,29],[211,34],[196,40],
    [179,48],[165,56],[144,66],[121,77],[104,85],[89,96],[77,106],
    [62,125],[52,142],[43,158],[38,175],[32,190],[29,207],[25,229],
    [24,248],[24,267],[25,288],[29,307],[36,325],[46,346],[54,361],
    [67,378],[83,392],[106,403],[123,409],[145,414],[166,421],
    [188,431],[210,440],[236,447],[258,452],[278,456],[296,457],
    [318,463],[342,468],[359,467],[380,464],[403,459],[424,454],
    [444,440],[461,423],[476,399],[489,374],[500,351],[513,324],
    [522,296],[527,271],[532,244],[532,228]
], np.float64)
STICKNEY = (398., 281., 67., 80., -.43, .169, .015)
CRATERS = np.array([
    STICKNEY,
    [83,271,8,16,-.29,.034,.006],[66,223,5,8,-.06,.025,.004],
    [139,239,7,6,.11,.020,.005],[182,222,6,6,.14,.019,.005],
    [216,191,8,13,.19,.032,.005],[232,150,4,4,.16,.010,.003],
    [239,105,12,8,-.12,.025,.007],[275,81,6,5,.11,.012,.004],
    [317,214,13,15,.30,.027,.007],[256,271,10,5,-.4,.022,.005],
    [365,191,5,6,.23,.013,.004],[405,173,7,11,.48,.024,.005],
    [405,142,5,7,-.60,.018,.004],[375,128,5,6,-.32,.013,.004],
    [385,101,5,6,-.67,.012,.004],[283,262,6,10,-.43,.011,.004],
    [117,288,9,7,.23,.024,.005],[194,253,8,6,.24,.018,.005],
    [161,199,5,5,.31,.009,.003],[143,145,5,5,.31,.009,.003],
    [124,175,7,7,.31,.011,.003],[377,376,21,10,-.38,.006,.001],
    [426,406,15,8,-.35,.005,.001],[271,384,12,7,.20,.005,.001],
    [308,395,11,6,.11,.005,.001],[438,232,6,8,-.14,.006,.0015],
    [467,294,11,7,.31,.005,.0015],[331,342,12,8,.31,.007,.0015]
])
HIDDEN = [
    (-147,28,10,.026),(-129,-16,15,.040),(-168,-17,7,.022),(-153,-48,8,.021),
    (145,13,18,.041),(162,38,9,.028),(117,-21,8,.018),(179,-38,12,.033),
    (154,-53,6,.016),(-118,48,7,.018),(119,59,9,.024),(-174,6,5,.014),
    (-99,37,7,.018),(139,-43,7,.025),(158,-12,5,.017),(-153,8,6,.018)
]


def unit(a):
    return a / np.maximum(1e-12, np.linalg.norm(a, axis=-1, keepdims=True))


def sstep(a, b, x):
    t = np.clip((x-a)/(b-a), 0, 1)
    return t*t*(3-2*t)


def direction(lon, lat):
    return np.stack(np.broadcast_arrays(np.sin(lon)*np.cos(lat), np.sin(lat),
                                       np.cos(lon)*np.cos(lat)), -1)


def grid(w, h):
    lon = ((np.arange(w, dtype="f")+.5)/w-.5)*2*np.pi
    lat = (.5-(np.arange(h, dtype="f")+.5)/h)*np.pi
    return direction(lon[None, :], lat[:, None])


def xy(a):
    return np.stack([a[..., 0]/-a[..., 2], a[..., 1]/a[..., 2]], -1)*FOCAL + PRINCIPAL


def to_ref(local_points):
    return xy(local_points @ B.T + (CENTER-CAMERA)/RADIUS)


def ray(s):
    a = (np.asarray(s)-PRINCIPAL)/FOCAL
    return np.stack([a[..., 0],-a[..., 1],np.full_like(a[..., 0],-1.)], -1)


RIM_RAYS = ray(RIM) @ B
RIM_UV = RIM_RAYS[:, :2] / -RIM_RAYS[:, 2,None]
RIM_ANGLE = np.mod(np.arctan2(RIM_UV[:, 1],RIM_UV[:, 0]), 2*np.pi)
ORDER = np.argsort(RIM_ANGLE)
THETA = RIM_ANGLE[ORDER]
SECTION = np.linalg.norm(RIM_UV, axis=-1)[ORDER]*np.sqrt(DEPTH**2-AZ**2)
SECTION = CubicSpline(np.r_[THETA, THETA[0]+2*np.pi], np.r_[SECTION,SECTION[0]], bc_type="periodic")


def angular_radius(d):
    return SECTION(np.arctan2(d[..., 1],d[..., 0]))


def base(d):
    a = angular_radius(d)
    z2 = d[..., 2]**2
    return 1/np.sqrt((1-z2)/(a*a)+z2/(AZ*AZ))


def spherical_sample(img, d, method=cv2.INTER_LINEAR):
    lon = np.arctan2(d[..., 0], d[..., 2])
    lat = np.arcsin(np.clip(d[..., 1],-1,1))
    h,w = img.shape[:2]
    x = np.asarray((lon/(2*np.pi)+.5)*w-.5, np.float32)
    y = np.asarray(np.clip((.5-lat/np.pi)*h-.5,0,h-1), np.float32)
    return cv2.remap(img, x, y, method, borderMode=cv2.BORDER_WRAP)


def screen_sample(img, ref):
    return cv2.remap(img, np.float32(ref[...,0]-.5), np.float32(ref[...,1]-.5),
                     cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)


def crater(x, y, rx, ry, tilt, depth, rim, ref, large):
    c,s = np.cos(tilt),np.sin(tilt)
    dx,dy = ref[..., 0]-x,ref[..., 1]-y
    u,v = (c*dx+s*dy)/rx,(-s*dx+c*dy)/ry
    t = np.sqrt(u*u+v*v)
    a = np.arctan2(v,u)
    t /= 1+(.058 if large else .04)*np.sin(a*3+.9)+.025*np.cos(a*7)
    pit = np.maximum(0, 1-t**2)**(1.14 if large else 1.48)
    if large:
        pit *= 1-.09*u+.23*v
    else:
        depth *= .86
    wall = np.exp(-((t-.99)/(.115 if large else .19))**2)
    return rim*wall*(.77+.23*np.cos(2*a+.6))-depth*pit


def trace_relief(ref):
    delta = np.zeros(ref.shape[:-1], np.float32)
    for j,row in enumerate(CRATERS):
        width = 1.65*max(row[2:4])
        select = (np.abs(ref[...,0]-row[0])<width)&(np.abs(ref[...,1]-row[1])<width)
        delta[select] += crater(*row, ref[select], not j)
    x,y = ref[...,0],ref[...,1]
    delta += .057*np.exp(-((x-287)/202)**2-((y-129)/97)**2)
    delta -= .053*np.exp(-((x-241)/160)**2-((y-337)/126)**2)
    lip = y - (285-49*np.exp(-((x-169)/105)**2)+18*np.exp(-((x-292)/62)**2))
    delta += .142*np.exp(-((x-140)/142)**2)*np.exp(-((lip+31)/58)**2)
    facet = x - (373+.61*(y-40)+.0012*(y-79)**2)
    delta -= .090*sstep(-13,31,facet)*np.exp(-((y-102)/88)**4)
    for i in range(16):
        off = (i-7.5)*7.7+2.8*np.sin(i*3.6)
        tx = 211+off+.64*(y-95)+.00165*(y-100)**2
        r = (x-tx)/(1.15+.28*np.cos(i*1.7))
        envelope = np.exp(-((y-(150+25*np.sin(i*1.98)))/(68+9*np.cos(i*2.1)))**4)
        delta += envelope*(-.00115*np.exp(-(r**2))+.00034*np.exp(-((r-1.85)**2)))
    return delta


def make_terrain():
    d = grid(2048,1024).astype(np.float64)
    z = d[..., 2]
    underlying = base(d)
    r = underlying.copy()
    near = z>.13
    weight = sstep(.13,.36,z[near])
    dn = d[near]
    for _ in range(7):
        ref = to_ref(dn*r[near,None])
        t = trace_relief(ref)
        r[near] = .38*r[near]+.62*(underlying[near]+t*weight)
    target = np.array(STICKNEY[:2])
    dist = np.linalg.norm(to_ref(d*r[...,None])-target,axis=-1)
    dist[z < .1] = np.inf
    stickney = d[np.unravel_index(np.argmin(dist),dist.shape)]
    (lon,lat) = np.arctan2(stickney[0],stickney[2]), np.arcsin(stickney[1])
    obs = direction(np.deg2rad(-51.),np.deg2rad(-2.))
    def east_north(p):
        east = unit(np.cross([0,1,0],p))
        return np.column_stack([east, np.cross(p,east), p])
    rot = east_north(obs) @ east_north(stickney).T
    dem = cv2.imread(str(CACHE / "Phobos_ME_HRSC_DEM_Global_2ppd.tif"), cv2.IMREAD_UNCHANGED)
    real = spherical_sample(dem.astype("f"),d @ rot.T,cv2.INTER_CUBIC)/11100
    raw = cv2.imread(str(CACHE / "Phobos_ME_SRC_Mosaic_Global_16ppd.tif"),cv2.IMREAD_GRAYSCALE)
    texture = cv2.resize(raw,(2880,1440),interpolation=cv2.INTER_AREA).astype("f")/255
    valid = sstep(.025,.12,texture)
    texture_hp = (texture - cv2.GaussianBlur(texture,(0,0),4.5))*.75
    texture_hp += (texture - cv2.GaussianBlur(texture,(0,0),16))*.25
    texture_hp *= valid
    high = spherical_sample(texture_hp,d @ rot.T)
    back = 1-sstep(-.77,-.12,z)
    r = r*(1-.83*back)+(1.02+.89*real)*.83*back
    r += .0085*high*back*sstep(.975,.89,np.abs(d[...,1]))
    r += .00165*field(d,37,23,131)+.00046*field(d,121,24,137)
    for a2,cut in hidden_craters(d):
        a = np.sqrt(np.maximum(a2,0))
        bowl = -cut*np.maximum(0,1-a2)**1.2
        wall = .19*cut*np.exp(-((a-1)/.205)**2)
        r += (bowl+wall)*sstep(.13,-.40,z)
    return r, rot, [float(np.rad2deg(lon)),float(np.rad2deg(lat))], texture_hp


def hidden_craters(d):
    for lon0,lat0,size,cut in HIDDEN:
        cen = direction(*np.deg2rad([lon0,lat0]))
        a2 = (1-np.sum(d*cen,axis=-1))/(1-np.cos(np.deg2rad(size)))
        yield a2,cut


def field(d, freq, n, seed):
    rng = np.random.default_rng(seed)
    result = np.zeros(d.shape[:-1],dtype="f")
    for v,p,k in zip(unit(rng.normal(size=(n,3))).astype("f"),rng.uniform(-np.pi,np.pi,n),rng.uniform(.71,1.46,n)):
        result += np.sin((d[...,0]*v[0]+d[...,1]*v[1]+d[...,2]*v[2])*(freq*k)+p)
    return result/np.sqrt(n/2)


def align(approved, path):
    high = np.asarray(Image.open(path).convert("RGB"))
    sw = cv2.resize(high,(560,560),interpolation=cv2.INTER_AREA)
    detector = cv2.SIFT_create(6000,contrastThreshold=.008)
    mask = np.zeros(approved.shape[:2],np.uint8)
    mask[35:320,44:420] = 255
    a, da = detector.detectAndCompute(cv2.cvtColor(sw,cv2.COLOR_RGB2GRAY),None)
    b, db = detector.detectAndCompute(cv2.cvtColor(approved,cv2.COLOR_RGB2GRAY),mask)
    pairs = [(a[x.trainIdx].pt,b[x.queryIdx].pt) for x,y in cv2.BFMatcher().knnMatch(db,da,k=2)
             if x.distance < .75*y.distance]
    aa,bb = map(np.ascontiguousarray,np.float32(pairs).transpose(1,0,2))
    affine, fit = cv2.estimateAffine2D(aa,bb,ransacReprojThreshold=6)
    delta = np.linalg.norm(aa @ affine[:,:2].T + affine[:,2]-bb,axis=-1)[fit[:,0]>0]
    print("Relight registration inliers/total, p50/p90/p99/max px:",
          len(delta),len(aa),np.quantile(delta,[.5,.9,.99,1]))
    factor = 3
    affine[:,:2] = affine[:,:2]*factor*560/np.array(high.shape[:2][::-1])
    affine[:,2] *= factor
    out = cv2.warpAffine(high,affine,(560*factor,500*factor),flags=cv2.INTER_CUBIC)
    return out, factor


def material(r, rot, texture_hp, approved, relight_path):
    flat,factor = align(approved,relight_path)
    gray = cv2.cvtColor(flat,cv2.COLOR_RGB2GRAY).astype("f")
    mask = target_mask()
    mask = cv2.resize(mask.astype("f"), None, fx=factor, fy=factor)
    mask = cv2.erode(mask,np.ones((factor*8+1,factor*8+1),np.uint8))
    def normalized_blur(img, radius):
        blur = cv2.GaussianBlur(img*mask,(0,0),radius)
        return blur/np.maximum(.00001,cv2.GaussianBlur(mask,(0,0),radius))
    broad = normalized_blur(gray,56)
    flat_lum = 102+(.17*(broad-90)+.68*(gray-broad))
    hue = np.clip(flat.astype("f")-gray[...,None],-19,18)
    flat_mat = np.clip(flat_lum[...,None]+hue*.41,48,153).astype("f")
    seen = cv2.cvtColor(approved,cv2.COLOR_RGB2GRAY).astype("f")
    seen = sstep(15,57,cv2.GaussianBlur(seen,(0,0),5))
    seen = cv2.resize(seen,(560*factor,500*factor),interpolation=cv2.INTER_LINEAR)
    Image.fromarray(np.uint8(flat_mat)).resize((560,500),Image.Resampling.LANCZOS).save(OUT/"aligned-material.png")
    dst = np.empty((2048,4096,3),np.uint8)
    for y in range(0,2048,128):
        yy = (.5-(np.arange(y,y+128,dtype="f")+.5)/2048)*np.pi
        xx = ((np.arange(4096,dtype="f")+.5)/4096-.5)*2*np.pi
        d = direction(xx[None,:],yy[:,None])
        er = spherical_sample(r.astype("f"),d)
        ref = to_ref(d*er[...,None])
        face = sstep(.13,.38,d[...,2])*screen_sample(mask,ref*factor)
        face *= screen_sample(seen,ref*factor)
        face *= 1-sstep(.90,.99,np.linalg.norm((ray(ref)@B)[...,:2]/
                       -(ray(ref)@B)[...,2,None],axis=-1)*np.sqrt(DEPTH**2-AZ**2)/angular_radius(d))
        face = np.clip(face,0,1)
        # Keep the original registration, but remove the relight's broad directional contrast.
        near = screen_sample(flat_mat,ref*factor)
        sky = d @ rot.T
        real_hp = spherical_sample(texture_hp,sky)*sstep(.995,.93,np.abs(sky[...,1]))
        strata = field(d,26,16,53)
        granular = field(d,267,16,96)+.40*field(d,588,12,62)
        mottling = 4.6*field(d,8,16,47)+2.3*field(d,82,14,74)+1.2*field(d,151,15,83)
        grain = 2.4*granular
        warmth = 2.4*field(d,12,9,19)
        weathering = np.zeros(d.shape[:2],np.float32)
        for a2,cut in hidden_craters(d):
            a = np.sqrt(np.maximum(a2,0))
            weathering += cut*(150*np.exp(-((a-1)/.17)**2)-195*np.maximum(0,1-a2)**1.2)
        v = 101 + 74*real_hp+2.6*strata+mottling+weathering
        far = np.stack([v+4+warmth,v+.7,v-4.3-warmth],-1)
        rgb = near*face[...,None]+far*(1-face[...,None])+grain[...,None]
        dst[y:y+128] = np.rint(np.clip(rgb,25,235)).astype(np.uint8)
    return dst


def target_mask():
    u = np.arange(560,dtype="f")[None,:]+.5
    v = np.arange(500,dtype="f")[:,None]+.5
    q = ray(np.stack(np.broadcast_arrays(u,v),-1)) @ B
    uv = q[...,:2]/-q[...,2,None]
    rad = np.linalg.norm(uv,axis=-1)*np.sqrt(DEPTH**2-AZ**2)
    return rad<angular_radius(uv)


def save(r, rgb, stickney):
    for group, s in [("full",1),("web",2)]:
        p = ASSETS / group
        p.mkdir(parents=True,exist_ok=True)
        height = r if s == 1 else r.reshape(512,2,1024,2).mean(axis=(1,3))
        assert height.min()>=LO and height.max()<=HI, (height.min(),height.max())
        np.rint((height-LO)/(HI-LO)*65535).astype("<u2").tofile(p/"phobos-height.bin")
        color = Image.fromarray(rgb)
        if s == 2:
            color = color.resize((2048,1024),Image.Resampling.LANCZOS)
        color.save(p/"phobos-color.jpg",quality=95,subsampling=0,optimize=True)
    data = {
        "radius": RADIUS, "lo": LO, "hi": HI, "center": CENTER.tolist(),
        "holdQuaternion": Rotation.from_matrix(B).as_quat().tolist(),
        "tumbleAxis": unit(np.array([.21,.94,.27])).tolist(),
        "stickney": {"lon": round(stickney[0],4), "lat": round(stickney[1],4)},
        "sets": {"full": {"colorSize": [4096,2048], "heightSize": [2048,1024]},
                 "web": {"colorSize": [2048,1024], "heightSize": [1024,512]}}
    }
    (HERE/"phobos.json").write_text(json.dumps(data,indent=2)+"\n")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--relight", type=Path, default=OUT/"flat-take-1.png")
    parser.add_argument("--check-only", action="store_true")
    args = parser.parse_args()
    cv2.setNumThreads(2)
    OUT.mkdir(parents=True,exist_ok=True)
    approved = np.asarray(Image.open(ROOT/"references/approved/mars-hero.png").convert("RGB"))
    if not args.check_only:
        r, rot, stickney, hp = make_terrain()
        rgb = material(r,rot,hp,approved[1002:1502,1190:1750],args.relight)
        save(r,rgb,stickney)
    from verify import verify
    verify(approved)


if __name__ == "__main__":
    main()
