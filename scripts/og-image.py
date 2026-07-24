"""
Render the social share card at assets/img/og-image.jpg.

This is the image that shows when the site is pasted into iMessage, Slack,
Facebook or LinkedIn, so it has to carry the palette rather than lag behind it.
Colours here are copied from the @theme block in src/input.css -- if you re-skin
the site, re-run this.

Text is set in the site's own fonts, decompressed from the vendored woff2 files
into a temp directory (Pillow reads TTF/OTF, not woff2).

    pip install pillow fonttools brotli
    python3 scripts/og-image.py
"""

import tempfile
from pathlib import Path

from fontTools import varLib
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from PIL import Image, ImageDraw, ImageFont

W, H = 1200, 630
OUT = Path("assets/img/og-image.jpg")

# From src/input.css @theme
INVERSE = (15, 26, 29)       # --color-inverse
INVERSE_INK = (250, 250, 250)  # --color-inverse-ink
INVERSE_MUTED = (157, 171, 174)  # --color-inverse-muted
SEA = (44, 154, 166)         # --color-sea, decorative only


def load(woff2, size, **axes):
    """woff2 -> statically instanced ttf -> Pillow font.

    Two traps here, both hit while making this card:

    1. Axes must be set explicitly. Google's subsetted Fraunces declares wght
       with a DEFAULT of 900, so just asking for the font gets black weight.

    2. The instance has to be baked by fontTools, not left to FreeType's
       set_variation_by_axes. Interpolating this subset at runtime dropped the
       crossbar off the lowercase e -- "Beth" came out as "Bcth". Instancing
       ahead of time renders identically to the browser.
    """
    f = TTFont(woff2, fontNumber=0)
    if axes and "fvar" in f:
        f = instancer.instantiateVariableFont(f, axes, inplace=True, updateFontNames=False)
    out = Path(tempfile.mkdtemp()) / (Path(woff2).stem + ".ttf")
    f.flavor = None
    f.save(out)
    return ImageFont.truetype(str(out), size)


# opsz stays mid-scale on purpose. Fraunces thins its strokes as opsz climbs,
# and by the top of the axis the crossbar on the lowercase e is a hairline that
# rasterises away at this size -- "Beth" renders as "Bcth". 36 keeps the display
# proportions without losing the glyph.
display = load("assets/fonts/fraunces-latin.woff2", 92, opsz=36, wght=400)
label = load("assets/fonts/inter-latin.woff2", 28, wght=500)
tagline = load("assets/fonts/inter-latin.woff2", 32, wght=400)

im = Image.new("RGB", (W, H), INVERSE)
d = ImageDraw.Draw(im)


def centre(text, font, y, fill, tracking=0):
    """Draw centred at top-edge y, optionally letter-spaced (Pillow has no
    tracking). Returns the bottom of the inked area, so the caller can stack
    by real gaps instead of guessing at line positions."""
    if not tracking:
        box = d.textbbox((0, 0), text, font=font)
        d.text(((W - box[2]) / 2, y), text, font=font, fill=fill)
        return y + box[3]
    widths = [d.textbbox((0, 0), c, font=font)[2] for c in text]
    total = sum(widths) + tracking * (len(text) - 1)
    x, bottom = (W - total) / 2, y
    for c, cw in zip(text, widths):
        d.text((x, y), c, font=font, fill=fill)
        bottom = max(bottom, y + d.textbbox((0, 0), c, font=font)[3])
        x += cw + tracking
    return bottom


# The mark, same geometry as favicon.svg on a 32-unit box, scaled and centred.
MARK_S, MARK_X, MARK_Y, STROKE = 116, W / 2, 150, 7.0
sc = lambda x, y: (MARK_X + (x - 16) / 32 * MARK_S, MARK_Y + (y - 16) / 32 * MARK_S)


def brush(pts, width, fill):
    for x, y in pts:
        d.ellipse([x - width / 2, y - width / 2, x + width / 2, y + width / 2], fill=fill)


def cubic(p0, p1, p2, p3, n=600):
    for i in range(n + 1):
        t, u = i / n, 1 - i / n
        yield (u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0],
               u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1])


brush([sc(16, 6 + 20 * i / 400) for i in range(401)], STROKE, SEA)
for y in (10.5, 16, 21.5):
    brush([sc(x, yy) for x, yy in cubic((11, y), (14.2, y + 1.5), (17.8, y + 1.5), (21, y))], STROKE, SEA)

y = centre("Beth Burgin", display, 262, INVERSE_INK)
y = centre("CERTIFIED ADVANCED ROLFER", label, y + 34, INVERSE_MUTED, tracking=6)
centre("Move. Connect. Integrate.", tagline, y + 30, SEA)

im.save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
print(OUT, (W, H))
