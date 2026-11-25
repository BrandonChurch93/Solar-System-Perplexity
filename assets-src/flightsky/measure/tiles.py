import sys, numpy as np
sys.path.insert(0, '/home/user/workspace/c2/tools/measure')
import g17
before, after = sys.argv[1:3]
fy, ay = g17.luma(after), g17.luma(before)
ft, at = g17.tiles(fy, g17.band(fy), 12, 8), g17.tiles(ay, g17.band(ay), 12, 8)
floor = max(2e-5, 0.05 * np.percentile([t[3] for t in at], 90))
used = [(t[0], t[1], f[3] / t[3]) for f, t in zip(ft, at) if t[2] > 0.04 and t[3] > floor]
r = np.array([u[2] for u in used]); sky = np.array([u[2] for u in used if u[0] >= 8])
print(f'{after} over {before}: {len(r)} tiles used, median {np.median(r):.3f}, 25th {np.percentile(r, 25):.3f}, least {r.min():.3f} | sky right of the globe (columns 8 to 11, {len(sky)} tiles): median {np.median(sky):.3f}, least {sky.min():.3f}')
print('  tiles under 0.8 (column,row ratio):', ' '.join(f'{u[0]},{u[1]} {u[2]:.3f}' for u in sorted(used, key=lambda u: u[2]) if u[2] < 0.8) or 'none')
print('  by column, least:', ' '.join(f'{c}:{min([u[2] for u in used if u[0] == c], default=float("nan")):.2f}' for c in range(12)))
