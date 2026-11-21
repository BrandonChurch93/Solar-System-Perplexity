import re, sys, pathlib
root = pathlib.Path(__file__).resolve().parent.parent
text = (root / 'kit' / '07-QUALITY-BAR.md').read_text()
out = root / 'out' / 'work' / 'crit'
out.mkdir(parents=True, exist_ok=True)
fmt = re.search(r'```json\n.*?```\n\n- `score` is 1 to 10\.[^\n]*\n', text, re.S).group(0)
lead = 'You are a critic. Look at every attached image, open each one, and answer with one JSON object, nothing else.\n\n'
heads = list(re.finditer(r'^### (R\d[^\n]*)\n', text, re.M))
for i, h in enumerate(heads):
    name = h.group(1)
    end = heads[i + 1].start() if i + 1 < len(heads) else text.index('\n## The pass bar')
    body = text[h.start():end].rstrip() + '\n'
    key = name.split(' ')[0] + ('-blockout' if 'blockout' in name else '')
    if key in ('R2', 'R8'):
        quote = re.search(r'^> (.*)$', body, re.M).group(1)
        (out / (key + '.txt')).write_text(quote)
    else:
        (out / (key + '.txt')).write_text(lead + body + '\nReturn format:\n\n' + fmt)
    print(key, (out / (key + '.txt')).stat().st_size)
