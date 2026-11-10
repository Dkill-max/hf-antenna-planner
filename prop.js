// HF Antenna Planner — live propagation.
// Solar data: NOAA Space Weather Prediction Center (public, refreshed automatically).
// Maps: prop.kc2g.com (ionosonde data via GIRO/INGV), shown as images.
"use strict";

const Prop = (() => {
  const SWPC = "https://services.swpc.noaa.gov";
  const URLS = {
    flux: SWPC + "/json/f107_cm_flux.json",
    kp: SWPC + "/products/noaa-planetary-k-index.json",
    ssn: SWPC + "/json/solar-cycle/observed-solar-cycle-indices.json",
    xray: SWPC + "/json/goes/primary/xrays-6-hour.json"
  };
  const MAPS = {
    fof2: "https://prop.kc2g.com/renders/current/fof2-normal-now.svg",
    muf: "https://prop.kc2g.com/renders/current/mufd-normal-now.svg"
  };
  const REFRESH_MS = 15 * 60 * 1000;

  const tsOf = (row) => Date.parse(String(row.time_tag || row["time-tag"] || "").replace(/(T\d\d:\d\d(:\d\d)?)$/, "$1Z"));
  const latest = (rows) => rows.reduce((a, b) => (tsOf(b) > tsOf(a) ? b : a));

  // --- Parsers (tolerant of row order and of array-of-arrays or array-of-objects) ---
  function parseFlux(j) {
    const rows = j.filter((r) => r.flux > 0 && (r.frequency === 2800 || r.frequency === undefined));
    const r = latest(rows);
    return { sfi: Math.round(r.flux), time: tsOf(r) };
  }
  function parseKp(j) {
    let rows = j;
    if (Array.isArray(j[0])) { const h = j[0]; rows = j.slice(1).map((a) => Object.fromEntries(h.map((k, i) => [k, a[i]]))); }
    rows = rows.filter((r) => r.Kp !== undefined && r.Kp !== null && r.Kp !== "");
    const r = latest(rows);
    return { kp: Number(r.Kp), a: Number(r.a_running), time: tsOf(r) };
  }
  function parseSsn(j) {
    const rows = j.filter((r) => Number(r.ssn) >= 0);
    const r = latest(rows);
    return { ssn: Math.round(Number(r.ssn)), month: r["time-tag"] };
  }
  function parseXray(j) {
    const rows = j.filter((r) => r.energy === "0.1-0.8nm" && r.flux > 0);
    const r = latest(rows);
    return { flux: r.flux, cls: xrayClass(r.flux), time: tsOf(r) };
  }

  function xrayClass(f) {
    const scale = [["X", 1e-4], ["M", 1e-5], ["C", 1e-6], ["B", 1e-7], ["A", 1e-8]];
    for (const [c, base] of scale) if (f >= base) return c + (f / base).toFixed(1);
    return "A0.0";
  }

  function geomag(kp) {
    if (kp >= 5) return { label: `Storm (G${Math.min(5, Math.floor(kp) - 4)})`, level: "Poor" };
    if (kp >= 4) return { label: "Active", level: "Fair" };
    if (kp >= 3) return { label: "Unsettled", level: "Fair" };
    return { label: "Quiet", level: "Good" };
  }

  // --- Band outlook: rule-of-thumb estimate from SFI, Kp and X-ray flux ---
  const STEPS = ["Poor", "Fair", "Good"];
  const step = (r, n) => STEPS[Math.max(0, Math.min(2, STEPS.indexOf(r) + n))];
  function bandOutlook({ sfi, kp, xflux }) {
    const at = (good, fair) => (sfi >= good ? "Good" : sfi >= fair ? "Fair" : "Poor");
    const rows = [
      { bands: "80–40 m", day: "Fair", night: "Good", high: false },
      { bands: "30–20 m", day: at(90, 70), night: at(130, 100), high: false },
      { bands: "17–15 m", day: at(120, 90), night: sfi >= 170 ? "Fair" : "Poor", high: true },
      { bands: "12–10 m", day: at(150, 110), night: "Poor", high: true }
    ];
    for (const r of rows) {
      // Geomagnetic activity hurts everything, the high bands and night paths most
      if (kp >= 5) { r.day = step(r.day, -1); r.night = step(r.night, r.high ? -2 : -1); }
      else if (kp >= 4) { if (r.high) r.day = step(r.day, -1); r.night = step(r.night, -1); }
      // Flares black out the sunlit side, the low bands first
      if (xflux >= 1e-4) r.day = "Poor";
      else if (xflux >= 1e-5 && !r.high) r.day = step(r.day, -1);
    }
    return rows;
  }

  // --- Fetch with offline cache ---
  const CACHE_KEY = "hfap.prop";
  const readCache = () => { try { return JSON.parse(localStorage.getItem(CACHE_KEY)); } catch { return null; } };
  const writeCache = (d) => { try { localStorage.setItem(CACHE_KEY, JSON.stringify(d)); } catch { /* ignore */ } };

  async function getJson(url) {
    const r = await fetch(url, { cache: "no-store" });
    if (!r.ok) throw new Error(`${r.status}`);
    return r.json();
  }

  async function fetchAll() {
    const parts = { flux: parseFlux, kp: parseKp, ssn: parseSsn, xray: parseXray };
    const prev = readCache() || {};
    const out = { ...prev };
    let any = false;
    await Promise.all(Object.entries(parts).map(async ([k, parse]) => {
      try { out[k] = parse(await getJson(URLS[k])); any = true; }
      catch { /* keep the previous value for this item */ }
    }));
    if (any) { out.fetched = Date.now(); writeCache(out); }
    return { data: out, fresh: any };
  }

  return { fetchAll, readCache, bandOutlook, geomag, xrayClass, MAPS, REFRESH_MS,
    _parse: { parseFlux, parseKp, parseSsn, parseXray } };
})();

if (typeof module !== "undefined") module.exports = Prop;
