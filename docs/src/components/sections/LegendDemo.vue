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

// Basic legend - scale auto-detected from data
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

// Fixed scale - set at creation time
const fixedScaleHeatmap = createHeatmap(
    {
        container: document.querySelector('#container')!,
        valueMin: 0,    // Fixed minimum
        valueMax: 100,  // Fixed maximum
        gradient: GRADIENT_THERMAL
    },
    withLegend({ position: 'bottom-right' })
);

// Or update scale dynamically using setScale()
heatmap.setScale(0, 100);  // Set fixed scale
heatmap.setScale(undefined, undefined);  // Reset to auto-detect

// Legend updates automatically when data changes
heatmap.setData(points);

// Legend updates automatically when gradient changes
heatmap.setGradient(GRADIENT_COOL);`;

const legendOptions: ConfigOption[] = [
    {
        name: "container",
        type: "HTMLElement",
        default: "heatmap container",
        description:
            "Custom container element for the legend. When provided, position styles are disabled."
    },
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
    { icon: "4", label: "Fixed Scale" }
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

// Fixed scale controls
const useFixedScale = ref(false);
const fixedMin = ref(0);
const fixedMax = ref(100);

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
    if (!legendHeatmap) return;

    // Use setScale API instead of recreating the heatmap
    if (useFixedScale.value) {
        legendHeatmap.setScale(fixedMin.value, fixedMax.value);
    } else {
        // Reset to auto-detect
        legendHeatmap.setScale(undefined, undefined);
    }
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

    // Build heatmap config with optional fixed scale
    const heatmapConfig: Parameters<typeof createHeatmap>[0] = {
        container: containerRef.value,
        gradient: preset?.value,
        // Apply fixed scale to HeatmapConfig (affects both rendering AND legend)
        ...(useFixedScale.value && {
            valueMin: fixedMin.value,
            valueMax: fixedMax.value
        })
    };

    // Build legend config
    const legendConfig: Parameters<typeof withLegend>[0] = {
        position: selectedPosition.value,
        orientation: selectedOrientation.value,
        labelCount: 5,
        formatter: (value) => `${Math.round(value)}`,
        className: "demo-legend"
    };

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

            <!-- Fixed Scale Controls -->
            <div class="fixed-scale-controls">
                <div class="control-group">
                    <label>
                        <input
                            type="checkbox"
                            v-model="useFixedScale"
                            @change="handleFixedScaleChange"
                        />
                        Use Fixed Scale
                    </label>
                </div>
                <div class="range-controls" v-if="useFixedScale">
                    <div class="range-control">
                        <label for="fixed-min">Fixed Min: {{ fixedMin }}</label>
                        <input
                            type="range"
                            id="fixed-min"
                            min="-300"
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
                            min="55"
                            max="300"
                            v-model.number="fixedMax"
                            @change="handleFixedScaleChange"
                        />
                    </div>
                </div>
                <p class="fixed-scale-hint" v-if="useFixedScale">
                    💡 Fixed scale uses <code>valueMin</code>/<code
                        >valueMax</code
                    >
                    on HeatmapConfig. Both rendering intensity and legend labels
                    use this scale.
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
}

.fixed-scale-controls .control-group {
    margin-bottom: 1rem;
}

.fixed-scale-controls .control-group label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    cursor: pointer;
}

.fixed-scale-controls .control-group input[type="checkbox"] {
    width: 16px;
    height: 16px;
    accent-color: var(--color-primary);
}

.fixed-scale-hint {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-top: 0.75rem;
    padding: 0.5rem;
    background: rgba(249, 115, 22, 0.1);
    border-radius: 4px;
    border-left: 3px solid var(--color-primary);
}

.fixed-scale-hint code {
    background: var(--color-bg-secondary);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-size: 0.75rem;
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

/* Scale Correction Test Styles */
.scale-test-card {
    margin-top: 2rem;
}

.scale-test-card h4 {
    font-size: 1.2rem;
    margin-bottom: 0.5rem;
}

.scale-test-description {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    margin-bottom: 1.5rem;
}

.scale-test-controls {
    display: flex;
    gap: 1.5rem;
    flex-wrap: wrap;
    margin-bottom: 1.5rem;
    align-items: flex-end;
}

.scale-test-controls .control-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
}

.scale-test-controls input[type="range"] {
    width: 200px;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    outline: none;
}

.scale-test-controls input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
}

.scale-test-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 2rem;
    background: var(--color-bg-tertiary);
    border-radius: var(--border-radius-sm);
    overflow: hidden;
    min-height: 400px;
    align-items: center;
    justify-content: center;
}

.scale-reference {
    width: 640px;
    height: 4px;
    background: linear-gradient(90deg, var(--color-primary), transparent);
    position: relative;
    margin-bottom: 1rem;
}

.reference-label {
    position: absolute;
    top: -20px;
    left: 0;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    white-space: nowrap;
}

.scale-test-wrapper {
    transform-origin: center center;
    transition: transform 0.2s ease-out;
}

.scale-test-heatmap {
    width: 640px;
    height: 320px;
    min-height: unset;
}

.scale-test-info {
    margin-top: 1.5rem;
    padding: 1rem;
    background: rgba(249, 115, 22, 0.1);
    border-radius: 4px;
    border-left: 3px solid var(--color-primary);
    font-size: 0.875rem;
}

.scale-test-info p {
    margin-bottom: 0.75rem;
}

.scale-test-info ul {
    margin: 0.75rem 0;
    padding-left: 1.5rem;
}

.scale-test-info li {
    margin-bottom: 0.5rem;
    color: var(--color-text-muted);
}

.scale-test-info code {
    background: var(--color-bg-secondary);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-size: 0.8rem;
}

.scale-debug {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    color: var(--color-text-muted);
    margin-top: 1rem;
}

.custom-legend-container {
    display: flex;
    justify-content: center;
    margin-top: 1rem;
}

.code-example {
    background: var(--color-bg-tertiary);
    padding: 0.75rem 1rem;
    border-radius: 4px;
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.8rem;
    overflow-x: auto;
    margin: 0.75rem 0;
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
