import sys, json, numpy as np, cv2
take = sys.argv[1]
o = cv2.imread('references/approved/mars-close.jpg')
t = cv2.imread(f'out/work/margin-{take}.png')
CW, CH, OX = 3492, 1964, 338
t = cv2.resize(t, (CW, CH), interpolation=cv2.INTER_LANCZOS4)
go = cv2.cvtColor(o, cv2.COLOR_BGR2GRAY).astype(np.float32)
gt = cv2.cvtColor(t, cv2.COLOR_BGR2GRAY).astype(np.float32)
tmpl = np.zeros_like(gt); tmpl[:1584, OX:OX + 2816] = go
mask = np.zeros(gt.shape, np.uint8); mask[400:1584, OX:OX + 2816] = 1
warp = np.eye(2, 3, dtype=np.float32)
cc, warp = cv2.findTransformECC(tmpl, gt, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), mask, 5)
ta = cv2.warpAffine(t, warp, (CW, CH), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
inner = ta[:1584, OX:OX + 2816]
gi = cv2.cvtColor(inner, cv2.COLOR_BGR2GRAY)
fl = cv2.calcOpticalFlowFarneback(cv2.cvtColor(o, cv2.COLOR_BGR2GRAY), gi, None, 0.5, 4, 25, 5, 7, 1.5, 0)
mag = np.hypot(fl[..., 0], fl[..., 1])
ring = np.zeros((1584, 2816), bool); ring[400:, :60] = 1; ring[400:, -60:] = 1; ring[-60:, :] = 1
res = dict(take=take, ecc=float(cc), warp=warp.tolist(), innerFlowMedian=float(np.median(mag[400:])), innerFlowP99=float(np.percentile(mag[400:], 99)),
           edgeRingFlowMedian=float(np.median(mag[ring])), edgeRingFlowP99=float(np.percentile(mag[ring], 99)),
           edgeRingMeanAbs=float(np.abs(inner.astype(np.float32) - o)[ring].mean()))
print(json.dumps(res, indent=1))
json.dump(res, open(f'out/work/marginfit-{take}.json', 'w'), indent=1)
cv2.imwrite(f'out/work/margin-{take}-aligned.png', ta)
