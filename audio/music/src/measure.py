#!/usr/bin/env python3
# measure.py FILE.pcm [FILE.pcm ...] : measures a take (s16le, 48 kHz, stereo) against the film timeline.
# Writes FILE.measure.json and prints one block per file. With --chart OUT.png draws the level of each file over the timeline.
import sys, json, os
import numpy as np

SR = 48000
SUN_SURF = (0, 6); SUN_HOLD = (9, 15)
NAMES = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
BASES = [18 + 19 * i for i in range(8)]
FINALE = (171.5, 177.5)


def load(path):
    a = np.fromfile(path, dtype='<i2').astype(np.float64) / 32768.0
    return a.reshape(-1, 2)


def level(a, t0, t1):
    seg = a[int(round(t0 * SR)):int(round(t1 * SR))]
    if len(seg) == 0:
        return -140.0
    return float(10 * np.log10(max(np.mean(seg * seg), 1e-14)))


def envelope(a, win=0.4, hop=0.1):
    p = (a * a).mean(axis=1)
    c = np.concatenate([[0.0], np.cumsum(p)])
    n = int(win * SR); h = int(hop * SR)
    idx = np.arange(0, len(p) - n + 1, h)
    r = (c[idx + n] - c[idx]) / n
    return (idx + n / 2) / SR, 10 * np.log10(np.maximum(r, 1e-14))


def measure(path):
    a = load(path)
    dur = len(a) / SR
    out = {'file': os.path.basename(path), 'seconds': round(dur, 4), 'samples': int(len(a)),
           'peak_dbfs': round(float(20 * np.log10(max(np.abs(a).max(), 1e-9))), 2),
           'whole_db': round(level(a, 0, dur), 2)}
    arr = [level(a, B, B + 5) for B in BASES]
    arr8 = [level(a, B, B + 8) for B in BASES]
    sur = [level(a, B + 8, B + 14) for B in BASES]
    sur_settled = [level(a, B + 9, B + 14) for B in BASES]
    onset = [level(a, B, B + 2) - level(a, B - 2, B) for B in BASES]
    prevq = [level(a, *SUN_HOLD)] + sur[:-1]
    lifts = [arr[i] - prevq[i] for i in range(8)]
    drops = [sur[i] - arr8[i] for i in range(8)]
    out['sun_surface_db'] = round(level(a, *SUN_SURF), 2)
    out['sun_hold_db'] = round(level(a, *SUN_HOLD), 2)
    out['first_half_second_db'] = round(level(a, 0, 0.5), 2)
    out['arrival_db'] = [round(x, 2) for x in arr]
    out['surface_db'] = [round(x, 2) for x in sur]
    out['surface_settled_db'] = [round(x, 2) for x in sur_settled]
    out['lift_db'] = [round(x, 2) for x in lifts]
    out['drop_db'] = [round(x, 2) for x in drops]
    out['onset_db'] = [round(x, 2) for x in onset]
    out['finale_db'] = round(level(a, *FINALE), 2)
    out['build_db'] = round(level(a, 165, 171.5), 2)
    out['fade_db'] = round(level(a, 177.5, min(dur, 180)), 2)
    out['last_half_second_db'] = round(level(a, dur - 0.5, dur), 2)
    # loudest 6 second window
    p = (a * a).mean(axis=1)
    c = np.concatenate([[0.0], np.cumsum(p)])
    n = 6 * SR
    idx = np.arange(0, len(p) - n + 1, SR // 10)
    w = (c[idx + n] - c[idx]) / n
    k = int(np.argmax(w))
    out['loudest_6s_start'] = round(float(idx[k] / SR), 1)
    out['loudest_6s_db'] = round(float(10 * np.log10(w[k])), 2)
    med = float(np.median(arr))
    crit = {
        'length within 0.1 s of 180': abs(dur - 180) <= 0.1,
        'quiet opening (Sun surface at least 6 dB under the median arrival)': out['sun_surface_db'] <= med - 6,
        'sound from the first frame (first half second above -60 dB)': out['first_half_second_db'] > -60,
        'lift at each of 8 arrivals (at least 3 dB over the quiet stretch before)': all(x >= 3 for x in lifts),
        'drop in each of 8 surface views (at least 3 dB under its arrival)': all(x <= -3 for x in drops),
        'loudest 6 s window starts at or after 165 s': out['loudest_6s_start'] >= 165,
        'finale 171.5 to 177.5 at or above every arrival': out['finale_db'] >= max(arr) - 0.01,
    }
    out['criteria'] = crit
    out['lifts_ok'] = int(sum(x >= 3 for x in lifts)); out['drops_ok'] = int(sum(x <= -3 for x in drops))
    json.dump(out, open(path.rsplit('.', 1)[0] + '.measure.json', 'w'), indent=1)
    return out, a


def chart(items, outpng):
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig, axes = plt.subplots(len(items), 1, figsize=(14, 3.0 * len(items)), sharex=True)
    if len(items) == 1:
        axes = [axes]
    for ax, (title, a) in zip(axes, items):
        t, e = envelope(a)
        ax.plot(t, e, color='#1f6feb', lw=1.1)
        lo = max(-60, np.percentile(e, 1) - 3); hi = e.max() + 2
        ax.set_ylim(lo, hi)
        ax.axvspan(0, 6, color='#f2b134', alpha=0.25)
        for i, B in enumerate(BASES):
            ax.axvspan(B + 8, B + 14, color='#f2b134', alpha=0.25)
            ax.axvline(B, color='#c0392b', lw=1.0)
            ax.text(B + 0.3, hi - 0.6, NAMES[i], fontsize=8, va='top', color='#c0392b')
        ax.axvline(9, color='#c0392b', lw=0.8, ls=':')
        ax.axvline(171.5, color='#2e7d32', lw=1.2)
        ax.axvspan(177.5, 180, color='#888888', alpha=0.25)
        ax.text(171.8, lo + 0.8, 'last landing', fontsize=8, color='#2e7d32')
        ax.set_ylabel('level, dB')
        ax.set_title(title, fontsize=10, loc='left')
        ax.grid(alpha=0.25)
    axes[-1].set_xlabel('film time, seconds (red: a planet arrives, yellow: surface view, green: last landing at 171.5, grey: fade)')
    axes[-1].set_xlim(0, 180)
    axes[-1].set_xticks(list(range(0, 181, 10)))
    fig.tight_layout()
    fig.savefig(outpng, dpi=110)


def main():
    args = sys.argv[1:]
    png = None
    if '--chart' in args:
        i = args.index('--chart'); png = args[i + 1]; args = args[:i] + args[i + 2:]
    items = []
    for f in args:
        m, a = measure(f)
        items.append((m['file'], a))
        c = m['criteria']
        print(m['file'], 'seconds', m['seconds'], 'peak', m['peak_dbfs'], 'whole', m['whole_db'])
        print('  sun surface', m['sun_surface_db'], 'sun hold', m['sun_hold_db'], 'first 0.5 s', m['first_half_second_db'])
        print('  arrival', m['arrival_db'])
        print('  surface', m['surface_db'])
        print('  lift   ', m['lift_db'], 'ok', m['lifts_ok'], 'of 8')
        print('  drop   ', m['drop_db'], 'ok', m['drops_ok'], 'of 8')
        print('  onset  ', m['onset_db'])
        print('  build 165-171.5', m['build_db'], 'finale', m['finale_db'], 'fade', m['fade_db'], 'loudest 6 s at', m['loudest_6s_start'], m['loudest_6s_db'])
        print('  criteria: ' + '; '.join(('PASS ' if v else 'FAIL ') + k.split(' (')[0] for k, v in c.items()))
    if png:
        chart(items, png)
        print('chart', png)


main()
