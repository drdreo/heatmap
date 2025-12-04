# 🔥 Heatmap

A lightweight heatmap library for visualizing data intensity.

## Project Structure

```
heatmap/
├── packages/
│   └── heatmap/          # The npm package (pure TypeScript library)
│       ├── src/
│       │   ├── index.ts      # Main entry point
│       │   ├── heatmap.ts    # Core Heatmap class
│       │   ├── types.ts      # Type definitions
│       │   └── *.test.ts     # Unit tests
│       ├── package.json
│       ├── tsconfig.json
│       ├── tsup.config.ts    # Build configuration
│       └── vitest.config.ts  # Test configuration
├── docs/                 # Documentation & examples website
│   ├── src/
│   │   ├── main.ts
│   │   └── style.css
│   ├── index.html
│   ├── package.json
│   └── vite.config.ts
├── package.json          # Root workspace configuration
├── pnpm-workspace.yaml   # pnpm workspace definition
└── tsconfig.json         # Root TypeScript configuration
```

## Getting Started

### Install Dependencies

```bash
pnpm install
```

### Development

```bash
# Start the docs dev server (with live reload)
pnpm dev

# Build the library in watch mode
pnpm dev:lib
```

### Build

```bash
# Build everything (library + docs)
pnpm build

# Build only the library
pnpm build:lib

# Build only the docs
pnpm build:docs
```

### Testing

```bash
# Run tests in watch mode
pnpm test

# Run tests once
pnpm test:run

# Run tests with coverage
pnpm test:coverage
```

## Usage

```typescript
import { Heatmap } from "@drdreo/heatmap"

const heatmap = new Heatmap("#container", {
    width: 800,
    height: 600,
    radius: 25,
    maxValue: 100
})

// Add a single point
heatmap.addPoint({ x: 100, y: 100, value: 50 })

// Add multiple points
heatmap.addPoints([
    { x: 200, y: 150, value: 80 },
    { x: 300, y: 200, value: 60 }
])

// Render the heatmap
heatmap.render()

// Clear all points
heatmap.clear()
```

## API

### `new Heatmap(container, options?)`

Creates a new heatmap instance.

- `container`: `HTMLElement | string` - Container element or CSS selector
- `options`: `HeatmapOptions` (optional)
    - `width`: Width of the canvas (default: 800)
    - `height`: Height of the canvas (default: 600)
    - `radius`: Radius of each data point (default: 25)
    - `maxValue`: Maximum value for color scaling (default: 100)
    - `blur`: Blur amount for smoothing (default: 15)
    - `gradient`: Color gradient from cold to hot

### Methods

- `addPoint(point)` - Add a single data point
- `addPoints(points)` - Add multiple data points
- `clear()` - Clear all data points
- `render()` - Render the heatmap
- `getCanvas()` - Get the canvas element
- `getPoints()` - Get current data points

## License

MIT
