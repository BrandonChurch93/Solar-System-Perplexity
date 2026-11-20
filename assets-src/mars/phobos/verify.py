import ctypes
import json
import os
import subprocess

import cv2
import numpy as np
from PIL import Image

from build import (ASSETS, OUT, HERE, B, CAMERA, CENTER, ORIGIN, RADIUS, SUN, STICKNEY,
                   direction, unit, spherical_sample, target_mask, to_ref)


def srgb(x):
    x = np.maximum(x,0)
    return np.clip(np.where(x<.0031308,12.92*x,1.055*x**(1/2.4)-.055),0,1)


def linear(x):
    return np.where(x<.04045,x/12.92,((x+.055)/1.055)**2.4)


def norm(loc, n):
    a = np.diff(loc,axis=1,append=loc[:,-1:])
    a[:,-1] = a[:,0]
    b = np.diff(loc,axis=0,append=loc[-1:])
    b[-1] = b[-2]
    f = unit(np.cross(b,a))
    g = f + np.roll(f,1,axis=0) + np.roll(f,1,axis=1) + np.roll(np.roll(f,1,axis=0),1,axis=1)
    g[0], g[-1] = n[0], n[-1]
    return unit(g)


def raster(lib, xy, depth, w, h, attrs=True):
    rows, cols = depth.shape
    arr = np.ascontiguousarray(np.dstack([xy,depth]),dtype="f")
    z = np.full((h,w),-np.inf,dtype="f")
    ix = np.full((h,w,3),-1,np.int32) if attrs else None
    wa = np.zeros((h,w,3),np.float32) if attrs else None
    def ptr(a):
        return None if a is None else ctypes.c_void_p(a.ctypes.data)
    lib.raster(w,h,cols,rows,ptr(arr),ptr(z),ptr(ix),ptr(wa))
    return z, ix, wa


def shadow(lib, loc, at, light, px=1536):
    first = unit(np.cross([0,1,0],light))
    basis = np.stack([first,np.cross(light,first),light],-1)
    l = loc @ basis
    a = at @ basis
    f = px / 2.85
    tile = raster(lib,l[...,:2]*f+px/2,l[...,2],px,px,attrs=False)[0]
    tile[tile==-np.inf] = -10
    p = a[:,:2]*f+px/2-.5
    ox, oy = p.T
    xa, ya = np.rint(ox).astype(int), np.rint(oy).astype(int)
    occ = np.zeros(len(at),np.float64)
    for dx,dy in [(0,0),(-1,0),(1,0),(0,1),(0,-1)]:
        occ += (tile[np.clip(ya+dy,0,px-1),np.clip(xa+dx,0,px-1)]<a[:,2]+.0043)
    return occ/5


def render(lib, loc, n, rgb, projection, light, w, h, gain, ambient):
    px, inv_z = projection(loc)
    depth, ids, weights = raster(lib,px,inv_z,w,h)
    seen = depth>-np.inf
    hits = ids[seen]
    vals = weights[seen]*inv_z.reshape(-1)[hits]
    vals /= vals.sum(axis=-1,keepdims=True)
    xyz = (loc.reshape(-1,3)[hits]*vals[...,None]).sum(axis=1)
    normal = unit((n.reshape(-1,3)[hits]*vals[...,None]).sum(axis=1))
    albedo = spherical_sample(rgb,unit(xyz).reshape(-1,1,3)).reshape(-1,3) if len(xyz)<32767 else np.concatenate([
        spherical_sample(rgb,unit(xyz[i:i+20000]).reshape(-1,1,3)).reshape(-1,3)
        for i in range(0,len(xyz),20000)
    ])
    oc = shadow(lib,loc,xyz,light) if os.getenv("PHOBOS_SHADOW") else 1
    diffuse = np.maximum(normal @ light,0)*oc
    energy = ambient+gain*diffuse
    value = srgb(linear(albedo/255)*energy[...,None]*np.array([1.15,1.,.80]))
    result = np.zeros((h,w,3),np.uint8)
    result[seen] = np.rint(255*value).astype(np.uint8)
    return result, seen


def verify(approved):
    lib_path = OUT/"raster.so"
    subprocess.run(["g++","-std=c++17","-O3","-fPIC","-shared",str(HERE/"raster.cpp"),
                    "-o",str(lib_path)],check=True)
    lib = ctypes.CDLL(str(lib_path))
    meta = json.loads((HERE/"phobos.json").read_text())
    lon = np.linspace(-np.pi,np.pi,1025)
    lat = np.linspace(np.pi/2,-np.pi/2,513)
    d = direction(lon[None,:],lat[:,None])
    def hold_proj(loc):
        return to_ref(loc)+ORIGIN,1/((CAMERA[2]-CENTER[2])/RADIUS-loc @ B[2])
    ref = approved[1002:1502,1190:1750].copy()
    goal = target_mask()
    nearest = direction(*np.deg2rad([meta["stickney"]["lon"],meta["stickney"]["lat"]])).reshape(1,1,3)
    for name in ["full","web"]:
        s = meta["sets"][name]
        hw,hh = s["heightSize"]
        height = np.fromfile(ASSETS/name/"phobos-height.bin",dtype="<u2").reshape(hh,hw).astype("f")
        r = meta["lo"]+height/65535*(meta["hi"]-meta["lo"])
        color = np.asarray(Image.open(ASSETS/name/"phobos-color.jpg"))
        assert color.shape[1::-1] == tuple(s["colorSize"])
        loc = d*spherical_sample(r,d)[...,None]
        n = norm(loc,d)
        whole, whole_mask = render(lib,loc,n,color,hold_proj,unit(SUN @ B),2816,1584,3.4,.017)
        rgb, mask = whole[1002:1502,1190:1750], whole_mask[1002:1502,1190:1750]
        print(name, "height radius min/max",r.min(),r.max(),"color size",color.shape,"median gray",np.median(color),
              "mean seam LSB",np.abs(color[:,0].astype(float)-color[:,-1]).mean(),
              "mask sizes and IoU",int(mask.sum()),int(goal.sum()),(mask&goal).sum()/(mask|goal).sum())
        foot = to_ref(nearest*spherical_sample(r,nearest)[...,None])[0,0]
        print(name,"Stickney projection",foot+[1190,1002],"hero annotated",np.array(STICKNEY[:2])+[1190,1002],
              "offset px",np.linalg.norm(foot-STICKNEY[:2]))
        hold = ref.copy()
        hold[mask] = rgb[mask]
        background = cv2.inpaint(cv2.cvtColor(ref,cv2.COLOR_RGB2BGR), np.uint8((goal&~mask)*255), 3, cv2.INPAINT_TELEA)
        hold[goal&~mask] = cv2.cvtColor(background,cv2.COLOR_BGR2RGB)[goal&~mask]
        outline = ref.copy()
        outline[goal & ~mask] = (232,78,42)
        outline[mask & ~goal] = (48,214,186)
        print(name,"hold mean abs RGB LSB",np.abs(ref[mask&goal].astype(float)-rgb[mask&goal]).mean())
        Image.fromarray(np.hstack([ref,hold])).save(OUT/f"{name}-comparison.png")
        Image.fromarray(outline).save(OUT/f"{name}-outline.png")
        if name == "web":
            continue
        full = approved.copy()
        full[1002:1502,1190:1750] = hold
        Image.fromarray(full).save(OUT/"full-hold.png")
        Image.fromarray(np.dstack([whole,whole_mask.astype(np.uint8)*255])).save(OUT/"full-body-rgba.png")
        others = []
        for v in [[0,0,-1],[.001,1,.002],[.001,-1,.002]]:
            forward = unit(np.array(v,dtype=float))
            up = [0,1,0] if np.abs(forward[1])<.95 else [0,0,1]
            right = unit(np.cross(up,forward))
            back = np.stack([right,np.cross(forward,right),forward],-1)
            def alt_projection(pos):
                p = pos @ back
                inv_z = 1/(7-p[...,2])
                return p[...,:2]*np.array([1320,-1320])*inv_z[...,None]+[250,250],inv_z
            alt = render(lib,loc,n,color,alt_projection,unit(back @ [-.25,.30,.98]),500,500,2.85,.025)[0]
            others.append(alt)
        Image.fromarray(np.hstack(others)).save(OUT/"back-poles.png")
