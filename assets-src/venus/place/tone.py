"""The film's tone curve and its inverse, for tools that work on plates in scene values (src/post/chain.ts)."""
import numpy as np

A, B, C, D, E = 2.51, 0.03, 2.43, 0.59, 0.14


def to_linear(v):
    v = np.asarray(v, dtype=np.float64)
    return np.where(v <= 0.04045, v / 12.92, ((v + 0.055) / 1.055) ** 2.4)


def to_display(l):
    l = np.clip(np.asarray(l, dtype=np.float64), 0, 1)
    return np.where(l <= 0.0031308, l * 12.92, 1.055 * l ** (1 / 2.4) - 0.055)


def inverse_filmic(y):
    y = np.clip(y, 0.0, 0.985)
    k = D * y - B
    return (-k - np.sqrt(np.maximum(k * k - 4.0 * (C * y - A) * E * y, 0.0))) / (2.0 * (C * y - A))


def filmic(x):
    x = np.maximum(x, 0.0)
    return np.clip(x * (A * x + B) / (x * (C * x + D) + E), 0.0, 1.0)


def scene(display):
    """Display values 0 to 1 to scene values."""
    return inverse_filmic(to_linear(display))


def display(scene_values):
    return to_display(filmic(scene_values))
