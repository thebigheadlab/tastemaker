// Saving votes on this device (localStorage) and moving them between devices (backup files).
// Everything takes the storage object as an argument so tests can hand in a blocked or broken one.
// No network, no accounts. Inlined into dist/index.html by app/build.mjs.
import { normalizeVotes, MAX_VOTE_ENTRIES } from "./generator.mjs";

export const VOTES_KEY = "tastemaker.votes.v1";
export const RECOVERY_KEY = "tastemaker.recovery.v1";
export const STORE_VERSION = 1;
export const BACKUP_FORMAT = "tastemaker-backup";
export const BACKUP_VERSION = 1;
export const MAX_BACKUP_BYTES = 1000000;
const MAX_RECOVERY_CHARS = 2000000;

// window.localStorage can throw just by being read (blocked cookies, some private modes), and
// setItem can throw when full. Probe once and hand back null if it cannot be used.
export function getStorage(win) {
  try {
    const s = win.localStorage;
    if (!s) return null;
    const probe = "tastemaker.probe";
    s.setItem(probe, "1");
    s.removeItem(probe);
    return s;
  } catch (e) {
    return null;
  }
}

// normalizeVotes returns votes sorted by id. Put them back in the order they were saved or made.
function inOrder(valid, rawList) {
  const verdicts = new Map(valid.map((v) => [v.id, v.verdict]));
  const out = new Map();
  for (const e of rawList.slice(0, MAX_VOTE_ENTRIES)) if (e && typeof e.id === "string" && verdicts.has(e.id) && !out.has(e.id)) out.set(e.id, verdicts.get(e.id));
  return out;
}
const voteEntries = (votes) => [...votes.entries()].map(([id, verdict]) => ({ id, verdict }));

// Votes are kept in the order they were made, so the Your taste tab can show recent ones first after a reload.
export function serializeVotes(votes) {
  return JSON.stringify({ version: STORE_VERSION, votes: voteEntries(votes) });
}

export function saveVotes(storage, votes) {
  if (!storage) return { ok: false, error: "blocked" };
  try { storage.setItem(VOTES_KEY, serializeVotes(votes)); return { ok: true }; }
  catch (e) { return { ok: false, error: "write-failed" }; }
}

// status: "empty" (nothing saved yet), "ok", "blocked" (storage unusable) or "corrupt" (saved data unreadable).
// Corrupt data is never deleted here: the raw text is copied to a recovery key first, and returned so the page can offer it as a download.
export function loadVotes(storage, deck) {
  if (!storage) return { status: "blocked", votes: new Map(), ignored: 0, raw: null };
  let raw;
  try { raw = storage.getItem(VOTES_KEY); } catch (e) { return { status: "blocked", votes: new Map(), ignored: 0, raw: null }; }
  if (raw === null || raw === undefined) return { status: "empty", votes: new Map(), ignored: 0, raw: null };
  let data = null;
  try { data = JSON.parse(raw); } catch (e) { data = null; }
  if (typeof raw !== "string" || data === null || typeof data !== "object" || data.version !== STORE_VERSION || !Array.isArray(data.votes)) {
    const text = typeof raw === "string" ? raw.slice(0, MAX_RECOVERY_CHARS) : "";
    try { storage.setItem(RECOVERY_KEY, text); } catch (e) { /* keep going: the text is still returned */ }
    return { status: "corrupt", votes: new Map(), ignored: 0, raw: text };
  }
  const { valid, ignored, truncated } = normalizeVotes(data.votes, deck);
  return { status: "ok", votes: inOrder(valid, data.votes), ignored: ignored.length + truncated, raw: null };
}
export function readRecovery(storage) {
  try { return storage ? storage.getItem(RECOVERY_KEY) : null; } catch (e) { return null; }
}
export function dismissRecovery(storage) {
  try { if (storage) storage.removeItem(RECOVERY_KEY); return true; } catch (e) { return false; }
}
export function clearVotes(storage) {
  try { if (storage) storage.removeItem(VOTES_KEY); return true; } catch (e) { return false; }
}

// ---------- Backup files ----------
export function makeBackup(votes, deck) {
  return JSON.stringify({
    format: BACKUP_FORMAT,
    version: BACKUP_VERSION,
    deck: { version: deck && Number.isFinite(deck.version) ? deck.version : null, hash: deck && typeof deck.hash === "string" ? deck.hash.slice(0, 64) : null },
    votes: voteEntries(votes),
  }, null, 2) + "\n";
}

export const BACKUP_ERRORS = Object.freeze({
  "too-large": "That file is too big to be a Tastemaker backup.",
  "not-json": "That file is not valid JSON.",
  "wrong-format": "That file is not a Tastemaker backup.",
  "unsupported-version": "That backup was made by a newer version of Tastemaker.",
  "bad-votes": "That backup has no list of swipes.",
  "too-many": "That backup has more swipes than this deck can hold.",
  "no-valid-votes": "None of the swipes in that backup match cards in this deck.",
});

// Check the size before reading the file into memory.
export function checkBackupFile(file) {
  if (!file || typeof file.size !== "number" || file.size > MAX_BACKUP_BYTES) return { ok: false, error: "too-large" };
  return { ok: true };
}

// Never throws. On success returns the votes that matched cards in this deck, plus how many entries were left out.
export function parseBackup(text, deck) {
  if (typeof text !== "string" || text.length > MAX_BACKUP_BYTES) return { ok: false, error: "too-large" };
  let data;
  try { data = JSON.parse(text); } catch (e) { return { ok: false, error: "not-json" }; }
  if (data === null || typeof data !== "object" || Array.isArray(data) || data.format !== BACKUP_FORMAT) return { ok: false, error: "wrong-format" };
  if (!Number.isInteger(data.version) || data.version < 1 || data.version > BACKUP_VERSION) return { ok: false, error: "unsupported-version" };
  if (!Array.isArray(data.votes)) return { ok: false, error: "bad-votes" };
  if (data.votes.length > MAX_VOTE_ENTRIES) return { ok: false, error: "too-many" };
  const { valid, ignored } = normalizeVotes(data.votes, deck);
  if (data.votes.length > 0 && valid.length === 0) return { ok: false, error: "no-valid-votes" };
  return { ok: true, votes: inOrder(valid, data.votes), ignored: ignored.length, deckHash: data.deck && typeof data.deck.hash === "string" ? data.deck.hash.slice(0, 64) : null };
}
