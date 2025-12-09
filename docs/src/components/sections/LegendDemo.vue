<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
    createHeatmap,
    type Heatmap,
    type HeatmapPoint,
    type GradientStop,
    withLegend,
    GRADIENT_THERMAL,
    GRADIENT_COOL,
    GRADIENT_VIRIDIS,
    GRADIENT_OCEAN,
    GRADIENT_DEFAULT,
    withTooltip
} from "@drdreo/heatmap";
import CodeBlock from "../ui/CodeBlock.vue";
import ConfigTable, { type ConfigOption } from "../ui/ConfigTable.vue";

const legendCode = `import { createHeatmap, withLegend, GRADIENT_THERMAL } from '@drdreo/heatmap';

const heatmap = createHeatmap(
    {
        container: document.querySelector('#container')!,
        width: 800,
        height: 400,
        gradient: GRADIENT_THERMAL
    },
    withLegend({
        position: 'bottom-right',
        orientation: 'horizontal',
        labelCount: 5,
        formatter: (value) => \`\${value.toFixed(0)}%\`,
        className: 'my-legend'
    })
);

// Legend updates automatically when data changes
// Min/max are auto-detected from points
heatmap.setData(points);

// Legend updates automatically when gradient changes
heatmap.setGradient(GRADIENT_COOL);

// Fixed scale for RENDERING (affects color intensity)
// Value 100 at valueMax 500 renders at 20% intensity
const fixedRenderScale = createHeatmap({
    container,
    valueMin: 0,    // Fixed min for rendering (default)
    valueMax: 500   // Fixed max for rendering (value 100 = 20% intensity)
}, withLegend());   // Legend shows actual data range by default

// Fixed scale for LEGEND ONLY (display purposes)
// Rendering uses actual data range, legend shows custom scale
const fixedLegendScale = createHeatmap(
    { container, gradient: GRADIENT_THERMAL },
    withLegend({
        min: 0,    // Override legend min (display only)
        max: 100   // Override legend max (display only)
    })
);`;

const legendOptions: ConfigOption[] = [
    {
        name: "position",
        type: "string",
        default: "'bottom-right'",
        description:
            "Position: top, top-left, top-right, bottom, bottom-left, bottom-right, left, right"
    },
    {
        name: "orientation",
        type: "string",
        default: "'horizontal'",
        description: "Gradient orientation: horizontal or vertical"
    },
    {
        name: "width",
        type: "number",
        default: "150 / 20",
        description: "Width in pixels (default varies by orientation)"
    },
    {
        name: "height",
        type: "number",
        default: "15 / 100",
        description: "Height in pixels (default varies by orientation)"
    },
    {
        name: "min",
        type: "number",
        default: "auto",
        description:
            "Fixed minimum value for the legend scale. When not set, uses effectiveMin (0 by default, or config.valueMin if set)"
    },
    {
        name: "max",
        type: "number",
        default: "auto",
        description:
            "Fixed maximum value for the legend scale. When not set, uses effectiveMax (gridMax by default, or config.valueMax if set)"
    },
    {
        name: "labelCount",
        type: "number",
        default: "5",
        description: "Number of value labels to display"
    },
    {
        name: "showMinMax",
        type: "boolean",
        default: "true",
        description: "Always include min/max in labels"
    },
    {
        name: "formatter",
        type: "(value, index) => string",
        default: "v => Math.round(v)",
        description: "Custom label formatter function"
    },
    {
        name: "className",
        type: "string",
        default: "'heatmap-legend'",
        description: "Custom CSS class name"
    },
    {
        name: "style",
        type: "CSSStyleDeclaration",
        description: "Custom inline styles"
    }
];

const featureHighlights = [
    { icon: "1", label: "Auto-updating" },
    { icon: "2", label: "8 Positions" },
    { icon: "3", label: "Custom Formatters" },
    { icon: "4", label: "Fixed Scale" },
    { icon: "5", label: "CSS Themeable" }
];

type GradientPreset = {
    name: string;
    value: GradientStop[];
};

const gradientPresets: GradientPreset[] = [
    { name: "Default", value: GRADIENT_DEFAULT },
    { name: "Thermal", value: GRADIENT_THERMAL },
    { name: "Cool", value: GRADIENT_COOL },
    { name: "Viridis", value: GRADIENT_VIRIDIS },
    { name: "Ocean", value: GRADIENT_OCEAN }
];

type Position =
    | "top"
    | "top-left"
    | "top-right"
    | "bottom"
    | "bottom-left"
    | "bottom-right"
    | "left"
    | "right";

const positions: Position[] = [
    "top-left",
    "top",
    "top-right",
    "left",
    "right",
    "bottom-left",
    "bottom",
    "bottom-right"
];

const containerRef = ref<HTMLElement | null>(null);
const selectedGradient = ref<string>("Default");
const selectedPosition = ref<Position>("bottom-right");
const selectedOrientation = ref<"horizontal" | "vertical">("horizontal");
const useFixedScale = ref(false);
const fixedScaleMode = ref<"render" | "legend">("render");
const fixedMin = ref(0);
const fixedMax = ref(200);
const dataMin = ref(0);
const dataMax = ref(100);

let legendHeatmap: Heatmap | null = null;

/**
 * Generate deterministic clustered points for consistent comparison.
 * Points are fixed so changing settings shows the same data with different rendering.
 */
function generateClusteredPoints(): HeatmapPoint[] {
    return [
        // High value cluster (top-left area)
        { x: 160, y: 130, value: 95 },
        { x: 180, y: 140, value: 88 },
        { x: 200, y: 120, value: 82 },
        { x: 170, y: 160, value: 78 },
        { x: 190, y: 150, value: 90 },
        { x: 210, y: 135, value: 85 },
        { x: 175, y: 145, value: 92 },
        { x: 195, y: 125, value: 75 },
        { x: 185, y: 155, value: 80 },
        { x: 165, y: 170, value: 72 },

        // Medium value cluster (right area)
        { x: 480, y: 200, value: 55 },
        { x: 500, y: 220, value: 48 },
        { x: 520, y: 190, value: 62 },
        { x: 490, y: 240, value: 45 },
        { x: 510, y: 210, value: 58 },
        { x: 470, y: 230, value: 52 },
        { x: 530, y: 205, value: 50 },
        { x: 495, y: 195, value: 65 },
        { x: 515, y: 225, value: 42 },
        { x: 485, y: 215, value: 60 },

        // Low value scattered points
        { x: 50, y: 50, value: 15 },
        { x: 350, y: 80, value: 25 },
        { x: 100, y: 280, value: 18 },
        { x: 400, y: 300, value: 30 },
        { x: 300, y: 150, value: 22 },
        { x: 550, y: 100, value: 35 },
        { x: 80, y: 200, value: 12 },
        { x: 420, y: 50, value: 28 },
        { x: 250, y: 250, value: 20 },
        { x: 600, y: 280, value: 10 }
    ];
}

function handleGradientChange() {
    if (!legendHeatmap) return;
    const preset = gradientPresets.find(
        (p) => p.name === selectedGradient.value
    );
    if (preset) {
        legendHeatmap.setGradient(preset.value);
    }
}

function handlePositionChange() {
    // Need to recreate heatmap to change legend position
    recreateHeatmap();
}

function handleOrientationChange() {
    // Need to recreate heatmap to change legend orientation
    recreateHeatmap();
}

function handleFixedScaleChange() {
    // Need to recreate heatmap to change legend min/max config
    recreateHeatmap();
}

function handleDataRangeChange() {
    if (!legendHeatmap || !containerRef.value) return;

    const points = generateClusteredPoints();

    // Scale points to new range
    const scaledPoints = points.map((p) => ({
        ...p,
        value: dataMin.value + (p.value / 100) * (dataMax.value - dataMin.value)
    }));

    legendHeatmap.setData(scaledPoints);
}

function recreateHeatmap() {
    if (!containerRef.value) return;

    // Destroy existing
    legendHeatmap?.destroy();

    // Get current gradient
    const preset = gradientPresets.find(
        (p) => p.name === selectedGradient.value
    );

    // Build heatmap config
    const heatmapConfig: Parameters<typeof createHeatmap>[0] = {
        container: containerRef.value,
        gradient: preset?.value
    };

    // Build legend config
    const legendConfig: Parameters<typeof withLegend>[0] = {
        position: selectedPosition.value,
        orientation: selectedOrientation.value,
        labelCount: 5,
        formatter: (value) => `${Math.round(value)}`,
        className: "demo-legend"
    };

    // Apply fixed scale based on mode
    if (useFixedScale.value) {
        if (fixedScaleMode.value === "render") {
            // Fixed scale for RENDERING - affects color intensity AND legend
            heatmapConfig.valueMin = fixedMin.value;
            heatmapConfig.valueMax = fixedMax.value;
        } else {
            // Fixed scale for LEGEND ONLY - display purposes
            legendConfig.min = fixedMin.value;
            legendConfig.max = fixedMax.value;
        }
    }

    // Create new heatmap with updated config
    legendHeatmap = createHeatmap(
        heatmapConfig,
        withTooltip(),
        withLegend(legendConfig)
    );

    // Set initial data
    const points = generateClusteredPoints();

    const scaledPoints = points.map((p) => ({
        ...p,
        value: dataMin.value + (p.value / 100) * (dataMax.value - dataMin.value)
    }));

    legendHeatmap.setData(scaledPoints);
}

onMounted(() => {
    if (!containerRef.value) return;

    legendHeatmap = createHeatmap(
        {
            container: containerRef.value
        },
        withTooltip(),
        withLegend({
            position: selectedPosition.value,
            orientation: selectedOrientation.value,
            labelCount: 5,
            formatter: (value) => `${Math.round(value)}`,
            className: "demo-legend"
        })
    );

    // Initialize with clustered data
    const points = generateClusteredPoints();

    legendHeatmap.setData(points);
});

onUnmounted(() => {
    legendHeatmap?.destroy();
});
</script>

<template>
    <section id="legend-demo" class="section">
        <h2>Legend Feature</h2>
        <p class="section-description">
            Add a gradient legend that automatically updates when data or
            gradient changes. Fully customizable positioning, formatting, and
            styling.
        </p>

        <div class="feature-highlights">
            <div
                v-for="feature in featureHighlights"
                :key="feature.label"
                class="feature-item"
            >
                <span class="feature-icon">{{ feature.icon }}</span>
                <span>{{ feature.label }}</span>
            </div>
        </div>

        <div class="demo-container">
            <div class="demo-canvas-wrapper">
                <div ref="containerRef" class="heatmap-container"></div>
            </div>
            <div class="demo-controls legend-controls">
                <div class="control-group">
                    <label for="gradient-select">Gradient:</label>
                    <select
                        id="gradient-select"
                        v-model="selectedGradient"
                        @change="handleGradientChange"
                    >
                        <option
                            v-for="preset in gradientPresets"
                            :key="preset.name"
                            :value="preset.name"
                        >
                            {{ preset.name }}
                        </option>
                    </select>
                </div>
                <div class="control-group">
                    <label for="position-select">Position:</label>
                    <select
                        id="position-select"
                        v-model="selectedPosition"
                        @change="handlePositionChange"
                    >
                        <option
                            v-for="pos in positions"
                            :key="pos"
                            :value="pos"
                        >
                            {{ pos }}
                        </option>
                    </select>
                </div>
                <div class="control-group">
                    <label for="orientation-select">Orientation:</label>
                    <select
                        id="orientation-select"
                        v-model="selectedOrientation"
                        @change="handleOrientationChange"
                    >
                        <option value="horizontal">Horizontal</option>
                        <option value="vertical">Vertical</option>
                    </select>
                </div>
            </div>
            <div class="range-controls">
                <div class="range-control">
                    <label for="data-min">Data Min Value: {{ dataMin }}</label>
                    <input
                        type="range"
                        id="data-min"
                        min="-100"
                        max="50"
                        v-model.number="dataMin"
                        @change="handleDataRangeChange"
                    />
                </div>
                <div class="range-control">
                    <label for="data-max">Data Max Value: {{ dataMax }}</label>
                    <input
                        type="range"
                        id="data-max"
                        min="50"
                        max="500"
                        v-model.number="dataMax"
                        @change="handleDataRangeChange"
                    />
                </div>
            </div>
            <div class="fixed-scale-controls">
                <div class="control-group">
                    <label for="fixed-scale-toggle">
                        <input
                            type="checkbox"
                            id="fixed-scale-toggle"
                            v-model="useFixedScale"
                            @change="handleFixedScaleChange"
                        />
                        Use Fixed Scale
                    </label>
                </div>
                <div v-if="useFixedScale" class="fixed-scale-mode">
                    <div class="control-group">
                        <label for="mode-render">
                            <input
                                type="radio"
                                id="mode-render"
                                value="render"
                                v-model="fixedScaleMode"
                                @change="handleFixedScaleChange"
                            />
                            Render Scale (valueMin/valueMax)
                        </label>
                    </div>
                    <div class="control-group">
                        <label for="mode-legend">
                            <input
                                type="radio"
                                id="mode-legend"
                                value="legend"
                                v-model="fixedScaleMode"
                                @change="handleFixedScaleChange"
                            />
                            Legend Only (min/max)
                        </label>
                    </div>
                </div>
                <div v-if="useFixedScale" class="range-controls">
                    <div class="range-control">
                        <label for="fixed-min">Fixed Min: {{ fixedMin }}</label>
                        <input
                            type="range"
                            id="fixed-min"
                            min="-100"
                            max="50"
                            v-model.number="fixedMin"
                            @change="handleFixedScaleChange"
                        />
                    </div>
                    <div class="range-control">
                        <label for="fixed-max">Fixed Max: {{ fixedMax }}</label>
                        <input
                            type="range"
                            id="fixed-max"
                            min="50"
                            max="500"
                            v-model.number="fixedMax"
                            @change="handleFixedScaleChange"
                        />
                    </div>
                </div>
                <p v-if="useFixedScale" class="fixed-scale-hint">
                    <template v-if="fixedScaleMode === 'render'">
                        <strong>Render scale:</strong> Colors are scaled to
                        {{ fixedMin }} - {{ fixedMax }}. Data value
                        {{ dataMax }} renders at
                        {{
                            Math.round(
                                ((dataMax - fixedMin) / (fixedMax - fixedMin)) *
                                    100
                            )
                        }}% intensity.
                    </template>
                    <template v-else>
                        <strong>Legend only:</strong> Legend shows
                        {{ fixedMin }} - {{ fixedMax }}, but colors use actual
                        data range ({{ dataMin }} - {{ dataMax }}).
                    </template>
                </p>
            </div>
        </div>

        <CodeBlock title="Code" language="typescript">{{
            legendCode
        }}</CodeBlock>

        <div class="card config-card">
            <h4>LegendConfig Options</h4>
            <ConfigTable :options="legendOptions" />
        </div>
    </section>
</template>

<style scoped>
.section {
    margin-bottom: 6rem;
    scroll-margin-top: 5rem;
}

.section h2 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--color-text);
}

.section-description {
    color: var(--color-text-muted);
    font-size: 1.1rem;
    margin-bottom: 2rem;
    max-width: 700px;
}

.feature-highlights {
    display: flex;
    gap: 1rem;
    flex-wrap: wrap;
    margin-bottom: 2rem;
}

.feature-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius-sm);
    font-size: 0.9rem;
}

.feature-icon {
    font-size: 1.25rem;
}

.demo-container {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.demo-canvas-wrapper {
    margin-bottom: 1rem;
}

.heatmap-container {
    min-height: 300px;
    position: relative;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    display: flex;
    justify-content: center;
}

.heatmap-container :deep(canvas) {
    display: block;
    max-width: 100%;
    height: auto;
}

.demo-controls {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
    margin-bottom: 1rem;
}

.legend-controls {
    flex-wrap: wrap;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-bg-tertiary);
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius-sm);
}

.control-group label {
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.control-group select {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    color: var(--color-text);
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.875rem;
}

.range-controls {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
}

.range-control {
    flex: 1;
    min-width: 200px;
}

.range-control label {
    display: block;
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
}

.range-control input[type="range"] {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    outline: none;
}

.range-control input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
}

.fixed-scale-controls {
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--color-border);
}

.fixed-scale-controls .control-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
    font-size: 0.9rem;
    color: var(--color-text);
}

.fixed-scale-controls .control-group input[type="checkbox"],
.fixed-scale-controls .control-group input[type="radio"] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
    cursor: pointer;
}

.fixed-scale-mode {
    display: flex;
    gap: 1rem;
    margin-top: 0.75rem;
    flex-wrap: wrap;
}

.fixed-scale-mode .control-group {
    background: transparent;
    padding: 0.25rem 0;
}

.fixed-scale-mode .control-group label {
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.fixed-scale-controls .range-controls {
    margin-top: 1rem;
}

.fixed-scale-hint {
    margin-top: 0.75rem;
    font-size: 0.8rem;
    color: var(--color-primary);
    font-style: italic;
}

.card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-top: 2rem;
}

.card h4 {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--color-text);
}

@media (max-width: 768px) {
    .section h2 {
        font-size: 1.75rem;
    }

    .feature-highlights {
        flex-direction: column;
    }

    .range-controls {
        flex-direction: column;
    }
}
</style>

<style>
/* Global legend styles for demo */
.demo-legend {
    font-family: "JetBrains Mono", "Fira Code", monospace !important;
    font-size: 11px !important;
    background: rgba(26, 26, 28, 0.95) !important;
    border: 1px solid rgba(249, 115, 22, 0.3) !important;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
}

.demo-legend .heatmap-legend__labels span {
    color: #e4e4e7 !important;
}
</style>
