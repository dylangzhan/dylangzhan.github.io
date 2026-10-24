# dylangzhan.github.io

Personal portfolio of **Dinglun (Dylan) Zhang** — Frontend, Full-Stack & AI Engineer.

Live: https://dylangzhan.github.io/

- Zero dependencies, no build step: plain HTML, CSS and vanilla JavaScript.
- Live mini-demos for React, React Native, Next.js and Flutter, an animated AI-agent terminal,
  a ⌘K command palette, a recruiter "30-second summary", and a playable canvas game (Bug Blaster).
- Responsive down to 320px, `prefers-reduced-motion` aware, Open Graph + JSON-LD for sharing and SEO.

## Structure

```
index.html                 # all content
assets/css/style.css       # design tokens + layout
assets/js/main.js          # interactions, demos, game, command palette
assets/img/                # project screenshots + portrait
assets/og.jpg              # 1200×630 social preview
Dinglun_Zhang_Resume.pdf   # linked from the site
```

## Run locally

```bash
python3 -m http.server 5173
```

Then open http://localhost:5173.

## Updating

- Text lives in `index.html`; the 30-second summary is the `#tldr` block near the bottom.
- Replace `Dinglun_Zhang_Resume.pdf` to update the résumé (keep the filename).
- After editing CSS/JS, bump the `?v=` query in `index.html` so browsers fetch the new files.
