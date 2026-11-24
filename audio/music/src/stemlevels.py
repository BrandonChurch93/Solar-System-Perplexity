#!/usr/bin/env python3
# stemlevels.py TRACK : level of each separated stem of a kept take in 5 s windows (dBFS), and the voice stem against the whole.
import sys, subprocess, numpy as np
tr = sys.argv[1]
names = ['vocals', 'other', 'piano', 'guitar', 'bass', 'drums']
def load(p):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', p, '-f', 's16le', '-ac', '1', '-ar', '22050', '-'], capture_output=True).stdout
    return np.frombuffer(raw, dtype='<i2').astype(np.float64) / 32768.0
st = {n: load('stems/%s/%s.mp3' % (tr, n)) for n in names}
mix = load('out/raw/%s-take3.mp3' % tr)
W = 5 * 22050
def lv(x, k):
    s = x[k * W:(k + 1) * W]
    return 10 * np.log10(max(float(np.mean(s * s)), 1e-12)) if len(s) else -120
nw = min(len(mix), 180 * 22050) // W
print(tr, 'whole take', round(10 * np.log10(np.mean(mix ** 2)), 1), 'dBFS;', ' '.join('%s %.1f' % (n, 10 * np.log10(max(np.mean(st[n] ** 2), 1e-12))) for n in names))
rel = [lv(st['vocals'], k) - lv(mix, k) for k in range(nw)]
print('  voice stem under the whole, dB, per 5 s window from 0 s:')
print('  ' + ' '.join('%d' % round(r) for r in rel))
loud = [(k * 5, round(r, 1), round(lv(st['vocals'], k), 1)) for k, r in enumerate(rel) if r > -12]
print('  windows where the voice stem is within 12 dB of the whole (start s, dB under whole, dBFS):', loud)
