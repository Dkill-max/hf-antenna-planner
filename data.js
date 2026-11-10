// HF Antenna Planner — reference data.
// Transcribed from antenna_selection_tool.xlsx (v1.1). Edit here to change the app.
"use strict";

const GOALS = [
  {
    goal: "Local / regional (NVIS)", distance: "0–300 mi", takeoff: "60–90° (near vertical)",
    antenna: "Low inverted-V or dipole, reflector wire underneath",
    feed: "Center-fed dipole / inverted-V / fan dipole", minH: 0.1, maxH: 0.25,
    notes: "Low horizontal loop also works. Use 80/60/40 m; avoid verticals and high beams.",
    support: "Tower, mast or tree for the apex; ends tied off 8–10 ft above ground",
    feedline: "50 Ω low-loss coax (e.g., LMR-400)",
    ground: "Reflector wire ~5% longer than the dipole, directly under it on or just above the ground",
    tuning: "Trim both legs equally for lowest SWR at your center frequency"
  },
  {
    goal: "Medium range", distance: "300–1,500 mi", takeoff: "20–45°",
    antenna: "Dipole or inverted-V at moderate height",
    feed: "Center-fed dipole / inverted-V / fan dipole", minH: 0.3, maxH: 0.5,
    notes: "OCF dipole if you want several bands on one wire. 40/20 m are typical.",
    support: "Tower, mast or tall trees at both ends or the apex",
    feedline: "50 Ω low-loss coax (e.g., LMR-400)",
    ground: "None needed; a clear area under the antenna helps",
    tuning: "Trim both legs equally for lowest SWR"
  },
  {
    goal: "DX (long distance)", distance: "1,500+ mi", takeoff: "5–20° (low angle)",
    antenna: "Yagi or other beam (vertical with radials if no tower)",
    feed: "Yagi / beam (matched driven element)", minH: 0.5, maxH: 1,
    notes: "Vertical option: ground-mounted 1/4-wave with many radials (unun/choke). 20/15/10 m are the usual DX bands.",
    support: "Tower and rotator for a beam; ground mount for a vertical",
    feedline: "Low-loss coax (LMR-400 or hardline), especially on 15/10 m",
    ground: "Vertical: as many radials as you can (16+); beam: none",
    tuning: "Follow the maker's element dimensions; check SWR across the band"
  },
  {
    goal: "All-round multiband", distance: "Mixed", takeoff: "10–60°",
    antenna: "OCF dipole or doublet fed with ladder line",
    feed: "Off-center-fed dipole (OCF)", minH: 0.3, maxH: 0.5,
    notes: "Doublet with 450 Ω ladder line plus a tuner covers the most bands.",
    support: "Mast or trees at both ends; feedpoint at the off-center point",
    feedline: "50 Ω coax (OCF) or 450 Ω ladder line to a tuner (doublet)",
    ground: "None needed",
    tuning: "Check SWR on each band; a tuner covers the gaps"
  },
  {
    goal: "Limited space / HOA", distance: "Mixed", takeoff: "Varies",
    antenna: "End-fed half-wave as a sloper or in a tree",
    feed: "End-fed half-wave (EFHW)", minH: 0.15, maxH: 0.5,
    notes: "Random wire with a 9:1 unun and a tuner is the other common stealth choice.",
    support: "Tree, fence, eave or a telescoping mast",
    feedline: "50 Ω coax to the transformer",
    ground: "Short counterpoise or the coax shield, with a choke",
    tuning: "Trim the wire for lowest SWR on the lowest band; harmonics follow"
  },
  {
    goal: "Portable / field", distance: "Mixed (often NVIS)", takeoff: "Varies",
    antenna: "End-fed half-wave thrown into a tree, or a linked dipole",
    feed: "End-fed half-wave (EFHW)", minH: 0.1, maxH: 0.3,
    notes: "Hang low for regional nets, higher for distance. Use a lower-power transformer for QRP.",
    support: "Tree throw line or telescoping mast",
    feedline: "Lightweight coax (RG-8X or RG-316 for short runs)",
    ground: "Short counterpoise if needed",
    tuning: "Pre-tune at home; carry a small tuner if possible"
  }
];

// Antenna fit by goal. Ratings in GOALS order.
const ANTENNAS = [
  { type: "Center-fed dipole / inverted-V / fan dipole", fit: ["Good","Good","OK","OK","OK","Good"],
    support: "Tower, mast or tree at the center/apex; ends tied off", feedline: "50 Ω low-loss coax (e.g., LMR-400)",
    ground: "Reflector wire under it helps NVIS; otherwise none", tuning: "Trim both legs equally for lowest SWR" },
  { type: "Doublet with 450 Ω ladder line", fit: ["Good","Good","OK","Good","OK","Poor"],
    support: "Masts or trees at both ends", feedline: "450 Ω ladder line to a tuner",
    ground: "None needed", tuning: "Tuner does the matching; keep ladder line away from metal" },
  { type: "Off-center-fed dipole (OCF)", fit: ["OK","Good","OK","Good","OK","OK"],
    support: "Masts or trees at both ends; feedpoint at the off-center point", feedline: "50 Ω coax",
    ground: "None needed", tuning: "Check SWR on each band; tuner covers gaps" },
  { type: "End-fed half-wave (EFHW)", fit: ["OK","Good","OK","Good","Good","Good"],
    support: "Tree, mast or eave; transformer at one end", feedline: "50 Ω coax to the transformer",
    ground: "Short counterpoise or choked coax shield", tuning: "Trim the wire for the lowest band; harmonics follow" },
  { type: "Folded dipole", fit: ["OK","OK","Poor","Poor","Poor","Poor"],
    support: "Masts or trees at both ends", feedline: "300 Ω twin-lead or coax via balun",
    ground: "None needed", tuning: "Trim both legs equally" },
  { type: "Full-wave / delta loop", fit: ["Good","Good","OK","Good","Poor","Poor"],
    support: "3–4 supports (trees/masts) around the loop", feedline: "50 Ω coax",
    ground: "None needed", tuning: "Trim the loop for resonance; tuner for other bands" },
  { type: "Ground-mounted 1/4-wave vertical", fit: ["Poor","OK","Good","OK","Good","OK"],
    support: "Ground mount stake or short pipe", feedline: "50 Ω coax",
    ground: "Radials — as many as you can (16+)", tuning: "Trim the radiator; check radials are connected" },
  { type: "Random wire (non-resonant end-fed)", fit: ["OK","OK","OK","Good","Good","Good"],
    support: "Tree, fence or mast at the far end", feedline: "Short coax to the unun, then a tuner",
    ground: "Counterpoise wire(s) required", tuning: "Avoid half-wave multiples on any band; tuner required" },
  { type: "Yagi / beam (matched driven element)", fit: ["Poor","Good","Good","OK","Poor","Poor"],
    support: "Tower and rotator", feedline: "Low-loss coax (LMR-400 or hardline)",
    ground: "None", tuning: "Use the maker's dimensions; check SWR across the band" }
];

// Feed methods: typical feedpoint Z, load type, extra choke advice, notes.
const FEEDS = [
  { method: "Center-fed dipole / inverted-V / fan dipole", z: 50, load: "Balanced", choke: "Optional, at shack entry",
    notes: "Feed Z is already near 50 Ω; the balun's job is stopping common-mode current." },
  { method: "Doublet with 450 Ω ladder line", z: 200, load: "Balanced", choke: "Recommended",
    notes: "Z at the tuner varies widely by band; enter a measured value if you have one. Balun goes where ladder line meets coax." },
  { method: "Off-center-fed dipole (OCF)", z: 200, load: "Balanced", choke: "Yes, strongly recommended",
    notes: "Common-mode current is high on OCFs." },
  { method: "End-fed half-wave (EFHW)", z: 2450, load: "Unbalanced", choke: "Yes, near the transformer",
    notes: "High-power EFHW transformers are large and run warm; less ideal for pure NVIS." },
  { method: "Folded dipole", z: 300, load: "Balanced", choke: "Optional",
    notes: "Rarely used for HF wire NVIS." },
  { method: "Full-wave / delta loop", z: 100, load: "Balanced", choke: "Optional",
    notes: "A low horizontal loop is a good NVIS antenna." },
  { method: "Ground-mounted 1/4-wave vertical", z: 36, load: "Unbalanced", choke: "Optional",
    notes: "Mostly low-angle radiation; poor for NVIS." },
  { method: "Random wire (non-resonant end-fed)", z: 450, load: "Unbalanced", choke: "Yes",
    notes: "Use with a tuner; 9:1 unun is the common choice." },
  { method: "Yagi / beam (matched driven element)", z: 50, load: "Balanced", choke: "Recommended",
    notes: "Driven element is usually matched to ~50 Ω (hairpin/gamma); a 1:1 choke at the feedpoint keeps the coax quiet." }
];

// Standard transformer impedance ratios.
const RATIOS = [
  { ratio: 1, use: "Dipoles, inverted-V, fan dipoles (choke only)" },
  { ratio: 1.5, use: "~75 Ω loads" },
  { ratio: 2, use: "~100 Ω loops, or step-down for ~25 Ω verticals" },
  { ratio: 4, use: "OCF dipoles, ladder line at the tuner" },
  { ratio: 6, use: "Folded dipoles (~300 Ω)" },
  { ratio: 9, use: "Random wire end-feds" },
  { ratio: 16, use: "~800 Ω loads" },
  { ratio: 49, use: "End-fed half-wave (EFHW)" },
  { ratio: 64, use: "EFHW, higher-Z versions" }
];

// Core material by frequency (lookup: highest "from" not above the frequency).
const CORES = [
  { from: 0, core: "Mix 31 (best choking below ~10 MHz)" },
  { from: 5, core: "Mix 31 or 43" },
  { from: 10, core: "Mix 43" },
  { from: 30, core: "Mix 61" }
];

const AVOID = [
  ["Local / regional (NVIS)", "Verticals (e.g., Hustler 6BTV)", "Verticals have a null straight overhead"],
  ["Local / regional (NVIS)", "Dipole higher than ~½ λ", "Pattern shifts to low-angle DX instead of straight up"],
  ["Local / regional (NVIS)", "Beams / Yagis", "Designed for low-angle gain, not high-angle coverage"],
  ["Local / regional (NVIS)", "20 m and higher bands", "Usually above the critical frequency, so signals pass through the ionosphere instead of coming back nearby"],
  ["Medium range", "Very low dipole (under ~0.15 λ)", "Most energy goes straight up; better for NVIS than 300–1,500 mi"],
  ["Medium range", "Short verticals with few radials", "Ground losses waste power"],
  ["Medium range", "80 m in daytime for this range", "D-layer absorption is heavy; 40/20 m work better"],
  ["DX (long distance)", "Low dipole (under ~¼ λ)", "High-angle pattern; little energy at DX angles"],
  ["DX (long distance)", "Vertical without a good radial system", "Ground losses eat most of the low-angle advantage"],
  ["DX (long distance)", "Lossy coax (RG-58 / RG-8X) on long runs", "Loss climbs fast on 15/10 m"],
  ["DX (long distance)", "Wire antennas close to the beam", "Interaction detunes the beam and spoils its pattern"],
  ["All-round multiband", "Single-band dipole used on other bands without a tuner", "SWR is far too high off its design band"],
  ["All-round multiband", "OCF without a coax choke", "High common-mode current — RF in the shack, noise pickup"],
  ["All-round multiband", "Ladder line touching metal or lying on the ground", "Upsets balance and adds loss"],
  ["Limited space / HOA", "Random wire with no counterpoise", "The coax shield becomes the radiator — RF in the shack"],
  ["Limited space / HOA", "High power close to the house", "RF exposure and interference to household electronics"],
  ["Limited space / HOA", "Skipping the choke at the transformer", "Feedline radiates and picks up house noise"],
  ["Portable / field", "Heavy legal-limit transformers", "Too much weight for a tree or a portable mast"],
  ["Portable / field", "Antennas that need a tuner when you don't carry one", "You can't load them on all bands"],
  ["Portable / field", "EFHW wire end within reach at high power", "The end of an EFHW carries high RF voltage"],
  ["Portable / field", "Laying wire on or near the ground", "Heavy ground loss and detuning"]
];

// NVIS band set (Band Heights / Band Calculations tabs).
const NVIS_BANDS = [
  { band: "80 m", freq: 3.75, hMin: 25, hMax: 40, z: 45, role: "Night / winter and statewide nets" },
  { band: "60 m", freq: 5.357, hMin: 20, hMax: 30, z: 48, role: "Optional third element — ECOMM nets" },
  { band: "40 m", freq: 7.15, hMin: 15, hMax: 25, z: 50, role: "Daytime NVIS; often fails at night and in winter as cycle 25 declines" }
];

const NVIS_BALUN_SPEC = [
  ["Type", "1:1 current balun (common-mode choke)", "Dipole feed Z is already close to 50 Ω — no impedance transformation needed; the job is to stop common-mode current on the coax."],
  ["Power rating", "{power}", "Station power × safety margin. Low SWR helps, but choke heating at high power is the usual failure."],
  ["Choking impedance", "≥ 2,000 Ω on 80/60/40 m", "At least 1,000 Ω minimum; 3–5 kΩ is better. Check the maker's choke-impedance chart at 3.5 and 7 MHz."],
  ["Core material", "Mix 31 (or stacked 31 toroids)", "Mix 31 gives the most choking on the low HF bands; mix 43 falls off below ~5 MHz, mix 61 is for higher bands."],
  ["Winding", "Coax or bifilar PTFE wire on stacked toroids", "Large toroids (2.4\" OD) stacked 2–3 high handle legal limit."],
  ["Connector", "SO-239 to match the coax PL-259", "Weatherproof the connection, especially in Florida humidity."],
  ["Second choke (optional)", "At the shack entry or ~λ/4 down the feedline", "Helps if RF in the shack or noise pickup on the coax shield shows up."]
];

const NVIS_ALT_FEEDS = [
  ["Center-fed dipole / inverted-V / fan dipole", "~35–60 Ω", "1:1 current balun", "Recommended setup for NVIS."],
  ["Doublet with 450 Ω ladder line", "Wide range", "4:1 or 1:1 current balun at the tuner", "Needs a wide-range tuner; balun goes where ladder line meets coax."],
  ["Off-center-fed dipole (OCF)", "~200–300 Ω", "4:1 current balun + feedline choke", "Common-mode current is high on OCFs — add a 1:1 choke on the coax."],
  ["End-fed half-wave (EFHW)", "~2,000–3,500 Ω", "49:1 (or 64:1) unun", "High-power EFHW transformers are large and run warm. Less ideal for pure NVIS."],
  ["Folded dipole", "~300 Ω", "4:1 or 6:1 balun", "Rarely used for wire HF NVIS."]
];

// Amateur band edges (MHz) used to label the frequency display.
const HAM_BANDS = [
  ["160 m", 1.8, 2.0], ["80 m", 3.5, 4.0], ["60 m", 5.3305, 5.4065], ["40 m", 7.0, 7.3],
  ["30 m", 10.1, 10.15], ["20 m", 14.0, 14.35], ["17 m", 18.068, 18.168], ["15 m", 21.0, 21.45],
  ["12 m", 24.89, 24.99], ["10 m", 28.0, 29.7], ["6 m", 50.0, 54.0]
];

// One-tap band buttons on the frequency display (typical center frequencies, MHz).
const BAND_PICKS = [
  ["160", 1.9], ["80", 3.75], ["60", 5.357], ["40", 7.15], ["30", 10.125], ["20", 14.2],
  ["17", 18.1], ["15", 21.2], ["12", 24.94], ["10", 28.4]
];

const DEFAULT_SETTINGS = {
  power: 1500,          // station power, W PEP
  margin: 2,            // transformer power safety margin (×)
  sysZ: 50,             // system impedance, Ω
  okSWR: 1.5,           // acceptable SWR without an impedance transformer
  lambdaK: 983.6,       // wavelength constant, ft·MHz
  dipoleK: 468,         // half-wave dipole constant, ft·MHz
  invVShort: 0.03,      // inverted-V shortening
  reflector: 0.05       // reflector wire extra length
};
