# put_pace.py KIND FILE_OR_JSON: the paces of a move ({measure: {peak, round}}) into skim.json handover.KIND, the layout kept
import json, re, sys
p = 'src/stops/saturn/skim.json'  # run it from the repo's root
s = open(p).read()
kind = sys.argv[1]
t = sys.argv[2]
o = json.loads(t if t.strip().startswith('{') else open(t).read())
a = s.index('  "handover": {')
b = s.index('    "%s": {' % kind, a)
for m in ('reach', 'climb', 'round', 'view'):
    i = s.index('      "%s": {\n' % m, b)
    j = s.index('      }', i)
    def lay(v):
        return '[\n' + ',\n'.join('          ' + json.dumps(x) for x in v) + '\n        ]'
    block = '      "%s": {\n        "peak": %s,\n        "round": %s\n' % (m, lay(o[m]['peak']), lay(o[m]['round']))
    s = s[:i] + block + s[j:]
json.loads(s)
open(p, 'w').write(s)
h = json.loads(s)['handover'][kind]
print(kind, {m: h[m] for m in ('reach', 'climb', 'round', 'view')})
