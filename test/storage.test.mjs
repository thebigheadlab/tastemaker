import { test } from "node:test";
import assert from "node:assert/strict";
import * as S from "../app/storage.mjs";
import * as G from "../app/generator.mjs";
import * as IO from "../app/io.mjs";
import { deck, taxonomy, ids, vote } from "./fixtures/mini-deck.mjs";

// In-memory stand-ins for window.localStorage.
const memory = (initial = {}) => {
  const m = new Map(Object.entries(initial));
  return { m, getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => void m.set(k, String(v)), removeItem: (k) => void m.delete(k) };
};
const full = () => ({ ...memory(), setItem(k) { if (k !== "tastemaker.probe") { const e = new Error("full"); e.name = "QuotaExceededError"; throw e; } } });
const votesOf = (...pairs) => new Map(pairs);

test("getStorage returns null when reading or writing localStorage throws", () => {
  assert.equal(S.getStorage({ get localStorage() { throw new DOMException("blocked", "SecurityError"); } }), null);
  assert.equal(S.getStorage({ localStorage: null }), null);
  assert.equal(S.getStorage({ localStorage: { setItem() { throw new Error("full"); }, removeItem() {} } }), null);
  const ok = memory();
  assert.equal(S.getStorage({ localStorage: ok }), ok);
  assert.equal(ok.m.size, 0, "probe key is cleaned up");
});

test("reload: saved votes come back in the same order", () => {
  const st = memory();
  const v = votesOf(["c-dark-sharp", "nope"], ["a-dark-round", "love"], ["b-dark-round", "like"]);
  assert.deepEqual(S.saveVotes(st, v), { ok: true });
  const r = S.loadVotes(st, deck);
  assert.equal(r.status, "ok");
  assert.deepEqual([...r.votes], [...v]);
  assert.equal(r.ignored, 0);
});

test("nothing saved yet is 'empty', not an error", () => {
  const r = S.loadVotes(memory(), deck);
  assert.equal(r.status, "empty");
  assert.equal(r.votes.size, 0);
});

test("blocked storage: load and save report it and nothing throws", () => {
  assert.equal(S.loadVotes(null, deck).status, "blocked");
  assert.deepEqual(S.saveVotes(null, votesOf(["a-dark-round", "love"])), { ok: false, error: "blocked" });
  const throwing = { getItem() { throw new Error("denied"); }, setItem() { throw new Error("denied"); }, removeItem() { throw new Error("denied"); } };
  assert.equal(S.loadVotes(throwing, deck).status, "blocked");
  assert.equal(S.saveVotes(throwing, votesOf(["a-dark-round", "love"])).ok, false);
  assert.equal(S.readRecovery(throwing), null);
  assert.equal(S.clearVotes(throwing), false);
  assert.equal(S.dismissRecovery(throwing), false);
});

test("storage that is full: save reports failure, in-memory votes are untouched", () => {
  const v = votesOf(["a-dark-round", "love"]);
  assert.deepEqual(S.saveVotes(full(), v), { ok: false, error: "write-failed" });
  assert.equal(v.size, 1);
});

for (const [name, raw] of [
  ["not JSON", "{oops"],
  ["a JSON string", '"hello"'],
  ["wrong version", JSON.stringify({ version: 99, votes: [] })],
  ["votes is not a list", JSON.stringify({ version: 1, votes: { a: 1 } })],
  ["the literal null", "null"],
]) {
  test(`corrupt storage (${name}): raw text is kept for recovery, never silently dropped`, () => {
    const st = memory({ [S.VOTES_KEY]: raw });
    const r = S.loadVotes(st, deck);
    assert.equal(r.status, "corrupt");
    assert.equal(r.votes.size, 0);
    assert.equal(r.raw, raw);
    assert.equal(S.readRecovery(st), raw);
    assert.equal(st.getItem(S.VOTES_KEY), raw, "original is not deleted by loading");
    // a fresh session can save without losing the recovery copy
    S.saveVotes(st, votesOf(["a-dark-round", "love"]));
    assert.equal(S.readRecovery(st), raw);
    assert.equal(S.loadVotes(st, deck).status, "ok");
    assert.equal(S.dismissRecovery(st), true);
    assert.equal(S.readRecovery(st), null);
  });
}

test("stored entries that are junk are dropped and counted, valid ones survive", () => {
  const st = memory({ [S.VOTES_KEY]: JSON.stringify({ version: 1, votes: [{ id: "a-dark-round", verdict: "love" }, { id: "gone-card", verdict: "like" }, { id: "b-dark-round", verdict: "maybe" }, 7, null, { id: "__proto__", verdict: "love" }] }) });
  const r = S.loadVotes(st, deck);
  assert.equal(r.status, "ok");
  assert.deepEqual([...r.votes], [["a-dark-round", "love"]]);
  assert.equal(r.ignored, 5);
});

test("stored prototype-pollution keys do nothing", () => {
  const st = memory({ [S.VOTES_KEY]: '{"version":1,"__proto__":{"polluted":1},"votes":[{"id":"a-dark-round","verdict":"love","__proto__":{"polluted":2}}]}' });
  const r = S.loadVotes(st, deck);
  assert.equal(r.votes.size, 1);
  assert.equal({}.polluted, undefined);
});

test("clearVotes removes the saved votes", () => {
  const st = memory();
  S.saveVotes(st, votesOf(["a-dark-round", "love"]));
  assert.equal(S.clearVotes(st), true);
  assert.equal(S.loadVotes(st, deck).status, "empty");
});

test("backup round trip: same votes, same order, same generated files", () => {
  const v = new Map([["e-light-pill", "nope"], ["a-dark-round", "love"], ["b-dark-round", "like"], ["h-plain", "skip"]]);
  const text = S.makeBackup(v, deck);
  const parsed = JSON.parse(text);
  assert.equal(parsed.format, "tastemaker-backup");
  assert.deepEqual(parsed.deck, { version: 2, hash: "0123456789abcdef" });
  assert.ok(!/\d{4}-\d{2}-\d{2}/.test(text), "no timestamps in backups");
  const r = S.parseBackup(text, deck);
  assert.equal(r.ok, true);
  assert.deepEqual([...r.votes], [...v]);
  assert.equal(r.ignored, 0);
  assert.equal(S.makeBackup(r.votes, deck), text, "export, import, export is byte-identical");
  assert.deepEqual(G.generate(G.createVoteLog(r.votes).toVotes(), deck, taxonomy).files, G.generate(G.createVoteLog(v).toVotes(), deck, taxonomy).files);
  assert.deepEqual(S.parseBackup(S.makeBackup(new Map(), deck), deck).votes.size, 0);
});

test("backup import rejects bad files with a named reason and never throws", () => {
  const good = JSON.parse(S.makeBackup(votesOf(["a-dark-round", "love"]), deck));
  const cases = [
    ["too-large", "x".repeat(S.MAX_BACKUP_BYTES + 1)],
    ["not-json", "not json at all"],
    ["wrong-format", "[]"],
    ["wrong-format", JSON.stringify({ ...good, format: "other" })],
    ["wrong-format", "null"],
    ["unsupported-version", JSON.stringify({ ...good, version: 2 })],
    ["unsupported-version", JSON.stringify({ ...good, version: "1" })],
    ["bad-votes", JSON.stringify({ ...good, votes: "a-dark-round" })],
    ["too-many", JSON.stringify({ ...good, votes: Array.from({ length: G.MAX_VOTE_ENTRIES + 1 }, () => ({ id: "a-dark-round", verdict: "love" })) })],
    ["no-valid-votes", JSON.stringify({ ...good, votes: [{ id: "nobody", verdict: "love" }, { id: "a-dark-round", verdict: "adore" }] })],
  ];
  for (const [error, text] of cases) assert.deepEqual(S.parseBackup(text, deck), { ok: false, error }, error);
  for (const bad of [undefined, null, 5, {}, []]) assert.deepEqual(S.parseBackup(bad, deck), { ok: false, error: "too-large" });
  for (const e of Object.keys(S.BACKUP_ERRORS)) assert.ok(S.BACKUP_ERRORS[e].length > 10 && !/—/.test(S.BACKUP_ERRORS[e]));
});

test("backup import keeps valid entries and counts the rest; hostile keys do nothing", () => {
  const text = '{"format":"tastemaker-backup","version":1,"__proto__":{"polluted":1},"votes":[{"id":"a-dark-round","verdict":"love"},{"id":"zzz","verdict":"like"},{"id":"constructor","verdict":"love"},{"id":"b-dark-round","verdict":"nope","__proto__":{"polluted":2}}]}';
  const r = S.parseBackup(text, deck);
  assert.equal(r.ok, true);
  assert.deepEqual([...r.votes], [["a-dark-round", "love"], ["b-dark-round", "nope"]]);
  assert.equal(r.ignored, 2);
  assert.equal({}.polluted, undefined);
});

test("checkBackupFile looks at File.size before anything is read", () => {
  assert.deepEqual(S.checkBackupFile({ size: 100 }), { ok: true });
  assert.deepEqual(S.checkBackupFile({ size: S.MAX_BACKUP_BYTES + 1 }), { ok: false, error: "too-large" });
  assert.deepEqual(S.checkBackupFile(null), { ok: false, error: "too-large" });
  assert.deepEqual(S.checkBackupFile({}), { ok: false, error: "too-large" });
});

// ---------- downloads and copy ----------
function fakeEnv() {
  const log = { blobs: [], clicks: [], appended: 0, removed: 0, revoked: [], timers: [] };
  const anchors = [];
  class FakeBlob { constructor(parts, opts) { this.text = parts.join(""); this.type = opts.type; log.blobs.push(this); } }
  const env = {
    Blob: FakeBlob,
    URL: { createObjectURL: (b) => `blob:test/${log.blobs.indexOf(b)}`, revokeObjectURL: (u) => log.revoked.push(u) },
    document: { createElement: () => { const a = { style: {}, click() { log.clicks.push(a); }, remove() { log.removed++; } }; anchors.push(a); return a; }, body: { appendChild: () => log.appended++ } },
    setTimeout: (fn, ms) => log.timers.push({ fn, ms }),
    navigator: {},
  };
  return { env, log, anchors };
}

test("download builds a Blob, clicks a link with the file name, then frees the URL", () => {
  const { env, log, anchors } = fakeEnv();
  const r = IO.downloadText(env, "tokens.json", '{"a":1}\n');
  assert.deepEqual(r, { name: "tokens.json", type: "application/json;charset=utf-8" });
  assert.equal(log.blobs[0].text, '{"a":1}\n');
  assert.equal(anchors[0].download, "tokens.json");
  assert.equal(anchors[0].href, "blob:test/0");
  assert.equal(log.clicks.length, 1);
  assert.equal(log.removed, 1);
  assert.equal(log.revoked.length, 0);
  log.timers[0].fn();
  assert.deepEqual(log.revoked, ["blob:test/0"]);
  assert.equal(IO.downloadText(fakeEnv().env, "DESIGN.md", "x").type, "text/markdown;charset=utf-8");
  assert.equal(IO.downloadText(fakeEnv().env, "a.txt", "x").type, "text/plain;charset=utf-8");
});

test("download file names cannot contain paths or odd characters", () => {
  assert.equal(IO.safeFilename("../../etc/passwd"), "etc-passwd");
  assert.equal(IO.safeFilename("a b/c\\d.json"), "a-b-c-d.json");
  assert.equal(IO.safeFilename(""), "download.txt");
  assert.equal(IO.safeFilename(null), "download.txt");
  assert.equal(IO.safeFilename("x".repeat(500)).length, 80);
  assert.equal(IO.safeFilename(".hidden"), "hidden");
});

test("copy: clipboard, then selection fallback, then failure", async () => {
  let written = null;
  assert.equal(await IO.copyText({ navigator: { clipboard: { writeText: async (t) => { written = t; } } } }, "hello"), "copied");
  assert.equal(written, "hello");
  const refuse = { navigator: { clipboard: { writeText: async () => { throw new Error("denied"); } } } };
  let selected = false;
  assert.equal(await IO.copyText(refuse, "x", () => { selected = true; }), "selected");
  assert.equal(selected, true);
  assert.equal(await IO.copyText(refuse, "x"), "failed");
  assert.equal(await IO.copyText({ navigator: {} }, "x", () => { throw new Error("no selection"); }), "failed");
});
