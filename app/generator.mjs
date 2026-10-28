// Turns votes into DESIGN.md, STYLE.md, tokens.json and swipes.json with fixed rules.
// Pure and synchronous: no clock, no randomness, no locale, no network. The same set of
// valid votes, deck and taxonomy always gives the same four strings, byte for byte.
//
// Runs unchanged in Node and in the browser. app/build.mjs inlines this file into
// dist/index.html, so keep it to top-level `export const` / `export function` and
// no imports.

export const GENERATOR_NAME = "tastemaker-generator";
export const GENERATOR_VERSION = "1.0.0";

// love +2, like +1, nope -1, skip is read but never counted.
export const WEIGHTS = Object.freeze({ love: 2, like: 1, nope: -1, skip: 0 });

// Limits that keep hostile or broken input from becoming a problem.
export const MAX_VOTE_ENTRIES = 5000;
export const MAX_IGNORED_LISTED = 50;
const ID_PATTERN = /^[a-z0-9][a-z0-9-]{0,79}$/;

// A trait needs this many positive votes (love or like) on one value before votes can
// pick it, and this many nopes on one value before it counts as something to avoid.
export const MIN_POSITIVE_VOTES = 2;
export const MIN_NOPE_VOTES = 2;
// Under this many rated cards the files say so at the top.
export const SPARSE_BELOW = 10;

// ---------- Curated defaults ----------
// Used for every dimension the votes cannot decide.
export const DEFAULT_TRAITS = Object.freeze({
  colorMode: "light", temperature: "neutral", saturation: "balanced", contrast: "medium",
  accentHue: "blue", typeStyle: "grotesk", typeScale: "moderate", density: "comfortable",
  radius: "soft", elevation: "subtle", border: "hairline", ornament: "minimal", mood: "calm",
});

// Base roles do not depend on votes. Every pair that carries text is checked to WCAG AA (4.5:1) in the tests.
export const BASE_COLORS = Object.freeze({
  light: { bg: "#ffffff", surface: "#f4f4f1", text: "#17171a", muted: "#5a5a63", line: "#d4d4cf", success: "#15803d", warning: "#92400e", danger: "#b91c1c" },
  dark: { bg: "#121214", surface: "#1c1c20", text: "#ececef", muted: "#a1a1aa", line: "#2e2e34", success: "#4ade80", warning: "#fbbf24", danger: "#f87171" },
});
// Accent per hue. Light accents hold 4.5:1 on the light bg with white on top; dark accents hold it on the dark bg with the dark bg on top.
export const ACCENTS = Object.freeze({
  red: { light: "#c62828", dark: "#ff6b6b" }, orange: { light: "#b44a00", dark: "#ff9150" },
  yellow: { light: "#8a6100", dark: "#f2c14e" }, green: { light: "#1b7a3e", dark: "#4ade80" },
  teal: { light: "#0f766e", dark: "#2dd4bf" }, blue: { light: "#1d4ed8", dark: "#6ea8ff" },
  indigo: { light: "#4338ca", dark: "#8b93ff" }, purple: { light: "#7e22ce", dark: "#c084fc" },
  pink: { light: "#be185d", dark: "#f472b6" }, mono: { light: "#17171a", dark: "#ececef" },
});
export const ON_ACCENT = Object.freeze({ light: "#ffffff", dark: "#121214" });

const SANS_TAIL = 'system-ui, -apple-system, "Segoe UI", sans-serif';
export const FONT_STACKS = Object.freeze({
  geometric: `"Poppins", "Avenir Next", ${SANS_TAIL}`,
  grotesk: `"Inter", "Helvetica Neue", Arial, ${SANS_TAIL}`,
  humanist: `"Nunito Sans", "Segoe UI", ${SANS_TAIL}`,
  serif: '"Newsreader", Georgia, "Times New Roman", serif',
  mono: '"JetBrains Mono", ui-monospace, Menlo, Consolas, monospace',
  display: `"Plus Jakarta Sans", "Helvetica Neue", Arial, ${SANS_TAIL}`,
});
const MONO_STACK = 'ui-monospace, "JetBrains Mono", Menlo, Consolas, monospace';
export const TYPE_RATIOS = Object.freeze({ restrained: 1.125, moderate: 1.2, dramatic: 1.333 });
const SIZE_STEPS = Object.freeze([["xs", -2], ["sm", -1], ["md", 0], ["lg", 1], ["xl", 2], ["2xl", 3], ["3xl", 4]]);
export const SPACING = Object.freeze({
  compact: { scale: [0, 2, 4, 6, 8, 12, 16, 20, 24, 32, 40], control: { sm: 28, md: 32, lg: 40 }, lineHeight: 1.35 },
  comfortable: { scale: [0, 4, 8, 12, 16, 20, 24, 32, 40, 48, 64], control: { sm: 32, md: 40, lg: 48 }, lineHeight: 1.5 },
  airy: { scale: [0, 4, 8, 12, 16, 24, 32, 48, 64, 80, 96], control: { sm: 36, md: 44, lg: 56 }, lineHeight: 1.6 },
});
export const RADII = Object.freeze({
  sharp: { sm: 0, md: 2, lg: 4 }, soft: { sm: 4, md: 8, lg: 12 },
  round: { sm: 8, md: 12, lg: 20 }, pill: { sm: 8, md: 16, lg: 28 },
});
export const SHADOWS = Object.freeze({
  flat: { sm: "none", md: "none", lg: "none" },
  subtle: { sm: "0 1px 2px rgba(0,0,0,0.08)", md: "0 2px 8px rgba(0,0,0,0.08)", lg: "0 8px 24px rgba(0,0,0,0.10)" },
  layered: {
    sm: "0 1px 2px rgba(0,0,0,0.10), 0 2px 4px rgba(0,0,0,0.06)",
    md: "0 4px 8px rgba(0,0,0,0.10), 0 8px 16px rgba(0,0,0,0.08)",
    lg: "0 12px 24px rgba(0,0,0,0.14), 0 24px 48px rgba(0,0,0,0.12)",
  },
});
export const BORDER_WIDTHS = Object.freeze({ none: 0, hairline: 1, bold: 2 });
export const MOTION = Object.freeze({
  calm: { fast: 150, base: 250, slow: 400, easing: [0.25, 0.1, 0.25, 1] },
  playful: { fast: 120, base: 220, slow: 360, easing: [0.34, 1.56, 0.64, 1] },
  serious: { fast: 100, base: 160, slow: 240, easing: [0.4, 0, 0.2, 1] },
  luxurious: { fast: 200, base: 350, slow: 600, easing: [0.22, 1, 0.36, 1] },
  technical: { fast: 60, base: 100, slow: 160, easing: [0, 0, 1, 1] },
  editorial: { fast: 150, base: 240, slow: 380, easing: [0.2, 0, 0, 1] },
  brutalist: { fast: 0, base: 0, slow: 80, easing: [1, 0, 1, 1] },
});

// ---------- Small helpers ----------
const cmp = (a, b) => (a < b ? -1 : a > b ? 1 : 0); // code-unit order, never localeCompare
const has = (o, k) => o !== null && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
const isPlainObject = (v) => v !== null && typeof v === "object" && !Array.isArray(v);

// Text that came from a card or a file. Control characters out, length capped.
export function cleanText(v, max = 80) {
  if (typeof v !== "string") return "";
  return v.replace(/[\u0000-\u001f\u007f-\u009f\u2028\u2029]+/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
// Same, for placing in Markdown: markup characters are escaped so a title can never become HTML or a link.
export function mdText(v, max = 80) {
  return cleanText(v, max)
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/([\\`*_\[\]|#~!()])/g, "\\$1");
}

export function relativeLuminance(hex) {
  const n = parseInt(hex.slice(1), 16);
  const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); };
  return 0.2126 * lin((n >> 16) & 255) + 0.7152 * lin((n >> 8) & 255) + 0.0722 * lin(n & 255);
}
export function contrastRatio(a, b) {
  const [hi, lo] = [relativeLuminance(a), relativeLuminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
const ratio2 = (a, b) => Math.round(contrastRatio(a, b) * 100) / 100;

// ---------- Deck ----------
// The deck is data from the build. Anything odd about a card only affects that card.
export function deckIndex(deck) {
  const byId = new Map();
  const cards = isPlainObject(deck) && Array.isArray(deck.cards) ? deck.cards : [];
  for (const c of cards) if (isPlainObject(c) && typeof c.id === "string" && ID_PATTERN.test(c.id) && !byId.has(c.id)) byId.set(c.id, c);
  return byId;
}
function deckInfo(deck, byId) {
  return {
    version: isPlainObject(deck) && Number.isFinite(deck.version) ? deck.version : null,
    hash: isPlainObject(deck) && typeof deck.hash === "string" && /^[0-9a-f]{8,64}$/.test(deck.hash) ? deck.hash : "unknown",
    cardCount: byId.size,
  };
}

// ---------- Votes ----------
// Accepts an array of { id, verdict } or a Map of id -> verdict. Returns the valid votes in id order
// and a list of what was ignored and why. Nothing here depends on the order the votes arrived in.
export function normalizeVotes(raw, deck) {
  const byId = deckIndex(deck);
  let entries = [];
  if (raw instanceof Map) entries = [...raw.entries()].map(([id, verdict]) => ({ id, verdict }));
  else if (Array.isArray(raw)) entries = raw;
  const ignored = [];
  // Too many entries is refused whole. Keeping the first N would make the result depend on arrival order.
  if (entries.length > MAX_VOTE_ENTRIES) return { valid: [], ignored: [{ id: null, reason: "too-many-entries" }] };
  const seen = new Map(); // id -> verdict, or null once the id has conflicting entries
  for (const e of entries) {
    if (!isPlainObject(e)) { ignored.push({ id: null, reason: "malformed-entry" }); continue; }
    const id = typeof e.id === "string" ? e.id : null;
    if (id === null || !ID_PATTERN.test(id)) { ignored.push({ id: id === null ? null : cleanText(id, 40), reason: "invalid-id" }); continue; }
    if (typeof e.verdict !== "string" || !has(WEIGHTS, e.verdict)) { ignored.push({ id, reason: "invalid-verdict" }); continue; }
    if (!byId.has(id)) { ignored.push({ id, reason: "unknown-card" }); continue; }
    if (!seen.has(id)) { seen.set(id, e.verdict); continue; }
    const prev = seen.get(id);
    if (prev === e.verdict) ignored.push({ id, reason: "duplicate" });
    else { seen.set(id, null); ignored.push({ id, reason: "conflicting-duplicate" }); }
  }
  const valid = [];
  for (const id of [...seen.keys()].sort(cmp)) {
    const verdict = seen.get(id);
    if (verdict === null) ignored.push({ id, reason: "dropped-conflict" });
    else valid.push({ id, verdict, weight: WEIGHTS[verdict] });
  }
  ignored.sort((a, b) => cmp(a.reason, b.reason) || cmp(a.id ?? "", b.id ?? ""));
  return { valid, ignored };
}

// The votes a person has made, with undo. Re-rating a card and then undoing restores the earlier verdict.
export function createVoteLog(initial) {
  const votes = new Map();
  if (initial instanceof Map) for (const [id, verdict] of initial) votes.set(id, verdict);
  const history = [];
  return {
    votes,
    rate(id, verdict) {
      if (typeof id !== "string" || !ID_PATTERN.test(id) || typeof verdict !== "string" || !has(WEIGHTS, verdict)) throw new TypeError("invalid vote");
      history.push({ id, prev: votes.has(id) ? votes.get(id) : null });
      votes.set(id, verdict);
    },
    undo() {
      const h = history.pop();
      if (!h) return null;
      if (h.prev === null) votes.delete(h.id); else votes.set(h.id, h.prev);
      return h.id;
    },
    canUndo() { return history.length > 0; },
    toVotes() { return [...votes.entries()].map(([id, verdict]) => ({ id, verdict })); },
  };
}

// ---------- Statistics and traits ----------
function emptyCounts() { return { rated: 0, loved: 0, liked: 0, noped: 0, sum: 0 }; }
function addVote(c, verdict) {
  if (verdict === "skip") return;
  c.rated++; c.sum += WEIGHTS[verdict];
  if (verdict === "love") c.loved++; else if (verdict === "like") c.liked++; else c.noped++;
}
export function tally(valid) {
  const t = emptyCounts(); let skipped = 0;
  for (const v of valid) { addVote(t, v.verdict); if (v.verdict === "skip") skipped++; }
  return { ...t, skipped };
}

// Counts per taxonomy dimension value, in taxonomy order. Unknown tag values are skipped.
export function traitStats(valid, deck, taxonomy) {
  const byId = deckIndex(deck);
  const dims = isPlainObject(taxonomy) && isPlainObject(taxonomy.dimensions) ? taxonomy.dimensions : {};
  const out = [];
  for (const dim of Object.keys(dims)) {
    const values = Array.isArray(dims[dim].values) ? dims[dim].values : [];
    const stats = new Map(values.map((v) => [v, emptyCounts()]));
    for (const vote of valid) {
      const tags = byId.get(vote.id).tags;
      if (!isPlainObject(tags) || !has(tags, dim) || !stats.has(tags[dim])) continue;
      addVote(stats.get(tags[dim]), vote.verdict);
    }
    out.push({ dimension: dim, label: cleanText(dims[dim].label, 40) || dim, values: values.map((v) => ({ value: v, ...stats.get(v) })) });
  }
  return out;
}

// One decision per dimension. Votes pick a value only when it has enough positive votes and the best
// average weight, compared as exact fractions so floats never decide a tie.
export function decideTraits(stats) {
  return stats.map((d) => {
    const fallback = has(DEFAULT_TRAITS, d.dimension) && d.values.some((v) => v.value === DEFAULT_TRAITS[d.dimension]) ? DEFAULT_TRAITS[d.dimension] : d.values[0]?.value ?? null;
    const candidates = d.values.filter((v) => v.loved + v.liked >= MIN_POSITIVE_VOTES && v.sum > 0);
    let best = [];
    for (const c of candidates) {
      if (!best.length) { best = [c]; continue; }
      const diff = c.sum * best[0].rated - best[0].sum * c.rated; // c.avg - best.avg, scaled
      if (diff > 0) best = [c]; else if (diff === 0) best.push(c);
    }
    const avoid = d.values.filter((v) => v.noped >= MIN_NOPE_VOTES && v.sum < 0).map((v) => v.value);
    const rated = d.values.reduce((n, v) => n + v.rated, 0);
    let status = "insufficient", value = fallback, source = "default", tied = [];
    if (best.length === 1) { status = "votes"; value = best[0].value; source = "votes"; }
    else if (best.length > 1) { status = "tie"; tied = best.map((b) => b.value); }
    const chosen = d.values.find((v) => v.value === value) ?? emptyCounts();
    return { dimension: d.dimension, label: d.label, value, source, status, tied, avoid, ratedInDimension: rated, counts: { rated: chosen.rated, loved: chosen.loved, liked: chosen.liked, noped: chosen.noped } };
  });
}

// Fonts named as card design intent. Only used for the display font, only when exactly one font has the best
// net weight over at least two positive votes. Monospace-looking names are left to the mono role.
export function fontEvidence(valid, deck) {
  const byId = deckIndex(deck);
  const m = new Map();
  for (const vote of valid) {
    if (vote.verdict === "skip") continue;
    const fonts = byId.get(vote.id).tokens?.fonts;
    if (!Array.isArray(fonts)) continue;
    for (const raw of new Set(fonts)) {
      if (typeof raw !== "string" || !/^[A-Za-z0-9][A-Za-z0-9 ]{0,39}$/.test(raw) || /mono|code|courier/i.test(raw)) continue;
      if (!m.has(raw)) m.set(raw, emptyCounts());
      addVote(m.get(raw), vote.verdict);
    }
  }
  const cand = [...m.entries()].filter(([, c]) => c.loved + c.liked >= MIN_POSITIVE_VOTES && c.sum > 0).sort((a, b) => b[1].sum - a[1].sum || cmp(a[0], b[0]));
  if (!cand.length) return { font: null, tied: [] };
  const top = cand.filter(([, c]) => c.sum === cand[0][1].sum).map(([f]) => f);
  return top.length === 1 ? { font: top[0], counts: cand[0][1], tied: [] } : { font: null, tied: top };
}

// ---------- Plan ----------
// Everything the four files say, as plain data. The renderers below only format it.
export function buildPlan(rawVotes, deck, taxonomy) {
  const byId = deckIndex(deck);
  const { valid, ignored } = normalizeVotes(rawVotes, deck);
  const counts = tally(valid);
  const traits = decideTraits(traitStats(valid, deck, taxonomy));
  const t = Object.fromEntries(traits.map((x) => [x.dimension, x]));
  const pick = (dim) => (t[dim] ? t[dim].value : DEFAULT_TRAITS[dim]);
  const src = (dim) => (t[dim] && t[dim].source === "votes" ? "votes" : "default");
  const basis = (dim) => (src(dim) === "votes" ? `${dim}=${pick(dim)}` : "curated");
  const mode = counts.rated === 0 ? "empty" : counts.rated < SPARSE_BELOW ? "sparse" : "votes";

  const accent = has(ACCENTS, pick("accentHue")) ? pick("accentHue") : DEFAULT_TRAITS.accentHue;
  const color = {};
  for (const m of ["light", "dark"]) {
    color[m] = {};
    for (const [role, hex] of Object.entries(BASE_COLORS[m])) color[m][role] = { value: hex, source: "default", basis: "curated" };
    color[m].accent = { value: ACCENTS[accent][m], source: src("accentHue"), basis: basis("accentHue") };
    color[m]["on-accent"] = { value: ON_ACCENT[m], source: src("accentHue"), basis: basis("accentHue") };
  }
  const contrast = {};
  for (const m of ["light", "dark"]) {
    const c = (r) => color[m][r].value;
    contrast[m] = {
      "text on bg": ratio2(c("text"), c("bg")), "text on surface": ratio2(c("text"), c("surface")),
      "muted on bg": ratio2(c("muted"), c("bg")), "muted on surface": ratio2(c("muted"), c("surface")),
      "accent on bg": ratio2(c("accent"), c("bg")), "on-accent on accent": ratio2(c("on-accent"), c("accent")),
      "success on bg": ratio2(c("success"), c("bg")), "warning on bg": ratio2(c("warning"), c("bg")), "danger on bg": ratio2(c("danger"), c("bg")),
    };
  }

  const style = has(FONT_STACKS, pick("typeStyle")) ? pick("typeStyle") : DEFAULT_TRAITS.typeStyle;
  const fe = fontEvidence(valid, deck);
  const ratio = TYPE_RATIOS[has(TYPE_RATIOS, pick("typeScale")) ? pick("typeScale") : DEFAULT_TRAITS.typeScale];
  const density = SPACING[has(SPACING, pick("density")) ? pick("density") : DEFAULT_TRAITS.density];
  const radius = RADII[has(RADII, pick("radius")) ? pick("radius") : DEFAULT_TRAITS.radius];
  const shadow = SHADOWS[has(SHADOWS, pick("elevation")) ? pick("elevation") : DEFAULT_TRAITS.elevation];
  const borderWidth = BORDER_WIDTHS[has(BORDER_WIDTHS, pick("border")) ? pick("border") : DEFAULT_TRAITS.border];
  const motion = MOTION[has(MOTION, pick("mood")) ? pick("mood") : DEFAULT_TRAITS.mood];

  const tokens = {
    color,
    font: {
      body: { value: FONT_STACKS[style], source: src("typeStyle"), basis: basis("typeStyle") },
      display: fe.font
        ? { value: `"${fe.font}", ${FONT_STACKS[style]}`, source: "votes", basis: `intended font ${fe.font} in ${fe.counts.loved + fe.counts.liked} loved or liked cards` }
        : { value: FONT_STACKS[style], source: src("typeStyle"), basis: basis("typeStyle") },
      mono: { value: style === "mono" ? FONT_STACKS.mono : MONO_STACK, source: style === "mono" ? src("typeStyle") : "default", basis: style === "mono" ? basis("typeStyle") : "curated" },
    },
    fontSize: Object.fromEntries(SIZE_STEPS.map(([name, k]) => [name, { value: Math.round(16 * Math.pow(ratio, k)), source: src("typeScale"), basis: basis("typeScale") }])),
    typeRatio: { value: ratio, source: src("typeScale"), basis: basis("typeScale") },
    fontWeight: { regular: { value: 400, source: "default", basis: "curated" }, medium: { value: 500, source: "default", basis: "curated" }, bold: { value: 700, source: "default", basis: "curated" } },
    lineHeight: { body: { value: density.lineHeight, source: src("density"), basis: basis("density") } },
    space: Object.fromEntries(density.scale.map((n, i) => [String(i), { value: n, source: src("density"), basis: basis("density") }])),
    control: Object.fromEntries(Object.entries(density.control).map(([k, n]) => [k, { value: n, source: src("density"), basis: basis("density") }])),
    radius: {
      none: { value: 0, source: "default", basis: "curated" },
      ...Object.fromEntries(Object.entries(radius).map(([k, n]) => [k, { value: n, source: src("radius"), basis: basis("radius") }])),
      full: { value: 9999, source: "default", basis: "curated" },
    },
    shadow: Object.fromEntries(Object.entries(shadow).map(([k, s]) => [k, { value: s, source: src("elevation"), basis: basis("elevation") }])),
    borderWidth: { default: { value: borderWidth, source: src("border"), basis: basis("border") } },
    motion: {
      "duration-fast": { value: motion.fast, source: src("mood"), basis: basis("mood") },
      "duration-base": { value: motion.base, source: src("mood"), basis: basis("mood") },
      "duration-slow": { value: motion.slow, source: src("mood"), basis: basis("mood") },
      easing: { value: motion.easing, source: src("mood"), basis: basis("mood") },
    },
  };

  const voteList = valid.map((v) => {
    const c = byId.get(v.id);
    return { id: v.id, verdict: v.verdict, weight: v.weight, title: cleanText(c.title), kind: cleanText(c.kind, 20), inspiredBy: cleanText(c.inspiredBy, 40) };
  });
  return {
    generator: { name: GENERATOR_NAME, version: GENERATOR_VERSION },
    deck: deckInfo(deck, byId),
    mode, counts, traits, tokens, contrast,
    preferredMode: { value: pick("colorMode"), source: src("colorMode") },
    fontTie: fe.tied,
    votes: voteList,
    ignored: { total: ignored.length, listed: ignored.slice(0, MAX_IGNORED_LISTED) },
  };
}

// ---------- Renderers ----------
// < > & are written as \u escapes: still valid JSON, but the text can never form a tag if someone pastes it into HTML.
const json = (o) => JSON.stringify(o, null, 2).replace(/[<>&]/g, (c) => "\\u00" + c.charCodeAt(0).toString(16)) + "\n";
const label = (source) => (source === "votes" ? "from votes" : "curated default");
const countWords = (c) => `${c.rated} rated (${c.loved} loved, ${c.liked} liked, ${c.noped} noped)`;
const row = (cells) => `| ${cells.join(" | ")} |`;
const table = (head, rows) => [row(head), row(head.map(() => "---")), ...rows.map(row)].join("\n");
const px = (n) => `${n}px`;
const bezier = (e) => `cubic-bezier(${e.join(", ")})`;

function headerLines(plan, file) {
  const g = plan.generator, d = plan.deck;
  const lines = [`# ${file}`, "", `Generated by ${g.name} ${g.version} from deck version ${d.version ?? "unknown"} (hash ${d.hash}, ${d.cardCount} cards). Same votes, same files.`, ""];
  if (plan.mode === "empty") lines.push("No cards have been rated yet. Every value below is a curated default.", "");
  else if (plan.mode === "sparse") lines.push(`Only ${plan.counts.rated} cards have been rated. A trait is taken from votes only after at least ${MIN_POSITIVE_VOTES} loves or likes land on one value. Anything that has not reached that uses a curated default.`, "");
  return lines;
}

export function renderTokens(plan) {
  const leaf = (type, e, extra) => ({ $type: type, $value: e.value, $extensions: { tastemaker: { source: e.source, basis: e.basis, ...extra } } });
  const group = (obj, type) => Object.fromEntries(Object.entries(obj).map(([k, e]) => [k, leaf(type, e)]));
  const tk = plan.tokens;
  return json({
    $description: "Design tokens in the W3C Design Tokens format. Shadows are CSS strings. Each token's source is 'votes' (a curated preset picked by your votes) or 'default' (curated, not decided by votes).",
    $extensions: { tastemaker: { generator: plan.generator, deck: plan.deck, preferredMode: plan.preferredMode, contrast: plan.contrast } },
    color: { light: group(tk.color.light, "color"), dark: group(tk.color.dark, "color") },
    font: { family: { body: leaf("fontFamily", tk.font.body), display: leaf("fontFamily", tk.font.display), mono: leaf("fontFamily", tk.font.mono) },
      size: Object.fromEntries(Object.entries(tk.fontSize).map(([k, e]) => [k, leaf("dimension", { ...e, value: px(e.value) })])),
      weight: group(tk.fontWeight, "fontWeight"), ratio: leaf("number", tk.typeRatio), lineHeight: group(tk.lineHeight, "number") },
    space: Object.fromEntries(Object.entries(tk.space).map(([k, e]) => [k, leaf("dimension", { ...e, value: px(e.value) })])),
    control: { height: Object.fromEntries(Object.entries(tk.control).map(([k, e]) => [k, leaf("dimension", { ...e, value: px(e.value) })])) },
    radius: Object.fromEntries(Object.entries(tk.radius).map(([k, e]) => [k, leaf("dimension", { ...e, value: px(e.value) })])),
    shadow: group(tk.shadow, "shadow"),
    border: { width: Object.fromEntries(Object.entries(tk.borderWidth).map(([k, e]) => [k, leaf("dimension", { ...e, value: px(e.value) })])) },
    motion: { duration: Object.fromEntries(["fast", "base", "slow"].map((k) => [k, leaf("duration", { ...tk.motion["duration-" + k], value: `${tk.motion["duration-" + k].value}ms` })])), easing: leaf("cubicBezier", tk.motion.easing) },
  });
}

export function renderSwipes(plan) {
  return json({
    generator: plan.generator,
    deck: plan.deck,
    counts: { valid: plan.votes.length, ...plan.counts, ignored: plan.ignored.total },
    weights: WEIGHTS,
    votes: plan.votes,
    ignored: { total: plan.ignored.total, listed: plan.ignored.listed },
    traits: plan.traits.map((t) => ({ dimension: t.dimension, value: t.value, source: t.source, status: t.status, tied: t.tied, avoid: t.avoid, counts: t.counts })),
  });
}

export function renderStyle(plan) {
  const tk = plan.tokens, L = tk.color.light, D = tk.color.dark;
  const lines = headerLines(plan, "STYLE.md");
  lines.push("Labels: **from votes** means your votes picked this value from a curated set. **curated default** means votes did not decide it. The values themselves are curated, not measured from your cards.", "");
  lines.push("## Color", "", `Preferred mode: ${plan.preferredMode.value} (${label(plan.preferredMode.source)}). Both modes are provided.`, "");
  lines.push(table(["Role", "Light", "Dark", "Source"], Object.keys(L).map((r) => [r, `\`${L[r].value}\``, `\`${D[r].value}\``, label(L[r].source)])), "");
  lines.push("Contrast ratios (WCAG 2.x, AA needs 4.5 for text):", "");
  lines.push(table(["Pair", "Light", "Dark"], Object.keys(plan.contrast.light).map((k) => [k, plan.contrast.light[k].toFixed(2), plan.contrast.dark[k].toFixed(2)])), "");
  lines.push("## Typography", "");
  lines.push(`- Body: \`${tk.font.body.value}\` (${label(tk.font.body.source)})`);
  lines.push(`- Display: \`${tk.font.display.value}\` (${label(tk.font.display.source)}${tk.font.display.source === "votes" && tk.font.display.basis.startsWith("intended font ") ? `: ${mdText(tk.font.display.basis, 120)}` : ""})`);
  lines.push(`- Mono: \`${tk.font.mono.value}\` (${label(tk.font.mono.source)})`);
  if (plan.fontTie.length) lines.push(`- Several fonts tied for the best vote weight (${plan.fontTie.map((f) => mdText(f)).join(", ")}), so no font was taken from votes.`);
  lines.push(`- Scale ratio ${tk.typeRatio.value} (${label(tk.typeRatio.source)}): ${Object.entries(tk.fontSize).map(([k, e]) => `${k} ${px(e.value)}`).join(", ")}`);
  lines.push(`- Weights: ${Object.entries(tk.fontWeight).map(([k, e]) => `${k} ${e.value}`).join(", ")} (curated default)`);
  lines.push(`- Body line height ${tk.lineHeight.body.value} (${label(tk.lineHeight.body.source)})`, "");
  lines.push("## Spacing", "", `Steps 0 to ${Object.keys(tk.space).length - 1}: ${Object.values(tk.space).map((e) => px(e.value)).join(", ")} (${label(tk.space["1"].source)})`, "");
  lines.push(`Control heights: ${Object.entries(tk.control).map(([k, e]) => `${k} ${px(e.value)}`).join(", ")} (${label(tk.control.md.source)})`, "");
  lines.push("## Shape", "", `Radius: ${Object.entries(tk.radius).map(([k, e]) => `${k} ${px(e.value)}`).join(", ")}. Small, medium and large follow your corner choice (${label(tk.radius.md.source)}); none and full are fixed.`, "");
  lines.push("## Depth and borders", "", `- Shadows (${label(tk.shadow.md.source)}): ${Object.entries(tk.shadow).map(([k, e]) => `${k} \`${e.value}\``).join("; ")}`);
  lines.push(`- Border width ${px(tk.borderWidth.default.value)} (${label(tk.borderWidth.default.source)})`, "");
  lines.push("## Motion", "", `Durations: fast ${tk.motion["duration-fast"].value}ms, base ${tk.motion["duration-base"].value}ms, slow ${tk.motion["duration-slow"].value}ms. Easing \`${bezier(tk.motion.easing.value)}\` (${label(tk.motion.easing.source)}). Turn motion off when the person asks for reduced motion.`, "");
  return lines.join("\n");
}

export function renderDesign(plan) {
  const tk = plan.tokens;
  const lines = headerLines(plan, "DESIGN.md");
  lines.push("Labels: **from votes** means your votes picked this value. **curated default** means votes did not decide it, so the generator used a fixed value that you can change.", "");
  lines.push("## Taste summary", "");
  lines.push(table(["Dimension", "Value", "Source", "Votes on this value"], plan.traits.map((t) => [mdText(t.label, 40), t.value === null ? "none" : mdText(t.value, 40), label(t.source), t.source === "votes" ? countWords(t.counts) : t.status === "tie" ? `tied: ${t.tied.map((v) => mdText(v, 40)).join(", ")}` : "fewer than 2 loves or likes"])), "");
  lines.push("## Avoid", "");
  const avoids = plan.traits.filter((t) => t.avoid.length);
  if (avoids.length) {
    lines.push(`A value is listed only after at least ${MIN_NOPE_VOTES} nope votes with a negative total. One nope never decides anything.`, "");
    for (const t of avoids) lines.push(`- ${mdText(t.label, 40)}: ${t.avoid.map((v) => mdText(v, 40)).join(", ")}`);
  } else lines.push(`Nothing is marked to avoid. A value is listed only after at least ${MIN_NOPE_VOTES} nope votes with a negative total.`);
  lines.push("");
  const ties = plan.traits.filter((t) => t.status === "tie");
  if (ties.length) {
    lines.push("## Ties", "", "These dimensions had equal best results, so the curated default was used.", "");
    for (const t of ties) lines.push(`- ${mdText(t.label, 40)}: ${t.tied.map((v) => mdText(v, 40)).join(" and ")}`);
    lines.push("");
  }
  const T = Object.fromEntries(plan.traits.map((t) => [t.dimension, t]));
  const tag = (dim) => label(T[dim] ? T[dim].source : "default");
  lines.push("## Layout and density", "");
  lines.push(`- Density: ${T.density ? T.density.value : DEFAULT_TRAITS.density} (${tag("density")}). Spacing steps start at ${px(tk.space["1"].value)} and reach ${px(tk.space["10"].value)}.`);
  lines.push(`- Controls: ${px(tk.control.sm.value)}, ${px(tk.control.md.value)} and ${px(tk.control.lg.value)} tall. Use the medium height by default.`);
  lines.push(`- Body text at ${px(tk.fontSize.md.value)} with line height ${tk.lineHeight.body.value}.`, "");
  lines.push("## Components", "");
  lines.push(`- Corners: radius ${px(tk.radius.md.value)} on buttons, inputs and cards, ${px(tk.radius.lg.value)} on panels (${tag("radius")}).`);
  lines.push(`- Borders: ${px(tk.borderWidth.default.value)} (${tag("border")}).`);
  lines.push(`- Depth: card shadow \`${tk.shadow.md.value}\` (${tag("elevation")}).`);
  lines.push(`- Accent: \`${tk.color.light.accent.value}\` in light mode and \`${tk.color.dark.accent.value}\` in dark mode, with \`${tk.color.light["on-accent"].value}\` or \`${tk.color.dark["on-accent"].value}\` text on top (${tag("accentHue")}).`);
  lines.push(`- Motion: ${tk.motion["duration-base"].value}ms by default (${tag("mood")}).`, "");
  lines.push("## Votes used", "");
  lines.push(`${plan.votes.length} valid votes: ${plan.counts.loved} loved, ${plan.counts.liked} liked, ${plan.counts.noped} noped, ${plan.counts.skipped} skipped. Skipped cards are kept in swipes.json but carry no weight. ${plan.ignored.total} entries were ignored.`, "");
  lines.push("See STYLE.md for exact values, tokens.json for machine-readable tokens and swipes.json for the votes behind them.", "");
  return lines.join("\n");
}

// The entry point. votes: array of { id, verdict } or Map of id -> verdict.
export function generate(votes, deck, taxonomy) {
  const plan = buildPlan(votes, deck, taxonomy);
  return {
    plan,
    files: { "DESIGN.md": renderDesign(plan), "STYLE.md": renderStyle(plan), "tokens.json": renderTokens(plan), "swipes.json": renderSwipes(plan) },
  };
}
