import sys, json, numpy as np
F = 540 / np.tan(np.radians(15))
AIM = [-0.1891262280154618, 0.10468355614156852, 0.6530252190059835, 0.7258310315027776]
def rot(q):
    x, y, z, w = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])
def cone(rect, centre, radius):
    tc = np.array([rect[0] + centre[0] * (rect[2] - rect[0]), rect[1] + centre[1] * (rect[3] - rect[1])])
    rt = radius * (rect[2] - rect[0])
    v = np.array([1, 0, tc[0]]); w = np.array([0, 1, tc[1]]); e = np.array([0, 0, 1.0])
    q = np.outer(v, v) + np.outer(w, w) - rt * rt * np.outer(e, e)
    ra = rot(AIM)
    return ra @ q @ ra.T
def cone2(rect, e):
    size = rect[2] - rect[0]
    o = np.array([rect[0] + 0.5 * size, rect[1] + 0.5 * size])
    c = np.array([[e[0], e[1] / 2, e[3] / 2], [e[1] / 2, e[2], e[4] / 2], [e[3] / 2, e[4] / 2, -1]])
    t = np.array([[1 / size, 0, -o[0] / size], [0, 1 / size, -o[1] / size], [0, 0, 1]])
    d = np.diag([1, 1, -1.0])
    q = d @ t.T @ c @ t @ d
    ra = rot(AIM)
    return ra @ q @ ra.T
def ellipse(qw, camq):
    r = rot(camq)
    qc = r.T @ qw @ r
    a = qc[:2, :2]; g = qc[:2, 2]; c = qc[2, 2]
    x0 = np.linalg.solve(a, g)
    k = g @ x0 - c
    return x0, a / k
def chords(x0, m, s, dirs):
    out = []
    for d in dirs:
        d = np.array(d, float); o = s - x0
        A = d @ m @ d; B = 2 * o @ m @ d; C = o @ m @ o - 1
        out.append((-B + np.sqrt(B * B - 4 * A * C)) / (2 * A) * F)
    return out
plate = json.load(open('src/stops/mercury/sunplate.json'))
disc = json.load(open('assets-src/sun/leave/disc.json'))
flip = len(sys.argv) > 3 and sys.argv[3] == 'flip'
centre = [disc['centre'][0], 1 - disc['centre'][1] if flip else disc['centre'][1]]
painted = cone2(plate['rect'], disc['conic']) if 'conic' in disc and not flip else cone(plate['rect'], centre, disc['radius'])
stated = cone(plate['rect'], [0.5, 0.5], plate['disc'])
if len(sys.argv) > 1 and sys.argv[1] != '-':
    cams = {}; suns = {}
    for line in open(sys.argv[1], errors='ignore'):
        i = line.find('{"t"')
        if i < 0: continue
        r = json.loads(line[i:])
        f = int(round(r['t'] * 30 - 0.25))
        if 'camq' in r: cams[f] = r['camq']
        if 'sun' in r and isinstance(r['sun'], list): suns[f] = np.array([r['sun'][0] / -r['sun'][2], r['sun'][1] / -r['sun'][2]])
    dirs = ((-1, 0), (1, 0), (0, 1), (0, -1), (-0.7071, -0.7071), (0.7071, -0.7071), (-0.7071, 0.7071), (0.7071, 0.7071))
    for f in sorted(cams):
        if f not in suns: continue
        for name, qw in (('stated', stated), ('painted', painted)):
            x0, m = ellipse(qw, cams[f])
            w = np.linalg.eigvalsh(m)
            ch = chords(x0, m, suns[f], dirs)
            print(f'f{f} {name}: centre from the engine Sun {(x0[0]-suns[f][0])*F:+.1f} right, {(x0[1]-suns[f][1])*F:+.1f} up; half axes {F/np.sqrt(w[0]):.1f}, {F/np.sqrt(w[1]):.1f}; limb left {ch[0]:.1f} right {ch[1]:.1f} up {ch[2]:.1f} down {ch[3]:.1f} SW {ch[4]:.1f} SE {ch[5]:.1f} NW {ch[6]:.1f} NE {ch[7]:.1f}')
if len(sys.argv) > 2 and sys.argv[2] != '-':
    q = painted / np.abs(painted).max()
    json.dump({'source': 'cone of world directions through the painted limb of the pale Sun plate of the Mercury stop: picture public/assets/mercury/full/sun-plate.webp (disc by assets-src/sun/leave/disc.py), rect of src/stops/mercury/sunplate.json, the fixed aim of the plate in sun.travel; d Q d = 0 on the limb, Q as xx, xy, xz, yy, yz, zz', 'aim': AIM, 'rect': plate['rect'], 'disc': disc, 'cone': [round(float(x), 9) for x in (q[0, 0], q[0, 1], q[0, 2], q[1, 1], q[1, 2], q[2, 2])]}, open(sys.argv[2], 'w'), indent=1)
