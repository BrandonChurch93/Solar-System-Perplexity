import json, sys
a=json.load(open(sys.argv[1])); b=json.load(open(sys.argv[2]))
f=lambda x: ' None ' if x is None else ('%.4f'%x)
ks=a['ks']
print('frame | pattern base, trial | pop base, trial | level step base, trial | level base, trial')
for i,k in enumerate(ks):
    j=b['ks'].index(k)
    pa,pb=a['pattern'][i],b['pattern'][j]
    print('%7.1f | %s%s %s%s %s | %s %s | %s %s | %s %s'%(k/2,f(pa),'*' if pa and pa>0.45 else ' ',f(pb),'*' if pb and pb>0.45 else ' ',b['patternAt'][j],f(a['pop'][i]),f(b['pop'][j]),f(a['levelStep'][i]),f(b['levelStep'][j]),f(a['level'][i]),f(b['level'][j])))
def top(d,key,ab=False):
    v=[((abs(x) if ab else x),k) for x,k in zip(d[key],d['ks']) if x is not None]
    m=max(v); return '%.4f at %s'%(m[0],m[1]/2)
for n,d in (('base',a),('trial',b)):
    print(n,'pattern',top(d,'pattern'),'over',sum(1 for x in d['pattern'] if x is not None and x>0.45),'| pop',top(d,'pop'),'| level step',top(d,'levelStep',True))
