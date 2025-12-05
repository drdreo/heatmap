<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
    createHeatmap,
    type AnimatedHeatmap,
    type TemporalHeatmapPoint,
    withAnimation
} from "@drdreo/heatmap";
import CodeBlock from "../ui/CodeBlock.vue";
import ConfigTable, { type ConfigOption } from "../ui/ConfigTable.vue";

const animationCode = `import { createHeatmap, withAnimation, type AnimatedHeatmap } from '@drdreo/heatmap';

const heatmap = createHeatmap(
    {
        container: document.querySelector('#container')!,
        width: 800,
        height: 400
    },
    withAnimation({
        fadeOutDuration: 2000,
        timeWindow: 5000,
        playbackSpeed: 1,
        loop: true,
        onFrame: (timestamp, progress) => {
            console.log(\`Progress: \${(progress * 100).toFixed(1)}%\`);
        }
    })
) as AnimatedHeatmap;

// Set temporal data
heatmap.setTemporalData({
    min: 0,
    max: 100,
    startTime: 0,
    endTime: 30000,
    data: [
        { x: 100, y: 100, value: 50, timestamp: 1000 },
        { x: 200, y: 150, value: 70, timestamp: 2000 },
        // ... more points
    ]
});

// Control playback
heatmap.play();
heatmap.pause();
heatmap.seek(5000); // Seek to 5 seconds
heatmap.setSpeed(2); // 2x speed`;

const animationOptions: ConfigOption[] = [
    {
        name: "fadeOutDuration",
        type: "number",
        default: "2000",
        description: "Point fade-out duration in ms"
    },
    {
        name: "timeWindow",
        type: "number",
        default: "5000",
        description: "Time window for point accumulation"
    },
    {
        name: "playbackSpeed",
        type: "number",
        default: "1",
        description: "Animation speed multiplier"
    },
    {
        name: "loop",
        type: "boolean",
        default: "false",
        description: "Whether to loop the animation"
    },
    {
        name: "onFrame",
        type: "(timestamp, progress) => void",
        description: "Callback on each animation frame"
    },
    {
        name: "onComplete",
        type: "() => void",
        description: "Callback when animation completes"
    }
];

const featureHighlights = [
    { icon: "1", label: "Temporal Data" },
    { icon: "2", label: "Loop Support" },
    { icon: "3", label: "Playback Control" },
    { icon: "4", label: "Fade Effects" }
];

const containerRef = ref<HTMLElement | null>(null);
const animationTime = ref("00:00");
const animationState = ref("Idle");
const animationProgress = ref(0);
const playbackSpeed = ref(1);
const loopEnabled = ref(false);

let animatedHeatmap: AnimatedHeatmap | null = null;

function generateTemporalData(): {
    min: number;
    max: number;
    startTime: number;
    endTime: number;
    data: TemporalHeatmapPoint[];
} {
    const duration = 30000; // 30 seconds
    const data: TemporalHeatmapPoint[] = [];
    const numPoints = 1000;

    for (let i = 0; i < numPoints; i++) {
        const timestamp = Math.random() * duration;
        let x: number, y: number;
        const cluster = Math.floor(Math.random() * 4);

        switch (cluster) {
            case 0: // Top-left cluster
                x = 100 + Math.random() * 150;
                y = 80 + Math.random() * 100;
                break;
            case 1: // Center cluster
                x = 350 + Math.random() * 100;
                y = 150 + Math.random() * 100;
                break;
            case 2: // Right cluster
                x = 600 + Math.random() * 150;
                y = 200 + Math.random() * 150;
                break;
            default: // Random
                x = Math.random() * 800;
                y = Math.random() * 400;
        }

        data.push({
            x,
            y,
            value: 30 + Math.random() * 70,
            timestamp
        });
    }

    return {
        min: 0,
        max: 100,
        startTime: 0,
        endTime: duration,
        data: data.sort((a, b) => a.timestamp - b.timestamp)
    };
}

function updateAnimationUI(timestamp: number, progress: number) {
    animationProgress.value = progress * 100;
    const seconds = Math.floor(timestamp / 1000);
    const ms = Math.floor((timestamp % 1000) / 10);
    animationTime.value = `${String(seconds).padStart(2, "0")}:${String(ms).padStart(2, "0")}`;
}

function handleTogglePlayPause() {
    if (animationState.value === "Playing") {
        animatedHeatmap?.pause();
        animationState.value = "Paused";
    } else {
        animatedHeatmap?.play();
        animationState.value = "Playing";
    }
}

function handleStop() {
    animatedHeatmap?.stop();
    animationState.value = "Idle";
    animatedHeatmap?.setTemporalData(generateTemporalData());
}

function handleSpeedChange() {
    animatedHeatmap?.setSpeed(playbackSpeed.value);
}

function handleLoopChange() {
    animatedHeatmap?.setLoop(loopEnabled.value);
}

function handleProgressChange() {
    const progress = animationProgress.value / 100;
    animatedHeatmap?.seekProgress(progress);
}

onMounted(() => {
    if (!containerRef.value) return;

    animatedHeatmap = createHeatmap(
        {
            container: containerRef.value
        },
        withAnimation({
            fadeOutDuration: 2000,
            timeWindow: 3000,
            playbackSpeed: 1,
            loop: false,
            onFrame: (timestamp, progress) => {
                updateAnimationUI(timestamp, progress);
            },
            onComplete: () => {
                animationState.value = "Idle";
            }
        })
    );

    animatedHeatmap.setTemporalData(generateTemporalData());
});

onUnmounted(() => {
    animatedHeatmap?.destroy();
});
</script>

<template>
    <section id="animation-demo" class="section">
        <h2>Animation Feature</h2>
        <p class="section-description">
            Visualize time-series data with smooth animations. Watch data points
            appear and fade over time.
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
            <div class="demo-controls animation-controls">
                <button class="btn btn-primary" @click="handleTogglePlayPause">
                    {{ animationState === 'Playing' ? 'Pause' : 'Play' }}
                </button>
                <button class="btn" @click="handleStop">Stop</button>
                <div class="speed-control">
                    <label for="animation-speed">Speed:</label>
                    <input
                        type="range"
                        id="animation-speed"
                        min="0.5"
                        max="5"
                        step="0.5"
                        v-model.number="playbackSpeed"
                        @input="handleSpeedChange"
                    />
                    <span class="speed-value">{{ playbackSpeed }}x</span>
                </div>
                <label class="checkbox-label">
                    <input
                        type="checkbox"
                        v-model="loopEnabled"
                        @change="handleLoopChange"
                    />
                    Loop
                </label>
            </div>
            <div class="progress-container">
                <input
                    type="range"
                    class="progress-slider"
                    min="0"
                    max="100"
                    v-model.number="animationProgress"
                    @input="handleProgressChange"
                />
                <div class="progress-info">
                    <span>{{ animationTime }}</span>
                    <span class="animation-state">{{ animationState }}</span>
                </div>
            </div>
        </div>

        <CodeBlock title="Code" language="typescript">{{
            animationCode
        }}</CodeBlock>

        <div class="card config-card">
            <h4>AnimationConfig Options</h4>
            <ConfigTable :options="animationOptions" />
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

.animation-controls {
    flex-wrap: wrap;
}

.speed-control {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    background: var(--color-bg-tertiary);
    padding: 0.5rem 1rem;
    border-radius: var(--border-radius-sm);
}

.speed-control label {
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.speed-control input[type="range"] {
    width: 80px;
}

.speed-value {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-primary);
    min-width: 30px;
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

.progress-container {
    margin-top: 1rem;
}

.progress-slider {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    outline: none;
    margin-bottom: 0.5rem;
}

.progress-slider::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
    transition: background 0.2s ease;
}

.progress-slider::-webkit-slider-thumb:hover {
    background: var(--color-primary-hover);
}

.progress-info {
    display: flex;
    justify-content: space-between;
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.animation-state {
    text-transform: capitalize;
    font-weight: 500;
    color: var(--color-primary);
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
