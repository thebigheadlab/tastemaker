// Downloads and copying, with the browser objects passed in so tests can fake them.
// Downloads are plain Blobs and a temporary link. Nothing leaves the page.

const MIME = { json: "application/json", md: "text/markdown" };

export function safeFilename(name) {
  const clean = String(name ?? "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^[.-]+/, "").slice(0, 80);
  return clean || "download.txt";
}

// env: { document, URL, Blob, setTimeout }
export function downloadText(env, filename, text, mime) {
  const name = safeFilename(filename);
  const type = mime || (MIME[name.split(".").pop()] ?? "text/plain") + ";charset=utf-8";
  const url = env.URL.createObjectURL(new env.Blob([text], { type }));
  const a = env.document.createElement("a");
  a.href = url; a.download = name; a.rel = "noopener"; a.style.display = "none";
  env.document.body.appendChild(a);
  a.click();
  a.remove();
  env.setTimeout(() => env.URL.revokeObjectURL(url), 10000);
  return { name, type };
}

// Returns "copied", "selected" (clipboard refused, text selected for Ctrl+C) or "failed".
export async function copyText(env, text, selectFallback) {
  try { await env.navigator.clipboard.writeText(text); return "copied"; }
  catch (e) {
    try { if (selectFallback) { selectFallback(); return "selected"; } } catch (e2) { /* fall through */ }
    return "failed";
  }
}
