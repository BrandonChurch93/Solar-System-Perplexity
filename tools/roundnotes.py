"""Which note of the owner a stop round belongs to, and which round of that note it is. A stop has its rounds anew for each note.
Pure functions of the round lines of kit/PROGRESS.md."""
import re

WORDS = ['first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth']
LINE = re.compile(r'- Round (\d+), Phase (\d+), ([^,.]+), round \d+ of \d+( of the (\w+) note)?')


def word(note):
    return WORDS[note - 1]


def number(text):
    """A note as the flag states it: its number or its word."""
    if text is None:
        return None
    t = str(text).strip().lower()
    if t in WORDS:
        return WORDS.index(t) + 1
    if t.isdigit() and 1 <= int(t) <= len(WORDS):
        return int(t)
    raise ValueError('--note takes a number from 1 to %d or a word from %s to %s' % (len(WORDS), WORDS[0], WORDS[-1]))


def read(lines, phase):
    """The stop rounds of a phase: (round, stop, note). A line that says "of the second note" belongs to it. A line that says nothing
    belongs to the latest note that had begun when it started: a note begins with its lowest round whose line names it, for every stop."""
    rows = []
    for l in lines:
        m = LINE.match(l)
        if m and int(m.group(2)) == phase:
            rows.append((int(m.group(1)), m.group(3), WORDS.index(m.group(5)) + 1 if m.group(5) in WORDS else None))
    begins = {}
    for n, _, note in rows:
        if note:
            begins[note] = min(begins.get(note, n), n)
    return [(n, stop, note or max([1] + [m for m, at in begins.items() if at <= n])) for n, stop, note in rows], begins


def count(lines, phase, stop, note=None):
    """The round a stop starts now: k, the round of the note; the note; whether the line names the note (not while the phase knows one
    note only); whether it is the stop's first round of the phase at all. While the phase knows one note it need not be stated. As soon
    as it knows more, the note must be stated: the stops do not all go on in the same note. A note is one that has begun, or the next."""
    rows, begins = read(lines, phase)
    latest = max([1] + list(begins))
    choices = ', '.join(WORDS[:latest + 1][:-1]) + ' or ' + WORDS[latest] if latest < len(WORDS) else ', '.join(WORDS)
    if note is None and latest > 1:
        raise ValueError('Phase %d knows %d notes: state the note of this round of %s with --note %s' % (phase, latest, stop, choices))
    note = note or latest
    if note > latest + 1:
        raise ValueError('Phase %d knows %d note%s: --note %s' % (phase, latest, '' if latest == 1 else 's', choices))
    own = [r for r in rows if r[1] == stop]
    return {'k': len([r for r in own if r[2] == note]) + 1, 'note': note, 'named': note > 1 or latest > 1, 'first': not own}


def tail(c):
    return ' of the %s note' % word(c['note']) if c['named'] else ''
