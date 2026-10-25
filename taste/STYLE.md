# STYLE.md

The visual style reference, built from your Tastemaker swipes (2026-10-25). Values are harmonized from the cards you liked: Linear, Vercel, Stripe, Revolut, Monzo, Headspace, Duolingo, Craft and Superhuman.

## Color

### Light

| Role | Hex | Use |
|---|---|---|
| bg | `#FBFBFD` | App background |
| surface | `#FFFFFF` | Cards, sheets, inputs |
| surface-2 | `#F3F3F7` | Tonal fills, secondary buttons, selected rows |
| text | `#16161D` | Primary text |
| muted | `#6B6B78` | Secondary text, icons |
| line | `#E6E6EC` | Dividers, only where tone can't separate |
| accent | `#5B57F5` | Primary actions, focus, selection (Craft / Revolut indigo) |
| on-accent | `#FFFFFF` | Text on accent |
| success | `#22A35B` | Positive state (Duolingo / Supabase green) |
| warning | `#F5A524` | Pending, caution |
| danger | `#E5484D` | Errors and destructive actions only |
| highlight | `#FFE58A` | Reading highlights |

### Dark

| Role | Hex | Use |
|---|---|---|
| bg | `#0E0E13` | App background |
| surface | `#17171F` | Cards, sheets |
| surface-2 | `#20202B` | Tonal fills, selected rows |
| text | `#EDEDF2` | Primary text |
| muted | `#8B8B9A` | Secondary text |
| line | `#2A2A36` | Dividers |
| accent | `#7C78FF` | Primary actions (lifted for contrast) |
| on-accent | `#0E0E13` | Text on accent |
| success | `#3CCF7B` | |
| warning | `#F7B955` | |
| danger | `#FF6B6B` | |

Category hues for tags, labels and charts are green `#22A35B`, blue `#3B82F6`, orange `#F47D31`, pink `#E85AAD`, teal `#14B8A6` and yellow `#F0BF00`. Tint backgrounds at 14% and set text in the hue at 70% mixed with the text color.

## Typography

- **UI:** Inter (Google Fonts), fallback `ui-sans-serif, system-ui, -apple-system, sans-serif`. Alternates you liked are Geist (Vercel), DM Sans (Monzo) and Figtree (Headspace).
- **Friendly display (consumer screens only):** Figtree 700–800, or Nunito 800 for playful moments.
- **Reading serif:** Newsreader or Source Serif 4, fallback `Georgia, serif`.
- **Mono:** Geist Mono or JetBrains Mono, for code, IDs and keyboard hints.
- Scale ratio 1.25 (moderate). Sizes in px: 12 · 14 · 16 · 20 · 24 · 32 (and 48 for marketing heroes).
- Weights: 400 body, 500 UI labels, 600 headings, 700 numbers and heroes.
- Letter-spacing: −0.02em at 24px and up, 0 for body, +0.04em for small uppercase labels.
- Line height: 1.5 body, 1.25 headings, 1.65 reading serif.

## Spacing

- 4px base: 4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 96.
- Control heights: 28 (compact toolbar) · 36 (desktop) · 44 (mobile) · 52 (mobile primary CTA).
- Row heights: 32–36 compact lists, 56–64 mobile list rows.

## Shape

- Radius: 4 (tiny chips, kbd) · 8 (buttons, inputs) · 12 (cards) · 16 (sheets, modals) · 24 (mobile hero cards) · 999 (pills, avatars, toggles).

## Depth

- `sm`: `0 1px 2px rgba(16,16,29,.06), 0 1px 3px rgba(16,16,29,.08)` for cards at rest.
- `md`: `0 4px 12px rgba(16,16,29,.08)` for hover and dropdowns.
- `lg`: `0 24px 48px -12px rgba(16,16,29,.25), 0 8px 16px rgba(16,16,29,.08)` for modals and command palettes.
- In dark mode, swap shadows for one step lighter surfaces plus a 1px `rgba(255,255,255,.06)` inner edge.
- Borders: 1px only where needed. Never 2px except on the focus ring.

## Ornament and texture

- Soft radial glows behind heroes (Framer, Revolut), at most two per screen.
- Flat friendly illustration for empty states and celebrations: round shapes, warm palette, simple faces (Headspace, Duolingo).
- No grain, dot-matrix or technical-drawing styling.

## Motion

- Durations: 120ms (hover, press), 200ms (menus, toggles), 320ms (sheets, page transitions), 600ms (celebrations).
- Easing: `cubic-bezier(.2,.8,.2,1)` for entering, `cubic-bezier(.4,0,1,1)` for leaving, and a spring for celebratory pops.
- Press feedback is a 0.97 scale. Respect reduced motion.

## Imagery and iconography

- Icons: 1.5–1.75px stroke, 16px on desktop and 20–24px on mobile, rounded caps. Filled variants only for the active tab.
- Avatars: circles with initials on tinted hues.
- Product imagery: real UI over stock photos. Gradients come from the accent family.

## Voice

- Plain and warm. Say what happened: "Payment sent", "Saved to your account".
- Short labels that start with a verb on buttons. Errors say how to fix the problem.
- A light touch of personality in empty states and celebrations, never in errors.
