<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from "vue";
import {
    createHeatmap,
    withWebGLRenderer,
    withCanvas2DRenderer,
    isWebGLAvailable,
    type Heatmap,
    type HeatmapPoint
} from "@drdreo/heatmap";
import CodeBlock from "../ui/CodeBlock.vue";

const webglCode = `import { createHeatmap, withWebGLRenderer } from '@drdreo/heatmap';

// Create a heatmap with WebGL rendering
const heatmap = createHeatmap(
    {
        container: document.querySelector('#container')!,
        width: 800,
        height: 400
    },
    withWebGLRenderer()  // GPU-accelerated rendering
);

// Use exactly like a regular heatmap
heatmap.setData({
    min: 0,
    max: 100,
    data: points
});`;

const fallbackCode = `import { createHeatmap, withWebGLRenderer, isWebGLAvailable } from '@drdreo/heatmap';

// Check WebGL availability
if (isWebGLAvailable()) {
    console.log('WebGL is supported!');
}

// WebGL with automatic Canvas2D fallback (default)
const heatmap = createHeatmap(
    { container },
    withWebGLRenderer()  // Falls back to Canvas2D if needed
);

// Disable fallback to require WebGL
const heatmap = createHeatmap(
    { container },
    withWebGLRenderer({ fallback: false })  // Throws if WebGL unavailable
);`;

const webglAvailable = ref(false);
const canvas2DContainerRef = ref<HTMLElement | null>(null);
const webglContainerRef = ref<HTMLElement | null>(null);

// Performance test state
const pointCounts = [1000, 5000, 10000, 25000, 50000];
const selectedPointCount = ref(10000);
const isRunning = ref(false);

const canvas2DTime = ref<number | null>(null);
const webglTime = ref<number | null>(null);
const canvas2DFps = ref<number | null>(null);
const webglFps = ref<number | null>(null);

let canvas2DHeatmap: Heatmap | null = null;
let webglHeatmap: Heatmap | null = null;

const speedup = computed(() => {
    if (canvas2DTime.value && webglTime.value && webglTime.value > 0) {
        return (canvas2DTime.value / webglTime.value).toFixed(1);
    }
    return null;
});

function generateRandomPoints(
    count: number,
    width: number,
    height: number
): HeatmapPoint[] {
    const points: HeatmapPoint[] = [];
    for (let i = 0; i < count; i++) {
        points.push({
            x: Math.random() * width,
            y: Math.random() * height,
            value: Math.random() * 100
        });
    }
    return points;
}

function measureRenderTime(
    heatmap: Heatmap,
    points: HeatmapPoint[]
): Promise<number> {
    return new Promise((resolve) => {
        const start = performance.now();
        heatmap.setData({ min: 0, max: 100, data: points });
        // Wait for actual paint to complete (double rAF)
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                resolve(performance.now() - start);
            });
        });
    });
}

function measureFps(
    heatmap: Heatmap,
    points: HeatmapPoint[],
    duration: number = 1000
): Promise<number> {
    return new Promise((resolve) => {
        // Pre-generate modified point sets to exclude computation from timing
        const frameVariants = Array.from({ length: 60 }, (_, frameIdx) =>
            points.map((p, i) => ({
                ...p,
                value: p.value + Math.sin(frameIdx * 0.1 + i * 0.01) * 5
            }))
        );

        let frameCount = 0;
        const startTime = performance.now();

        function frame() {
            // Use pre-generated points, cycling through variants
            const variantIdx = frameCount % frameVariants.length;
            heatmap.setData({
                min: 0,
                max: 100,
                data: frameVariants[variantIdx]
            });
            frameCount++;

            if (performance.now() - startTime < duration) {
                requestAnimationFrame(frame);
            } else {
                const elapsed = performance.now() - startTime;
                resolve((frameCount / elapsed) * 1000);
            }
        }

        requestAnimationFrame(frame);
    });
}

async function runBenchmark() {
    if (
        !canvas2DContainerRef.value ||
        !webglContainerRef.value ||
        isRunning.value
    )
        return;

    isRunning.value = true;
    canvas2DTime.value = null;
    webglTime.value = null;
    canvas2DFps.value = null;
    webglFps.value = null;

    const width = canvas2DContainerRef.value.clientWidth;
    const height = canvas2DContainerRef.value.clientHeight;
    const points = generateRandomPoints(
        selectedPointCount.value,
        width,
        height
    );

    // Clean up existing heatmaps
    canvas2DHeatmap?.destroy();
    webglHeatmap?.destroy();

    // Create Canvas2D heatmap
    canvas2DHeatmap = createHeatmap(
        {
            container: canvas2DContainerRef.value,
            width,
            height,
            radius: 15
        },
        withCanvas2DRenderer()
    );

    // Create WebGL heatmap
    webglHeatmap = createHeatmap(
        {
            container: webglContainerRef.value,
            width,
            height,
            radius: 15
        },
        withWebGLRenderer()
    );

    // Wait for next frame to ensure canvases are ready
    await new Promise((resolve) => requestAnimationFrame(resolve));

    // Warmup runs to eliminate JIT compilation bias
    const warmupPoints = generateRandomPoints(100, width, height);
    await measureRenderTime(canvas2DHeatmap, warmupPoints);
    await measureRenderTime(webglHeatmap, warmupPoints);

    // Measure initial render time
    canvas2DTime.value = await measureRenderTime(canvas2DHeatmap, points);
    webglTime.value = await measureRenderTime(webglHeatmap, points);

    // Measure FPS over 1 second
    await new Promise((resolve) => setTimeout(resolve, 100));

    canvas2DFps.value = await measureFps(canvas2DHeatmap, points, 1000);
    webglFps.value = await measureFps(webglHeatmap, points, 1000);

    isRunning.value = false;
}

function formatTime(ms: number | null): string {
    if (ms === null) return "-";
    if (ms < 1) return `${(ms * 1000).toFixed(0)}us`;
    if (ms < 1000) return `${ms.toFixed(1)}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
}

function formatFps(fps: number | null): string {
    if (fps === null) return "-";
    return `${fps.toFixed(0)} FPS`;
}

onMounted(() => {
    webglAvailable.value = isWebGLAvailable();

    if (canvas2DContainerRef.value && webglContainerRef.value) {
        const width = canvas2DContainerRef.value.clientWidth;
        const height = canvas2DContainerRef.value.clientHeight;

        // Initialize with some demo data
        const demoPoints = generateRandomPoints(5000, width, height);

        canvas2DHeatmap = createHeatmap(
            {
                container: canvas2DContainerRef.value,
                width,
                height,
                radius: 15
            },
            withCanvas2DRenderer()
        );

        webglHeatmap = createHeatmap(
            {
                container: webglContainerRef.value,
                width,
                height,
                radius: 15
            },
            withWebGLRenderer()
        );

        canvas2DHeatmap.setData({ min: 0, max: 100, data: demoPoints });
        webglHeatmap.setData({ min: 0, max: 100, data: demoPoints });
    }
});

onUnmounted(() => {
    canvas2DHeatmap?.destroy();
    webglHeatmap?.destroy();
});
</script>

<template>
    <section id="webgl-demo" class="section">
        <h2>WebGL Renderer</h2>
        <p class="section-description">
            For large datasets, use the WebGL renderer for GPU-accelerated
            rendering. It provides significant performance improvements,
            especially when rendering thousands of points.
        </p>

        <div class="webgl-status" :class="{ available: webglAvailable }">
            <span class="status-icon">{{
                webglAvailable ? "&#x2714;" : "&#x2716;"
            }}</span>
            <span
                >WebGL is
                {{ webglAvailable ? "available" : "not available" }} in your
                browser</span
            >
        </div>

        <div class="demo-container">
            <h3>Performance Comparison</h3>
            <p class="demo-description">
                Compare rendering performance between Canvas2D and WebGL
                renderers. Select a point count and run the benchmark to see the
                difference.
            </p>

            <div class="benchmark-controls">
                <div class="control-group">
                    <label for="point-count">Number of Points:</label>
                    <select
                        id="point-count"
                        v-model="selectedPointCount"
                        :disabled="isRunning"
                    >
                        <option
                            v-for="count in pointCounts"
                            :key="count"
                            :value="count"
                        >
                            {{ count.toLocaleString() }}
                        </option>
                    </select>
                </div>
                <button
                    class="btn btn-primary"
                    @click="runBenchmark"
                    :disabled="isRunning || !webglAvailable"
                >
                    {{ isRunning ? "Running..." : "Run Benchmark" }}
                </button>
            </div>

            <div class="comparison-grid">
                <div class="renderer-panel">
                    <div class="renderer-header">
                        <h4>Canvas2D</h4>
                        <span class="renderer-badge">CPU</span>
                    </div>
                    <div
                        ref="canvas2DContainerRef"
                        class="heatmap-container"
                    ></div>
                    <div class="renderer-stats">
                        <div class="stat">
                            <span class="stat-label">Render Time</span>
                            <span class="stat-value">{{
                                formatTime(canvas2DTime)
                            }}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Throughput</span>
                            <span class="stat-value">{{
                                formatFps(canvas2DFps)
                            }}</span>
                        </div>
                    </div>
                </div>

                <div class="renderer-panel webgl">
                    <div class="renderer-header">
                        <h4>WebGL</h4>
                        <span class="renderer-badge gpu">GPU</span>
                    </div>
                    <div
                        ref="webglContainerRef"
                        class="heatmap-container"
                    ></div>
                    <div class="renderer-stats">
                        <div class="stat">
                            <span class="stat-label">Render Time</span>
                            <span class="stat-value highlight">{{
                                formatTime(webglTime)
                            }}</span>
                        </div>
                        <div class="stat">
                            <span class="stat-label">Throughput</span>
                            <span class="stat-value highlight">{{
                                formatFps(webglFps)
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="speedup" class="speedup-banner">
                <span class="speedup-icon">&#x26A1;</span>
                <span
                    >WebGL is <strong>{{ speedup }}x faster</strong> for initial
                    render</span
                >
            </div>
        </div>

        <CodeBlock title="Basic Usage" language="typescript">{{
            webglCode
        }}</CodeBlock>

        <div class="feature-grid">
            <div class="feature-card">
                <div class="feature-icon">&#x1F680;</div>
                <h4>GPU Acceleration</h4>
                <p>
                    Offloads rendering to the GPU for massive performance gains
                    with large datasets.
                </p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">&#x1F504;</div>
                <h4>Automatic Fallback</h4>
                <p>
                    Falls back to Canvas2D automatically if WebGL is
                    unavailable.
                </p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">&#x1F9E9;</div>
                <h4>Same API</h4>
                <p>
                    Works exactly like the default renderer - no code changes
                    needed.
                </p>
            </div>
            <div class="feature-card">
                <div class="feature-icon">&#x2699;</div>
                <h4>Configurable</h4>
                <p>Options for antialiasing and fallback behavior.</p>
            </div>
        </div>

        <CodeBlock title="Fallback Handling" language="typescript">{{
            fallbackCode
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

.webgl-status {
    display: inline-flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem 1rem;
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    margin-bottom: 2rem;
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

.webgl-status.available {
    border-color: #22c55e;
    color: #22c55e;
}

.webgl-status .status-icon {
    font-size: 1.1rem;
}

.demo-container {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.demo-container h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.demo-description {
    color: var(--color-text-muted);
    font-size: 0.95rem;
    margin-bottom: 1.5rem;
}

.benchmark-controls {
    display: flex;
    gap: 1rem;
    align-items: center;
    margin-bottom: 1.5rem;
    flex-wrap: wrap;
}

.control-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.control-group label {
    font-size: 0.9rem;
    color: var(--color-text-muted);
}

.control-group select {
    padding: 0.5rem 1rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text);
    font-size: 0.9rem;
    cursor: pointer;
}

.control-group select:disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.comparison-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
}

.renderer-panel {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    overflow: hidden;
}

.renderer-panel.webgl {
    border-color: var(--color-primary);
}

.renderer-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary);
    border-bottom: 1px solid var(--color-border);
}

.renderer-header h4 {
    font-size: 0.95rem;
    font-weight: 600;
    margin: 0;
}

.renderer-badge {
    font-size: 0.7rem;
    font-weight: 600;
    padding: 0.2rem 0.5rem;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.renderer-badge.gpu {
    background: var(--color-primary);
    color: white;
}

.heatmap-container {
    height: 200px;
    position: relative;
    background: var(--color-bg);
}

.heatmap-container :deep(canvas) {
    display: block;
    max-width: 100%;
    height: auto;
}

.renderer-stats {
    display: flex;
    gap: 1rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg-secondary);
    border-top: 1px solid var(--color-border);
}

.stat {
    display: flex;
    flex-direction: column;
    gap: 0.2rem;
}

.stat-label {
    font-size: 0.7rem;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.stat-value {
    font-family: "JetBrains Mono", "Fira Code", monospace;
    font-size: 0.9rem;
    font-weight: 600;
}

.stat-value.highlight {
    color: var(--color-primary);
}

.speedup-banner {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 1rem;
    background: linear-gradient(
        135deg,
        rgba(249, 115, 22, 0.1),
        rgba(249, 115, 22, 0.05)
    );
    border: 1px solid var(--color-primary);
    border-radius: var(--border-radius-sm);
    margin-top: 1rem;
    font-size: 1rem;
}

.speedup-icon {
    font-size: 1.25rem;
}

.speedup-banner strong {
    color: var(--color-primary);
}

.feature-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin: 2rem 0;
}

.feature-card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 1.25rem;
}

.feature-icon {
    font-size: 1.5rem;
    margin-bottom: 0.75rem;
}

.feature-card h4 {
    font-size: 1rem;
    font-weight: 600;
    margin-bottom: 0.5rem;
}

.feature-card p {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    line-height: 1.5;
}

@media (max-width: 768px) {
    .section h2 {
        font-size: 1.75rem;
    }

    .comparison-grid {
        grid-template-columns: 1fr;
    }

    .benchmark-controls {
        flex-direction: column;
        align-items: stretch;
    }

    .control-group {
        justify-content: space-between;
    }
}
</style>
