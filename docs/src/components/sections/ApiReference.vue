<script setup lang="ts">
import ConfigTable, {
    type ConfigOption,
    type MethodOption
} from "../ui/ConfigTable.vue";

const heatmapConfigOptions: ConfigOption[] = [
    {
        name: "container",
        type: "HTMLElement",
        default: "required",
        description: "Container element for the canvas"
    },
    {
        name: "width",
        type: "number",
        default: "container width",
        description: "Canvas width in pixels"
    },
    {
        name: "height",
        type: "number",
        default: "container height",
        description: "Canvas height in pixels"
    },
    {
        name: "radius",
        type: "number",
        default: "25",
        description: "Point influence radius"
    },
    {
        name: "blur",
        type: "number",
        default: "15",
        description: "Blur amount for smoothing"
    },
    {
        name: "maxOpacity",
        type: "number",
        default: "0.8",
        description: "Maximum opacity (0-1)"
    },
    {
        name: "minOpacity",
        type: "number",
        default: "0",
        description: "Minimum opacity (0-1)"
    },
    {
        name: "gradient",
        type: "GradientStop[]",
        default: "Default gradient",
        description: "Custom gradient definition"
    },
    {
        name: "useOffscreenCanvas",
        type: "boolean",
        default: "true",
        description: "Use offscreen canvas for performance"
    },
    {
        name: "gridSize",
        type: "number",
        default: "6",
        description:
            "Grid cell size for value lookups (affects tooltip precision)"
    },
    {
        name: "blendMode",
        type: "GlobalCompositeOperation",
        default: "'source-over'",
        description:
            "Canvas blend mode for overlapping points. Use 'lighter' for additive blending where overlaps glow brighter."
    },
    {
        name: "intensityExponent",
        type: "number",
        default: "1",
        description:
            "Exponent for intensity curve. Values < 1 boost low values, > 1 emphasize high values."
    }
];

const heatmapMethods: MethodOption[] = [
    {
        name: "setData()",
        parameters: "HeatmapData",
        description: "Set the data to render"
    },
    {
        name: "addPoint()",
        parameters: "HeatmapPoint",
        description: "Add a single point"
    },
    {
        name: "addPoints()",
        parameters: "HeatmapPoint[]",
        description: "Add multiple points"
    },
    {
        name: "setGradient()",
        parameters: "GradientStop[]",
        description: "Update the gradient"
    },
    {
        name: "clear()",
        parameters: "-",
        description: "Clear all data"
    },
    {
        name: "getValueAt()",
        parameters: "x, y",
        description: "Get value at position"
    },
    {
        name: "getDataURL()",
        parameters: "type?, quality?",
        description: "Export as data URL"
    },
    {
        name: "destroy()",
        parameters: "-",
        description: "Clean up resources"
    }
];

const animatedHeatmapMethods: MethodOption[] = [
    {
        name: "setTemporalData()",
        parameters: "TemporalHeatmapData",
        description: "Set time-series data"
    },
    {
        name: "play()",
        parameters: "-",
        description: "Start/resume animation"
    },
    {
        name: "pause()",
        parameters: "-",
        description: "Pause animation"
    },
    {
        name: "stop()",
        parameters: "-",
        description: "Stop and reset"
    },
    {
        name: "seek()",
        parameters: "timestamp",
        description: "Seek to timestamp"
    },
    {
        name: "seekProgress()",
        parameters: "progress (0-1)",
        description: "Seek to progress"
    },
    {
        name: "setSpeed()",
        parameters: "speed",
        description: "Set playback speed"
    },
    {
        name: "setLoop()",
        parameters: "loop",
        description: "Enable/disable loop"
    },
    {
        name: "getAnimationState()",
        parameters: "-",
        description: "Get current state"
    },
    {
        name: "getCurrentTime()",
        parameters: "-",
        description: "Get current timestamp"
    },
    {
        name: "getProgress()",
        parameters: "-",
        description: "Get progress (0-1)"
    }
];
</script>

<template>
    <section id="api" class="section">
        <h2>API Reference</h2>

        <div class="card">
            <h3>HeatmapConfig</h3>
            <ConfigTable :options="heatmapConfigOptions" />
        </div>

        <div class="card">
            <h3>Heatmap Methods</h3>
            <ConfigTable :methods="heatmapMethods" />
        </div>

        <div class="card">
            <h3>AnimatedHeatmap Methods</h3>
            <p class="card-description">
                Additional methods available when using
                <code>withAnimation()</code>
            </p>
            <ConfigTable :methods="animatedHeatmapMethods" />
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

.card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--color-text);
}

.card-description {
    color: var(--color-text-muted);
    margin-bottom: 1rem;
    font-size: 0.9rem;
}

.card-description code {
    background: var(--color-bg-tertiary);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.8rem;
}

@media (max-width: 768px) {
    .section h2 {
        font-size: 1.75rem;
    }
}
</style>
