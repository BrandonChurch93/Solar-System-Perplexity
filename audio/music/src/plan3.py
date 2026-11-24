#!/usr/bin/env python3
# Take 3 (the last retry): every chunk after the first free of its neighbours (context adherence low), so each
# arrival can hit and each surface can thin out at its own second; the last chunk runs 3.5 s past the film so the
# model's own ending falls after 180 s and is cut (the film's fade 177.5 to 180 is laid on in the mix).
# orchestral and hybrid: strong quiet words in the surface chunks. ambient: soft words (continuity first), a base
# with moving parts instead of still pads.
import json, sys
src = open('plan2.py').read().split("\nfor track in ('orchestral'")[0]
sys.argv = ['plan2.py', '3']
exec(src)
take = 3
EXTRA_MS = 3500
ADH['low'] = dict(first='high', sunrise='low', sunhold='low', travel='low', arrive='low', surface='low', rise='low', merged='low', bigbuild='low', finale='low')

for t in ('orchestral', 'hybrid'):
    d = T[t]
    glob = d['base'][3] if t == 'orchestral' else None
    if t == 'orchestral':
        d['base'] = ["60 BPM", "D minor", "cinematic symphony orchestra", "instrumental only"]
        d['first'] = ["epic space film score", "great production quality", "wide concert hall sound"]
    d['surface'] = ["quiet and sparse", "pianissimo", None, "intimate", "low energy", "calm and floating"]
    d['surf_neg'] = ["loud", "drums", "percussion", "full orchestra", "brass"]
    d['col'] = [(a, "only " + b) for a, b in d['col']]
T['orchestral']['rise'] = ["crescendo from soft to loud", "rising strings and swelling horns", "timpani roll and cymbal swell", "building tension", "getting louder into the next section"]
T['hybrid']['rise'] = ["crescendo from soft to loud", "rising strings over a brightening arpeggio", "drum roll and riser", "building tension", "getting louder into the next section"]
a = T['ambient']
a['base'] = ["120 BPM", "D minor", "cinematic electronic space music", "pulsing analog arpeggios and warm synth pads", "instrumental only"]
a['arrive'] = ["loud and powerful", "high energy", "huge synth chord and deep sub bass hit on the first beat", None, "bright sequencer arpeggio and steady pulse", "soaring melodic lead"]
a['surface'] = ["soft and gentle", "low energy", "thin texture, no drums", None, "warm pad and slow arpeggio continue quietly", "calm and floating"]
a['rise'] = ["crescendo from soft to loud", "filter opening and rising arpeggio", "riser and snare roll", "building tension", "getting louder into the next section"]
TAGS['ambient'] = TAGS[None]

for track in ('orchestral', 'ambient', 'hybrid'):
    ch = chunks_for(track, 'low')
    assert ch[0]['start_ms'] == 0 and ch[-1]['end_ms'] == 180000
    for x, y in zip(ch, ch[1:]):
        assert x['end_ms'] == y['start_ms']
    plan = [{"text": "[" + x['name'] + "]", "duration_ms": x['end_ms'] - x['start_ms'], "positive_styles": x['styles'],
             "negative_styles": x['negs'], "context_adherence": x['adherence']} for x in ch]
    plan[-1]['duration_ms'] += EXTRA_MS
    assert sum(k['duration_ms'] for k in plan) == 180000 + EXTRA_MS and all(3000 <= k['duration_ms'] <= 120000 for k in plan)
    s = json.dumps(plan)
    assert '\u2014' not in s and '\u2013' not in s and '!' not in s
    json.dump({"model_id": "music_v2_5", "composition_plan": {"chunks": plan}}, open('body-%s-t%d.json' % (track, take), 'w'), indent=1)
    json.dump(dict(variant='low, last chunk %d ms past the film' % EXTRA_MS, chunks=ch), open('timeline-%s-t%d.json' % (track, take), 'w'), indent=1)
    print(track, 'take', take, 'chunks', len(plan), 'ms', sum(k['duration_ms'] for k in plan), 'bytes', len(s))
