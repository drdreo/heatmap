<script setup lang="ts">
import {
    GRADIENT_OCEAN,
    GRADIENT_THERMAL,
    GRADIENT_VIRIDIS,
    type GradientStop,
    isWebGLAvailable,
    withCanvas2DRenderer,
    withLegend,
    withWebGLRenderer
} from "@drdreo/heatmap";
import {
    createLeafletHeatmap,
    type LeafletHeatmap,
    type LeafletHeatmapPoint
} from "@drdreo/heatmap-leaflet";
import { LeafletMap, TileLayer } from "leaflet";
import "leaflet/dist/leaflet.css";
import { onMounted, onUnmounted, ref, shallowRef, watch } from "vue";
import CodeBlock from "../ui/CodeBlock.vue";

const basicCode = `import { LeafletMap, TileLayer } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { createLeafletHeatmap } from '@drdreo/heatmap-leaflet';

// Create Leaflet map
const map = new LeafletMap('map').setView([51.505, -0.09], 11);
new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

// Create heatmap - container is managed automatically!
const heatmap = createLeafletHeatmap(map, {
    radius: 25,
    blur: 0.85
});

// Set geographic data
heatmap.setLatLngData([
    { lat: 51.5, lng: -0.09, value: 100 },
    { lat: 51.51, lng: -0.1, value: 50 },
    { lat: 51.49, lng: -0.05, value: 75 }
]);`;

const webglCode = `import { createLeafletHeatmap } from '@drdreo/heatmap-leaflet';
import { withWebGLRenderer, GRADIENT_THERMAL } from '@drdreo/heatmap';

const heatmap = createLeafletHeatmap(
    map,
    {
        radius: 30,
        gradient: GRADIENT_THERMAL,
        scaleRadius: true
    },
    withWebGLRenderer()
);

heatmap.setLatLngData(points);`;

const mapContainerRef = ref<HTMLElement | null>(null);
const mapInstance = shallowRef<LeafletMap | null>(null);
const heatmapInstance = shallowRef<LeafletHeatmap | null>(null);

// Configuration state
const useWebGL = ref(true);
const webglAvailable = ref(false);
const scaleRadius = ref(true);
const selectedGradient = ref<"thermal" | "viridis" | "ocean">("thermal");
const pointCount = ref(500);

// Sample geo-data - Funny named towns in Germany/Austria
const generateSampleData = (count: number): LeafletHeatmapPoint[] => {
    const points: LeafletHeatmapPoint[] = [];

    // Funny named towns with their coordinates
    const funnyTowns = [
        { name: "Fugging", lat: 48.0666, lng: 12.8587, weight: 0.4 }, // Main cluster - Austria
        { name: "Petting", lat: 47.9167, lng: 12.8167, weight: 0.15 }, // Bavaria, Germany
        { name: "Kissing", lat: 48.2983, lng: 10.9767, weight: 0.12 }, // Bavaria, Germany
        { name: "Wank", lat: 47.4667, lng: 11.15, weight: 0.1 }, // Mountain near Garmisch, Germany
        { name: "Pissen", lat: 51.1833, lng: 12.3, weight: 0.08 }, // Saxony, Germany
        { name: "Rottenegg", lat: 48.35, lng: 14.0167, weight: 0.08 }, // Upper Austria
        { name: "Windpassing", lat: 48.25, lng: 13.0333, weight: 0.07 } // Upper Austria
    ];

    for (let i = 0; i < count; i++) {
        // Select town based on weights
        const rand = Math.random();
        let cumWeight = 0;
        let selectedTown = funnyTowns[0]!;

        for (const town of funnyTowns) {
            cumWeight += town.weight;
            if (rand <= cumWeight) {
                selectedTown = town;
                break;
            }
        }

        // Add some spread around the selected town
        const spread = 0.02;
        const lat = selectedTown.lat + (Math.random() - 0.5) * spread;
        const lng = selectedTown.lng + (Math.random() - 0.5) * spread;

        points.push({ lat, lng, value: Math.random() * 100 });
    }

    return points;
};

const gradients: Record<string, GradientStop[]> = {
    thermal: GRADIENT_THERMAL,
    viridis: GRADIENT_VIRIDIS,
    ocean: GRADIENT_OCEAN
};

const createHeatmapInstance = () => {
    if (!mapInstance.value) return;

    // Destroy existing heatmap
    if (heatmapInstance.value) {
        heatmapInstance.value.destroy();
        heatmapInstance.value = null;
    }

    const gradient = gradients[selectedGradient.value];
    const features =
        useWebGL.value && webglAvailable.value
            ? [withWebGLRenderer()]
            : [withCanvas2DRenderer()];

    heatmapInstance.value = createLeafletHeatmap(
        mapInstance.value,
        {
            radius: 25,
            blur: 0.85,
            maxOpacity: 0.8,
            gradient,
            scaleRadius: scaleRadius.value,
            scaleRadiusBaseZoom: 8
        },
        withLegend(),
        ...features
    );

    heatmapInstance.value.setLatLngData(generateSampleData(pointCount.value));

    // Interactive value lookup
    mapInstance.value.on("click", (e) => {
        const value = heatmapInstance.value!.getValueAtLatLng(e.latlng);
        console.log(`Value at ${e.latlng}: ${value.toFixed(2)}`);
    });
};

const regenerateData = () => {
    if (heatmapInstance.value) {
        heatmapInstance.value.setLatLngData(
            generateSampleData(pointCount.value)
        );
    }
};

// Watch for configuration changes
watch([useWebGL, scaleRadius, selectedGradient], () => {
    createHeatmapInstance();
});

watch(pointCount, () => {
    regenerateData();
});

onMounted(() => {
    webglAvailable.value = isWebGLAvailable();

    if (mapContainerRef.value) {
        // Initialize Leaflet map - centered between funny named towns in Bavaria/Austria
        mapInstance.value = new LeafletMap(mapContainerRef.value).setView(
            [48.1, 12.5],
            8
        );

        // Add tile layer
        new TileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution:
                '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        }).addTo(mapInstance.value);

        // Create heatmap
        createHeatmapInstance();
    }
});

onUnmounted(() => {
    if (heatmapInstance.value) {
        heatmapInstance.value.destroy();
        heatmapInstance.value = null;
    }
    if (mapInstance.value) {
        mapInstance.value.remove();
        mapInstance.value = null;
    }
});
</script>

<template>
    <section id="leaflet" class="demo-section">
        <h2>🗺️ Leaflet Integration</h2>
        <p class="section-description">
            Render heatmaps on interactive maps with
            <code>createLeafletHeatmap()</code>. Container is managed
            automatically - just pass your map and config.
        </p>

        <div class="demo-container">
            <div class="controls-panel">
                <div class="control-group">
                    <label class="control-label">Renderer</label>
                    <div class="toggle-group">
                        <button
                            :class="['toggle-btn', { active: !useWebGL }]"
                            @click="useWebGL = false"
                        >
                            Canvas2D
                        </button>
                        <button
                            :class="[
                                'toggle-btn',
                                { active: useWebGL, disabled: !webglAvailable }
                            ]"
                            @click="useWebGL = true"
                            :disabled="!webglAvailable"
                            :title="
                                !webglAvailable ? 'WebGL not available' : ''
                            "
                        >
                            WebGL
                        </button>
                    </div>
                </div>

                <div class="control-group">
                    <label class="control-label">Gradient</label>
                    <select v-model="selectedGradient" class="select-input">
                        <option value="thermal">Thermal</option>
                        <option value="viridis">Viridis</option>
                        <option value="ocean">Ocean</option>
                    </select>
                </div>

                <div class="control-group">
                    <label class="control-label">
                        <input type="checkbox" v-model="scaleRadius" />
                        Scale radius with zoom
                    </label>
                </div>

                <div class="control-group">
                    <label class="control-label"
                        >Points: {{ pointCount }}</label
                    >
                    <input
                        type="range"
                        v-model.number="pointCount"
                        min="100"
                        max="2000"
                        step="100"
                        class="range-input"
                    />
                </div>

                <button class="btn btn-secondary" @click="regenerateData">
                    🔄 Regenerate Data
                </button>
            </div>

            <div class="map-wrapper">
                <div ref="mapContainerRef" class="map-container"></div>
                <div class="map-info">
                    <span
                        v-if="useWebGL && webglAvailable"
                        class="badge badge-success"
                    >
                        WebGL Renderer
                    </span>
                    <span v-else class="badge badge-info">
                        Canvas2D Renderer
                    </span>
                    <span class="badge">{{ pointCount }} points</span>
                </div>
            </div>
        </div>

        <div class="code-examples">
            <h3>Basic Usage</h3>
            <CodeBlock language="typescript"> {{ basicCode }}</CodeBlock>

            <h3>With WebGL & Options</h3>
            <CodeBlock language="typescript">{{ webglCode }}</CodeBlock>
        </div>
    </section>
</template>

<style scoped>
.demo-section {
    padding: 4rem 0;
    border-bottom: 1px solid var(--color-border);
}

.section-description {
    color: var(--color-text-muted);
    font-size: 1.1rem;
    margin-bottom: 2rem;
    max-width: 800px;
}

.section-description code {
    background: var(--color-bg-tertiary);
    padding: 0.1rem 0.4rem;
    border-radius: 4px;
    font-size: 0.95em;
}

.demo-container {
    display: grid;
    grid-template-columns: 250px 1fr;
    gap: 1.5rem;
    margin-bottom: 2rem;
}

@media (max-width: 768px) {
    .demo-container {
        grid-template-columns: 1fr;
    }
}

.controls-panel {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    background: var(--color-bg-secondary);
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);
}

.control-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.control-label {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.toggle-group {
    display: flex;
    gap: 0.5rem;
}

.toggle-btn {
    flex: 1;
    padding: 0.5rem 1rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text-muted);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 0.875rem;
}

.toggle-btn:hover:not(.disabled) {
    border-color: var(--color-primary);
}

.toggle-btn.active {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
}

.toggle-btn.disabled {
    opacity: 0.5;
    cursor: not-allowed;
}

.select-input {
    padding: 0.5rem;
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    color: var(--color-text);
    font-size: 0.875rem;
}

.range-input {
    width: 100%;
    accent-color: var(--color-primary);
}

.map-wrapper {
    position: relative;
}

.map-container {
    width: 100%;
    height: 450px;
    border-radius: var(--border-radius);
    border: 1px solid var(--color-border);
    overflow: hidden;
}

.map-info {
    position: absolute;
    top: 10px;
    right: 10px;
    display: flex;
    gap: 0.5rem;
    z-index: 1000;
}

.badge {
    padding: 0.25rem 0.75rem;
    background: var(--color-bg-secondary);
    border-radius: 9999px;
    font-size: 0.75rem;
    color: var(--color-text-muted);
    border: 1px solid var(--color-border);
}

.badge-success {
    background: rgba(34, 197, 94, 0.2);
    border-color: rgba(34, 197, 94, 0.5);
    color: rgb(34, 197, 94);
}

.badge-info {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
    color: rgb(59, 130, 246);
}

.code-examples {
    margin-top: 2rem;
}

.code-examples h3 {
    font-size: 1.1rem;
    margin-bottom: 0.75rem;
    margin-top: 1.5rem;
    color: var(--color-text);
}

.code-examples h3:first-child {
    margin-top: 0;
}

.btn {
    padding: 0.75rem 1rem;
    border-radius: var(--border-radius-sm);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    border: none;
    font-size: 0.875rem;
}

.btn-secondary {
    background: var(--color-bg-tertiary);
    color: var(--color-text);
    border: 1px solid var(--color-border);
}

.btn-secondary:hover {
    background: var(--color-border);
}
</style>
