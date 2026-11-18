# ThermalEfficiency

Compare the energy consumed by stimulated catalysis with the energy required to obtain the same rate enhancement through heating.

**Website:** https://enlepre.github.io/ThermalEfficiency/

## What the tool does

- **Break-even activation energy:** enter stimulus power, duration, observed rate enhancement, solvent and volume. Find the range of thermal activation energies where stimulation uses less energy. No assumed universal activation energy is required.
- **Known activation energy:** calculate equivalent thermal temperature, sensible heating, warm-up losses, holding energy and the stimulated/thermal energy ratio.
- **Five stimulus categories:** light, electricity, mechanical stress, ultrasound and custom. Enter measured power or calculate it from irradiance/area, voltage/current, work/cycle or torque/speed.
- **Two energy boundaries:** ideal energy delivered to the system, or equipment electrical consumption with explicit conversion efficiency and auxiliary loads.
- **17 sourced solvent presets**, editable properties, custom liquids, vessel heat capacity and temperature limits.
- Activation-energy and operating-time plots, scenario links, complete CSV export, light/dark appearance and responsive layouts.
- Compare, Details, Assumptions and Sources pages, using the warm paper, serif typography, fine rules and teal/plum accents of [Electron Cost](https://github.com/enLepre/electronsCost).

## Scientific basis

For enhancement `f`, reference temperature `T0` in kelvin and positive apparent thermal activation energy `Ea` in J/mol:

`T = 1 / (1/T0 - R ln(f)/Ea)`

With constant system heat capacity `C` in J/K, heat-loss coefficient `UA` in W/K, operating time `t` in seconds, linear ramp time `tr` in seconds and heating efficiency `eta`:

`Ethermal = [C + UA (t + tr/2)] deltaT / eta`

The equal-energy temperature rise and break-even activation energy are:

`deltaT_BE = eta Estim / [C + UA (t + tr/2)]`

`Ea_BE = R ln(f) T0 (T0 + deltaT_BE) / deltaT_BE`

Below the threshold, stimulation consumes less energy; above it, thermal treatment consumes less. These statements apply only where the equivalent temperature is within the model's liquid and user-defined bounds. Outside those bounds the application does not declare a winner. The threshold is not a measurement of the actual activation energy.

Ideal mode uses unity efficiencies, no heat losses and no auxiliary loads. Equipment mode includes conversion efficiency, heat loss during the linear warm-up, holding losses and explicitly entered stimulated auxiliary power/startup energy. Ambient equals reference temperature. Both routes start at that temperature; warm-up precedes the operating interval. Shared baseline loads are excluded. No reaction during warm-up is credited.

This is a screening model for a batch liquid. It does not establish equal yield, selectivity, mechanism or conversion. It assumes constant properties, positive temperature-independent apparent activation energy and a comparable thermal pathway. Phase changes, pressure dependence, reaction enthalpy, flow, heat recovery and kinetic evolution are outside the model. An observed enhancement must not silently mix different bulk temperatures or concentrations.

## Data

`data.js` contains the selected NIST liquid heat-capacity measurements at 298.15 K, original molar values, molar masses, references and links. Mass-specific values are calculated as molar heat capacity / molar mass. Water uses the NIST Shomate equation at 298.15 K. Density and phase-change values come from Aldrich's solvent table; ethanol density is taken from Sigma-Aldrich E7023 instead of the inconsistent entry in the general table. No claim of a fitted temperature-dependent heat capacity is made. See the Sources page.

## Run and edit

Open `index.html` directly or serve the directory with `node preview.cjs` (http://127.0.0.1:4173). The calculator has no runtime package dependencies or build requirement. Google Fonts is optional; Georgia is the offline fallback. No experimental inputs are uploaded. Links carry inputs in the URL fragment; session storage preserves the current scenario for Details within the browser tab. A fresh main-page visit starts empty; a scenario URL restores its inputs.

Generated HTML is checked in. Install authoring dependencies with `pnpm install --frozen-lockfile`, edit `build-pages.cjs` (shared structure) or `simple-page.cjs` (the simplified main view), then run `node build-pages.cjs`. Calculation logic is in `model.js`, interface state in `app.js`, charts in `chart.js`, and styling in `styles.css`.

## Verification

Install test dependencies with `pnpm install --frozen-lockfile`, then run:

```
node --test model.test.cjs site.test.cjs interface.test.cjs
```

31 automated checks cover an independent worked example; threshold inversion and direction; equipment losses; units and stimulus methods; invalid values and physical bounds; all solvent presets; page assets; empty and progressively revealed main-page states; opt-in examples; full Details states; custom-liquid input gating; selector interactions; scenario restoration; CSV download dispatch; source filtering; and theme/reset behaviour. Interface tests use jsdom and do not substitute for visual browser testing. Local browser preview was blocked by the authoring environment's origin policy; physical mobile layout, real clipboard/download behaviour and visual rendering have not been verified.

## Publishing

The GitHub Actions workflow tests the site and deploys only HTML/CSS/JavaScript/image assets to GitHub Pages. Set Pages to **GitHub Actions**. Every push to `main` runs the tests before publishing. All asset references are relative to support the project subpath.

## Main-page flow

The main page starts with empty Stimulus and Solvent choices. Rate enhancement, duration and temperature share a row above the choices. Each choice independently reveals its own inputs, with optional known activation energy under the solvent. Supporting text and assumptions follow the result and graph. Results stay hidden until the required measurements are complete. Adjust assumptions contains energy accounting, duty cycle, vessel capacity, solvent properties and equipment settings. Custom liquids require explicit properties and bounds.

The main view shows one verdict and the activation-energy graph. Secondary metrics, the full breakdown, the time plot, sharing and CSV export remain on Details. The Details link carries the complete scenario. Try an example is explicit; Start over clears the comparison, URL scenario and stored scenario. The calculation model is shared between both views.
Graph explanations, the active-assumption summary, solvent references and the example notice are grouped in collapsed Model notes. Try an example hides after any data entry or restored scenario and returns after Start over.
