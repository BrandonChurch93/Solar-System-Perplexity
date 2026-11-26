#!/usr/bin/env python3
"""The back reading of the smooth reader's pattern line for pairs of capture frames, with the reader's own functions (tools/img/smooth.py).

  python3 assets-src/earth/backpair.py FRAMES K [K ...]
      for each pair K, K + n of the draft frames in FRAMES (out/work/smooth/earth/frames after npm run smooth -- --stop earth --kind dive
      or rise --only pictures --rate 2): the back reading's value (99th percentile on its judged ground, whatever its share), its share of
      the frame, whether the reader counts it (share at or over PATTERN_SHARE), the onward reading, and the number the reader gives the row.
  python3 assets-src/earth/backpair.py FRAMES --all [--between LO HI] [--jobs J]
      the same for every K whose 17 frames stand in FRAMES; --between prints only the rows whose back share lies from LO to HI.
  python3 assets-src/earth/backpair.py --poses JOBS_DIR [JOBS_DIR ...]
      rewrite backpair-poses.json from dumps of the jobs the smooth tool hands to tools/img/smooth.py (op pictures).

K is the capture frame at rate 2 (film frame times 2), n the reader's changeFrames at that rate. The poses and the reader's sizes come from
backpair-poses.json beside this file, which holds what the tool itself handed to the reader. Nothing under tools/ is changed.
"""
import glob
import json
import os
import sys
from multiprocessing import get_context

import cv2
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, '..', '..', 'tools', 'img'))
import smooth as S  # noqa: E402

POSES = os.path.join(HERE, 'backpair-poses.json')
SIZES = ('scale', 'changeFrames', 'changeBlur', 'patternPx', 'patternFloor')
G = {}


def write_poses(dirs):
    poses, sizes = {}, {}
    for d in dirs:
        for f in sorted(glob.glob(os.path.join(d, '*.json'))):
            job = json.load(open(f))
            if job.get('op') != 'pictures' or not job.get('poses'):
                continue
            for key in SIZES:
                if sizes.setdefault(key, job[key]) != job[key]:
                    sys.exit('the jobs differ in ' + key)
            for path, pose in zip(job['paths'], job['poses']):
                name = os.path.basename(path)
                k = str(int(name[1:7]))
                if any(poses.setdefault(k, pose)[key] != pose[key] for key in ('p', 'q', 'vfov')):
                    sys.exit('two poses for frame ' + k)
                sizes.setdefault('name', name[:1] + '%06d' + name[7:])
    if not poses:
        sys.exit('no pictures job with poses in ' + ' '.join(dirs))
    ordered = {k: poses[k] for k in sorted(poses, key=int)}
    with open(POSES, 'w') as out:
        json.dump({**sizes, 'poses': ordered}, out, separators=(',', ':'))
        out.write('\n')
    ks = [int(k) for k in ordered]
    print('wrote %s: %d poses, capture frames %d to %d' % (os.path.relpath(POSES), len(ks), ks[0], ks[-1]))


def flows(j):
    return j, S.motion(G['frames'][j], G['frames'][j + 1]), S.motion(G['frames'][j + 1], G['frames'][j])


def film(k):
    return '%d' % (k // 2) if k % 2 == 0 else '%d + 1/2' % (k // 2)


def number(x):
    return 'none' if x is None else '%.4f' % x


def read(k):
    P, frames, fw, bw, path = G['P'], G['frames'], G['fw'], G['bw'], G['path']
    n, scale = int(P['changeFrames']), P['scale']
    sigma, wide, low = float(P['changeBlur']) * scale, float(P['patternPx']) * scale, float(P['patternFloor'])
    first, last = (S.body(P['poses'][str(j)], frames[j].shape, sigma) for j in (k, k + n))
    way = S.carry(fw, bw, k, n, first, last)
    _, later, _ = S.change(frames, fw, bw, k, n, sigma, first, last, way)
    onward, back = S.readings(frames, fw, bw, k, n, scale, sigma, wide, low, first, last, lambda j: S.grey(path(j)), way, later)
    row = S.reading(onward, back, scale)[0]
    on = np.isfinite(onward[0])
    forth = (float(np.nanpercentile(onward[0], 99)) if on.any() else None, float(on.mean()))
    if back is None:
        return k, None, 0.0, forth, row
    judged = np.isfinite(back[0])
    return k, float(np.nanpercentile(back[0], 99)) if judged.any() else None, float(judged.mean()), forth, row


def main(argv):
    if argv and argv[0] == '--poses':
        return write_poses(argv[1:])
    if len(argv) < 2:
        sys.exit(__doc__)
    P = json.load(open(POSES))
    folder, rest = argv[0], argv[1:]
    n = int(P['changeFrames'])
    path = lambda j: os.path.join(folder, P['name'] % j)
    jobs = int(rest[rest.index('--jobs') + 1]) if '--jobs' in rest else 1
    between = [float(v) for v in rest[rest.index('--between') + 1:rest.index('--between') + 3]] if '--between' in rest else None
    have = lambda k: all(str(j) in P['poses'] and os.path.exists(path(j)) for j in range(k, k + n + 1))
    if '--all' in rest:
        ks = [k for k in sorted(int(k) for k in P['poses']) if have(k)]
    else:
        ks = [int(v) for v in rest if v.lstrip('-').isdigit()]
        for k in ks:
            if not have(k):
                sys.exit('frames or poses %d to %d are not all there' % (k, k + n))
    if not ks:
        sys.exit('no pair whose frames stand in ' + folder)
    need = sorted({j for k in ks for j in range(k, k + n + 1)})
    G.update(P=P, path=path, frames={j: S.small(S.grey(path(j)), P['scale']) for j in need}, fw={}, bw={})
    steps = [j for j in need if j + 1 in G['frames']]
    run = lambda work, items, chunk: get_context('fork').Pool(jobs).imap(work, items, chunk) if jobs > 1 else map(work, items)
    for j, f, b in run(flows, steps, 4):
        G['fw'][j], G['bw'][j] = f, b
    print('reader: PATTERN_SHARE %s, PATTERN_STEPS %s; pairs k, k + %d at scale %s; frames in %s' % (S.PATTERN_SHARE, S.PATTERN_STEPS, n, P['scale'], folder))
    shown = 0
    for k, value, share, forth, row in run(read, ks, 2):
        if between and not between[0] <= share <= between[1]:
            continue
        shown += 1
        print('k%d (%s): back value %s on share %.4f, %s by the reader; onward value %s on share %.4f; the row %s'
              % (k, film(k), number(value), share, 'counted' if share >= S.PATTERN_SHARE else 'not counted', number(forth[0]), forth[1], number(row)), flush=True)
    print('%d of %d rows shown' % (shown, len(ks)))


if __name__ == '__main__':
    main(sys.argv[1:])
