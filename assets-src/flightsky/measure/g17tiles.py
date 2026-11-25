import sys, numpy as np
sys.path.insert(0, 'tools/measure')
import g17
def ratios(film, approved):
    fy = g17.luma(film); h, w = fy.shape; ay = g17.luma(approved, (w, h)); gx, gy = g17.DEFINITION['grid']
    ft = g17.tiles(fy, g17.band(fy), gx, gy); at = g17.tiles(ay, g17.band(ay), gx, gy)
    floor = max(2e-5, 0.05 * float(np.percentile(np.array([t[3] for t in at]), 90)))
    return {(a[0], a[1]): f[3] / a[3] for f, a in zip(ft, at) if a[2] > g17.DEFINITION['tileMeanLumaFloor'] and a[3] > floor}
if __name__ == '__main__':
    appr = sys.argv[1]; base = None
    for f in sys.argv[2:]:
        r = ratios(f, appr); v = np.array(list(r.values()))
        under = sorted([(k, round(x, 3)) for k, x in r.items() if x < 0.8], key=lambda t: t[1])
        line = f"{'/'.join(f.split('/')[-2:])}: G17 tiles {len(v)}, median {np.median(v):.3f}, 25th {np.percentile(v, 25):.3f}, under 0.8: {len(under)} {under}"
        if base is None: base = r
        else:
            cross = [(k, round(base[k], 3), round(r[k], 3)) for k in r if k in base and (base[k] < 0.8) != (r[k] < 0.8)]
            line += f' | tiles that cross 0.8 against the first: {cross}'
        print(line)
