#!/usr/bin/env python3
# onsets.py FILE.pcm ... : where the take's own strongest onset lies near each landing of the film (seconds after the landing).
import sys, numpy as np
SR = 48000
BASES = [18 + 19 * i for i in range(8)] + [171.5]
for path in sys.argv[1:]:
    a = np.fromfile(path, dtype='<i2').astype(np.float64).reshape(-1, 2).mean(axis=1) / 32768.0
    hop, win = 480, 2048
    n = (len(a) - win) // hop
    w = np.hanning(win)
    prev = None; flux = np.zeros(n)
    for k in range(n):
        m = np.log1p(1000 * np.abs(np.fft.rfft(a[k * hop:k * hop + win] * w)))
        if prev is not None:
            d = m - prev; flux[k] = d[d > 0].sum()
        prev = m
    t = (np.arange(n) * hop + win / 2) / SR
    med = np.median(flux)
    out = []
    for B in BASES:
        sel = (t >= B - 1.5) & (t <= B + 1.5)
        k = np.argmax(flux[sel]); out.append((round(float(t[sel][k] - B), 2), round(float(flux[sel][k] / med), 1)))
    lead = np.argmax(np.abs(a) > 10 ** (-50 / 20)) / SR
    print(path, 'first sound over -50 dBFS at', round(float(lead), 3), 's')
    print('  strongest onset near each landing (offset s, strength over median):', out)
    print('  median offset', round(float(np.median([o[0] for o in out])), 2), 'mean of strong ones', round(float(np.mean([o[0] for o in out if o[1] > 3]) if any(o[1] > 3 for o in out) else 0), 2))
