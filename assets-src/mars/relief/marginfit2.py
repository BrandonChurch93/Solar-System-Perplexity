import json, numpy as np, cv2
up = cv2.imread('out/work/mars-upscaled.png')
X0, Y0, IW, IH, CW, CH = 3600, 600, 2032, 1524, 2708, 1524
t = cv2.resize(cv2.imread('out/work/margin-t2.png'), (CW, CH), interpolation=cv2.INTER_LANCZOS4)
ref = up[Y0:Y0 + IH, X0:X0 + IW]
gr = cv2.cvtColor(ref, cv2.COLOR_BGR2GRAY).astype(np.float32); gt = cv2.cvtColor(t, cv2.COLOR_BGR2GRAY).astype(np.float32)
tmpl = np.zeros_like(gt); tmpl[:, :IW] = gr
mask = np.zeros(gt.shape, np.uint8); mask[100:, :IW] = 1
warp = np.eye(2, 3, dtype=np.float32)
cc, warp = cv2.findTransformECC(tmpl, gt, warp, cv2.MOTION_AFFINE, (cv2.TERM_CRITERIA_EPS | cv2.TERM_CRITERIA_COUNT, 200, 1e-6), mask, 5)
ta = cv2.warpAffine(t, warp, (CW, CH), flags=cv2.INTER_LANCZOS4 | cv2.WARP_INVERSE_MAP, borderMode=cv2.BORDER_REFLECT)
fl = cv2.calcOpticalFlowFarneback(gr.astype(np.uint8), cv2.cvtColor(ta[:, :IW], cv2.COLOR_BGR2GRAY), None, 0.5, 4, 25, 5, 7, 1.5, 0)
mag = np.hypot(fl[..., 0], fl[..., 1])
ring = np.zeros(mag.shape, bool); ring[100:, -120:] = True
res = dict(take='t2', ecc=float(cc), warp=warp.tolist(), innerFlowMedian=float(np.median(mag[100:])), innerFlowP99=float(np.percentile(mag[100:], 99)),
           edgeRingFlowMedian=float(np.median(mag[ring])), edgeRingFlowP99=float(np.percentile(mag[ring], 99)),
           edgeRingMeanAbs=float(np.abs(ta[:, :IW].astype(np.float32) - ref)[ring].mean()))
print(json.dumps(res, indent=1)); json.dump(res, open('out/work/marginfit-t2.json', 'w'), indent=1)
cv2.imwrite('out/work/margin-t2-aligned.png', ta)
