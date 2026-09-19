# Moisture Recycling

> **Interactive 3D Land–Atmosphere Moisture Recycling Simulation**  
> Developed for an **IIT Kharagpur** scientific research and educational initiative.

[![Deploy to GitHub Pages](https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/Live_Demo-GitHub_Pages-brightgreen?style=flat&logo=github)](https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/)
[![WebGL 2.0](https://img.shields.io/badge/Graphics-Three.js_/_WebGL_2.0-00d4ff)](https://threejs.org/)

---

## 🌐 Live Public Demo

Anyone can access and explore the complete 3D simulation in any modern web browser (Chrome, Edge, Safari, Firefox) with **zero installation**:

👉 **[https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/](https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/)**

*(Replace `YOUR_GITHUB_USERNAME` and `YOUR_REPOSITORY_NAME` with your actual GitHub account and repository name upon pushing).*

---

## 🔬 Scientific Architecture & Model Components

This application simulates the full atmospheric and terrestrial hydrological loop based on the **UTrack Atmospheric Moisture Model** formulation:

```
                              EULERIAN WIND FIELD (Straight Vectors)
                     ──────────────────────────────────────────────────────────→
                                  DOMINANT HORIZONTAL TRANSPORT
                     ──────────────────────────────────────────────────────────→
Moisture Source Region  ────→  Lagrangian Parcels (P1–P4)  ────→  Cloud Formation  ────→  Precipitation (↓↓↓)  ────→  Sink Watershed
  (Convective Updrafts)          (Governing Advection ODEs)        (Volumetric Condensation)                            (Runoff → River → Ocean)
```

### 1. Lagrangian Moisture Tracking ($P_1, P_2, P_3, P_4$)
- **Representative Parcels**: Four stationary reference parcels ($P_1$–$P_4$) illustrate moisture tracking trajectories in a stable diamond formation.
- **Governing Differential Equations**:
  $$\frac{dx}{dt} = u, \quad \frac{dy}{dt} = v, \quad \frac{dz}{dt} = w$$
  where $u, v$ represent horizontal zonal and meridional winds, and $w = \frac{dz}{dt}$ represents vertical velocity ($\omega$).
- **Tracer Particles**: High-frequency tracer pulses travel continuously along curved streamlines to visualize moisture advection toward the condensation zone.

### 2. Eulerian Atmospheric Grid & Input Notation
- **Atmospheric State Function**: $P(i, j, k, t)$ represents grid cell state at longitude $i$, latitude $j$, pressure level $k$ (1000 hPa to 300 hPa), and time $t$.
- **Model Input Vector**: $\mathbf{X} = (q, u, v, w, t, \text{tcw}, \text{evf}, \text{nwf})$:
  - $q$: Specific humidity ($\text{kg}/\text{kg}$)
  - $u, v$: Horizontal wind velocity components ($\text{m}/\text{s}$)
  - $w$: Vertical velocity ($\text{Pa}/\text{s}$ or $\text{m}/\text{s}$)
  - $t$: Temporal integration coordinate
  - $\text{tcw}$: Total Column Water ($\text{kg}/\text{m}^2$)
  - $\text{evf}$: Evaporation flux input ($\text{mm}/\text{day}$)
  - $\text{nwf}$: Net moisture flux ($\text{kg}/(\text{m}^2\cdot\text{s})$)

### 3. Surface Moisture Flux Fields (Evaporation & Transpiration)
- **Ocean Evaporation**: Vertical convective vapor fluxes rising from open water ($\uparrow \uparrow \uparrow$, cyan).
- **River Evaporation**: Upward fluxes emerging along the river gorge and alluvial plain ($\uparrow \uparrow$, soft blue).
- **Forest Transpiration**: Canopy transpiration from woodland evergreen foothills ($\uparrow \uparrow \uparrow$, emerald).
- **Crops Evapotranspiration**: Agricultural flux from farmland irrigation and crop transpiration ($\uparrow \uparrow \uparrow$, lime).
- **Moisture Source Region**: Convective upward vapor plumes connecting the source region directly into the Lagrangian advection layer.

### 4. Atmospheric Transport & Volumetric Cloud Formation
- **Dominant Transport Highway**: A prominent, continuous horizontal moisture highway connecting the source region to the cloud.
- **Eulerian Wind Vectors**: Sleek, directional high-altitude vectors showing prevailing winds.
- **GPU Volumetric Raymarching**: The atmospheric cloud is rendered via real-time 3D raymarching with Worley cellular noise, 4-octave Simplex FBM, Beer-Lambert light extinction, and powder scattering.
- **Precipitation Pathways**: Direct downward arrows ($\downarrow \downarrow \downarrow$) accompanied by falling water droplets depositing into the sink watershed.

### 5. Hydrological Cycle Closure
- **Mountain Runoff**: Alpine glacier and snowmelt streams descending through steep chutes into the waterfall canyon.
- **Streamflow**: Continuous river transport from high elevations through the alluvial valley.
- **River Discharge**: Estuary delta discharge returning water to the coastal ocean, completing the closed cycle.

---

## 🚀 Quick Start (Local Development)

To run the application locally on your machine:

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or 20 LTS recommended)
- `npm` (bundled with Node.js)

### 1. Clone or Open the Repository
```bash
cd moisture-recycling
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open **[http://localhost:5173/](http://localhost:5173/)** in your browser.

### 4. Build for Production
```bash
npm run build
```
Preview the production build locally:
```bash
npm run preview
```

---

## 📦 Deploying to GitHub Pages (Step-by-Step)

This repository includes an automated GitHub Actions deployment workflow in `.github/workflows/deploy.yml`.

### Step 1: Push to GitHub
Initialize git, commit, and push to your GitHub account:
```bash
git init
git add .
git commit -m "feat: Moisture Recycling 3D scientific simulation"
git branch -M main
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME.git
git push -u origin main
```

### Step 2: Enable GitHub Pages in Repository Settings
1. Go to your repository on GitHub: `https://github.com/YOUR_GITHUB_USERNAME/YOUR_REPOSITORY_NAME`
2. Click **Settings** (top menu).
3. In the left sidebar, click **Pages** (under the "Code and automation" section).
4. Under **Build and deployment** > **Source**, select:
   👉 **GitHub Actions**
5. That's it! GitHub Actions will automatically run `.github/workflows/deploy.yml`, compile the production build, and publish the live site.

### Step 3: View Your Live Simulation
After the workflow finishes (~1 minute), your simulation is live at:
```text
https://YOUR_GITHUB_USERNAME.github.io/YOUR_REPOSITORY_NAME/
```

---

## 🛠️ Project Structure

```text
MOISTURE-RECYCLING/
├── .github/
│   └── workflows/
│       └── deploy.yml          # Automated GitHub Pages CI/CD workflow
├── public/
│   └── favicon.svg             # Scientific moisture & cloud icon
├── src/
│   ├── components/             # UI Panels (Controls, Legend, Header, Inspector)
│   ├── scene/                  # Three.js 3D world (Terrain, Water, Cloud, Arrows)
│   │   ├── VolumetricCloud.tsx # GPU ray-marched atmospheric cloud
│   │   ├── ScientificArrows.tsx# UTrack V2 arrow hierarchy
│   │   ├── LagrangianParcelsP1P4.tsx # P1-P4 diamond cluster & trajectories
│   │   ├── AtmosphericInputNotation.tsx # Model mathematical variables
│   │   ├── WaterSurface.tsx    # Dynamic animated ocean waves
│   │   ├── RiverMesh.tsx       # Flowing mountain river
│   │   └── terrainConfig.ts    # Procedural watershed elevation
│   ├── simulation/             # Physics, synthetic data provider, store
│   ├── App.tsx                 # Root application & 3D canvas
│   └── main.tsx                # React 19 entry point
├── index.html                  # HTML entry point (relative paths)
├── package.json                # Dependencies & scripts
├── tsconfig.json               # TypeScript configuration
├── vite.config.ts              # Vite config with relative base path ('./')
├── .gitignore                  # Excludes node_modules, dist, caches
└── README.md                   # Project documentation & deployment guide
```

---

## 📄 Demonstration Data Notice
> ⚠ **SYNTHETIC DEMONSTRATION DATA**: The numerical values, parcel parameters, and atmospheric fluxes rendered in this demonstration follow established atmospheric moisture recycling equations and synthetic baseline datasets for educational and research visualization purposes.
