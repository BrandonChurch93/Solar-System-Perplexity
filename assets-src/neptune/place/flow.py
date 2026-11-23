"""The globe's own flows at rest (planet.ts deckDir and cloudDir with the rest values of place.json)."""
import numpy as np


def direction(lon_deg, lat_deg):
    lon, lat = np.radians(lon_deg), np.radians(lat_deg)
    return np.array([np.cos(lat) * np.sin(lon), np.sin(lat), np.cos(lat) * np.cos(lon)])


def turn_about(d, axis, a):
    c, s = np.cos(a)[..., None], np.sin(a)[..., None]
    return d * c + np.cross(axis, d) * s + axis * (d @ axis)[..., None] * (1 - c)


def spin_y(d, a):
    c, s = np.cos(a), np.sin(a)
    return np.stack([c * d[..., 0] - s * d[..., 2], d[..., 1], s * d[..., 0] + c * d[..., 2]], -1)


def storm_turn(d, rest):
    axis = direction(rest['stormLonDeg'], rest['stormLatDeg'])
    ang = np.arccos(np.clip(d @ axis, -1, 1)) / np.radians(rest['stormRadiusDeg'])
    return axis, np.radians(rest['stormTurnDeg']) / (1 + ang ** 4)


def deck_shown(d, rest):
    """Where the deck texel of texture direction d is drawn on the body once the flows rest."""
    axis, a = storm_turn(d, rest)
    return turn_about(d, axis, -a)


def cloud_shown(d, rest):
    """The same for a cloud texel."""
    d1 = deck_shown(d, rest)
    lat = np.arcsin(np.clip(d1[..., 1], -1, 1))
    return spin_y(d1, -np.radians(rest['streamDeg']) * (1 + rest['shear'] * np.sin(lat * rest['shearBands'])))
