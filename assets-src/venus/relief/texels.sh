for f in "$@"; do
  npm run -s still -- --frame $f --tier review --diag texels --out out/work/venus/tex-$f.png > /dev/null 2>&1
  python3 - $f <<'PY'
import sys, cv2, numpy as np
t = cv2.imread(f'out/work/venus/tex-{sys.argv[1]}.png').astype(np.float32)
c = t[..., 1] > 127
x = t[..., 2] / 255 * 2
v = x[c] if c.any() else np.array([9.0])
print(sys.argv[1], 'counted', round(float(c.mean()), 3), 'G13 share under 1.0 (1920 x 1080)', round(float((t[..., 2][c] < 127.5).mean()) if c.any() else 0.0, 5), 'under 1.5', round(float((v < 1.5).mean()), 4), 'under 2.0 (1.0 at uhd)', round(float((v < 1.999).mean()), 4), 'min', round(float(v.min()), 3))
PY
done
