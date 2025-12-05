<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
    createHeatmap,
    GRADIENT_PRESETS,
    type GradientPresetName,
    type Heatmap,
    type HeatmapPoint,
    withTooltip
} from "@drdreo/heatmap";
import CodeBlock from "../ui/CodeBlock.vue";

const gradientCode = `import {
    createHeatmap,
    GRADIENT_PRESETS,
    GRADIENT_VIRIDIS,
    type GradientStop
} from '@drdreo/heatmap';

// Option 1: Use a preset directly
const heatmap = createHeatmap({
    container: document.querySelector('#container')!,
    gradient: GRADIENT_VIRIDIS
});

// Option 2: Access any preset via GRADIENT_PRESETS object
// Available: default, thermal, cool, fire, ocean, grayscale, sunset, viridis, plasma
const fireHeatmap = createHeatmap({
    container: document.querySelector('#fire-container')!,
    gradient: GRADIENT_PRESETS.fire
});

// Option 3: Create a custom gradient
const customGradient: GradientStop[] = [
    { offset: 0, color: 'rgba(0, 0, 0, 0)' },
    { offset: 0.5, color: 'rgba(128, 0, 255, 1)' },
    { offset: 1, color: 'rgba(255, 255, 255, 1)' }
];

const customHeatmap = createHeatmap({
    container: document.querySelector('#custom-container')!,
    gradient: customGradient,
    blendMode: 'lighter',
    intensityExponent: 0.7
});

// Update gradient dynamically
heatmap.setGradient(GRADIENT_PRESETS.thermal);`;

const containerRef = ref<HTMLElement | null>(null);

let customRadius = ref(25);
let customBlur = ref(0.85);
let customOpacity = ref(0.8);
let customGridSize = ref(20);
let currentGradient = ref<GradientPresetName>("cool");
let currentBlendMode = ref<GlobalCompositeOperation>("source-over");
let currentIntensityExponent = ref(1);

let customPoints: HeatmapPoint[] = [];
let customHeatmap: Heatmap | null = null;

const gradientOptions = [
    { value: "cool", label: "Cool (Purple -> Cyan -> Green)" },
    { value: "default", label: "Default (Blue -> Green -> Yellow -> Red)" },
    { value: "thermal", label: "Thermal (Purple -> Red -> Yellow -> White)" },
    { value: "fire", label: "Fire (Dark Red -> Orange -> Yellow)" },
    { value: "ocean", label: "Ocean (Dark Blue -> Cyan -> White)" },
    { value: "grayscale", label: "Grayscale (Black -> White)" },
    { value: "sunset", label: "Sunset (Purple -> Magenta -> Orange -> Gold)" },
    { value: "viridis", label: "Viridis (Purple -> Teal -> Green -> Yellow)" }
];

const blendModeOptions = [
    { value: "source-over", label: "Source Over (Default layering)" },
    { value: "lighter", label: "Lighter (Additive - overlaps glow brighter)" }
];

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

function createCustomHeatmap() {
    if (!containerRef.value) return;

    containerRef.value.innerHTML = "";

    customHeatmap = createHeatmap(
        {
            container: containerRef.value,
            radius: customRadius.value,
            blur: customBlur.value,
            maxOpacity: customOpacity.value,
            gridSize: customGridSize.value,
            gradient: GRADIENT_PRESETS[currentGradient.value],
            blendMode: currentBlendMode.value,
            intensityExponent: currentIntensityExponent.value
        },
        withTooltip()
    );

    customHeatmap.setData({ min: 0, max: 100, data: customPoints });
}

function handleSliderChange() {
    createCustomHeatmap();
}

function handleRandomData() {
    if (!containerRef.value) return;
    customPoints = generateRandomPoints(
        100,
        containerRef.value.clientWidth,
        containerRef.value.clientHeight
    );
    createCustomHeatmap();
}

onMounted(() => {
    if (containerRef.value) {
        customPoints = generateRandomPoints(
            200,
            containerRef.value.clientWidth,
            containerRef.value.clientHeight
        );
        createCustomHeatmap();
    }
});

onUnmounted(() => {
    customHeatmap?.destroy();
});
</script>

<template>
    <section id="customization" class="section">
        <h2>Customization</h2>
        <p class="section-description">
            Customize every aspect of your heatmap - gradients, radius, blur,
            and more.
        </p>

        <div class="demo-container">
            <div class="demo-canvas-wrapper">
                <div ref="containerRef" class="heatmap-container"></div>
            </div>
            <div class="customization-panel">
                <div class="control-group">
                    <label for="radius-slider">
                        Radius: <span>{{ customRadius }}</span>
                    </label>
                    <input
                        type="range"
                        id="radius-slider"
                        min="5"
                        max="100"
                        v-model.number="customRadius"
                        @input="handleSliderChange"
                    />
                </div>
                <div class="control-group">
                    <label for="blur-slider">
                        Blur: <span>{{ customBlur.toFixed(2) }}</span>
                    </label>
                    <input
                        type="range"
                        id="blur-slider"
                        min="0"
                        max="1"
                        step="0.05"
                        v-model.number="customBlur"
                        @input="handleSliderChange"
                    />
                </div>
                <div class="control-group">
                    <label for="opacity-slider">
                        Max Opacity: <span>{{ customOpacity.toFixed(1) }}</span>
                    </label>
                    <input
                        type="range"
                        id="opacity-slider"
                        min="0"
                        max="1"
                        step="0.1"
                        v-model.number="customOpacity"
                        @input="handleSliderChange"
                    />
                </div>
                <div class="control-group">
                    <label for="gridsize-slider">
                        Grid Size: <span>{{ customGridSize }}</span>
                    </label>
                    <input
                        type="range"
                        id="gridsize-slider"
                        min="1"
                        max="50"
                        step="1"
                        v-model.number="customGridSize"
                        @input="handleSliderChange"
                    />
                </div>
                <div class="control-group">
                    <label>Gradient Preset:</label>
                    <select
                        v-model="currentGradient"
                        @change="handleSliderChange"
                    >
                        <option
                            v-for="opt in gradientOptions"
                            :key="opt.value"
                            :value="opt.value"
                        >
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
                <div class="control-group">
                    <label>
                        Blend Mode:
                        <small style="opacity: 0.7">(how points combine)</small>
                    </label>
                    <select
                        v-model="currentBlendMode"
                        @change="handleSliderChange"
                    >
                        <option
                            v-for="opt in blendModeOptions"
                            :key="opt.value"
                            :value="opt.value"
                        >
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
                <div class="control-group">
                    <label for="intensity-slider">
                        Intensity Curve:
                        <span>{{ currentIntensityExponent.toFixed(1) }}</span>
                        <small style="opacity: 0.7"
                            >(&lt; 1 = boost lows, &gt; 1 = boost highs)</small
                        >
                    </label>
                    <input
                        type="range"
                        id="intensity-slider"
                        min="0.1"
                        max="3"
                        step="0.1"
                        v-model.number="currentIntensityExponent"
                        @input="handleSliderChange"
                    />
                </div>
                <div class="control-group">
                    <button
                        class="btn btn-primary btn-full"
                        @click="handleRandomData"
                    >
                        Generate Random Data
                    </button>
                </div>
            </div>
        </div>

        <CodeBlock
            title="Gradient Presets & Custom Gradients"
            language="typescript"
        >
            {{ gradientCode }}
        </CodeBlock>
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

.customization-panel {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.control-group label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
}

.control-group input[type="range"] {
    width: 100%;
    height: 8px;
    -webkit-appearance: none;
    appearance: none;
    background: var(--color-bg-tertiary);
    border-radius: 4px;
    outline: none;
}

.control-group input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 50%;
    background: var(--color-primary);
    cursor: pointer;
}

.control-group select {
    padding: 0.5rem 0.75rem;
    font-size: 0.875rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text);
    cursor: pointer;
}

.control-group select:focus {
    outline: none;
    border-color: var(--color-primary);
}

@media (max-width: 768px) {
    .section h2 {
        font-size: 1.75rem;
    }
}
</style>
