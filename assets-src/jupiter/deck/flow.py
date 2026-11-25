import json
import os

import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
STOP = os.path.join(HERE, '..', '..', '..', 'src', 'stops', 'jupiter')


def load():
    deck = json.load(open(os.path.join(STOP, 'deck.json')))
    place = json.load(open(os.path.join(STOP, 'place.json')))
    return deck, place


def jet(place):
    n = np.array(place['solved']['n'])
    east = np.array([n[2], 0.0, -n[0]])
    east /= np.linalg.norm(east)
    j = np.array([east @ np.array(place['solved']['e']), east @ np.array(place['solved']['u'])])
    return j / np.linalg.norm(j)


def step(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1)
    return t * t * (3 - 2 * t), 6 * t * (1 - t) / (b - a)


class Flow:
    def __init__(self, deck=None, place=None, speed=None):
        if deck is None:
            deck, place = load()
        f = deck['life']['flow']
        self.f = f
        self.centre = np.array(deck['life']['storm']['centre'], np.float64)
        self.v = f['unitsPerSecond'] if speed is None else speed
        self.a = f['scaleUnits']
        self.east = jet(place)
        self.north = np.array([-self.east[1], self.east[0]])
        self.u = f['jets']['share'] * self.v
        self.k = 2 * np.pi / f['jets']['acrossUnits']
        self.peak = 1.5 * 3 ** -0.25 * self.v / self.a

    def jets(self, eta):
        return -self.u * np.sin(self.k * eta)

    def velocity(self, x, y):
        f = self.f
        ox = x - self.centre[0]
        oy = y - self.centre[1]
        r2 = ox * ox + oy * oy
        r = np.sqrt(r2)
        s2 = r2 / (self.a * self.a)
        fade, _ = step(f['fadeUnits'][0], f['fadeUnits'][1], r)
        spin = self.v * 2 * r / (self.a * self.a) / (1 + s2 * s2) * (1 - fade)
        eta = ox * self.north[0] + oy * self.north[1]
        m, dm = step(f['jets']['partUnits'][0], f['jets']['partUnits'][1], r)
        psi = self.u / self.k * (1 - np.cos(self.k * eta))
        spin = spin + psi * dm / np.maximum(r, 1e-9)
        along = m * self.jets(eta)
        vx = -spin * oy + along * self.east[0]
        vy = spin * ox + along * self.east[1]
        for e in f['eddies']:
            ex = x - e['centre'][0]
            ey = y - e['centre'][1]
            q2 = ex * ex + ey * ey
            q = q2 / (e['scaleUnits'] * e['scaleUnits'])
            gone, _ = step(e['fadeUnits'][0], e['fadeUnits'][1], np.sqrt(q2))
            w = e['share'] * self.v * 2 * np.sqrt(q2) / (e['scaleUnits'] * e['scaleUnits']) / (1 + q * q) * (1 - gone)
            vx = vx - w * ey
            vy = vy + w * ex
        return vx, vy

    def carried(self, x, y, t):
        vx, vy = self.velocity(x, y)
        mx, my = self.velocity(x - 0.5 * t * vx, y - 0.5 * t * vy)
        return x - t * mx, y - t * my

    def back(self, x, y, seconds, dt):
        n = max(int(round(seconds / dt)), 1)
        h = seconds / n
        for _ in range(n):
            k1 = self.velocity(x, y)
            k2 = self.velocity(x - 0.5 * h * k1[0], y - 0.5 * h * k1[1])
            k3 = self.velocity(x - 0.5 * h * k2[0], y - 0.5 * h * k2[1])
            k4 = self.velocity(x - h * k3[0], y - h * k3[1])
            x = x - h / 6 * (k1[0] + 2 * k2[0] + 2 * k3[0] + k4[0])
            y = y - h / 6 * (k1[1] + 2 * k2[1] + 2 * k3[1] + k4[1])
        return x, y


if __name__ == '__main__':
    fl = Flow()
    n = 1024
    span = 14.0
    xs = fl.centre[0] + (np.arange(n) + 0.5 - n / 2) * (2 * span / n)
    ys = fl.centre[1] + (np.arange(n) + 0.5 - n / 2) * (2 * span / n)
    gx, gy = np.meshgrid(xs, ys)
    vx, vy = fl.velocity(gx, gy)
    h = 1e-4
    div = (fl.velocity(gx + h, gy)[0] - fl.velocity(gx - h, gy)[0] + fl.velocity(gx, gy + h)[1] - fl.velocity(gx, gy - h)[1]) / (2 * h)
    speed = np.hypot(vx, vy)
    r = np.hypot(gx - fl.centre[0], gy - fl.centre[1])
    print('east', fl.east.round(4), 'north', fl.north.round(4))
    print('V', fl.v, 'peak turn deg/s', round(float(np.degrees(fl.peak)), 4))
    print('largest speed over V', round(float(speed.max() / fl.v), 4), 'at r', round(float(r.flat[speed.argmax()]), 2))
    print('largest divergence', float(np.abs(div).max()), 'against largest shear', float(np.abs(np.gradient(vx, 2 * span / n, axis=0)).max()))
    for lo, hi in [(0, 0.5), (0.5, 0.9), (0.9, 1.6), (1.6, 2.5), (2.5, 3.75), (3.75, 5), (5, 8), (8, 14)]:
        m = (r >= lo) & (r < hi)
        print('r', lo, hi, 'speed over V: mean', round(float(speed[m].mean() / fl.v), 3), 'most', round(float(speed[m].max() / fl.v), 3))
