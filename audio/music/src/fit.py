#!/usr/bin/env python3
# fit.py TRACK TAKE : the level ride that fits a kept take to the film timeline (the mix to picture step).
# In : TRACK-tTAKE.pcm (s16le, 48 kHz, stereo, as it came from the generator).
# Out: TRACK-fit.pcm (s16le, for measure.py), TRACK-fit.wav (24 bit master), TRACK-fit.json (every gain node and level).
# What it does, and nothing else: cuts the take to exactly 180.000 s, multiplies it by one slow gain curve whose nodes sit
# on the film's timeline, lays the film's fade (177.5 s to 180.0 s) on it, and sets the peak to -1 dBFS. No notes are
# moved, no part is repeated or replaced, no other track is mixed in.
import sys, json, wave
import numpy as np

SR = 48000
N = 180 * SR
NAMES = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
BASES = [18 + 19 * i for i in range(8)]
# Target levels in dB under the finale (the last landing, 171.5 s to 177.5 s, is 0).
T_SUN_SURFACE = -13.0
T_SUN_HOLD = -8.0
T_ARRIVAL = [-4.0 + 2.5 * i / 7 for i in range(8)]      # each arrival a little higher than the one before
T_SURFACE = -12.0
PRE = 3.5            # the last moments before an arrival sit this far under the arrival
PRE_FINALE = 2.5     # the last moments before the last landing sit this far under the finale
STEP = 0.4           # seconds the short rise of the gain into a landing takes
MAX_STEP_DB = 9.0    # the most a landing may be lifted in that step
PEAK_DBFS = -1.0

track, take = sys.argv[1], int(sys.argv[2])
raw = np.fromfile('%s-t%d.pcm' % (track, take), dtype='<i2').astype(np.float64).reshape(-1, 2) / 32768.0
raw_seconds = len(raw) / SR
if len(raw) < N:
    raw = np.vstack([raw, np.zeros((N - len(raw), 2))])
a = raw[:N]


def lv(x, t0, t1):
    seg = x[int(round(t0 * SR)):int(round(t1 * SR))]
    return float(10 * np.log10(max(np.mean(seg * seg), 1e-14)))


L_fin = lv(a, 171.5, 177.5)
nodes = []          # (seconds, gain in dB relative to the gain of the finale, label)
levels = {'finale': round(L_fin, 2)}


def plateau(t0, t1, target, label):
    L = lv(a, t0, t1)
    g = (target + L_fin) - L
    levels[label] = round(L, 2)
    nodes.append((t0, g, label + ' starts'))
    nodes.append((t1, g, label + ' ends'))
    return g


plateau(0, 6, T_SUN_SURFACE, 'Sun surface')
plateau(9, 15, T_SUN_HOLD, 'Sun hold')
for i, B in enumerate(BASES):
    L_arr = lv(a, B, B + 5)
    g_arr = (T_ARRIVAL[i] + L_fin) - L_arr
    L_pre = lv(a, B - 1.5, B - STEP)
    g_pre = min(g_arr, (T_ARRIVAL[i] - PRE + L_fin) - L_pre)
    g_pre = max(g_pre, g_arr - MAX_STEP_DB)
    levels[NAMES[i] + ' before arrival'] = round(L_pre, 2)
    levels[NAMES[i] + ' arrival'] = round(L_arr, 2)
    nodes.append((B - STEP, g_pre, NAMES[i] + ' last moment of travel'))
    nodes.append((B, g_arr, NAMES[i] + ' arrival starts'))
    nodes.append((B + 5, g_arr, NAMES[i] + ' arrival ends, dive starts'))
    plateau(B + 8, B + 14, T_SURFACE, NAMES[i] + ' surface')
L_pre = lv(a, 170.0, 171.5 - STEP)
g_pre = min(0.0, (-PRE_FINALE + L_fin) - L_pre)
g_pre = max(g_pre, -MAX_STEP_DB)
levels['before the last landing'] = round(L_pre, 2)
nodes.append((171.5 - STEP, g_pre, 'last moment of the retreat'))
nodes.append((171.5, 0.0, 'last landing'))
nodes.append((180.0, 0.0, 'end'))
nodes.sort(key=lambda n: n[0])
t = np.arange(N) / SR
g = np.interp(t, [n[0] for n in nodes], [n[1] for n in nodes])
y = a * (10 ** (g / 20))[:, None]
# the film's fade: 177.5 s to 180.0 s, to silence on the last sample
f0 = int(177.5 * SR)
fade = np.ones(N)
fade[f0:] = np.cos(np.linspace(0, np.pi / 2, N - f0)) ** 2
y *= fade[:, None]
peak = float(np.abs(y).max())
scale = (10 ** (PEAK_DBFS / 20)) / peak
y *= scale
master_gain_db = 20 * np.log10(scale)
out16 = np.clip(np.round(y * 32767.0), -32768, 32767).astype('<i2')
out16.tofile('%s-fit.pcm' % track)
y24 = np.clip(np.round(y * 8388607.0), -8388608, 8388607).astype(np.int32)
b = np.empty((N * 2, 3), dtype=np.uint8)
flat = y24.reshape(-1)
b[:, 0] = flat & 255; b[:, 1] = (flat >> 8) & 255; b[:, 2] = (flat >> 16) & 255
w = wave.open('%s-fit.wav' % track, 'wb'); w.setnchannels(2); w.setsampwidth(3); w.setframerate(SR); w.writeframes(b.tobytes()); w.close()
gains = [n[1] + master_gain_db for n in nodes]
json.dump({'track': track, 'take': take, 'raw_seconds': round(raw_seconds, 3), 'samples': N,
           'targets_db_under_finale': {'sun_surface': T_SUN_SURFACE, 'sun_hold': T_SUN_HOLD, 'arrivals': [round(x, 2) for x in T_ARRIVAL], 'surface': T_SURFACE, 'before_arrival': PRE, 'before_last_landing': PRE_FINALE},
           'raw_levels_db': levels, 'finale_gain_db': round(master_gain_db, 2),
           'nodes': [{'seconds': round(n[0], 3), 'gain_db': round(n[1] + master_gain_db, 2), 'at': n[2]} for n in nodes],
           'gain_range_db': [round(min(gains), 2), round(max(gains), 2)], 'peak_dbfs': PEAK_DBFS},
          open('%s-fit.json' % track, 'w'), indent=1)
print(track, 'take', take, 'raw', round(raw_seconds, 2), 's; gain of the finale', round(master_gain_db, 2), 'dB; gain range', round(min(gains), 2), 'to', round(max(gains), 2), 'dB')
print('  steps at landings (dB):', [round(nodes[k + 1][1] - nodes[k][1], 1) for k in range(len(nodes) - 1) if abs(nodes[k + 1][0] - nodes[k][0] - STEP) < 1e-6])
