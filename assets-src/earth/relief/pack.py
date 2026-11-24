import sys
import numpy as np


def pack(a):
    flat = np.ascontiguousarray(a, '<f4').ravel()
    on = np.concatenate(([0], (flat != 0).astype(np.int8), [0]))
    edge = np.diff(on)
    start = np.flatnonzero(edge == 1)
    end = np.flatnonzero(edge == -1)
    runs = np.stack([start, end - start], 1).astype('<u4')
    values = np.concatenate([flat[s:e] for s, e in zip(start, end)]) if len(start) else np.zeros(0, '<f4')
    return np.array([len(start)], '<u4').tobytes() + runs.tobytes() + values.astype('<f4').tobytes()


def unpack(path, shape):
    raw = open(path, 'rb').read()
    n = int(np.frombuffer(raw, '<u4', 1)[0])
    runs = np.frombuffer(raw, '<u4', 2 * n, 4).reshape(n, 2)
    values = np.frombuffer(raw, '<f4', offset=4 + 8 * n)
    out = np.zeros(int(shape[0]) * int(shape[1]), '<f4')
    at = 0
    for s, k in runs:
        out[s:s + k] = values[at:at + k]
        at += int(k)
    return out.reshape(shape)


def write(path, a):
    open(path, 'wb').write(pack(a))


if __name__ == '__main__':
    h, w = int(sys.argv[1]), int(sys.argv[2])
    for p in sys.argv[3:]:
        a = np.fromfile(p, '<f4').reshape(h, w)
        write(p, a)
        assert np.array_equal(unpack(p, (h, w)), a)
        print(p, a.nbytes, 'to', len(pack(a)), 'bytes, values kept bit for bit')
