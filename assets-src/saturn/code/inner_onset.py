# inner_onset.py SKIM.json RISE.json K JOIN: the first knots of the depth of the dust inside the inner rim by the
# height of the lens (skim.json inner.by), from the height JOIN (planet radii, a knot of the table) up to the
# height where the dust ends. Prints the new knots and writes them into SKIM.json.
# Why: over the night side of the globe the faint clouds are all the pattern there is, and a share of the dust
# of K (0.04) already shows as much pattern as they do. The report of the pictures reads a pair of frames 8
# apart as one minus the cosine of the angle between their patterns, and with clouds a and dust d times its
# share s that angle is atan(s d / a) = atan(s / K). With the knots as they were the angle went from 0 to 57
# degrees in the first 8 frames of the dust on the dive (0.453 read at frame 3603, limit 0.45). Here the angle
# runs straight with the frames of the rise, the faster of the two flights through these heights, from its
# value at JOIN down to 0 where the dust ends, so the share is K times the tangent of that angle. RISE.json
# holds the height of the lens by frame on the rise. Measures and writes numbers only: the film does not run it.
import sys, json, math
skim_path, rise_path, k, join = sys.argv[1], sys.argv[2], float(sys.argv[3]), float(sys.argv[4])
skim = json.load(open(skim_path))
rows = json.load(open(rise_path))['rows']
by = skim['inner']['by']
heights, depth = by['heights'], by['depth']
def frame_at(h):
    for (f0, h0), (f1, h1) in zip(rows, rows[1:]):
        if h0 <= h <= h1:
            return f0 + (f1 - f0) * (math.log(h / h0) / math.log(h1 / h0) if h1 > h0 else 0.0)
    raise SystemExit('height %s is not on the rise' % h)
first = heights.index(join)
end = frame_at(heights[-1])
start = frame_at(join)
top = math.atan(depth[first] / k)
print('angle at the join %.1f degrees, %.1f frames, %.1f degrees in 8 frames' % (math.degrees(top), end - start, math.degrees(top) * 8 / (end - start)))
for i in range(first + 1, len(heights)):
    angle = top * (end - frame_at(heights[i])) / (end - start)
    depth[i] = round(k * math.tan(angle), 4)
    print(heights[i], depth[i])
depth[-1] = 0.0
open(skim_path, 'w').write(json.dumps(skim, indent=2, ensure_ascii=False) + '\n')
