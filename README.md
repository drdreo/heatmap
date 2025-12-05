[![Banner](https://codecrafters.io/images/updated-byox-banner.gif)](https://codecrafters.io/github-banner)

# 🔥 Heatmap

`@drdreo/heatmap` is a lightweight TypeScript library for visualizing data intensity as a heatmap on a HTML canvas.

The motivation is simple: create a neat looking heatmap with zero dependencies that is built on modern technologies, easy to use, customizable and fast.

## Features

- **Performant**
- **Customizable**: composable features via `withXXX()` pattern
- **ESM first**
- **Tree-shakable**: only include what you use. Total is ~5kB gzipped
- **Zero Dependencies**: Pure TypeScript. Don't drag in the whole React ecosystem
- TypeScript, vite, vitest, rolldown inside.

## Installation

```bash
npm install @drdreo/heatmap
```

## Usage

### Basic Heatmap

```typescript
import { createHeatmap } from "@drdreo/heatmap";

const heatmap = createHeatmap({
    container: document.getElementById("heatmap")!,
    data: {
        min: 0,
        max: 100,
        data: [
            { x: 100, y: 150, value: 80 },
            { x: 200, y: 100, value: 50 }
        ]
    }
});
```

### With Tooltip

```typescript
import { createHeatmap, withTooltip } from "@drdreo/heatmap";

const heatmap = createHeatmap(
    { container },
    withTooltip({
        formatter: (value, x, y) => `${value} clicks`,
        enforceBounds: true
    })
);
```

### With Animation

```typescript
import { createHeatmap, withAnimation } from "@drdreo/heatmap";

const heatmap = createHeatmap(
    { container },
    withAnimation({
        fadeOutDuration: 2000,
        timeWindow: 5000,
        loop: true,
        onFrame: (time, progress) =>
            console.log(`${(progress * 100).toFixed(0)}%`)
    })
);
heatmap.setTemporalData({
    min: 0,
    max: 100,
    startTime: 0,
    endTime: 60000,
    data: [
        { x: 100, y: 150, value: 80, timestamp: 1000 },
        { x: 200, y: 100, value: 50, timestamp: 2500 }
    ]
});

heatmap.play();
```

### Composing Features

```typescript
import { createHeatmap, withTooltip, withAnimation } from "@drdreo/heatmap";

// Returns AnimatedHeatmap when `withAnimation` is included
const heatmap = createHeatmap({ container }, withTooltip(), withAnimation());
```

### Custom Gradient

```typescript
import { createHeatmap, type GradientStop } from "@drdreo/heatmap";

const gradient: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 255, 0)" },
    { offset: 0.5, color: "rgba(0, 255, 0, 1)" },
    { offset: 1, color: "rgba(255, 0, 0, 1)" }
];

const heatmap = createHeatmap({ container, gradient });
```

## Development

### Project Structure

```
heatmap/
├── packages/
│   └── heatmap/          # npm package (TypeScript library)
│       ├── src/          # Source files
├── docs/                 # Documentation project
    │   ├── src/          # Source files
├── package.json          # Root workspace configuration
├── pnpm-workspace.yaml   # pnpm workspace definition
```

### Install Dependencies

```bash
pnpm install
```

### Run locally

Run the dev modes:

```bash
# Start the docs dev server (with live reload)
pnpm dev

# Build the library in watch mode
pnpm dev:lib
```

Nx is also available:

```bash
# Start the docs dev server (with live reload)
nx dev docs

# Build the library in watch mode
nx dev heatmap
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

Nx is also available:

```bash
# Start the docs dev server (with live reload)
nx build docs

# Build the library in watch mode
nx build heatmap
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

Nx is also available:

```bash
# Run library
nx test heatmap
```

### Releasing

Locally run:
`nx release publish --otp=<OTP>`

## License

MIT
