"""Synthesised sound design: whoosh, riser, impact, UI blip, and a film-grain noise texture."""
import os
import numpy as np, wave
from PIL import Image
SR = 48000
VIDEO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
A = os.path.join(VIDEO, 'public', 'audio')
rng = np.random.default_rng(7)
def save(name, y, stereo=True):
    y = np.clip(y, -1, 1)
    if stereo and y.ndim == 1: y = np.stack([y, y], 1)
    with wave.open(f'{A}/{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((y * 32767).astype(np.int16).tobytes())
def lp(x, a):  # one-pole low-pass with time-varying coefficient array a (0..1)
    y = np.zeros_like(x); s = 0.0
    for i in range(len(x)):
        s += a[i] * (x[i] - s); y[i] = s
    return y
# whoosh: band-swept noise, 0.9 s
n = int(0.9 * SR); t = np.linspace(0, 1, n)
x = rng.standard_normal(n)
cut = 0.02 + 0.35 * np.sin(np.pi * t) ** 2
y = lp(x, cut) - lp(x, cut * 0.15)
env = np.sin(np.pi * t) ** 1.5
y = y / np.abs(y).max() * env * 0.7
pan = np.stack([y * (1 - 0.6 * t), y * (0.4 + 0.6 * t)], 1)
save('whoosh', pan)
# riser: 1.6 s rising noise + pitch sweep
n = int(1.6 * SR); t = np.linspace(0, 1, n)
x = rng.standard_normal(n)
nz = lp(x, 0.01 + 0.5 * t ** 2); nz /= np.abs(nz).max()
f = 80 + 900 * t ** 2.2; ph = 2 * np.pi * np.cumsum(f) / SR
tone = np.sin(ph) * 0.35 + np.sin(ph * 1.5) * 0.15
y = (nz * 0.6 + tone) * (t ** 2.5)
y[-int(0.02 * SR):] *= np.linspace(1, 0, int(0.02 * SR))
save('riser', y * 0.8)
# impact: sub boom + click + noise tail, 3 s
n = int(3.0 * SR); t = np.arange(n) / SR
f = 32 + 60 * np.exp(-t * 12); ph = 2 * np.pi * np.cumsum(f) / SR
boom = np.sin(ph) * np.exp(-t * 1.6)
click = rng.standard_normal(n) * np.exp(-t * 60) * 0.5
tail = lp(rng.standard_normal(n), np.full(n, 0.05)) * np.exp(-t * 2.2) * 2.0
y = np.tanh((boom * 1.2 + click + tail) * 1.4) * 0.9
save('impact', y)
# soft hit (smaller impact), 1.2 s
n = int(1.2 * SR); t = np.arange(n) / SR
f = 55 + 80 * np.exp(-t * 18); ph = 2 * np.pi * np.cumsum(f) / SR
y = np.tanh((np.sin(ph) * np.exp(-t * 4) + rng.standard_normal(n) * np.exp(-t * 80) * 0.3) * 1.3) * 0.7
save('hit', y)
# blip: UI tick, 70 ms
n = int(0.07 * SR); t = np.arange(n) / SR
y = np.sin(2 * np.pi * 1650 * t) * np.exp(-t * 70) * 0.35 + np.sin(2 * np.pi * 3300 * t) * np.exp(-t * 120) * 0.1
save('blip', y)
# grain texture
g = (rng.standard_normal((512, 512)) * 38 + 128).clip(0, 255).astype(np.uint8)
Image.fromarray(g, 'L').save(os.path.join(VIDEO, 'public', 'grain.png'))
print('sfx ok')
