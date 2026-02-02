<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import {
    createHeatmap,
    GRADIENT_PRESETS,
    type GradientPresetName,
    type Heatmap,
    type HeatmapPoint,
    withLegend,
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

// Toggle between random and custom data mode
let useCustomData = ref(false);
let customDataInput = ref("");
let customDataError = ref("");

let customPoints: HeatmapPoint[] = [];
let customHeatmap: Heatmap | null = null;

// Example data for the placeholder
const exampleData = `[
  { "x": 100, "y": 50, "value": 80 },
  { "x": 200, "y": 100, "value": 60 },
  { "x": 150, "y": 150, "value": 100 }
]`;

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
        withTooltip(),
        withLegend({
            className: "demo-legend"
        })
    );

    customHeatmap.setData(customPoints);
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

function parseCustomData(input: string): HeatmapPoint[] | null {
    if (!input.trim()) return null;

    try {
        const parsed = JSON.parse(input);

        if (!Array.isArray(parsed)) {
            customDataError.value = "Data must be an array of points";
            return null;
        }

        const validPoints: HeatmapPoint[] = [];
        for (let i = 0; i < parsed.length; i++) {
            const point = parsed[i];
            if (
                typeof point.x !== "number" ||
                typeof point.y !== "number" ||
                typeof point.value !== "number"
            ) {
                customDataError.value = `Point at index ${i} must have x, y, and value as numbers`;
                return null;
            }
            validPoints.push({
                x: point.x,
                y: point.y,
                value: point.value
            });
        }

        customDataError.value = "";
        return validPoints;
    } catch (e) {
        customDataError.value = "Invalid JSON format";
        return null;
    }
}

function handleCustomDataChange() {
    if (!useCustomData.value) return;

    const parsed = parseCustomData(customDataInput.value);
    if (parsed && parsed.length > 0) {
        customPoints = parsed;
        createCustomHeatmap();
    }
}

function handleDataModeChange() {
    if (useCustomData.value) {
        // Switching to custom data mode
        const parsed = parseCustomData(customDataInput.value);
        if (parsed && parsed.length > 0) {
            customPoints = parsed;
        } else if (!customDataInput.value.trim()) {
            // No custom data entered yet, keep existing points
            customDataError.value = "";
        }
    } else {
        // Switching back to random data mode
        customDataError.value = "";
        if (containerRef.value) {
            customPoints = generateRandomPoints(
                100,
                containerRef.value.clientWidth,
                containerRef.value.clientHeight
            );
        }
    }
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
                <div class="control-group data-mode-control">
                    <label class="toggle-label">
                        <span class="toggle-text">Data Source:</span>
                        <div class="toggle-switch">
                            <input
                                type="checkbox"
                                id="data-mode-toggle"
                                v-model="useCustomData"
                                @change="handleDataModeChange"
                            />
                            <span class="toggle-slider"></span>
                        </div>
                        <span class="toggle-mode-label">{{
                            useCustomData ? "Custom Data" : "Random Data"
                        }}</span>
                    </label>
                </div>
                <div class="control-group" v-if="!useCustomData">
                    <button
                        class="btn btn-primary btn-full"
                        @click="handleRandomData"
                    >
                        Generate Random Data
                    </button>
                </div>
            </div>

            <!-- Custom Data Input Section -->
            <div v-if="useCustomData" class="custom-data-section">
                <div class="custom-data-header">
                    <label for="custom-data-input"
                        >Custom Heatmap Data (JSON)</label
                    >
                    <button
                        class="btn btn-secondary btn-sm"
                        @click="handleCustomDataChange"
                    >
                        Apply Data
                    </button>
                </div>
                <textarea
                    id="custom-data-input"
                    v-model="customDataInput"
                    :placeholder="exampleData"
                    rows="6"
                    class="custom-data-textarea"
                    @blur="handleCustomDataChange"
                ></textarea>
                <p v-if="customDataError" class="error-message">
                    {{ customDataError }}
                </p>
                <p class="input-hint">
                    Enter an array of points with <code>x</code>,
                    <code>y</code>, and <code>value</code> properties.
                </p>
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

/* Toggle Switch Styles */
.data-mode-control {
    grid-column: 1 / -1;
}

.toggle-label {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    cursor: pointer;
}

.toggle-text {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
}

.toggle-mode-label {
    font-size: 0.875rem;
    color: var(--color-text);
    min-width: 100px;
}

.toggle-switch {
    position: relative;
    width: 48px;
    height: 24px;
    flex-shrink: 0;
}

.toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
}

.toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: 24px;
    transition: 0.3s;
}

.toggle-slider::before {
    position: absolute;
    content: "";
    height: 18px;
    width: 18px;
    left: 2px;
    bottom: 2px;
    background-color: var(--color-text-muted);
    border-radius: 50%;
    transition: 0.3s;
}

.toggle-switch input:checked + .toggle-slider {
    background-color: var(--color-primary);
    border-color: var(--color-primary);
}

.toggle-switch input:checked + .toggle-slider::before {
    transform: translateX(24px);
    background-color: white;
}

.toggle-switch input:focus + .toggle-slider {
    box-shadow: 0 0 0 2px rgba(var(--color-primary-rgb, 99, 102, 241), 0.3);
}

/* Custom Data Input Styles */
.custom-data-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid var(--color-border);
}

.custom-data-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
}

.custom-data-header label {
    font-size: 0.875rem;
    font-weight: 500;
    color: var(--color-text-muted);
}

.custom-data-textarea {
    width: 100%;
    padding: 0.75rem;
    font-family: "Fira Code", "Monaco", "Consolas", monospace;
    font-size: 0.8rem;
    line-height: 1.5;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text);
    resize: vertical;
    min-height: 120px;
}

.custom-data-textarea:focus {
    outline: none;
    border-color: var(--color-primary);
}

.custom-data-textarea::placeholder {
    color: var(--color-text-muted);
    opacity: 0.6;
}

.error-message {
    color: #ef4444;
    font-size: 0.8rem;
    margin-top: 0.5rem;
    margin-bottom: 0;
}

.input-hint {
    color: var(--color-text-muted);
    font-size: 0.75rem;
    margin-top: 0.5rem;
    margin-bottom: 0;
}

.input-hint code {
    background: var(--color-bg-tertiary);
    padding: 0.1rem 0.3rem;
    border-radius: 3px;
    font-family: "Fira Code", monospace;
}

.btn-secondary {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    padding: 0.4rem 0.75rem;
    font-size: 0.8rem;
    border-radius: var(--border-radius-sm);
    cursor: pointer;
    transition: all 0.2s;
}

.btn-secondary:hover {
    background: var(--color-bg-secondary);
    border-color: var(--color-primary);
}

.btn-sm {
    padding: 0.35rem 0.65rem;
    font-size: 0.75rem;
}
</style>
