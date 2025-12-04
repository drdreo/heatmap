# Heatmap Library

A lightweight, composable heatmap rendering library built with TypeScript and Canvas2D. Zero dependencies.

## Features

- ESM first
- Tree-shakeable: only include what you use. ~5kb gzipped
- Customizable: composable features via `withXXX()` pattern
- Zero Dependency: Pure TypeScript. Don't drag in the whole React ecosystem
- High-performance

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
    radius: 20,
    blur: 0.85,
    maxOpacity: 0.8,
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

// Returns AnimatedHeatmap when withAnimation is included
const heatmap = createHeatmap(
    { container },
    withTooltip(),
    withAnimation()
);
```

## API

### HeatmapConfig

| Option               | Type                       | Default          | Description                                |
| -------------------- | -------------------------- | ---------------- | ------------------------------------------ |
| `container`          | `HTMLElement`              | required         | Container element                          |
| `width`              | `number`                   | container width  | Canvas width in pixels                     |
| `height`             | `number`                   | container height | Canvas height in pixels                    |
| `radius`             | `number`                   | `25`             | Point radius in pixels                     |
| `blur`               | `number`                   | `0.85`           | Blur factor (0 = solid, 1 = max blur)      |
| `maxOpacity`         | `number`                   | `0.8`            | Maximum opacity (0-1)                      |
| `minOpacity`         | `number`                   | `0`              | Minimum opacity (0-1)                      |
| `gradient`           | `GradientStop[]`           | default palette  | Color gradient stops                       |
| `useOffscreenCanvas` | `boolean`                  | `true`           | Use offscreen canvas for performance       |
| `gridSize`           | `number`                   | `10`             | Grid cell size for value lookups           |
| `blendMode`          | `GlobalCompositeOperation` | `source-over`    | Canvas blend mode (`lighter` for additive) |
| `intensityExponent`  | `number`                   | `1`              | Intensity curve exponent                   |
| `data`               | `HeatmapData`              | -                | Initial data                               |

### TooltipConfig

| Option          | Type                           | Default            | Description                    |
| --------------- | ------------------------------ | ------------------ | ------------------------------ |
| `formatter`     | `(value, x, y) => string`      | `(v) => v`         | Tooltip text formatter         |
| `offset`        | `{ x, y }`                     | `{ x: 15, y: 15 }` | Offset from cursor             |
| `enforceBounds` | `boolean`                      | `false`            | Keep tooltip in container      |
| `className`     | `string`                       | -                  | CSS class for tooltip element  |
| `style`         | `Partial<CSSStyleDeclaration>` | -                  | Inline styles                  |

### AnimationConfig

| Option            | Type                            | Default | Description              |
| ----------------- | ------------------------------- | ------- | ------------------------ |
| `fadeOutDuration` | `number`                        | `2000`  | Point fade-out time (ms) |
| `timeWindow`      | `number`                        | `5000`  | Visible time window (ms) |
| `playbackSpeed`   | `number`                        | `1`     | Speed multiplier         |
| `loop`            | `boolean`                       | `false` | Loop animation           |
| `onFrame`         | `(timestamp, progress) => void` | -       | Frame callback           |
| `onComplete`      | `() => void`                    | -       | Completion callback      |

### Heatmap Methods

```typescript
setData(data: HeatmapData): void
addPoint(point: HeatmapPoint): void
addPoints(points: HeatmapPoint[]): void
setGradient(stops: GradientStop[]): void
clear(): void
getValueAt(x: number, y: number): number
getDataURL(type?: string, quality?: number): string
getStats(): HeatmapStats
destroy(): void
```

### AnimatedHeatmap Methods

```typescript
setTemporalData(data: TemporalHeatmapData): void
play(): void
pause(): void
stop(): void
seek(timestamp: number): void
seekProgress(progress: number): void  // 0-1
setSpeed(speed: number): void
setLoop(loop: boolean): void
getAnimationState(): AnimationState   // 'idle' | 'playing' | 'paused'
getCurrentTime(): number
getProgress(): number                  // 0-1
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

## License

MIT
