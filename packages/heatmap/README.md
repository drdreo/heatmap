# Heatmap Library

A lightweight, high-performance, **composable** heatmap rendering library built with TypeScript and Canvas2D. Zero dependencies.

## Features

- **Tree-shakeable** – Only include what you use
- **Performant** – Pre-computed values, offscreen canvas
- **Zero dependencies** – Don't drag in the whole React ecosystem
- **Customizable** – You define what you need with a composable API - via a `withXXX()` pattern

## Usage

### Basic Heatmap

```typescript
import { createHeatmap } from "./lib";

const heatmap = createHeatmap({
    container: document.getElementById("heatmap")!,
    radius: 20,
    blur: 15,
    maxOpacity: 0.8,
    data: {
        min: 0,
        max: 100,
        data: [
            { x: 100, y: 150, value: 80 },
            { x: 200, y: 100, value: 50 },
            { x: 150, y: 200, value: 95 }
        ]
    }
});
```

### With Tooltip

```typescript
import { createHeatmap, withTooltip } from './lib';

const heatmap = createHeatmap(
    { container, radius: 20 },
    withTooltip({
        formatter: (value, x, y) => `${value} clicks`,
        enforceBounds: true
    })
);

heatmap.setData({ min: 0, max: 100, data: [...] });
```

### With Animation

```typescript
import { createHeatmap, withAnimation } from "./lib";

// Automatically typed as AnimatedHeatmap!
const heatmap = createHeatmap(
    { container, radius: 15 },
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
// heatmap.pause(), .stop(), .seek(30000), .setSpeed(2)
```

### Multiple Features

```typescript
import { createHeatmap, withTooltip, withAnimation } from "./lib";

// Automatically typed as AnimatedHeatmap when withAnimation is used!
const heatmap = createHeatmap(
    { container },
    withTooltip({ formatter: (v) => `${v} clicks` }),
    withAnimation({ loop: true })
);
```

## API

### Core Config Options

| Option       | Type             | Default               | Description            |
| ------------ | ---------------- | --------------------- | ---------------------- |
| `container`  | `HTMLElement`    | required              | Container element      |
| `width`      | `number`         | container width       | Canvas width           |
| `height`     | `number`         | container height      | Canvas height          |
| `radius`     | `number`         | `25`                  | Point radius in pixels |
| `blur`       | `number`         | `15`                  | Blur amount            |
| `maxOpacity` | `number`         | `0.8`                 | Maximum opacity (0-1)  |
| `minOpacity` | `number`         | `0`                   | Minimum opacity (0-1)  |
| `gradient`   | `GradientStop[]` | blue→green→yellow→red | Color gradient         |
| `data`       | `HeatmapData`    | –                     | Initial data to render |

### withTooltip Options

| Option          | Type                      | Default             | Description                    |
| --------------- | ------------------------- | ------------------- | ------------------------------ |
| `formatter`     | `(value, x, y) => string` | `(v) => v`          | Custom tooltip text            |
| `gridSize`      | `number`                  | `6`                 | Grid cell size for aggregation |
| `offset`        | `{ x, y }`                | `{ x: 15, y: 15 }`  | Offset from cursor             |
| `enforceBounds` | `boolean`                 | `false`             | Keep tooltip in container      |
| `className`     | `string`                  | `'heatmap-tooltip'` | Custom CSS class               |
| `style`         | `CSSStyleDeclaration`     | –                   | Custom inline styles           |

### withAnimation Options

| Option            | Type                            | Default | Description              |
| ----------------- | ------------------------------- | ------- | ------------------------ |
| `fadeOutDuration` | `number`                        | `2000`  | Point decay time (ms)    |
| `timeWindow`      | `number`                        | `5000`  | Visible time window (ms) |
| `playbackSpeed`   | `number`                        | `1`     | Speed multiplier         |
| `loop`            | `boolean`                       | `false` | Loop animation           |
| `onFrame`         | `(timestamp, progress) => void` | –       | Frame callback           |
| `onComplete`      | `() => void`                    | –       | Completion callback      |

### Core Methods

- `setData(data)` – Set heatmap data
- `addPoint(point)` – Add single point
- `setGradient(stops)` – Update gradient
- `clear()` – Clear display
- `getValueAt(x, y)` – Get value at position
- `getDataURL()` – Get canvas as data URL
- `destroy()` – Clean up

### Animation Methods (when using withAnimation)

- `setTemporalData(data)` – Set temporal data
- `play()` / `pause()` / `stop()`
- `seek(timestamp)` / `seekProgress(0-1)`
- `setSpeed(multiplier)` / `setLoop(boolean)`
- `getAnimationState()` / `getCurrentTime()` / `getProgress()`

## Custom Gradient

```typescript
import { createHeatmap, GradientStop } from "./lib";

const gradient: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 255, 0)" },
    { offset: 0.5, color: "rgba(0, 255, 0, 1)" },
    { offset: 1, color: "rgba(255, 0, 0, 1)" }
];

const heatmap = createHeatmap({ container, gradient });
```

## License

MIT
