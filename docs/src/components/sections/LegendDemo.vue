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
    GRADIENT_DEFAULT
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
heatmap.setData({ min: 0, max: 100, data: points });

// Legend updates automatically when gradient changes
heatmap.setGradient(GRADIENT_COOL);`;

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
    { icon: "4", label: "CSS Themeable" }
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
const dataMin = ref(0);
const dataMax = ref(100);

let legendHeatmap: Heatmap | null = null;

function generateClusteredPoints(
    count: number,
    width: number,
    height: number
): HeatmapPoint[] {
    const points: HeatmapPoint[] = [];

    for (let i = 0; i < count; i++) {
        const cluster = Math.floor(Math.random() * 3);
        let x: number, y: number, value: number;

        switch (cluster) {
            case 0: // High value cluster
                x = 150 + Math.random() * 100;
                y = 120 + Math.random() * 80;
                value = 70 + Math.random() * 30;
                break;
            case 1: // Medium value cluster
                x = 450 + Math.random() * 120;
                y = 180 + Math.random() * 100;
                value = 40 + Math.random() * 30;
                break;
            default: // Low value scattered
                x = Math.random() * width;
                y = Math.random() * height;
                value = Math.random() * 40;
        }

        points.push({ x, y, value });
    }

    return points;
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

function handleDataRangeChange() {
    if (!legendHeatmap || !containerRef.value) return;

    const points = generateClusteredPoints(
        80,
        containerRef.value.clientWidth,
        containerRef.value.clientHeight
    );

    // Scale points to new range
    const scaledPoints = points.map((p) => ({
        ...p,
        value: dataMin.value + (p.value / 100) * (dataMax.value - dataMin.value)
    }));

    legendHeatmap.setData({
        min: dataMin.value,
        max: dataMax.value,
        data: scaledPoints
    });
}

function recreateHeatmap() {
    if (!containerRef.value) return;

    // Destroy existing
    legendHeatmap?.destroy();

    // Get current gradient
    const preset = gradientPresets.find(
        (p) => p.name === selectedGradient.value
    );

    // Create new heatmap with updated legend config
    legendHeatmap = createHeatmap(
        {
            container: containerRef.value,
            gradient: preset?.value
        },
        withLegend({
            position: selectedPosition.value,
            orientation: selectedOrientation.value,
            labelCount: 5,
            formatter: (value) => `${Math.round(value)}`,
            className: "demo-legend"
        })
    );

    // Set initial data
    const points = generateClusteredPoints(
        80,
        containerRef.value.clientWidth,
        containerRef.value.clientHeight
    );

    const scaledPoints = points.map((p) => ({
        ...p,
        value: dataMin.value + (p.value / 100) * (dataMax.value - dataMin.value)
    }));

    legendHeatmap.setData({
        min: dataMin.value,
        max: dataMax.value,
        data: scaledPoints
    });
}

function handleRandomize() {
    if (!legendHeatmap || !containerRef.value) return;

    const points = generateClusteredPoints(
        80,
        containerRef.value.clientWidth,
        containerRef.value.clientHeight
    );

    const scaledPoints = points.map((p) => ({
        ...p,
        value: dataMin.value + (p.value / 100) * (dataMax.value - dataMin.value)
    }));

    legendHeatmap.setData({
        min: dataMin.value,
        max: dataMax.value,
        data: scaledPoints
    });
}

onMounted(() => {
    if (!containerRef.value) return;

    legendHeatmap = createHeatmap(
        {
            container: containerRef.value
        },
        withLegend({
            position: selectedPosition.value,
            orientation: selectedOrientation.value,
            labelCount: 5,
            formatter: (value) => `${Math.round(value)}`,
            className: "demo-legend"
        })
    );

    // Initialize with clustered data
    const points = generateClusteredPoints(
        80,
        containerRef.value.clientWidth,
        containerRef.value.clientHeight
    );

    legendHeatmap.setData({
        min: dataMin.value,
        max: dataMax.value,
        data: points
    });
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
                <button class="btn btn-primary" @click="handleRandomize">
                    Randomize Data
                </button>
            </div>
            <div class="range-controls">
                <div class="range-control">
                    <label for="data-min">Min Value: {{ dataMin }}</label>
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
                    <label for="data-max">Max Value: {{ dataMax }}</label>
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
