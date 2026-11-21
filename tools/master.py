#!/usr/bin/env python3
import argparse, datetime, json, math, pathlib, re, shutil, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORK = ROOT / 'out' / 'work'
HOME = WORK / 'master'
ATT = pathlib.Path.home() / '.perplexity' / 'attachments'
ASSETS = 'full'
FACTOR = {'master': 1.0, 'preview': 0.45, 'uhd': 3.5}
SPAN = re.compile(r'^([a-z]+\.[a-z]+)\.span(\d+)-(\d+)\.mp4$')
PART = re.compile(r'^([a-z]+\.[a-z]+)\.(?:span\d+-\d+|part\d+)\.mp4$')


def sh(cmd, check=True):
    r = subprocess.run(cmd, shell=True, cwd=ROOT, capture_output=True, text=True)
    if check and r.returncode != 0:
        sys.exit('failed: %s\n%s' % (cmd, (r.stdout + r.stderr)[-3000:]))
    return r.stdout


def cfg():
    return json.loads((ROOT / 'config' / 'showcase.json').read_text())


def now(a=None):
    t = getattr(a, 'now', None) or getattr(a, 'at', None)
    if t:
        return datetime.datetime.strptime(t, '%Y-%m-%d %H:%M').replace(tzinfo=datetime.timezone.utc)
    return datetime.datetime.now(datetime.timezone.utc)


def iso(t):
    return t.strftime('%Y-%m-%dT%H:%M:%SZ')


def when(s):
    return datetime.datetime.strptime(s, '%Y-%m-%dT%H:%M:%SZ').replace(tzinfo=datetime.timezone.utc)


def clock(t):
    return t.strftime('%H:%M UTC')


def segments(c):
    fps = c['film']['fps']
    out = []
    for s in c['segments']:
        first, end = round(s['start'] * fps), round(s['end'] * fps)
        out.append({'id': s['id'], 'stop': s['stop'], 'kind': s['kind'], 'first': first, 'end': end, 'frames': end - first})
    return out


def stops_of(c, seg):
    ids = [s['id'] for s in c['stops']]
    if seg['stop'] not in ids:
        return [ids[-1]]
    if seg['kind'] == 'travel':
        i = ids.index(seg['stop'])
        return ids[i:i + 2]
    return [seg['stop']]


def clip_ids(c, stop):
    return [s['id'] for s in segments(c) if s['stop'] == stop and s['kind'] != 'travel']


def hashes():
    t = sh('npx tsx -e "import(\'./tools/lib/hashes.ts\').then(m=>console.log(JSON.stringify(m.computeHashes(process.cwd()))))"')
    return json.loads(t.strip().split('\n')[-1])


def rate(c, key):
    if key == 'preview':
        b = c['previewFilm']['bitrateMbps']
        return b, b * 1.5
    b = c['export']['bitrateMbps']
    return b, min(c['platform']['maxBitrateMbps'], b * 1.5)


def chunk_dir(p):
    return WORK / 'chunks' / ('%s-%s-%s' % (p['format'], p['tier'], ASSETS))


def rel(f):
    try:
        return str(pathlib.Path(f).relative_to(ROOT))
    except ValueError:
        return str(f)


def load(name):
    if not name:
        cur = HOME / 'current'
        if not cur.exists():
            sys.exit('no plan yet: run plan first')
        name = cur.read_text().strip()
    d = HOME / name
    if not (d / 'plan.json').exists():
        sys.exit('no plan named ' + name)
    return json.loads((d / 'plan.json').read_text())


def state(p, patch=None):
    f = HOME / p['name'] / 'state.json'
    s = json.loads(f.read_text()) if f.exists() else {'sent': {}, 'arrived': {}}
    if patch is not None:
        s.update(patch)
        f.write_text(json.dumps(s, indent=1))
    return s


def record(f):
    try:
        r = json.loads(pathlib.Path(str(f) + '.json').read_text())
        return r if isinstance(r, dict) else None
    except Exception:
        return None


def judge(c, p, rec, seg, first, last):
    if rec.get('engineHash') != p['engineHash']:
        return 'build', 'engine %s, the plan has %s' % (rec.get('engineHash'), p['engineHash'])
    for s in stops_of(c, seg):
        got = (rec.get('stopHashes') or {}).get(s)
        if got != p['stopHashes'][s]:
            return 'build', 'stop %s %s, the plan has %s' % (s, got, p['stopHashes'][s])
    for k, want in (('tier', p['tier']), ('format', p['format']), ('assets', ASSETS), ('diag', 'beauty')):
        if rec.get(k) != want:
            return 'kind', '%s %s, the plan has %s' % (k, rec.get(k), want)
    if rec.get('first') != first or rec.get('last') != last:
        return 'range', 'frames %s to %s, the plan has %d to %d' % (rec.get('first'), rec.get('last'), first, last)
    g5 = (rec.get('extra') or {}).get('g5')
    if not isinstance(g5, list) or len(g5) != last - first + 1:
        return 'range', 'G5 results for %s frames, the span has %d' % (len(g5) if isinstance(g5, list) else 'no', last - first + 1)
    return None


def probe(f):
    r = subprocess.run(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames,width,height,r_frame_rate,codec_name,pix_fmt:format=duration,size', '-of', 'json', str(f)], capture_output=True, text=True)
    if r.returncode != 0:
        return None
    try:
        j = json.loads(r.stdout)
        s, fm = j['streams'][0], j['format']
        num, den = [int(x) for x in s['r_frame_rate'].split('/')]
        return {'frames': int(s['nb_read_frames']), 'width': s['width'], 'height': s['height'], 'fps': num / den, 'codec': s['codec_name'], 'pix': s['pix_fmt'], 'seconds': float(fm['duration']), 'bytes': int(fm['size'])}
    except Exception:
        return None


def stream_bad(c, p, pr, frames):
    f = c['formats'][p['formatKey']]
    bad = []
    if pr is None:
        return ['ffprobe cannot read it']
    if pr['frames'] != frames:
        bad.append('%d frames, expected %d' % (pr['frames'], frames))
    if (pr['width'], pr['height']) != (f['width'], f['height']):
        bad.append('%dx%d, expected %dx%d' % (pr['width'], pr['height'], f['width'], f['height']))
    if abs(pr['fps'] - c['film']['fps']) > 1e-6:
        bad.append('%.3f fps, expected %d' % (pr['fps'], c['film']['fps']))
    if pr['codec'] != c['export']['videoCodec']:
        bad.append('codec %s, expected %s' % (pr['codec'], c['export']['videoCodec']))
    return bad


def chunk_ready(c, p, seg):
    f = chunk_dir(p) / (seg['id'] + '.mp4')
    rec = record(f) if f.exists() else None
    return bool(rec) and judge(c, p, rec, seg, seg['first'], seg['end'] - 1) is None


def key_of(sp):
    return '%s.span%d-%d' % (sp['segment'], sp['first'], sp['last'])


def scan(c, p, attachments=True):
    segs = {s['id']: s for s in segments(c)}
    d = chunk_dir(p)
    spans = {key_of(sp): sp for sp in p['spans']}
    res = {'where': {}, 'pairs': {}, 'build': [], 'other': [], 'loose': [], 'stray': 0, 'chunks': []}
    for i in p['segments']:
        if chunk_ready(c, p, segs[i]):
            res['chunks'].append(i)
    for k, sp in spans.items():
        if sp['segment'] in res['chunks']:
            res['where'][k] = 'chunk'
            continue
        f = d / (k + '.mp4')
        rec = record(f) if f.exists() else None
        if rec and judge(c, p, rec, segs[sp['segment']], sp['first'], sp['last']) is None:
            res['where'][k] = 'placed'
    if d.exists():
        for f in sorted(d.glob('*.mp4')):
            m = PART.match(f.name)
            stem = f.name[:-4]
            if not m or m.group(1) not in p['segments'] or m.group(1) in res['chunks'] or res['where'].get(stem) == 'placed':
                continue
            rec = record(f)
            why = judge(c, p, rec, segs[m.group(1)], rec['first'], rec['last']) if rec and isinstance(rec.get('first'), int) and isinstance(rec.get('last'), int) else ('kind', 'no record')
            if why and why[0] == 'build':
                res['build'].append((rel(f), why[1]))
            elif not why or why[0] == 'range':
                res['loose'].append(rel(f))
    if attachments and ATT.exists():
        mp4, js = {}, {}
        for f in ATT.rglob('*.mp4'):
            if SPAN.match(f.name):
                mp4.setdefault(f.name[:-4], []).append(f)
        for f in ATT.rglob('*.mp4.json'):
            if SPAN.match(f.name[:-5]):
                js.setdefault(f.name[:-9], []).append(f)
        newest = lambda fs: sorted(fs, key=lambda f: -f.stat().st_mtime)
        for k in sorted(set(mp4) | set(js)):
            if k not in spans:
                res['stray'] += len(mp4.get(k, [])) + len(js.get(k, []))
                continue
            sp = spans[k]
            for j in newest(js.get(k, [])):
                video = pathlib.Path(str(j)[:-5])
                rec = record(video)
                why = judge(c, p, rec, segs[sp['segment']], sp['first'], sp['last']) if rec else ('kind', 'the record cannot be read')
                if why:
                    res['build' if why[0] == 'build' else 'other'].append((str(j), why[1]))
                    continue
                if k in res['where']:
                    continue
                cand = ([video] if video.exists() else []) + [f for f in newest(mp4.get(k, [])) if f != video and not pathlib.Path(str(f) + '.json').exists()]
                if not cand:
                    res['other'].append((str(j), 'the record is here, its mp4 is not'))
                for v in cand:
                    bad = stream_bad(c, p, probe(v), sp['last'] - sp['first'] + 1)
                    if bad:
                        res['other'].append((str(v), '; '.join(bad)))
                        continue
                    res['where'][k] = 'arrived'
                    res['pairs'][k] = (v, j)
                    break
            if k not in js:
                for v in mp4[k]:
                    res['other'].append((str(v), 'no record came with it'))
    res['missing'] = [k for k in spans if k not in res['where']]
    return res


def cost(c, a, key, tier):
    per = a.sample_seconds if a.sample_seconds else 4.3 * FACTOR[key]
    t = c['tiers'][tier]
    fast = c['motion']['fastKinds']
    return per, lambda seg: per * (t['fastSamplesPerFrame'] if seg['kind'] in fast else t['samplesPerFrame'])


def lay_out(c, a, key, tier, segs, skip):
    per, sec = cost(c, a, key, tier)
    cap = (a.job_minutes - a.overhead_minutes) * 60
    if cap <= 0:
        sys.exit('--job-minutes must be more than --overhead-minutes')
    spans = []
    for s in segs:
        if s['id'] in skip:
            continue
        n = math.ceil(s['frames'] / max(1, math.floor(cap / sec(s))))
        for i in range(n):
            first = s['first'] + s['frames'] * i // n
            last = s['first'] + s['frames'] * (i + 1) // n - 1
            spans.append({'segment': s['id'], 'first': first, 'last': last, 'minutes': round((last - first + 1) * sec(s) / 60, 2)})
    groups, cur, total = [], [], 0.0
    for i, sp in enumerate(spans):
        if cur and total + sp['minutes'] > cap / 60:
            groups.append(cur)
            cur, total = [], 0.0
        cur.append(i)
        total += sp['minutes']
    if cur:
        groups.append(cur)
    jobs = [{'spans': g, 'minutes': round(sum(spans[i]['minutes'] for i in g) + a.overhead_minutes, 1)} for g in groups]
    loads = [0.0] * a.workers
    for j in sorted(jobs, key=lambda j: -j['minutes']):
        w = loads.index(min(loads))
        j['worker'] = w + 1
        loads[w] += j['minutes']
    return per, spans, jobs, loads


def plan(a):
    c = cfg()
    key = 'preview' if a.preview else a.format
    ids = {v['id']: k for k, v in c['formats'].items()}
    key = ids.get(key, key)
    if key not in c['formats']:
        sys.exit('unknown format ' + key)
    if a.preview and key != 'preview':
        sys.exit('--preview goes with the preview format')
    fmt = c['formats'][key]
    allsegs = segments(c)
    stop_ids = [s['id'] for s in c['stops']]
    want = []
    stops = [x for x in (a.stops or '').split(',') if x]
    for s in stops:
        if s not in stop_ids:
            sys.exit('unknown stop ' + s)
        want += clip_ids(c, s)
    for i in [x for x in (a.segments or '').split(',') if x]:
        if i not in [s['id'] for s in allsegs]:
            sys.exit('unknown segment ' + i)
        want.append(i)
    whole = not want
    segs = [s for s in allsegs if whole or s['id'] in want]
    if whole and key == 'master':
        stops = stop_ids
    if sh('git status --porcelain -- src public config package.json package-lock.json').strip():
        sys.exit('src, public, config or the package files differ from the commit; a worker would build something else')
    commit = sh('git rev-parse HEAD').strip()
    h = hashes()
    limit_key = 'previewFilmMaxHours' if a.preview else 'sandboxMasterMaxHours'
    limit = c['sandbox'][limit_key]
    order = sorted(c['tiers'], key=lambda t: -c['tiers'][t]['samplesPerFrame'])
    if not a.fit and (not a.tier or a.tier not in c['tiers']):
        sys.exit('--tier must be one of ' + ', '.join(order) + ', or use --fit')
    floor = order[-1] if a.preview else 'review'
    tries = order[:order.index(floor) + 1] if a.fit else [a.tier]
    chosen = None
    for tier in tries:
        base = {'format': fmt['id'], 'formatKey': key, 'tier': tier, 'engineHash': h['engine'], 'stopHashes': h['stops']}
        here = [s['id'] for s in segs if chunk_ready(c, base, s)]
        per, spans, jobs, loads = lay_out(c, a, key, tier, segs, here)
        busiest = max(loads) / 60
        fits = busiest <= limit
        if a.fit:
            print('%s: %.1f hours on the busiest of %d workers, %.1f machine hours: %s' % (tier, busiest, a.workers, sum(loads) / 60, 'fits' if fits else 'does not fit'))
        chosen = (tier, base, here, per, spans, jobs, loads, fits)
        if fits:
            break
    tier, base, here, per, spans, jobs, loads, fits = chosen
    name = a.name or '%s-%s' % (fmt['id'], tier)
    options = {'stops': a.stops or '', 'segments': a.segments or '', 'workers': a.workers, 'jobMinutes': a.job_minutes, 'sampleSeconds': per, 'overheadMinutes': a.overhead_minutes, 'preview': bool(a.preview)}
    d = HOME / name
    d.mkdir(parents=True, exist_ok=True)
    old = json.loads((d / 'plan.json').read_text()) if (d / 'plan.json').exists() else None
    same = old and all(old.get(k) == v for k, v in list(base.items()) + [('commit', commit), ('options', options)])
    if same:
        p = old
        print('the plan is unchanged; nothing was written')
    else:
        if old and (json.loads((d / 'state.json').read_text())['sent'] if (d / 'state.json').exists() else {}) and not a.replace:
            sys.exit('plan %s exists with jobs sent, from commit %s; add --replace to write a new one, or --name for a second plan' % (name, old['commit'][:7]))
        k = 0
        for j in sorted(jobs, key=lambda j: spans[j['spans'][0]]['first']):
            k += 1
            j['name'] = 'film-%s-%03d' % (name, k)
        p = dict(base, name=name, commit=commit, options=options, whole=whole, stops=stops, segments=[s['id'] for s in segs], here=here, spans=spans, jobs=sorted(jobs, key=lambda j: j['name']), limitKey=limit_key, limitHours=limit, hoursWorker=round(max(loads) / 60, 2), hoursTotal=round(sum(loads) / 60, 2), fits=fits, plannedAt=iso(now()))
        (d / 'plan.json').write_text(json.dumps(p, indent=1))
        (d / 'state.json').write_text(json.dumps({'sent': {}, 'arrived': {}}, indent=1))
    (HOME / 'current').write_text(name + '\n')
    show(c, p)
    if not sh('git branch -r --contains ' + p['commit'], check=False).strip():
        print('note: commit %s is on no remote branch yet; a worker cannot fetch it until it is pushed' % p['commit'][:7])


def show(c, p):
    f = c['formats'][p['formatKey']]
    frames = sum(sp['last'] - sp['first'] + 1 for sp in p['spans'])
    print('plan %s: commit %s, engine %s, tier %s, format %s (%d x %d), %.2f s per sample' % (p['name'], p['commit'][:7], p['engineHash'], p['tier'], p['format'], f['width'], f['height'], p['options']['sampleSeconds']))
    print('%d segments asked for, %d with a chunk of this build already here; %d frames to render in %d spans' % (len(p['segments']), len(p['here']), frames, len(p['spans'])))
    for j in p['jobs']:
        sp = [p['spans'][i] for i in j['spans']]
        print('%-28s worker %d  %5.1f min  %s' % (j['name'], j['worker'], j['minutes'], ', '.join('%s %d-%d' % (x['segment'], x['first'], x['last']) for x in sp)))
    n = p['options']['workers']
    loads = [sum(j['minutes'] for j in p['jobs'] if j['worker'] == w) for w in range(1, n + 1)]
    print('%d jobs of at most %g min on %d workers; minutes per worker: %s' % (len(p['jobs']), p['options']['jobMinutes'], n, ' '.join('%.0f' % x for x in loads)))
    print('total %.1f machine hours, %.1f hours on the busiest worker; sandbox.%s is %g hours: the %s tier %s' % (p['hoursTotal'], p['hoursWorker'], p['limitKey'], p['limitHours'], p['tier'], 'fits' if p['fits'] else 'DOES NOT FIT'))


def message(p, name, spans):
    d = 'out/work/chunks/%s-%s-%s/' % (p['format'], p['tier'], ASSETS)
    cmds = ['`npm run film -- --segment %s --span %d-%d --tier %s --format %s`' % (sp['segment'], sp['first'], sp['last'], p['tier'], p['formatKey']) for sp in spans]
    files = []
    for sp in spans:
        files += ['`%s%s.mp4`' % (d, key_of(sp)), '`%s%s.mp4.json`' % (d, key_of(sp))]
    return 'JOB %s. Commit %s. Command%s: %s. When %s finished, send these %d files as attachments, at most 10 per message, and nothing else: %s.' % (name, p['commit'], 's, one after the other' if len(cmds) > 1 else '', '; '.join(cmds), 'they have' if len(cmds) > 1 else 'it has', len(files), ', '.join(files)), [f.strip('`') for f in files]


def jobs(a):
    c = cfg()
    p = load(a.name)
    s = state(p)
    res = scan(c, p)
    t = iso(now(a))
    out = []
    to = [int(x) for x in a.to.split(',')] if a.to else []
    loads = {w: 0.0 for w in to}
    for j in p['jobs']:
        spans = [p['spans'][i] for i in j['spans']]
        open_ = [sp for sp in spans if key_of(sp) not in res['where']]
        sent = s['sent'].get(j['name'])
        if a.missing:
            if not open_:
                continue
            minutes = round(sum(sp['minutes'] for sp in open_) + p['options']['overheadMinutes'], 1)
            worker = (sent or {}).get('worker', j['worker'])
            if to:
                worker = min(loads, key=lambda w: loads[w])
                loads[worker] += minutes
            times = (sent or {}).get('times', 0) + 1
            name = j['name'] + ('-again%d' % (times - 1) if times > 1 else '')
            text, files = message(p, name, open_)
            s['sent'][j['name']] = {'at': t, 'worker': worker, 'times': times, 'minutes': minutes}
            out.append({'name': name, 'worker': worker, 'minutes': minutes, 'spans': [key_of(sp) for sp in open_], 'files': files, 'message': text})
        else:
            text, files = message(p, j['name'], spans)
            if not sent:
                s['sent'][j['name']] = {'at': t, 'worker': j['worker'], 'times': 1, 'minutes': j['minutes']}
            elif a.at:
                sent['at'] = t
            out.append({'name': j['name'], 'worker': s['sent'][j['name']]['worker'], 'minutes': j['minutes'], 'spans': [key_of(sp) for sp in spans], 'files': files, 'done': not open_, 'message': text})
    state(p, s)
    f = HOME / p['name'] / 'jobs.json'
    f.write_text(json.dumps(out, indent=1))
    for j in out:
        print('%-34s worker %d  %5.1f min  %d span%s%s' % (j['name'], j['worker'], j['minutes'], len(j['spans']), '' if len(j['spans']) == 1 else 's', '  (all here)' if j.get('done') else ''))
    print('%d job%s in %s%s' % (len(out), '' if len(out) == 1 else 's', rel(f), ', only what is missing, counted as sent at ' + t if a.missing else ''))


def do_place(c, p, quiet=False):
    res = scan(c, p)
    s = state(p)
    d = chunk_dir(p)
    d.mkdir(parents=True, exist_ok=True)
    new = 0
    for k, (v, j) in sorted(res['pairs'].items()):
        shutil.copyfile(v, d / (k + '.mp4'))
        shutil.copyfile(j, d / (k + '.mp4.json'))
        s['arrived'][k] = iso(datetime.datetime.fromtimestamp(v.stat().st_mtime, datetime.timezone.utc))
        res['where'][k] = 'placed'
        new += 1
    for k, w in res['where'].items():
        if k not in s['arrived'] and w == 'placed':
            s['arrived'][k] = iso(datetime.datetime.fromtimestamp((d / (k + '.mp4')).stat().st_mtime, datetime.timezone.utc))
    state(p, s)
    if not quiet:
        here = len(p['spans']) - len(res['missing'])
        print('placed %d new span%s into %s; %d of %d spans are here (%d of them inside finished chunks)' % (new, '' if new == 1 else 's', rel(d), here, len(p['spans']), sum(1 for w in res['where'].values() if w == 'chunk')))
        owner = {key_of(p['spans'][i]): (j['name'], s['sent'].get(j['name'], {}).get('worker', j['worker'])) for j in p['jobs'] for i in j['spans']}
        groups = {}
        for k in res['missing']:
            groups.setdefault(owner[k], []).append(k)
        print('missing: ' + ('none' if not groups else ''))
        for (name, w), ks in sorted(groups.items()):
            print('  %s (worker %d): %s' % (name, w, ', '.join(ks)))
        print('records from another build: ' + ('none' if not res['build'] else ''))
        for f, why in res['build']:
            print('  %s: %s' % (f, why))
        if res['other']:
            print('other files that were not used:')
            for f, why in res['other']:
                print('  %s: %s' % (f, why))
        if res['loose']:
            print('span or part files of this build in the chunk folder that the plan does not have (the join stops on them): ' + ', '.join(res['loose']))
        if res['stray']:
            print('%d span files among the attachments belong to no span of this plan' % res['stray'])
    return res


def place(a):
    c = cfg()
    do_place(c, load(a.name))


def report(c, p, what, f, frames):
    pr = probe(f)
    bad = stream_bad(c, p, pr, frames)
    rec = record(f) or {}
    want, cap = rate(c, p['formatKey'])
    enc = ((rec.get('extra') or {}).get('encode') or {}).get('rate') or {}
    if enc.get('bitrateMbps') != want:
        bad.append('encoded for %s Mbps, the config has %g' % (enc.get('bitrateMbps'), want))
    if pr is None:
        print('%s %s: %s: FAIL' % (what, rel(f), '; '.join(bad)))
        return False
    mbps = pr['bytes'] * 8 / pr['seconds'] / 1e6 if pr['seconds'] else 0
    if mbps > cap * 1.02:
        bad.append('%.1f Mbps measured, over the cap of %g' % (mbps, cap))
    mb = pr['bytes'] / 1e6
    failed = ((rec.get('extra') or {}).get('g5') or {}).get('failed')
    g5 = 'not in the record' if failed is None else (('%d: %s' % (len(failed), ','.join(str(x) for x in failed[:12]))) if failed else 'none')
    print('%s %s: %d frames (expected %d), %dx%d, %g fps, %s %s, encoded for %s Mbps (%.1f measured), %.1f MB, G5 failed frames %s: %s' % (what, rel(f), pr['frames'], frames, pr['width'], pr['height'], pr['fps'], pr['codec'], pr['pix'], enc.get('bitrateMbps'), mbps, mb, g5, 'FAIL, ' + '; '.join(bad) if bad else 'ok'))
    if mb > c['repo']['maxFileMb']:
        print('  warning: %.1f MB is over repo.maxFileMb (%g); this file cannot be committed' % (mb, c['repo']['maxFileMb']))
    return not bad


def join(a):
    c = cfg()
    p = load(a.name)
    h = hashes()
    if h['engine'] != p['engineHash'] or h['stops'] != p['stopHashes']:
        sys.exit('this tree is another build than the plan (engine %s here, %s in the plan, commit %s); nothing was joined, because the join commands remove chunks of another build' % (h['engine'], p['engineHash'], p['commit'][:7]))
    res = do_place(c, p, quiet=True)
    segs = {s['id']: s for s in segments(c)}
    loose = set(PART.match(pathlib.Path(f).name).group(1) for f in res['loose'])
    state_of = {}
    for i in p['segments']:
        mine = [key_of(sp) for sp in p['spans'] if sp['segment'] == i]
        if i in res['chunks']:
            state_of[i] = 'chunk'
        elif i in loose:
            state_of[i] = 'loose'
        elif mine and all(res['where'].get(k) == 'placed' for k in mine):
            state_of[i] = 'spans'
        else:
            state_of[i] = 'missing'
    ok = True
    for i, st in state_of.items():
        if st == 'missing':
            print('not complete: %s, missing %s' % (i, ', '.join(k for k in res['missing'] if k.startswith(i + '.span')) or 'its chunk'))
        if st == 'loose':
            print('not joined: %s has files the plan does not know: %s' % (i, ', '.join(f for f in res['loose'] if pathlib.Path(f).name.startswith(i + '.'))))
    todo = [i for i in p['segments'] if state_of[i] == 'spans']
    tf = ' --tier %s --format %s' % (p['tier'], p['formatKey'])
    if todo:
        t = sh('npm run -s film -- --segment %s%s' % (','.join(todo), tf))
        if re.search(r'^wrote ', t, re.M):
            print('warning: frames were rendered here:\n' + '\n'.join(l for l in t.split('\n') if l.startswith('wrote ')))
        print('%d chunks put together from their spans, no frame rendered here: %s' % (len(todo), ', '.join(todo)))
    ready = [i for i in p['segments'] if chunk_ready(c, p, segs[i])]
    every = [s['id'] for s in segments(c)]
    if not a.no_film and (p['whole'] or a.film):
        order = [i for i in every if i in p['segments']]
        run = every[every.index(order[0]):every.index(order[-1]) + 1] == order
        if set(order) - set(ready):
            print('film: not joined, %d of %d chunks are not ready' % (len(set(order) - set(ready)), len(order)))
            ok = False
        elif not run:
            print('film: not joined, the plan\'s segments do not follow each other')
            ok = False
        else:
            first, last = segs[order[0]]['first'], segs[order[-1]]['end'] - 1
            if p['whole']:
                sh('npm run -s film -- --join' + tf)
                f = WORK / ('film-%s-%s.mp4' % (p['format'], p['tier']))
            else:
                sh('npm run -s film -- --segment %s --join%s' % (','.join(order), tf))
                f = WORK / ('film-%s-%s-%d-%d.mp4' % (p['format'], p['tier'], first, last))
            ok = report(c, p, 'film', f, last - first + 1) and ok
    stops = [x for x in (a.stops.split(',') if a.stops else p['stops']) if x]
    if a.no_clips:
        stops = []
    for stop in stops:
        ids = clip_ids(c, stop)
        if p['formatKey'] != 'master':
            print('clip %s: not joined, a clip is made in the master format' % stop)
            ok = False
        elif set(ids) - set(ready):
            print('clip %s: not joined, not ready: %s' % (stop, ', '.join(i for i in ids if i not in ready)))
            ok = False
        else:
            sh('npm run -s clip -- --stop %s --tier %s' % (stop, p['tier']))
            ok = report(c, p, 'clip', WORK / 'clips' / (stop + '.mp4'), sum(segs[i]['frames'] for i in ids)) and ok
    print('join: ' + ('every file asked for is made and passes its checks' if ok else 'NOT COMPLETE'))
    sys.exit(0 if ok else 1)


def status(a):
    c = cfg()
    p = load(a.name)
    s = state(p)
    res = scan(c, p)
    t = now(a)
    d = chunk_dir(p)
    arrived = dict(s['arrived'])
    for k, (v, j) in res['pairs'].items():
        arrived[k] = iso(datetime.datetime.fromtimestamp(v.stat().st_mtime, datetime.timezone.utc))
    for k, w in res['where'].items():
        f = d / (k + '.mp4')
        if k not in arrived and f.exists():
            arrived[k] = iso(datetime.datetime.fromtimestamp(f.stat().st_mtime, datetime.timezone.utc))
    workers = {}
    for j in p['jobs']:
        sent = s['sent'].get(j['name'])
        workers.setdefault((sent or {}).get('worker', j['worker']), []).append((j, sent))
    longest = max([j['minutes'] for j in p['jobs']] or [0])
    for w in sorted(workers):
        rows = workers[w]
        keys = lambda j: [key_of(p['spans'][i]) for i in j['spans']]
        spans_all = sum(len(j['spans']) for j, _ in rows)
        spans_done = sum(1 for j, _ in rows for k in keys(j) if k in res['where'])
        done = [j for j, _ in rows if all(k in res['where'] for k in keys(j))]
        if not any(sent for _, sent in rows):
            print('worker %d: %d jobs, %d spans, %d here, not sent yet' % (w, len(rows), spans_all, spans_done))
            continue
        queue = sorted([(when(sent['at']), j, sent) for j, sent in rows if sent], key=lambda x: (x[0], x[1]['name']))
        start = queue[0][0]
        due, expected, overdue, planned = start, 0, [], 0.0
        for at, j, sent in queue:
            due = max(due, at) + datetime.timedelta(minutes=sent.get('minutes', j['minutes']))
            if due <= t:
                expected += 1
            if j in done:
                planned += sent.get('minutes', j['minutes'])
            elif t > start + (due - start) * a.slack:
                overdue.append('%s (due %s)' % (j['name'] + ('-again%d' % (sent['times'] - 1) if sent.get('times', 1) > 1 else ''), clock(due)))
        times = [when(arrived[k]) for j, _ in rows for k in keys(j) if k in arrived]
        last = max(times) if times else None
        line = 'worker %d: %d of %d jobs done, %d of %d spans, %d expected by %s' % (w, len(done), len(rows), spans_done, spans_all, expected, clock(t))
        line += ', overdue: ' + (', '.join(overdue) if overdue else 'none')
        line += ', last file ' + (clock(last) if last else 'none')
        if last and planned and last > start:
            pace = (last - start).total_seconds() / 60 / planned
            line += ', %.1f times the planned minutes' % pace
        if len(done) < len(rows):
            line += ', planned end ' + clock(due)
            quiet = (t - (last or start)).total_seconds() / 60
            if overdue and quiet > longest * a.slack:
                line += ', NOTHING FOR %d MIN' % quiet
        print(line)
    unsent = [j['name'] for j in p['jobs'] if j['name'] not in s['sent']]
    print('%d of %d spans here, %d missing%s' % (len(p['spans']) - len(res['missing']), len(p['spans']), len(res['missing']), ', %d jobs not sent' % len(unsent) if unsent else ''))


def main():
    ap = argparse.ArgumentParser()
    sub = ap.add_subparsers(dest='step', required=True)
    x = sub.add_parser('plan')
    x.add_argument('--tier')
    x.add_argument('--format', default='master')
    x.add_argument('--preview', action='store_true')
    x.add_argument('--stops')
    x.add_argument('--segments')
    x.add_argument('--workers', type=int, required=True)
    x.add_argument('--job-minutes', type=float, default=15)
    x.add_argument('--sample-seconds', type=float)
    x.add_argument('--overhead-minutes', type=float, default=1.5)
    x.add_argument('--fit', action='store_true')
    x.add_argument('--name')
    x.add_argument('--replace', action='store_true')
    x = sub.add_parser('jobs')
    x.add_argument('--name')
    x.add_argument('--missing', action='store_true')
    x.add_argument('--to')
    x.add_argument('--at')
    x = sub.add_parser('place')
    x.add_argument('--name')
    x = sub.add_parser('join')
    x.add_argument('--name')
    x.add_argument('--stops')
    x.add_argument('--film', action='store_true')
    x.add_argument('--no-film', action='store_true')
    x.add_argument('--no-clips', action='store_true')
    x = sub.add_parser('status')
    x.add_argument('--name')
    x.add_argument('--now')
    x.add_argument('--slack', type=float, default=1.5)
    a = ap.parse_args()
    {'plan': plan, 'jobs': jobs, 'place': place, 'join': join, 'status': status}[a.step](a)


main()
