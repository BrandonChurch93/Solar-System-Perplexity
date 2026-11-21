#!/usr/bin/env python3
import argparse, datetime, json, pathlib, re, shutil, subprocess, sys, tarfile

ROOT = pathlib.Path(__file__).resolve().parent.parent
PROG = ROOT / 'kit' / 'PROGRESS.md'
WORK = ROOT / 'out' / 'work'
SC = ROOT / 'scorecards'
SCRATCH = False
ATT = pathlib.Path.home() / '.perplexity' / 'attachments'
TRAILER = '\n\nCo-authored-by: Perplexity <noreply@perplexity.ai>\n'
SLOTS = ['claude_opus_5_5', 'gemini_4_carbon', 'grok_4_7', 'gpt_6_2_sol']
JURY = ['claude_opus_5_5', 'gpt_6_2_sol', 'gemini_4_carbon', 'kimi_k3', 'grok_4_7']
NAMERS = ['claude_sonnet_5_5', 'gpt_6_2_sol', 'gemini_4_carbon']
JSON_CRITICS = ['R1', 'R3-part1', 'R3-part2', 'R4', 'R5', 'R6', 'R7']
NAMES = {'sun': ['sun'], 'mercury': ['mercury'], 'venus': ['venus'], 'earth': ['earth'], 'mars': ['mars'], 'jupiter': ['jupiter'], 'saturn': ['saturn'], 'uranus': ['uranus'], 'neptune': ['neptune']}
BODIES = set(sum(NAMES.values(), [])) | set('moon luna phobos deimos io europa ganymede callisto amalthea titan enceladus mimas rhea dione tethys iapetus hyperion miranda ariel umbriel titania oberon triton nereid pluto charon ceres vesta eris asteroid comet exoplanet'.split())


def sh(cmd, check=True, cwd=ROOT):
    r = subprocess.run(cmd, shell=True, cwd=cwd, capture_output=True, text=True)
    if check and r.returncode != 0:
        sys.exit('failed: ' + cmd + '\n' + (r.stdout + r.stderr)[-2500:])
    return r.stdout


def cfg():
    return json.loads((ROOT / 'config' / 'showcase.json').read_text())


def rid(n):
    return 'round-%03d' % n


def rdir(n):
    d = WORK / 'rounds' / rid(n)
    d.mkdir(parents=True, exist_ok=True)
    return d


def state(n, patch=None):
    f = rdir(n) / 'state.json'
    s = json.loads(f.read_text()) if f.exists() else {}
    if patch is not None:
        s.update(patch)
        f.write_text(json.dumps(s, indent=1))
    return s


def section(text, name):
    i = text.index('\n## ' + name + '\n')
    j = text.find('\n## ', i + 4)
    return i, (len(text) if j < 0 else j)


def round_lines(text):
    i, j = section(text, 'Rounds')
    return [l for l in text[i:j].split('\n') if l.startswith('- Round ')]


def set_status(text):
    lines = round_lines(text)
    nums = [int(re.match(r'- Round (\d+),', l).group(1)) for l in lines]
    open_ = [(int(re.match(r'- Round (\d+), Phase \d+, ([^,.]+)', l).group(1)), re.match(r'- Round (\d+), Phase \d+, ([^,.]+)', l).group(2)) for l in lines if 'scorecards/round-' not in l]
    part = ', '.join('%d (%s)' % o for o in open_) if open_ else 'none'
    new = '- Current round: open: %s. The next round is %d. Round numbers are global; rounds of different stops run at the same time, each written here when it starts' % (part, max(nums) + 1)
    return re.sub(r'^- Current round:.*$', new, text, count=1, flags=re.M)


def set_row(text, stop, cells):
    i, j = section(text, 'Stops')
    out = []
    for l in text[i:j].split('\n'):
        c = [x.strip() for x in l.split('|')]
        if len(c) > 9 and c[1] == stop:
            for k, v in cells.items():
                c[k] = str(v)
            l = '| ' + ' | '.join(c[1:10]) + ' |'
        out.append(l)
    return text[:i] + '\n'.join(out) + text[j:]


def commit(msg, push=True):
    if SCRATCH:
        return sh('git rev-parse --short HEAD').strip()
    sh('git add -A')
    if sh('git status --porcelain').strip() == '':
        return sh('git rev-parse --short HEAD').strip()
    subprocess.run(['git', 'commit', '-q', '-m', msg + TRAILER], cwd=ROOT, check=True)
    if push:
        sh('git fetch -q origin main && git merge -q --no-edit origin/main && git push -q origin HEAD:main')
    return sh('git rev-parse --short HEAD').strip()


def merge_rows(stop):
    src = ROOT / 'assets-src' / stop / 'ASSETS-ROWS.md'
    if not src.exists():
        return 0
    rows = [l for l in src.read_text().split('\n') if l.startswith('| `')]
    f = ROOT / 'ASSETS.md'
    text = f.read_text()
    head, tail = text.split('\n## Not third-party', 1)
    lines = head.rstrip('\n').split('\n')
    key = lambda l: l.split('|')[1].strip()
    have = {key(l): k for k, l in enumerate(lines) if l.startswith('| `')}
    n = 0
    for r in rows:
        if key(r) in have:
            if lines[have[key(r)]] != r:
                lines[have[key(r)]] = r
                n += 1
        else:
            lines.append(r)
            have[key(r)] = len(lines) - 1
            n += 1
    f.write_text('\n'.join(lines) + '\n\n## Not third-party' + tail)
    return n


def finished(text):
    i, j = section(text, 'Stops')
    out = []
    for l in text[i:j].split('\n'):
        c = [x.strip() for x in l.split('|')]
        if len(c) > 3 and c[2].startswith('finished'):
            out.append(c[1])
    return out


def start(a):
    n, stop, phase = a.round, a.stop, a.phase
    c = cfg()
    if not SCRATCH:
        if sh('git status --porcelain').strip():
            sys.exit('the tree is not clean')
        sh('git fetch -q origin main && git merge -q --no-edit origin/main')
    text = PROG.read_text()
    if not any(l.startswith('- Round %d,' % n) for l in round_lines(text)):
        k = len([l for l in round_lines(text) if re.match(r'- Round \d+, Phase %d, %s,' % (phase, stop), l)]) + 1
        limit = c['quality']['maxRoundsPerStop']
        if k > limit:
            sys.exit('%s has used its %d rounds' % (stop, limit))
        day = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')
        line = '- Round %d, Phase %d, %s, round %d of %d. Started %s UTC.' % (n, phase, stop, k, limit, day)
        i, j = section(text, 'Rounds')
        text = text[:j].rstrip('\n') + '\n' + line + '\n' + text[j:]
        text = set_status(text)
        text = set_row(text, stop, {2: 'in progress', 3: k})
        PROG.write_text(text)
        commit('Round %d starts: Phase %d, %s, round %d of %d' % (n, phase, stop, k, limit))
        state(n, {'round': n, 'stop': stop, 'phase': phase, 'k': k, 'tier': a.tier, 'every': a.every})
    if not a.no_mirror:
        sh('git fetch -q origin agent/' + stop)
        head = sh('git rev-parse --short origin/agent/' + stop).strip()
        dirs = ['src/stops/' + stop, 'public/assets/' + stop, 'assets-src/' + stop]
        for d in dirs:
            shutil.rmtree(ROOT / d, ignore_errors=True)
        have = [d for d in dirs if subprocess.run(['git', 'cat-file', '-e', 'origin/agent/%s:%s' % (stop, d)], cwd=ROOT).returncode == 0]
        sh('git checkout origin/agent/%s -- %s' % (stop, ' '.join(have)))
        rows = merge_rows(stop)
        state(n, {'agentHead': head, 'ledgerRows': rows})
    sh('npm run -s build')
    t = sh('npx vitest run 2>&1 | tail -6', check=False)
    if 'failed' in t or 'passed' not in t:
        sys.exit('tests:\n' + t)
    done = sorted(set(finished(PROG.read_text()) + [stop]))
    g = subprocess.run('npm run -s gate -- --phase %d --g15-stops %s' % (phase, ','.join(done)), shell=True, cwd=ROOT, capture_output=True, text=True)
    gate = [l for l in g.stdout.split('\n') if l.startswith(('PASS', 'FAIL'))]
    (rdir(n) / 'gate.txt').write_text('\n'.join(gate) + '\n')
    print('\n'.join(l[:200] for l in gate if l.startswith('FAIL')) or 'gate green: ' + ' '.join(l.split()[1] for l in gate))
    if g.returncode != 0 and not a.allow_red:
        sys.exit('the gate is red; nothing committed')
    build = json.loads((ROOT / 'dist' / 'build.json').read_text())
    s = state(n)
    sha = commit('Round %d: %s from agent/%s at %s' % (n, stop, stop, s.get('agentHead', 'main')))
    full = sh('git rev-parse HEAD').strip()
    state(n, {'commit': full, 'engineHash': build.get('engineHash') or build.get('engine'), 'stopHash': (build.get('stopHashes') or build.get('stops') or {}).get(stop), 'gateGreen': g.returncode == 0})
    print('round %d %s commit %s engine %s stop %s' % (n, stop, sha, state(n)['engineHash'], state(n)['stopHash']))


def still_tier(s):
    return s.get('tier') or 'final'


def tiers(s, tool):
    t = s.get('tier')
    if not t:
        return ''
    if tool == 'pack':
        return ' --tier %s --motion-tier %s' % (t, t)
    return ' --tier %s' % t + (' --every %d' % s['every'] if tool == 'measure' and s.get('every') else '')


def parts_of(stop):
    c = cfg()
    ids = [s['id'] for s in c['segments'] if s.get('stop') == stop and s.get('kind') in ('hold', 'dive', 'terrain', 'rise')]
    out = [('stills', ['stills']), ('views', [i for i in ids if i.endswith(('.hold', '.terrain'))])]
    for kind in ('dive', 'rise'):
        for i in ids:
            if i.endswith('.' + kind):
                out.append((kind, [i]))
                out.append((kind + '-cover', [i + '-cover']))
    return out


def jobs(a):
    n, stop = a.round, a.stop
    s = state(n)
    sha = s['commit']
    r = rid(n)
    tar = lambda name, paths: 'When the commands have finished: `tar -cf /tmp/%s.tar %s` from the repo root, then `split -b 40m -d /tmp/%s.tar /tmp/%s.tar.` and send the pieces as attachments (at most 10 per message). Nothing else is sent.' % (name, ' '.join(paths), name, name)
    out = []
    extra = (' --no-cover ' + stop if a.no_cover else '') + tiers(s, 'measure')
    name = 'r%d-%s-measure' % (n, stop)
    out.append({'name': name, 'message': 'JOB %s. Commit %s. Command: `npm run measure -- --stop %s%s`. %s' % (name, sha, stop, extra, tar(name, ['out/work/measure/%s.json' % stop]))})
    for label, only in parts_of(stop):
        name = 'r%d-%s-%s' % (n, stop, label)
        paths = ['out/work/packs/.cache/' + r]
        if 'stills' in only:
            paths.append('out/work/stills/f*-16x9-%s-full.png out/work/stills/f*-16x9-%s-full.png.json' % (still_tier(s), still_tier(s)))
        pre = 'Before the command: `rm -rf out/work/packs/.cache/%s out/work/stills/*-%s-full.png*`. ' % (r, still_tier(s))
        out.append({'name': name, 'message': 'JOB %s. Commit %s. %sCommand: `npm run pack -- --phase %d --round %d --stop %s --only %s%s`. %s' % (name, sha, pre, s['phase'], n, stop, ','.join(only), tiers(s, 'pack'), tar(name, paths))})
    (rdir(n) / 'jobs.json').write_text(json.dumps(out, indent=1))
    print(json.dumps([j['name'] for j in out]))


def place(a):
    n = a.round
    s = state(n)
    stop = s['stop']
    got = {}
    for f in sorted(ATT.glob('*/r%d-%s-*.tar.*' % (n, stop))):
        m = re.match(r'(r\d+-[a-z]+-[a-z-]+)\.tar\.(\d+)$', f.name)
        if m:
            got.setdefault(m.group(1), {})[m.group(2)] = f
    tmp = rdir(n) / 'tars'
    tmp.mkdir(exist_ok=True)
    done = set(s.get('placed', []))
    for name, pieces in sorted(got.items()):
        if name in done:
            continue
        whole = tmp / (name + '.tar')
        with open(whole, 'wb') as o:
            for k in sorted(pieces):
                o.write(pieces[k].read_bytes())
        try:
            with tarfile.open(whole) as t:
                names = t.getnames()
                bad = [x for x in names if x.startswith('/') or '..' in x or not x.startswith('out/work/')]
                if bad:
                    sys.exit('unexpected paths in ' + name + ': ' + str(bad[:3]))
                t.extractall(ROOT)
        except tarfile.ReadError:
            print(name + ': not complete yet (%d pieces)' % len(pieces))
            continue
        whole.unlink()
        for p in pieces.values():
            p.unlink()
        done.add(name)
        print('placed %s (%d files)' % (name, len(names)))
    state(n, {'placed': sorted(done)})
    want = ['r%d-%s-%s' % (n, stop, x) for x in ['measure'] + [p[0] for p in parts_of(stop)]]
    missing = [w for w in want if w not in done]
    print('missing: ' + (', '.join(missing) or 'none'))
    stale = []
    for f in list((WORK / 'packs' / '.cache' / rid(n)).glob('*.json')) + list((WORK / 'stills').glob('f*-16x9-%s-full.png.json' % still_tier(s))) + [WORK / 'measure' / (stop + '.json')]:
        if not f.exists():
            continue
        try:
            r = json.loads(f.read_text())
        except Exception:
            continue
        if not isinstance(r, dict) or 'engineHash' not in r:
            continue
        sh_ = (r.get('stopHashes') or {}).get(stop, r.get('stopHash'))
        if r['engineHash'] != s['engineHash'] or (sh_ is not None and sh_ != s['stopHash']):
            stale.append(f.name)
    print('records from another build: ' + (', '.join(stale[:6]) or 'none'))


def pack(a):
    n = a.round
    s = state(n)
    stop = s['stop']
    out = subprocess.run('npm run -s pack -- --phase %d --round %d --stop %s%s' % (s['phase'], n, stop, tiers(s, 'pack')), shell=True, cwd=ROOT, capture_output=True, text=True)
    print((out.stdout + out.stderr)[-900:])
    if out.returncode != 0:
        sys.exit(1)
    sh('python3 tools/rubric.py')
    key = json.loads((WORK / 'packs' / 'keys' / (rid(n) + '.json')).read_text())['files']
    P = WORK / 'packs' / rid(n)
    text = PROG.read_text()
    m = re.search(r'^- Next critic name: reviewer_(\d+)', text, re.M)
    num = int(m.group(1))
    first = s['k'] == 1 or a.controls
    jobs = []

    def add(role, model, files, msg, wants_file):
        nonlocal num
        name = 'reviewer_%d' % num
        num += 1
        jobs.append({'name': name, 'role': role, 'model': model, 'attachments': [str(P / f) for f in files], 'files': files, 'message': msg, 'file': wants_file})

    crit = WORK / 'crit'
    lead = lambda t: (crit / (t + '.txt')).read_text()
    names = lambda d: sorted(x.name for x in (P / d).glob('*.png'))
    order = ['R1', 'R3-part1', 'R3-part2', 'R4']
    for i, d in enumerate(order):
        if (P / d).exists():
            add(d, SLOTS[(i + n) % 4], [d + '/' + x for x in names(d)], lead(d.split('-')[0]), True)
    for x in names('R2'):
        if key['R2/' + x]['kind'] == 'approved' and not first:
            continue
        for mdl in JURY:
            add('R2', mdl, ['R2/' + x], lead('R2'), False)
    for x in names('R8'):
        if key['R8/' + x]['kind'] == 'approved' and not first:
            continue
        for mdl in NAMERS:
            add('R8', mdl, ['R8/' + x], lead('R8'), False)
    for j in jobs:
        if j['file']:
            j['message'] += '\nSend the JSON object as the text of your message, and also save the same JSON object in a file named %s.json and attach that file to the message.' % j['name']
    (rdir(n) / 'critics.json').write_text(json.dumps(jobs, indent=1))
    PROG.write_text(re.sub(r'^- Next critic name: reviewer_\d+', '- Next critic name: reviewer_%d' % num, text, count=1, flags=re.M))
    state(n, {'controls': first})
    print('%d critics, %s to %s, written to %s' % (len(jobs), jobs[0]['name'], jobs[-1]['name'], rdir(n) / 'critics.json'))


def votes(a):
    n = a.round
    d = rdir(n) / 'answers'
    d.mkdir(exist_ok=True)
    k = 0
    for line in sys.stdin.read().split('\n'):
        if '|' not in line:
            continue
        name, text = line.split('|', 1)
        (d / (name.strip() + '.txt')).write_text(text.strip() + '\n')
        k += 1
    print('%d answers written' % k)


def letter(t):
    t = t.strip()
    m = re.match(r'^\W*(?:answer|vote|my (?:independent )?(?:visual )?(?:vote|answer))?\W*\(?([a-eA-E])\)?(?![a-zA-Z])', t, re.I)
    if m:
        return m.group(1).lower()
    m = re.search(r'\(([a-e])\)', t)
    if m:
        return m.group(1)
    m = re.search(r'(?:^|[\s:*"])([a-e])(?=[\s,.:;*")]|$)', t)
    return m.group(1) if m else '?'


def named(t, stop):
    for w in re.sub(r'[^a-z ]', ' ', t.lower()).split():
        if w in BODIES:
            return w in NAMES[stop]
    return False


def read_answer(n, name, wants_json):
    d = rdir(n) / 'answers'
    d.mkdir(exist_ok=True)
    if wants_json:
        f = d / (name + '.json')
        if not f.exists():
            for g in sorted(ATT.glob('*/' + name + '.json')):
                shutil.copy(g, f)
        if not f.exists():
            return None
        t = f.read_text()
        try:
            return json.loads(t[t.index('{'):t.rindex('}') + 1])
        except Exception:
            return 'unreadable'
    f = d / (name + '.txt')
    return f.read_text().strip() if f.exists() else None


def tally(issues):
    c = {'severe': 0, 'major': 0, 'minor': 0}
    for i in issues:
        c[i.get('severity', 'minor')] = c.get(i.get('severity', 'minor'), 0) + 1
    return c


def close(a):
    n = a.round
    s = state(n)
    stop, phase = s['stop'], s['phase']
    c = cfg()
    bar = c['quality']['passScore']
    jobs_ = json.loads((rdir(n) / 'critics.json').read_text())
    extra = rdir(n) / 'critics-extra.json'
    if extra.exists():
        jobs_ += json.loads(extra.read_text())
    ans = {j['name']: read_answer(n, j['name'], j['file']) for j in jobs_}
    void = set(s.get('void', []))
    missing = [j['name'] + ' ' + j['role'] + ' ' + j['model'] for j in jobs_ if ans[j['name']] in (None, 'unreadable') and j['name'] not in void]
    if missing:
        print('no answer yet: ' + '; '.join(missing))
        if not a.force:
            return
    key = json.loads((WORK / 'packs' / 'keys' / (rid(n) + '.json')).read_text())
    kf = key['files']
    sc = SC / rid(n)
    sc.mkdir(parents=True, exist_ok=True)
    live = [j for j in jobs_ if j['name'] not in void and isinstance(ans[j['name']], (dict, str)) and ans[j['name']] != 'unreadable']
    by = lambda role: [j for j in live if j['role'] == role]
    cards = {}
    for role in ('R1', 'R4'):
        js = by(role)
        if js:
            j = js[-1]
            card = ans[j['name']]
            cards[role] = card
            (sc / (role + '.json')).write_text(json.dumps(card, indent=1, ensure_ascii=False) + '\n')
    parts = [(1, by('R3-part1')), (2, by('R3-part2'))]
    parts = [(k, js[-1]) for k, js in parts if js]
    if parts:
        pa = [{'part': k, 'family': j['model'], 'answer': ans[j['name']]} for k, j in parts]
        score = min(p['answer'].get('score', 0) for p in pa)
        iss = [i for p in pa for i in p['answer'].get('issues', [])]
        t = tally(iss)
        cards['R3'] = {'critic': 'R3', 'score': score, 'pass': score >= bar and t['severe'] + t['major'] == 0, 'parts': pa, 'issues': iss}
        (sc / 'R3.json').write_text(json.dumps({k: v for k, v in cards['R3'].items() if k != 'issues'}, indent=1, ensure_ascii=False) + '\n')
    lines = []
    for j in live:
        if j['role'] in ('R2', 'R8'):
            lines.append('|'.join([j['name'], j['role'], j['files'][0].split('/')[1], j['model'], ' '.join(str(ans[j['name']]).split())]))
    control_from = n
    if not s.get('controls'):
        text = PROG.read_text()
        earlier = [int(re.match(r'- Round (\d+),', l).group(1)) for l in round_lines(text) if re.match(r'- Round \d+, Phase %d, %s,' % (phase, stop), l)]
        control_from = min(earlier)
    ckey = json.loads((SC / rid(control_from) / 'key.json').read_text())['files'] if control_from != n else kf
    clines = (SC / rid(control_from) / 'jurors.txt').read_text().split('\n') if control_from != n else lines

    def collect(role, src_lines, k, kind):
        out = {}
        for l in src_lines:
            p = l.split('|', 4)
            if len(p) < 5 or p[1] != role:
                continue
            e = k.get(role + '/' + p[2])
            if e and e['kind'] == kind:
                out.setdefault(e.get('view') or e.get('segment', '').split('.')[-1], []).append((p[0], p[3], p[4]))
        return out

    r2c, r2j = collect('R2', clines, ckey, 'approved'), collect('R2', lines, kf, 'frame')
    r8c, r8j = collect('R8', clines, ckey, 'approved'), collect('R8', lines, kf, 'frame')
    over = dict(x.split('=') for x in (a.vote or []))
    vote = lambda v: over.get(v[0], letter(v[2]))
    share = lambda g: (sum(1 for vs in g.values() for v in vs if vote(v) == 'a'), sum(len(vs) for vs in g.values()))
    ca, cn = share(r2c)
    ja, jn = share(r2j)
    gap = c['quality']['jury']['maxShareGap']
    r2pass = jn > 0 and cn > 0 and ja / jn >= ca / cn - gap - 1e-9
    right = lambda g: (sum(1 for vs in g.values() for v in vs if over.get(v[0], 'y' if named(v[2], stop) else 'n') == 'y'), sum(len(vs) for vs in g.values()))
    c8, c8n = right(r8c)
    j8, j8n = right(r8j)
    r8pass = j8n > 0 and j8 >= c8
    (sc / 'jurors.txt').write_text('\n'.join(lines) + '\n')
    (sc / 'agents.json').write_text(json.dumps([{k: j[k] for k in ('name', 'role', 'model', 'files')} for j in jobs_], indent=1) + '\n')
    man = {}
    for d in sorted((WORK / 'packs' / rid(n)).iterdir()):
        if d.is_dir():
            man[d.name] = {'files': sorted(x.name for x in d.glob('*.png'))}
    (sc / 'pack-manifest.json').write_text(json.dumps(man, indent=1) + '\n')
    mfile = WORK / 'measure' / (stop + '.json')
    meas = json.loads(mfile.read_text()) if mfile.exists() else {}
    if meas:
        shutil.copy(mfile, sc / 'measures.json')
    fresh = meas.get('engineHash') == s['engineHash'] and (meas.get('stopHashes') or {}).get(stop, meas.get('stopHash')) == s['stopHash']
    g = {k: (meas.get(k) or {}).get('pass') for k in ('G5', 'G13', 'G17')}
    if not missing:
        shutil.copy(WORK / 'packs' / 'keys' / (rid(n) + '.json'), sc / 'key.json')

    def what(f, role):
        e = kf.get(role + '/' + f) or kf.get(f) or {}
        if e.get('kind') == 'frame':
            return '%s frame %d' % (e['segment'], e['frame'])
        if e.get('kind') in ('sheet', 'cover'):
            return '%s %s, frames %d to %d' % (e['segment'], 'cover sheet' if e['kind'] == 'cover' else 'sheet', e['frames'][0], e['frames'][-1])
        src = e.get('sources')
        if src:
            return ' and '.join(('approved %s image' % x.get('view')) if x.get('kind') == 'approved' else '%s frame %s' % (x.get('segment'), x.get('frame')) for x in src)
        return f

    issues = []
    for role in ('R1', 'R3', 'R4'):
        card = cards.get(role)
        if not card:
            continue
        if role == 'R3':
            for p in card['parts']:
                for i in p['answer'].get('issues', []):
                    issues.append((role, 'R3-part%d' % p['part'], i))
        else:
            for i in card.get('issues', []):
                issues.append((role, role, i))
    rank = {'severe': 0, 'major': 1, 'minor': 2}
    issues.sort(key=lambda x: rank.get(x[2].get('severity'), 3))
    rows = []
    ok = True
    for role in ('R1', 'R3', 'R4'):
        card = cards.get(role)
        if not card:
            rows.append('| %s | no answer | no | | | |' % role)
            ok = False
            continue
        t = tally([i[2] for i in issues if i[0] == role])
        p = card.get('score', 0) >= bar and t['severe'] + t['major'] == 0
        ok = ok and p
        sc_ = str(card.get('score'))
        if role == 'R3':
            sc_ += ' (' + ', '.join('part %d: %s' % (q['part'], q['answer'].get('score')) for q in card['parts']) + ')'
        rows.append('| %s | %s | %s | %d | %d | %d |' % (role, sc_, 'yes' if p else 'no', t['severe'], t['major'], t['minor']))
    rows.insert(1, '| R2 | | %s | | | |' % ('yes' if r2pass else 'no'))
    rows.append('| R8 | | %s | | | |' % ('yes' if r8pass else 'no'))
    measures_ok = fresh and all(g.values())
    holds = ok and r2pass and r8pass and measures_ok and s.get('gateGreen', False)
    seq = lambda grp: '; '.join('%s %s' % (k, ' '.join(vote(v) for v in vs)) for k, vs in sorted(grp.items()))
    fam = lambda role: ', '.join(j['model'] for j in by(role)[-1:])
    md = []
    md.append('# Round %d · Phase %d · %s · round %d of %d\n' % (n, phase, stop, s['k'], c['quality']['maxRoundsPerStop']))
    md.append('- Build: main at %s (engine hash %s, %s hash %s), master format, final tier for judged stills, review tier for sheets, full asset set. Every returned record was checked against these hashes.' % (s['commit'][:7], s['engineHash'], stop, s['stopHash']))
    md.append('- Machine checks before the pack: %s.' % ('green (' + ' '.join(l.split()[1] for l in (rdir(n) / 'gate.txt').read_text().split('\n') if l.startswith('PASS')) + ')' if s.get('gateGreen') else 'not green, see below'))
    md.append('- Measures and the pack were rendered on supporting agents\' VMs at this commit and assembled on the Builder\'s VM with no rendering.')
    md.append('- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 %s. R3 part 1 %s, part 2 %s. R4 %s. R2 five jurors per image: %s. R8 three jurors per image: %s. Controls: %s.\n' % (fam('R1'), fam('R3-part1'), fam('R3-part2'), fam('R4'), ', '.join(JURY), ', '.join(NAMERS), 'judged in this round' if control_from == n else 'reused from round %d' % control_from))
    md.append('## Measures\n')
    md.append('| Check | Result |\n| --- | --- |')
    for k in ('G5', 'G13', 'G17'):
        md.append('| %s | %s |' % (k, 'not measured' if g[k] is None else ('pass' if g[k] else 'fail') + ('' if fresh else ' (stale)')))
    md.append('\n## Scores\n')
    md.append('| Critic | Score | Pass | Severe | Major | Minor |\n| --- | --- | --- | --- | --- | --- |')
    md += rows
    md.append('\nThe pass bar asks R1, R3 and R4 for %d with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It %s.\n' % (bar, 'holds' if holds else 'does not hold'))
    md.append('R2 votes (a = film or game cinematic). Controls: %s, share %d of %d. Judged: %s, share %d of %d. %s.\n' % (seq(r2c), ca, cn, seq(r2j), ja, jn, 'Pass' if r2pass else 'Fail'))
    md.append('R8: judged hold named correctly by %d of %d, control by %d of %d. %s.\n' % (j8, j8n, c8, c8n, 'Pass' if r8pass else 'Fail'))
    md.append('## Issues, worst first\n')
    for k, (role, d, i) in enumerate(issues, 1):
        md.append('%d. %s, %s, %s (%s), %s: "%s" Fix named by the critic: "%s"' % (k, role, i.get('severity'), i.get('file'), what(str(i.get('file')), d), i.get('where'), str(i.get('what')).replace('"', "'"), str(i.get('fix')).replace('"', "'")))
    md.append('\n## What the jurors wrote about the judged frames\n')
    for grp in (r2j, r8j):
        for k, vs in sorted(grp.items()):
            for v in vs:
                md.append('- %s, %s: %s' % (k, v[1], v[2][:400]))
    md.append('\n## What changes next\n')
    md.append(a.next or 'To be written.')
    text_md = '\n'.join(md) + '\n'
    text_md = text_md.replace('\u2014', ',').replace('\u2013', ' to ').replace('!', '.')
    (sc / 'SUMMARY.md').write_text(text_md)
    t = {r: tally([i[2] for i in issues if i[0] == r]) for r in ('R1', 'R3', 'R4')}
    scores = {r: (cards[r].get('score') if r in cards else None) for r in ('R1', 'R3', 'R4')}
    state(n, {'scores': scores, 'R2': r2pass, 'R8': r8pass, 'holds': holds, 'tally': t, 'measures': g, 'fresh': fresh, 'closed': not missing})
    if not missing:
        text = PROG.read_text()
        sev = sum(x['severe'] for x in t.values())
        maj = sum(x['major'] for x in t.values())
        tail = ' Judged on main at %s. Measures %s. R1 %s, R2 %s, R3 %s, R4 %s, R8 %s. %d severe, %d major. %s `scorecards/%s/`.' % (s['commit'][:7], 'green' if measures_ok else 'not green', scores['R1'], 'pass' if r2pass else 'fail', scores['R3'], scores['R4'], 'pass' if r8pass else 'fail', sev, maj, ('The pass bar holds.' if holds else 'Next: ' + (a.next or 'see the summary') + ('' if (a.next or '.').endswith('.') else '.')), rid(n))
        out = []
        for l in text.split('\n'):
            if l.startswith('- Round %d,' % n) and 'scorecards/round-' not in l:
                l = l + tail
            out.append(l)
        text = set_status('\n'.join(out))
        text = set_row(text, stop, {4: scores['R1'], 5: 'pass' if r2pass else 'fail', 6: scores['R3'], 7: scores['R4'], 8: 'pass' if r8pass else 'fail'})
        PROG.write_text(text)
    print('round %d %s: R1 %s R3 %s R4 %s, R2 %s (%d/%d vs %d/%d), R8 %s (%d/%d vs %d/%d), measures %s%s, pass bar %s' % (n, stop, scores['R1'], scores['R3'], scores['R4'], 'pass' if r2pass else 'fail', ja, jn, ca, cn, 'pass' if r8pass else 'fail', j8, j8n, c8, c8n, g, '' if fresh else ' STALE', 'HOLDS' if holds else 'does not hold'))
    for grp, nm in ((r2c, 'R2 control'), (r2j, 'R2 judged'), (r8c, 'R8 control'), (r8j, 'R8 judged')):
        for k, vs in sorted(grp.items()):
            print('  %s %s: %s' % (nm, k, ' | '.join((vote(v) if nm.startswith('R2') else over.get(v[0], 'y' if named(v[2], stop) else 'n')) + ' <' + v[2][:28] + '>' for v in vs)))
    for k, (role, d, i) in enumerate(issues, 1):
        if i.get('severity') != 'minor' or a.all:
            print('  %d. %s %s %s [%s] %s: %s' % (k, role, i.get('severity'), i.get('file'), what(str(i.get('file')), d), str(i.get('where'))[:40], str(i.get('what'))[:150]))


p = argparse.ArgumentParser()
sub = p.add_subparsers(dest='cmd', required=True)
for name, fn in (('start', start), ('jobs', jobs), ('place', place), ('pack', pack), ('votes', votes), ('close', close)):
    q = sub.add_parser(name)
    q.set_defaults(fn=fn)
    q.add_argument('--round', type=int, required=True)
    q.add_argument('--stop')
    q.add_argument('--phase', type=int, default=4)
    q.add_argument('--no-mirror', action='store_true')
    q.add_argument('--allow-red', action='store_true')
    q.add_argument('--no-cover', action='store_true')
    q.add_argument('--controls', action='store_true')
    q.add_argument('--force', action='store_true')
    q.add_argument('--all', action='store_true')
    q.add_argument('--vote', action='append')
    q.add_argument('--next')
    q.add_argument('--scratch', action='store_true')
    q.add_argument('--tier')
    q.add_argument('--every', type=int)
a = p.parse_args()
if a.scratch != (a.round > 900):
    sys.exit('a scratch round has --scratch and a round number above 900; a real round has neither')
if (a.tier or a.every) and not a.scratch:
    sys.exit('--tier and --every are for scratch rounds only')
if a.scratch:
    SCRATCH = True
    home = WORK / 'rounds' / 'scratch'
    home.mkdir(parents=True, exist_ok=True)
    SC = home / 'scorecards'
    if not (home / 'PROGRESS.md').exists():
        shutil.copy(PROG, home / 'PROGRESS.md')
    PROG = home / 'PROGRESS.md'
a.fn(a)
