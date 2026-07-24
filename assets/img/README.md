# Images

Drop real photos here. The site picks them up by filename, so there's no code to change.

| File                 | Used for                          | Suggested size            |
| -------------------- | --------------------------------- | ------------------------- |
| `beth.webp`          | Hero portrait                     | square, about 1000px        |
| `hero-bg.webp`       | Hero background texture           | 1600 × 900                |
| `og-image.jpg`       | Link preview when shared          | 1200 × 630                |
| `apple-touch-icon.png` | iOS home-screen icon            | 180 × 180                 |
| `favicon.svg`        | Browser tab icon (already present) | n/a                       |

The hero frame is square and crops from the top, so a headshot with the face in
the upper half sits well. The build reads the filename from the `src` in
`index.html`, so renaming the photo only means changing it there. If the file it
points at is missing, the build drops the `<img>` and shows a styled placeholder
instead, so the page never 404s or shows a broken image.

Keep JPEGs under about 300 KB. [squoosh.app](https://squoosh.app) is an easy way to
shrink them before committing.

## hero-bg.webp

Generated, not photographed — `python3 scripts/hero-texture.py` writes it. Any
image can replace it; the CSS desaturates, fades and masks whatever is there,
and the `<img>` removes itself if the file is gone.

It only appears at 1024px and wider, and only in the empty column beside the
portrait. That isn't a stylistic choice: the hero's body copy is grey
(`--color-muted`), which needs the paper behind it to stay lighter than about
`#e0e0e0` to clear WCAG AA. Below 1024px the copy runs the full width and there
is nowhere left for a picture to sit, so it is switched off there. Both knobs
(`--hero-photo` and the masks) are in `src/input.css`.

A photograph strong enough to actually read as a photograph needs the opposite
treatment — light text over a dark image — which is a different hero, not a
larger number in this one.
