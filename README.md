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

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

MIT
