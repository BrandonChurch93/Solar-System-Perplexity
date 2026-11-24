#!/usr/bin/env python3
# Builds the composition plans for the three music directions from the film timeline.
# Usage: python3 plan.py [take]   writes body-<track>-t<take>.json and timeline.json
import json, sys

take = int(sys.argv[1]) if len(sys.argv) > 1 else 1
FILM = '/home/user/workspace/repo/config/showcase.json'

NEG = ["vocals", "singing", "choir", "lyrics", "spoken word"]
NEG_QUIET = {
    'orchestral': NEG + ["drums", "loud percussion", "full orchestra tutti"],
    'ambient':    NEG + ["drums", "beat", "loud bass"],
    'hybrid':     NEG + ["drums", "loud percussion", "full orchestra tutti"],
}

BASE = {
    'orchestral': ["60 BPM", "D minor tonality", "cinematic symphony orchestra", "wide concert hall reverb", "instrumental only"],
    'ambient':    ["120 BPM", "D minor tonality", "ambient electronic", "analog synthesizers", "wide stereo space", "instrumental only"],
    'hybrid':     ["60 BPM", "D minor tonality", "hybrid orchestral electronic film score", "strings and brass with analog synthesizers", "instrumental only"],
}
OPEN = {
    'orchestral': ["vast and awe inspiring space film score", "great production quality"],
    'ambient':    ["vast and weightless space film score", "great production quality"],
    'hybrid':     ["vast modern space film score", "great production quality"],
}

SUN = {
    'orchestral': [
        ["very quiet opening, pianissimo", "single low string drone", "soft shimmering violin tremolo", "warm glowing texture", "no percussion", "sound begins at once"],
        ["gentle rising swell", "strings slowly climbing", "soft cymbal roll", "still quiet, piano"],
        ["soft warm chord lands on the first beat", "first statement of a slow noble theme", "French horns and strings, mezzo piano", "calm and majestic"],
        ["rising build", "crescendo into the next section", "climbing string figures", "timpani roll growing"],
    ],
    'ambient': [
        ["very quiet opening", "warm low analog drone", "slow shimmering granular texture", "no beat", "sound begins at once"],
        ["gentle rising swell", "filter slowly opening", "soft noise riser", "still quiet"],
        ["soft warm chord lands on the first beat", "first statement of a slow simple motif", "wide pad and soft sub bass, moderate level", "calm and weightless"],
        ["rising build", "crescendo into the next section", "arpeggiator fading in and brightening", "riser growing"],
    ],
    'hybrid': [
        ["very quiet opening, pianissimo", "low string drone with warm synth pad", "soft shimmering texture", "no percussion", "sound begins at once"],
        ["gentle rising swell", "strings slowly climbing over a synth riser", "still quiet"],
        ["soft warm chord lands on the first beat", "first statement of a slow noble theme", "horns, strings and soft sub bass, mezzo piano", "calm and majestic"],
        ["rising build", "crescendo into the next section", "string figures with a brightening arpeggiator", "low drum roll growing"],
    ],
}

# per planet: dynamic of the arrival, then per direction [arrival colours], [surface colours]
PLANETS = [
    ('Mercury', "mezzo forte, the first lift", {
        'orchestral': (["bright glinting celesta and harp over strings", "light quick shimmer"], ["solo harp harmonics and celesta", "high string harmonics"]),
        'ambient':    (["bright glinting arpeggiator", "crystalline bell synths", "pulsing bass enters"], ["thin glassy pad", "sparse bell tones with long delay"]),
        'hybrid':     (["bright celesta with a glinting synth arpeggio", "strings swell and pulsing bass"], ["solo piano notes in long reverb", "soft glassy synth pad"]),
    }),
    ('Venus', "mezzo forte, fuller than before", {
        'orchestral': (["lush dense strings and warm horns", "hazy golden harmony"], ["muted tremolo strings", "breathy alto flute solo"]),
        'ambient':    (["lush thick detuned pads", "hazy warm saturation", "slow pulsing bass"], ["dense soft drone", "slow filtered noise swells"]),
        'hybrid':     (["lush strings with thick warm synth pads", "hazy golden harmony"], ["muted tremolo strings over a soft drone"]),
    }),
    ('Earth', "forte, warm and hopeful", {
        'orchestral': (["warm hopeful string melody", "noble French horns"], ["solo cello with soft piano", "tender and human"]),
        'ambient':    (["warm hopeful chord progression", "soft melodic lead synth", "gentle pulsing arpeggio"], ["soft electric piano tones in reverb", "warm pad"]),
        'hybrid':     (["warm hopeful string melody over a soft synth pulse", "noble horns"], ["solo cello with felt piano and a warm pad"]),
    }),
    ('Mars', "forte, bold and strong", {
        'orchestral': (["bold martial brass over a low string ostinato", "deep drums"], ["quiet low string ostinato", "distant soft drum pulse", "dry and tense"]),
        'ambient':    (["bold driving bass sequence", "gritty analog arpeggio", "punchy electronic drums"], ["low pulsing drone", "dry sparse sequence"]),
        'hybrid':     (["bold brass over a driving synth bass ostinato", "hybrid cinematic drums"], ["quiet low string ostinato with a pulsing sub", "dry and tense"]),
    }),
    ('Jupiter', "fortissimo, massive", {
        'orchestral': (["massive low brass and full strings", "huge timpani and bass drum hits"], ["deep rumbling contrabasses", "slow swirling soft woodwinds"]),
        'ambient':    (["massive sub bass and huge wide pads", "slow heavy electronic drums", "towering chords"], ["deep rumbling sub drone", "slow swirling filtered textures"]),
        'hybrid':     (["massive low brass with huge sub bass", "giant cinematic drum hits"], ["deep rumbling drone of contrabasses and sub", "slow swirling textures"]),
    }),
    ('Saturn', "forte, grand and elegant", {
        'orchestral': (["elegant sweeping strings and harp glissandi", "shimmering celesta and glockenspiel"], ["glassy high string harmonics", "delicate harp arpeggios"]),
        'ambient':    (["elegant shimmering arpeggios", "wide glittering pads", "smooth pulsing bass"], ["glassy bell tones", "delicate high shimmer"]),
        'hybrid':     (["elegant sweeping strings with a shimmering arpeggiator", "harp and bells"], ["glassy string harmonics and bell synth", "delicate"]),
    }),
    ('Uranus', "forte, cold and wide", {
        'orchestral': (["cold wide open fifths in strings and horns", "mysterious icy shimmer"], ["cold solo clarinet over glassy strings", "distant and frozen"]),
        'ambient':    (["cold wide detuned pads", "icy digital textures", "mysterious slow arpeggio"], ["frozen thin drone", "distant sine tones"]),
        'hybrid':     (["cold open fifths in strings with icy synth textures", "mysterious"], ["frozen thin pad with a solo clarinet"]),
    }),
    ('Neptune', "fortissimo, the strongest arrival so far", {
        'orchestral': (["deep dark low brass and basses", "powerful slow stormy chords"], ["very low string drone", "distant solo horn call", "dark and vast"]),
        'ambient':    (["deep dark bass waves", "powerful slow chords", "heavy pulse"], ["very low dark drone", "distant lonely lead tone"]),
        'hybrid':     (["deep dark brass with bass synth waves", "powerful slow chords and hybrid drums"], ["very low drone", "distant solo horn with synth shimmer"]),
    }),
]

ARRIVE = ["sudden lift on the first beat", "big downbeat chord", "the slow main theme returns, broad", "sense of arrival and scale"]
SURFACE = ["sudden drop to a hushed quiet bed", "very quiet, pianissimo", "sparse and intimate", "suspended and floating"]
RISE = {
    'orchestral': ["rising build", "crescendo into the next section", "climbing strings and swelling horns", "forward motion"],
    'ambient':    ["rising build", "crescendo into the next section", "arpeggiator returns and filter opens", "forward motion"],
    'hybrid':     ["rising build", "crescendo into the next section", "climbing strings over a brightening arpeggiator", "forward motion"],
}
BIGBUILD = {
    'orchestral': ["the biggest build of the whole piece", "long crescendo", "full orchestra rising", "timpani and cymbal rolls swelling", "soaring upward strings", "pulling back and widening"],
    'ambient':    ["the biggest build of the whole piece", "long crescendo", "every layer rising", "huge riser and opening filters", "soaring lead line", "pulling back and widening"],
    'hybrid':     ["the biggest build of the whole piece", "long crescendo", "full orchestra and synths rising", "drum rolls and risers swelling", "soaring upward strings", "pulling back and widening"],
}
FINALE = {
    'orchestral': ["D major resolution", "the biggest swell of the whole piece lands on the first beat", "full orchestra tutti, triple forte", "broad triumphant main theme", "towering brass and soaring strings", "final chord held, thinning to one held note", "slow fade to silence"],
    'ambient':    ["D major resolution", "the biggest swell of the whole piece lands on the first beat", "widest wall of synth pads at full level", "broad soaring lead theme", "deep sub bass and bright shimmer", "final chord held, thinning to one held tone", "slow fade to silence"],
    'hybrid':     ["D major resolution", "the biggest swell of the whole piece lands on the first beat", "full orchestra and synths tutti, triple forte", "broad triumphant main theme", "towering brass, soaring strings and deep sub bass", "final chord held, thinning to one held note", "slow fade to silence"],
}


def timeline():
    c = json.load(open(FILM))
    fps = c.get('fps', 30)
    segs = c['segments']
    return c, fps, segs


def chunks_for(track):
    out = []  # (start_ms, end_ms, name, role, level, styles, negs)
    base = BASE[track]
    def add(a, b, name, role, level, styles, quiet=False, first=False, final=False):
        st = list(base)
        if final:
            st = [s for s in st if s != "D minor tonality"]
        if first:
            st = st + OPEN[track]
        st = st + styles
        out.append(dict(start_ms=int(a * 1000), end_ms=int(b * 1000), name=name, role=role, level=level,
                        styles=st, negs=(NEG_QUIET[track] if quiet else NEG)))
    s = SUN[track]
    add(0, 6, 'Sun surface', 'surface', 2, s[0], quiet=True, first=True)
    add(6, 9, 'Sun rise', 'rise', 3, s[1], quiet=True)
    add(9, 15, 'Sun revealed', 'arrival', 4, s[2])
    add(15, 18, 'Travel to Mercury', 'travel', 5, s[3])
    levels = [6, 6.5, 7, 7.5, 8, 8, 8, 8.5]
    for i, (name, dyn, col) in enumerate(PLANETS):
        B = 18 + 19 * i
        arr, sur = col[track]
        add(B, B + 8, name + ' arrival', 'arrival', levels[i], ARRIVE[:2] + arr + [dyn] + ARRIVE[2:])
        add(B + 8, B + 14, name + ' surface', 'surface', 3, SURFACE[:2] + sur + SURFACE[2:], quiet=True)
        if i < 7:
            add(B + 14, B + 19, 'Rise from ' + name, 'travel', levels[i] - 1, RISE[track])
        else:
            add(B + 14, 171.5, 'Rise and pull back past Neptune', 'travel', 9, BIGBUILD[track])
            add(171.5, 180, 'Looking back', 'finale', 10, FINALE[track], final=True)
    return out


def main():
    c, fps, segs = timeline()
    total = 0
    tl = {}
    for track in ('orchestral', 'ambient', 'hybrid'):
        ch = chunks_for(track)
        assert ch[0]['start_ms'] == 0 and ch[-1]['end_ms'] == 180000
        for a, b in zip(ch, ch[1:]):
            assert a['end_ms'] == b['start_ms'], (a, b)
        body = {"model_id": "music_v2_5", "composition_plan": {"chunks": [
            {"text": "[" + x['name'] + "]", "duration_ms": x['end_ms'] - x['start_ms'],
             "positive_styles": x['styles'], "negative_styles": x['negs'], "context_adherence": "high"} for x in ch]}}
        assert sum(k['duration_ms'] for k in body['composition_plan']['chunks']) == 180000
        assert all(3000 <= k['duration_ms'] <= 120000 for k in body['composition_plan']['chunks'])
        json.dump(body, open('body-%s-t%d.json' % (track, take), 'w'), indent=1)
        tl[track] = ch
        print(track, 'chunks', len(ch), 'ms', sum(k['duration_ms'] for k in body['composition_plan']['chunks']),
              'bytes', len(json.dumps(body)))
    json.dump(tl, open('timeline-t%d.json' % take, 'w'), indent=1)
    # film facts, read from the config, for the notes
    try:
        tot = sum((s.get('frames') or 0) for s in segs)
        print('film segments', len(segs), 'frames', tot, 'fps', fps)
    except Exception as e:
        print('film read', e)


main()
