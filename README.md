![Banner](/docs/public/heatmap_demo.gif)

# 🔥 Heatmap

`@drdreo/heatmap` is a lightweight TypeScript library for visualizing data intensity as a heatmap on a HTML canvas.

The motivation is simple: create a neat-looking heatmap with zero dependencies that is built on modern technologies, easy to use, customizable and fast.

This project got to run since existing libraries walked. Unfortunately, some are no longer maintained.

Still big thanks for carrying heatmaps for so long:

- https://github.com/pa7/heatmap.js and the several forks.

## Features

- **Performant**
- **Customizable**: composable features via `withXXX()` pattern
- **ESM first**
- **Tree-shakable**: only include what you use. Total is ~6kB gzipped
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
    data: [
        { x: 100, y: 150, value: 80 },
        { x: 200, y: 100, value: 50 }
    ]
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

### With Legend

```typescript
import { createHeatmap, withLegend, GRADIENT_THERMAL } from "@drdreo/heatmap";

const heatmap = createHeatmap(
    { container, gradient: GRADIENT_THERMAL },
    withLegend({
        position: "bottom-right",
        orientation: "horizontal",
        labelCount: 5,
        formatter: (value) => `${value.toFixed(0)}°C`
    })
);
```

The legend automatically updates when data or gradient changes. Available positions: `top`, `top-left`, `top-right`, `bottom`, `bottom-left`, `bottom-right`, `left`, `right`.

### With Animation

```typescript
import { createHeatmap, withAnimation } from "@drdreo/heatmap";

// Option 1: Set temporal data directly in config
const heatmap = createHeatmap(
    {
        container,
        data: {
            startTime: 0,
            endTime: 60000,
            data: [
                { x: 100, y: 150, value: 80, timestamp: 1000 },
                { x: 200, y: 100, value: 50, timestamp: 2500 }
            ]
        }
    },
    withAnimation({
        fadeOutDuration: 2000,
        timeWindow: 5000,
        loop: true,
        onFrame: (time, progress) =>
            console.log(`${(progress * 100).toFixed(0)}%`)
    })
);

heatmap.play();

// Option 2: Set temporal data later
const heatmap2 = createHeatmap(
    { container },
    withAnimation({ fadeOutDuration: 2000, loop: true })
);

heatmap2.setTemporalData({
    startTime: 0,
    endTime: 60000,
    data: [
        { x: 100, y: 150, value: 80, timestamp: 1000 },
        { x: 200, y: 100, value: 50, timestamp: 2500 }
    ]
});

heatmap2.play();
```

### Composing Features

```typescript
import {
    createHeatmap,
    withTooltip,
    withLegend,
    withAnimation
} from "@drdreo/heatmap";

const heatmap = createHeatmap(
    { container },
    withTooltip(),
    withLegend(),
    withAnimation()
);
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

### Aggregation Modes

Control how multiple points in the same grid cell are combined for tooltip and legend values:

```typescript
import { createHeatmap } from "@drdreo/heatmap";

const heatmap = createHeatmap({
    container,
    aggregationMode: "max" // 'max' | 'sum' | 'mean' | 'count'
});
```

| Mode    | Description                     | Use Case                        |
| ------- | ------------------------------- | ------------------------------- |
| `max`   | Use the maximum value (default) | Peak intensity visualization    |
| `sum`   | Add all values together         | Click tracking, cumulative data |
| `mean`  | Calculate the average           | Normalized/density data         |
| `count` | Count the number of points      | Pure density visualization      |

> **Note**: Aggregation affects tooltip and legend values. Visual rendering uses radial gradient blending through canvas compositing. For additive visual effects, combine with `blendMode: 'lighter'`.

## Contributing

Contributions are welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
