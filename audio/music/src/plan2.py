#!/usr/bin/env python3
# Take 2 and later: composition plans with energy words first, no silence words, no fade words in the finale,
# and a chosen context adherence per chunk role. Usage: python3 plan2.py TAKE [track=variant ...]
# variant: three (arrival, surface, rise as three chunks) or two (surface and rise as one chunk)
import json, sys

take = int(sys.argv[1])
opts = dict(a.split('=') for a in sys.argv[2:])
NEG = ["vocals", "singing", "choir", "lyrics", "spoken word"]

T = {
 'orchestral': dict(
    base=["60 BPM", "D minor", "cinematic symphony orchestra", "epic space film score", "instrumental only"],
    first=["great production quality", "wide concert hall sound"],
    sun=[["soft opening", "starts at once with a low string drone", "gentle shimmering violins", "warm glow", "low energy"],
         ["gentle swell", "strings rising", "soft cymbal roll", "growing"],
         ["warm noble theme enters", "horns and strings", "moderate level", "calm and majestic", "medium energy"],
         ["crescendo", "rising strings", "timpani roll", "building tension", "getting louder"]],
    arrive=["loud and powerful", "high energy", "full orchestra hits on the first beat", None, "broad main theme, sustained", "big and majestic"],
    surface=["soft and gentle", "low energy", "thin texture", None, "the theme continues quietly", "calm and floating"],
    surf_neg=["loud", "drums", "full orchestra", "brass"],
    rise=["crescendo", "rising strings and swelling horns", "timpani roll", "building tension", "getting louder into the next section"],
    merged=["starts soft and gentle with a thin texture", None, "low energy for the first half", "then a crescendo with rising strings and swelling horns", "timpani roll at the end", "getting louder into the next section"],
    bigbuild=["huge crescendo", "the biggest build of the piece", "full orchestra rising", "timpani roll and cymbal swell", "soaring upward strings", "getting louder and louder"],
    finale=["D major", "the loudest moment of the whole piece", "very high energy", "full orchestra fortissimo", "triumphant main theme", "towering brass, soaring strings, crashing cymbals", "sustained at full power to the very end"],
    col=[("bright glittering strings and celesta, brilliant trumpets", "soft harp and celesta over held strings"),
         ("lush thick strings and glowing horns, rich and full", "soft muted strings and a breathy flute"),
         ("warm soaring string melody, noble horns, hopeful", "soft solo cello and piano over held strings"),
         ("pounding war drums, bold brass, driving low strings", "soft low string ostinato with a light pulse"),
         ("massive low brass, thundering timpani, colossal", "soft deep basses and slow woodwinds"),
         ("grand sweeping strings, harp glissandi, bright bells", "soft glassy string harmonics and harp"),
         ("icy shimmering high strings over powerful brass chords", "soft clarinet over glassy held strings"),
         ("dark thundering low brass and drums, stormy, immense", "soft low held strings and a solo horn")]),
 'ambient': dict(
    base=["120 BPM", "D minor", "cinematic ambient electronic", "analog synthesizers", "lush wide pads", "instrumental only"],
    first=["great production quality", "wide stereo space"],
    sun=[["soft opening", "starts at once with a warm low synth drone", "gentle shimmering texture", "no beat", "low energy"],
         ["gentle swell", "filter slowly opening", "soft riser", "growing"],
         ["warm simple motif enters", "wide pad and soft sub bass", "moderate level", "calm and weightless", "medium energy"],
         ["crescendo", "arpeggio fading in", "riser", "building tension", "getting louder"]],
    arrive=["loud and powerful", "high energy", "huge synth chord and deep sub bass hit on the first beat", None, "bright arpeggio and steady pulse", "wide and majestic"],
    surface=["soft and gentle", "low energy", "thin texture, no beat", None, "warm pad continues quietly", "calm and floating"],
    surf_neg=["loud", "drums", "heavy bass"],
    rise=["crescendo", "filter opening and rising arpeggio", "riser and snare roll", "building tension", "getting louder into the next section"],
    merged=["starts soft and gentle with a thin texture and no beat", None, "low energy for the first half", "then a crescendo with a rising arpeggio and opening filter", "riser and snare roll at the end", "getting louder into the next section"],
    bigbuild=["huge crescendo", "the biggest build of the piece", "all layers rising", "long riser and opening filters", "soaring lead line", "getting louder and louder"],
    finale=["D major", "the loudest moment of the whole piece", "very high energy", "massive wall of synth chords and deep sub bass", "soaring lead melody and bright arpeggios", "steady strong pulse", "sustained at full power to the very end"],
    col=[("bright glinting arpeggios and crystalline bells", "soft glassy pad and sparse bell tones"),
         ("lush thick detuned pads, warm and full", "soft dense drone with slow swells"),
         ("warm hopeful chords and a singing lead synth", "soft electric piano tones over a warm pad"),
         ("driving bass sequence, gritty arpeggio, punchy drums", "soft pulsing drone and a dry sparse sequence"),
         ("massive sub bass, towering chords, heavy slow drums", "soft deep sub drone and slow swirling textures"),
         ("grand shimmering arpeggios and glittering wide pads", "soft glassy bell tones and a delicate shimmer"),
         ("icy bright digital textures over powerful wide chords", "soft thin drone and clear sine tones"),
         ("dark heavy bass waves, powerful slow chords, immense", "soft low dark drone and a lonely lead tone")]),
 'hybrid': dict(
    base=["60 BPM", "D minor", "hybrid orchestral electronic film score", "strings and brass with analog synthesizers and deep sub bass", "instrumental only"],
    first=["great production quality", "wide cinematic sound"],
    sun=[["soft opening", "starts at once with low strings and a warm synth pad", "gentle shimmering texture", "low energy"],
         ["gentle swell", "strings rising over a soft riser", "growing"],
         ["warm noble theme enters", "horns, strings and soft sub bass", "moderate level", "calm and majestic", "medium energy"],
         ["crescendo", "rising strings with a brightening arpeggio", "drum roll", "building tension", "getting louder"]],
    arrive=["loud and powerful", "high energy", "full orchestra and synth bass hit on the first beat", None, "broad main theme, sustained", "big and majestic"],
    surface=["soft and gentle", "low energy", "thin texture", None, "the theme continues quietly", "calm and floating"],
    surf_neg=["loud", "drums", "full orchestra", "brass"],
    rise=["crescendo", "rising strings over a brightening arpeggio", "drum roll and riser", "building tension", "getting louder into the next section"],
    merged=["starts soft and gentle with a thin texture", None, "low energy for the first half", "then a crescendo with rising strings and a synth riser", "drum roll at the end", "getting louder into the next section"],
    bigbuild=["huge crescendo", "the biggest build of the piece", "full orchestra and synths rising", "drum rolls, risers and cymbal swell", "soaring upward strings", "getting louder and louder"],
    finale=["D major", "the loudest moment of the whole piece", "very high energy", "full orchestra and synths fortissimo", "triumphant main theme", "towering brass, soaring strings, deep sub bass, crashing cymbals", "sustained at full power to the very end"],
    col=[("bright celesta and a glinting synth arpeggio over strong strings", "soft piano notes over a glassy synth pad"),
         ("lush strings with thick warm synth pads, rich and full", "soft muted strings over a warm drone"),
         ("warm soaring string melody over a synth pulse, noble horns", "soft solo cello and felt piano over a warm pad"),
         ("bold brass over a driving synth bass, pounding cinematic drums", "soft low string ostinato with a light sub pulse"),
         ("massive low brass with huge sub bass, giant drum hits", "soft deep drone of basses and sub, slow textures"),
         ("grand sweeping strings with a shimmering arpeggiator, harp and bells", "soft glassy string harmonics and bell synth"),
         ("icy shimmering strings and bright synth textures over powerful brass", "soft thin pad and a solo clarinet"),
         ("dark thundering brass with heavy bass synth waves and drums", "soft low drone and a solo horn")]),
}
NAMES = ['Mercury', 'Venus', 'Earth', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune']
# context adherence per role, per variant
ADH = {
    'three':  dict(first='high', sunrise='medium', sunhold='low', travel='medium', arrive='low', surface='low', rise='medium', merged='medium', bigbuild='medium', finale='low'),
    'threeb': dict(first='high', sunrise='medium', sunhold='low', travel='high', arrive='low', surface='low', rise='high', merged='high', bigbuild='high', finale='low'),
    'two':    dict(first='high', sunrise='medium', sunhold='low', travel='medium', arrive='low', surface='low', rise='medium', merged='medium', bigbuild='medium', finale='low'),
}
TAGS = {  # section names for the ambient direction use the common tags of electronic music
    'ambient': dict(sun=['Intro', 'Intro Swell', 'Theme', 'Build Up'], arrive='%s Drop', surface='%s Breakdown', rise='Build Up To %s', merged='%s Breakdown And Build Up', bigbuild='Final Build Up', finale='Final Drop'),
    None: dict(sun=['Sun Surface', 'Sun Rise', 'Sun Revealed', 'Travel To Mercury'], arrive='%s Arrival', surface='%s Surface', rise='Rise And Travel To %s', merged='%s Surface Then Build', bigbuild='Pull Back Past Neptune', finale='Looking Back, Final Climax'),
}


def fill(lst, colour):
    return [colour if x is None else x for x in lst]


def chunks_for(track, variant):
    d = T[track]; adh = ADH[variant]; tag = TAGS.get(track, TAGS[None]); base = d['base']
    out = []
    def add(a, b, name, role, styles, negs, ca, first=False, final=False):
        st = [s for s in base if not (final and s == 'D minor')]
        if first:
            st = st + d['first']
        out.append(dict(start_ms=int(round(a * 1000)), end_ms=int(round(b * 1000)), name=name, role=role,
                        styles=st + styles, negs=negs, adherence=ca))
    add(0, 6, tag['sun'][0], 'surface', d['sun'][0], NEG + ["loud", "drums", "fade in"], adh['first'], first=True)
    add(6, 9, tag['sun'][1], 'rise', d['sun'][1], NEG, adh['sunrise'])
    add(9, 15, tag['sun'][2], 'arrival', d['sun'][2], NEG, adh['sunhold'])
    add(15, 18, tag['sun'][3], 'travel', d['sun'][3], NEG, adh['travel'])
    for i, n in enumerate(NAMES):
        B = 18 + 19 * i
        ca, cs = d['col'][i]
        nxt = NAMES[i + 1] if i < 7 else None
        add(B, B + 8, tag['arrive'] % n, 'arrival', fill(d['arrive'], ca), NEG + ["quiet", "sparse"], adh['arrive'])
        if variant in ('three', 'threeb'):
            add(B + 8, B + 14, tag['surface'] % n, 'surface', fill(d['surface'], cs), NEG + d['surf_neg'], adh['surface'])
            if i < 7:
                add(B + 14, B + 19, tag['rise'] % nxt, 'travel', d['rise'], NEG, adh['rise'])
            else:
                add(B + 14, 171.5, tag['bigbuild'], 'travel', d['bigbuild'], NEG, adh['bigbuild'])
        else:
            if i < 7:
                add(B + 8, B + 19, tag['merged'] % n, 'surface and travel', fill(d['merged'], cs), NEG, adh['merged'])
            else:
                m = fill(d['merged'], cs)[:3] + ["then " + d['bigbuild'][1], d['bigbuild'][2], d['bigbuild'][3], d['bigbuild'][5]]
                add(B + 8, 171.5, tag['merged'] % n, 'surface and travel', m, NEG, adh['merged'])
    add(171.5, 180, tag['finale'], 'finale', d['finale'], NEG + ["quiet", "soft", "sparse", "fade out"], adh['finale'], final=True)
    return out


for track in ('orchestral', 'ambient', 'hybrid'):
    if track not in opts:
        continue
    ch = chunks_for(track, opts[track])
    assert ch[0]['start_ms'] == 0 and ch[-1]['end_ms'] == 180000
    for a, b in zip(ch, ch[1:]):
        assert a['end_ms'] == b['start_ms'], (a['name'], b['name'])
    plan = [{"text": "[" + x['name'] + "]", "duration_ms": x['end_ms'] - x['start_ms'], "positive_styles": x['styles'],
             "negative_styles": x['negs'], "context_adherence": x['adherence']} for x in ch]
    assert sum(k['duration_ms'] for k in plan) == 180000 and all(3000 <= k['duration_ms'] <= 120000 for k in plan)
    s = json.dumps(plan)
    assert '\u2014' not in s and '\u2013' not in s and '!' not in s
    json.dump({"model_id": "music_v2_5", "composition_plan": {"chunks": plan}}, open('body-%s-t%d.json' % (track, take), 'w'), indent=1)
    json.dump(dict(variant=opts[track], chunks=ch), open('timeline-%s-t%d.json' % (track, take), 'w'), indent=1)
    print(track, 'take', take, 'variant', opts[track], 'chunks', len(plan), 'bytes', len(s))
