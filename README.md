# HF Antenna & Transformer Planner

An Excel workbook that picks an HF antenna, mounting height, feed method and feedpoint transformer (balun/unun) for your operating goal, then gives a build checklist and a list of things to avoid.

**[Download the workbook (antenna_selection_tool.xlsx)](antenna_selection_tool.xlsx?raw=true)**

Built by W4NEM. Works for any station: local/NVIS, medium range, DX, multiband, limited space/HOA, or portable.

## Tabs

| Tab | What it does |
|---|---|
| How to Use | Work instruction. Start here. |
| Antenna Selector | Pick goal, frequency and (optionally) antenna type. Shows the full recommendation. |
| Build Plan | Step-by-step build checklist with a Done? column. |
| What to Avoid | Antennas and practices to avoid for your goal, with a warning if your choice is a poor fit. |
| Transformer Calculator | Stand-alone balun/unun sizing for any feed method or measured impedance. |
| Band Heights | Center frequencies and height targets for 80 / 60 / 40 m NVIS. |
| Band Calculations | Per-band wire lengths, heights, reflector length and estimated SWR for 80 / 60 / 40 m. |

## Quick start

1. **Transformer Calculator:** enter station power, safety margin, system impedance and acceptable SWR (once).
2. **Antenna Selector:** choose a goal from the dropdown in B5 and enter your operating frequency in B6.
3. Read the recommendation. The yellow Summary row is the one-line answer.
4. Check **What to Avoid**, then work through **Build Plan**.
5. After install, measure feedpoint impedance with an analyzer and enter it to confirm the transformer.

## Requirements

Microsoft Excel or LibreOffice Calc. The dropdowns and formulas do not work in GitHub's file preview or in some mobile viewers. Download the file and open it in a spreadsheet app.

## Notes

- All lengths, heights and impedances are rules of thumb. Cut wire long, then trim for SWR.
- Measured impedances give the most reliable transformer choice.
- Keep antennas clear of power lines. End-fed wire ends carry high RF voltage. Observe RF exposure limits at high power.

73 de W4NEM
