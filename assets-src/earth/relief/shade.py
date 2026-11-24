import json, os, sys
import numpy as np, cv2
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import geom
import body
import pack

W, H = 2816, 1584
STOP = 'src/stops/earth'
STEP = 4
REACH = 2.4
N = 240


def field(path, box, size):
    x0, y0, bw, bh = box
    out = np.zeros((H, W), np.float32)
    out[y0:y0 + bh, x0:x0 + bw] = cv2.resize(pack.unpack(path, (size[1], size[0])), (bw, bh), interpolation=cv2.INTER_LINEAR)
    return out


def main():
    sun = np.array([float(v) for v in sys.argv[1:4]])
    src, out = sys.argv[4], sys.argv[5]
    rel = json.load(open(f'{STOP}/relief.json'))
    t = rel['towers']
    lift = field(f'public/assets/earth/full/{t["dist"]}', t['box'], t['distSize'])
    half = field(f'{src}/relief-body.bin', t['box'], t['distSize'])
    on = body.support()
    X, Y = geom.grid(0, 0, W, H, W, H, STEP)
    d = geom.rays(X, Y, W, H)
    sea, hit, _ = geom.ground(d)
    Xf, Yf = geom.grid(0, 0, W, H, W, H)
    seaf, _, _ = geom.ground(geom.rays(Xf, Yf, W, H))
    mid = (seaf * (1 - lift)).astype(np.float32)
    front = np.where(on, mid * (1 - half), 1e9).astype(np.float32)
    backs = np.where(on, mid * (1 + half), -1e9).astype(np.float32)
    f = (H / 2) / np.tan(np.radians(geom.VFOV) / 2)
    P = d * sea[..., None]
    shade = np.zeros(X.shape, bool)
    for k in range(1, N + 1):
        Q = P + sun * (REACH * k / N)
        z = -Q[..., 2]
        u = (Q[..., 0] / z * f + W / 2).astype(np.float32)
        v = (H / 2 - Q[..., 1] / z * f).astype(np.float32)
        r = np.linalg.norm(Q, axis=-1)
        a = cv2.remap(front, u - 0.5, v - 0.5, cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=1e9)
        b = cv2.remap(backs, u - 0.5, v - 0.5, cv2.INTER_NEAREST, borderMode=cv2.BORDER_CONSTANT, borderValue=-1e9)
        shade |= (z > 0) & (r >= a) & (r <= b)
    shade &= hit
    image = cv2.imread('references/approved/earth-close.jpg')
    small = cv2.resize(image, (W // STEP, H // STEP), interpolation=cv2.INTER_AREA)
    grey = small.astype(np.float32).mean(-1)
    wide = cv2.GaussianBlur(grey, (0, 0), 40)
    tower = cv2.resize(on.astype(np.uint8), (W // STEP, H // STEP), interpolation=cv2.INTER_AREA) > 0
    sea_only = hit & ~tower
    dark = grey / np.maximum(wide, 1)
    print('sea texels in the cast shadow: %.4f of the sea; picture level over its 40 px surround: in the cast shadow %.3f, outside %.3f' % (float(shade[sea_only].mean()), float(dark[sea_only & shade].mean()), float(dark[sea_only & ~shade].mean())))
    view = small.copy()
    edge = cv2.morphologyEx(shade.astype(np.uint8), cv2.MORPH_GRADIENT, np.ones((3, 3), np.uint8)) > 0
    view[edge] = (0, 0, 255)
    cv2.imwrite(out, view, [cv2.IMWRITE_JPEG_QUALITY, 90])


if __name__ == '__main__':
    main()
