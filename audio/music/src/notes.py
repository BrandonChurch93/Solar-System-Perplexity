#!/usr/bin/env python3
# notes.py : writes deliver/NOTES.md and deliver/prompts/*.json from the files of this folder and the film's config.
import json, os, re
W = '/home/user/workspace/music-work'
OUT = W + '/deliver'
cfg = json.load(open('/home/user/workspace/repo/config/showcase.json'))
segs = cfg['segments']
fps = cfg['film']['fps']
TR = ['orchestral', 'ambient', 'hybrid']
NAMES = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
BASES = [18 + 19 * i for i in range(8)]
IDS = {
    'orchestral': ['Py2809oe5SBHlb3Vj0Jr', 'pPpYTknv5JqyUnHPIQOj', 'cL0qydEQrfKzbq317WSW'],
    'ambient': ['amKmJm01IHkv99C1ZXRR', 'qjoN46KpKWogawKciHC6', 'NWMfrkISZZdXQkZPvpx3'],
    'hybrid': ['q2p8VMjMe8ab75p0Iv1s', 'bBVd9y30OoOccWkXwS4c', '6xpVjX4aaTu0suzKXSBt'],
}
LUFS = {'orchestral': (-18.1, 11.0, -13.4, 8.0), 'ambient': (-19.3, 10.4, -13.9, 4.1), 'hybrid': (-16.2, 12.1, -12.0, 6.1)}
FIRST = {'orchestral': 1.062, 'ambient': 0.275, 'hybrid': 0.006}
ONS = {
    'orchestral': [0.86, 1.01, 0.52, 0.13, 1.41, 0.01, 0.25, 1.0, -0.02],
    'ambient': [0.04, -0.09, 0.16, 0.91, -0.96, 0.02, 0.87, 0.49, -0.03],
    'hybrid': [1.25, 1.26, -1.48, 0.01, -1.36, -0.01, 0.01, 0.04, -1.09],
}
STEM = {'orchestral': -96.1, 'ambient': -120.0, 'hybrid': -89.9}
o = []
A = o.append


def f(x):
    return ('%.1f' % x) if abs(x - round(x)) > 1e-9 else str(int(round(x)))


A('# Music for the film: notes')
A('')
A('Three instrumental tracks made to fit the film. The film is finished work and nothing in it was changed for the music: no file under `src/`, `public/`, `config/`, `cut/` or `out/` is touched by this folder.')
A('')
A('Every number below carries one of three labels. MEASURED: computed from the files in this folder by the scripts in `src/`. STATED: said by a tool or a service and not checked here. UNKNOWN: not established.')
A('')
A('## Files')
A('')
A('| File | What it is |')
A('| --- | --- |')
for t in TR:
    A('| `%s.mp3` | The track to use: take 3 of the %s direction, cut to the film length and fitted to the timeline. 48 kHz stereo, 256 kbps, 180.000 s |' % (t, t))
for t in TR:
    A('| `raw/%s-take3.mp3` | The same take as it came from the generator, cut to 180.000 s, no level change. 48 kHz stereo, 192 kbps |' % t)
A('| `prompts/<direction>-take<n>.json` | The composition plan of every call, exactly as sent (nine files) |')
A('| `prompts/plan-request.json`, `prompts/plan-response.json` | The one call to the service\'s own planner and what it gave back |')
A('| `src/` | The scripts: `plan.py`, `plan2.py`, `plan3.py` (the plans of takes 1, 2 and 3), `gen.sh` (one call), `fit.py` (the fit), `measure.py`, `onsets.py`, `stems.sh`, `stemlevels.py`, `notes.py` (this file) |')
A('')
A('## The film timeline (timestamp map)')
A('')
A('Read from `config/showcase.json`. Total length %s s, %d frames at %d frames a second. Every time below is in seconds from the first frame.' % (f(cfg['film']['durationSeconds']), int(cfg['film']['durationSeconds'] * fps), fps))
A('')
A('| Stop | Arrival (the planet view starts) | Dive to the surface starts | Surface view | Rise starts | Travel to the next stop |')
A('| --- | --- | --- | --- | --- | --- |')
by = {s['id']: s for s in segs}
A('| Sun | the film opens on its surface | none | %s to %s | %s | %s to %s |' % (f(by['sun.terrain']['start']), f(by['sun.terrain']['end']), f(by['sun.rise']['start']), f(by['sun.travel']['start']), f(by['sun.travel']['end'])))
for n in NAMES:
    k = n.lower()
    tv = by.get(k + '.travel')
    A('| %s | %s | %s | %s to %s | %s | %s |' % (n, f(by[k + '.hold']['start']), f(by[k + '.dive']['start']), f(by[k + '.terrain']['start']), f(by[k + '.terrain']['end']), f(by[k + '.rise']['start']), ('%s to %s' % (f(tv['start']), f(tv['end']))) if tv else 'the pull back, below'))
A('')
A('The ending: the pull back past Neptune runs %s to %s, the look back at the whole system %s to %s (the last landing, at %s), the fade %s to %s.' % (f(by['ending.retreat']['start']), f(by['ending.retreat']['end']), f(by['ending.lookback']['start']), f(by['ending.lookback']['end']), f(by['ending.lookback']['start']), f(by['ending.fade']['start']), f(by['ending.fade']['end'])))
A('')
A('All %d segments, in order:' % len(segs))
A('')
A('| Segment | Start s | End s | First frame | Last frame |')
A('| --- | --- | --- | --- | --- |')
for s in segs:
    A('| %s | %s | %s | %d | %d |' % (s['id'], f(s['start']), f(s['end']), int(round(s['start'] * fps)), int(round(s['end'] * fps)) - 1))
A('')
A('## The composition plan, second by second')
A('')
A('One plan for all three directions; only the instruments and the words change. Levels are the targets of the fit, in dB under the ending.')
A('')
A('| Seconds | Film | Music | Target level |')
A('| --- | --- | --- | --- |')
A('| 0 to 6 | Sun, surface view | The quiet opening: one low held sound, no beat, sound from the first frame | 13 under |')
A('| 6 to 9 | Sun, rise | A soft swell | ramp |')
A('| 9 to 15 | Sun, planet view | The theme enters, calm | 8 under |')
A('| 15 to 18 | Travel to Mercury | A build into the first arrival | ramp up to 3.5 under the arrival |')
for i, n in enumerate(NAMES):
    B = BASES[i]
    A('| %d to %d | %s, arrival | The lift: the theme at its level for this stop, each stop a little higher than the one before | %.1f under |' % (B, B + 5, n, 4.0 - 2.5 * i / 7))
    A('| %d to %d | %s, dive | The music thins as the camera goes down | ramp down over 3 s |' % (B + 5, B + 8, n))
    A('| %d to %d | %s, surface view | The drop: a quiet bed, no beat | 12 under |' % (B + 8, B + 14, n))
    if i < 7:
        A('| %d to %s | %s, rise and travel | A build into the next arrival | ramp up to 3.5 under the arrival |' % (B + 14, f(B + 19), n))
    else:
        A('| %d to 171.5 | Neptune, rise, then the pull back past Neptune | The longest build of the film | ramp up to 2.5 under the ending |' % (B + 14))
A('| 171.5 to 177.5 | The look back at the whole system | The biggest swell of the film | 0 (the loudest six seconds) |')
A('| 177.5 to 180 | Fade | The last chord falls to silence on the last sample | fade |')
A('')
A('## The three tracks')
A('')
A('| Track | Direction | Kept take | Song id at the service | One line (the instruments are those the plan asks for) |')
A('| --- | --- | --- | --- | --- |')
LINE = {
    'orchestral': 'Orchestral and vast: a symphony orchestra at 60 BPM, D minor turning to D major at the ending; strings, celesta and trumpets at the arrivals, the full orchestra at the ending.',
    'ambient': 'Ambient electronic at 120 BPM: warm synth pads, analog arpeggios and sub bass; the take whose own hits fall closest to the landings.',
    'hybrid': 'Hybrid: strings and brass over analog synthesizers and sub bass at 60 BPM; the loudest of the three.',
}
for t in TR:
    A('| `%s.mp3` | %s | 3 | %s | %s |' % (t, t, IDS[t][2], LINE[t]))
A('')
A('## Takes')
A('')
A('The task allows one take and at most two retries for each track. All three were used on every track, so no further generation is allowed. One short test call was made first to confirm that the connector works (10.06 s, song id LPiZbMsuFdTJTM8SRf9X, not kept in the repo).')
A('')
A('| Track | Take | Song id | Raw length s | Plan | Kept |')
A('| --- | --- | --- | --- | --- | --- |')
for t in TR:
    for k in (1, 2, 3):
        m = json.load(open('%s/%s-t%d.measure.json' % (W, t, k)))
        b = json.load(open('%s/body-%s-t%d.json' % (W, t, k)))
        ch = b['composition_plan']['chunks']
        A('| %s | %d | %s | %.2f | %d sections, %.1f s | %s |' % (t, k, IDS[t][k - 1], m['seconds'], len(ch), sum(c['duration_ms'] for c in ch) / 1000.0, 'yes' if k == 3 else 'no'))
A('')
A('Why take 3 of each. Take 1 used 29 sections that all follow their neighbours closely; the result ran evenly loud from start to end. Take 2 put the energy words first, took out the words for silence and fading, and chose for each section how closely it follows its neighbours. Take 3 frees every section after the first from its neighbours, so each arrival can hit and each surface can thin out at its own second, and runs 3.5 s past the film so that the generator\'s own ending falls after 180 s and is cut. In the orchestral direction takes 1 and 2 were also flagged for a wordless choir by a listening check (STATED, see "Vocals"); take 3 was not flagged in that way on its excerpts.')
A('')
A('No take follows the plan\'s levels on its own. MEASURED on the raw takes with `src/measure.py`: none of the nine raw takes lifts by 3 dB at all eight arrivals, none drops by 3 dB in all eight surface views, and none has its loudest six seconds at the ending. That is why the kept takes are fitted (next section).')
A('')
A('## The fit: what was done to the kept takes')
A('')
A('`src/fit.py` does four things and nothing else: it cuts the take to exactly 180.000 s; it multiplies it by one slow volume curve whose points sit on the film\'s timeline; it lays the film\'s fade (177.5 s to 180.0 s) on it; it sets the peak to 1 dB under full scale. No note is moved, stretched, repeated or replaced, and no other sound is mixed in. The lift at each arrival, the drop in each surface view and the swell at the ending that you hear in the fitted tracks come in large part from this volume curve, not from the playing alone. The raw takes are beside them for comparison.')
A('')
A('The curve holds one level through each arrival (5 s) and each surface view (6 s) and ramps between them over the 3 s of each dive; before each landing the level sits a little lower and rises into the landing over 0.4 s.')
A('')
A('| Track | Range of the volume curve, dB (MEASURED) | Rise into each landing, dB: Mercury to Neptune, then the last landing (MEASURED) |')
A('| --- | --- | --- |')
for t in TR:
    fj = json.load(open('%s/%s-fit.json' % (W, t)))
    nodes = fj['nodes']
    gs = [n[1] if isinstance(n, list) else n['gain_db'] for n in nodes]
    ts = [n[0] if isinstance(n, list) else n['seconds'] for n in nodes]
    def gat(x):
        return [g for tt, g in zip(ts, gs) if abs(tt - x) < 1e-6][0]
    rises = ['%.1f' % (gat(B) - gat(B - 0.4)) for B in BASES] + ['%.1f' % (gat(171.5) - gat(171.5 - 0.4))]
    A('| %s | %.1f | %s |' % (t, max(gs) - min(gs), ', '.join(rises)))
A('')
A('## Measures of the delivered tracks')
A('')
A('MEASURED on the three `.mp3` files as delivered, decoded to 48 kHz stereo (`src/measure.py`, and the loudness meter of ffmpeg, filter `ebur128`).')
A('')
A('| Track | Length, samples | Length s | Loudness LUFS | Loudness range LU | Peak dBFS | Lifts of 3 dB at the 8 arrivals | Drops of 3 dB in the 8 surface views | Loudest 6 s start at | First sound over -50 dBFS at |')
A('| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |')
M = {}
for t in TR:
    m = json.load(open('/tmp/mdel/%s.measure.json' % t)); M[t] = m
    A('| %s | %d | %.3f | %.1f | %.1f | %.1f | %d of 8 | %d of 8 | %.1f s | %.2f s |' % (t, m['samples'], m['seconds'], LUFS[t][0], LUFS[t][1], m['peak_dbfs'], m['lifts_ok'], m['drops_ok'], m['loudest_6s_start'], FIRST[t]))
A('')
A('The raw takes for comparison, MEASURED: orchestral %.1f LUFS with a range of %.1f LU, ambient %.1f and %.1f, hybrid %.1f and %.1f.' % (LUFS['orchestral'][2], LUFS['orchestral'][3], LUFS['ambient'][2], LUFS['ambient'][3], LUFS['hybrid'][2], LUFS['hybrid'][3]))
A('')
A('Level by stop, MEASURED, in dB (mean power, full scale = 0). Arrival is the first 5 s of the planet view, surface is the 6 s of the surface view.')
A('')
A('| Track | Sun surface | Sun planet view | ' + ' | '.join('%s arrival, surface' % n for n in NAMES) + ' | Ending |')
A('| --- | --- | --- | ' + ' | '.join('---' for n in NAMES) + ' | --- |')
for t in TR:
    m = M[t]
    A('| %s | %.1f | %.1f | ' % (t, m['sun_surface_db'], m['sun_hold_db']) + ' | '.join('%.1f, %.1f' % (m['arrival_db'][i], m['surface_db'][i]) for i in range(8)) + ' | %.1f |' % m['finale_db'])
A('')
A('The takes\' own hits against the landings, MEASURED with `src/onsets.py` (seconds from each landing to the strongest onset within 1.5 s of it; Mercury to Neptune, then the last landing):')
A('')
for t in TR:
    A('- %s: %s' % (t, ', '.join(('%+.2f' % x) for x in ONS[t])))
A('')
A('The ambient track\'s own hits fall within 0.16 s of the landing at Mercury, Venus, Earth, Saturn and the last landing. The orchestral and hybrid takes have weaker onsets that fall up to 1.5 s from several landings. No take was shifted in time.')
A('')
A('## Known weak points')
A('')
A('- Orchestral: the first 1.06 s are silent (MEASURED: the first half second is digital silence). The plan asks for sound from the first frame; this take does not give it, and the fit does not add sound.')
A('- Ambient: the first sound over -50 dBFS comes at 0.28 s; the first half second sits at %.1f dB, just above the floor of the check.' % M['ambient']['first_half_second_db'])
A('- Hybrid: a thin passage at about 15 to 18 s, in the travel to Mercury, where the take almost stops before the first arrival.')
A('- All three: the dynamics are helped by the volume curve (see "The fit"). In the orchestral and hybrid tracks the music does not always change at the second of a landing; the level does.')
A('- The cue sheet of the film (`cut/CUES.md`) asks for sound at full level on frame 0. The music task asks for a quiet opening at the Sun; the task is newer and holds. The opening is quiet.')
A('')
A('## Vocals')
A('')
A('The task says no vocals. Every section of every plan carries the negative words "vocals", "singing", "choir", "lyrics" and "spoken word".')
A('')
A('- MEASURED: the generator\'s own stem separation was run on the three kept takes (`src/stems.sh`), and the level of each stem measured in 5 s windows (`src/stemlevels.py`). The voice stem as a whole sits at %.1f dBFS (orchestral), %.1f dBFS (ambient) and %.1f dBFS (hybrid), and at least 61 dB under the whole take in every window: the separation finds no voice in any kept take.' % (STEM['orchestral'], STEM['ambient'], STEM['hybrid']))
A('- STATED, by a listening model that proved unreliable (it gave the same file 10 of 10 and 1 of 10 on one question): orchestral take 3, thirteen checks on excerpts heard no voice, and two checks on the whole file named a wordless choir, at different times (84 to 95 s, 109 to 124 s). Hybrid take 3: for the excerpt 60 to 90 s four checks heard no voice and three named a choir; no other excerpt was flagged. Ambient take 3: no voice named.')
A('- UNKNOWN: whether a listener hears a choir like pad in the orchestral track near 84 to 124 s or in the hybrid track near 60 to 90 s. A separation that finds no voice stem does not rule out a string or synth pad that sounds like one. Listen to those two places before picking.')
A('')
A('## Every prompt')
A('')
A('The service takes a composition plan: a list of sections, each with a name, a length, words to follow, words to avoid, and how closely the section follows its neighbours. The model id of the calls is the one written in `src/plan.py`. The exact plans are in `prompts/`; the same content follows in reading form.')
A('')
A('Test call (20:51 UTC, 2026-11-23): a 10 s call with a one line prompt that began "A calm, slow ambient pad with soft low strings and a distan"; the rest of that line was not kept in a file.')
A('')
pr = json.load(open(W + '/planreq.json'))
A('Call to the service\'s planner (it returns a plan and makes no sound; its plan was read for its form and not used): length %d ms, prompt: "%s"' % (pr['music_length_ms'], pr['prompt']))
A('')
os.makedirs(OUT + '/prompts', exist_ok=True)
json.dump({'music_length_ms': pr['music_length_ms'], 'prompt': pr['prompt']}, open(OUT + '/prompts/plan-request.json', 'w'), indent=1)
json.dump(json.load(open(W + '/planresp.json')), open(OUT + '/prompts/plan-response.json', 'w'), indent=1)
for t in TR:
    for k in (1, 2, 3):
        b = json.load(open('%s/body-%s-t%d.json' % (W, t, k)))
        cp = b['composition_plan']
        json.dump(cp, open('%s/prompts/%s-take%d.json' % (OUT, t, k), 'w'), indent=1)
        A('### %s, take %d (song id %s)' % (t.capitalize(), k, IDS[t][k - 1]))
        A('')
        A('| Starts s | Length s | Section | Words to follow | Words to avoid | Follows its neighbours |')
        A('| --- | --- | --- | --- | --- | --- |')
        at = 0.0
        for c in cp['chunks']:
            A('| %s | %s | %s | %s | %s | %s |' % (f(at), f(c['duration_ms'] / 1000.0), c['text'].strip('[]'), ', '.join(c['positive_styles']), ', '.join(c['negative_styles']), c.get('context_adherence', '')))
            at += c['duration_ms'] / 1000.0
        A('')
A('## What comes next')
A('')
A('Step 6 of the task, one cue of 20 to 30 s for each planet in the style of the picked track, waits for the pick.')
A('')
s = '\n'.join(o)
bad = [c for c in ('\u2014', '\u2013', '!') if c in s]
assert not bad, bad
open(OUT + '/NOTES.md', 'w').write(s)
print('NOTES.md', len(s), 'bytes', len(o), 'lines')
