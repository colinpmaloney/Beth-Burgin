# Images

Drop real photos here. The site picks them up by filename, so there's no code to change.

| File                 | Used for                          | Suggested size            |
| -------------------- | --------------------------------- | ------------------------- |
| `beth.webp`          | Hero portrait                     | square, about 1000px        |
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
