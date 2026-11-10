// HF Antenna Planner — UI
"use strict";

const APP_VERSION = "1.1.0";
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const n0 = (x) => Math.round(x).toLocaleString("en-US");
const n1 = (x) => (Math.round(x * 10) / 10).toFixed(1);
const n2 = (x) => (Math.round(x * 100) / 100).toFixed(2);

// ---------- Saved state (per device) ----------
const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem("hfap." + key); return v === null ? fallback : JSON.parse(v); }
    catch { return fallback; }
  },
  set(key, value) { try { localStorage.setItem("hfap." + key, JSON.stringify(value)); } catch { /* storage unavailable */ } }
};

const state = {
  tab: store.get("tab", "antenna"),
  goal: store.get("goal", "Local / regional (NVIS)"),
  freq: store.get("freq", 7.15),
  override: store.get("override", ""),
  measZ: store.get("measZ", ""),
  tcMethod: store.get("tcMethod", FEEDS[0].method),
  tcZ: store.get("tcZ", ""),
  tcLow: store.get("tcLow", 3.5),
  bands: store.get("bands", NVIS_BANDS.map((b) => ({ freq: b.freq, z: b.z }))),
  checks: store.get("checks", {}),
  notes: store.get("notes", ""),
  settings: { ...DEFAULT_SETTINGS, ...store.get("settings", {}) }
};
if (!GOALS.some((g) => g.goal === state.goal)) state.goal = GOALS[0].goal;

const parseNum = (v) => {
  const x = parseFloat(String(v).replace(",", "."));
  return Number.isFinite(x) ? x : NaN;
};

// ---------- Tabs ----------
function showTab(name) {
  state.tab = name; store.set("tab", name);
  document.querySelectorAll(".tab").forEach((t) => { t.hidden = t.id !== "tab-" + name; });
  document.querySelectorAll(".tabbar button").forEach((b) => {
    if (b.dataset.tab === name) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current");
  });
  window.scrollTo(0, 0);
  if (name === "prop") refreshProp(false);
}
document.querySelectorAll(".tabbar button").forEach((b) => b.addEventListener("click", () => showTab(b.dataset.tab)));

// ---------- Spec-list helper ----------
function specRows(rows) {
  return rows.filter(Boolean).map(([dt, dd, how, key]) =>
    `<div${key ? ' class="key"' : ""}><dt>${esc(dt)}</dt><dd>${dd}${how ? `<span class="how">${esc(how)}</span>` : ""}</dd></div>`
  ).join("");
}
const fitBadge = (fit) => `<span class="fit fit-${esc(fit)}">${esc(fit)}</span>`;

// ---------- Antenna tab ----------
function buildAntennaControls() {
  $("goals").innerHTML = GOALS.map((g, i) => `
    <label><input type="radio" name="goal" value="${esc(g.goal)}" ${g.goal === state.goal ? "checked" : ""}>
    <span>${esc(g.goal)}</span></label>`).join("");
  $("goals").addEventListener("change", (e) => {
    state.goal = e.target.value; store.set("goal", state.goal); renderAll();
  });

  $("override").innerHTML = `<option value="">Use the goal's pick</option>` +
    ANTENNAS.map((a) => `<option>${esc(a.type)}</option>`).join("");
  $("override").value = state.override;
  $("override").addEventListener("change", (e) => { state.override = e.target.value; store.set("override", state.override); renderAll(); });

  $("measZ").value = state.measZ;
  $("measZ").addEventListener("input", (e) => { state.measZ = e.target.value; store.set("measZ", state.measZ); renderAll(); });

  const f = $("freq");
  f.value = state.freq.toFixed(3);
  f.addEventListener("input", () => {
    const x = parseNum(f.value);
    const ok = x > 0 && x <= 1000;
    f.setAttribute("aria-invalid", ok ? "false" : "true");
    if (ok) { state.freq = x; store.set("freq", x); renderAll(); }
    else $("freq-help").textContent = "Enter a frequency in MHz, for example 7.150";
  });
  f.addEventListener("focus", () => f.select());
  f.addEventListener("blur", () => { f.value = state.freq.toFixed(3); f.setAttribute("aria-invalid", "false"); renderAll(); });
  f.addEventListener("keydown", (e) => { if (e.key === "Enter") f.blur(); });
}

function selectorResult() {
  return Calc.selector({ goal: state.goal, freq: state.freq, override: state.override, measuredZ: parseNum(state.measZ) }, state.settings);
}

function renderAntenna(r) {
  $("d-band").textContent = r.band || "Outside the ham bands";
  $("d-goal").textContent = r.goal.goal;
  if ($("freq").getAttribute("aria-invalid") !== "true")
    $("freq-help").textContent = `λ ${n1(r.lambda)} ft · tap the frequency to change it`;
  $("d-answer").innerHTML = `<strong>${esc(r.antenna)}</strong><br>${esc(r.heightShort)}${r.heightShort.endsWith("ft") ? " high" : ""} · ${esc(r.transformer)}` +
    (r.fit === "Poor" ? `<br>⚠ Poor fit for this goal` : "");

  const w = $("fit-warning");
  if (r.fit === "Poor") {
    w.hidden = false;
    w.innerHTML = `⚠ ${esc(state.override)} is a poor fit for ${esc(r.goal.goal)}. <a href="#" data-goto="build">See what to avoid</a>`;
  } else w.hidden = true;

  const s = state.settings;
  const lenHow = r.centerFed ? `${n1(r.halfWave / 2)} ft per leg. ${s.dipoleK} ÷ frequency; cut long and trim.` : `${s.dipoleK} ÷ frequency; cut long and trim. Beams: use the maker's dimensions.`;
  $("rec").innerHTML = specRows([
    ["Antenna", esc(r.antenna), state.override ? null : r.goal.notes, true],
    r.fit ? ["Fit with goal", fitBadge(r.fit), "From the antenna fit table"] : null,
    ["Mounting height", esc(r.height), `${r.goal.minH}–${r.goal.maxH} λ for this goal`, true],
    ["Transformer", esc(r.transformer), `Rated ≥ ${n0(r.power)} W PEP · ${r.core}`, true],
    ["Distance covered", esc(r.goal.distance)],
    ["Takeoff angle", esc(r.goal.takeoff)],
    ["Wavelength", `${n1(r.lambda)} ft`, `${s.lambdaK} ÷ frequency`],
    ["Half-wave length", `${n1(r.halfWave)} ft`, lenHow],
    ["Feed method", esc(r.feed)],
    ["Feedpoint Z", `${n0(r.z)} Ω`, r.zIsMeasured ? "Your measured value" : "Typical for this feed method"],
    ["SWR with no transformer", `${n2(r.swrNo)}:1`, "Higher Z ÷ lower Z"],
    ["Extra coax choke", esc(r.choke)]
  ]);
}

// ---------- Build tab ----------
const CHECK_ICONS = {
  todo: "",
  progress: `<svg viewBox="0 0 24 24"><path d="M6 12h12"/></svg>`,
  done: `<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>`
};
const NEXT = { todo: "progress", progress: "done", done: "todo" };
const STATE_LABEL = { todo: "not started", progress: "in progress", done: "done" };

function checklistKey() { return state.goal + "|" + (state.override || ""); }

function renderBuild(r) {
  const s = state.settings;
  $("build-for").textContent = `${r.goal.goal} at ${state.freq.toFixed(3)} MHz` +
    (state.override ? ` with ${state.override} (fit: ${r.fit})` : "") + ". Tap the circle to mark progress.";

  const antNote = state.override
    ? (r.fit === "Poor" ? "⚠ Poor fit for this goal — see What to avoid. " : `Fit for this goal: ${r.fit}. `) + `Goal's suggestion: ${r.goal.antenna}`
    : r.goal.notes;
  const lenValue = `${n1(r.halfWave)} ft half-wave` + (r.centerFed ? ` (${n1(r.halfWave / 2)} ft per leg)` : "");
  const items = [
    ["Antenna", r.antenna, antNote],
    ["Mounting height", r.height, `Takeoff angle ${r.goal.takeoff}; distance ${r.goal.distance}`],
    ["Support", r.support, ""],
    ["Starting wire length", lenValue, "Reference length only — cut a little long and trim. Beams: use the maker's dimensions."],
    ["Feed method", r.feed, `Typical feedpoint ${n0(r.z)} Ω`],
    ["Transformer", r.transformer, `SWR without it ≈ ${n1(r.swrNo)}:1`],
    ["Power rating", `≥ ${n0(r.power)} W PEP`, `Station power × safety margin (${n0(s.power)} W × ${s.margin})`],
    ["Core material", r.core, `Based on ${state.freq.toFixed(3)} MHz`],
    ["Coax choke", r.choke, ""],
    ["Feedline", r.feedline, ""],
    ["Ground / reflector", r.ground, ""],
    ["Tuning", r.tuning, ""]
  ];
  const saved = state.checks[checklistKey()] || {};
  $("checklist").innerHTML = items.map(([title, value, note], i) => {
    const st = saved[i] || "todo";
    return `<li data-state="${st}">
      <button class="check" type="button" data-i="${i}" data-state="${st}" aria-label="${esc(title)}: ${STATE_LABEL[st]}. Tap to change.">${CHECK_ICONS[st]}</button>
      <div><span class="item-title">${esc(title)}</span>
      <span class="item-value">${esc(value)}</span>${note ? `<span class="item-note">${esc(note)}</span>` : ""}</div></li>`;
  }).join("");

  const aw = $("avoid-warning");
  if (r.fit === "Poor") { aw.hidden = false; aw.textContent = `⚠ Your chosen antenna (${state.override}) is rated Poor for this goal.`; }
  else aw.hidden = true;
  const avoid = Calc.avoidFor(r.goal.goal);
  $("avoid").innerHTML = avoid.length
    ? avoid.map((a) => `<li><strong>${esc(a.what)}</strong><span>${esc(a.why)}</span></li>`).join("")
    : `<li>Nothing listed for this goal.</li>`;
}

$("checklist").addEventListener("click", (e) => {
  const b = e.target.closest(".check"); if (!b) return;
  const key = checklistKey();
  const saved = state.checks[key] || {};
  const next = NEXT[b.dataset.state];
  if (next === "todo") delete saved[b.dataset.i]; else saved[b.dataset.i] = next;
  state.checks[key] = saved; store.set("checks", state.checks);
  renderBuild(selectorResult());
  const again = document.querySelector(`.check[data-i="${b.dataset.i}"]`); if (again) again.focus();
});
$("clear-checks").addEventListener("click", () => {
  delete state.checks[checklistKey()]; store.set("checks", state.checks); renderBuild(selectorResult());
});
$("notes").value = state.notes;
$("notes").addEventListener("input", (e) => { state.notes = e.target.value; store.set("notes", state.notes); });

// ---------- Balun tab ----------
function buildBalunControls() {
  $("tc-method").innerHTML = FEEDS.map((f) => `<option>${esc(f.method)}</option>`).join("");
  $("tc-method").value = state.tcMethod;
  $("tc-method").addEventListener("change", (e) => { state.tcMethod = e.target.value; store.set("tcMethod", state.tcMethod); renderBalun(); });
  $("tc-z").value = state.tcZ;
  $("tc-z").addEventListener("input", (e) => { state.tcZ = e.target.value; store.set("tcZ", state.tcZ); renderBalun(); });
  $("tc-low").value = state.tcLow;
  $("tc-low").addEventListener("input", (e) => {
    const x = parseNum(e.target.value); if (x > 0) { state.tcLow = x; store.set("tcLow", x); renderBalun(); }
  });
}

function renderBalun() {
  const t = Calc.transformer({ method: state.tcMethod, measuredZ: parseNum(state.tcZ), lowFreq: state.tcLow }, state.settings);
  $("tc-answer").innerHTML = `${esc(t.type)}<small>Rated ≥ ${n0(t.power)} W PEP · ${esc(t.core)} cores</small>`;
  $("tc-results").innerHTML = specRows([
    ["Feedpoint Z used", `${n0(t.z)} Ω`, Number.isFinite(parseNum(state.tcZ)) && parseNum(state.tcZ) > 0 ? "Your measured value" : "Typical for this feed method"],
    ["Direction", esc(t.direction)],
    ["Impedance ratio needed", `${n2(t.ratioNeeded)}:1`, "Higher Z ÷ lower Z"],
    ["SWR with no transformer", `${n2(t.swrNo)}:1`, `Below ${state.settings.okSWR}:1, a 1:1 choke is enough`],
    ["Recommended ratio", `${t.ratio}:1`, `Turns ratio ${n2(t.turns)}:1`, true],
    ["SWR with that ratio", `${n2(t.swrAfter)}:1`, "Remaining mismatch after the transformer"],
    ["Load type", esc(t.load), "Balanced → balun, unbalanced → unun"],
    ["Extra coax choke", esc(t.choke)],
    ["Notes", esc(t.notes)]
  ]);
  $("tc-table").innerHTML = t.table.map((x) =>
    `<tr${x.ratio === t.ratio ? ' class="best"' : ""}><td>${x.ratio}:1</td><td>${n2(x.turns)}</td><td>${n2(x.swr)}</td><td>${esc(x.use)}</td></tr>`).join("");
}

// ---------- NVIS tab ----------
function buildNvis() {
  $("nvis-bands").innerHTML = NVIS_BANDS.map((b, i) => `
    <div class="block" data-band="${i}">
      <div class="band-head"><h2>${esc(b.band)}</h2><span class="muted">Ideal height ${b.hMin}–${b.hMax} ft</span></div>
      <p class="band-role">${esc(b.role)}</p>
      <div class="band-inputs">
        <label class="field"><span>Center freq (MHz)</span>
          <input type="number" inputmode="decimal" step="any" min="0.1" data-k="freq" value="${state.bands[i].freq}"></label>
        <label class="field"><span>Feedpoint Z (Ω)</span>
          <input type="number" inputmode="decimal" step="any" min="1" data-k="z" value="${state.bands[i].z}"></label>
      </div>
      <dl class="spec" id="nvis-out-${i}"></dl>
    </div>`).join("");
  $("nvis-bands").addEventListener("input", (e) => {
    const box = e.target.closest("[data-band]"); if (!box) return;
    const x = parseNum(e.target.value); if (!(x > 0)) return;
    state.bands[box.dataset.band][e.target.dataset.k] = x; store.set("bands", state.bands); renderNvis();
  });
}

function renderNvis() {
  const s = state.settings;
  NVIS_BANDS.forEach((b, i) => {
    const c = Calc.nvisBand({ ...b, ...state.bands[i] }, s);
    $("nvis-out-" + i).innerHTML = specRows([
      ["Inverted-V length", `${n1(c.invV)} ft`, `${n1(c.invVLeg)} ft per leg (${Math.round(s.invVShort * 100)}% shorter than flat)`, true],
      ["Flat dipole length", `${n1(c.flat)} ft`, `${n1(c.flatLeg)} ft per leg`],
      ["Reflector wire", `${n1(c.reflector)} ft`, `${Math.round(s.reflector * 100)}% longer than the dipole, directly under it`],
      ["0.1–0.25 λ height", `${n1(c.h01)}–${n1(c.h025)} ft`, `Wavelength ${n1(c.lambda)} ft`],
      ["Est. SWR at resonance", `${n2(c.swr)}:1`],
      ["Transformer", esc(c.transformer)]
    ]);
  });
  const power = `≥ ${n0(s.power * s.margin)} W PEP`;
  $("nvis-spec").innerHTML = specRows(NVIS_BALUN_SPEC.map(([a, b, c]) => [a, esc(b.replace("{power}", power)), c]));
  $("nvis-alt").innerHTML = specRows(NVIS_ALT_FEEDS.map(([a, z, t, note]) => [a, esc(t), `${z}. ${note}`]));
}

// ---------- Station tab ----------
const SETTING_FIELDS = [
  ["settings-main", "power", "Station power (W PEP)", "Max power you'll run"],
  ["settings-main", "margin", "Power safety margin (×)", "Transformer rating = power × margin"],
  ["settings-main", "sysZ", "System impedance (Ω)", "Radio and coax"],
  ["settings-main", "okSWR", "Acceptable SWR without a transformer", "Below this, a 1:1 choke is enough"],
  ["settings-adv", "lambdaK", "Wavelength constant (ft·MHz)", "λ = constant ÷ MHz"],
  ["settings-adv", "dipoleK", "Half-wave dipole constant (ft·MHz)", "Includes ~5% end effect"],
  ["settings-adv", "invVShort", "Inverted-V shortening (fraction)", "0.03 = 3% shorter"],
  ["settings-adv", "reflector", "Reflector extra length (fraction)", "0.05 = 5% longer"]
];
function buildSettings() {
  for (const [box, key, label, help] of SETTING_FIELDS) {
    $(box).insertAdjacentHTML("beforeend", `
      <label class="field"><span>${esc(label)}</span>
      <input type="number" inputmode="decimal" step="any" min="0" data-setting="${key}" value="${state.settings[key]}" aria-describedby="h-${key}">
      <small id="h-${key}" class="muted">${esc(help)}</small></label>`);
  }
  document.querySelectorAll("[data-setting]").forEach((inp) => inp.addEventListener("input", () => {
    const x = parseNum(inp.value); if (!(x > 0)) return;
    state.settings[inp.dataset.setting] = x; store.set("settings", state.settings); renderAll();
  }));
  $("reset-settings").addEventListener("click", () => {
    state.settings = { ...DEFAULT_SETTINGS }; store.set("settings", {});
    document.querySelectorAll("[data-setting]").forEach((inp) => { inp.value = state.settings[inp.dataset.setting]; });
    renderAll();
  });
  $("app-version").textContent = APP_VERSION;
}

// ---------- Cross-links ----------
document.addEventListener("click", (e) => {
  const a = e.target.closest("[data-goto]"); if (!a) return;
  e.preventDefault(); showTab(a.dataset.goto);
});

// ---------- Render ----------
function renderAll() {
  const r = selectorResult();
  renderAntenna(r);
  renderBuild(r);
  renderBalun();
  renderNvis();
}

// ---------- Propagation ----------
let propBusy = false;

function ago(ms) {
  const m = Math.round(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h} h ago` : `${Math.round(h / 24)} days ago`;
}
const clock = (t) => new Date(t).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

function propHeadline(d) {
  const sfi = d.flux ? d.flux.sfi : null, kp = d.kp ? d.kp.kp : 0, x = d.xray ? d.xray.flux : 0;
  if (x >= 1e-4) return ["Radio blackout from an X-class flare: daytime HF is badly affected", "Poor"];
  if (x >= 1e-5) return ["M-class flare: daytime 80 and 40 m may fade out for a while", "Fair"];
  if (kp >= 5) return ["Geomagnetic storm: expect poor HF, worst at night and on the high bands", "Poor"];
  if (kp >= 4) return ["Active geomagnetic field: some degradation, mostly on night paths", "Fair"];
  if (sfi === null) return ["Solar flux unavailable", "Fair"];
  if (sfi >= 120) return ["Quiet with strong solar flux: good HF conditions", "Good"];
  if (sfi >= 90) return ["Quiet: normal HF conditions", "Good"];
  return ["Quiet, but low solar flux: the higher bands will be weak", "Fair"];
}

function renderProp(d, { offline } = {}) {
  if (!d || !d.fetched) {
    $("prop-headline").textContent = offline ? "No propagation data yet. Connect to the internet and tap Refresh now." : "Loading the latest solar data…";
    $("prop-stats").innerHTML = ""; $("prop-outlook").innerHTML = ""; return;
  }
  const [text, level] = propHeadline(d);
  $("prop-headline").textContent = text; $("prop-headline").dataset.level = level;

  const g = d.kp ? Prop.geomag(d.kp.kp) : null;
  const month = d.ssn && d.ssn.month ? new Date(d.ssn.month + "-15").toLocaleString([], { month: "short", year: "numeric" }) : "";
  const stat = (dt, dd, sub) => `<div><dt>${esc(dt)}</dt><dd>${dd}${sub ? `<small>${esc(sub)}</small>` : ""}</dd></div>`;
  $("prop-stats").innerHTML = [
    stat("Solar flux", d.flux ? d.flux.sfi : "—", "SFI, 10.7 cm"),
    stat("Sunspots", d.ssn ? d.ssn.ssn : "—", month ? `${month} average` : ""),
    stat("X-ray", d.xray ? esc(d.xray.cls) : "—", "Flare level"),
    stat("Kp", d.kp ? d.kp.kp.toFixed(d.kp.kp % 1 ? 2 : 0) : "—", g ? g.label : ""),
    stat("A index", d.kp && Number.isFinite(d.kp.a) ? d.kp.a : "—", "Running"),
    stat("Updated", clock(d.fetched), ago(Date.now() - d.fetched))
  ].join("");

  const age = Date.now() - d.fetched;
  const st = $("prop-status");
  if (offline) { st.textContent = `Offline: showing data from ${ago(age)}.`; st.dataset.stale = "true"; }
  else { st.textContent = "Updates automatically every 15 minutes while the app is open."; st.dataset.stale = "false"; }

  if (d.flux && d.kp) {
    const hour = new Date().getHours(), isDay = hour >= 7 && hour < 19;
    $("col-day").classList.toggle("now", isDay); $("col-night").classList.toggle("now", !isDay);
    $("prop-outlook").innerHTML = Prop.bandOutlook({ sfi: d.flux.sfi, kp: d.kp.kp, xflux: d.xray ? d.xray.flux : 0 })
      .map((r) => `<tr><td>${esc(r.bands)}</td><td>${fitBadge(r.day)}</td><td>${fitBadge(r.night)}</td></tr>`).join("");
  }
}

function loadMaps() {
  const slot = Math.floor(Date.now() / (10 * 60 * 1000)); // new map every 10 minutes
  const set = (id, url) => { const img = $(id); const src = `${url}?t=${slot}`; if (img.getAttribute("src") !== src) img.src = src; };
  set("map-fof2", Prop.MAPS.fof2); set("map-muf", Prop.MAPS.muf);
}
$("map-fof2").addEventListener("error", () => { $("map-offline").hidden = false; });
$("map-fof2").addEventListener("load", () => { $("map-offline").hidden = true; });

async function refreshProp(force) {
  const cached = Prop.readCache();
  if (cached) renderProp(cached);
  if (!force && cached && Date.now() - cached.fetched < Prop.REFRESH_MS) { loadMaps(); return; }
  if (propBusy) return;
  propBusy = true; $("prop-refresh").disabled = true; $("prop-refresh").textContent = "Refreshing…";
  try {
    const { data, fresh } = await Prop.fetchAll();
    renderProp(data, { offline: !fresh });
  } finally {
    propBusy = false; $("prop-refresh").disabled = false; $("prop-refresh").textContent = "Refresh now";
  }
  loadMaps();
}
$("prop-refresh").addEventListener("click", () => refreshProp(true));
setInterval(() => { if (!document.hidden && state.tab === "prop") refreshProp(false); }, 60 * 1000);
document.addEventListener("visibilitychange", () => { if (!document.hidden && state.tab === "prop") refreshProp(false); });
window.addEventListener("online", () => { if (state.tab === "prop") refreshProp(true); });

// ---------- Start ----------
buildAntennaControls();
buildBalunControls();
buildNvis();
buildSettings();
renderAll();
showTab(state.tab);

// ---------- Install & offline ----------
let deferredPrompt = null;
const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
const standalone = window.matchMedia("(display-mode: standalone)").matches || navigator.standalone;
if (standalone) $("install-block").hidden = true;
else if (isIOS) $("install-android").hidden = true;
else $("install-ios").hidden = true;

window.addEventListener("beforeinstallprompt", (e) => {
  e.preventDefault(); deferredPrompt = e; $("install-btn").hidden = false;
});
$("install-btn").addEventListener("click", async () => {
  if (!deferredPrompt) return;
  deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt = null; $("install-btn").hidden = true;
});
window.addEventListener("appinstalled", () => { $("install-block").hidden = true; });

if ("serviceWorker" in navigator && location.protocol !== "file:") {
  navigator.serviceWorker.register("sw.js").then((reg) => {
    const offer = (w) => {
      $("update-bar").hidden = false;
      $("update-btn").onclick = () => w.postMessage("skipWaiting");
    };
    if (reg.waiting && navigator.serviceWorker.controller) offer(reg.waiting);
    reg.addEventListener("updatefound", () => {
      const w = reg.installing;
      w && w.addEventListener("statechange", () => {
        if (w.state === "installed" && navigator.serviceWorker.controller) offer(w);
      });
    });
  }).catch(() => { /* offline support unavailable; the app still works online */ });
  let reloaded = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => { if (!reloaded) { reloaded = true; location.reload(); } });
}
