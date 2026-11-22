#!/usr/bin/env python3
import argparse, datetime, hashlib, json, pathlib, re, shutil, subprocess, sys, tarfile

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


def hashes():
    out = sh('npx tsx -e "import { ensureBuild } from \'./tools/lib/common\'; console.log(\'HASHES \' + JSON.stringify(ensureBuild()))"')
    h = json.loads([l for l in out.split('\n') if l.startswith('HASHES ')][-1][7:])
    return {'engineHash': h['engine'], 'stopHashes': h['stops']}


def moved(s, h):
    out = []
    if s.get('engineHash') != h['engineHash']:
        out.append('engine %s is now %s' % (s.get('engineHash'), h['engineHash']))
    stops = [k for k in h['stopHashes'] if (s.get('stopHashes') or {}).get(k) != h['stopHashes'][k]]
    if stops:
        out.append('stop hashes changed: ' + ', '.join(stops))
    return '; '.join(out)


def on_origin(full):
    if SCRATCH:
        return True
    there = lambda: subprocess.run('git fetch -q origin main && git merge-base --is-ancestor %s origin/main' % full, shell=True, cwd=ROOT, capture_output=True).returncode == 0
    if not there():
        subprocess.run('git merge -q --no-edit origin/main && git push -q origin HEAD:main', shell=True, cwd=ROOT, capture_output=True)
        if not there():
            print('commit %s of the state is not on origin/main: push it before the jobs go out' % full[:8])
            return False
    return True


def checks(n, gate_args, allow_red, expect=None):
    sh('npm run -s build')
    if expect:
        diff = moved(expect, hashes())
        if diff:
            sys.exit('round %d: the tree moved since the build at %s: %s. Nothing checked; run start --round %d --build-only again and hand the jobs out again' % (n, expect['commit'][:8], diff, n))
    t = sh('npx vitest run 2>&1 | tail -12', check=False)
    if 'failed' in t or 'passed' not in t:
        sys.exit('tests:\n' + t)
    if not SCRATCH:
        g9 = subprocess.run('npm run -s gate -- ' + gate_args.split(' --g15')[0] + ' --only G9', shell=True, cwd=ROOT, capture_output=True, text=True)
        if 'FAIL G9' in g9.stdout:
            r = subprocess.run('npm run -s proof', shell=True, cwd=ROOT, capture_output=True, text=True)
            print('export proof made again on this build: ' + ' | '.join(l for l in r.stdout.split('\n') if 'PSNR' in l)[:300])
    g = subprocess.run('npm run -s gate -- ' + gate_args, shell=True, cwd=ROOT, capture_output=True, text=True)
    gate = [l for l in g.stdout.split('\n') if l.startswith(('PASS', 'FAIL'))]
    (rdir(n) / 'gate.txt').write_text('\n'.join(gate) + '\n')
    print('\n'.join(l[:200] for l in gate if l.startswith('FAIL')) or 'gate green: ' + ' '.join(l.split()[1] for l in gate))
    if g.returncode != 0 and not allow_red:
        sys.exit('the gate is red; nothing committed')
    return g.returncode == 0, json.loads((ROOT / 'dist' / 'build.json').read_text())


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
    if a.defer:
        commit('Round %d: %s from agent/%s at %s, checks follow with a later round' % (n, stop, stop, state(n).get('agentHead', 'main')), push=False)
        state(n, {'deferred': True})
        print('round %d %s mirrored at %s, checks deferred' % (n, stop, state(n).get('agentHead', 'main')))
        return
    others = [int(x) for x in (a.with_rounds or '').split(',') if x]
    for m in others:
        if not state(m).get('deferred'):
            sys.exit('round %d was not started with --defer' % m)
    done = sorted(set(finished(PROG.read_text()) + [stop] + [state(m)['stop'] for m in others]))
    green, build = checks(n, '--phase %d --g15-stops %s' % (phase, ','.join(done)), a.allow_red)
    s = state(n)
    sha = commit('Round %d: %s from agent/%s at %s' % (n, stop, stop, s.get('agentHead', 'main')))
    full = sh('git rev-parse HEAD').strip()
    hashes = build.get('stopHashes') or build.get('stops') or {}
    engine = build.get('engineHash') or build.get('engine')
    state(n, {'commit': full, 'engineHash': engine, 'stopHash': hashes.get(stop), 'gateGreen': green})
    print('round %d %s commit %s engine %s stop %s' % (n, stop, sha, state(n)['engineHash'], state(n)['stopHash']))
    for m in others:
        shutil.copy(rdir(n) / 'gate.txt', rdir(m) / 'gate.txt')
        ms = state(m)['stop']
        state(m, {'commit': full, 'engineHash': engine, 'stopHash': hashes.get(ms), 'gateGreen': green, 'deferred': False, 'checkedWith': n})
        print('round %d %s commit %s engine %s stop %s' % (m, ms, sha, engine, hashes.get(ms)))


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
    n = a.round
    s = state(n)
    stop = a.stop or s['stop']
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


def receive(n, s, pattern, shape):
    got = {}
    for f in sorted(ATT.glob(pattern)):
        m = re.match(shape, f.name)
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
    return done


def place(a):
    n = a.round
    s = state(n)
    stop = s['stop']
    done = receive(n, s, '*/r%d-%s-*.tar.*' % (n, stop), r'(r\d+-[a-z]+-[a-z-]+)\.tar\.(\d+)$')
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
    order += sorted(d.name for d in P.glob('R3-part*') if d.name not in order)
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


PHRASES = {'a': r'top.budget|AAA|cinematic', 'b': r'stock', 'c': r'textbook', 'd': r'amateur|generated art', 'e': r'web 3D|web demo|real.time'}


ARTICLE = {'frame': 'a', 'top': 'a', 'aaa': 'a', 'stock': 'b', 'science': 'c', 'textbook': 'c', 'amateur': 'd', 'real': 'e'}


def letter_how(t):
    t = t.strip()
    m = re.match(r'^\W*an?\s+(frame|top|aaa|stock|science|textbook|amateur|real)', t, re.I)
    if m:
        return ARTICLE[m.group(1).lower()], 'phrase'
    m = re.match(r'^\W*(?:answer|vote|my (?:independent )?(?:visual )?(?:vote|answer))?\W*\(?([a-eA-E])\)?(?![a-zA-Z])', t, re.I)
    if m:
        return m.group(1).lower(), 'start'
    m = re.search(r'\(([a-e])\)', t)
    if m:
        return m.group(1), 'brackets'
    hits = [k for k, w in PHRASES.items() if re.search(w, t, re.I)]
    if len(hits) == 1:
        return hits[0], 'phrase'
    m = re.search(r'(?:^|[\s:*"])([b-e])(?=[\s,.:;*")]|$)', t)
    return (m.group(1), 'prose') if m else ('?', 'none')


def letter(t):
    return letter_how(t)[0]


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
    more = sorted(set(int(j['role'][7:]) for j in jobs_ if j['role'].startswith('R3-part')) - {1, 2})
    parts = [(k, by('R3-part%d' % k)) for k in [1, 2] + more]
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
    loose = [(v[0], vote(v), v[2][:60]) for grp in (r2c, r2j) for vs in grp.values() for v in vs if v[0] not in over and letter_how(v[2])[1] != 'start']
    if loose:
        print('  votes not read from the start of the answer; check them and correct with --vote NAME=LETTER:')
        for x in loose:
            print('    %s read as %s <%s>' % x)
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
    md.append('- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. R1 %s. R3 part 1 %s, part 2 %s%s. R4 %s. R2 five jurors per image: %s. R8 three jurors per image: %s. Controls: %s.\n' % (fam('R1'), fam('R3-part1'), fam('R3-part2'), ''.join(', part %d %s' % (k, fam('R3-part%d' % k)) for k in more), fam('R4'), ', '.join(JURY), ', '.join(NAMERS), 'judged in this round' if control_from == n else 'reused from round %d' % control_from))
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


MACHINE = 'G1,G2,G3,G4,G6,G7,G10,G11,G12,G14,G15'
FILM = {'whole': (5, 'whole film', 'round', 'wholeFilmMaxRounds'), 'record': (6, 'record round', 'run', 'recordRoundMaxRuns'), 'polish': (6, 'polish', 'round', 'polishMaxRounds')}
FOLDER = re.compile(r'^(R[1-8])(?:-(?!part\d)([a-z]+))?(?:-part(\d+))?$')
TAR = 'When the commands have finished: `tar -cf /tmp/%s.tar %s` from the repo root, then `split -b 40m -d /tmp/%s.tar /tmp/%s.tar.` and send the pieces as attachments (at most 10 per message). Nothing else is sent.'


def pix(p):
    from PIL import Image
    return hashlib.sha256(Image.open(p).convert('RGB').tobytes()).hexdigest()[:16]


def stress_base(n):
    f = rdir(n) / 'stress-base.json'
    if not f.exists():
        f.write_text(json.dumps({p.name: pix(p) for p in sorted((WORK / 'stress').glob('*-before-*.png'))}, indent=1))
    return json.loads(f.read_text())


def film_plan(n, s):
    f = rdir(n) / 'plan.json'
    if f.exists() and 'judged' in json.loads(f.read_text()):
        return json.loads(f.read_text())
    lines = sh('npm run -s pack -- --phase %d --round %d --plan --judged%s' % (s['phase'], n, tiers(s, 'pack'))).split('\n')
    plan = json.loads([l for l in lines if l.startswith('PLAN ')][-1][5:])
    f.write_text(json.dumps(plan, indent=1))
    return plan


def film_start(a):
    n = a.round
    mode = 'polish' if a.polish else 'record' if a.record else 'whole' if a.whole else state(n).get('mode', 'whole')
    phase, label, word, limit_key = FILM[mode]
    c = cfg()
    again = mode == 'polish' and any(l.startswith('- Round %d,' % n) for l in round_lines(PROG.read_text()))
    if a.row_only and (mode != 'polish' or again):
        sys.exit('--row-only is for the first start of a polish round' if mode != 'polish' else 'round %d has its row already; start it again without --row-only to run the machine checks' % n)
    if mode == 'whole' and (a.build_only or a.checks):
        sys.exit('--build-only and --checks are for polish rounds and the record round')
    if sum([a.row_only, a.build_only, a.checks]) > 1:
        sys.exit('one of --row-only, --build-only, --checks at a time')
    built = 'engineHash' in state(n)
    if a.checks and not built:
        sys.exit('round %d has no build in its state; run start --round %d --build-only first' % (n, n))
    build = mode != 'whole' and (a.build_only or not built)
    if not SCRATCH and not again and (build or mode == 'whole'):
        if sh('git status --porcelain').strip():
            sys.exit('the tree is not clean')
        sh('git fetch -q origin main && git merge -q --no-edit origin/main')
    text = PROG.read_text()
    if not any(l.startswith('- Round %d,' % n) for l in round_lines(text)):
        k = len([l for l in round_lines(text) if re.match(r'- Round \d+, Phase %d, %s,' % (phase, label), l)]) + 1
        limit = c['quality'][limit_key]
        if k > limit:
            sys.exit('the %s has used its %d %ss' % (label, limit, word))
        day = datetime.datetime.utcnow().strftime('%Y-%m-%d %H:%M')
        line = '- Round %d, Phase %d, %s, %s %d of %d. Started %s UTC.' % (n, phase, label, word, k, limit, day)
        i, j = section(text, 'Rounds')
        text = text[:j].rstrip('\n') + '\n' + line + '\n' + text[j:]
        PROG.write_text(set_status(text))
        commit('Round %d starts: Phase %d, %s, %s %d of %d' % (n, phase, label, word, k, limit))
        state(n, {'round': n, 'mode': mode, 'phase': phase, 'k': k, 'limit': limit, 'tier': a.tier, 'every': a.every})
    if mode == 'polish':
        stress_base(n)
    if a.row_only:
        print('round %d polish, round %d of %d: the row is written; merge the batch, then start again without --row-only' % (n, state(n)['k'], state(n)['limit']))
        return
    if mode == 'whole':
        green, made = checks(n, '--phase %d --only %s' % (phase, MACHINE), a.allow_red)
        sha = commit('Round %d: %s, machine checks %s' % (n, label, 'green' if green else 'not green'))
        full = sh('git rev-parse HEAD').strip()
        state(n, {'commit': full, 'engineHash': made.get('engineHash') or made.get('engine'), 'stopHashes': made.get('stopHashes') or made.get('stops') or {}, 'gateGreen': green})
        print('round %d %s commit %s engine %s' % (n, label, sha, state(n)['engineHash']))
        return
    if build:
        if not SCRATCH:
            commit('Round %d: %s, the tree at the build' % (n, label), push=False)
            sh('git fetch -q origin main && git merge -q --no-edit origin/main')
        sh('npm run -s build')
        h = hashes()
        commit('Round %d: %s, the tree at the build' % (n, label), push=False)
        full = sh('git rev-parse HEAD').strip()
        s = state(n)
        if moved(s, h):
            s.pop('gateGreen', None)
            (rdir(n) / 'gate.txt').unlink(missing_ok=True)
        s.update({'commit': full, **h})
        (rdir(n) / 'state.json').write_text(json.dumps(s, indent=1))
        print('round %d %s build: commit %s engine %s stops %s' % (n, label, full, h['engineHash'], ' '.join('%s=%s' % x for x in h['stopHashes'].items())))
        pushed = on_origin(full)
    if a.build_only:
        print('round %d %s: %s; the machine checks follow with start --round %d --checks' % (n, label, 'jobs can go out' if pushed else 'no jobs before the push', n))
        return
    s = state(n)
    green, made = checks(n, '--phase %d --only %s' % (phase, MACHINE), a.allow_red, s)
    commit('Round %d: %s, machine checks %s' % (n, label, 'green' if green else 'not green'))
    state(n, {'gateGreen': green})
    print('round %d %s commit %s engine %s: machine checks %s' % (n, label, s['commit'][:8], s['engineHash'], 'green' if green else 'not green'))
    on_origin(s['commit'])


def film_jobs(a):
    n = a.round
    s = state(n)
    c = cfg()
    sha, r, st = s['commit'], rid(n), still_tier(s)
    polish = s['mode'] == 'polish'
    named = [x['id'] for x in c['stops']]
    if polish and a.stops:
        named = [x for x in named if x in a.stops.split(',')]
        odd = [x for x in a.stops.split(',') if x not in named]
        if odd:
            sys.exit('--stops: unknown stop ' + ', '.join(odd))
    elif a.stops or a.no_stress:
        sys.exit('--stops and --no-stress are for polish rounds')
    lines = sh('npm run -s pack -- --phase %d --round %d --plan%s%s' % (s['phase'], n, ' --judged' if polish else '', tiers(s, 'pack'))).split('\n')
    plan = json.loads([l for l in lines if l.startswith('PLAN ')][-1][5:])
    (rdir(n) / 'plan.json').write_text(json.dumps(plan, indent=1))
    per, cap = a.sample_seconds, a.job_minutes * 60
    cache = 'out/work/packs/.cache/' + r
    stills = 'out/work/stills/f*-16x9-%s-full.png out/work/stills/f*-16x9-%s-full.png.json' % (st, st)
    pre = 'Before the command: `rm -rf %s out/work/stills/*-%s-full.png*`. ' % (cache, st)
    out = []

    def add(name, cmd, paths, samples, before=''):
        out.append({'name': name, 'worker': 0, 'minutes': round(samples * per / 60, 1), 'message': 'JOB %s. Commit %s. %sCommand: `%s`. %s' % (name, sha, before, cmd, TAR % (name, ' '.join(paths), name, name))})

    def groups(items):
        res, cur, total = [], [], 0
        for x in items:
            if cur and (total + x['samples']) * per > cap:
                res.append(cur)
                cur, total = [], 0
            cur.append(x)
            total += x['samples']
        return res + ([cur] if cur else [])

    cmd = lambda only, stop='': 'npm run pack -- --phase %d --round %d%s --only %s%s' % (s['phase'], n, ' --stop ' + stop if stop else '', ','.join(only), tiers(s, 'pack'))
    weigh = lambda g: sum(x['samples'] for x in g)
    for k, g in enumerate(groups(plan['finals']), 1):
        have = set(x['frame'] for x in g)
        whole = [x['part'] for x in plan['composites'] if set(x['frames']) <= have]
        add('r%d-film-stills%02d' % (n, k), cmd(['stills:%d-%d' % (g[0]['frame'], g[-1]['frame'])] + whole), [cache, stills], weigh(g), pre)
    tiles = {x['part']: x['tiles'] for x in plan['sheets']}

    def sheets(name, parts, samples, stop=''):
        cut = groups([{'frame': f, 'samples': v} for f, v in tiles[parts[0]]]) if len(parts) == 1 and samples * per > cap else []
        if len(cut) < 2:
            return add(name, cmd(parts, stop), [cache], samples, pre)
        for k, g in enumerate(cut):
            add('%s-%s' % (name, chr(97 + k)), cmd(parts, stop) + ' --frames %d-%d' % (g[0]['frame'], g[-1]['frame']), [cache], weigh(g), pre)

    for k, g in enumerate(groups([x for x in plan['sheets'] if x['stop'] is None]), 1):
        sheets('r%d-film-motion%02d' % (n, k), [x['part'] for x in g], weigh(g))
    q = c['quality']['stress']
    true = json.loads(sh('npm run -s samples -- --stress --tier %s' % (s.get('tier') or q['tier'])).strip().split('\n')[-1])
    for k, g in enumerate(groups([{'id': i, 'samples': true[i]} for i in q['segments'] if not (polish and a.no_stress)]), 1):
        ids = [x['id'] for x in g]
        add('r%d-film-stress%02d' % (n, k), 'npm run stress -- --segment %s%s' % (','.join(ids), tiers(s, 'stress')), ['out/work/stress/%s-before-*.png out/work/stress/%s-after-*.png out/work/stress/%s.json' % (i, i, i) for i in ids], weigh(g))
    if s['mode'] == 'record' or polish:
        cost = {x['part']: x['samples'] for x in plan['sheets']}
        for stop in named:
            name = 'r%d-%s-measure' % (n, stop)
            out.append({'name': name, 'worker': 0, 'minutes': a.measure_minutes, 'message': 'JOB %s. Commit %s. Command: `npm run measure -- --stop %s%s`. %s' % (name, sha, stop, tiers(s, 'measure'), TAR % (name, 'out/work/measure/%s.json' % stop, name, name))})
            for label, only in parts_of(stop):
                if label != 'stills':
                    sheets('r%d-%s-%s' % (n, stop, label), only, sum(cost[x] for x in only), stop)
    load = [0.0] * a.workers
    for j in sorted(out, key=lambda j: -j['minutes']):
        w = load.index(min(load))
        j['worker'] = w + 1
        load[w] += j['minutes']
    (rdir(n) / 'jobs.json').write_text(json.dumps(out, indent=1))
    for j in out:
        print('%-26s worker %d  %5.1f min  %s' % (j['name'], j['worker'], j['minutes'], re.search(r'Command: `(.*?)`', j['message']).group(1)[:150]))
    print('%d jobs, %d workers, expected minutes per worker: %s; longest job %.1f min, at %.1f s per sample' % (len(out), a.workers, ' '.join('%.0f' % x for x in load), max(j['minutes'] for j in out), per))


def film_place(a):
    n = a.round
    s = state(n)
    if s['mode'] == 'polish':
        stress_base(n)
    done = receive(n, s, '*/r%d-*.tar.*' % n, r'(r\d+-[a-z]+-[a-z0-9-]+)\.tar\.(\d+)$')
    want = [j['name'] for j in json.loads((rdir(n) / 'jobs.json').read_text())]
    missing = [w for w in want if w not in done]
    print('missing: ' + (', '.join(missing) or 'none'))
    cache = WORK / 'packs' / '.cache' / rid(n)
    if (cache / 'tiles').exists():
        out = subprocess.run('npm run -s pack -- --phase %d --round %d --join%s' % (s['phase'], n, tiers(s, 'pack')), shell=True, cwd=ROOT, capture_output=True, text=True)
        print('\n'.join(l for l in (out.stdout + out.stderr).split('\n') if l.startswith(('sheet ', 'pack '))) or (out.stdout + out.stderr)[-600:])
    stale = []
    files = list(cache.glob('*.json')) + list(cache.glob('tiles/*/*.json')) + list((WORK / 'stills').glob('f*-16x9-%s-full.png.json' % still_tier(s)))
    files += [WORK / 'stress' / (i + '.json') for i in cfg()['quality']['stress']['segments']]
    if s['mode'] in ('record', 'polish'):
        files += [WORK / 'measure' / (i + '.json') for i in s['stopHashes']]
    for f in files:
        if not f.exists():
            continue
        try:
            r = json.loads(f.read_text())
        except Exception:
            continue
        if not isinstance(r, dict) or 'engineHash' not in r:
            continue
        if r['engineHash'] != s['engineHash'] or any(s['stopHashes'].get(k) != v for k, v in (r.get('stopHashes') or {}).items()):
            stale.append(f.name)
    print('records from another build: ' + (', '.join(stale[:6]) or 'none'))


STOP_KINDS = ('hold', 'dive', 'terrain', 'rise')


def film_touched(a):
    n = a.round
    s = state(n)
    if s.get('mode') != 'polish':
        sys.exit('touched is a step of a polish round')
    if not a.base:
        sys.exit('touched takes --base FILE')
    base = json.loads(pathlib.Path(a.base).read_text())
    plan = film_plan(n, s)
    c = cfg()
    stops = [x['id'] for x in c['stops']]
    unknown = []

    def changed(group, f):
        want = (base.get(group) or {}).get(f.name)
        if want is None:
            unknown.append(f.name)
            return None
        return pix(f) != want

    def record_of(f):
        try:
            r = json.loads(pathlib.Path(str(f) + '.json').read_text())
        except Exception:
            return None
        return r['engineHash'] == s['engineHash'] and all(s['stopHashes'].get(k) == v for k, v in (r.get('stopHashes') or {}).items())

    stills = sorted((WORK / 'stills').glob('f*-16x9-%s-full.png' % still_tier(s)))
    images = [f for f in sorted((WORK / 'packs' / '.cache' / rid(n)).glob('*.png')) if not f.name.startswith('compression-')]
    wanted = set(x['frame'] for x in plan['finals'])
    here = set(int(f.name[1:6]) for f in stills)
    stale = [f.name for f in stills + images if record_of(f) is False]
    frames = set(int(f.name[1:6]) for f in stills if changed('stills', f) is not False)
    judged = {j['frame']: j for j in plan['judged']}
    sheet_stop = {x['part']: x['stop'] for x in plan['sheets']}
    sel = {st: {'frames': set(), 'sheets': set(), 'R1': False, 'R8': False, 'R2': False} for st in stops}
    film = {'frames': set(), 'sheets': set(), 'R5': False, 'R6': False, 'R7': [], 'R2': False}

    def frame_hit(f):
        j = judged.get(f)
        if not j:
            return
        if j['stop'] in sel and j['kind'] in STOP_KINDS:
            sel[j['stop']]['frames'].add(f)
            if j['why'] in ('hold', 'terrain'):
                sel[j['stop']]['R1'] = sel[j['stop']]['R8'] = True
        else:
            film['frames'].add(f)

    for f in frames:
        frame_hit(f)
    for x in plan['composites']:
        if frames & set(x['frames']):
            film['R6' if x['part'] == 'hook' else 'R5'] = True
    moved = 0
    for f in images:
        made = re.match(r'(detail|match|jury|whole-jury|whole-control)-', f.name)
        hit = changed('cache', f)
        if hit is False or (hit is None and made):
            continue
        moved += 1
        name = f.name[:-4]
        m = re.match(r'motion-(.+)$', name)
        if m and m.group(1) in sheet_stop:
            (sel[sheet_stop[m.group(1)]] if sheet_stop[m.group(1)] else film)['sheets'].add(m.group(1))
        elif re.match(r'whole-(film|holds)-', name):
            film['R5'] = True
        elif name.startswith('hook-'):
            film['R6'] = True
        elif re.match(r'detail(-crop)?-(\d+)', name):
            frame_hit(int(re.match(r'detail(-crop)?-(\d+)', name).group(2)))
        elif re.match(r'(match|jury)-([a-z]+)\.(hold|terrain)', name):
            m = re.match(r'(match|jury)-([a-z]+)\.(hold|terrain)', name)
            if m.group(2) in sel:
                sel[m.group(2)]['R1' if m.group(1) == 'match' else 'R8'] = True
    kept = base.get('stress') or stress_base(n)
    for seg in c['quality']['stress']['segments']:
        mine = sorted((WORK / 'stress').glob(seg + '-before-*.png'))
        if mine and (not all(f.name in kept for f in mine) or any(pix(f) != kept[f.name] for f in mine)):
            film['R7'].append(seg)
    order = [x['part'] for x in plan['sheets']]
    out = {'base': a.base, 'stops': {st: dict(v, frames=sorted(v['frames']), sheets=sorted(v['sheets'], key=order.index)) for st, v in sel.items()}, 'film': dict(film, frames=sorted(film['frames']), sheets=sorted(film['sheets'], key=order.index)), 'unknown': sorted(set(unknown))}
    (SC / rid(n)).mkdir(parents=True, exist_ok=True)
    f = SC / rid(n) / 'select.json'
    f.write_text(json.dumps(out, indent=1) + '\n')
    yn = lambda x: 'yes' if x else 'no'
    some = lambda xs: ', '.join(str(x) for x in xs) or 'none'
    for st in stops:
        v = out['stops'][st]
        print('%-8s frames %s; sheets %s; R1 %s, R8 %s, R2 %s' % (st, some(v['frames']), some(v['sheets']), yn(v['R1']), yn(v['R8']), yn(v['R2'])))
    v = out['film']
    print('%-8s frames %s; sheets %s; R5 %s, R6 %s, R2 %s; R7 %s' % ('film', some(v['frames']), some(v['sheets']), yn(v['R5']), yn(v['R6']), yn(v['R2']), some(v['R7'])))
    print('compared %d stills and %d cache images with %s: %d stills and %d images differ or have no hash there; unknown: %s' % (len(stills), len(images), a.base, len(frames), moved, some(out['unknown'][:8]) + (' and %d more' % (len(out['unknown']) - 8) if len(out['unknown']) > 8 else '')))
    if wanted - here:
        print('final stills not placed yet: ' + some(sorted(wanted - here)))
    if stale:
        print('not from this build (the pack would render them again): ' + some(stale[:8]) + (' and %d more' % (len(stale) - 8) if len(stale) > 8 else ''))
    print('written to %s' % f)


def film_pack(a):
    n = a.round
    s = state(n)
    c = cfg()
    extra = tiers(s, 'pack') + (' --stress-tier ' + s['tier'] if s.get('tier') else '')
    if 'gateGreen' not in s:
        sys.exit('round %d: no pack before the machine checks; run start --round %d --checks first' % (n, n))
    if s['mode'] != 'whole':
        diff = moved(s, hashes())
        if diff:
            sys.exit('round %d: the tree moved since the build at %s: %s. No pack; run start --round %d --build-only again' % (n, s['commit'][:8], diff, n))
    if s['mode'] == 'polish':
        chosen = SC / rid(n) / 'select.json'
        if not chosen.exists():
            sys.exit('no %s: run touched --round %d --base FILE first' % (chosen, n))
        extra += ' --select ' + str(chosen)
    out = subprocess.run('npm run -s pack -- --phase %d --round %d%s' % (s['phase'], n, extra), shell=True, cwd=ROOT, capture_output=True, text=True)
    print((out.stdout + out.stderr)[-1500:])
    if out.returncode != 0:
        sys.exit(1)
    sh('python3 tools/rubric.py')
    key = json.loads((WORK / 'packs' / 'keys' / (rid(n) + '.json')).read_text())['files']
    P = WORK / 'packs' / rid(n)
    text = PROG.read_text()
    num = int(re.search(r'^- Next critic name: reviewer_(\d+)', text, re.M).group(1))
    source = None
    if s['mode'] in ('record', 'polish'):
        source = a.controls_from
    elif s['k'] > 1 and not a.controls:
        source = min(int(re.match(r'- Round (\d+),', l).group(1)) for l in round_lines(text) if re.match(r'- Round \d+, Phase %d, whole film,' % s['phase'], l))
    if source and not (SC / rid(source) / 'jurors.txt').exists():
        sys.exit('round %d has no jurors.txt to take the controls from' % source)
    jobs = []

    def add(role, model, files, msg, wants_file):
        nonlocal num
        jobs.append({'name': 'reviewer_%d' % num, 'role': role, 'model': model, 'attachments': [str(P / f) for f in files], 'files': files, 'message': msg, 'file': wants_file})
        num += 1

    lead = lambda t: (WORK / 'crit' / (t + '.txt')).read_text()
    names = lambda d: sorted(x.name for x in (P / d).glob('*.png'))
    stops = [x['id'] for x in c['stops']]
    found = [(m.group(1), m.group(2) or '', int(m.group(3) or 0), d.name) for d in P.iterdir() for m in [FOLDER.match(d.name)] if d.is_dir() and m]
    order = {'R1': 0, 'R5': 1, 'R6': 2, 'R7': 3, 'R3': 4, 'R4': 5}
    told = sorted([f for f in found if f[0] in order], key=lambda f: (0 if f[1] else 1, stops.index(f[1]) if f[1] else 0, order[f[0]], f[2]))
    seat = {}
    for f in told:
        i = seat.get(f[1], 0)
        seat[f[1]] = i + 1
        add(f[3], SLOTS[(i + n + (stops.index(f[1]) + 1 if f[1] else 0)) % 4], [f[3] + '/' + x for x in names(f[3])], lead(f[0]), True)
    for role, panel in (('R2', JURY), ('R8', NAMERS)):
        for f in sorted([f for f in found if f[0] == role], key=lambda f: f[2]):
            for x in names(f[3]):
                if key[f[3] + '/' + x]['kind'] == 'approved' and source:
                    continue
                for mdl in panel:
                    add(role, mdl, [f[3] + '/' + x], lead(role), False)
    for j in jobs:
        if j['file']:
            j['message'] += '\nSend the JSON object as the text of your message, and also save the same JSON object in a file named %s.json and attach that file to the message.' % j['name']
    (rdir(n) / 'critics.json').write_text(json.dumps(jobs, indent=1))
    PROG.write_text(re.sub(r'^- Next critic name: reviewer_\d+', '- Next critic name: reviewer_%d' % num, text, count=1, flags=re.M))
    state(n, {'controlsFrom': source or n})
    if not jobs:
        print('0 critics: nothing is selected in %s' % (SC / rid(n) / 'select.json'))
        return
    roles = {}
    for j in jobs:
        roles[j['role'] if not j['file'] else j['role'].split('-')[0]] = roles.get(j['role'] if not j['file'] else j['role'].split('-')[0], 0) + 1
    print('%d critics, %s to %s (%s), controls %s, written to %s' % (len(jobs), jobs[0]['name'], jobs[-1]['name'], ', '.join('%s %d' % x for x in sorted(roles.items())), 'reused from round %d' % source if source else 'judged in this round', rdir(n) / 'critics.json'))


def score_of(card):
    try:
        return float(card.get('score'))
    except Exception:
        return 0.0


def told_of(e, f):
    if not e:
        return f
    if e.get('kind') == 'frame':
        return '%s frame %d' % (e['segment'], e['frame'])
    if e.get('kind') in ('sheet', 'cover'):
        return '%s %s, frames %d to %d' % (e['segment'], 'cover sheet' if e['kind'] == 'cover' else 'sheet', e['frames'][0], e['frames'][-1])
    if e.get('kind') == 'film':
        return 'whole film sheet %d, frames %d to %d' % (e['part'], e['frames'][0], e['frames'][-1])
    if e.get('kind') == 'hold':
        return 'sheet of the judged hold frames'
    src = e.get('sources')
    if src:
        say = lambda x: 'approved %s %s image' % (x.get('stop'), x.get('view')) if x.get('kind') == 'approved' else '%s frame %s %s the stress encode' % (x.get('segment'), x.get('frame'), x['kind']) if x.get('kind') in ('before', 'after') else '%s frame %s' % (x.get('segment'), x.get('frame'))
        return ' and '.join(say(x) for x in src)
    return f


def polish_close(a, n, s, c, sc, cards, asked, issues, kf, lines, jobs_, missing, groups, vote, yes, jury, own, source, over):
    r2c, r2j, r8c, r8j = groups
    sel = json.loads((sc / 'select.json').read_text())
    plan = film_plan(n, s)
    stops = [x['id'] for x in c['stops']]
    gap = c['quality']['jury']['maxShareGap']
    chosen = {st: (sel.get('stops') or {}).get(st) or {} for st in stops}
    film = sel.get('film') or {}
    all_frames = {st: [j['frame'] for j in plan['judged'] if j['stop'] == st and j['kind'] in STOP_KINDS] for st in stops}
    between = [j['frame'] for j in plan['judged'] if not (j['stop'] in stops and j['kind'] in STOP_KINDS)]
    all_sheets = {st: [x['part'] for x in plan['sheets'] if x['stop'] == st] for st in stops}
    travels = [x['part'] for x in plan['sheets'] if x['stop'] is None]
    sheet = lambda x: x[:-6] + ' cover' if x.endswith('-cover') else x
    some = lambda xs: ', '.join(str(x) for x in xs)

    def words(pick, flags, frames, sheets, stress=None):
        did, kept = [], []
        for r in flags:
            (did if pick.get(r) else kept).append(r)
        for name, full, show in (('R3 on frame', frames, str), ('R4 on sheet', sheets, sheet)):
            mine = [x for x in full if x in (pick.get('frames' if show is str else 'sheets') or [])]
            rest = [x for x in full if x not in mine]
            for to, xs in ((did, mine), (kept, rest)):
                if xs:
                    to.append('%s%s %s' % (name, 's' if len(xs) > 1 else '', some(show(x) for x in xs)))
        if stress is not None:
            mine = [x for x in stress if x in (pick.get('R7') or [])]
            for to, xs in ((did, mine), (kept, [x for x in stress if x not in mine])):
                if xs:
                    to.append('R7 on %s' % some(xs))
        return did, kept

    said = {st: words(chosen[st], ('R1', 'R2', 'R8'), all_frames[st], all_sheets[st]) for st in stops}
    said_film = words(film, ('R5', 'R6', 'R2'), between, travels, c['quality']['stress']['segments'])
    measured = {}
    for st in stops:
        m = WORK / 'measure' / (st + '.json')
        meas = json.loads(m.read_text()) if m.exists() else {}
        if meas and meas.get('engineHash') == s['engineHash'] and (meas.get('stopHashes') or {}).get(st, meas.get('stopHash')) == s['stopHashes'].get(st):
            shutil.copy(m, sc / ('measures-%s.json' % st))
            how = [x for x in ('every %dth frame' % meas.get('every', 1) if meas.get('every', 1) != 1 else '', ', '.join(sorted(set('%s tier' % (meas.get(k) or {}).get('tier') for k in ('G5', 'G17') if (meas.get(k) or {}).get('tier') not in (None, 'final'))))) if x]
            measured[st] = ({k: (meas.get(k) or {}).get('pass') for k in ('G5', 'G13', 'G17')}, how)
    (sc / 'jurors.txt').write_text('\n'.join(lines) + '\n')
    (sc / 'agents.json').write_text(json.dumps([{k: j[k] for k in ('name', 'role', 'model', 'files')} for j in jobs_], indent=1) + '\n')
    man = {d.name: {'files': sorted(x.name for x in d.glob('*.png'))} for d in sorted((WORK / 'packs' / rid(n)).iterdir()) if d.is_dir()}
    (sc / 'pack-manifest.json').write_text(json.dumps(man, indent=1) + '\n')
    if not missing:
        shutil.copy(WORK / 'packs' / 'keys' / (rid(n) + '.json'), sc / 'key.json')
    r2_film = jury(lambda k: True) if film.get('R2') else None
    for f in sc.glob('R*.json'):
        m = re.match(r'(R[1-8])(?:-([a-z]+))?\.json$', f.name)
        if m and (m.group(1), m.group(2) or '') not in cards:
            f.unlink()
    r2 = {st: jury(own(st)) for st in stops if chosen[st].get('R2')}
    r8 = {}
    for st in stops:
        if chosen[st].get('R8'):
            j8, c8 = r8j.get(st + '.hold', []), r8c.get(st + ' hold', [])
            r8[st] = {'judged': [sum(1 for v in j8 if yes(v, st)), len(j8)], 'control': [sum(1 for v in c8 if yes(v, st)), len(c8)]}
            r8[st]['pass'] = r8[st]['judged'][1] > 0 and r8[st]['judged'][0] >= r8[st]['control'][0]
    rows = sorted(asked, key=lambda k: (0, stops.index(k[1]), k[0]) if k[1] else (1, ['R5', 'R6', 'R7', 'R3', 'R4'].index(k[0]), ''))
    title = lambda k: k[0] + (' ' + k[1] if k[1] else ' whole film' if k[0] in ('R3', 'R4') else '')
    gate = (rdir(n) / 'gate.txt').read_text().split('\n')
    md = ['# Round %d · Phase %d · polish · round %d of %d\n' % (n, s['phase'], s['k'], s['limit'])]
    md.append('- Build: main at %s (engine hash %s), master format, %s tier for stills and whole film sheets, %s tier for motion sheets, full asset set. Every returned record was checked against the hashes of this build.' % (s['commit'][:7], s['engineHash'], still_tier(s), s.get('tier') or 'review'))
    md.append('- Machine checks before the pack: %s.' % ('green (' + ' '.join(l.split()[1] for l in gate if l.startswith('PASS')) + ')' if s.get('gateGreen') else 'not green: ' + '; '.join(l[5:160] for l in gate if l.startswith('FAIL'))))
    md.append('- The stills, the sheets and the measures were rendered on supporting agents\' VMs at this commit and assembled on the Builder\'s VM with no rendering. Every final still and every sheet was compared, pixel for pixel, with the kept build before the round (%s); the selection is in `select.json`.' % pathlib.Path(str(sel.get('base'))).name)
    md.append('- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word.%s%s' % (' R2 %d jurors per image: %s. Controls: %s.' % (len(JURY), ', '.join(JURY), 'judged in this round' if source == n else 'reused from round %d' % source) if r2 or r2_film else '', ' R8 %d jurors per image: %s.' % (len(NAMERS), ', '.join(NAMERS)) if r8 else ''))
    md.append('\nA polish round judges only what its batch touched. It gives no pass for the whole bar; the record round does.\n')
    md.append('## Judged in this round\n')
    md += ['- %s: %s.' % (st, '; '.join(said[st][0])) for st in stops if said[st][0]]
    md += ['- Whole film: %s.' % '; '.join(said_film[0])] if said_film[0] else []
    if not said_film[0] and not any(said[st][0] for st in stops):
        md.append('Nothing.')
    md.append('\n## Not judged, because it kept its bytes\n')
    quiet = [st for st in stops if not said[st][0]]
    if quiet:
        md.append('- Every critic of %s.' % some(quiet))
    md += ['- %s: %s.' % (st, '; '.join(said[st][1])) for st in stops if said[st][0] and said[st][1]]
    md += ['- Whole film: %s.' % '; '.join(said_film[1])] if said_film[1] else []
    if sel.get('unknown'):
        md.append('\nNames with no hash in the kept build\'s list, taken as changed: %s.' % some(sel['unknown']))
    if measured:
        md.append('\n## Measures\n')
        md.append('| Stop | G5 | G13 | G17 | How |\n| --- | --- | --- | --- | --- |')
        md += ['| %s | %s | %s |' % (st, ' | '.join('not measured' if g[k] is None else 'pass' if g[k] else 'fail' for k in ('G5', 'G13', 'G17')), ', '.join(how) or 'every frame, final tier') for st, (g, how) in measured.items()]
    md.append('\n## Scores\n')
    md.append('| Critic | Score | Pass | Severe | Major | Minor | Families |\n| --- | --- | --- | --- | --- | --- | --- |')
    for k in rows:
        x = cards.get(k)
        md.append('| %s | %s | %s | %d | %d | %d | %s |' % (title(k), x['shown'], 'yes' if x['pass'] else 'no', x['tally']['severe'], x['tally']['major'], x['tally']['minor'], x['families']) if x else '| %s | no answer | no | | | | |' % title(k))
    if not rows:
        md.append('| none | | | | | | |')
    md.append('\nA score row passes with %d and no severe or major issue. That is the row alone, not the pass bar.\n' % c['quality']['passScore'])
    seq = lambda grp, keep=lambda k: True: '; '.join('%s %s' % (k, ' '.join(vote(v) for v in vs)) for k, vs in sorted(grp.items()) if keep(k))
    if r2_film or r2:
        md.append('## R2\n')
        md.append('| Scope | Controls (a) | Judged (a) | R2 |\n| --- | --- | --- | --- |')
        for name, x in ([('whole film list', r2_film)] if r2_film else []) + list(r2.items()):
            md.append('| %s | %d of %d | %d of %d | %s |' % (name, x['control'][0], x['control'][1], x['judged'][0], x['judged'][1], 'pass' if x['pass'] else 'fail'))
        keep = (lambda k: True) if r2_film else (lambda k: any(own(st)(k) for st in r2))
        md.append('\nVotes (a = film or game cinematic); the judged share may be at most %s under the control share.\n\n- Controls: %s.\n- Judged: %s.\n' % (gap, seq(r2c, keep), seq(r2j, keep)))
    if r8:
        md.append('## R8\n')
        md.append('| Stop | Control named | Judged named | R8 |\n| --- | --- | --- | --- |')
        md += ['| %s | %d of %d | %d of %d | %s |' % (st, x['control'][0], x['control'][1], x['judged'][0], x['judged'][1], 'pass' if x['pass'] else 'fail') for st, x in r8.items()]
        md.append('')
    md.append('## Issues, worst first\n')
    for k, (critic, scope, folder, i) in enumerate(issues, 1):
        f = str(i.get('file'))
        md.append('%d. %s%s, %s, %s (%s), %s: "%s" Fix named by the critic: "%s"' % (k, critic, ' ' + scope if scope else '', i.get('severity'), f, told_of(kf.get(folder + '/' + f), f), i.get('where'), str(i.get('what')).replace('"', "'"), str(i.get('fix')).replace('"', "'")))
    if r2_film or r2 or r8:
        md.append('\n## What the jurors wrote about the judged frames\n')
        asked_r2 = (lambda k: True) if r2_film else (lambda k: any(own(st)(k) for st in r2))
        for grp, keep in ((r2j, asked_r2), (r8j, lambda k: k.split('.')[0] in r8)):
            for k, vs in sorted(grp.items()):
                if keep(k):
                    md += ['- %s, %s: %s' % (k, v[1], v[2][:400]) for v in vs]
    md.append('\n## What changes next\n')
    md.append(a.next or 'To be written.')
    (sc / 'SUMMARY.md').write_text(('\n'.join(md) + '\n').replace('\u2014', ',').replace('\u2013', ' to ').replace('!', '.'))
    juries = ([('R2', r2_film)] if r2_film else []) + [('R2 ' + st, x) for st, x in r2.items()]
    sev = sum(x['tally']['severe'] for x in cards.values())
    maj = sum(x['tally']['major'] for x in cards.values()) + sum(1 for nm, x in juries if not x['pass'])
    scores = ', '.join(['%s %s' % (title(k), cards[k]['shown'].split(' ')[0] if k in cards else 'no answer') for k in rows] + ['%s %s' % (nm, 'pass' if x['pass'] else 'fail') for nm, x in juries + [('R8 ' + st, x) for st, x in r8.items()]]) or 'nothing was judged'
    state(n, {'scores': {(k[0] + ('-' + k[1] if k[1] else '')): v['score'] for k, v in cards.items()}, 'R2': {nm: x['pass'] for nm, x in juries}, 'R8': {st: x['pass'] for st, x in r8.items()}, 'severe': sev, 'major': maj, 'closed': not missing})
    if not missing:
        text = PROG.read_text()
        nxt = 'Next: ' + (a.next or 'see the summary') + ('' if (a.next or '.').endswith('.') else '.')
        tail = ' Judged on main at %s, only what the batch touched. %s. %d severe, %d major. %s `scorecards/%s/`.' % (s['commit'][:7], scores, sev, maj, nxt, rid(n))
        PROG.write_text(set_status('\n'.join(l + tail if l.startswith('- Round %d,' % n) and 'scorecards/round-' not in l else l for l in text.split('\n'))))
    print('round %d polish: %s; %d severe, %d major; no pass bar is computed in a polish round' % (n, scores, sev, maj))
    for st, (g, how) in measured.items():
        print('  %-8s measures %s%s' % (st, ' '.join('%s %s' % (k, 'not measured' if g[k] is None else 'pass' if g[k] else 'fail') for k in ('G5', 'G13', 'G17')), ' (' + ', '.join(how) + ')' if how else ''))
    for nm, x in juries:
        print('  %s %s (%d/%d vs %d/%d)' % (nm, 'pass' if x['pass'] else 'fail', x['judged'][0], x['judged'][1], x['control'][0], x['control'][1]))
    for st, x in r8.items():
        print('  R8 %s %s (%d/%d vs %d/%d)' % (st, 'pass' if x['pass'] else 'fail', x['judged'][0], x['judged'][1], x['control'][0], x['control'][1]))
    short = [(nm, k, len(vs)) for nm, grp, want in (('R2 control', r2c, len(JURY)), ('R2 judged', r2j, len(JURY)), ('R8 control', r8c, len(NAMERS)), ('R8 judged', r8j, len(NAMERS))) for k, vs in sorted(grp.items()) if len(vs) != want]
    if short:
        print('  images without a full panel: ' + ', '.join('%s %s has %d' % x for x in short))
    loose = [(v[0], vote(v), v[2][:60]) for grp in (r2c, r2j) for vs in grp.values() for v in vs if v[0] not in over and letter_how(v[2])[1] != 'start']
    if loose:
        print('  votes not read from the start of the answer; check them and correct with --vote NAME=LETTER:')
        for x in loose:
            print('    %s read as %s <%s>' % x)
    for k, (critic, scope, folder, i) in enumerate(issues, 1):
        if i.get('severity') != 'minor' or a.all:
            f = str(i.get('file'))
            print('  %d. %s%s %s %s [%s] %s: %s' % (k, critic, ' ' + scope if scope else '', i.get('severity'), f, told_of(kf.get(folder + '/' + f), f), str(i.get('where'))[:40], str(i.get('what'))[:150]))


def film_close(a):
    n = a.round
    s = state(n)
    mode, phase = s['mode'], s['phase']
    label, word = FILM[mode][1], FILM[mode][2]
    c = cfg()
    bar = c['quality']['passScore']
    stops = [x['id'] for x in c['stops']] if mode == 'record' else []
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
    kf = json.loads((WORK / 'packs' / 'keys' / (rid(n) + '.json')).read_text())['files']
    sc = SC / rid(n)
    sc.mkdir(parents=True, exist_ok=True)
    live = [j for j in jobs_ if j['name'] not in void and isinstance(ans[j['name']], (dict, str)) and ans[j['name']] != 'unreadable']
    last = {j['role']: j for j in live if j['file']}
    asked = {}
    for j in jobs_:
        if j['file']:
            m = FOLDER.match(j['role'])
            asked.setdefault((m.group(1), m.group(2) or ''), set()).add((int(m.group(3) or 0), j['role']))
    cards, issues = {}, []
    for (critic, scope), parts in asked.items():
        parts = sorted(parts)
        got = [(k, last[f]) for k, f in parts if f in last]
        if not got:
            continue
        mine = [(critic, scope, j['role'], i) for k, j in got for i in ans[j['name']].get('issues', []) if isinstance(i, dict)]
        t = tally([i[3] for i in mine])
        score = min(score_of(ans[j['name']]) for k, j in got)
        ok = len(got) == len(parts) and score >= bar and t['severe'] + t['major'] == 0
        shown = '%g' % score
        if parts[0][0] == 0:
            body = ans[got[0][1]['name']]
        else:
            body = {'critic': critic, 'score': score, 'pass': ok, 'parts': [{'part': k, 'family': j['model'], 'answer': ans[j['name']]} for k, j in got]}
            shown += ' (' + ', '.join('part %d: %s' % (k, ans[j['name']].get('score')) for k, j in got) + ')' + ('' if len(got) == len(parts) else ', %d of %d parts answered' % (len(got), len(parts)))
        (sc / (critic + ('-' + scope if scope else '') + '.json')).write_text(json.dumps(body, indent=1, ensure_ascii=False) + '\n')
        cards[(critic, scope)] = {'score': score, 'shown': shown, 'pass': ok, 'tally': t, 'families': ', '.join(j['model'] for k, j in got)}
        issues += mine
    rank = {'severe': 0, 'major': 1, 'minor': 2}
    issues.sort(key=lambda x: rank.get(x[3].get('severity'), 3))
    lines = ['|'.join([j['name'], j['role'], j['files'][0].split('/')[1], j['model'], ' '.join(str(ans[j['name']]).split())]) for j in live if not j['file']]
    flat = lambda k: {(p.split('/')[0].split('-')[0], p.split('/')[1]): e for p, e in k.items() if p.startswith(('R2', 'R8'))}
    source = s.get('controlsFrom', n)
    ckey = flat(json.loads((SC / rid(source) / 'key.json').read_text())['files']) if source != n else flat(kf)
    clines = (SC / rid(source) / 'jurors.txt').read_text().split('\n') if source != n else lines

    def collect(role, src_lines, k, kind):
        out = {}
        for l in src_lines:
            p = l.split('|', 4)
            if len(p) < 5 or p[1] != role:
                continue
            e = k.get((role, p[2]))
            if e and e['kind'] == kind:
                out.setdefault(e['stop'] + ' ' + e['view'] if kind == 'approved' else e['segment'], []).append((p[0], p[3], p[4]))
        return out

    r2c, r2j = collect('R2', clines, ckey, 'approved'), collect('R2', lines, flat(kf), 'frame')
    r8c, r8j = collect('R8', clines, ckey, 'approved'), collect('R8', lines, flat(kf), 'frame')
    over = dict(state(source).get('votes', {})) if source != n else {}
    over.update(s.get('votes', {}))
    over.update(x.split('=') for x in (a.vote or []))
    state(n, {'votes': over})
    vote = lambda v: over.get(v[0], letter(v[2]))
    gap = c['quality']['jury']['maxShareGap']

    def jury(keep):
        ca, cn, ja, jn = [f(v) for g in (r2c, r2j) for f in (lambda x: sum(1 for y in x if vote(y) == 'a'), len) for v in [[y for k, vs in sorted(g.items()) if keep(k) for y in vs]]]
        return {'pass': jn > 0 and cn > 0 and ja / jn >= ca / cn - gap - 1e-9, 'control': [ca, cn], 'judged': [ja, jn]}

    own = lambda stop: lambda k: k in (stop + ' hold', stop + ' terrain', stop + '.hold', stop + '.terrain')
    film_r2 = jury(lambda k: True)
    yes = lambda v, stop: over.get(v[0], 'y' if named(v[2], stop) else 'n') == 'y'
    if mode == 'polish':
        return polish_close(a, n, s, c, sc, cards, sorted(asked), issues, kf, lines, jobs_, missing, (r2c, r2j, r8c, r8j), vote, yes, jury, own, source, over)
    board = {}
    for stop in stops:
        m = WORK / 'measure' / (stop + '.json')
        meas = json.loads(m.read_text()) if m.exists() else {}
        if meas:
            shutil.copy(m, sc / ('measures-%s.json' % stop))
        fresh = meas.get('engineHash') == s['engineHash'] and (meas.get('stopHashes') or {}).get(stop, meas.get('stopHash')) == s['stopHashes'].get(stop)
        g = {k: (meas.get(k) or {}).get('pass') for k in ('G5', 'G13', 'G17')}
        how = [x for x in ('every %dth frame' % meas.get('every', 1) if meas.get('every', 1) != 1 else '', ', '.join(sorted(set('%s tier' % (meas.get(k) or {}).get('tier') for k in ('G5', 'G17') if (meas.get(k) or {}).get('tier') not in (None, 'final'))))) if x]
        j8, c8 = r8j.get(stop + '.hold', []), r8c.get(stop + ' hold', [])
        r8 = {'judged': [sum(1 for v in j8 if yes(v, stop)), len(j8)], 'control': [sum(1 for v in c8 if yes(v, stop)), len(c8)]}
        r8['pass'] = r8['judged'][1] > 0 and r8['judged'][0] >= r8['control'][0]
        mine = {r: cards.get((r, stop)) for r in ('R1', 'R3', 'R4')}
        r2 = jury(own(stop))
        t = {k: sum(x['tally'][k] for x in mine.values() if x) for k in ('severe', 'major', 'minor')}
        holds = bool(s.get('gateGreen')) and fresh and all(g.values()) and all(x and x['pass'] for x in mine.values()) and r2['pass'] and r8['pass']
        board[stop] = {'measures': g, 'fresh': fresh, 'how': how, 'cards': mine, 'R2': r2, 'R8': r8, 'tally': t, 'holds': holds}
    film = {r: cards.get((r, '')) for r in ('R5', 'R6', 'R7', 'R3', 'R4')}
    film_t = {k: sum(x['tally'][k] for x in film.values() if x) + (1 if k == 'major' and not film_r2['pass'] else 0) for k in ('severe', 'major', 'minor')}
    film_holds = bool(s.get('gateGreen')) and all(x and x['pass'] for x in film.values()) and film_r2['pass']
    (sc / 'jurors.txt').write_text('\n'.join(lines) + '\n')
    (sc / 'agents.json').write_text(json.dumps([{k: j[k] for k in ('name', 'role', 'model', 'files')} for j in jobs_], indent=1) + '\n')
    man = {d.name: {'files': sorted(x.name for x in d.glob('*.png'))} for d in sorted((WORK / 'packs' / rid(n)).iterdir()) if d.is_dir()}
    (sc / 'pack-manifest.json').write_text(json.dumps(man, indent=1) + '\n')
    if not missing:
        shutil.copy(WORK / 'packs' / 'keys' / (rid(n) + '.json'), sc / 'key.json')
    row = lambda name, x: '| %s | %s | %s | %d | %d | %d |' % (name, x['shown'], 'yes' if x['pass'] else 'no', x['tally']['severe'], x['tally']['major'], x['tally']['minor']) if x else '| %s | no answer | no | | | |' % name
    cell = lambda x: x['shown'] if x else 'no answer'
    seq = lambda grp, keep=lambda k: True: '; '.join('%s %s' % (k, ' '.join(vote(v) for v in vs)) for k, vs in sorted(grp.items()) if keep(k))
    gate = (rdir(n) / 'gate.txt').read_text().split('\n')
    md = ['# Round %d · Phase %d · %s · %s %d of %d\n' % (n, phase, label, word, s['k'], s['limit'])]
    md.append('- Build: main at %s (engine hash %s), master format, %s tier for stills and whole film sheets, %s tier for motion sheets, full asset set. Every returned record was checked against the hashes of this build.' % (s['commit'][:7], s['engineHash'], still_tier(s), s.get('tier') or 'review'))
    md.append('- Machine checks before the pack: %s.' % ('green (' + ' '.join(l.split()[1] for l in gate if l.startswith('PASS')) + ')' if s.get('gateGreen') else 'not green: ' + '; '.join(l[5:160] for l in gate if l.startswith('FAIL'))))
    md.append('- The pack%s rendered on supporting agents\' VMs at this commit and assembled on the Builder\'s VM with no rendering.' % (' and the measures were' if stops else ' was'))
    fam = lambda r, scope='': cards[(r, scope)]['families'] if (r, scope) in cards else 'no answer'
    md.append('- Critics: every critic was a fresh agent on its own VM with attachments only and its rubric word for word. Whole film: %s. R2 %d jurors per image: %s.%s Controls: %s.' % (', '.join('%s %s' % (r, fam(r)) for r in ('R5', 'R6', 'R7', 'R3', 'R4')), len(JURY), ', '.join(JURY), ' R8 %d jurors per image: %s.' % (len(NAMERS), ', '.join(NAMERS)) if stops else '', 'judged in this round' if source == n else 'reused from round %d' % source))
    if stops:
        md.append('- Critics of the stops: ' + '. '.join('%s: %s' % (st, ', '.join('%s %s' % (r, fam(r, st)) for r in ('R1', 'R3', 'R4'))) for st in stops) + '.')
        md.append('\n## Stops\n')
        md.append('| Stop | G5 | G13 | G17 | R1 | R2 | R3 | R4 | R8 | Severe | Major | Pass bar |\n| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
        for st in stops:
            b = board[st]
            g = ['not measured' if b['measures'][k] is None else ('pass' if b['measures'][k] else 'fail') + ('' if b['fresh'] else ' (stale)') for k in ('G5', 'G13', 'G17')]
            md.append('| %s | %s | %s | %s | %s | %s | %s | %d | %d | %s |' % (st, ' | '.join(g), cell(b['cards']['R1']), 'pass' if b['R2']['pass'] else 'fail', cell(b['cards']['R3']), cell(b['cards']['R4']), 'pass' if b['R8']['pass'] else 'fail', b['tally']['severe'], b['tally']['major'], 'holds' if b['holds'] else 'does not hold'))
        odd = ['%s (%s)' % (st, ', '.join(board[st]['how'])) for st in stops if board[st]['how']]
        if odd:
            md.append('\nMeasures not taken on every frame at the final tier: %s.' % '; '.join(odd))
        md.append('\nA stop\'s pass bar asks R1, R3 and R4 for %d with no severe or major issue open, R2 and R8 to pass, and the measures and machine checks green. It holds for %s.\n' % (bar, ', '.join(st for st in stops if board[st]['holds']) or 'no stop'))
        md.append('## Whole film\n')
    else:
        md.append('\n## Scores\n')
    md.append('| Critic | Score | Pass | Severe | Major | Minor |\n| --- | --- | --- | --- | --- | --- |')
    md += [row(r, film[r]) for r in ('R5', 'R6', 'R7')] + ['| R2 | | %s | | | |' % ('yes' if film_r2['pass'] else 'no')] + [row(r, film[r]) for r in ('R3', 'R4')]
    md.append('\nThe whole film pass bar asks R5, R6, R7, R3 and R4 for %d with no severe or major issue open, R2 to pass on its whole film list, and the machine checks green. It %s.\n' % (bar, 'holds' if film_holds else 'does not hold'))
    md.append('R2 votes on the whole film list (a = film or game cinematic). Controls: share %d of %d. Judged: share %d of %d. %s: the judged share may be at most %s under the control share.\n' % (film_r2['control'][0], film_r2['control'][1], film_r2['judged'][0], film_r2['judged'][1], 'Pass' if film_r2['pass'] else 'Fail', gap))
    md.append('- Controls: %s.\n- Judged: %s.\n' % (seq(r2c), seq(r2j)))
    lowest = lambda r: min([(board[st]['cards'][r]['score'], st) for st in stops if board[st]['cards'][r]] + ([(film[r]['score'], 'whole film')] if film.get(r) else []), key=lambda x: x[0], default=None)
    final = ''
    if stops:
        md.append('## R2 and R8 by stop\n')
        md.append('| Stop | R2 controls (a) | R2 judged (a) | R2 | R8 control named | R8 judged named | R8 |\n| --- | --- | --- | --- | --- | --- | --- |')
        for st in stops:
            b = board[st]
            md.append('| %s | %d of %d | %d of %d | %s | %d of %d | %d of %d | %s |' % (st, b['R2']['control'][0], b['R2']['control'][1], b['R2']['judged'][0], b['R2']['judged'][1], 'pass' if b['R2']['pass'] else 'fail', b['R8']['control'][0], b['R8']['control'][1], b['R8']['judged'][0], b['R8']['judged'][1], 'pass' if b['R8']['pass'] else 'fail'))
        low = {r: lowest(r) for r in ('R1', 'R3', 'R4')}
        final = 'Final scores: ' + ', '.join(['R1 ' + ('%s %g' % (low['R1'][1], low['R1'][0]) if low['R1'] else 'no answer'), 'R2 ' + ('pass' if film_r2['pass'] and all(board[st]['R2']['pass'] for st in stops) else 'fail')] + ['%s %s' % (r, '%s %g' % (low[r][1], low[r][0]) if low[r] else 'no answer') for r in ('R3', 'R4')] + ['%s %s' % (r, cell(film[r]).split(' ')[0] if film[r] else 'no answer') for r in ('R5', 'R6', 'R7')] + ['R8 ' + ('pass' if all(board[st]['R8']['pass'] for st in stops) else 'fail')])
        md.append('\n' + final + '\n')
        md.append('R1, R3 and R4 name the lowest stop; R3 and R4 count the whole film critics too. R2 is pass when the whole film list and every stop pass. R8 is pass when every stop passes.\n')
    md.append('## Issues, worst first\n')
    for k, (critic, scope, folder, i) in enumerate(issues, 1):
        f = str(i.get('file'))
        md.append('%d. %s%s, %s, %s (%s), %s: "%s" Fix named by the critic: "%s"' % (k, critic, ' ' + scope if scope else '', i.get('severity'), f, told_of(kf.get(folder + '/' + f), f), i.get('where'), str(i.get('what')).replace('"', "'"), str(i.get('fix')).replace('"', "'")))
    md.append('\n## What the jurors wrote about the judged frames\n')
    for grp in (r2j, r8j):
        for k, vs in sorted(grp.items()):
            for v in vs:
                md.append('- %s, %s: %s' % (k, v[1], v[2][:400]))
    md.append('\n## What changes next\n')
    md.append(a.next or ('Nothing. The record round is a record and is not followed by fixes.' if stops else 'To be written.'))
    text_md = ('\n'.join(md) + '\n').replace('\u2014', ',').replace('\u2013', ' to ').replace('!', '.')
    (sc / 'SUMMARY.md').write_text(text_md)
    sev = film_t['severe'] + sum(board[st]['tally']['severe'] for st in stops)
    maj = film_t['major'] + sum(board[st]['tally']['major'] + (0 if board[st]['R2']['pass'] else 1) for st in stops)
    state(n, {'scores': {(k[0] + ('-' + k[1] if k[1] else '')): v['score'] for k, v in cards.items()}, 'R2': film_r2['pass'], 'holds': film_holds, 'stopsHold': {st: board[st]['holds'] for st in stops}, 'severe': sev, 'major': maj, 'closed': not missing})
    scores = ', '.join(['%s %s' % (r, cell(film[r]).split(' ')[0] if film[r] else 'no answer') for r in ('R5', 'R6', 'R7')] + ['R2 ' + ('pass' if film_r2['pass'] else 'fail')] + ['%s %s' % (r, cell(film[r]).split(' ')[0] if film[r] else 'no answer') for r in ('R3', 'R4')])
    if not missing:
        text = PROG.read_text()
        nxt = 'Next: ' + (a.next or 'see the summary') + ('' if (a.next or '.').endswith('.') else '.')
        if stops:
            good = [st for st in stops if board[st]['holds']]
            tail = ' Judged on main at %s. A stop\'s pass bar holds for %d of %d stops%s. Whole film: %s; its pass bar %s. %d severe, %d major. The scores are under "Final scores". `scorecards/%s/`.' % (s['commit'][:7], len(good), len(stops), ' (' + ', '.join(good) + ')' if good else '', scores, 'holds' if film_holds else 'does not hold', sev, maj, rid(n))
        else:
            tail = ' Judged on main at %s. %s. %d severe, %d major. %s `scorecards/%s/`.' % (s['commit'][:7], scores, sev, maj, 'The whole film pass bar holds.' if film_holds else nxt, rid(n))
        text = set_status('\n'.join(l + tail if l.startswith('- Round %d,' % n) and 'scorecards/round-' not in l else l for l in text.split('\n')))
        if stops:
            i, j = section(text, 'Final scores')
            at = text_md.index('## Stops\n')
            body = 'From the record round: round %d, run %d of %d, on main at %s. `scorecards/%s/`.\n\n' % (n, s['k'], s['limit'], s['commit'][:7], rid(n)) + text_md[at + len('## Stops\n'):text_md.index('## Issues, worst first')].strip('\n').replace('\n## ', '\n### ')
            text = text[:i] + '\n## Final scores\n\n' + body + '\n' + text[j:]
        PROG.write_text(text)
    print('round %d %s: %s, R2 %d/%d vs %d/%d; whole film pass bar %s; %d severe, %d major' % (n, label, scores, film_r2['judged'][0], film_r2['judged'][1], film_r2['control'][0], film_r2['control'][1], 'HOLDS' if film_holds else 'does not hold', sev, maj))
    for st in stops:
        b = board[st]
        print('  %-8s measures %s%s R1 %s R3 %s R4 %s R2 %s (%d/%d vs %d/%d) R8 %s (%d/%d vs %d/%d) pass bar %s' % (st, ''.join('?' if b['measures'][k] is None else 'y' if b['measures'][k] else 'n' for k in ('G5', 'G13', 'G17')), '' if b['fresh'] else ' STALE', cell(b['cards']['R1']), cell(b['cards']['R3']), cell(b['cards']['R4']), 'pass' if b['R2']['pass'] else 'fail', b['R2']['judged'][0], b['R2']['judged'][1], b['R2']['control'][0], b['R2']['control'][1], 'pass' if b['R8']['pass'] else 'fail', b['R8']['judged'][0], b['R8']['judged'][1], b['R8']['control'][0], b['R8']['control'][1], 'HOLDS' if b['holds'] else 'does not hold'))
    if final:
        print(final)
    short = [(nm, k, len(vs)) for nm, grp, want in (('R2 control', r2c, len(JURY)), ('R2 judged', r2j, len(JURY)), ('R8 control', r8c, len(NAMERS)), ('R8 judged', r8j, len(NAMERS))) for k, vs in sorted(grp.items()) if len(vs) != want]
    if short:
        print('  images without a full panel: ' + ', '.join('%s %s has %d' % x for x in short))
    loose = [(v[0], vote(v), v[2][:60]) for grp in (r2c, r2j) for vs in grp.values() for v in vs if v[0] not in over and letter_how(v[2])[1] != 'start']
    if loose:
        print('  votes not read from the start of the answer; check them and correct with --vote NAME=LETTER:')
        for x in loose:
            print('    %s read as %s <%s>' % x)
    for k, (critic, scope, folder, i) in enumerate(issues, 1):
        if i.get('severity') != 'minor' or a.all:
            f = str(i.get('file'))
            print('  %d. %s%s %s %s [%s] %s: %s' % (k, critic, ' ' + scope if scope else '', i.get('severity'), f, told_of(kf.get(folder + '/' + f), f), str(i.get('where'))[:40], str(i.get('what'))[:150]))


p = argparse.ArgumentParser()
sub = p.add_subparsers(dest='cmd', required=True)
STEPS = {'start': (start, film_start), 'jobs': (jobs, film_jobs), 'place': (place, film_place), 'touched': (None, film_touched), 'pack': (pack, film_pack), 'votes': (votes, votes), 'close': (close, film_close)}
for name in STEPS:
    q = sub.add_parser(name)
    q.add_argument('--round', type=int, required=True)
    q.add_argument('--stop')
    q.add_argument('--phase', type=int, default=4)
    q.add_argument('--whole', action='store_true')
    q.add_argument('--record', action='store_true')
    q.add_argument('--polish', action='store_true')
    q.add_argument('--stops')
    q.add_argument('--no-stress', action='store_true')
    q.add_argument('--row-only', action='store_true')
    q.add_argument('--build-only', action='store_true')
    q.add_argument('--checks', action='store_true')
    q.add_argument('--base')
    q.add_argument('--controls-from', type=int)
    q.add_argument('--workers', type=int, default=8)
    q.add_argument('--job-minutes', type=float, default=15)
    q.add_argument('--sample-seconds', type=float, default=4.3)
    q.add_argument('--measure-minutes', type=float, default=20)
    q.add_argument('--no-mirror', action='store_true')
    q.add_argument('--allow-red', action='store_true')
    q.add_argument('--defer', action='store_true')
    q.add_argument('--with', dest='with_rounds')
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
film = a.whole or a.record or a.polish or state(a.round).get('mode') in FILM
if film and a.stop:
    sys.exit('a whole film round and the record round take no --stop')
if a.cmd == 'start' and not film and not a.stop:
    sys.exit('a stop round takes --stop; a whole film round takes --whole, the record round --record, a polish round --polish')
if a.cmd == 'start' and not film and (a.build_only or a.checks):
    sys.exit('--build-only and --checks are for polish rounds and the record round')
if a.cmd == 'touched' and not film:
    sys.exit('touched is a step of a polish round')
STEPS[a.cmd][1 if film else 0](a)
