"""put_table.py KEYS TABLE.json: puts a table of numbers into src/stops/saturn/skim.json with the layout of the
file kept (one number a line), nothing else touched.

KEYS is the way to the table, the keys joined by dots, the last one the table's own key: light.grade.radial.gain,
light.grade.radial.fine.gain or light.tone.gain. TABLE.json holds the table itself or an object with the table
under the key gain. The table is a list of rows of numbers or a plain list of numbers, as the one in the file is,
and must have as many entries as the one in the file. Run it from the repo's root."""
import sys, json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
SKIM = ROOT / 'src/stops/saturn/skim.json'


def put(keys, table):
    text = SKIM.read_text()
    at = 0
    for key in keys[:-1]:
        at = text.index('"' + key + '": {', at)
    at = text.index('"' + keys[-1] + '": [', at)
    start = at + len('"' + keys[-1] + '": ')
    depth, end = 0, None
    for p in range(start, len(text)):
        if text[p] == '[':
            depth += 1
        elif text[p] == ']':
            depth -= 1
            if depth == 0:
                end = p + 1
                break
    old = json.loads(text[start:end])
    assert len(old) == len(table), (len(old), len(table))
    pad = ' ' * (at - (text.rfind('\n', 0, at) + 1))
    flat = not isinstance(old[0], list)
    assert flat == (not isinstance(table[0], list))
    if flat:
        rows = [pad + '  ' + repr(float(v)) for v in table]
    else:
        rows = [pad + '  [\n' + ',\n'.join(pad + '    ' + repr(float(v)) for v in row) + '\n' + pad + '  ]' for row in table]
    SKIM.write_text(text[:start] + '[\n' + ',\n'.join(rows) + '\n' + pad + ']' + text[end:])
    again = json.loads(SKIM.read_text())
    for key in keys:
        again = again[key]
    assert again == ([float(v) for v in table] if flat else [[float(v) for v in row] for row in table])
    return len(table)


if __name__ == '__main__':
    table = json.loads(Path(sys.argv[2]).read_text())
    if isinstance(table, dict):
        table = table['gain']
    print('written', put(sys.argv[1].split('.'), table), 'rows at', sys.argv[1])
