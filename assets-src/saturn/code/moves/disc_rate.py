# discrate.py PATH.json...: the disc's rate (percent a film frame) at whole and half frames and its largest change, for the way in and the way out
import json, sys, numpy as np
for name in sys.argv[1:]:
    r = np.array([row[:4] for row in json.load(open(name))], dtype=float)
    fr, d, lens = r[:, 0], r[:, 1], r[:, 3]
    lnD = np.log(540) - np.log(np.tan(np.radians(lens) / 2)) - 0.5 * np.log(d * d - 1)
    print(name.split('/')[-1])
    for label, a, b, sign in (('way in  3540 to 3720', 3540, 3720, 1), ('dive    3540 to 3630', 3540, 3630, 1), ('rise    3810 to 3884', 3810, 3884, -1), ('skim    3630 to 3810', 3630, 3810, 0)):
        for step, tag in ((2, 'whole'), (1, 'half')):
            i0 = int(np.nonzero(fr == a)[0][0]); i1 = int(np.nonzero(fr == b)[0][0])
            x = lnD[i0:i1 + 1:step]; f = fr[i0:i1 + 1:step]
            rate = 100 * np.diff(x) * (2 / step)  # percent a film frame
            ch = np.abs(np.diff(rate)) * (2 / step)  # change of the rate a film frame
            if sign: worst = (sign * rate).min(); k = int(np.argmin(sign * rate))
            else: worst = np.nan; k = 0
            j = int(np.argmax(ch))
            print('  %s at %s frames: rate from %+.4f to %+.4f, least in the way %+.4f at %.1f; largest change of the rate %.4f a frame at %.1f' % (label, tag, rate[0], rate[-1], worst, f[k], ch.max(), f[j + 1]))
