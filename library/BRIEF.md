# Tastemaker card brief

Tastemaker is a personal "Tinder for design" app. The user swipes on cards (like / love / nope) and their swipes become a taste profile that generates DESIGN.md and STYLE.md. The current deck feels repetitive: the same few templates recolored. Your job is to replace it with a rich, diverse library of **components and screens modeled on real, well-designed shipped products**.

## What a card is

A card is one self-contained HTML file that renders a single UI component or a full screen, recreated faithfully in the visual language of a real product. The goal is that someone who knows the product would recognize the style at a glance: its type, density, color, radius, iconography, motion cues, copy tone, layout habits.

- **Screens**: a full app or web screen (dashboard, issue list, inbox, checkout, player, onboarding, settings, landing hero, pricing, profile, editor, chat, feed, map, booking flow…).
- **Components**: one component shown in context, with a couple of states where natural (command palette, kanban card, toast stack, date picker, search bar, sidebar, data table, comment thread, tab bar, media controls, pricing tier, empty state, notification, form, modal, stepper, file upload, avatar group, chart widget…).

Think beyond the obvious. Each product should show what is *distinctive* about it, not a generic layout in its colors.

## Each card = two files in your folder

`<id>.html` and `<id>.json`. Use id format `<product-slug>-<short-name>`, e.g. `linear-issue-list`, `stripe-checkout`.

```json
{
  "id": "linear-issue-list",
  "kind": "screen",                  // "screen" | "component"
  "subtype": "issue list",           // free text, short, lower case
  "title": "Issue list",             // short human label (no product name needed)
  "inspiredBy": "Linear",            // the real product
  "platform": "web",                 // "web" | "mobile"
  "viewport": { "w": 1280, "h": 800 },
  "tags": { ... },                   // see taxonomy below; fill every dimension that applies
  "notes": "One sentence on what is characteristic here."
}
```

Viewports: desktop screens `1280×800`; mobile screens `390×844`; components `480×600` (or `600×480` if the component is wide). Content MUST fit the viewport exactly: no page scrolling, nothing cut off at the bottom, no horizontal overflow. Design to the frame.

## Taxonomy (tags)

Use only these values. Tag what the card actually expresses.

- colorMode: light | dark
- temperature: warm | neutral | cool
- saturation: muted | balanced | vivid
- contrast: soft | medium | high
- accentHue: red | orange | yellow | green | teal | blue | indigo | purple | pink | mono
- typeStyle: geometric | grotesk | humanist | serif | mono | display
- typeScale: restrained | moderate | dramatic
- density: compact | comfortable | airy
- radius: sharp | soft | round | pill
- elevation: flat | subtle | layered
- border: none | hairline | bold
- ornament: minimal | textured | expressive
- mood: calm | playful | serious | luxurious | technical | editorial | brutalist

## Hard rules

1. **No `<script>`.** Static HTML + CSS only. CSS animation is fine but keep the resting frame complete.
2. **No external resources** except Google Fonts stylesheets (`https://fonts.googleapis.com/css2?...`). No images from the web, no icon CDNs. Draw icons as inline SVG; make imagery with CSS gradients, shapes, or inline SVG illustration. Avatars: colored circles with initials or simple SVG faces.
3. **No real logos or trademarked wordmarks.** Use the product's *style*, not its brand. Use a plausible fictional product/company name in visible text (e.g. a Linear-style app called "Arcline"). Content is realistic and specific (real-sounding issue titles, prices, song names, people), never lorem ipsum.
4. Fonts: use the Google Font closest to the product's real typeface (Inter for Linear/Vercel-ish Geist, `Geist` and `Geist Mono` exist on Google Fonts; SF-like → Inter; Circular-like → "Figtree" or "Plus Jakarta Sans"; Airbnb Cereal-like → "Nunito Sans"; Notion → Inter + "Lora"/serif options; Duolingo → "Nunito"; etc.). Always give a fallback stack.
5. Set `html,body{margin:0;height:100%}` and an explicit body background. Include `<meta charset="utf-8">`.
6. Quality bar: pixel-careful. Consistent spacing scale, real alignment, believable data, crisp 1px hairlines, correct icon weight. It should look like a screenshot of the real thing, not a wireframe.
7. Diversity: across your products vary platform (web and mobile), light and dark, density, and subtype. Don't make the same screen type twice for different products unless the product's take on it is the point.

## Check your work

After writing cards run:

```
node /home/claude/design-tinder/library/check.cjs <your folder>
```

It validates the JSON, flags scripts/external URLs, overflow and clipped text, and renders PNGs to `<your folder>/_renders/`. **Look at the PNGs** (Read tool shows images) and fix anything that looks off: overflow, cramped spacing, broken icons, fonts not loading, empty areas, unrealistic content. Iterate until every card passes and looks like the real product. Fix, don't delete, unless a card can't be saved.

## Deliver

When done, reply with: the list of card ids, and for each product one line on what you captured. Keep it short.
