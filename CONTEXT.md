# Tastemaker glossary

Words this repo uses on purpose. Use the same word in code, docs and UI.

- **Card**: one design shown for a vote. Either a component or a full screen, drawn in the visual language of a real product. Lives in `library/<batch>/<id>.html` with a `.json` file of tags. Every card has tags from `seed/taxonomy.json` (color mode, corners, density and so on).
- **Deck**: all cards, built into `library/cards.json` and `library/html.json` by `library/build-deck.mjs`. The deck has a version and a content hash. The hash is written into every exported file so output can be traced to the exact deck.
- **Vote**: one verdict on one card: `love` (+2), `like` (+1), `nope` (-1) or `skip` (0, ignored). A card has at most one vote. Undo restores the earlier state.
- **Profile**: what the votes add up to. For each tag dimension (for example Corners) it is the counts per value and the one value, if any, that the votes pick. It is computed, never stored.
- **Trait**: one dimension's decision in a profile. Its value comes either from votes or from a curated default.
- **Curated default**: a fixed value written by hand and contrast-checked, used wherever votes cannot decide: no data, a tie, or too few likes. Colors, spacing and motion are always curated presets; votes only choose between presets.
- **Generator**: `app/generator.mjs`. Pure functions that turn votes, the deck and the taxonomy into `DESIGN.md`, `STYLE.md`, `tokens.json` and `swipes.json`. Same votes, same bytes.
- **Backup**: a JSON file of votes you download and can restore later, on this or another device.
- **This device only**: votes live in the browser's `localStorage`. Nothing is sent anywhere.
- **Pin**: the upstream commit and version the agent workflow is read at. It is written in `AGENTS.md`.
- **Playbook**: a step list in the agent workflow for one kind of task, such as a feature or opening a PR.
- **Stage evidence**: the recorded result for one playbook step: `done` with evidence, `skip: <reason>`, or `n/a: <reason>`.
- **Entry file**: the first upstream file an agent reads. It routes the task to a playbook.
- **Bootstrap file**: a private file outside the repo that names the upstream source. The Coordinator passes its path in the task input.
