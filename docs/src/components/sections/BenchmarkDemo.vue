<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import {
    createHeatmap,
    withCanvas2DRenderer,
    withWebGLRenderer,
    isWebGLAvailable,
    type Heatmap,
    type HeatmapPoint
} from "@drdreo/heatmap";

type RendererType = "canvas2d" | "webgl";
type DataDistribution = "random" | "clustered" | "grid" | "diagonal";

interface BenchmarkResult {
    renderer: string;
    pointCount: number;
    canvasSize: string;
    radius: number;
    renderTime: number;
    timestamp: Date;
}

const containerRef = ref<HTMLElement | null>(null);
let heatmap: Heatmap | null = null;

// Configuration
const pointCount = ref(10000);
const canvasWidth = ref(800);
const canvasHeight = ref(600);
const radius = ref(25);
const selectedRenderer = ref<RendererType>("canvas2d");
const dataDistribution = ref<DataDistribution>("random");
const clusterCount = ref(10);

// State
const isRunning = ref(false);
const lastRenderTime = ref<number | null>(null);
const benchmarkResults = ref<BenchmarkResult[]>([]);
const webglAvailable = ref(false);

// Presets
const presets = [
    { name: "Small (1K)", points: 1000, width: 400, height: 300, radius: 20 },
    {
        name: "Medium (10K)",
        points: 10000,
        width: 800,
        height: 600,
        radius: 25
    },
    { name: "Large (50K)", points: 50000, width: 800, height: 600, radius: 15 },
    {
        name: "Very Large (100K)",
        points: 100000,
        width: 1200,
        height: 800,
        radius: 10
    },
    {
        name: "Extreme (200K)",
        points: 200000,
        width: 1200,
        height: 800,
        radius: 8
    }
];

const rendererOptions = computed(() => {
    const options: { value: RendererType; label: string }[] = [
        { value: "canvas2d", label: "Standard Canvas2D" }
    ];
    if (webglAvailable.value) {
        options.push({ value: "webgl", label: "WebGL" });
    }
    return options;
});

function generateData(
    count: number,
    width: number,
    height: number,
    distribution: DataDistribution
): HeatmapPoint[] {
    const points: HeatmapPoint[] = [];

    switch (distribution) {
        case "random":
            for (let i = 0; i < count; i++) {
                points.push({
                    x: Math.random() * width,
                    y: Math.random() * height,
                    value: Math.random() * 100
                });
            }
            break;

        case "clustered": {
            const clusters = Array.from({ length: clusterCount.value }, () => ({
                x: Math.random() * width,
                y: Math.random() * height,
                spread: 20 + Math.random() * 80
            }));

            for (let i = 0; i < count; i++) {
                const cluster =
                    clusters[Math.floor(Math.random() * clusters.length)]!;
                points.push({
                    x: cluster.x + (Math.random() - 0.5) * cluster.spread * 2,
                    y: cluster.y + (Math.random() - 0.5) * cluster.spread * 2,
                    value: Math.random() * 100
                });
            }
            break;
        }

        case "grid": {
            const cols = Math.ceil(Math.sqrt(count * (width / height)));
            const rows = Math.ceil(count / cols);
            const cellWidth = width / cols;
            const cellHeight = height / rows;

            for (let i = 0; i < count; i++) {
                const col = i % cols;
                const row = Math.floor(i / cols);
                points.push({
                    x:
                        (col + 0.5) * cellWidth +
                        (Math.random() - 0.5) * cellWidth * 0.3,
                    y:
                        (row + 0.5) * cellHeight +
                        (Math.random() - 0.5) * cellHeight * 0.3,
                    value: Math.random() * 100
                });
            }
            break;
        }

        case "diagonal":
            for (let i = 0; i < count; i++) {
                const t = i / count;
                const spread = 50;
                points.push({
                    x: t * width + (Math.random() - 0.5) * spread,
                    y: t * height + (Math.random() - 0.5) * spread,
                    value: Math.random() * 100
                });
            }
            break;
    }

    return points;
}

function createHeatmapInstance() {
    if (!containerRef.value) return;

    // Destroy existing
    heatmap?.destroy();

    const config = {
        container: containerRef.value,
        width: canvasWidth.value,
        height: canvasHeight.value,
        radius: radius.value
    };

    switch (selectedRenderer.value) {
        case "canvas2d":
            heatmap = createHeatmap(config, withCanvas2DRenderer());
            break;
        case "webgl":
            heatmap = createHeatmap(config, withWebGLRenderer());
            break;
    }
}

function runBenchmark() {
    if (!containerRef.value || isRunning.value) return;

    isRunning.value = true;
    lastRenderTime.value = null;

    // Recreate heatmap with current settings
    createHeatmapInstance();

    if (!heatmap) {
        isRunning.value = false;
        return;
    }

    // Generate data
    const data = generateData(
        pointCount.value,
        canvasWidth.value,
        canvasHeight.value,
        dataDistribution.value
    );

    // Measure render time
    const start = performance.now();
    heatmap.setData(data);
    const end = performance.now();

    const renderTime = end - start;
    lastRenderTime.value = renderTime;

    // Store result
    const result: BenchmarkResult = {
        renderer: selectedRenderer.value,
        pointCount: pointCount.value,
        canvasSize: `${canvasWidth.value}x${canvasHeight.value}`,
        radius: radius.value,
        renderTime: renderTime,
        timestamp: new Date()
    };

    benchmarkResults.value.unshift(result);

    // Keep only last 20 results
    if (benchmarkResults.value.length > 20) {
        benchmarkResults.value = benchmarkResults.value.slice(0, 20);
    }

    isRunning.value = false;
}

function runAllRenderers() {
    const renderers: RendererType[] = ["canvas2d"];
    if (webglAvailable.value) {
        renderers.push("webgl");
    }

    const originalRenderer = selectedRenderer.value;

    renderers.forEach((renderer, index) => {
        setTimeout(() => {
            selectedRenderer.value = renderer;
            runBenchmark();

            // Restore original after last run
            if (index === renderers.length - 1) {
                setTimeout(() => {
                    selectedRenderer.value = originalRenderer;
                }, 100);
            }
        }, index * 500);
    });
}

function applyPreset(preset: (typeof presets)[0]) {
    pointCount.value = preset.points;
    canvasWidth.value = preset.width;
    canvasHeight.value = preset.height;
    radius.value = preset.radius;
}

function clearResults() {
    benchmarkResults.value = [];
}

function formatTime(ms: number): string {
    if (ms < 1) return `${(ms * 1000).toFixed(2)}μs`;
    if (ms < 1000) return `${ms.toFixed(2)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function getRendererLabel(renderer: string): string {
    switch (renderer) {
        case "canvas2d":
            return "Canvas2D";
        case "webgl":
            return "WebGL";
        default:
            return renderer;
    }
}

function getPerformanceClass(ms: number): string {
    if (ms < 50) return "perf-excellent";
    if (ms < 100) return "perf-good";
    if (ms < 500) return "perf-ok";
    if (ms < 1000) return "perf-slow";
    return "perf-very-slow";
}

onMounted(() => {
    webglAvailable.value = isWebGLAvailable();
    createHeatmapInstance();
});

onUnmounted(() => {
    heatmap?.destroy();
});
</script>

<template>
    <section id="benchmark" class="section">
        <h2>Performance Benchmark</h2>
        <p class="section-description">
            Test and compare renderer performance with different data sizes,
            canvas dimensions, and configurations. Experiment to find the best
            settings for your use case.
        </p>

        <div class="benchmark-layout">
            <!-- Controls Panel -->
            <div class="controls-panel">
                <div class="control-group">
                    <h4>Quick Presets</h4>
                    <div class="preset-buttons">
                        <button
                            v-for="preset in presets"
                            :key="preset.name"
                            class="btn btn-small"
                            @click="applyPreset(preset)"
                        >
                            {{ preset.name }}
                        </button>
                    </div>
                </div>

                <div class="control-group">
                    <h4>Renderer</h4>
                    <select v-model="selectedRenderer" class="select-input">
                        <option
                            v-for="option in rendererOptions"
                            :key="option.value"
                            :value="option.value"
                        >
                            {{ option.label }}
                        </option>
                    </select>
                </div>

                <div class="control-group">
                    <h4>Data Points</h4>
                    <div class="input-with-value">
                        <input
                            type="range"
                            v-model.number="pointCount"
                            min="100"
                            max="500000"
                            step="100"
                            class="range-input"
                        />
                        <input
                            type="number"
                            v-model.number="pointCount"
                            min="100"
                            max="500000"
                            class="number-input"
                        />
                    </div>
                </div>

                <div class="control-group">
                    <h4>Canvas Size</h4>
                    <div class="size-inputs">
                        <label>
                            Width
                            <input
                                type="number"
                                v-model.number="canvasWidth"
                                min="100"
                                max="2000"
                                class="number-input"
                            />
                        </label>
                        <span class="size-separator">x</span>
                        <label>
                            Height
                            <input
                                type="number"
                                v-model.number="canvasHeight"
                                min="100"
                                max="2000"
                                class="number-input"
                            />
                        </label>
                    </div>
                </div>

                <div class="control-group">
                    <h4>Radius: {{ radius }}px</h4>
                    <input
                        type="range"
                        v-model.number="radius"
                        min="5"
                        max="100"
                        class="range-input"
                    />
                </div>

                <div class="control-group">
                    <h4>Data Distribution</h4>
                    <select v-model="dataDistribution" class="select-input">
                        <option value="random">Random</option>
                        <option value="clustered">Clustered</option>
                        <option value="grid">Grid</option>
                        <option value="diagonal">Diagonal</option>
                    </select>
                    <div
                        v-if="dataDistribution === 'clustered'"
                        class="sub-control"
                    >
                        <label>
                            Clusters: {{ clusterCount }}
                            <input
                                type="range"
                                v-model.number="clusterCount"
                                min="2"
                                max="30"
                                class="range-input"
                            />
                        </label>
                    </div>
                </div>

                <div class="control-group actions">
                    <button
                        class="btn btn-primary btn-full"
                        @click="runBenchmark"
                        :disabled="isRunning"
                    >
                        {{ isRunning ? "Running..." : "Run Benchmark" }}
                    </button>
                    <button
                        class="btn btn-full"
                        @click="runAllRenderers"
                        :disabled="isRunning"
                    >
                        Compare All Renderers
                    </button>
                </div>

                <!-- Current Result -->
                <div v-if="lastRenderTime !== null" class="current-result">
                    <div class="result-label">Last Render Time</div>
                    <div
                        class="result-value"
                        :class="getPerformanceClass(lastRenderTime)"
                    >
                        {{ formatTime(lastRenderTime) }}
                    </div>
                    <div class="result-fps">
                        ~{{ Math.round(1000 / lastRenderTime) }} FPS potential
                    </div>
                </div>
            </div>

            <!-- Canvas Panel -->
            <div class="canvas-panel">
                <div
                    ref="containerRef"
                    class="heatmap-container"
                    :style="{
                        width: canvasWidth + 'px',
                        height: canvasHeight + 'px'
                    }"
                ></div>
                <div class="canvas-info">
                    {{ canvasWidth }} x {{ canvasHeight }} pixels |
                    {{ selectedRenderer }} renderer
                </div>
            </div>
        </div>

        <!-- Results History -->
        <div v-if="benchmarkResults.length > 0" class="results-section">
            <div class="results-header">
                <h3>Benchmark History</h3>
                <button class="btn btn-small" @click="clearResults">
                    Clear Results
                </button>
            </div>
            <div class="results-table-wrapper">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Renderer</th>
                            <th>Points</th>
                            <th>Canvas</th>
                            <th>Radius</th>
                            <th>Time</th>
                            <th>FPS</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr
                            v-for="(result, index) in benchmarkResults"
                            :key="index"
                        >
                            <td>
                                <span
                                    class="renderer-badge"
                                    :class="'renderer-' + result.renderer"
                                >
                                    {{ getRendererLabel(result.renderer) }}
                                </span>
                            </td>
                            <td>{{ result.pointCount.toLocaleString() }}</td>
                            <td>{{ result.canvasSize }}</td>
                            <td>{{ result.radius }}px</td>
                            <td :class="getPerformanceClass(result.renderTime)">
                                {{ formatTime(result.renderTime) }}
                            </td>
                            <td>{{ Math.round(1000 / result.renderTime) }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Performance Tips -->
        <div class="tips-section">
            <h3>Performance Tips</h3>
            <div class="tips-grid">
                <div class="tip-card">
                    <h4>Canvas2D Renderer</h4>
                    <p>
                        The default renderer. Uses GPU-accelerated drawImage
                        with dirty-rect optimization for efficient rendering of
                        most datasets.
                    </p>
                </div>
                <div class="tip-card">
                    <h4>WebGL Renderer</h4>
                    <p>
                        Hardware-accelerated rendering. Best for very large
                        datasets and real-time animations when available.
                    </p>
                </div>
                <div class="tip-card">
                    <h4>Radius Impact</h4>
                    <p>
                        Smaller radius = faster rendering. Each point affects
                        fewer pixels, reducing computation time significantly.
                    </p>
                </div>
                <div class="tip-card">
                    <h4>Data Distribution</h4>
                    <p>
                        Clustered data often renders faster due to dirty-rect
                        optimization limiting the re-rendered area.
                    </p>
                </div>
            </div>
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

.benchmark-layout {
    display: grid;
    grid-template-columns: 320px 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

@media (max-width: 900px) {
    .benchmark-layout {
        grid-template-columns: 1fr;
    }
}

/* Controls Panel */
.controls-panel {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 1.25rem;
}

.control-group h4 {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.preset-buttons {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
}

.btn-small {
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
}

.select-input {
    width: 100%;
    padding: 0.6rem 0.75rem;
    font-size: 0.9rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text);
    cursor: pointer;
}

.select-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.range-input {
    width: 100%;
    accent-color: var(--color-primary);
}

.input-with-value {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.number-input {
    width: 100%;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text);
    font-family: "JetBrains Mono", monospace;
}

.number-input:focus {
    outline: none;
    border-color: var(--color-primary);
}

.size-inputs {
    display: flex;
    align-items: flex-end;
    gap: 0.5rem;
}

.size-inputs label {
    flex: 1;
    font-size: 0.75rem;
    color: var(--color-text-muted);
}

.size-separator {
    color: var(--color-text-muted);
    padding-bottom: 0.5rem;
}

.sub-control {
    margin-top: 0.75rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

.actions {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    margin-top: 0.5rem;
}

/* Current Result */
.current-result {
    background: var(--color-bg-tertiary);
    border-radius: var(--border-radius-sm);
    padding: 1rem;
    text-align: center;
}

.result-label {
    font-size: 0.75rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.25rem;
}

.result-value {
    font-size: 2rem;
    font-weight: 700;
    font-family: "JetBrains Mono", monospace;
}

.result-fps {
    font-size: 0.8rem;
    color: var(--color-text-muted);
    margin-top: 0.25rem;
}

/* Performance colors */
.perf-excellent {
    color: #22c55e;
}
.perf-good {
    color: #84cc16;
}
.perf-ok {
    color: #eab308;
}
.perf-slow {
    color: #f97316;
}
.perf-very-slow {
    color: #ef4444;
}

/* Canvas Panel */
.canvas-panel {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 1.25rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    overflow: auto;
}

.heatmap-container {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    position: relative;
    max-width: 100%;
}

.canvas-info {
    margin-top: 1rem;
    font-size: 0.85rem;
    color: var(--color-text-muted);
}

/* Results Section */
.results-section {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 1.25rem;
    margin-bottom: 2rem;
}

.results-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.results-header h3 {
    font-size: 1.1rem;
    font-weight: 600;
}

.results-table-wrapper {
    overflow-x: auto;
}

.results-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9rem;
}

.results-table th,
.results-table td {
    padding: 0.75rem 1rem;
    text-align: left;
    border-bottom: 1px solid var(--color-border);
}

.results-table th {
    font-weight: 600;
    color: var(--color-text-muted);
    font-size: 0.8rem;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.results-table tbody tr:hover {
    background: var(--color-bg-tertiary);
}

.renderer-badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    border-radius: 4px;
    font-size: 0.75rem;
    font-weight: 600;
}

.renderer-canvas2d {
    background: rgba(59, 130, 246, 0.2);
    color: #60a5fa;
}

.renderer-webgl {
    background: rgba(168, 85, 247, 0.2);
    color: #c084fc;
}

/* Tips Section */
.tips-section {
    margin-top: 2rem;
}

.tips-section h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
}

.tips-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 1rem;
}

.tip-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    padding: 1rem;
}

.tip-card h4 {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--color-primary);
    margin-bottom: 0.5rem;
}

.tip-card p {
    font-size: 0.85rem;
    color: var(--color-text-muted);
    line-height: 1.5;
}

@media (max-width: 768px) {
    .section h2 {
        font-size: 1.75rem;
    }

    .benchmark-layout {
        grid-template-columns: 1fr;
    }

    .controls-panel {
        order: 1;
    }

    .canvas-panel {
        order: 0;
    }
}
</style>
