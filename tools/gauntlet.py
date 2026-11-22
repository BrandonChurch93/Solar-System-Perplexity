#!/usr/bin/env python3
import argparse
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
import time
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TSX = ROOT / 'node_modules/.bin/tsx'
RUNS = ('gate', 'clone', 'subfolder')
FAMILIES = ['gpt', 'chatgpt', 'openai', 'claude', 'anthropic', 'sonnet', 'opus', 'haiku', 'gemini', 'grok', 'kimi', 'llama', 'mistral', 'deepseek', 'qwen', 'glm', 'imagen', 'nano banana', 'midjourney', 'dall-e', 'dalle', 'stable diffusion', 'sdxl', 'seedream', 'sora', 'veo', 'kling', 'runway']
VERSION = re.compile(r'(?<![\w.])v?\d+\.\d+\.\d+(?![\w.]*\d)|(?<![\w.])v\d+(?:\.\d+)?\b|\b(?:node|npm|three(?:\.js)?|vite|typescript|chrome|chromium|ffmpeg|playwright)\s+(?:v|r)?\d+', re.I)
DASH, BANG = '\u2014', '\u0021'
LIT = re.compile(r'''\'(?:\\.|[^\'\\\n])*\'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\\n])*`''')
SHOUT = re.compile(BANG + r'(?!=|important)')


def sh(cmd, cwd=ROOT, timeout=None):
    r = subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout, shell=isinstance(cmd, str))
    return r.returncode, (r.stdout + r.stderr).strip()


def git(*a):
    return sh(['git', *a])[1]


def rel(p):
    return str(Path(p).relative_to(ROOT)) if Path(p).is_absolute() else str(p)


def load(p):
    try:
        return json.loads(Path(p).read_text())
    except (OSError, ValueError):
        return None


def facts():
    code = "Promise.all([import('./src/director/timeline.ts'), import('./tools/lib/hashes.ts'), import('./src/config.ts')]).then(([t, h, c]) => { const k = c.config; console.log('FACTS' + JSON.stringify({ fps: k.fps, frameCount: k.frameCount, hookFrame: k.hookFrame, formats: k.formats, formatKeys: k.formatKeys, tiers: Object.keys(k.tiers), stopIds: k.stopIds, segments: k.segments.map((s) => ({ id: s.id, stop: s.stop, kind: s.kind, firstFrame: s.firstFrame, endFrame: s.endFrame })), clips: Object.fromEntries(k.stopIds.map((s) => [s, t.clipRange(s)])), judged: t.judgedFrames(), hashes: h.computeHashes(process.cwd()) })) })"
    rc, out = sh([str(TSX), '-e', code])
    line = next((x for x in out.split('\n') if x.startswith('FACTS')), None)
    if rc != 0 or line is None:
        sys.exit('could not read the config through src/config.ts (run npm ci first):\n' + out[-1500:])
    f = json.loads(line[5:])
    f['raw'] = json.loads((ROOT / 'config/showcase.json').read_text())
    return f


def probe(p):
    if not Path(p).is_file():
        return None
    rc, out = sh(['ffprobe', '-v', 'error', '-select_streams', 'v:0', '-count_frames', '-show_entries', 'stream=nb_read_frames,width,height,r_frame_rate,codec_name,profile,pix_fmt,duration,bit_rate:format=duration,bit_rate,nb_streams', '-of', 'json', str(p)])
    if rc != 0:
        return {'error': out[-200:]}
    d = json.loads(out)
    if not d.get('streams'):
        return {'error': 'no video stream'}
    s, fm = d['streams'][0], d.get('format', {})
    a, b = (s.get('r_frame_rate') or '0/1').split('/')
    return {'frames': int(s.get('nb_read_frames') or 0), 'width': s.get('width'), 'height': s.get('height'), 'fps': float(a) / float(b or 1), 'codec': s.get('codec_name'), 'profile': s.get('profile'), 'pix': s.get('pix_fmt'), 'seconds': float(fm.get('duration') or s.get('duration') or 0), 'mbps': float(fm.get('bit_rate') or 0) / 1e6, 'streams': int(fm.get('nb_streams') or 1), 'mb': Path(p).stat().st_size / 1e6}


def shape(p):
    return '%d frames, %dx%d, %g fps, %s %s, %.2f s, %.1f Mbps, %.1f MB' % (p['frames'], p['width'], p['height'], p['fps'], p['codec'], p['pix'], p['seconds'], p['mbps'], p['mb']) if p and 'error' not in p else ('not readable: ' + p['error'] if p else 'missing')


def raw_frames(p, pre=(), post=(), fmt='yuv420p', size=None):
    r = subprocess.run(['ffmpeg', '-v', 'error', '-nostdin', *pre, '-i', str(p), *post, '-an', '-f', 'rawvideo', '-pix_fmt', fmt, '-'], capture_output=True)
    return r.stdout if r.returncode == 0 else b''


def frame(p, n, fmt='yuv420p'):
    return raw_frames(p, post=['-vf', 'select=eq(n\\,%d)' % n, '-fps_mode', 'passthrough', '-frames:v', '1'], fmt=fmt)


def frame_at(p, n, fps, fmt='yuv420p'):
    return raw_frames(p, pre=['-ss', '%.6f' % max(0.0, (n - 0.4) / fps)], post=['-frames:v', '1'], fmt=fmt)


def last_frame(p, pr, fmt='rgb24'):
    b = raw_frames(p, pre=['-sseof', '-1'], fmt=fmt)
    n = pr['width'] * pr['height'] * (3 if fmt == 'rgb24' else 1)
    return b[-n:] if len(b) >= n else b''


def psnr(a, b):
    if not a or not b or len(a) != len(b):
        return None
    if a == b:
        return float('inf')
    try:
        import numpy as np
    except ImportError:
        return -1.0
    x, y = np.frombuffer(a, dtype=np.uint8).astype(np.float64), np.frombuffer(b, dtype=np.uint8).astype(np.float64)
    return float(10 * np.log10(255.0 ** 2 / np.mean((x - y) ** 2)))


def db(v):
    return 'not comparable' if v is None else 'identical bytes' if v == float('inf') else 'differ' if v < 0 else '%.1f dB' % v


def stats(b):
    if not b:
        return None
    try:
        import numpy as np
        x = np.frombuffer(b, dtype=np.uint8)
        return float(x.mean()), int(x.max())
    except ImportError:
        return sum(b) / len(b), max(b)


def tag(kind, hits):
    return ['%s, %s' % (kind, x) for x in hits]


class Gauntlet:
    def __init__(self, a):
        self.a = a
        self.f = facts()
        self.raw = self.f['raw']
        self.h = self.f['hashes']
        self.stops = self.f['stopIds']
        self.fps = self.f['fps']
        self.limit_mb = self.raw['repo']['maxFileMb']
        self.master = self.f['formats'][self.f['formatKeys']['master']] if self.f['formatKeys']['master'] in self.f['formats'] else self.f['formats']['master']
        self.master_id = self.master.get('id', self.f['formatKeys']['master'])
        self.tracked = set(git('ls-files').split('\n'))
        self.rows = []
        self.gate = None
        self.record_round = self.find_record_round()
        self.clip_frames = {}

    def add(self, no, status, text, more=()):
        self.rows.append((str(no), status, text, list(more)))

    def rec(self, p):
        return load(str(p) + '.json')

    def current(self, r, stops=None):
        if not r or r.get('engineHash') != self.h['engine']:
            return False
        return all(v == self.h['stops'].get(k) for k, v in (r.get('stopHashes') or {}).items() if stops is None or k in stops)

    def build_of(self, p, stops=None):
        r = self.rec(p)
        if r is None:
            return 'no record'
        return ('this build' if self.current(r, stops) else 'ANOTHER BUILD (engine %s)' % r.get('engineHash')) + ', %s tier' % r.get('tier')

    def is_tracked(self, p):
        return rel(p) in self.tracked

    def films(self):
        out = []
        for t in reversed(self.f['tiers']):
            p = ROOT / 'out/work' / ('film-%s-%s.mp4' % (self.master_id, t))
            if p.is_file():
                out.append(p)
        if (ROOT / 'out/preview.mp4').is_file():
            out.append(ROOT / 'out/preview.mp4')
        return out

    def find_record_round(self):
        best = None
        for d in sorted((ROOT / 'scorecards').glob('round-*')):
            s = d / 'SUMMARY.md'
            if s.is_file() and 'record round' in s.read_text().split('\n', 1)[0]:
                best = d
        return best

    def card(self, name):
        return load(self.record_round / (name + '.json')) if self.record_round else None

    def cards_line(self, critic, per_stop=True):
        if not self.record_round:
            return None
        bits = []
        for s in (self.stops if per_stop else []):
            c = self.card('%s-%s' % (critic, s))
            bits.append('%s %s' % (s, 'no card' if c is None else '%s%s' % (c.get('score'), '' if c.get('pass') else ' (not passed)')))
        c = self.card(critic)
        bits.append('whole film %s' % ('no card' if c is None else '%s%s' % (c.get('score'), '' if c.get('pass') else ' (not passed)')))
        return '%s in %s: %s' % (critic, rel(self.record_round), ', '.join(bits))

    def sheets(self):
        got = sorted((ROOT / 'out/stills').glob('sheet-film-*.jpg'))
        return got, ['%s (%s%s)' % (rel(p), self.build_of(p), '' if self.is_tracked(p) else ', NOT COMMITTED') for p in got]

    def gate_results(self):
        if self.gate is not None:
            return self.gate
        if 'gate' in self.a.run:
            rc, out = sh('npm run -s gate -- --phase 6', timeout=7200)
            lines = [x for x in out.split('\n') if x.startswith(('PASS ', 'FAIL '))]
            self.gate = {'when': 'run now', 'stale': False, 'results': {x.split()[1]: (x.startswith('PASS'), x.split(None, 2)[2] if len(x.split(None, 2)) > 2 else '') for x in lines}}
            return self.gate
        p = ROOT / 'out/work/gate/phase-6.json'
        d = load(p)
        if d is None:
            self.gate = {'when': None, 'stale': True, 'results': {}}
            return self.gate
        head_time = int(git('log', '-1', '--format=%ct') or 0)
        dirty = bool(git('status', '--porcelain', '--', 'src', 'public', 'config', 'tools', 'package.json', 'package-lock.json'))
        stale = p.stat().st_mtime < head_time or dirty
        self.gate = {'when': time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime(p.stat().st_mtime)), 'stale': stale, 'results': {x['id']: (x['pass'], x['note']) for x in d}}
        return self.gate

    def gate_item(self, no, ids, what):
        g = self.gate_results()
        if not g['results']:
            return self.add(no, 'NOT RUN', '%s: no result of `npm run gate -- --phase 6` in out/work/gate/. Run it, or run this tool with `--run gate`.' % what)
        missing = [i for i in ids if i not in g['results']]
        bad = [i for i in ids if i in g['results'] and not g['results'][i][0]]
        lines = ['%s %s  %s' % ('PASS' if g['results'][i][0] else 'FAIL', i, g['results'][i][1][:300]) for i in ids if i in g['results']]
        if missing or (g['stale'] and not bad):
            why = 'not in the result: ' + ', '.join(missing) if missing else 'the result is older than the last commit or the tree has changed since'
            return self.add(no, 'NOT RUN', '%s, gate result of %s: %s. Run `npm run gate -- --phase 6` again, or this tool with `--run gate`.' % (what, g['when'], why), lines)
        self.add(no, 'FAIL' if bad else 'PASS', '%s, `npm run gate -- --phase 6` (%s): %s' % (what, g['when'], 'red: ' + ', '.join(bad) if bad else ' '.join(ids) + ' green'), lines)

    def item1(self):
        films = self.films()
        still = sorted((ROOT / 'out/stills').glob('f00000-*.jpg'))
        where = 'the still: %s' % (', '.join('%s (%s)' % (rel(p), self.build_of(p)) for p in still) if still else 'no out/stills/f00000-*.jpg yet; make it with `npm run still -- --frame 0` and `npm run keep`')
        if not films:
            return self.add(1, 'NEEDS A PERSON', 'No film file here to measure. A person looks at %s and says it is a finished picture.' % where)
        p = films[0]
        pr = probe(p)
        n = pr['width'] * pr['height']
        b = raw_frames(p, post=['-frames:v', '31'], fmt='gray')
        means = [stats(b[i * n:(i + 1) * n])[0] for i in range(len(b) // n)]
        if len(means) < 31:
            return self.add(1, 'FAIL', 'Could not decode the first 31 frames of %s.' % rel(p))
        rest = sum(means[1:]) / 30
        ok = means[0] >= 0.9 * rest
        self.add(1, 'PASS' if ok else 'FAIL', 'No fade in, measured on %s (%s): mean luma of frame 0 is %.1f, of frames 1 to 30 it is %.1f (lowest %.1f, highest %.1f) on a scale of 16 to 235; the rule here is frame 0 at 90 percent of that mean or more. That it is a finished picture needs a person: %s.' % (rel(p), self.build_of(p), means[0], rest, min(means[1:]), max(means[1:]), where))

    def item2(self):
        got, lines = self.sheets()
        segs = self.f['segments']
        order = all(a['endFrame'] == b['firstFrame'] for a, b in zip(segs, segs[1:])) and segs[0]['firstFrame'] == 0 and segs[-1]['endFrame'] == self.f['frameCount']
        self.add(2, 'NEEDS A CRITIC', 'Machine part: the %d segments of the config follow each other from frame 0 to %d with no gap (%s). What each one shows is judged from the whole film contact sheets (`npm run sheet -- --film`, kept by `npm run keep`); %d here. A critic or a person reads them against the list in kit/01-FILM.md.' % (len(segs), self.f['frameCount'], 'yes' if order else 'NO', len(got)), lines)

    def item3(self):
        r4, r5 = self.cards_line('R4'), self.cards_line('R5', per_stop=False)
        if not self.record_round:
            return self.add(3, 'NEEDS A CRITIC', 'No record round in scorecards/ yet. Asked for: the R4 result of every stop and the R5 result, from the record round (`python3 tools/round.py start --record`), with what each says about a visible cut.')
        self.add(3, 'NEEDS A CRITIC', 'The scores are below. Whether a critic saw a cut is in the issues of these cards and in the SUMMARY.md of the record round; quote them.', [r4, r5])

    def item4(self):
        got, lines = self.sheets()
        r3 = self.cards_line('R3')
        g = self.gate_results()['results'].get('G6')
        more = lines + ([r3] if r3 else ['no record round in scorecards/ yet, so no R3 result']) + (['G6 (the interface is hidden in capture): %s  %s' % ('PASS' if g[0] else 'FAIL', g[1][:200])] if g else [])
        self.add(4, 'NEEDS A CRITIC', 'Asked for: the whole film contact sheets and the R3 results of the record round, read for people, spacecraft, text, logos and interface. %d sheets here.' % len(got), more)

    def item5(self):
        last = self.f['frameCount'] - 1
        bits, ok, measured = [], True, False
        for p in self.films():
            pr = probe(p)
            st = stats(last_frame(p, pr))
            if st is None:
                bits.append('%s: last frame not decoded' % rel(p))
                ok = False
                continue
            measured = True
            ok = ok and st[1] <= 2
            bits.append('%s (%s): last frame of %d, highest value %d of 255, mean %.3f' % (rel(p), self.build_of(p), pr['frames'], st[1], st[0]))
        for p in sorted((ROOT / 'out/stills').glob('f%05d-*.jpg' % last)):
            try:
                from PIL import Image
                ex = Image.open(p).convert('L').getextrema()
                bits.append('%s (%s): highest value %d of 255' % (rel(p), self.build_of(p), ex[1]))
                measured = True
                ok = ok and ex[1] <= 4
            except ImportError:
                bits.append('%s: Pillow is not installed, not measured' % rel(p))
        if not measured:
            return self.add(5, 'NOT RUN', 'No film file and no still of frame %d here to measure.' % last, bits)
        self.add(5, 'PASS' if ok else 'FAIL', 'Last frame (frame %d) black: the rule here is no value above 2 of 255 in a film file and above 4 in a kept JPEG.' % last, bits)

    def clip_file(self, s):
        for d in ('out/clips', 'out/work/clips'):
            if (ROOT / d / (s + '.mp4')).is_file():
                return ROOT / d / (s + '.mp4')
        return None

    def item6(self):
        lines, ok, film = [], True, None
        for s in self.stops:
            want = self.f['clips'][s]['endFrame'] - self.f['clips'][s]['firstFrame']
            p = ROOT / 'out/clips' / (s + '.mp4')
            pr = probe(p)
            if not pr or 'error' in pr:
                ok = False
                lines.append('%s: out/clips/%s.mp4 %s; the config gives %d frames (%d to %d)' % (s, s, shape(pr), want, self.f['clips'][s]['firstFrame'], self.f['clips'][s]['endFrame'] - 1))
                continue
            self.clip_frames[s] = pr['frames']
            r = self.rec(p) or {}
            rng = 'record says frames %s to %s' % (r.get('first'), r.get('last'))
            good = pr['frames'] == want and r.get('first') == self.f['clips'][s]['firstFrame'] and r.get('last') == self.f['clips'][s]['endFrame'] - 1
            extra = ''
            film = film or next((f for f in self.films() if f.name.startswith('film-') and (self.rec(f) or {}).get('tier') == r.get('tier')), None)
            if film is not None and self.a.deep:
                a0, a1 = psnr(frame(p, 0), frame_at(film, self.f['clips'][s]['firstFrame'], self.fps)), psnr(frame(p, pr['frames'] - 1), frame_at(film, self.f['clips'][s]['endFrame'] - 1, self.fps))
                extra = '; against %s: first frame %s, last frame %s' % (rel(film), db(a0), db(a1))
                good = good and all(v is not None and v >= self.a.cut_db for v in (a0, a1))
            ok = ok and good
            lines.append('%s: %d frames by ffprobe, the config gives %d (%d to %d), %s, %s%s%s' % (s, pr['frames'], want, self.f['clips'][s]['firstFrame'], self.f['clips'][s]['endFrame'] - 1, rng, self.build_of(p, [s]), extra, '' if good else '  <- MISMATCH'))
        self.add(6, 'PASS' if ok else 'FAIL', 'Clip frame counts by `ffprobe -count_frames` against the counts computed from `segments` (every segment of the stop except travel)%s.' % ('; with `--deep` the first and the last frame of each clip against the same frames of the sandbox master, identical bytes or at least %g dB' % self.a.cut_db if self.a.deep else '; `--deep` also compares the first and the last frame of each clip with the sandbox master'), lines)

    def item7(self):
        if not self.record_round:
            return self.add(7, 'FAIL', 'No record round in scorecards/ (no SUMMARY.md whose title says record round). Asked for: its SUMMARY.md and the hashes of the frozen build.')
        text = (self.record_round / 'SUMMARY.md').read_text()
        title = text.split('\n', 1)[0].lstrip('# ')
        m = re.search(r'engine hash ([0-9a-f]{16})', text)
        eng = m.group(1) if m else None
        st = load(ROOT / 'out/work/rounds' / self.record_round.name / 'state.json') or {}
        cards = sorted(p.stem for p in self.record_round.glob('R*.json'))
        want = ['%s-%s' % (r, s) for s in self.stops for r in ('R1', 'R3', 'R4')] + ['R3', 'R4', 'R5', 'R6', 'R7']
        missing = [w for w in want if w not in cards]
        meas = [s for s in self.stops if not (self.record_round / ('measures-%s.json' % s)).is_file()]
        same = eng == self.h['engine']
        stale = [s for s in self.stops if (load(self.record_round / ('measures-%s.json' % s)) or {}).get('stopHashes', {}).get(s) not in (None, self.h['stops'].get(s))]
        ok = same and not missing and not meas and not stale and 'no answer' not in text
        self.add(7, 'PASS' if ok else 'FAIL', '%s: "%s". Its engine hash is %s, the tree here has %s (%s).' % (rel(self.record_round), title, eng, self.h['engine'], 'same' if same else 'DIFFERENT'), [
            'cards: %d of %d (%s)' % (len(want) - len(missing), len(want), 'all there' if not missing else 'missing ' + ', '.join(missing)),
            'measures: %d of %d stops%s%s' % (len(self.stops) - len(meas), len(self.stops), '' if not meas else ', missing ' + ', '.join(meas), '' if not stale else ', of another stop build: ' + ', '.join(stale)),
            'R2 and R8 are in SUMMARY.md and jurors.txt; "no answer" appears %d times in SUMMARY.md' % text.count('no answer'),
            'judged frames in the config: %d%s' % (len(self.f['judged']), ', commit of the round %s' % st['commit'][:7] if st.get('commit') else ''),
        ])

    def item8(self):
        lines, ok = [], True
        for s in self.stops:
            for kind in ('hold', 'terrain'):
                frames = [j['frame'] for j in self.f['judged'] if j['stop'] == s and j['segment'] == '%s.%s' % (s, kind) and j['why'] == kind]
                p = ROOT / 'out/stills' / ('compare-%s-%s.jpg' % (s, kind))
                r = self.rec(p)
                good = p.is_file() and r is not None and self.current(r, [s]) and self.is_tracked(p) and (not frames or r.get('frame') in frames)
                ok = ok and good
                lines.append('%s: %s%s' % (rel(p), 'MISSING' if not p.is_file() else 'frame %s, %s%s' % ((r or {}).get('frame'), self.build_of(p, [s]), '' if self.is_tracked(p) else ', NOT COMMITTED'), '' if good else '  <- not from this build' if p.is_file() else ''))
        stills = [(j, ROOT / 'out/stills' / ('f%05d-%s.jpg' % (j['frame'], j['segment']))) for j in self.f['judged']]
        have = [p for j, p in stills if p.is_file() and self.current(self.rec(p), [j['stop']])]
        lines.append('judged stills in out/stills/ from this build: %d of %d%s' % (len(have), len(stills), '' if len(have) == len(stills) else '; not there or of another build: ' + ', '.join(str(j['frame']) for j, p in stills if p not in have)))
        self.add(8, 'PASS' if ok else 'FAIL', 'Comparison images of the judged hold and terrain frame of every stop, each with a record of this build (engine %s).' % self.h['engine'], lines)

    def section(self, name):
        text = (ROOT / 'kit/PROGRESS.md').read_text()
        m = re.search(r'^## %s\n(.*?)(?=^## |\Z)' % re.escape(name), text, re.S | re.M)
        return m.group(1) if m else ''

    def item9(self):
        items = [x for x in self.section('Open items').split('\n') if re.match(r'^\s*(\d+\.|-)\s', x)]
        no_frame = [x[:60] for x in items if not re.search(r'\b\d{1,4}\b', x[4:])]
        self.add(9, 'NEEDS A PERSON', '"Open items" in kit/PROGRESS.md has %d entries; %d of them name no number that could be a frame. A person checks that every open issue of the record round is there with its stop, its frame, the critic\'s words and what was tried.' % (len(items), len(no_frame)), ['no frame number: ' + x for x in no_frame[:8]])

    def item10(self):
        c = self.card('R7')
        files = sorted((ROOT / 'out/work/stress').glob('*.json'))
        if c is None:
            return self.add(10, 'FAIL' if self.record_round else 'NOT RUN', 'No R7 card%s. Asked for: the R7 result of the record round on the stress encode (`npm run stress`, %s Mbps).' % (' in ' + rel(self.record_round) if self.record_round else ' because no record round is in scorecards/ yet', self.raw['quality']['compressionStressMbps']), ['%d stress records in out/work/stress/' % len(files)])
        self.add(10, 'PASS', 'The stress encode was judged: R7 in %s scored %s%s.' % (rel(self.record_round), c.get('score'), '' if c.get('pass') else ' (not passed, which is an open item and not a failed QA item)'))

    def item12(self):
        if 'clone' not in self.a.run:
            return self.add(12, 'NOT RUN', 'Asked for: the hash of frame 0 from a fresh clone against the same frame from the working copy. `--run clone` does it here: clones HEAD into a temporary folder, `npm ci`, renders frame 0 in both at the %s tier and compares the files.' % self.a.clone_tier)
        tmp = Path(tempfile.mkdtemp(prefix='gauntlet-clone-'))
        try:
            steps = [(['git', 'clone', '-q', '--depth', '1', 'file://' + str(ROOT), str(tmp / 'c')], ROOT), ('npm ci --silent', tmp / 'c'), ('npm run -s still -- --frame 0 --tier %s --out %s' % (self.a.clone_tier, tmp / 'clone.png'), tmp / 'c'), ('npm run -s still -- --frame 0 --tier %s --out %s' % (self.a.clone_tier, tmp / 'here.png'), ROOT)]
            for cmd, cwd in steps:
                rc, out = sh(cmd, cwd=cwd, timeout=7200)
                if rc != 0:
                    return self.add(12, 'FAIL', 'Clean clone: `%s` failed: %s' % (cmd if isinstance(cmd, str) else ' '.join(cmd[:3]), out[-300:]))
            x, y = [hashlib.sha256((tmp / n).read_bytes()).hexdigest() for n in ('clone.png', 'here.png')]
            dirty = git('status', '--porcelain')
            self.add(12, 'PASS' if x == y else 'FAIL', 'Frame 0 at the %s tier, sha256 of the PNG: fresh clone of %s %s, working copy %s: %s.%s' % (self.a.clone_tier, git('rev-parse', '--short', 'HEAD'), x[:16], y[:16], 'identical' if x == y else 'DIFFERENT', ' The working copy has uncommitted changes, which the clone does not have.' if dirty else ''))
        finally:
            shutil.rmtree(tmp, ignore_errors=True)

    def src_files(self):
        return [ROOT / p for p in sorted(self.tracked) if p.startswith('src/') and p.endswith(('.ts', '.tsx', '.js', '.glsl', '.vert', '.frag', '.html', '.css')) and not p.endswith('.test.ts')]

    def shown(self, p):
        try:
            lines = p.read_text(errors='replace').split('\n')
        except OSError:
            return
        lits = lambda line: ' '.join(m.group(0)[1:-1] for m in LIT.finditer(line))
        code, fence = p.suffix not in ('.html', '.md'), False
        for i, line in enumerate(lines, 1):
            if p.suffix == '.md':
                if line.lstrip().startswith('```'):
                    fence = not fence
                    continue
                text = '' if fence else re.sub(r'`[^`]*`', '', line).replace(BANG + '[', '[')
            elif p.suffix == '.html':
                code = code or bool(re.search(r'<(script|style)\b', line, re.I))
                text = lits(line) if code else re.sub(r'<%s--.*?-->|<%s[^>]*>|<[^>]*>' % (BANG, BANG), ' ', line)
                code = code and not re.search(r'</(script|style)>', line, re.I)
            else:
                text = lits(line)
            yield i, line, text

    def grep(self, files, rx, text_only=False):
        hits = []
        for p in files:
            for i, line, text in self.shown(p):
                if rx.search(text if text_only else line):
                    hits.append('%s:%d: %s' % (rel(p), i, line.strip()[:150]))
        return hits

    def item13(self):
        files = [p for p in self.src_files() if rel(p) != 'src/config.ts']
        fm = self.f['formats']
        sizes = sorted({str(v[k]) for v in fm.values() for k in ('width', 'height')})
        pats = [('frame count %d' % self.f['frameCount'], r'\b%d\b' % self.f['frameCount']), ('duration %d' % self.raw['film']['durationSeconds'], r'\b%d\b' % self.raw['film']['durationSeconds']), ('frame rate %d' % self.fps, r'(?<![\w.])%d(?![\w.])' % self.fps), ('format sizes ' + ' '.join(sizes), r'\b(%s)\b' % '|'.join(sizes)), ('tier names', r'''['"`](%s)['"`]''' % '|'.join(self.f['tiers'])), ('stop names', r'''['"`](%s)['"`]''' % '|'.join(self.stops)), ('segment names', r'''['"`](%s)['"`]''' % '|'.join(re.escape(s['id']) for s in self.f['segments']))]
        lines = []
        for name, rx in pats:
            hits = self.grep(files, re.compile(rx))
            own = [x for x in hits if re.match(r'src/stops/(%s)/' % '|'.join(self.stops), x) and name == 'stop names']
            hits = [x for x in hits if x not in own]
            lines.append('%s: %d hits%s' % (name, len(hits), ' (and %d of a stop name inside that stop\'s own folder)' % len(own) if own else ''))
            lines += ['  ' + x for x in (hits if self.a.full else hits[:6])] + (['  and %d more; `--full` lists them all' % (len(hits) - 6)] if len(hits) > 6 and not self.a.full else [])
        self.add(13, 'NEEDS A PERSON', 'Search of %d files under src/ (all but src/config.ts and tests) for the values the config sets. Every hit below wants one line that explains it (an angle of %d degrees is not the frame rate).' % (len(files), self.fps), lines)

    def item14(self):
        hits = self.grep(self.src_files(), re.compile(r'Math\.random|Date\.now|performance\.now|new Date\('))
        self.add(14, 'PASS' if not hits else 'NEEDS A PERSON', 'Search of src/ for Math.random, Date.now, performance.now and new Date(: %d hits%s' % (len(hits), '.' if not hits else '. Each wants one line that says why it cannot reach a pixel.'), hits)

    def item15(self):
        p = ROOT / 'out/work/export' / self.raw['export']['files']['preview']
        pr = probe(p)
        if pr is None:
            return self.add(15, 'NOT RUN', 'No export proof at %s on this machine (out/work/ is not committed). Run `npm run proof`, then this again.' % rel(p))
        r = self.rec(p) or {}
        x = r.get('extra') or {}
        ok = 'error' not in pr and pr['frames'] > 0 and self.current(r) and x.get('pass') is True
        self.add(15, 'PASS' if ok else 'FAIL', 'Export proof %s: ffprobe says %s; %s; record: codec %s, h264 %s; `npm run proof` %s.' % (rel(p), shape(pr), self.build_of(p), x.get('codec'), x.get('h264'), 'passed' if x.get('pass') is True else 'DID NOT PASS: ' + ('; '.join(x.get('errors') or []) or 'its record has no result')))

    def item16(self):
        p = ROOT / 'out/work/export/memory.json'
        d = load(p)
        if d is None:
            return self.add(16, 'NOT RUN', 'No log of the memory test at %s on this machine. Run `npm run proof -- --memory`, then this again. That export mode shows progress and time remaining on screen needs a person or a still of the export page.' % rel(p))
        sets = lambda m: '%d sets, %.1f MB of textures at frame %s' % (len(m['loaded']), m['textureBytes'] / 1048576, m['frame']) if m else 'no sample'
        ok = bool(d.get('pass')) and self.current(self.rec(p))
        self.add(16, 'PASS' if ok else 'FAIL', 'Memory test across %s (frames %s to %s), %s: before the travel %s; after it %s; peak %s sets; errors: %s. The log is %s. That export mode shows progress and time remaining needs a person or a still of the export page.' % (d.get('travel'), d.get('first'), d.get('last'), self.build_of(p), sets(d.get('before')), sets(d.get('after')), d.get('peakSets'), '; '.join(d.get('errors') or []) or 'none', rel(p)))

    def item17(self):
        if 'subfolder' not in self.a.run:
            return self.add(17, 'NOT RUN', 'Asked for: a still rendered from dist/ served under a subfolder. `--run subfolder` does it here: serves dist/ at the root and under /deep/sub/folder/, renders frame %d at the draft tier from both and compares the hashes.' % self.f['hookFrame'])
        code = "Promise.all([import('./tools/lib/browser.ts'), import('./tools/lib/common.ts'), import('node:crypto')]).then(async ([b, c, k]) => { const cfg = c.loadConfig(); c.ensureBuild(); const out = []; for (const prefix of ['', '/deep/sub/folder']) { const s = await b.openCapture({ dist: c.DIST, format: c.formatId(cfg, 'preview'), assets: 'full', prefix }); const r = await b.renderPng(s.page, cfg.hookFrame, 'draft'); out.push({ url: s.url, bytes: r.png.length, sha: k.createHash('sha256').update(r.png).digest('hex') }); await s.close() } console.log('SUB' + JSON.stringify({ frame: cfg.hookFrame, out })) })"
        rc, out = sh([str(TSX), '-e', code], timeout=3600)
        line = next((x for x in out.split('\n') if x.startswith('SUB')), None)
        if rc != 0 or line is None:
            return self.add(17, 'FAIL', 'The still from a subfolder path could not be rendered: %s' % out[-400:])
        d = json.loads(line[3:])
        a, b = d['out']
        self.add(17, 'PASS' if a['sha'] == b['sha'] and b['bytes'] > 10000 else 'FAIL', 'Frame %d at the draft tier from dist/ served at %s and at %s: sha256 %s and %s, %d bytes: %s.' % (d['frame'], re.sub(r':\d+', ':PORT', a['url']), re.sub(r':\d+', ':PORT', b['url']), a['sha'][:16], b['sha'][:16], b['bytes'], 'identical' if a['sha'] == b['sha'] else 'DIFFERENT'))

    def app_url(self):
        for text in (self.section('Status'), (ROOT / 'README.md').read_text() if (ROOT / 'README.md').is_file() else ''):
            m = re.search(r'App URL:\s*(https?://[^\s)]+)', text)
            if m:
                return m.group(1).rstrip('.,')
        return None

    def item18(self):
        url = self.a.url or self.app_url()
        lines = []
        if url and not self.a.offline:
            for u in (url, url.rstrip('/') + '/review.html'):
                try:
                    with urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent': 'gauntlet'}), timeout=20) as r:
                        lines.append('%s: HTTP %d, %d bytes' % (u, r.status, len(r.read())))
                except Exception as e:
                    lines.append('%s: %s' % (u, str(e)[:120]))
        self.add(18, 'NEEDS A PERSON', 'Asked for: a still captured from the published URL (%s) at three different stops, one of them while `?mode=autopilot` plays and the jumps made in `live`. Only a browser session that is signed in can give it; the lines below are plain requests from this machine.' % (url or 'no App URL found in kit/PROGRESS.md'), lines)

    def copy_files(self):
        md = [p for p in sorted(self.tracked) if p.endswith('.md') and (p in ('README.md', 'ASSETS.md') or p.startswith(('cut/', 'out/')))]
        ui = [p for p in sorted(self.tracked) if (p.startswith('src/') and p.endswith(('.ts', '.tsx', '.html', '.css')) and not p.endswith('.test.ts')) or p == 'index.html' or (p.startswith('public/') and p.endswith(('.html', '.css', '.js', '.json', '.txt', '.webmanifest'))) or p in ('tools/site.ts', 'tools/review.ts', 'tools/status.ts', 'tools/status-widget.html')]
        return [ROOT / p for p in md], [ROOT / p for p in ui]

    def copy_check(self):
        md, ui = self.copy_files()
        dash = self.grep(md + ui, re.compile(DASH))
        bang = self.grep(md + ui, SHOUT, text_only=True)
        names = [p for p in sorted(self.tracked) if (DASH in p or BANG in p) and not p.startswith('references/')]
        return md, ui, dash, bang, names

    def models(self, files):
        words = set(FAMILIES)
        for p in (ROOT / 'scorecards').glob('round-*/agents.json'):
            for j in load(p) or []:
                if isinstance(j, dict) and j.get('model'):
                    words.add(str(j['model']).lower())
                    words.add(str(j['model']).lower().replace('_', ' '))
        rx = re.compile(r'(?<![A-Za-z])(%s)(?![A-Za-z])' % '|'.join(sorted((re.escape(w) for w in words), key=len, reverse=True)), re.I)
        return self.grep(files, rx), self.grep(files, VERSION, text_only=True)

    def item21(self):
        files = ['cut/SHOTS.md', 'cut/CUES.md']
        there = ['%s %s' % (f, 'committed' + (', with uncommitted changes' if git('status', '--porcelain', '--', f) else '') if f in self.tracked else 'NOT COMMITTED' if (ROOT / f).is_file() else 'MISSING') for f in files]
        rc, out = sh('npm run -s cues -- --check', timeout=600)
        lines = [x for x in out.split('\n') if x.startswith(('PASS', 'FAIL', 'NOTE'))]
        ok = rc == 0 and all(f in self.tracked and not git('status', '--porcelain', '--', f) for f in files)
        self.add(21, 'PASS' if ok else 'FAIL', '%s. `npm run cues -- --check` (both files against `segments`, `cover` and the intro records): exit %d.' % ('; '.join(there), rc), [x[:400] for x in lines] or [out[-300:]])

    def item22(self):
        lines, ok = [], True
        for f in ['out/roughcut.mp4', 'out/preview.mp4'] + ['out/clips/%s.mp4' % s for s in self.stops]:
            p = ROOT / f
            good = f in self.tracked and p.is_file()
            ok = ok and good
            big = p.is_file() and p.stat().st_size / 1e6 > self.limit_mb
            ok = ok and not big
            lines.append('%s: %s%s%s' % (f, 'committed' if good else 'NOT COMMITTED' if p.is_file() else 'MISSING', ', %.1f MB, %s' % (p.stat().st_size / 1e6, self.build_of(p)) if p.is_file() else '', '  <- over repo.maxFileMb (%s MB)' % self.limit_mb if big else ''))
        stills = [p for p in self.tracked if p.startswith('out/stills/') and not p.endswith('.json')]
        ok = ok and len(stills) > 0
        tiers = sorted({(self.rec(ROOT / 'out/clips' / (s + '.mp4')) or {}).get('tier') or 'none' for s in self.stops})
        master = [f for f in self.films() if f.name.startswith('film-')]
        lines.append('out/stills/: %d committed pictures (%d compare, %d judged stills, %d sheets)' % (len(stills), sum('/compare-' in p for p in stills), sum(bool(re.search(r'/f\d{5}-', p)) for p in stills), sum('/sheet-' in p for p in stills)))
        lines.append('tier of the clips by their records: %s. Sandbox master on this disk: %s' % (', '.join(tiers), ', '.join('%s (%s)' % (rel(f), self.build_of(f)) for f in master) or 'none; if it could not be rendered the log must say so and the clips must be review tier renders'))
        over = sorted(((ROOT / p).stat().st_size / 1e6, p) for p in self.tracked if p and (ROOT / p).is_file() and (ROOT / p).stat().st_size / 1e6 > self.limit_mb)
        top = sorted(((ROOT / p).stat().st_size / 1e6, p) for p in self.tracked if p and (ROOT / p).is_file())[-3:]
        lines.append('tracked files over repo.maxFileMb (%s MB): %s; the largest are %s' % (self.limit_mb, ', '.join('%s %.1f MB' % (p, m) for m, p in over) or 'none', ', '.join('%s %.1f MB' % (p, m) for m, p in reversed(top))))
        self.add(22, 'PASS' if ok and not over else 'FAIL', 'File list of the deliverables in the repo.', lines)

    def item23(self):
        listed = sorted({int(m) for m in re.findall(r'^- Round (\d+)', self.section('Rounds'), re.M)})
        folders = {int(d.name.split('-')[1]): d for d in (ROOT / 'scorecards').glob('round-*') if d.name.split('-')[1].isdigit()}
        missing = [n for n in listed if n not in folders]
        thin = [n for n in listed if n in folders and not (folders[n] / 'SUMMARY.md').is_file()]
        loose = [n for n, d in folders.items() if not any(p.startswith('scorecards/%s/' % d.name) for p in self.tracked)]
        extra = sorted(set(folders) - set(listed))
        ok = bool(listed) and not missing and not loose
        self.add(23, 'PASS' if ok else 'FAIL', '"Rounds" in kit/PROGRESS.md lists %d rounds (%s); scorecards/ has %d folders. Without a folder: %s. Folder not committed: %s. Folder with no SUMMARY.md: %s. Folders of rounds not listed: %s.' % (len(listed), ', '.join(map(str, listed)) or 'none', len(folders), ', '.join(map(str, missing)) or 'none', ', '.join(map(str, loose)) or 'none', ', '.join(map(str, thin)) or 'none', ', '.join(map(str, extra)) or 'none'))

    def item24(self):
        p = ROOT / 'README.md'
        if not p.is_file():
            return self.add(24, 'FAIL', 'README.md is missing.')
        text = p.read_text()
        find = lambda rx: next(('line %d' % i for i, l in enumerate(text.split('\n'), 1) if re.search(rx, l, re.I)), 'NOT FOUND')
        parts = [('the app URL', r'https?://\S+'), ('how to fly it', r'\bfly\b|\bflying\b'), ('how to export', r'\bexport'), ('the credits the post must carry', r'credits? the post must carry|credit line'), ('where the posts are', r'out/posts')]
        found = [(n, find(rx)) for n, rx in parts]
        names, versions = self.models([p])
        d, b = self.grep([p], re.compile(DASH)), self.grep([p], SHOUT, text_only=True)
        ok = all(w != 'NOT FOUND' for n, w in found) and not names and not versions and not d and not b
        self.add(24, 'PASS' if ok else 'FAIL', 'README.md: %s. Em dashes %d, exclamation points %d, model names %d, version strings %d. That each part says enough needs a person to read the file.' % ('; '.join('%s %s' % x for x in found), len(d), len(b), len(names), len(versions)), tag('em dash', d) + tag('exclamation point', b) + tag('model name', names) + tag('version string', versions))

    def copy_item(self):
        md, ui, dash, bang, names = self.copy_check()
        mnames, versions = self.models(ui)
        ok = not dash and not bang and not names
        self.add('24a', 'PASS' if ok else 'FAIL', 'No em dash and no exclamation point in copy and file names: %d Markdown files of copy (README.md, ASSETS.md, cut/, out/) and %d interface files (index.html, src/, public/, the review and status page tools) searched, code by its quoted strings and pages by their text; em dashes %d, exclamation points %d, file names with either %d (of %d tracked names, references/ left out).' % (len(md), len(ui), len(dash), len(bang), len(names), len(self.tracked)), tag('em dash', dash) + tag('exclamation point', bang) + tag('file name', names))
        hits = tag('model name', mnames) + tag('version string', versions)
        self.add('24b', 'PASS' if not hits else 'NEEDS A PERSON', 'No model name and no version string in the interface: %d interface files searched for %d names (families, and the names in scorecards/*/agents.json) on every line, and the quoted strings and page text for version patterns; %d name hits, %d version hits%s' % (len(ui), len(FAMILIES), len(mnames), len(versions), '.' if not hits else '. A hit in code that never reaches the screen wants one line that says so.'), hits if self.a.full else hits[:12] + (['and %d more; `--full` lists them all' % (len(hits) - 12)] if len(hits) > 12 else []))

    def item25(self):
        status = git('status', '--porcelain')
        branch = self.raw['repo']['branch']
        head = git('rev-parse', 'HEAD')
        local = git('log', 'origin/' + branch, '-1', '--format=%h %s')
        remote = '' if self.a.offline else git('ls-remote', 'origin', 'refs/heads/' + branch).split('\t')[0]
        ok = not status and (remote == head if remote else False)
        self.add(25, 'PASS' if ok else 'FAIL' if remote or status else 'NOT RUN', '`git status --porcelain`: %s. HEAD is %s on %s. `git log origin/%s -1`: %s. `git ls-remote origin %s`: %s.' % ('clean' if not status else '%d paths changed or untracked' % len(status.split('\n')), head[:7], git('rev-parse', '--abbrev-ref', 'HEAD'), branch, local, branch, (remote[:7] + (', the same commit as HEAD' if remote == head else ', NOT the commit of HEAD')) if remote else 'not asked (offline) or no answer'), status.split('\n')[:10] if status else [])

    def posts(self):
        find = lambda name: next((ROOT / d / name for d in ('out/posts', 'out/work/posts') if (ROOT / d / name).is_file()), ROOT / 'out/posts' / name)
        kept = lambda p: rel(p).startswith('out/posts/')
        files = [find(n) for s in self.stops for n in ('intro-%s.mp4' % s, s + '.mp4')]
        work = [p for p in files if p.is_file() and not kept(p)]
        note = '' if not work else ' (%d of %d files are read from out/work/posts/ because they are not in out/posts/; run `npm run keep -- --posts` in Phase 6)' % (len(work), len(files))
        cfgp = self.raw['posts']
        if (ROOT / 'out/posts/README.md').is_file():
            self.add('P0', 'NEEDS A PERSON', 'out/posts/README.md exists: it says what is missing. If the skill was not there, P1 to P4 go under "Failed QA items" with the reason.')
        recipe = ROOT / 'assets-src/posts/RECIPE.md'
        l1, l2, l3, ok1, ok2, ok3 = [], [], [], True, True, True
        for s in self.stops:
            intro, post, clip = find('intro-%s.mp4' % s), find(s + '.mp4'), self.clip_file(s)
            ip, pp, cp = probe(intro), probe(post), probe(clip) if clip else None
            r = self.rec(intro)
            ex = (r or {}).get('extra') or {}
            good = bool(ip) and 'error' not in ip and r is not None and ip['frames'] / self.fps <= cfgp['introMaxSeconds'] + 1e-9 and ex.get('prompt') == cfgp['prompts'][s] and (not kept(intro) or self.is_tracked(intro))
            ok1 = ok1 and good
            l1.append('%s: %s%s' % (rel(intro), 'MISSING' if not ip else '%d frames, %.3f s of at most %s s, record %s, prompt in the record %s, hold before the submit %s s of at least %s' % (ip.get('frames', 0), ip.get('frames', 0) / self.fps, cfgp['introMaxSeconds'], 'there' if r else 'MISSING', 'equals the config' if ex.get('prompt') == cfgp['prompts'][s] else 'DIFFERS from the config', ex.get('holdBeforeSubmitSeconds'), cfgp['readHoldSeconds']) + ('' if not kept(intro) else ', committed' if self.is_tracked(intro) else ', NOT COMMITTED'), '' if good else '  <- FAIL'))
            fine = lambda p: bool(p) and 'error' not in p
            good2 = fine(ip) and fine(pp) and fine(cp) and pp['frames'] == ip['frames'] + cp['frames'] and (pp['width'], pp['height']) == (self.master['width'], self.master['height']) and abs(pp['fps'] - self.fps) < 1e-6
            n = lambda p: '%d frames' % p['frames'] if fine(p) else 'MISSING'
            made = ((self.rec(post) or {}).get('extra') or {}).get('clip') or {}
            same = '' if not made.get('sha256') or not clip else ', the record of the post names this clip file by sha256' if made['sha256'] == hashlib.sha256(clip.read_bytes()).hexdigest() else ', the record of the post names ANOTHER clip file'
            good2 = good2 and 'ANOTHER' not in same
            ok2 = ok2 and good2
            l2.append('%s: post %s (%s), intro %s, clip %s (%s)%s%s%s%s' % (s, n(pp), rel(post), n(ip), n(cp), rel(clip) if clip else 'no clip here', ', sum %d' % (ip['frames'] + cp['frames']) if fine(ip) and fine(cp) else '', '; post %dx%d at %g fps, %s, %.1f MB, %s' % (pp['width'], pp['height'], pp['fps'], pp['codec'], pp['mb'], self.build_of(post, [s])) if fine(pp) else '', same, '' if good2 else '  <- FAIL'))
            if fine(ip) and fine(pp) and fine(cp):
                cut, c0, c1, il = frame(post, ip['frames']), frame(clip, 0), frame(clip, 1), frame(intro, ip['frames'] - 1)
                a, b, c = psnr(cut, c0), psnr(cut, c1), psnr(cut, il)
                good3 = a is not None and (a == float('inf') or (a > 0 and (b is None or a > b) and (c is None or a > c) and a >= self.a.cut_db))
                l3.append('%s: frame %d of the post against frame 0 of %s: %s (sha256 %s and %s); against frame 1 of the clip %s; against the last frame of the intro %s%s' % (s, ip['frames'], rel(clip), db(a), hashlib.sha256(cut).hexdigest()[:12], hashlib.sha256(c0).hexdigest()[:12], db(b), db(c), '' if good3 else '  <- FAIL'))
            else:
                good3 = False
                l3.append('%s: not compared, a file is missing' % s)
            ok3 = ok3 and good3
        l1.append('recipe: %s' % ('%s is committed (the skill, its inputs and the prompt strings for all nine)' % rel(recipe) if self.is_tracked(recipe) else 'NO recipe at assets-src/posts/RECIPE.md'))
        ok1 = ok1 and self.is_tracked(recipe)
        self.add('P1', 'PASS' if ok1 else 'FAIL', 'Nine intros with record and recipe, each at most posts.introMaxSeconds (%s s)%s.' % (cfgp['introMaxSeconds'], note), l1)
        self.add('P2', 'PASS' if ok2 else 'FAIL', 'Nine posts in formats.master (%dx%d) at film.fps (%d), each with as many frames as its intro and its clip together%s.' % (self.master['width'], self.master['height'], self.fps, note), l2)
        self.add('P3', 'PASS' if ok3 else 'FAIL', 'The first frame after the intro in each post against the first frame of the stop\'s clip, decoded planes compared byte for byte; where a post was encoded once the rule here is at least %g dB and closer to frame 0 of the clip than to frame 1 or to the intro.' % self.a.cut_db, l3)
        check = ROOT / 'assets-src/posts/CHECK.md'
        res = ''
        if check.is_file():
            m = re.search(r'^## Result\n+(.*?)(?=^## |\Z)', check.read_text(), re.S | re.M)
            rows = [[c.strip() for c in x.strip().strip('|').split('|')] for x in (m.group(1) if m else '').split('\n') if x.startswith('|') and not re.match(r'^\|[\s|:-]+$', x)][1:]
            said = [x for x in rows if x and x[0] in self.stops]
            res = ('a table with %d of %d stops, %d of them with the result "pass"%s' % (len(said), len(self.stops), sum(1 for x in said if x[-1].lower() == 'pass'), ''.join('; %s: %s' % (x[0], x[-1]) for x in said if x[-1].lower() != 'pass')) if said else ' '.join(m.group(1).split())[:300] if m else '')
        self.add('P4', 'NEEDS A PERSON', 'Asked for: the fresh agent\'s answers to the one text check, word for word, or what is wrong under "Open items". %s' % ('They are kept in %s%s. Its "Result" section says: %s' % (rel(check), '' if self.is_tracked(check) else ' (NOT COMMITTED)', res or 'nothing') if check.is_file() else 'No assets-src/posts/CHECK.md here.'))
        clips = [self.clip_file(s) for s in self.stops]
        self.add('P5', 'NEEDS A CRITIC', 'Asked for: the check of item 4 run on the clips as well, so contact sheets cut from each file in out/clips/ (%d of %d clips here) and from the film, read for text and interface. The frames of a clip are the film\'s frames (item 6), so the R3 result of the record round speaks for both only if the sheets given to R3 came from this build.' % (sum(1 for c in clips if c and 'out/clips' in rel(c)), len(self.stops)))

    def run(self):
        order = [('1', self.item1), ('2', self.item2), ('3', self.item3), ('4', self.item4), ('5', self.item5), ('6', self.item6), ('7', self.item7), ('8', self.item8), ('9', self.item9), ('10', self.item10),
                 ('11', lambda: self.gate_item(11, ['G1', 'G2', 'G3', 'G4', 'G6', 'G7', 'G10', 'G11', 'G12', 'G14', 'G15', 'G8', 'G9', 'G16'], 'Machine checks and G8, G9, G16')),
                 ('12', self.item12), ('13', self.item13), ('14', self.item14), ('15', self.item15), ('16', self.item16), ('17', self.item17), ('18', self.item18),
                 ('19', lambda: self.gate_item(19, ['G11'], 'ASSETS.md and recipes')), ('20', self.item20), ('21', self.item21), ('22', self.item22), ('23', self.item23), ('24', self.item24), ('24a', self.copy_item), ('25', self.item25), ('P', self.posts)]
        want = set(self.a.items.split(',')) if self.a.items else None
        for key, fn in order:
            if want is None or key in want or (key == '24a' and '24' in want):
                try:
                    fn()
                except Exception as e:
                    self.add(key, 'FAIL', 'The check itself broke: %s: %s' % (type(e).__name__, str(e)[:300]))

    def item20(self):
        changed = git('status', '--porcelain', '--', 'references/approved')
        n = len([p for p in self.tracked if p.startswith('references/approved/')])
        g = self.gate_results()
        if 'G12' not in g['results'] or g['stale']:
            return self.add(20, 'NOT RUN' if not changed else 'FAIL', 'references/approved/: %d tracked files, `git status` shows %s. The G12 result is %s; run `npm run gate -- --phase 6` or this tool with `--run gate`.' % (n, 'no change' if not changed else 'CHANGES: ' + changed[:200], 'not there' if 'G12' not in g['results'] else 'older than the last commit'))
        ok = g['results']['G12'][0] and not changed
        self.add(20, 'PASS' if ok else 'FAIL', 'references/approved/: %d tracked files, `git status` shows %s. G12 (%s): %s  %s' % (n, 'no change' if not changed else 'CHANGES: ' + changed[:200], g['when'], 'PASS' if g['results']['G12'][0] else 'FAIL', g['results']['G12'][1][:300]))

    def report(self):
        a = self.a
        head = git('rev-parse', '--short', 'HEAD')
        dirty = git('status', '--porcelain')
        out = ['Gauntlet evidence%s, collected %s by `npm run gauntlet%s` on %s at %s (%s), engine hash %s. %s' % (' (pass %s of %s)' % (a.passno, self.raw['quality']['gauntletMaxPasses']) if a.passno else '', time.strftime('%Y-%m-%d %H:%M UTC', time.gmtime()), ' -- ' + ' '.join(sys.argv[1:]) if sys.argv[1:] else '', git('rev-parse', '--abbrev-ref', 'HEAD'), head, 'tree clean' if not dirty else '%d paths changed or untracked' % len(dirty.split('\n')), self.h['engine'], 'The tool writes no file in the repo.' if not a.run else 'The tool writes no file itself; the commands of `--run` write only under out/work/ and dist/, which git ignores, and in a temporary folder.'),
               '', 'PASS and FAIL are checks a machine ran. NOT RUN is a machine check that was not run here, with the command that runs it. NEEDS A PERSON and NEEDS A CRITIC name the evidence that only they can give and where it comes from. Items 1 to 25 are kit/09-QA-GAUNTLET.md, 24a and 24b are the copy rules of AGENTS.md, P1 to P5 are the items of addendum 003.', '']
        for no, status, text, more in self.rows:
            out.append('- %s. %s. %s' % (no, status, text))
            out += [('    - ' + m.strip()) if m.startswith('  ') else '  - ' + m for m in more if m]
        by = lambda st: [no for no, status, _, _ in self.rows if status == st]
        out += ['', 'Count: %d PASS, %d FAIL%s, %d NOT RUN%s, %d need a person%s, %d need a critic%s.' % tuple(x for st in ('PASS', 'FAIL', 'NOT RUN', 'NEEDS A PERSON', 'NEEDS A CRITIC') for x in ([len(by(st))] if st == 'PASS' else [len(by(st)), ' (' + ', '.join(by(st)) + ')' if by(st) else '']))]
        print('\n'.join(out))
        return 1 if by('FAIL') else 0


def main():
    ap = argparse.ArgumentParser(description='Collects the evidence for kit/09-QA-GAUNTLET.md and the five items of addendum 003. It prints a block for "QA results" and changes nothing in the repo.')
    ap.add_argument('--items', help='only these items, for example 6,21,P')
    ap.add_argument('--run', default='', help='slow checks to run now, comma separated: gate (npm run gate -- --phase 6), clone (item 12), subfolder (item 17), or all')
    ap.add_argument('--clone-tier', default='review', help='tier of the frame 0 still of item 12')
    ap.add_argument('--deep', action='store_true', help='item 6: also compare the first and last frame of each clip with the master film when it is on this disk')
    ap.add_argument('--cut-db', type=float, default=40.0, help='lowest PSNR for the cut frame of a post that was encoded once')
    ap.add_argument('--url', help='published app URL when it is not in kit/PROGRESS.md')
    ap.add_argument('--offline', action='store_true', help='no request to the remote or to the published URL')
    ap.add_argument('--full', action='store_true', help='list every search hit')
    ap.add_argument('--pass', dest='passno', help='number of this pass of the gauntlet, for the heading')
    a = ap.parse_args()
    a.run = set(RUNS) if a.run == 'all' else {x for x in a.run.split(',') if x}
    if a.run - set(RUNS):
        ap.error('unknown --run value: ' + ', '.join(sorted(a.run - set(RUNS))))
    for tool in ('ffprobe', 'ffmpeg', 'git'):
        if shutil.which(tool) is None:
            sys.exit(tool + ' is not on the path')
    g = Gauntlet(a)
    g.run()
    sys.exit(g.report())


if __name__ == '__main__':
    main()
