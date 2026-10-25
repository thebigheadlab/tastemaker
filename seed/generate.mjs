// Generates the seed deck: cards/<id>.html + cards.json.
// Components mix tokens independently so each swipe isolates taste dimensions;
// screens use coherent presets so you also judge the gestalt.
import { mkdirSync, writeFileSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = join(dirname(fileURLToPath(import.meta.url)), "..", "deck");

// Seeded RNG so the deck is reproducible.
// mulberry32
let seed = 42;
const rand = () => {
  let t = (seed += 0x6d2b79f5);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

// ---------- Tokens ----------

const PALETTES = [
  { name: "Paper Ink",      bg: "#ffffff", surface: "#f6f6f4", text: "#111111", muted: "#6b6b6b", line: "#e4e4e0", accent: "#111111", onAccent: "#ffffff", tags: { colorMode: "light", temperature: "neutral", saturation: "muted", contrast: "high", accentHue: "mono" } },
  { name: "Cobalt",         bg: "#ffffff", surface: "#f4f6fb", text: "#0b1220", muted: "#5a6478", line: "#e1e6f0", accent: "#2b5cff", onAccent: "#ffffff", tags: { colorMode: "light", temperature: "cool", saturation: "vivid", contrast: "high", accentHue: "blue" } },
  { name: "Sage",           bg: "#f7f6f1", surface: "#eeede4", text: "#26302a", muted: "#6c7469", line: "#dcdccf", accent: "#5f7d61", onAccent: "#ffffff", tags: { colorMode: "light", temperature: "warm", saturation: "muted", contrast: "medium", accentHue: "green" } },
  { name: "Terracotta",     bg: "#fbf6f0", surface: "#f3e9de", text: "#2b1d14", muted: "#7a6556", line: "#e8d9c9", accent: "#c4532b", onAccent: "#ffffff", tags: { colorMode: "light", temperature: "warm", saturation: "balanced", contrast: "medium", accentHue: "orange" } },
  { name: "Bubblegum",      bg: "#fff5fa", surface: "#ffe6f2", text: "#3a0f2a", muted: "#8a5a76", line: "#ffd0e6", accent: "#ff3d9a", onAccent: "#ffffff", tags: { colorMode: "light", temperature: "warm", saturation: "vivid", contrast: "medium", accentHue: "pink" } },
  { name: "Lavender Mist",  bg: "#f8f7ff", surface: "#efedfc", text: "#25213d", muted: "#6e6a8a", line: "#e0ddf5", accent: "#7c6cf0", onAccent: "#ffffff", tags: { colorMode: "light", temperature: "cool", saturation: "balanced", contrast: "soft", accentHue: "purple" } },
  { name: "Lemon Pop",      bg: "#fffef2", surface: "#fff9c9", text: "#141414", muted: "#5c5a45", line: "#141414", accent: "#ffd500", onAccent: "#141414", tags: { colorMode: "light", temperature: "warm", saturation: "vivid", contrast: "high", accentHue: "yellow" } },
  { name: "Mint Clinic",    bg: "#f5fbf9", surface: "#e7f5f0", text: "#0f2b25", muted: "#557069", line: "#d2eae2", accent: "#0f9d84", onAccent: "#ffffff", tags: { colorMode: "light", temperature: "cool", saturation: "balanced", contrast: "medium", accentHue: "teal" } },
  { name: "Midnight",       bg: "#0a0b10", surface: "#14161f", text: "#eef0f6", muted: "#8a90a3", line: "#232634", accent: "#6e8bff", onAccent: "#0a0b10", tags: { colorMode: "dark", temperature: "cool", saturation: "balanced", contrast: "high", accentHue: "indigo" } },
  { name: "Graphite",       bg: "#161616", surface: "#202020", text: "#e8e8e8", muted: "#8c8c8c", line: "#2e2e2e", accent: "#e8e8e8", onAccent: "#161616", tags: { colorMode: "dark", temperature: "neutral", saturation: "muted", contrast: "medium", accentHue: "mono" } },
  { name: "Neon Terminal",  bg: "#050805", surface: "#0c140c", text: "#c8ffc8", muted: "#5f8f5f", line: "#1a2e1a", accent: "#39ff6a", onAccent: "#050805", tags: { colorMode: "dark", temperature: "cool", saturation: "vivid", contrast: "high", accentHue: "green" } },
  { name: "Ember",          bg: "#140d0a", surface: "#1f1612", text: "#f6e9e0", muted: "#a08878", line: "#33251e", accent: "#ff6a2b", onAccent: "#140d0a", tags: { colorMode: "dark", temperature: "warm", saturation: "vivid", contrast: "high", accentHue: "orange" } },
  { name: "Plum Velvet",    bg: "#17101c", surface: "#221829", text: "#f1e8f6", muted: "#9d8aa8", line: "#33263c", accent: "#c08cff", onAccent: "#17101c", tags: { colorMode: "dark", temperature: "cool", saturation: "balanced", contrast: "medium", accentHue: "purple" } },
  { name: "Gold Noir",      bg: "#0d0c0a", surface: "#181612", text: "#f3ede0", muted: "#9a917f", line: "#2a261f", accent: "#c9a45c", onAccent: "#0d0c0a", tags: { colorMode: "dark", temperature: "warm", saturation: "muted", contrast: "medium", accentHue: "yellow" } },
  { name: "Crimson Press",  bg: "#fdfbf7", surface: "#f4efe6", text: "#1a1714", muted: "#6e665c", line: "#1a1714", accent: "#d0021b", onAccent: "#ffffff", tags: { colorMode: "light", temperature: "warm", saturation: "vivid", contrast: "high", accentHue: "red" } },
  { name: "Ocean Dusk",     bg: "#0b1418", surface: "#112027", text: "#e3f1f4", muted: "#7f9aa2", line: "#1c313a", accent: "#2ec4d6", onAccent: "#0b1418", tags: { colorMode: "dark", temperature: "cool", saturation: "balanced", contrast: "medium", accentHue: "teal" } },
];

const FONTS = [
  { name: "Inter",              family: "'Inter', sans-serif",              google: "Inter:wght@400;500;600;700",                  style: "grotesk" },
  { name: "Space Grotesk",      family: "'Space Grotesk', sans-serif",      google: "Space+Grotesk:wght@400;500;700",              style: "grotesk" },
  { name: "Poppins",            family: "'Poppins', sans-serif",            google: "Poppins:wght@400;500;600;700",                style: "geometric" },
  { name: "Outfit",             family: "'Outfit', sans-serif",             google: "Outfit:wght@400;500;600;700",                 style: "geometric" },
  { name: "Nunito",             family: "'Nunito', sans-serif",             google: "Nunito:wght@400;600;700;800",                 style: "humanist" },
  { name: "Source Sans 3",      family: "'Source Sans 3', sans-serif",      google: "Source+Sans+3:wght@400;600;700",              style: "humanist" },
  { name: "Fraunces",           family: "'Fraunces', serif",                google: "Fraunces:opsz,wght@9..144,400;9..144,600;9..144,700", style: "serif" },
  { name: "Playfair Display",   family: "'Playfair Display', serif",        google: "Playfair+Display:wght@400;600;700",           style: "serif" },
  { name: "JetBrains Mono",     family: "'JetBrains Mono', monospace",      google: "JetBrains+Mono:wght@400;500;700",             style: "mono" },
  { name: "IBM Plex Mono",      family: "'IBM Plex Mono', monospace",       google: "IBM+Plex+Mono:wght@400;500;600",              style: "mono" },
  { name: "Syne",               family: "'Syne', sans-serif",               google: "Syne:wght@400;600;700;800",                   style: "display" },
  { name: "Bricolage Grotesque",family: "'Bricolage Grotesque', sans-serif",google: "Bricolage+Grotesque:opsz,wght@12..96,400;12..96,600;12..96,800", style: "display" },
];

const RADII = {
  sharp: { sm: 0, md: 0, lg: 0 },
  soft:  { sm: 4, md: 6, lg: 10 },
  round: { sm: 10, md: 14, lg: 22 },
  pill:  { sm: 999, md: 999, lg: 28 },
};

const DENSITY = {
  compact:     { pad: 8,  gap: 8,  ctl: 32, scale: 0.9 },
  comfortable: { pad: 14, gap: 14, ctl: 42, scale: 1 },
  airy:        { pad: 22, gap: 22, ctl: 52, scale: 1.1 },
};

const ELEVATION = {
  flat:    { sm: "none", lg: "none" },
  subtle:  { sm: "0 1px 2px rgba(0,0,0,.06), 0 1px 3px rgba(0,0,0,.08)", lg: "0 4px 12px rgba(0,0,0,.08)" },
  layered: { sm: "0 4px 10px rgba(0,0,0,.12)", lg: "0 24px 48px -12px rgba(0,0,0,.28), 0 8px 16px rgba(0,0,0,.10)" },
};

const BORDER = { none: 0, hairline: 1, bold: 2 };

const TYPESCALE = { restrained: 1.15, moderate: 1.28, dramatic: 1.5 };

// ---------- Theme -> CSS ----------

function themeCss(t) {
  const p = t.palette, r = RADII[t.radius], d = DENSITY[t.density], e = ELEVATION[t.elevation];
  const bw = BORDER[t.border], ratio = TYPESCALE[t.typeScale];
  const base = 15 * d.scale;
  // Brutalist borders use full-contrast ink; hard offset shadow replaces blur.
  const lineColor = t.border === "bold" ? p.text : p.line;
  const shadowSm = t.ornament === "brutal" ? `3px 3px 0 ${p.text}` : e.sm;
  const shadowLg = t.ornament === "brutal" ? `6px 6px 0 ${p.text}` : e.lg;
  return `
:root{--bg:${p.bg};--surface:${p.surface};--text:${p.text};--muted:${p.muted};--line:${lineColor};--accent:${p.accent};--on-accent:${p.onAccent};
--r-sm:${r.sm}px;--r-md:${r.md}px;--r-lg:${r.lg}px;--pad:${d.pad}px;--gap:${d.gap}px;--ctl:${d.ctl}px;
--sh-sm:${shadowSm};--sh-lg:${shadowLg};--bw:${bw}px;
--fs-0:${(base / ratio).toFixed(1)}px;--fs-1:${base.toFixed(1)}px;--fs-2:${(base * ratio).toFixed(1)}px;--fs-3:${(base * ratio ** 2).toFixed(1)}px;--fs-4:${(base * ratio ** 3).toFixed(1)}px;--fs-5:${(base * ratio ** 4).toFixed(1)}px;
--font:${t.font.family};--display:${(t.displayFont || t.font).family}}
*{box-sizing:border-box;margin:0}
html,body{height:100%}
body{background:var(--bg);color:var(--text);font-family:var(--font);font-size:var(--fs-1);line-height:1.45;-webkit-font-smoothing:antialiased}
h1,h2,h3,.display{font-family:var(--display);line-height:1.1;letter-spacing:${t.font.style === "mono" ? "0" : "-0.02em"}}
.btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:var(--ctl);padding:0 calc(var(--pad)*1.4);border-radius:var(--r-sm);font:600 var(--fs-1) var(--font);border:var(--bw) solid transparent;cursor:pointer;white-space:nowrap}
.btn-primary{background:var(--accent);color:var(--on-accent);box-shadow:var(--sh-sm);${bw ? "border-color:var(--line);" : ""}}
.btn-secondary{background:var(--surface);color:var(--text);border-color:${bw ? "var(--line)" : "transparent"}}
.btn-ghost{background:transparent;color:var(--text)}
.panel{background:var(--surface);border:var(--bw) solid var(--line);border-radius:var(--r-lg);box-shadow:var(--sh-lg)}
.field{display:flex;flex-direction:column;gap:6px}
.label{font-size:var(--fs-0);color:var(--muted);font-weight:500}
.input{height:var(--ctl);padding:0 var(--pad);border-radius:var(--r-sm);border:max(var(--bw),1px) solid var(--line);background:var(--bg);color:var(--text);font:var(--fs-1) var(--font);outline:none;width:100%}
.input.focus{border-color:var(--accent);box-shadow:0 0 0 3px color-mix(in srgb,var(--accent) 25%,transparent)}
.muted{color:var(--muted)}
.chip{display:inline-flex;align-items:center;gap:6px;padding:2px 10px;height:24px;border-radius:var(--r-sm);font-size:var(--fs-0);font-weight:600;background:color-mix(in srgb,var(--accent) 14%,transparent);color:color-mix(in srgb,var(--accent) 70%,var(--text));border:var(--bw) solid ${bw ? "var(--line)" : "transparent"}}
${ornamentCss(t)}`;
}

function ornamentCss(t) {
  const a = t.palette.accent;
  if (t.ornament === "gradient") return `body{background:radial-gradient(1200px 600px at 10% -10%,color-mix(in srgb,${a} 28%,transparent),transparent 60%),radial-gradient(900px 500px at 110% 110%,color-mix(in srgb,${a} 18%,transparent),transparent 60%),var(--bg)}`;
  if (t.ornament === "glass") return `body{background:linear-gradient(135deg,color-mix(in srgb,${a} 55%,var(--bg)),var(--bg) 55%,color-mix(in srgb,${a} 30%,var(--bg)))} .panel{background:color-mix(in srgb,var(--surface) 55%,transparent);backdrop-filter:blur(18px);-webkit-backdrop-filter:blur(18px);border:1px solid color-mix(in srgb,var(--text) 14%,transparent)}`;
  if (t.ornament === "grain") return `body{background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence baseFrequency='.8' numOctaves='3'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.06'/%3E%3C/svg%3E")}`;
  if (t.ornament === "grid") return `body{background-image:linear-gradient(color-mix(in srgb,var(--text) 7%,transparent) 1px,transparent 1px),linear-gradient(90deg,color-mix(in srgb,var(--text) 7%,transparent) 1px,transparent 1px);background-size:24px 24px}`;
  return "";
}

// Maps internal ornament flavours onto the taxonomy's ornament values.
const ORNAMENT_TAG = { none: "minimal", grain: "textured", grid: "textured", gradient: "expressive", glass: "expressive", brutal: "expressive" };

function page(t, body, viewport) {
  const fonts = [t.font, t.displayFont].filter(Boolean).map((f) => `family=${f.google}`).join("&");
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=${viewport.w}">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?${fonts}&display=swap">
<style>${themeCss(t)}</style></head><body>${body}</body></html>`;
}

function tagsFor(t, extra = {}) {
  return {
    ...t.palette.tags,
    typeStyle: t.font.style,
    typeScale: t.typeScale,
    density: t.density,
    radius: t.radius,
    elevation: t.elevation,
    border: t.border,
    ornament: ORNAMENT_TAG[t.ornament],
    ...(t.mood ? { mood: t.mood } : {}),
    ...extra,
  };
}

function randomTheme() {
  const palette = pick(PALETTES);
  return {
    palette,
    font: pick(FONTS),
    radius: pick(Object.keys(RADII)),
    density: pick(Object.keys(DENSITY)),
    elevation: palette.tags.colorMode === "dark" ? pick(["flat", "subtle"]) : pick(Object.keys(ELEVATION)),
    border: pick(Object.keys(BORDER)),
    typeScale: pick(Object.keys(TYPESCALE)),
    ornament: pick(["none", "none", "none", "grain", "grid", "gradient"]),
  };
}

// ---------- Card templates ----------

const center = (inner) => `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:28px">${inner}</div>`;
const ICON = {
  search: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>`,
  arrow: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 12h14M13 6l6 6-6 6"/></svg>`,
  check: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12l5 5 9-11"/></svg>`,
  close: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 6l12 12M18 6 6 18"/></svg>`,
};

const COMPONENTS = {
  button: () => center(`<div style="display:flex;flex-direction:column;gap:var(--gap);align-items:stretch;width:280px">
    <button class="btn btn-primary">Get started ${ICON.arrow}</button>
    <button class="btn btn-secondary">Secondary action</button>
    <button class="btn btn-ghost">Ghost button</button>
    <div style="display:flex;gap:8px"><button class="btn btn-primary" style="flex:1;opacity:.45">Disabled</button><button class="btn btn-secondary" style="width:var(--ctl);padding:0">${ICON.search}</button></div></div>`),

  input: () => center(`<div style="display:flex;flex-direction:column;gap:var(--gap);width:300px">
    <div class="field"><span class="label">Email</span><input class="input" value="ada@example.com"></div>
    <div class="field"><span class="label">Password</span><input class="input focus" type="password" value="hunter22"></div>
    <div class="field"><span class="label">Search</span><div style="position:relative"><span class="muted" style="position:absolute;left:var(--pad);top:50%;transform:translateY(-50%)">${ICON.search}</span><input class="input" placeholder="Search anything" style="padding-left:calc(var(--pad) + 24px)"></div></div>
    <div class="field"><span class="label">Username</span><input class="input" value="ada!" style="border-color:#e5484d"><span style="font-size:var(--fs-0);color:#e5484d">Only letters and numbers</span></div></div>`),

  card: () => center(`<div class="panel" style="width:300px;overflow:hidden">
    <div style="height:150px;background:linear-gradient(135deg,var(--accent),color-mix(in srgb,var(--accent) 40%,var(--surface)))"></div>
    <div style="padding:calc(var(--pad)*1.4);display:flex;flex-direction:column;gap:calc(var(--gap)*.7)">
      <span class="chip">New release</span>
      <h3 style="font-size:var(--fs-3)">Quiet mornings, louder ideas</h3>
      <p class="muted" style="font-size:var(--fs-0)">A field guide to building calm, focused tools that people return to.</p>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:4px"><span style="font-weight:600">$24</span><button class="btn btn-primary">Add to cart</button></div>
    </div></div>`),

  nav: () => `<div style="padding:24px;display:flex;flex-direction:column;gap:28px">
    <nav class="panel" style="display:flex;align-items:center;justify-content:space-between;padding:calc(var(--pad)*.8) var(--pad)">
      <b class="display" style="font-size:var(--fs-2)">Nimbus</b>
      <div style="display:flex;gap:4px"><span class="btn btn-ghost" style="height:auto;padding:4px 8px;font-size:var(--fs-0)">Docs</span><span class="btn btn-ghost" style="height:auto;padding:4px 8px;font-size:var(--fs-0)">Pricing</span></div>
    </nav>
    <div class="panel" style="padding:var(--pad);display:flex;flex-direction:column;gap:4px">
      ${["Home", "Inbox", "Projects", "Reports", "Settings"].map((x, i) => `<div style="display:flex;justify-content:space-between;align-items:center;padding:calc(var(--pad)*.7) var(--pad);border-radius:var(--r-sm);${i === 1 ? "background:var(--accent);color:var(--on-accent);font-weight:600" : ""}">${x}${i === 1 ? `<span style="font-size:var(--fs-0)">12</span>` : ""}</div>`).join("")}
    </div>
    <div class="panel" style="display:flex;justify-content:space-around;padding:10px;border-radius:var(--r-lg)">
      ${["Home", "Search", "Saved", "You"].map((x, i) => `<div style="display:flex;flex-direction:column;align-items:center;gap:4px;font-size:var(--fs-0);${i === 0 ? "color:var(--accent);font-weight:700" : "color:var(--muted)"}"><span style="width:22px;height:22px;border-radius:var(--r-sm);background:currentColor;opacity:${i === 0 ? 1 : .35}"></span>${x}</div>`).join("")}
    </div></div>`,

  toggle: () => center(`<div class="panel" style="width:310px;padding:var(--pad);display:flex;flex-direction:column">
    ${[["Push notifications", true], ["Weekly digest", false], ["Dark mode", true]].map(([l, on], i) => `<div style="display:flex;align-items:center;justify-content:space-between;padding:var(--pad) 4px;${i ? "border-top:1px solid var(--line)" : ""}"><span>${l}</span>
      <span style="width:44px;height:26px;border-radius:999px;padding:3px;background:${on ? "var(--accent)" : "color-mix(in srgb,var(--muted) 35%,transparent)"};display:flex;justify-content:${on ? "flex-end" : "flex-start"}"><span style="width:20px;height:20px;border-radius:${"var(--r-sm)"};max-width:20px;background:${on ? "var(--on-accent)" : "var(--bg)"};box-shadow:0 1px 2px rgba(0,0,0,.2)"></span></span></div>`).join("")}
    <div style="display:flex;gap:8px;padding:var(--pad) 4px;border-top:1px solid var(--line)">${["Day", "Week", "Month"].map((x, i) => `<span class="btn ${i === 1 ? "btn-primary" : "btn-secondary"}" style="flex:1;min-width:0;padding:0 6px;height:calc(var(--ctl)*.8);font-size:var(--fs-0)">${x}</span>`).join("")}</div></div>`),

  badge: () => center(`<div style="display:flex;flex-direction:column;gap:18px;align-items:flex-start;width:300px">
    <div style="display:flex;gap:8px;flex-wrap:wrap"><span class="chip">${ICON.check} Active</span><span class="chip" style="background:color-mix(in srgb,#e5484d 14%,transparent);color:#e5484d">Failed</span><span class="chip" style="background:color-mix(in srgb,#f5a524 18%,transparent);color:#b07000">Pending</span><span class="chip" style="background:var(--surface);color:var(--muted)">Draft</span></div>
    <div class="panel" style="padding:var(--pad);display:flex;gap:12px;align-items:center;width:100%"><span style="width:40px;height:40px;border-radius:999px;background:var(--accent);color:var(--on-accent);display:grid;place-items:center;font-weight:700">AL</span><div style="flex:1"><b>Ada Lovelace</b><div class="muted" style="font-size:var(--fs-0)">Engineer</div></div><span class="chip">Pro</span></div>
    <div class="panel" style="padding:var(--pad);width:100%;display:flex;gap:10px;align-items:flex-start;border-left:4px solid var(--accent)"><b style="color:var(--accent)">i</b><div><b>Heads up</b><div class="muted" style="font-size:var(--fs-0)">Your trial ends in 3 days.</div></div></div></div>`),

  modal: () => `<div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;background:color-mix(in srgb,var(--text) 35%,transparent)">
    <div class="panel" style="width:320px;padding:calc(var(--pad)*1.6);display:flex;flex-direction:column;gap:var(--gap);background:var(--bg)">
      <div style="display:flex;justify-content:space-between;align-items:flex-start"><h3 style="font-size:var(--fs-3)">Delete project?</h3><span class="muted">${ICON.close}</span></div>
      <p class="muted">This removes “Aurora” and its 42 files. You can't undo this.</p>
      <div class="field"><span class="label">Type the project name</span><input class="input" placeholder="Aurora"></div>
      <div style="display:flex;gap:8px;justify-content:flex-end"><button class="btn btn-secondary">Cancel</button><button class="btn btn-primary" style="background:#e5484d;color:#fff">Delete</button></div>
    </div></div>`,

  table: () => center(`<div class="panel" style="width:340px;overflow:hidden;font-size:var(--fs-0)">
    <div style="padding:var(--pad);display:flex;justify-content:space-between;align-items:center"><b style="font-size:var(--fs-1)">Invoices</b><span class="btn btn-secondary" style="height:28px;font-size:var(--fs-0)">Export</span></div>
    <table style="width:100%;border-collapse:collapse">
      <tr class="muted" style="text-align:left"><th style="padding:8px var(--pad);font-weight:500">Client</th><th style="font-weight:500">Status</th><th style="text-align:right;padding-right:var(--pad);font-weight:500">Amount</th></tr>
      ${[["Acme Co", "Paid", "$4,200"], ["Globex", "Due", "$1,150"], ["Initech", "Paid", "$860"], ["Umbrella", "Overdue", "$2,990"]].map(([c, s, a]) => `<tr style="border-top:1px solid var(--line)"><td style="padding:calc(var(--pad)*.8) var(--pad)">${c}</td><td><span class="chip" style="height:20px">${s}</span></td><td style="text-align:right;padding-right:var(--pad);font-variant-numeric:tabular-nums;font-weight:600">${a}</td></tr>`).join("")}
    </table></div>`),
};

// Token cards show one token family on a neutral layout.
const TOKEN_CARDS = {
  palette: (t) => center(`<div style="width:320px;display:flex;flex-direction:column;gap:14px">
    <h2 style="font-size:var(--fs-4)">${t.palette.name}</h2>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:8px">
    ${["bg", "surface", "line", "muted", "text", "accent"].map((k) => `<div><div style="height:64px;border-radius:var(--r-md);background:${t.palette[k]};border:1px solid color-mix(in srgb,var(--text) 15%,transparent)"></div><div class="muted" style="font-size:11px;margin-top:4px">${k}<br>${t.palette[k]}</div></div>`).join("")}
    </div>
    <div class="panel" style="padding:var(--pad);display:flex;justify-content:space-between;align-items:center"><span>Sample text <span class="muted">muted</span></span><button class="btn btn-primary">Action</button></div></div>`),

  typography: (t) => `<div style="padding:32px;display:flex;flex-direction:column;gap:14px">
    <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.1em">${t.font.name}${t.displayFont ? " + " + t.displayFont.name : ""} · ${t.typeScale}</div>
    <h1 style="font-size:min(var(--fs-5), 50px);font-weight:700">The quick brown fox</h1>
    <h2 style="font-size:min(var(--fs-3), 30px);font-weight:600">Design is how it works</h2>
    <p style="font-size:var(--fs-1)">Good typography is invisible. It sets a rhythm, guides the eye and lets the words speak for themselves.</p>
    <p class="muted" style="font-size:var(--fs-0)">Caption · 12 March 2026 · 4 min read</p>
    <div style="display:flex;gap:16px;font-size:var(--fs-2);font-weight:500"><span>Aa</span><span>Gg</span><span>Rr</span><span>0123</span><span>&amp;?!</span></div></div>`,

  shape: (t) => center(`<div style="width:320px;display:flex;flex-direction:column;gap:16px">
    <div class="muted" style="font-size:12px;text-transform:uppercase;letter-spacing:.1em">${t.radius} corners · ${t.elevation} depth · ${t.border} borders</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
      <div class="panel" style="height:110px"></div>
      <div class="panel" style="height:110px;background:var(--accent)"></div>
      <div class="panel" style="height:70px;border-radius:var(--r-md)"></div>
      <div style="display:flex;align-items:center"><button class="btn btn-primary" style="width:100%">Button</button></div>
    </div>
    <input class="input" placeholder="Input field"></div>`),
};

// ---------- Screen presets (coherent styles) ----------

const font = (n) => FONTS.find((f) => f.name === n);
const pal = (n) => PALETTES.find((p) => p.name === n);
const PRESETS = [
  { id: "swiss",      label: "Swiss minimal",     palette: pal("Paper Ink"),     font: font("Inter"),            radius: "sharp", density: "airy",        elevation: "flat",    border: "hairline", typeScale: "dramatic",   ornament: "none",     mood: "serious" },
  { id: "saas",       label: "Clean SaaS",        palette: pal("Cobalt"),        font: font("Inter"),            radius: "soft",  density: "comfortable", elevation: "subtle",  border: "hairline", typeScale: "moderate",   ornament: "gradient", mood: "calm" },
  { id: "brutal",     label: "Neo-brutalist",     palette: pal("Lemon Pop"),     font: font("Space Grotesk"),    radius: "sharp", density: "comfortable", elevation: "flat",    border: "bold",     typeScale: "dramatic",   ornament: "brutal",   mood: "brutalist" },
  { id: "editorial",  label: "Editorial",         palette: pal("Crimson Press"), font: font("Source Sans 3"),    displayFont: font("Playfair Display"), radius: "sharp", density: "airy", elevation: "flat", border: "hairline", typeScale: "dramatic", ornament: "none", mood: "editorial" },
  { id: "organic",    label: "Warm organic",      palette: pal("Sage"),          font: font("Nunito"),           displayFont: font("Fraunces"), radius: "round", density: "airy", elevation: "subtle", border: "none", typeScale: "moderate", ornament: "grain", mood: "calm" },
  { id: "playful",    label: "Playful pop",       palette: pal("Bubblegum"),     font: font("Outfit"),           radius: "pill",  density: "comfortable", elevation: "layered", border: "none",     typeScale: "dramatic",   ornament: "gradient", mood: "playful" },
  { id: "devtool",    label: "Dark dev tool",     palette: pal("Midnight"),      font: font("Inter"),            radius: "soft",  density: "compact",     elevation: "subtle",  border: "hairline", typeScale: "restrained", ornament: "grid",     mood: "technical" },
  { id: "terminal",   label: "Terminal",          palette: pal("Neon Terminal"), font: font("JetBrains Mono"),   radius: "sharp", density: "compact",     elevation: "flat",    border: "hairline", typeScale: "restrained", ornament: "none",     mood: "technical" },
  { id: "luxury",     label: "Luxury noir",       palette: pal("Gold Noir"),     font: font("Outfit"),           displayFont: font("Playfair Display"), radius: "sharp", density: "airy", elevation: "flat", border: "hairline", typeScale: "dramatic", ornament: "none", mood: "luxurious" },
  { id: "glass",      label: "Glassmorphism",     palette: pal("Plum Velvet"),   font: font("Poppins"),          radius: "round", density: "comfortable", elevation: "layered", border: "hairline", typeScale: "moderate",   ornament: "glass",    mood: "playful" },
  { id: "studio",     label: "Creative studio",   palette: pal("Ember"),         font: font("Inter"),            displayFont: font("Syne"), radius: "soft", density: "airy", elevation: "flat", border: "none", typeScale: "dramatic", ornament: "grain", mood: "editorial" },
  { id: "health",     label: "Friendly health",   palette: pal("Mint Clinic"),   font: font("Nunito"),           radius: "round", density: "comfortable", elevation: "subtle",  border: "none",     typeScale: "moderate",   ornament: "none",     mood: "calm" },
];

const SCREENS = {
  landing: { viewport: { w: 1280, h: 800 }, html: (t) => `
    <header style="display:flex;justify-content:space-between;align-items:center;padding:24px 64px"><b class="display" style="font-size:var(--fs-3)">Nimbus</b>
      <nav style="display:flex;gap:28px;align-items:center" class="muted"><span>Product</span><span>Customers</span><span>Pricing</span><span>Docs</span><button class="btn btn-primary">Start free</button></nav></header>
    <section style="display:grid;grid-template-columns:1.1fr 1fr;gap:56px;align-items:center;padding:56px 64px">
      <div style="display:flex;flex-direction:column;gap:24px"><span class="chip" style="align-self:flex-start">New · Workflows 2.0</span>
        <h1 style="font-size:min(calc(var(--fs-5) * 1.6), 72px);font-weight:700">Ship work that<br>feels effortless.</h1>
        <p class="muted" style="font-size:var(--fs-2);max-width:480px">Nimbus brings your docs, tasks and team rituals into one calm place, so nothing slips.</p>
        <div style="display:flex;gap:12px"><button class="btn btn-primary">Get started ${ICON.arrow}</button><button class="btn btn-secondary">Book a demo</button></div>
        <div class="muted" style="font-size:var(--fs-0);display:flex;gap:24px;margin-top:16px"><b>ACME</b><b>Globex</b><b>Initech</b><b>Hooli</b><b>Umbrella</b></div></div>
      <div class="panel" style="height:440px;padding:20px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;gap:6px"><i style="width:10px;height:10px;border-radius:9px;background:var(--line)"></i><i style="width:10px;height:10px;border-radius:9px;background:var(--line)"></i><i style="width:10px;height:10px;border-radius:9px;background:var(--line)"></i></div>
        ${[80, 60, 90, 45].map((w, i) => `<div style="display:flex;gap:10px;align-items:center;padding:12px;border-radius:var(--r-md);background:var(--bg);border:1px solid var(--line)"><span style="width:18px;height:18px;border-radius:var(--r-sm);${i < 2 ? "background:var(--accent)" : "border:2px solid var(--line)"}"></span><span style="height:10px;width:${w}%;border-radius:4px;background:var(--line)"></span></div>`).join("")}
        <div style="flex:1;border-radius:var(--r-md);background:linear-gradient(180deg,color-mix(in srgb,var(--accent) 22%,transparent),transparent)"></div></div></section>` },

  dashboard: { viewport: { w: 1280, h: 800 }, html: (t) => `
    <div style="display:grid;grid-template-columns:220px 1fr;height:100vh">
      <aside style="border-right:1px solid var(--line);padding:20px;display:flex;flex-direction:column;gap:4px;background:var(--surface)"><b class="display" style="font-size:var(--fs-2);margin-bottom:16px">Nimbus</b>
        ${["Overview", "Analytics", "Customers", "Billing", "Settings"].map((x, i) => `<div style="padding:8px 12px;border-radius:var(--r-sm);${i === 0 ? "background:var(--accent);color:var(--on-accent);font-weight:600" : "color:var(--muted)"}">${x}</div>`).join("")}</aside>
      <main style="padding:28px;display:flex;flex-direction:column;gap:var(--gap)">
        <div style="display:flex;justify-content:space-between;align-items:center"><h2 style="font-size:var(--fs-4)">Overview</h2><div style="display:flex;gap:8px"><input class="input" placeholder="Search" style="width:220px"><button class="btn btn-primary">New report</button></div></div>
        <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:var(--gap)">
          ${[["Revenue", "$48.2k", "+12%"], ["Active users", "3,912", "+4%"], ["Churn", "1.8%", "-0.3%"], ["NPS", "62", "+5"]].map(([l, v, d]) => `<div class="panel" style="padding:var(--pad)"><div class="label">${l}</div><div class="display" style="font-size:var(--fs-4);font-weight:700;margin:6px 0">${v}</div><span class="chip">${d}</span></div>`).join("")}</div>
        <div style="display:grid;grid-template-columns:2fr 1fr;gap:var(--gap);flex:1">
          <div class="panel" style="padding:var(--pad);display:flex;flex-direction:column"><b>Revenue</b><svg viewBox="0 0 400 160" preserveAspectRatio="none" style="flex:1;width:100%;margin-top:12px"><path d="M0 130 C40 120 60 90 100 95 S160 60 200 70 S260 30 300 40 S360 20 400 10 L400 160 L0 160Z" fill="color-mix(in srgb,${t.palette.accent} 18%,transparent)"/><path d="M0 130 C40 120 60 90 100 95 S160 60 200 70 S260 30 300 40 S360 20 400 10" fill="none" stroke="${t.palette.accent}" stroke-width="2.5"/></svg></div>
          <div class="panel" style="padding:var(--pad);display:flex;flex-direction:column;gap:12px"><b>Recent</b>${["Acme upgraded to Pro", "Globex paid invoice", "New signup: Hooli", "Initech opened ticket"].map((x) => `<div style="display:flex;gap:10px;align-items:center;font-size:var(--fs-0)"><span style="width:8px;height:8px;border-radius:9px;background:var(--accent)"></span>${x}</div>`).join("")}</div></div></main></div>` },

  "mobile-login": { viewport: { w: 390, h: 780 }, html: (t) => `
    <div style="min-height:100vh;display:flex;flex-direction:column;padding:56px 24px 32px;gap:var(--gap)">
      <div style="width:56px;height:56px;border-radius:var(--r-lg);background:var(--accent);margin-bottom:24px"></div>
      <h1 style="font-size:min(var(--fs-5), 44px);font-weight:700">Welcome back</h1>
      <p class="muted" style="margin-bottom:12px">Sign in to pick up where you left off.</p>
      <div class="field"><span class="label">Email</span><input class="input" value="ada@example.com"></div>
      <div class="field"><span class="label">Password</span><input class="input focus" type="password" value="secretpass"></div>
      <span style="color:var(--accent);font-size:var(--fs-0);font-weight:600;align-self:flex-end">Forgot password?</span>
      <button class="btn btn-primary" style="width:100%;margin-top:8px">Sign in</button>
      <div class="muted" style="display:flex;align-items:center;gap:12px;font-size:var(--fs-0)"><span style="flex:1;height:1px;background:var(--line)"></span>or<span style="flex:1;height:1px;background:var(--line)"></span></div>
      <button class="btn btn-secondary" style="width:100%">Continue with Apple</button>
      <button class="btn btn-secondary" style="width:100%">Continue with Google</button>
      <p class="muted" style="margin-top:auto;text-align:center;font-size:var(--fs-0)">New here? <b style="color:var(--text)">Create an account</b></p></div>` },

  pricing: { viewport: { w: 1280, h: 800 }, html: (t) => `
    <div style="padding:56px 80px;display:flex;flex-direction:column;align-items:center;gap:40px">
      <div style="text-align:center;display:flex;flex-direction:column;gap:12px;align-items:center"><span class="chip">Pricing</span><h1 style="font-size:var(--fs-5);font-weight:700">Simple plans for every team</h1><p class="muted">Start free. Upgrade when you're ready.</p></div>
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;width:100%;align-items:stretch">
        ${[["Starter", "$0", ["3 projects", "Basic analytics", "Community support"]], ["Pro", "$24", ["Unlimited projects", "Advanced analytics", "Priority support", "Custom domains"]], ["Enterprise", "Custom", ["SSO & SAML", "Audit logs", "Dedicated manager"]]].map(([n, p, f], i) => `
        <div class="panel" style="padding:calc(var(--pad)*2);display:flex;flex-direction:column;gap:16px;${i === 1 ? "outline:2px solid var(--accent);outline-offset:-2px;transform:translateY(-8px)" : ""}">
          <div style="display:flex;justify-content:space-between"><b style="font-size:var(--fs-2)">${n}</b>${i === 1 ? `<span class="chip">Popular</span>` : ""}</div>
          <div><span class="display" style="font-size:var(--fs-5);font-weight:700">${p}</span>${p.startsWith("$") ? `<span class="muted">/mo</span>` : ""}</div>
          <div style="display:flex;flex-direction:column;gap:10px;flex:1">${f.map((x) => `<div style="display:flex;gap:10px;align-items:center"><span style="color:var(--accent)">${ICON.check}</span>${x}</div>`).join("")}</div>
          <button class="btn ${i === 1 ? "btn-primary" : "btn-secondary"}" style="width:100%">${i === 2 ? "Contact sales" : "Choose " + n}</button></div>`).join("")}</div></div>` },

  settings: { viewport: { w: 390, h: 780 }, html: (t) => `
    <div style="padding:48px 20px 24px;display:flex;flex-direction:column;gap:var(--gap)">
      <h1 style="font-size:var(--fs-4);font-weight:700">Settings</h1>
      <div class="panel" style="padding:var(--pad);display:flex;gap:14px;align-items:center"><span style="width:52px;height:52px;border-radius:999px;background:var(--accent)"></span><div style="flex:1"><b>Ada Lovelace</b><div class="muted" style="font-size:var(--fs-0)">ada@example.com</div></div><span class="muted">›</span></div>
      ${[["Account", ["Profile", "Password", "Linked accounts"]], ["Preferences", ["Notifications", "Appearance", "Language"]], ["Support", ["Help center", "Send feedback"]]].map(([h, items]) => `
      <div class="label" style="margin-top:8px;text-transform:uppercase;letter-spacing:.08em">${h}</div>
      <div class="panel" style="padding:0 var(--pad)">${items.map((x, i) => `<div style="display:flex;justify-content:space-between;padding:calc(var(--pad)*.9) 0;${i ? "border-top:1px solid var(--line)" : ""}"><span>${x}</span><span class="muted">›</span></div>`).join("")}</div>`).join("")}</div>` },

  article: { viewport: { w: 1280, h: 800 }, html: (t) => `
    <header style="display:flex;justify-content:space-between;padding:24px 64px;border-bottom:1px solid var(--line)"><b class="display" style="font-size:var(--fs-3)">The Margin</b><span class="muted">Essays · Interviews · Subscribe</span></header>
    <article style="max-width:720px;margin:0 auto;padding:56px 0;display:flex;flex-direction:column;gap:20px">
      <span class="chip" style="align-self:flex-start">Design</span>
      <h1 style="font-size:min(calc(var(--fs-5) * 1.3), 60px);font-weight:700">The case for slower software</h1>
      <p class="muted" style="font-size:var(--fs-2)">Speed is a feature, until it isn't. Notes on designing tools that respect attention.</p>
      <div class="muted" style="font-size:var(--fs-0);display:flex;gap:12px;align-items:center"><span style="width:28px;height:28px;border-radius:99px;background:var(--accent)"></span>By Mira Chen · Oct 2026 · 9 min read</div>
      <div style="height:220px;border-radius:var(--r-lg);background:linear-gradient(120deg,var(--accent),color-mix(in srgb,var(--accent) 30%,var(--surface)))"></div>
      <p style="font-size:var(--fs-2);line-height:1.65">Every interface makes a quiet promise about time. Some promise to save it; the best ones promise to spend it well. When we design for speed alone, we flatten the moments where a person should pause, consider, and choose.</p></article>` },
};

// Concrete values behind a card, so generated docs can quote real tokens.
function tokensFor(t) {
  const { tags, name, ...colors } = t.palette;
  return {
    palette: { name, ...colors },
    font: t.font.name,
    ...(t.displayFont ? { displayFont: t.displayFont.name } : {}),
    radiusPx: RADII[t.radius],
    spacingPx: { pad: DENSITY[t.density].pad, gap: DENSITY[t.density].gap, control: DENSITY[t.density].ctl },
    shadow: ELEVATION[t.elevation],
    borderPx: BORDER[t.border],
    typeRatio: TYPESCALE[t.typeScale],
  };
}

// ---------- Build ----------

const cards = [];
function emit(card, t, html, viewport) {
  writeFileSync(join(OUT, "cards", `${card.id}.html`), page(t, html, viewport));
  cards.push({ ...card, tokens: tokensFor(t), source: { type: "generated", generator: "claude-code/seed-v1" }, viewport, file: `cards/${card.id}.html` });
}

rmSync(OUT, { recursive: true, force: true });
mkdirSync(join(OUT, "cards"), { recursive: true });

const neutral = { radius: "soft", density: "comfortable", elevation: "subtle", border: "hairline", typeScale: "moderate", ornament: "none" };
const SMALL = { w: 400, h: 560 };

// Palettes: one card each, neutral shape and font so color is the variable.
PALETTES.forEach((p, i) => {
  const t = { ...neutral, palette: p, font: font("Inter") };
  emit({ id: `token-palette-${String(i + 1).padStart(2, "0")}`, kind: "token", subtype: "palette", title: p.name,
    tags: { ...p.tags } }, t, TOKEN_CARDS.palette(t), SMALL);
});

// Typography: each font at a random scale, on a neutral palette.
FONTS.forEach((f, i) => {
  const t = { ...neutral, palette: pal("Paper Ink"), font: f, typeScale: pick(Object.keys(TYPESCALE)) };
  emit({ id: `token-type-${String(i + 1).padStart(2, "0")}`, kind: "token", subtype: "typography", title: `${f.name}, ${t.typeScale}`,
    tags: { typeStyle: f.style, typeScale: t.typeScale } }, t, TOKEN_CARDS.typography(t), SMALL);
});

// Shape: radius x elevation x border combos.
const shapes = [];
for (const radius of Object.keys(RADII)) for (const elevation of Object.keys(ELEVATION)) shapes.push({ radius, elevation, border: pick(Object.keys(BORDER)) });
shapes.forEach((s, i) => {
  const t = { ...neutral, ...s, palette: pal("Cobalt"), font: font("Inter") };
  emit({ id: `token-shape-${String(i + 1).padStart(2, "0")}`, kind: "token", subtype: "shape", title: `${s.radius}, ${s.elevation}, ${s.border}`,
    tags: { radius: s.radius, elevation: s.elevation, border: s.border } }, t, TOKEN_CARDS.shape(t), SMALL);
});

// Components: 7 random themes per component type.
for (const [type, render] of Object.entries(COMPONENTS)) {
  for (let i = 1; i <= 7; i++) {
    const t = randomTheme();
    emit({ id: `component-${type}-${String(i).padStart(2, "0")}`, kind: "component", subtype: type,
      title: `${type[0].toUpperCase() + type.slice(1)} · ${t.palette.name} / ${t.font.name}`,
      tags: tagsFor(t) }, t, render(t), SMALL);
  }
}

// Screens: each preset on 3 screen types, rotating so every screen type appears 6 times.
const screenTypes = Object.keys(SCREENS);
PRESETS.forEach((preset, i) => {
  for (let k = 0; k < 3; k++) {
    const type = screenTypes[(i + k * 2) % screenTypes.length];
    const s = SCREENS[type];
    emit({ id: `screen-${type}-${preset.id}`, kind: "screen", subtype: type, title: `${preset.label} ${type.replace("-", " ")}`,
      style: preset.label, tags: tagsFor(preset) }, preset, s.html(preset), s.viewport);
  }
});

writeFileSync(join(OUT, "cards.json"), JSON.stringify({ version: 1, generated: new Date().toISOString().slice(0, 10), count: cards.length, cards }, null, 2));
const by = cards.reduce((m, c) => ((m[c.kind] = (m[c.kind] || 0) + 1), m), {});
console.log(`${cards.length} cards`, by);
