import re
def sub(path, a, b, n=1):
    s = open(path).read()
    assert s.count(a) == n, (path, a, s.count(a))
    open(path, 'w').write(s.replace(a, b))
L = 'src/stops/uranus/look.ts'; S = 'src/stops/uranus/set.ts'
