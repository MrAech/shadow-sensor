# SensorShadow-X

SensorShadow-X is an interactive React and TypeScript simulation of autonomous IoT sensor recovery. It models fault injection, physical reconfiguration, independent verification, recovery history, and technician dispatch workflows.

## Requirements

- Node.js 20 or newer
- npm 10 or newer

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (normally `http://localhost:5173`).

## Validate and build

```bash
npm test
npm run build
```

To preview the production build:

```bash
npm run preview
```

The project is self-contained and does not require an external API, database, environment variables, or local data files.

## Project structure

- `src/` - React interface and simulation engine
- `tests/` - deterministic simulation and verification checks
- `index.html` - Vite entry point
- `vite.config.ts` - Vite configuration
