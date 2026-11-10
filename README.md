# HF Antenna Planner

Pick an HF antenna, mounting height, feed method and feedpoint transformer (balun/unun) for your operating goal. It also gives you a build checklist and a list of things to avoid.

**Open the app: https://dkill-max.github.io/hf-antenna-planner/**

Works on phones, tablets and computers. Install it to your home screen and it works offline. By W4NEM.

## Install on a phone or tablet

- **iPhone / iPad:** open the link in Safari, tap **Share**, then **Add to Home Screen**.
- **Android:** open the link in Chrome, tap **⋮**, then **Install app** (or **Add to Home screen**).

## What's in the app

| Tab | What it does |
|---|---|
| Antenna | Pick a goal and frequency (and optionally an antenna type). Shows the full recommendation. |
| Prop | Live solar flux, sunspots, Kp/A index and X-ray level, a band outlook, and live foF2/MUF maps for checking NVIS. Updates automatically. |
| Build | Build checklist you can tick off, what to avoid for your goal, and your own station notes. |
| Balun | Transformer calculator for any feed method or measured impedance. |
| NVIS | Per-band wire lengths, heights, reflector length and balun spec for 80 / 60 / 40 m. |
| Station | Your power, impedance and constants; install help; how to use; the spreadsheet download. |

Settings, checklist progress and notes are saved on each device. Nothing is sent anywhere.

Propagation data: solar and geomagnetic numbers come from the [NOAA Space Weather Prediction Center](https://www.swpc.noaa.gov/); foF2 and MUF maps come from [prop.kc2g.com](https://prop.kc2g.com/), using ionosonde data from GIRO and INGV. The band outlook is a rule-of-thumb estimate (logic in `prop.js`).

## Spreadsheet version

**[Download antenna_selection_tool.xlsx](antenna_selection_tool.xlsx?raw=true)** — the same planner as an Excel workbook (Microsoft 365 or Excel 2021+).

## Updating the app

- Reference data (goals, antennas, feed methods, avoid list) is in `data.js`.
- Calculations are in `calc.js`; propagation is in `prop.js`; the screens are in `app.js`, `index.html` and `app.css`.
- **When you change any file, also change the version in `sw.js` (for example `hfap-v1.1.0` → `hfap-v1.1.1`).** That tells installed copies to download the update. Users then see a "new version is ready" bar.

## Notes

- All lengths, heights and impedances are rules of thumb. Cut wire long, then trim for SWR.
- Keep antennas clear of power lines. End-fed wire ends carry high RF voltage. Observe RF exposure limits at high power.

Fonts: Barlow and Barlow Condensed (SIL Open Font License, see `fonts/OFL-Barlow.txt`).

73 de W4NEM
