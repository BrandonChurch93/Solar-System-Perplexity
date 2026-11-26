"""The laid close ground's highlights brought to the made country's range, level by level, before the skirt.

The close picture shows its far plateau toward the low Sun up to thirty times as bright as the made country's plain under the
globe's light: a view toward the Sun through the picture's air. A plate holds one value for every eye, so from above the lay
of that plateau stands as a glowing fan on the plain. This step takes the laid ground's brightness above a knee down by a
power law (the colour's ratios kept): what is brighter stays brighter, in the same order and with the same pattern, inside the
range a ground of this country has. Below the knee and outside the laid footprint nothing is changed.

  PYTHONPATH=assets-src/mars/place python3 assets-src/mars/place/platetone.py --dir LAID --out OUT

LAID holds the plates after closelay.py and their land-*-laid.png (copied on to OUT). Values: plates.json, block tone.
"""
import argparse
import json
import os
import shutil
import cv2
import numpy as np
from PIL import Image, JpegImagePlugin
import geom

Image.MAX_IMAGE_PIXELS = None
ap = argparse.ArgumentParser()
ap.add_argument('--dir', required=True)
ap.add_argument('--out', required=True)
ap.add_argument('--plates', default='assets-src/mars/place/plates.json')
ap.add_argument('--levels', default='src/stops/mars/levels.json')
a = ap.parse_args()
K = json.load(open(a.plates))['tone']
os.makedirs(a.out, exist_ok=True)
LUM = np.array([0.2126, 0.7152, 0.0722], np.float32)
for L in [l for l in json.load(open(a.levels))['levels'] if l.get('own')]:
    f = Image.open(os.path.join(a.dir, L['file']))
    keep = (dict(f.quantization), JpegImagePlugin.get_sampling(f))
    plate = geom.scene_of(np.asarray(f.convert('RGB')).astype(np.float32) / 255)
    name = L['file'].replace('.jpg', '-laid.png')
    laid = cv2.imread(os.path.join(a.dir, name), cv2.IMREAD_GRAYSCALE).astype(np.float32) / 255
    lum = np.maximum(plate @ LUM, 1e-6)
    over = lum > K['knee']
    to = np.where(over, K['knee'] * np.power(lum / K['knee'], K['power']), lum)
    # a texel laid in part holds the laid value in part: the knee holds for it in full
    gain = 1 + (to / lum - 1) * np.clip(laid * 8, 0, 1)
    out = plate * gain[..., None]
    res = np.clip(geom.texel_of(out) * 255 + 0.5, 0, 255).astype(np.uint8)
    Image.fromarray(res).save(os.path.join(a.out, L['file']), 'JPEG', qtables=keep[0], subsampling=keep[1])
    if os.path.abspath(a.dir) != os.path.abspath(a.out):
        shutil.copy(os.path.join(a.dir, name), os.path.join(a.out, name))
    print('%s: over the knee on %.3f of the laid ground; brightest laid value %.2f to %.2f; %d bytes' % (L['file'], float((over & (laid > 0.5)).sum() / max((laid > 0.5).sum(), 1)), float(lum[laid > 0.5].max()) if (laid > 0.5).any() else 0, float((lum * gain)[laid > 0.5].max()) if (laid > 0.5).any() else 0, os.path.getsize(os.path.join(a.out, L['file']))), flush=True)
