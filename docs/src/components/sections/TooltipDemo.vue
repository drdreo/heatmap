<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
    createHeatmap,
    type Heatmap,
    type HeatmapPoint,
    withTooltip
} from "@drdreo/heatmap";
import CodeBlock from "../ui/CodeBlock.vue";
import ConfigTable, { type ConfigOption } from "../ui/ConfigTable.vue";

const tooltipCode = `import { createHeatmap, withTooltip } from '@drdreo/heatmap';

const heatmap = createHeatmap(
    {
        container: document.querySelector('#container')!,
        width: 800,
        height: 400
    },
    withTooltip({
        formatter: (value, x, y) => \`Value: \${value.toFixed(1)} at (\${x}, \${y})\`,
        offset: { x: 15, y: 15 },
        enforceBounds: true
    })
);`;

const tooltipOptions: ConfigOption[] = [
    {
        name: "formatter",
        type: "(value, x, y) => string",
        default: "v => `${v}`",
        description: "Custom text formatter for tooltip"
    },
    {
        name: "offset",
        type: "{ x, y }",
        default: "{ x: 15, y: 15 }",
        description: "Offset from cursor position"
    },
    {
        name: "enforceBounds",
        type: "boolean",
        default: "false",
        description: "Keep tooltip within container"
    },
    {
        name: "className",
        type: "string",
        default: "'heatmap-tooltip'",
        description: "Custom CSS class name"
    },
    {
        name: "style",
        type: "CSSStyleDeclaration",
        description: "Custom inline styles"
    }
];

const featureHighlights = [
    { icon: "1", label: "Custom Formatters" },
    { icon: "2", label: "Customizable Styles" },
    { icon: "3", label: "Boundary Enforcement" }
];

const containerRef = ref<HTMLElement | null>(null);
let tooltipHeatmap: Heatmap | null = null;

function generateRandomPoints(
    count: number,
    width: number,
    height: number
): HeatmapPoint[] {
    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        value: Math.random() * 100
    }));
}

function handleCanvasClick(event: MouseEvent) {
    if (!tooltipHeatmap) return;

    const rect = tooltipHeatmap.canvas.getBoundingClientRect();
    const scaleX = tooltipHeatmap.width / rect.width;
    const scaleY = tooltipHeatmap.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    tooltipHeatmap.addPoint({ x, y, value: Math.random() * 100 });
}

function handleClear() {
    tooltipHeatmap?.clear();
}

function handleRandomPoints() {
    if (!containerRef.value || !tooltipHeatmap) return;

    const points = generateRandomPoints(
        100,
        containerRef.value.clientWidth,
        containerRef.value.clientHeight
    );
    tooltipHeatmap.addPoints(points);
}

onMounted(() => {
    if (!containerRef.value) return;

    tooltipHeatmap = createHeatmap(
        {
            container: containerRef.value,
            gridSize: 10
        },
        withTooltip({
            formatter: (value, x, y) =>
                `Value: ${value.toFixed(1)} @ (${Math.round(x)}, ${Math.round(y)})`,
            offset: { x: 15, y: 15 },
            className: "with-tooltip",
            enforceBounds: true
        })
    );

    // Initialize with clustered data for better tooltip demo
    const initialData: HeatmapPoint[] = [
        // Cluster 1
        { x: 150, y: 150, value: 95 },
        { x: 170, y: 140, value: 80 },
        { x: 160, y: 170, value: 70 },
        { x: 140, y: 160, value: 85 },
        // Cluster 2
        { x: 400, y: 200, value: 100 },
        { x: 420, y: 190, value: 90 },
        { x: 380, y: 210, value: 75 },
        { x: 410, y: 220, value: 88 },
        // Cluster 3
        { x: 650, y: 300, value: 70 },
        { x: 630, y: 280, value: 65 },
        { x: 670, y: 310, value: 60 }
    ];

    tooltipHeatmap.setData(initialData);
});

onUnmounted(() => {
    tooltipHeatmap?.destroy();
});
</script>

<template>
    <section id="tooltip-demo" class="section">
        <h2>Tooltip Feature</h2>
        <p class="section-description">
            Add interactive tooltips that display values when hovering over data
            points. Hover over the heatmap to see it in action!
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
                <div
                    ref="containerRef"
                    class="heatmap-container"
                    @click="handleCanvasClick"
                ></div>
            </div>
            <div class="demo-controls">
                <button class="btn" @click="handleClear">Clear</button>
                <button class="btn btn-primary" @click="handleRandomPoints">
                    Add Random Points
                </button>
            </div>
        </div>

        <CodeBlock title="Code" language="typescript">{{
            tooltipCode
        }}</CodeBlock>

        <div class="card config-card">
            <h4>TooltipConfig Options</h4>
            <ConfigTable :options="tooltipOptions" />
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
    min-height: 200px;
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
    cursor: crosshair;
    max-width: 100%;
    height: auto;
}

.demo-controls {
    display: flex;
    gap: 0.75rem;
    flex-wrap: wrap;
    align-items: center;
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
}
</style>

<style>
/* Global tooltip styles */
.with-tooltip {
    font-family: "JetBrains Mono", "Fira Code", monospace !important;
    font-size: 12px !important;
    background: rgba(249, 115, 22, 0.95) !important;
    border-radius: 6px !important;
    padding: 6px 10px !important;
}
</style>
