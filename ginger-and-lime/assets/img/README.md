# Photos & logo

Drop the supplied image files into this folder using **exactly these
filenames** and they appear across the site automatically. Until a file
exists, the site shows a labelled "Photo coming soon" placeholder instead of
a broken image, so it is safe to deploy before every photo is in place.

| Filename | Where it appears | Suggested crop |
|---|---|---|
| `hero-neon-sign.jpg` | Home page hero background | Landscape, 2000×1200 or wider |
| `prime-rib-panini.jpg` | Home "Sandwiches & Wraps" card, gallery | Portrait or square |
| `poke-bowl-1.jpg` | Home "Bowls" card, gallery | Square |
| `poke-bowl-2.jpg` | Home kitchen strip, Our Story, gallery | Portrait |
| `flatbread-arugula-feta.jpg` | Home kitchen strip, gallery | Landscape |
| `acai-bowl-1.jpg` | Home kitchen strip, gallery | Square |
| `acai-bowl-2.jpg` | Gallery | Portrait |
| `green-smoothie.jpg` | Home "Juices & Smoothies" card, gallery | Square |
| `sandwich-logo-backdrop.jpg` | Home story section, social share image | Portrait |

## Logo

`logo-mark.svg` and `favicon.svg` are **placeholders** drawn in the house
palette. To use the real hand-illustrated logo:

1. Save it here as `logo-mark.svg` (or `logo-mark.png` at 200×200 or larger,
   transparent background) — keep it roughly square so the header lockup and
   the hero both stay balanced.
2. If you use a `.png`, search the five HTML files for `logo-mark.svg` and
   change the extension.

The script wordmark next to the mark is set in live text (Fraunces italic),
not an image, so it stays crisp and searchable. If the real wordmark artwork
should be used instead, replace the `.brand__name` markup in each page's
header with an `<img>` and give it an `alt` of `Ginger & Lime`.

## Preparing photos

- Resize the long edge to about 1600px and export JPEG at ~80% quality —
  large phone photos will slow the site down on mobile data.
- Photos are cropped to fit their frame, so keep the food centred.
