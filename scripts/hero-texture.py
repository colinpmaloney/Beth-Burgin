"""
Generate the hero background texture at assets/img/hero-bg.webp.

Fractal value noise, warped into soft diagonal bands, lit from the upper left.
Reads as light falling across plaster or draped linen — photographic in feel
without being a photograph of anything, which is the point: the hero already
has Beth's portrait in it, and a second recognisable subject behind the
headline fights with it.

Deterministic (fixed seed), so re-running gives byte-identical output.

    pip install pillow numpy
    python3 scripts/hero-texture.py
"""

import numpy as np
from PIL import Image, ImageFilter

W, H = 1600, 900
OUT = "assets/img/hero-bg.webp"
rng = np.random.default_rng(20260724)


def octave(w, h, cells):
    """One octave of value noise, bilinearly upsampled to w x h."""
    grid = rng.random((cells + 1, round(cells * w / h) + 1))
    img = Image.fromarray((grid * 255).astype(np.uint8), "L")
    return np.asarray(img.resize((w, h), Image.BICUBIC), dtype=np.float32) / 255.0


# Stack octaves so large shapes dominate and fine detail only breaks up the
# gradient. Amplitude halves as frequency doubles.
noise = sum(octave(W, H, 2 ** i) * 0.5**i for i in range(1, 6))
noise /= noise.max()

y, x = np.mgrid[0:H, 0:W].astype(np.float32)
u, v = x / W, y / H

# Diagonal bands, phase-shifted by the noise so they drape rather than stripe.
bands = 0.5 + 0.5 * np.sin((u * 2.1 + v * 1.4 + noise * 1.9) * np.pi * 1.6)

# Key light from the upper left, falling off toward the lower right.
light = 1.0 - np.clip((u * 0.55 + v * 0.75) * 0.85, 0.0, 1.0)

# Range runs roughly 0.18 to 1.0. It needs real darks: the browser paints this
# at well under full opacity over a near-white canvas, and a mid-grey-only file
# disappears completely once it lands.
field = 0.18 + 0.55 * light + 0.27 * bands * (0.35 + 0.65 * light)
field = np.clip(field, 0.0, 1.0)

im = Image.fromarray((field * 255).astype(np.uint8), "L")
im = im.filter(ImageFilter.GaussianBlur(radius=6))

# Film grain, so the flat areas don't band once the browser scales the file up.
grain = rng.normal(0.0, 3.2, (H, W))
out = np.clip(np.asarray(im, dtype=np.float32) + grain, 0, 255).astype(np.uint8)

Image.fromarray(out, "L").convert("RGB").save(OUT, "WEBP", quality=76, method=6)
print(OUT, (W, H))
