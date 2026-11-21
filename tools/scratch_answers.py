#!/usr/bin/env python3
import argparse, json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
WORK = ROOT / 'out' / 'work'
CARDS = [
    (9, ['minor']),
    (10, []),
    (9, ['major']),
    (8, ['minor']),
    (9, []),
    (6, ['severe', 'major']),
]
VOTES = [
    'a, 85, the lighting and the depth of the blacks',
    '(b) 70. It looks like a stock picture.',
    'Answer: A. Confidence: 80. The composition.',
    'My vote: d, 60, smeared detail in the middle distance',
    '**a** 90, the grade',
    'I would say (e), 55, flat shading like a web demo',
    'Probably a stock image. 70. The flat light.',
    'a) 88 the glow at the limb',
]
NAMES = ['%s', 'The planet %s.', '%s, seen from orbit', 'Pluto', '%s', 'it shows %s']

p = argparse.ArgumentParser()
p.add_argument('--round', type=int, required=True)
p.add_argument('--case', choices=['mixed', 'pass'], default='mixed')
a = p.parse_args()
if a.round <= 900:
    sys.exit('made up answers are for scratch rounds only')
rid = 'round-%03d' % a.round
home = WORK / 'rounds' / rid
key = json.loads((WORK / 'packs' / 'keys' / (rid + '.json')).read_text())['files']
out = home / 'answers'
out.mkdir(exist_ok=True)
k = v = r = 0
for j in json.loads((home / 'critics.json').read_text()):
    if j['file']:
        score, sev = CARDS[k % len(CARDS)] if a.case == 'mixed' else (9 + k % 2, ['minor'][:k % 2])
        card = {'critic': j['role'].split('-')[0], 'score': score, 'pass': score >= 9 and not set(sev) & {'severe', 'major'}, 'issues': [
            {'severity': s, 'file': j['files'][0].split('/')[-1], 'where': 'upper left', 'what': 'made up %s issue %d of %s' % (s, i + 1, j['name']), 'fix': 'made up fix'} for i, s in enumerate(sev)]}
        text = json.dumps(card, indent=1)
        if a.case == 'mixed' and k % len(CARDS) == 4:
            text = 'Here is my answer.\n\n```json\n' + text + '\n```\n'
        (out / (j['name'] + '.json')).write_text(text + '\n')
        k += 1
    elif j['role'].startswith('R2'):
        print(j['name'] + '|' + (VOTES[v % len(VOTES)] if a.case == 'mixed' else 'a, 80, the light'))
        v += 1
    else:
        e = key[j['files'][0]]
        stop = e.get('stop') or e['segment'].split('.')[0]
        form = NAMES[r % len(NAMES)] if a.case == 'mixed' else '%s'
        print(j['name'] + '|' + (form % stop.capitalize() if '%s' in form else form))
        r += 1
