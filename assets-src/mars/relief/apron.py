from pathlib import Path
import json

import cv2
import numpy as np
from PIL import Image
from scipy.ndimage import gaussian_filter1d


meta = json.loads(Path('src/stops/mars/relief.json').read_text())
cfg = meta['apron']


def pack(src, w, h, left, right, bottom, pad):
    slab_height = bottom + pad if bottom else 0
    left_height = left + pad if left else 0
    right_height = right + pad if right else 0
    side_span = h + min(bottom, pad)
    tiles = np.zeros((slab_height + left_height + right_height, max(w + left + right if bottom else 0, side_span), *src.shape[2:]), src.dtype)
    if bottom:
        tiles[:slab_height, :w + left + right] = src[h-pad:h+bottom]
    if left:
        tiles[slab_height:slab_height+left_height, :side_span] = src[:side_span, :left+pad].swapaxes(0, 1)
    if right:
        tiles[slab_height+left_height:, :side_span] = src[:side_span, left+w-pad:].swapaxes(0, 1)
    return tiles


def color_apron(src, left, right, bottom, target):
    h, w = src.shape[:2]
    y, x = np.ogrid[:h+bottom, -left:w+right]
    sx = np.where(x < 0, -x, np.maximum(x-w+1, 0)).astype(np.float32)
    down = np.maximum(y-h+1, 0).astype(np.float32)
    shear = target['textureShear']
    bend = target.get('textureBend', cfg['textureBend'])
    dy = bend * sx * np.minimum(sx / max(left, right, 1), 1)
    dx = bend * down * np.minimum(down / max(bottom, 1), 1)
    ay, ax = dy, dx
    if left and bottom:
        a, b = cfg['textureFade']
        fade = np.clip((y/h-a)/(b-a),0,1)
        fade = fade*fade*(3-2*fade)
        dy = dy + sx * fade * np.where(x < 0, shear[0], shear[1])
        dx = dx + down * shear[2]
    else:
        dy = ay = dy + sx * np.where(x < 0, shear[0], shear[1])
    mx = (x+dx).astype(np.float32)
    my = (y+dy).astype(np.float32)
    result = cv2.remap(src, mx, my, cv2.INTER_LINEAR, borderMode=cv2.BORDER_REFLECT)
    result[...,3] = cv2.remap(src[...,3], (x+ax).astype(np.float32), (y+ay).astype(np.float32), cv2.INTER_LINEAR, borderMode=cv2.BORDER_REPLICATE)
    return result


def edge_slope(buffer, fit, span):
    offsets = np.arange(1, min(fit, buffer.shape[-1]))
    edge = buffer[..., 0]
    slope = np.median((buffer[..., 1:len(offsets)+1]-edge[...,None]) / offsets, axis=-1)
    limit = cfg['depthSlopeLimit'] * edge / max(span,1)
    return np.clip(gaussian_filter1d(slope, max(fit / 10, 1)), -limit, limit)


def depth_apron(src, left, right, bottom, box, scale):
    h, w = src.shape
    x0, y0 = box['x'], box['y']
    f = meta['camera']['focalPxFull']
    cx, cy = meta['camera']['principalPointFull']
    yy, xx = np.ogrid[:h+bottom, -left:w+right]
    xn = (x0 + (xx + .5) * scale - cx) / f
    yn = (y0 + (yy + .5) * scale - cy) / f
    length = np.sqrt(1 + xn*xn + yn*yn)
    base = length[:h,left:left+w] / src
    fit = round(cfg['depthFit'] / scale)
    inv = np.empty(length.shape, np.float32)
    inv[:h,left:left+w] = base
    if left:
        inv[:h,:left] = base[:,:1] - edge_slope(base,fit,left)[:,None] * np.arange(left,0,-1)
    if right:
        inv[:h,left+w:] = base[:,-1:] - edge_slope(base[:,::-1],fit,right)[:,None] * np.arange(1,right+1)
    if bottom:
        cut = inv[:h].T[:,::-1]
        inv[h:] = cut[:,0] - np.arange(1,bottom+1)[:,None] * edge_slope(cut,fit,bottom)
    return (length / inv).astype('<f4')


for target in cfg['layers']:
    layer = meta['layers'][target['layer']]
    for setname, scale in [('full', 1), ('web', 2)]:
        left, right, bottom = [v // scale for v in target['edges']]
        pad = cfg['padding'] // scale
        files = layer['files'][setname]
        color = cv2.imread(files['color'], cv2.IMREAD_COLOR)
        alpha = cv2.imread(files['alpha'], cv2.IMREAD_GRAYSCALE)
        h, w = alpha.shape
        rgba = np.dstack([color[:,:,::-1], alpha])
        resolution = cfg['resolution'][setname]
        margin = [int(v*resolution) for v in [left,right,bottom,pad]]
        tex_src = color_apron(rgba,left,right,bottom,target)
        if resolution != 1:
            tex_src = cv2.resize(tex_src,None,fx=resolution,fy=resolution,interpolation=cv2.INTER_AREA)
        tex = pack(tex_src,int(w*resolution),int(h*resolution),*margin)
        out = Path(f'public/assets/mars/{setname}')
        Image.fromarray(tex).save(out/target['atlas'], lossless=True, method=4, exact=True)
        dw, dh = layer['distSize'][setname]
        dist = np.fromfile(files['dist'], '<f4').reshape(dh,dw)
        d = depth_apron(dist,left//2,right//2,bottom//2,layer['box'],scale*2)
        if resolution != 1:
            d = cv2.resize(d,None,fx=resolution,fy=resolution,interpolation=cv2.INTER_AREA)
        pack(d,int(dw*resolution),int(dh*resolution),*[v//2 for v in margin]).tofile(out/target['depth'])
        print(setname, target['layer'], tex.shape[:2], 'depth range', float(d.min()), float(d.max()), flush=True)
