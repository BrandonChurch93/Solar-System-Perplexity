# lens_table.py LENS_NOW LENS_TRIAL OUT.txt [range:E4_TRIAL.json[:E4_NOW.json]]...: the table of mail 1298 point 4. By film
# frame: the eye's distance from Saturn's centre (equatorial radii), the field of view (degrees), the radius of the
# globe's disc on screen (px at 1080 lines) and its change from the frame before (percent), for the lens as it is today
# and for the trial; then the px by which each of the three ring edges (B inner, B outer, outer) leaves its true circle
# about the axis, worst sector of azimuth, read from the trial's frames (and from today's where given).
# A range is "3340-3400"; the E4 files come from ring_edges.py.
import json, sys, numpy as np
A = json.load(open(sys.argv[1]))['frames']; B = json.load(open(sys.argv[2]))['frames']
def d(v): return float(np.linalg.norm(v['eye']))
def disc(dd, vf): return 540 / (np.tan(np.radians(vf) / 2) * np.sqrt(max(dd * dd - 1, 1e-9)))
ZONES = ('B inner', 'B outer', 'outer')
def edges(j, f):
    if j is None: return None
    e = j['frames'].get(str(f))
    if e is None: return None
    out = []
    for z in ZONES:
        v = e.get(z)
        out.append(None if (v is None or not v.get('by')) else (v['shape'], len(v['by'])))
    return out
def cell(e):
    if e is None: return '%-30s' % 'not read'
    return ' '.join(('%+6.2f/%-2d' % x) if x else '   .     ' for x in e).ljust(30)
out = ['frame  part    distance   today: fov  disc px  change %  trial: fov  disc px  change %  | trial: px off true circles (B inner, B outer, outer; worst sector/sectors read) | today: the same']
stats = []
for spec in sys.argv[4:]:
    parts = spec.split(':'); a0, a1 = [int(x) for x in parts[0].split('-')]
    jt = json.load(open(parts[1])) if len(parts) > 1 and parts[1] else None
    jn = json.load(open(parts[2])) if len(parts) > 2 and parts[2] else None
    worst = [0.0, 0.0, 0.0]; wf = [0, 0, 0]; ch = []
    for f in range(a0, a1 + 1):
        a, b, pa, pb = A[str(f)], B[str(f)], A[str(f - 1)], B[str(f - 1)]
        if 'none' in a: out.append('%d   no Saturn set' % f); continue
        ra, rb = disc(d(a), a['vfov']), disc(d(b), b['vfov'])
        ca = 100 * np.log(ra / disc(d(pa), pa['vfov'])) if 'none' not in pa else float('nan')
        cb = 100 * np.log(rb / disc(d(pb), pb['vfov'])) if 'none' not in pb else float('nan')
        et, en = edges(jt, f), edges(jn, f)
        if et:
            for i, x in enumerate(et):
                if x and abs(x[0]) > abs(worst[i]): worst[i] = x[0]; wf[i] = f
        ch.append((f, cb, rb, ca, ra))
        out.append('%d   %-7s %9.4f   %8.3f  %8.2f  %+8.3f   %8.3f  %8.2f  %+8.3f  | %s | %s' % (f, a['kind'], d(b), a['vfov'], ra, ca, b['vfov'], rb, cb, cell(et), cell(en) if jn else ''))
    out.append('')
    stats.append((a0, a1, worst, wf, ch))
out.append('IN SUM, the trial:')
for a0, a1, worst, wf, ch in stats:
    out.append('%d to %d: largest px off true circles: B inner %+.2f (frame %d), B outer %+.2f (%d), outer %+.2f (%d)' % (a0, a1, worst[0], wf[0], worst[1], wf[1], worst[2], wf[2]))
    for lab, ci in (('trial', 1), ('today', 3)):
        c = [(x[0], x[ci]) for x in ch if x[ci] == x[ci]]
        if len(c) < 3: continue
        lo = min(c, key=lambda x: x[1]); hi = max(c, key=lambda x: x[1])
        dd = [(c[i][0], c[i][1] - c[i - 1][1]) for i in range(1, len(c))]; wd = max(dd, key=lambda x: abs(x[1]))
        mono = 'grows at every frame' if lo[1] > 0 else ('shrinks at every frame' if hi[1] < 0 else 'turns')
        out.append('   %s: the disc %s; change a frame from %+.3f percent (frame %d) to %+.3f (frame %d); the rate changes by at most %.4f from one frame to the next (at %d)' % (lab, mono, lo[1], lo[0], hi[1], hi[0], abs(wd[1]), wd[0]))
open(sys.argv[3], 'w').write('\n'.join(out) + '\n')
print(len(out), 'lines')
