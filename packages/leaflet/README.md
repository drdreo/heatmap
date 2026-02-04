# @drdreo/heatmap-leaflet

Leaflet integration for [@drdreo/heatmap](https://github.com/drdreo/heatmap).

> **Note:** This package requires **Leaflet 2.0** or later.

## Features

- Automatic container management
- Lat/lng to pixel coordinate conversion
- Syncs with map zoom and pan
- Optional radius scaling based on zoom level
- Works with @drdreo/heatmap features (WebGL, legend, etc.)

## Installation

```bash
npm install @drdreo/heatmap-leaflet @drdreo/heatmap leaflet
```

## Usage

### Basic Setup

```typescript
import { LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { createLeafletHeatmap } from "@drdreo/heatmap-leaflet";

// Create Leaflet map
const map = new LeafletMap("map").setView([51.505, -0.09], 13);
new TileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

// Create heatmap
const heatmap = createLeafletHeatmap(map, {
    radius: 25,
    blur: 0.85
});

// Set geographic data
heatmap.setLatLngData([
    { lat: 51.5, lng: -0.09, value: 100 },
    { lat: 51.51, lng: -0.1, value: 50 },
    { lat: 51.49, lng: -0.05, value: 75 }
]);
```

### With WebGL Renderer

```typescript
import { createLeafletHeatmap } from "@drdreo/heatmap-leaflet";
import { withWebGLRenderer, GRADIENT_THERMAL } from "@drdreo/heatmap";

const heatmap = createLeafletHeatmap(
    map,
    {
        radius: 30,
        gradient: GRADIENT_THERMAL
    },
    withWebGLRenderer()
);

heatmap.setLatLngData(points);
```

### With Legend

```typescript
import { createLeafletHeatmap } from "@drdreo/heatmap-leaflet";
import { withLegend, withTooltip, GRADIENT_VIRIDIS } from "@drdreo/heatmap";

const heatmap = createLeafletHeatmap(
    map,
    {
        gradient: GRADIENT_VIRIDIS,
        maxOpacity: 0.8
    },
    withLegend({
        position: "bottom-right",
        formatter: (value) => `${value.toFixed(0)}°C`
    })
);

heatmap.setLatLngData(temperatureData);
```

### With Zoom-based Radius Scaling

```typescript
const heatmap = createLeafletHeatmap(map, {
    radius: 25,
    scaleRadius: true, // Enable zoom-based scaling
    scaleRadiusBaseZoom: 12 // Radius is 25px at zoom level 12
});
```

### Dynamic Data Updates

```typescript
// Set all data (replaces existing)
heatmap.setLatLngData([
    { lat: 51.5, lng: -0.09, value: 100 },
    { lat: 51.51, lng: -0.1, value: 50 }
]);

// Add single point
heatmap.addLatLngData({ lat: 51.52, lng: -0.08, value: 75 });

// Add multiple points
heatmap.addLatLngData([
    { lat: 51.53, lng: -0.07, value: 60 },
    { lat: 51.54, lng: -0.06, value: 40 }
]);

// Get current data
const data = heatmap.getLatLngData();

// Get value at location
const value = heatmap.getValueAtLatLng(new LatLng(51.5, -0.09));

// Clear all data
heatmap.clearLatLngData();

// Destroy heatmap (also removes from map)
heatmap.destroy();
```

## API

### createLeafletHeatmap(map, config?, ...features)

Creates a heatmap integrated with a Leaflet map.

```typescript
function createLeafletHeatmap(
    map: LeafletMap,
    config?: LeafletHeatmapConfig,
    ...features: HeatmapFeature[]
): LeafletHeatmap;
```

#### Parameters

| Parameter  | Type                   | Description                                 |
| ---------- | ---------------------- | ------------------------------------------- |
| `map`      | `LeafletMap`           | The Leaflet map instance                    |
| `config`   | `LeafletHeatmapConfig` | Optional heatmap configuration              |
| `features` | `HeatmapFeature[]`     | Optional features (withWebGLRenderer, etc.) |

#### LeafletHeatmapConfig

Extends the core `HeatmapConfig` with Leaflet-specific options:

| Option                | Type             | Default | Description                        |
| --------------------- | ---------------- | ------- | ---------------------------------- |
| `radius`              | `number`         | `25`    | Point radius in pixels             |
| `blur`                | `number`         | `0.85`  | Blur factor (0-1)                  |
| `maxOpacity`          | `number`         | `0.8`   | Maximum opacity (0-1)              |
| `minOpacity`          | `number`         | `0`     | Minimum opacity (0-1)              |
| `gradient`            | `GradientStop[]` | default | Color gradient stops               |
| `valueMin`            | `number`         | auto    | Fixed minimum value for scaling    |
| `valueMax`            | `number`         | auto    | Fixed maximum value for scaling    |
| `scaleRadius`         | `boolean`        | `false` | Scale radius with zoom level       |
| `scaleRadiusBaseZoom` | `number`         | `10`    | Base zoom level for radius scaling |

### LeafletHeatmap

The returned heatmap instance includes all standard `Heatmap` methods plus:

```typescript
interface LeafletHeatmap extends Heatmap {
    // Set geographic data (replaces existing)
    setLatLngData(data: LeafletHeatmapData): void;

    // Add geographic data incrementally
    addLatLngData(
        pointOrPoints: LeafletHeatmapPoint | LeafletHeatmapPoint[]
    ): void;

    // Get current geographic data
    getLatLngData(): LeafletHeatmapPoint[];

    // Get value at geographic location
    getValueAtLatLng(latlng: LatLng): number;

    // Clear all geographic data
    clearLatLngData(): void;
}
```

### LeafletHeatmapPoint

```typescript
interface LeafletHeatmapPoint {
    lat: number; // Latitude
    lng: number; // Longitude
    value: number; // Intensity value
}
```

## License

MIT
