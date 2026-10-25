import { test } from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import * as G from "../app/generator.mjs";
import { deck, taxonomy, ids, vote } from "./fixtures/mini-deck.mjs";
import { ROOT, ensureDeck } from "./helpers.mjs";

const FILES = ["DESIGN.md", "STYLE.md", "tokens.json", "swipes.json"];

// Exact-output check against test/fixtures/golden. UPDATE_GOLDEN=1 rewrites the files; review the diff before committing.
function golden(name, votes, d = deck) {
  const { files } = G.generate(votes, d, taxonomy);
  for (const f of FILES) {
    const p = join(ROOT, "test/fixtures/golden", name, f);
    if (process.env.UPDATE_GOLDEN) { mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, files[f]); }
    assert.ok(existsSync(p), `missing golden ${name}/${f}; run UPDATE_GOLDEN=1 bun run test`);
    assert.equal(files[f], readFileSync(p, "utf8"), `${name}/${f} differs from golden`);
  }
  return files;
}

const sparse = [vote("a-dark-round", "love"), vote("b-dark-round", "like"), vote("c-dark-sharp", "nope"), vote("d-light-sharp", "nope"), vote("e-light-pill", "skip")];
const ties = [vote("a-dark-round", "like"), vote("b-dark-round", "like"), vote("e-light-pill", "like"), vote("f-light-pill", "like")];

test("golden: empty", () => {
  const f = golden("empty", []);
  assert.match(f["DESIGN.md"], /No cards have been rated yet/);
});
test("golden: all skipped", () => {
  const f = golden("all-skipped", ids.map((id) => vote(id, "skip")));
  assert.match(f["DESIGN.md"], /No cards have been rated yet/);
  assert.equal(JSON.parse(f["swipes.json"]).counts.skipped, 8);
});
test("golden: all negative decides nothing from one dislike, avoids only repeated nopes", () => {
  const f = golden("all-negative", ids.map((id) => vote(id, "nope")));
  const s = JSON.parse(f["swipes.json"]);
  assert.ok(s.traits.every((t) => t.source === "default"));
  assert.ok(s.traits.some((t) => t.avoid.length > 0));
});
test("golden: sparse", () => golden("sparse", sparse));
test("golden: ties", () => {
  const f = golden("ties", ties);
  const s = JSON.parse(f["swipes.json"]);
  assert.deepEqual(s.traits.find((t) => t.dimension === "colorMode").tied, ["light", "dark"].sort((a, b) => taxonomy.dimensions.colorMode.values.indexOf(a) - taxonomy.dimensions.colorMode.values.indexOf(b)));
  assert.equal(s.traits.find((t) => t.dimension === "colorMode").source, "default");
});
test("golden: mixed votes with a font choice", () => {
  const f = golden("mixed", [vote("a-dark-round", "love"), vote("b-dark-round", "love"), vote("c-dark-sharp", "like"), vote("d-light-sharp", "nope"), vote("e-light-pill", "nope"), vote("f-light-pill", "nope"), vote("g-odd-tags", "like"), vote("h-plain", "skip")]);
  assert.match(f["STYLE.md"], /Alpha Sans/);
});

test("weights are love 2, like 1, nope -1, skip 0", () => {
  assert.deepEqual({ ...G.WEIGHTS }, { love: 2, like: 1, nope: -1, skip: 0 });
  const plan = G.buildPlan([vote("a-dark-round", "love"), vote("b-dark-round", "like"), vote("c-dark-sharp", "nope"), vote("d-light-sharp", "skip")], deck, taxonomy);
  assert.equal(plan.counts.sum, 2);
  assert.equal(plan.counts.rated, 3);
  assert.equal(plan.counts.skipped, 1);
});

test("a skip changes nothing about the traits", () => {
  const a = G.buildPlan(sparse.filter((v) => v.verdict !== "skip"), deck, taxonomy);
  const b = G.buildPlan(sparse, deck, taxonomy);
  assert.deepEqual(a.traits, b.traits);
  assert.deepEqual(a.tokens, b.tokens);
});

test("one dislike never decides a trait, two do", () => {
  const one = G.buildPlan([vote("c-dark-sharp", "nope")], deck, taxonomy);
  assert.ok(one.traits.every((t) => t.avoid.length === 0));
  const two = G.buildPlan([vote("c-dark-sharp", "nope"), vote("d-light-sharp", "nope")], deck, taxonomy);
  assert.deepEqual(two.traits.find((t) => t.dimension === "radius").avoid, ["sharp"]);
  assert.equal(two.traits.find((t) => t.dimension === "radius").value, "soft");
});

test("permuting the votes gives identical files", () => {
  const all = sparse.concat([vote("f-light-pill", "like"), vote("g-odd-tags", "love")]);
  const base = G.generate(all, deck, taxonomy).files;
  const perms = [all.slice().reverse(), all.slice(3).concat(all.slice(0, 3)), all.slice().sort((a, b) => (a.verdict < b.verdict ? -1 : 1)), all.filter((_, i) => i % 2 === 0).concat(all.filter((_, i) => i % 2 === 1))];
  for (const p of perms) assert.deepEqual(G.generate(p, deck, taxonomy).files, base);
  assert.deepEqual(G.generate(new Map(all.map((v) => [v.id, v.verdict])), deck, taxonomy).files, base);
});

test("undo and re-rate end in the same files as a fresh vote", () => {
  const log = G.createVoteLog();
  log.rate("a-dark-round", "nope");
  log.rate("b-dark-round", "like");
  assert.equal(log.undo(), "b-dark-round");
  assert.equal(log.undo(), "a-dark-round");
  assert.equal(log.canUndo(), false);
  assert.equal(log.undo(), null);
  log.rate("a-dark-round", "love");
  log.rate("b-dark-round", "like");
  log.rate("a-dark-round", "like"); // re-rate
  log.undo(); // back to love
  assert.equal(log.votes.get("a-dark-round"), "love");
  const fresh = [vote("a-dark-round", "love"), vote("b-dark-round", "like")];
  assert.deepEqual(G.generate(log.toVotes(), deck, taxonomy).files, G.generate(fresh, deck, taxonomy).files);
  assert.throws(() => log.rate("__proto__x!", "love"), TypeError);
  assert.throws(() => log.rate("a-dark-round", "meh"), TypeError);
});

test("invalid entries are ignored with a reason, never counted", () => {
  const raw = [
    vote("a-dark-round", "love"), vote("a-dark-round", "love"), // exact duplicate: one counts
    vote("b-dark-round", "like"), vote("b-dark-round", "nope"), // conflict: neither counts
    vote("nope-not-a-card", "like"), vote("A Bad Id", "like"), vote("c-dark-sharp", "superlike"),
    null, "text", 5, [], { id: 7, verdict: "like" }, { verdict: "like" },
  ];
  const n = G.normalizeVotes(raw, deck);
  assert.deepEqual(n.valid, [{ id: "a-dark-round", verdict: "love", weight: 2 }]);
  assert.deepEqual(n.ignored.map((i) => i.reason).sort(), ["conflicting-duplicate", "dropped-conflict", "duplicate", "invalid-id", "invalid-id", "invalid-id", "invalid-verdict", "malformed-entry", "malformed-entry", "malformed-entry", "malformed-entry", "unknown-card"].sort());
  assert.equal(G.normalizeVotes("not an array", deck).valid.length, 0);
  // Order of the conflicting pair must not matter.
  const a = G.normalizeVotes([vote("b-dark-round", "like"), vote("b-dark-round", "nope")], deck);
  const b = G.normalizeVotes([vote("b-dark-round", "nope"), vote("b-dark-round", "like")], deck);
  assert.deepEqual(a.valid, b.valid);
});

test("cards with unknown tag values or no tags still work", () => {
  const plan = G.buildPlan([vote("g-odd-tags", "love"), vote("h-plain", "love")], deck, taxonomy);
  assert.ok(plan.traits.every((t) => t.status === "insufficient" || taxonomy.dimensions[t.dimension].values.includes(t.value)));
});

test("tokens.json: structure and source labels", () => {
  const { files } = G.generate(sparse.concat(ties.slice(2)), deck, taxonomy);
  const t = JSON.parse(files["tokens.json"]);
  const leaves = [];
  (function walk(o, path) {
    if (o && typeof o === "object" && "$value" in o) { leaves.push([path, o]); return; }
    for (const [k, v] of Object.entries(o)) if (!k.startsWith("$")) walk(v, path + "." + k);
  })(t, "");
  assert.ok(leaves.length > 60);
  for (const [path, leaf] of leaves) {
    assert.ok(typeof leaf.$type === "string", path);
    assert.ok(["votes", "default"].includes(leaf.$extensions.tastemaker.source), path);
    assert.ok(typeof leaf.$extensions.tastemaker.basis === "string", path);
    if (leaf.$type === "color") assert.match(leaf.$value, /^#[0-9a-f]{6}$/, path);
  }
  assert.deepEqual(t.$extensions.tastemaker.generator, { name: "tastemaker-generator", version: G.GENERATOR_VERSION });
  assert.deepEqual(t.$extensions.tastemaker.deck, { version: 2, hash: "0123456789abcdef", cardCount: 8 });
  // sizes must rise
  const sizes = Object.values(t.font.size).map((s) => parseInt(s.$value));
  assert.deepEqual(sizes, sizes.slice().sort((a, b) => a - b));
});

test("swipes.json: schema", () => {
  const s = JSON.parse(G.generate(sparse, deck, taxonomy).files["swipes.json"]);
  assert.deepEqual(Object.keys(s), ["generator", "deck", "counts", "weights", "votes", "ignored", "traits"]);
  assert.deepEqual(s.votes.map((v) => v.id), s.votes.map((v) => v.id).slice().sort());
  assert.equal(s.traits.length, Object.keys(taxonomy.dimensions).length);
  assert.ok(!JSON.stringify(s).match(/\d{4}-\d{2}-\d{2}T/), "no timestamps");
});

test("the curated palette passes WCAG AA for every text pair, in every accent", () => {
  const AA = 4.5;
  for (const m of ["light", "dark"]) {
    const c = G.BASE_COLORS[m];
    for (const text of ["text", "muted", "success", "warning", "danger"]) for (const bg of ["bg", "surface"]) {
      assert.ok(G.contrastRatio(c[text], c[bg]) >= AA, `${m} ${text} on ${bg}: ${G.contrastRatio(c[text], c[bg]).toFixed(2)}`);
    }
    for (const [hue, a] of Object.entries(G.ACCENTS)) {
      assert.ok(G.contrastRatio(a[m], c.bg) >= AA, `${m} accent ${hue} on bg`);
      assert.ok(G.contrastRatio(a[m], c.surface) >= AA, `${m} accent ${hue} on surface`);
      assert.ok(G.contrastRatio(G.ON_ACCENT[m], a[m]) >= AA, `${m} on-accent over ${hue}`);
    }
  }
  assert.equal(G.contrastRatio("#000000", "#ffffff").toFixed(2), "21.00");
});

test("every taxonomy value has a curated mapping where one is needed", () => {
  const d = taxonomy.dimensions;
  assert.deepEqual(Object.keys(G.DEFAULT_TRAITS).sort(), Object.keys(d).sort());
  for (const [dim, v] of Object.entries(G.DEFAULT_TRAITS)) assert.ok(d[dim].values.includes(v), `default ${dim}=${v}`);
  const cover = { accentHue: G.ACCENTS, typeStyle: G.FONT_STACKS, typeScale: G.TYPE_RATIOS, density: G.SPACING, radius: G.RADII, elevation: G.SHADOWS, border: G.BORDER_WIDTHS, mood: G.MOTION };
  for (const [dim, table] of Object.entries(cover)) assert.deepEqual(d[dim].values.slice().sort(), Object.keys(table).sort(), dim);
});

test("Markdown agrees with the JSON", () => {
  const { files, plan } = G.generate(sparse.concat(ties.slice(2)), deck, taxonomy);
  const tokens = JSON.parse(files["tokens.json"]), swipes = JSON.parse(files["swipes.json"]);
  for (const m of ["light", "dark"]) for (const [role, leaf] of Object.entries(tokens.color[m])) {
    assert.ok(files["STYLE.md"].includes(leaf.$value), `${m}.${role}`);
  }
  for (const t of swipes.traits) {
    const src = t.source === "votes" ? "from votes" : "curated default";
    const label = taxonomy.dimensions[t.dimension].label;
    assert.ok(files["DESIGN.md"].includes(`| ${label} | ${t.value} | ${src} |`), `${t.dimension} row`);
  }
  assert.ok(files["STYLE.md"].includes(tokens.font.family.body.$value));
  for (const [k, v] of Object.entries(tokens.radius)) assert.ok(files["STYLE.md"].includes(`${k} ${v.$value}`), `radius ${k}`);
  for (const [k, v] of Object.entries(tokens.font.size)) assert.ok(files["STYLE.md"].includes(`${k} ${v.$value}`), `size ${k}`);
  for (const f of ["DESIGN.md", "STYLE.md"]) {
    assert.ok(files[f].includes(`hash ${swipes.deck.hash}`));
    assert.ok(files[f].includes(`tastemaker-generator ${swipes.generator.version}`));
  }
  assert.ok(files["DESIGN.md"].includes(`${swipes.counts.valid} valid votes: ${swipes.counts.loved} loved, ${swipes.counts.liked} liked, ${swipes.counts.noped} noped, ${swipes.counts.skipped} skipped`));
  assert.equal(plan.votes.length, swipes.votes.length);
});

test("no statistical language and no percentages in any file", () => {
  const files = G.generate(sparse.concat(ties.slice(2)), deck, taxonomy).files;
  for (const [f, text] of Object.entries(files)) {
    assert.doesNotMatch(text, /confiden|likel(y|ihood)|probab|certain|significan|%/i, f);
    assert.doesNotMatch(text, /—/, f);
  }
});

test("hostile card text and ids cannot inject markup or pollute prototypes", () => {
  const evil = JSON.parse(JSON.stringify(deck));
  evil.cards[0].title = '<script>alert(1)</script> | **bold** [x](javascript:alert(1)) `tick` \n# heading';
  evil.cards[0].inspiredBy = "<img src=x onerror=alert(1)>";
  evil.cards[0].tokens.fonts = ['Evil"Font<script>', "Alpha Sans"];
  evil.cards[1].tags = JSON.parse('{"__proto__": {"polluted": true}, "colorMode": "dark", "constructor": "dark"}');
  evil.cards.push({ id: "__proto__", title: "x", tags: {} }, { id: "constructor", title: "y", tags: {} });
  const votes = [vote("a-dark-round", "love"), vote("b-dark-round", "love"), vote("__proto__", "love"), vote("constructor", "like"), vote("toString", "like"), JSON.parse('{"id":"x","verdict":"love","__proto__":{"polluted":true}}')];
  const { files } = G.generate(votes, evil, taxonomy);
  assert.equal({}.polluted, undefined);
  assert.equal(Object.prototype.polluted, undefined);
  for (const [f, text] of Object.entries(files)) {
    assert.doesNotMatch(text, /<script|<img|<[a-z]/i, f);
    if (f.endsWith(".json")) JSON.parse(text);
  }
  assert.doesNotMatch(files["DESIGN.md"] + files["STYLE.md"], /\n# heading/);
  const valid = G.normalizeVotes(votes, evil).valid.map((v) => v.id);
  assert.ok(!valid.includes("__proto__") && !valid.includes("toString")); // fail the id pattern
  assert.ok(valid.includes("constructor")); // a legal id that is also an Object.prototype name: plain data, no special case
  assert.ok(files["swipes.json"].includes("\\u003cscript\\u003e"));
  assert.equal(JSON.parse(files["swipes.json"]).votes.find((v) => v.id === "a-dark-round").title.includes("\n"), false);
  // a deck that is not a deck at all
  for (const bad of [null, undefined, 5, "x", [], { cards: "no" }, { cards: [null, 3, { id: 5 }] }]) {
    assert.doesNotThrow(() => G.generate([vote("a-dark-round", "love")], bad, taxonomy));
  }
  assert.doesNotThrow(() => G.generate([], deck, null));
});

test("input over the cap is refused whole, so shuffling cannot change the result", () => {
  const over = [];
  for (let i = 0; i < 6000; i++) over.push(vote(ids[i % ids.length], ["love", "like", "nope", "skip"][i % 4]));
  const shuffled = over.slice().sort((a, b) => ((a.verdict + a.id + (a.id.length * 7) % 5) < (b.verdict + b.id) ? 1 : -1));
  const rotated = over.slice(2500).concat(over.slice(0, 2500));
  const a = G.generate(over, deck, taxonomy);
  assert.deepEqual(G.generate(shuffled, deck, taxonomy).files, a.files);
  assert.deepEqual(G.generate(rotated, deck, taxonomy).files, a.files);
  assert.equal(a.plan.votes.length, 0);
  assert.deepEqual(a.plan.ignored.listed, [{ id: null, reason: "too-many-entries" }]);
  assert.equal(G.normalizeVotes(over.slice(0, G.MAX_VOTE_ENTRIES), deck).valid.length, ids.length);
  const t0 = Date.now();
  G.generate(Array.from({ length: 200000 }, () => vote("a-dark-round", "love")), deck, taxonomy);
  assert.ok(Date.now() - t0 < 5000);
});

test("the checked-in profile of a past user is gone", () => {
  assert.equal(existsSync(join(ROOT, "taste")), false);
});

test("real deck: every card id is valid, output is stable, and provenance matches cards.json", () => {
  const real = ensureDeck();
  const tax = taxonomy;
  const verdicts = ["love", "like", "nope", "skip", "like", "nope", "love"];
  const votes = real.cards.map((c, i) => vote(c.id, verdicts[(i * 7) % verdicts.length]));
  const a = G.generate(votes, real, tax), b = G.generate(votes.slice().reverse(), real, tax);
  assert.deepEqual(a.files, b.files);
  assert.equal(a.plan.ignored.total, 0);
  assert.equal(a.plan.votes.length, real.count);
  assert.equal(JSON.parse(a.files["swipes.json"]).deck.hash, real.hash);
  // every tag value on every real card exists in the taxonomy
  for (const c of real.cards) for (const [dim, val] of Object.entries(c.tags)) assert.ok(tax.dimensions[dim]?.values.includes(val), `${c.id} ${dim}=${val}`);
});
