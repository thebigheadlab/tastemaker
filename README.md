# tastemaker

Swipe through screens and components inspired by real products. Your votes become a taste profile and generate `DESIGN.md`, `STYLE.md`, `tokens.json` and `swipes.json` for your next build.

It is a static web page. There are no accounts, no servers and no AI calls: fixed rules turn votes into files, in your browser. Your votes are saved in this browser on this device only.

## Use it

1. Open the page. Swipe a card, or use the buttons or keys: right or like, left for nope, up for love, down to skip, backspace to undo. Tap a card to see it full size.
2. **Your taste** shows what your votes add up to, per trait.
3. **Export** shows the four files. Copy one, save it, or save all. The same votes always give the same files.
4. Under **Your data**: download a backup, restore one on another device, or clear your swipes. Clearing site data in your browser also erases your swipes, so keep a backup.

How votes become files:

- love counts +2, like +1, nope -1, skip nothing.
- A trait comes from votes only when one value has at least two loves or likes and the best average. Ties and thin data use a curated default. One nope never decides anything. A value is listed as something to avoid after two nopes.
- Every value in the files says whether it is "from votes" or a "curated default". Colors, spacing and motion are curated presets that votes choose between, checked to WCAG AA contrast.
- Files record the generator version and the deck version and hash.

Words used here are defined in [CONTEXT.md](CONTEXT.md).

## Build and test

Needs Node 22 or newer. Bun works too.

```sh
bun install          # only needed for the browser tests and library/check.cjs
bun run build        # node library/build-deck.mjs && node app/build.mjs -> dist/index.html
bun run test         # node --test
```

`dist/` is build output and is not committed. Open `dist/index.html` directly or serve the folder; `vercel.json` points a static host at it (not deployed).

Browser tests run when `playwright-core` is installed and a Chromium is on `PATH` or in `CHROMIUM_PATH`; otherwise they are reported as skipped. To refresh expected output after an intended generator change, run `UPDATE_GOLDEN=1 bun run test` and read the diff.

## Layout

- `app/`: the page (`app.html`), the generator, storage and download modules, and the build script.
- `library/`: the cards, the deck build, and `check.cjs` to render a card batch and flag layout problems.
- `seed/taxonomy.json`: the tag dimensions every card uses.
- `test/`: tests and golden output.

## Known limits

- The app page itself loads nothing from outside, and cards still render with fallback fonts offline.
- Card pages request fonts from Google Fonts (`fonts.googleapis.com`) when the device is online, so that provider can see the request. Your swipes are never part of it. A follow-up issue covers bundling or dropping those fonts.
- Votes saved in one browser are not visible in another. Use a backup to move them.

MIT license, see LICENSE.
