import numpy as np


def hash2(ix, iy, seed):
    h = ix.astype(np.uint32) * np.uint32(0x9E3779B1) ^ iy.astype(np.uint32) * np.uint32(0x85EBCA77) ^ np.uint32((seed * 0xC2B2AE3D) & 0xFFFFFFFF)
    h ^= h >> np.uint32(15)
    h *= np.uint32(0x2C1B3C6D)
    h ^= h >> np.uint32(12)
    h *= np.uint32(0x297A2D39)
    h ^= h >> np.uint32(15)
    return h.astype(np.float32) * np.float32(1.0 / 4294967296.0)


def value(x, y, seed=0):
    x0 = np.floor(x)
    y0 = np.floor(y)
    fx = (x - x0).astype(np.float32)
    fy = (y - y0).astype(np.float32)
    ix = x0.astype(np.int64)
    iy = y0.astype(np.int64)
    ux = fx * fx * fx * (fx * (fx * 6 - 15) + 10)
    uy = fy * fy * fy * (fy * (fy * 6 - 15) + 10)
    a = hash2(ix, iy, seed)
    b = hash2(ix + 1, iy, seed)
    c = hash2(ix, iy + 1, seed)
    d = hash2(ix + 1, iy + 1, seed)
    return (a + (b - a) * ux) * (1 - uy) + (c + (d - c) * ux) * uy


def fbm(x, y, wave, octaves, seed=0, gain=0.5, lac=2.0, shape='plain', floor=0.0):
    out = np.zeros(np.broadcast(x, y).shape, np.float32)
    amp = 1.0
    total = 0.0
    c, s = np.cos(0.6), np.sin(0.6)
    for k in range(octaves):
        if wave >= floor:
            n = value(x / wave + 17.3 * k, y / wave - 9.1 * k, seed + k)
            if shape == 'billow':
                n = np.abs(2 * n - 1)
            elif shape == 'ridge':
                n = 1 - np.abs(2 * n - 1)
            out += amp * n
        total += amp
        amp *= gain
        wave /= lac
        x, y = c * x - s * y, s * x + c * y
    return out / total


def cells(x, y, seed=0):
    x0 = np.floor(x).astype(np.int64)
    y0 = np.floor(y).astype(np.int64)
    best = np.full(np.broadcast(x, y).shape, 9.0, np.float32)
    second = np.full_like(best, 9.0)
    for dy in (-1, 0, 1):
        for dx in (-1, 0, 1):
            cx = x0 + dx
            cy = y0 + dy
            px = cx + hash2(cx, cy, seed)
            py = cy + hash2(cx, cy, seed + 7919)
            d = ((px - x) ** 2 + (py - y) ** 2).astype(np.float32)
            second = np.where(d < best, best, np.minimum(second, d))
            best = np.minimum(best, d)
    return np.sqrt(best), np.sqrt(second)
