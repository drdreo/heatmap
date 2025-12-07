<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
    createHeatmap,
    type Heatmap,
    type HeatmapPoint
} from "@drdreo/heatmap";
import CodeBlock from "../ui/CodeBlock.vue";

const basicCode = `import { createHeatmap } from '@drdreo/heatmap';

const heatmap = createHeatmap({
    container: document.querySelector('#container')!,
    width: 800,
    height: 400
});

// Add a single point
heatmap.addPoint({ x: 200, y: 200, value: 80 });

// Add multiple points
heatmap.addPoints([
    { x: 100, y: 100, value: 50 },
    { x: 300, y: 200, value: 70 }
]);`;

const containerRef = ref<HTMLElement | null>(null);
const pointCount = ref(0);
const showStats = ref(false);

// Stats state
const stats = ref({
    pointCount: 0,
    radius: 25,
    gridSize: 0,
    dataRange: "-",
    canvasSize: "-",
    renderBounds: "-",
    coverage: "0%"
});

let basicHeatmap: Heatmap | null = null;

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

function updateStatsDisplay() {
    if (!showStats.value || !basicHeatmap) return;

    const heatmapStats = basicHeatmap.getStats();

    stats.value = {
        pointCount: heatmapStats.pointCount,
        radius: heatmapStats.radius,
        gridSize: heatmapStats.valueGridSize,
        dataRange: heatmapStats.dataRange
            ? `${heatmapStats.dataRange.min.toFixed(1)} - ${heatmapStats.dataRange.max.toFixed(1)}`
            : "-",
        canvasSize: `${heatmapStats.canvasSize.width} x ${heatmapStats.canvasSize.height}`,
        renderBounds: `(${heatmapStats.renderBoundaries.minX.toFixed(0)}, ${heatmapStats.renderBoundaries.minY.toFixed(0)}) -> (${heatmapStats.renderBoundaries.maxX.toFixed(0)}, ${heatmapStats.renderBoundaries.maxY.toFixed(0)}) [${heatmapStats.renderBoundaries.width.toFixed(0)} x ${heatmapStats.renderBoundaries.height.toFixed(0)}]`,
        coverage: `${heatmapStats.renderCoveragePercent.toFixed(1)}%`
    };
}

function handleCanvasClick(event: MouseEvent) {
    if (!basicHeatmap) return;

    const rect = basicHeatmap.canvas.getBoundingClientRect();
    const scaleX = basicHeatmap.width / rect.width;
    const scaleY = basicHeatmap.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    basicHeatmap.addPoint({ x, y, value: Math.random() * 100 });
    pointCount.value++;
    updateStatsDisplay();
}

function handleClear() {
    basicHeatmap?.clear();
    pointCount.value = 0;
    updateStatsDisplay();
}

function handleRandomPoints() {
    if (!containerRef.value || !basicHeatmap) return;

    const points = generateRandomPoints(
        200,
        containerRef.value.clientWidth,
        containerRef.value.clientHeight
    );
    basicHeatmap.addPoints(points);
    pointCount.value += points.length;
    updateStatsDisplay();
}

function handleStatsToggle() {
    if (showStats.value) {
        updateStatsDisplay();
    }
}

onMounted(() => {
    if (!containerRef.value) return;

    const width = containerRef.value.clientWidth;
    const height = containerRef.value.clientHeight;

    basicHeatmap = createHeatmap({
        container: containerRef.value,
        width,
        height
    });

    const initialData: HeatmapPoint[] = [
        { x: 200, y: 20, value: 80 },
        { x: 250, y: 180, value: 60 },
        { x: 300, y: 220, value: 90 },
        { x: 500, y: 150, value: 70 },
        { x: 550, y: 180, value: 85 },
        { x: 400, y: 30, value: 50 }
    ];

    basicHeatmap.setData({ min: 0, max: 100, data: initialData });
    pointCount.value = initialData.length;
});

onUnmounted(() => {
    basicHeatmap?.destroy();
});
</script>

<template>
    <section id="basic-demo" class="section">
        <h2>Basic Demo</h2>
        <p class="section-description">
            Click anywhere on the canvas to add data points. The heatmap
            visualizes intensity based on point values.
        </p>

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
                <label class="checkbox-label">
                    <input
                        type="checkbox"
                        v-model="showStats"
                        @change="handleStatsToggle"
                    />
                    Show Debug Stats
                </label>
            </div>
            <div class="demo-info">
                <span>Points: {{ pointCount }}</span>
            </div>

            <!-- Debug Stats Panel -->
            <div v-if="showStats" class="stats-panel">
                <h4>Debug Stats</h4>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Points</span>
                        <span class="stat-value">{{ stats.pointCount }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Radius</span>
                        <span class="stat-value">{{ stats.radius }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Value Grid Size</span>
                        <span class="stat-value">{{ stats.gridSize }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Data Range</span>
                        <span class="stat-value">{{ stats.dataRange }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Canvas Size</span>
                        <span class="stat-value">{{ stats.canvasSize }}</span>
                    </div>
                    <div class="stat-item full-width">
                        <span class="stat-label">Render Boundaries</span>
                        <span class="stat-value">{{ stats.renderBounds }}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Render Coverage</span>
                        <span class="stat-value">{{ stats.coverage }}</span>
                    </div>
                </div>
            </div>
        </div>

        <CodeBlock title="Code" language="typescript">{{
            basicCode
        }}</CodeBlock>
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

.demo-info {
    margin-top: 1rem;
    padding: 0.75rem;
    background: var(--color-bg-tertiary);
    border-radius: var(--border-radius-sm);
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.checkbox-label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 0.875rem;
    cursor: pointer;
    background: var(--color-bg-tertiary);
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius-sm);
}

.checkbox-label input[type="checkbox"] {
    accent-color: var(--color-primary);
}

/* Debug Stats Panel */
.stats-panel {
    margin-top: 1.5rem;
    padding: 1.25rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
}

.stats-panel h4 {
    font-size: 0.95rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--color-primary);
}

.stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    padding: 0.75rem;
    background: var(--color-bg-tertiary);
    border-radius: var(--border-radius-sm);
}

.stat-item.full-width {
    grid-column: 1 / -1;
}

.stat-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-value {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.9rem;
    color: var(--color-text);
    font-weight: 500;
}

@media (max-width: 768px) {
    .section h2 {
        font-size: 1.75rem;
    }
}
</style>
