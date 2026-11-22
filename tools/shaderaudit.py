import os
import re
import sys

ROOT = sys.argv[1] if len(sys.argv) > 1 else '.'
ONLY = sys.argv[2:]
KW = {'if','for','while','else','return','discard','break','continue','do','switch'}
BUILT = set('''float int bool vec2 vec3 vec4 ivec2 ivec3 ivec4 mat2 mat3 mat4 true false abs sign floor ceil fract mod min max clamp mix step smoothstep length distance dot cross normalize pow exp exp2 log log2 sqrt inversesqrt sin cos tan asin acos atan radians degrees textureSize uint const in out inout highp mediump lowp PI'''.split())
DIRECT = ['dFdx', 'dFdy', 'fwidth', 'texture', 'texture2D']

def literals(src):
    out = []
    i = 0
    n = len(src)
    while i < n:
        if src[i] == '`':
            j = i + 1
            buf = []
            while j < n and src[j] != '`':
                if src[j] == '\\': buf.append('  '); j += 2; continue
                if src[j] == '$' and j + 1 < n and src[j + 1] == '{':
                    d = 0; k = j + 1
                    while k < n:
                        if src[k] == '{': d += 1
                        elif src[k] == '}':
                            d -= 1
                            if d == 0: break
                        elif src[k] == '`':
                            k += 1
                            while k < n and src[k] != '`': k += 1
                        k += 1
                    seg = src[j:k + 1]
                    buf.append('0' + re.sub(r'[^\n]', ' ', seg)[1:])
                    j = k + 1
                    continue
                buf.append(src[j]); j += 1
            out.append((i + 1, ''.join(buf)))
            i = j + 1
        else: i += 1
    return out

def strip(s):
    s = re.sub(r'/\*.*?\*/', lambda m: re.sub(r'[^\n]', ' ', m.group(0)), s, flags=re.S)
    s = re.sub(r'//[^\n]*', lambda m: ' ' * len(m.group(0)), s)
    s = re.sub(r'^[ \t]*#[^\n]*', lambda m: ' ' * len(m.group(0)), s, flags=re.M)
    s = re.sub(r'^[ \t]*0[ \t]*$', lambda m: ' ' * len(m.group(0)), s, flags=re.M)
    return s

def match(s, i, o, c):
    d = 0
    while i < len(s):
        if s[i] == o: d += 1
        elif s[i] == c:
            d -= 1
            if d == 0: return i
        i += 1
    return len(s) - 1

def functions(s):
    out = []
    for m in re.finditer(r'^[ \t]*(?:[A-Za-z_]\w*\s+)+([A-Za-z_]\w*)\s*\(([^;{}]*)\)\s*\{', s, flags=re.M):
        name = m.group(1)
        if name in KW: continue
        a = m.end() - 1
        b = match(s, a, '{', '}')
        out.append((name, a + 1, b))
    return out

def skipws(s, i, e):
    while i < e and s[i].isspace(): i += 1
    return i

def parse(s, i, e):
    st = []
    while True:
        i = skipws(s, i, e)
        if i >= e: return st
        x, j = stmt(s, i, e)
        if j <= i: j = i + 1
        i = j
        st.append(x)

def stmt(s, i, e):
    i = skipws(s, i, e)
    if i >= e: return ('simple', i, ''), e
    if s[i] == '{':
        j = min(match(s, i, '{', '}'), e)
        return ('block', i, parse(s, i + 1, j)), j + 1
    m = re.match(r'(if|for|while)\s*\(', s[i:e])
    if m:
        a = i + m.end() - 1
        b = match(s, a, '(', ')')
        head = s[a + 1:b]
        body, j = stmt(s, b + 1, e)
        els = None
        k = skipws(s, j, e)
        if m.group(1) == 'if' and s[k:k + 4] == 'else' and not (s[k + 4:k + 5].isalnum() or s[k + 4:k + 5] == '_'):
            els, j = stmt(s, k + 4, e)
        return (m.group(1), i, head, body, els), j
    j = i
    d = 0
    while j < e:
        if s[j] in '([': d += 1
        elif s[j] in ')]': d -= 1
        elif s[j] == ';' and d == 0: break
        elif s[j] == '}' and d == 0: break
        j += 1
    return ('simple', i, s[i:j]), j + 1

files = []
for base, _, names in os.walk(os.path.join(ROOT, 'src')):
    for nm in names:
        if nm.endswith('.ts'): files.append(os.path.join(base, nm))
files.sort()
units = []
for f in files:
    src = open(f).read()
    for (off, lit) in literals(src):
        if not re.search(r'\b(void|float|vec[234])\b', lit) or ';' not in lit: continue
        units.append((f, src, off, strip(lit)))

bearing = {}
defs = {}
for (f, src, off, s) in units:
    for (name, a, b) in functions(s):
        defs.setdefault(name, []).append(s[a:b])
ch = True
while ch:
    ch = False
    for name, bodies in defs.items():
        if name in bearing or name == 'main': continue
        for body in bodies:
            if re.search(r'\b(' + '|'.join(DIRECT + sorted(bearing)) + r')\s*\(', body):
                bearing[name] = 1; ch = True; break
callre = re.compile(r'\b(' + '|'.join(DIRECT + sorted(bearing)) + r')\s*\(')
print('helpers that hold a cross pixel operation:', ' '.join(sorted(bearing)))

def uniform(cond, lv):
    if re.match(r'\s*uDiag\s*>=\s*2\s*&&', cond) and '||' not in cond: return True, []
    ids = set(re.findall(r'[A-Za-z_]\w*', re.sub(r'\.\w+', '', cond)))
    bad = [x for x in ids if not re.match(r'u[A-Z]', x) and x not in BUILT and x not in lv and not x.isupper()]
    return not bad, bad

for (f, src, off, s) in units:
    rel = os.path.relpath(f, ROOT)
    if ONLY and not any(rel.startswith(o) for o in ONLY): continue
    base = src.count('\n', 0, off)
    lines = src.split('\n')
    def line(i): return base + s.count('\n', 0, i) + 1
    found = []
    def walk(st, fname, masked, lv, state):
        for x in st:
            k = x[0]
            if k == 'block': walk(x[2], fname, masked, lv, state)
            elif k == 'simple':
                text = x[2]
                why = masked or state.get('dead')
                for m in callre.finditer(text):
                    if why: found.append((line(x[1] + m.start()), fname, m.group(1), why))
                if re.match(r'\s*(discard|return)\b', text) and masked:
                    state['dead'] = 'after per pixel ' + re.match(r'\s*(\w+)', text).group(1) + ' at line ' + str(line(x[1]))
            else:
                head = x[2]
                l2 = set(lv)
                cond = head
                if k == 'for':
                    parts = head.split(';')
                    cond = parts[1] if len(parts) > 1 else head
                    mm = re.match(r'\s*int\s+(\w+)', parts[0])
                    if mm: l2.add(mm.group(1))
                ok, bad = uniform(cond, l2)
                why = masked or state.get('dead')
                for m in callre.finditer(head):
                    if why: found.append((line(x[1]), fname, m.group(1), why))
                inner = masked if ok else (masked or 'inside per pixel ' + k + ' at line ' + str(line(x[1])) + ' (' + ','.join(sorted(bad)) + ')')
                walk([x[3]], fname, inner, l2, state)
                if x[4] is not None: walk([x[4]], fname, inner, l2, state)
    fns = functions(s)
    if fns:
        for (name, a, b) in fns: walk(parse(s, a, b), name, None, set(), {})
    else:
        walk(parse(s, 0, len(s)), '(fragment)', None, set(), {})
    seen = set()
    for (ln, fname, op, why) in found:
        if (ln, why) in seen: continue
        ops = sorted(set(o for (l, _, o, w) in found if l == ln and w == why))
        seen.add((ln, why))
        print(rel + ':' + str(ln), fname + '()', ','.join(ops), '|', why, '|', lines[ln - 1].strip()[:130])
