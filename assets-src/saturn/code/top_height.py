# top_height.py LENS.json SKIM.json NEW_TOP [write]: the upper height of the step by height, brought under the hold.
#
# Run from the repo root: python3 assets-src/saturn/code/top_height.py LENS.json src/stops/saturn/skim.json 2.03 write
# LENS.json is the lens of every film frame as lens_by_frame.ts writes it for the tree as it stands (frames 3310 to
# 3965 at least).
#
# Why. Three numbers of skim.json end at one upper height, under which the look of the skim begins to come in and
# over which every height of the hold must lie: sky.heights (the air of the stop), light.body (the one share of the
# light of the globe, knots by body_pace.py) and light.grade.by (the share of the tone of the rings by radius). The
# hold of the solved view stands lower over the ring plane than the hold before it, so that height comes down with
# it. The knots of the two tables were laid evenly by film frame on the rise, the fastest passage of the lens through
# these heights; this keeps them so: every knot keeps its share and its place on the rise as a part of the frames
# from the lower height to the upper one. The lower height does not move. It prints the hold's heights, the frames
# of the rise at the two upper heights and the knots, and with "write" it puts the three into SKIM.json in place.
import sys, json, math, re
import numpy as np
lens = json.load(open(sys.argv[1])); path = sys.argv[2]; top = float(sys.argv[3]); write = len(sys.argv) > 4 and sys.argv[4] == 'write'
text = open(path).read(); skim = json.loads(text)
H = {int(k): float(v['eye'][1]) for k, v in lens['frames'].items() if 'eye' in v}
hold = [H[f] for f in range(3390, 3540)]
print('the hold stands at %.4f to %.4f over the ring plane' % (min(hold), max(hold)))
if top >= min(hold): sys.exit('the new upper height %.4f is not under the hold' % top)
rise = [f for f in range(3760, 3885) if f in H]; lo_at = int(np.argmin([H[f] for f in rise])); rise = rise[lo_at:]
logs = np.log(np.array([H[f] for f in rise]))
if np.any(np.diff(logs) <= 0): sys.exit('the rise does not climb at every frame')
def frame_at(h): return float(np.interp(math.log(h), logs, rise))
def height_at(f): return math.exp(float(np.interp(f, rise, logs)))
def relay(heights):
    lo, old = heights[0], heights[-1]
    f_lo, f_old, f_new = frame_at(max(lo, H[rise[0]])), frame_at(old), frame_at(top)
    out = [round(height_at(f_lo + (frame_at(max(h, H[rise[0]])) - f_lo) * (f_new - f_lo) / (f_old - f_lo)), 4) for h in heights]
    out[0] = lo; out[-1] = top
    if any(b <= a for a, b in zip(out, out[1:])): sys.exit('the knots do not climb')
    return out, f_lo, f_old, f_new
def put(old, new):
    # the table as it is written in the file, whatever its line breaks
    global text
    pat = r'\[\s*' + r'\s*,\s*'.join(re.escape(json.dumps(x)) for x in old) + r'\s*\]'
    if len(re.findall(pat, text)) < 1: sys.exit('the table is not found in the text as it is written: ' + json.dumps(old)[:60])
    text = re.sub(pat, json.dumps(new), text)
for name, table in (('light.body', skim['light']['body']), ('light.grade.by', skim['light']['grade']['by'])):
    new, f_lo, f_old, f_new = relay(table['heights'])
    print('%s: the rise passes %.3f at frame %.2f, %.2f at %.2f and %.2f at %.2f: %.2f frames where there were %.2f' % (name, table['heights'][0], f_lo, table['heights'][-1], f_old, top, f_new, f_new - f_lo, f_old - f_lo))
    print('  "heights": ' + json.dumps(new))
    if write: put(table['heights'], new)
sky = skim['sky']['heights']
print('sky.heights: %s becomes %s' % (json.dumps(sky), json.dumps([sky[0], top])))
if write:
    put(sky, [sky[0], top]); open(path, 'w').write(text); json.loads(text)
    print('written: ' + path)
