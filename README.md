# ev-cv-3d

3D visualisation of the utility surface `U(x₁, x₂)` using Plotly. Companion to
the 2D EV / CV / DWL visualisation at
[t1mchee/ev-cv](https://github.com/t1mchee/ev-cv).

**Live demo:** https://t1mchee.github.io/ev-cv-3d/

## What it shows

- The utility function as a coloured surface (hill)
- Indifference curves as horizontal level sets lifted onto the surface
- Those same contours projected onto the floor, the "standard" 2D diagram
- Budget constraint as a translucent vertical curtain; its floor trace is the
  usual budget line
- Marshallian optimum A* at the highest IC tangent to the budget, with a stem
  dropped to the floor

## Utility functions

- **Cobb-Douglas:** `U = x₁^α · x₂^(1−α)`
- **CES:** `U = (α·x₁^ρ + (1−α)·x₂^ρ)^(1/ρ)`

## Why a separate project

The 2D EV/CV diagram measures welfare in money units, where CV/CS/EV/DWL are
visible as areas. Utility is ordinal, so a utility surface adds pedagogical
clarity about what indifference curves *are* (contours of a surface) without
directly helping with welfare measurement. Keeping the two views separate
avoids conflating them.

## Develop / deploy

```bash
npm install
npm run dev       # dev server
npm run build     # production bundle
npm run deploy    # build + push dist/ to gh-pages branch
```
