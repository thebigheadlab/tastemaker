# DESIGN.md

Generated from 64 Tastemaker swipes (54 liked, 10 noped, 2026-10-25). Product names say where a choice comes from; they are references, not brands to copy.

## Taste summary

You like **friendly precision**: interfaces as organized as Linear, Vercel and Stripe, with the warmth and color of Headspace, Duolingo, Monzo and Revolut. Color has a job, corners are rounded, depth is subtle, and the type is clean sans with serif saved for long reading (Substack, Reader, Medium). You pass on "statement" aesthetics: dot-matrix and spec-sheet minimalism (Nothing, Teenage Engineering), giant condensed display type (Nike), sharp corners, and red-led palettes.

## Principles

1. **Clarity first, then charm.** Get the structure right (Linear issue list, Stripe checkout) before adding personality. *Why:* you liked dense tools as much as playful apps, but only when they read cleanly.
2. **Color means something.** One confident accent (indigo or green) for actions and state, plus a few supporting hues for categories. *Why:* vivid and balanced palettes scored well above muted; mono-only scored lower.
3. **Soft geometry.** Radius 8–16px on surfaces and full pills only for chips and tags. *Why:* round and soft corners scored highest, and sharp corners scored lowest.
4. **Depth from light, not lines.** Use quiet shadows and tonal surfaces before hairlines. *Why:* subtle and layered elevation beat flat, and "no border" beat hairline.
5. **Playful where it rewards.** Celebrations, empty states and progress (Duolingo streak, Headspace) get illustration and motion. Work surfaces stay calm.
6. **Serif for reading only.** Long-form reading views use a text serif, and the UI chrome stays sans.
7. **No gimmick type.** No dot-matrix, condensed display or all-caps shouting. *Why:* display type averaged −0.5 and brutalist −1.0.

## Layout and density

- Use 8px spacing steps. Work views are compact (rows 32–36px, as in Linear or Superhuman). Consumer and marketing views are airy (sections padded 64–96px, as in Framer or Headspace).
- App shell: a 240px sidebar, a content column, and an optional inspector. Mobile uses a bottom tab bar of 4–5 items and a large title that collapses.
- Keep reading columns to 640–720px.
- Support light and dark equally. Your swipes showed no preference, so design both with the same care.

## Components

| Component | Do |
|---|---|
| Buttons | 36px desktop and 44px mobile, 8px radius (pill on mobile consumer screens). Primary is filled with the accent, secondary is a tonal surface, ghost is for toolbars. |
| Inputs | 36–40px, 8px radius, 1px border at low contrast, and a 3px accent focus ring at 25% opacity. Errors show inline below the field (Stripe Payment Element). |
| Cards | 12–16px radius, surface tone plus a small shadow, 16–20px padding. No border when shadow and tone do the separating. |
| Navigation | Sidebar with icon and label, an active row on a tonal pill, and counts aligned right. Mobile tab bar uses filled icons for the active tab. |
| Lists and tables | Compact rows, status icons over text badges, hover reveals actions, tabular numbers. |
| Toggles and segments | Pill track, soft knob shadow, accent fill when on. |
| Badges and chips | Pill, 20–24px tall, tinted background at about 14% of the hue, and text in the darker hue. |
| Command palette | Center modal with blurred backdrop, grouped results, keyboard hints right-aligned (Linear, Raycast, Superhuman). |
| Modals and sheets | 16px radius, layered shadow. On mobile, use a bottom sheet with a grabber. |
| Charts | Area plus line in the accent, faint grid, emphasized endpoint (Stripe dashboard, Revolut stock). |

## Screens

- **Dashboard:** summary numbers first, then a chart, then a recent activity list (Stripe mobile, Vercel projects).
- **Work list:** grouped by status with a sticky group header and inline metadata (Linear, Superhuman split inbox).
- **Mobile home:** big balance or greeting, round quick actions, cards below (Revolut, Monzo, Headspace).
- **Checkout and forms:** split summary and form, one primary button, inline validation (Stripe Checkout).
- **Marketing hero:** dark or soft-gradient background, a tight sans headline, product UI just below the fold (Framer, Resend).
- **Reading:** serif column, generous leading, highlights in soft yellow (Reader, Substack).
- **Celebration and progress:** full-color takeover, friendly illustration, one big number (Duolingo streak, Spotify Wrapped).

## Do and don't

| Do | Don't |
|---|---|
| Rounded 8–16px surfaces | Sharp 0px corners |
| An indigo or green accent with supporting category hues | A red-led brand palette (use red for errors only) |
| Subtle shadows and tonal layers | Heavy outlines on everything |
| Clean grotesk or geometric sans for UI | Dot-matrix, condensed or decorative display faces |
| Serif for long reading | Serif in buttons and nav |
| Playful illustration in moments of delight | Grain textures and spec-sheet styling |
| Dense but legible work views | Cramped type below 12px |
