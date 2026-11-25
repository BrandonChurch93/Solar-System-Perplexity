import json, sys, numpy as np, cv2
from PIL import Image
poses = {p['k']: p for p in json.load(open('../m1012-pose.json'))}
W, H = 1920, 1080; LUMA = np.array([0.2126, 0.7152, 0.0722]); X0 = 1260
def rot(q):
    x, y, z, w = q
    return np.array([[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)], [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)], [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]])
def Kmat(fov):
    f = (H / 2) / np.tan(np.radians(fov) / 2)
    return np.array([[f, 0, -(W / 2 - 0.5)], [0, -f, -(H / 2 - 0.5)], [0, 0, -1.0]])
def hom(ka, kb):
    A, B = poses[ka], poses[kb]
    return Kmat(B['fov']) @ rot(B['rel']) @ rot(A['rel']).T @ np.linalg.inv(Kmat(A['fov']))
ks = list(range(5472, 5492))
res = {}
for d in sys.argv[1:]:
    lum = {k: (np.asarray(Image.open('%s/k%06d.png' % (d, k)).convert('RGB')).astype(np.float64) @ LUMA).astype(np.float32) for k in ks}
    row = []
    for ka, kb in zip(ks[:-1], ks[1:]):
        wb = cv2.warpPerspective(lum[kb], hom(ka, kb), (W, H), flags=cv2.INTER_CUBIC | cv2.WARP_INVERSE_MAP, borderValue=np.nan)
        m = np.isfinite(wb); m[:, :X0] = False; m[:12] = False; m[-12:] = False; m[:, -12:] = False
        dd = np.abs(wb - lum[ka])[m]; row.append((dd.mean(), (dd > 6).mean(), lum[ka][m].mean()))
    r = np.array(row); res[d] = r
    print(f'{d}: level {r[:, 2].mean():.2f} | left over, moving pairs 2736 to 2743.5: mean {r[:16, 0].mean():.3f}, at 2740.5 {r[9, 0]:.3f}, 2741 {r[10, 0]:.3f}, 2741.5 {r[11, 0]:.3f} | still pairs 2744 to 2745: {r[16:, 0].mean():.3f} | pixels over 6 levels moving {r[:16, 1].mean():.4f} still {r[16:, 1].mean():.4f}')
