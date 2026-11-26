import math, sys
def old(h): return 1 - math.exp(-max(h,0)/0.3)
def law(h, base=(0.016,0.25), span=(0.05,1.4), ease=(0.8,0.6)):
    up = max(h,0)
    over = math.log(max(up, base[0])/base[0])
    held = min(up, base[0]) * math.exp(base[1]*(1-math.exp(-over/base[1])))
    low = 1 - math.exp(-held/0.3)
    rng = math.log(span[1]/span[0])
    x = min(math.log(max(up, span[0])/span[0])/rng, 1)
    e0 = ease[0]/rng; e1 = ease[1]/rng; m = 1/(1-(e0+e1)/2)
    s = m*x*x/(2*e0) if x < e0 else (m*(x-e0/2) if x < 1-e1 else 1 - m*(1-x)*(1-x)/(2*e1))
    return low + (1-low)*s
H = {4137:1.598,4150:0.502,4155:0.320,4160:0.204,4164:0.142,4168:0.099,4172:0.069,4176:0.04836,4180:0.03396,4186:0.02233,4190:0.01843,4195:0.016,4200:0.01544,4290:0.0152,4385:0.01607,4390:0.01891,4395:0.02527,4399:0.03492,4403:0.0522,4407:0.0807,4410:0.1119,4413:0.1552,4416:0.2151,4418:0.2674,4422:0.4132,4428:0.7938,4432:1.2266,4436:1.8615}
for f,h in H.items(): print(f, '%.5f'%h, 'name %.4f'%old(h), 'C %.4f'%law(h), 'same' if old(h)==law(h) else '')
best = 0; bo = 0
x = math.log(0.01)
while x < math.log(5):
    d = 1e-4
    sl = (law(math.exp(x+d)) - law(math.exp(x)))/d; so = (old(math.exp(x+d)) - old(math.exp(x)))/d
    if sl > best: best = sl; bx = math.exp(x)
    if so > bo: bo = so
    if sl < -1e-9: print('falls at', math.exp(x))
    x += 1e-3
print('largest slope per ln h: C %.4f at h %.3f, name %.4f' % (best, bx, bo))
