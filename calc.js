// HF Antenna Planner — calculations. Mirrors the workbook formulas.
"use strict";

const Calc = (() => {
  const goalRow = (goal) => GOALS.find((g) => g.goal === goal) || GOALS[0];
  const goalIndex = (goal) => Math.max(0, GOALS.findIndex((g) => g.goal === goal));
  const antennaRow = (type) => ANTENNAS.find((a) => a.type === type);
  const feedRow = (method) => FEEDS.find((f) => f.method === method) || FEEDS[0];

  // Higher Z ÷ lower Z (also the mismatch SWR when fed directly)
  const zRatio = (z, sysZ) => Math.max(z, sysZ) / Math.min(z, sysZ);

  // Best standard ratio: 1 if the mismatch is acceptable, else the ratio leaving the lowest SWR.
  function bestRatio(r, okSWR) {
    let best = RATIOS[0].ratio, bestD = Infinity;
    for (const { ratio } of RATIOS) {
      const d = ratio > r ? ratio / r : r / ratio;
      if (d < bestD) { bestD = d; best = ratio; }
    }
    if (r <= okSWR) return { ratio: 1, swrAfter: r };
    return { ratio: best, swrAfter: bestD };
  }

  function core(freq) {
    let out = CORES[0].core;
    for (const c of CORES) if (freq >= c.from) out = c.core;
    return out;
  }

  function hamBand(freq) {
    const b = HAM_BANDS.find(([, lo, hi]) => freq >= lo && freq <= hi);
    return b ? b[0] : null;
  }

  function transformerName(ratio, load) {
    if (ratio === 1) return "1:1 current balun / common-mode choke";
    return `${ratio}:1 ${load === "Balanced" ? "current balun" : "unun"}`;
  }

  // Antenna Selector tab
  function selector({ goal, freq, override, measuredZ }, s) {
    const g = goalRow(goal);
    const ant = override ? antennaRow(override) : null;
    const fit = ant ? ant.fit[goalIndex(goal)] : null;
    const feed = override || g.feed;
    const fr = feedRow(feed);
    const lambda = s.lambdaK / freq;
    const halfWave = s.dipoleK / freq;
    const isVertical = feed === "Ground-mounted 1/4-wave vertical";
    const hMin = Math.round(g.minH * lambda), hMax = Math.round(g.maxH * lambda);
    const z = Number.isFinite(measuredZ) && measuredZ > 0 ? measuredZ : fr.z;
    const swrNo = zRatio(z, s.sysZ);
    const { ratio } = bestRatio(swrNo, s.okSWR);
    const power = s.power * s.margin;
    const transformer = transformerName(ratio, fr.load);
    const centerFed = feed.startsWith("Center-fed");
    const pick = (key) => (ant ? ant[key] : g[key]);
    return {
      goal: g, fit, feed, feedRow: fr, lambda, halfWave, centerFed,
      antenna: override ? `${override} (your choice)` : g.antenna,
      height: isVertical ? "Ground mounted (base at ground level, with radials)" : `${hMin}–${hMax} ft`,
      heightShort: isVertical ? "Ground mounted" : `${hMin}–${hMax} ft`,
      z, zIsMeasured: Number.isFinite(measuredZ) && measuredZ > 0,
      swrNo, ratio, transformer, power, core: core(freq), choke: fr.choke,
      support: pick("support"), feedline: pick("feedline"), ground: pick("ground"), tuning: pick("tuning"),
      band: hamBand(freq),
      nvisTooHigh: g.goal === NVIS_GOAL && freq > NVIS_MAX_MHZ
    };
  }

  // Transformer Calculator tab
  function transformer({ method, measuredZ, lowFreq }, s) {
    const fr = feedRow(method);
    const z = Number.isFinite(measuredZ) && measuredZ > 0 ? measuredZ : fr.z;
    const r = zRatio(z, s.sysZ);
    const { ratio, swrAfter } = bestRatio(r, s.okSWR);
    const direction = z === s.sysZ ? "None needed (matched)"
      : `${z > s.sysZ ? "Step-up" : "Step-down"} (${s.sysZ} Ω → ${z} Ω)`;
    return {
      feedRow: fr, z, direction, ratioNeeded: r, swrNo: r, ratio, turns: Math.sqrt(ratio),
      swrAfter, load: fr.load, type: transformerName(ratio, fr.load),
      power: s.power * s.margin, core: core(lowFreq), choke: fr.choke, notes: fr.notes,
      table: RATIOS.map((x) => ({ ...x, turns: Math.sqrt(x.ratio), swr: Math.max(r / x.ratio, x.ratio / r) }))
    };
  }

  // Band Calculations tab
  function nvisBand(b, s) {
    const lambda = s.lambdaK / b.freq;
    const flat = s.dipoleK / b.freq;
    const invV = flat * (1 - s.invVShort);
    const r = zRatio(b.z, s.sysZ);
    const { ratio } = bestRatio(r, s.okSWR);
    return {
      lambda, h01: 0.1 * lambda, h025: 0.25 * lambda, flat, flatLeg: flat / 2, invV, invVLeg: invV / 2,
      reflector: flat * (1 + s.reflector), swr: r,
      transformer: ratio === 1 ? "1:1 current balun / common-mode choke" : `${ratio}:1 current balun`
    };
  }

  const avoidFor = (goal) => AVOID.filter(([g]) => g === goal).map(([, what, why]) => ({ what, why }));

  return { selector, transformer, nvisBand, avoidFor, hamBand, core, bestRatio };
})();

if (typeof module !== "undefined") module.exports = Calc;
