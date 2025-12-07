<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";
import { createHeatmap, GRADIENT_FIRE, type Heatmap } from "@drdreo/heatmap";

const heroRef = ref<HTMLElement | null>(null);
const heatmapContainerRef = ref<HTMLElement | null>(null);

let heatmap: Heatmap | null = null;
let resizeObserver: ResizeObserver | null = null;
let lastAddTime = 0;
const throttleMs = 16; // ~60fps

function handleMouseMove(event: MouseEvent) {
    if (!heatmap || !heroRef.value) return;

    const now = performance.now();
    if (now - lastAddTime < throttleMs) return;
    lastAddTime = now;

    const rect = heatmap.canvas.getBoundingClientRect();
    const scaleX = heatmap.width / rect.width;
    const scaleY = heatmap.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    // Add point with random intensity for visual variety
    const value = Math.random() * 15;
    heatmap.addPoint({ x, y, value });
}

function handleTouchMove(event: TouchEvent) {
    if (!heatmap || !heroRef.value) return;

    const now = performance.now();
    if (now - lastAddTime < throttleMs) return;
    lastAddTime = now;

    const touch = event.touches[0];
    if (!touch) return;

    const rect = heatmap.canvas.getBoundingClientRect();
    const scaleX = heatmap.width / rect.width;
    const scaleY = heatmap.height / rect.height;
    const x = (touch.clientX - rect.left) * scaleX;
    const y = (touch.clientY - rect.top) * scaleY;

    const value = Math.random() * 15;
    heatmap.addPoint({ x, y, value });
}

function initHeatmap() {
    if (!heatmapContainerRef.value) return;

    // Destroy existing heatmap if any
    heatmap?.destroy();

    const width = heatmapContainerRef.value.clientWidth;
    const height = heatmapContainerRef.value.clientHeight;

    heatmap = createHeatmap({
        container: heatmapContainerRef.value,
        width,
        height,
        radius: 40,
        blur: 0.9,
        maxOpacity: 0.7,
        gradient: GRADIENT_FIRE
    });

    // Add some initial points for visual appeal
    const initialPoints = [];
    for (let i = 0; i < 15; i++) {
        initialPoints.push({
            x: Math.random() * width,
            y: Math.random() * height,
            value: 30 + Math.random() * 70
        });
    }
    heatmap.setData({ min: 0, max: 100, data: initialPoints });
}

onMounted(() => {
    initHeatmap();

    // Handle resize
    resizeObserver = new ResizeObserver(() => {
        initHeatmap();
    });

    if (heatmapContainerRef.value) {
        resizeObserver.observe(heatmapContainerRef.value);
    }
});

onUnmounted(() => {
    heatmap?.destroy();
    resizeObserver?.disconnect();
});
</script>

<template>
    <header
        ref="heroRef"
        class="hero"
        @mousemove="handleMouseMove"
        @touchmove="handleTouchMove"
    >
        <div ref="heatmapContainerRef" class="heatmap-background"></div>
        <div class="hero-content">
            <h1>🔥 Heatmap</h1>
            <p class="tagline">
                A modern, performant, tree-shakeable heatmap rendering library
            </p>
            <p class="hint">Move your mouse around to see it in action!</p>
            <div class="hero-badges">
                <span class="badge">Zero Dependencies</span>
                <span class="badge">Tree-Shakeable</span>
                <span class="badge">TypeScript</span>
                <span class="badge">Canvas2D</span>
            </div>
            <div class="hero-actions">
                <a
                    href="https://github.com/drdreo/heatmap"
                    target="_blank"
                    class="btn btn-secondary"
                >
                    GitHub
                </a>
            </div>
        </div>
    </header>
</template>

<style scoped>
.hero {
    position: relative;
    padding: 6rem 0 4rem;
    text-align: center;
    background: linear-gradient(
        180deg,
        rgba(249, 115, 22, 0.1) 0%,
        transparent 100%
    );
    margin-bottom: 2rem;
    min-height: 500px;
    overflow: hidden;
    cursor: crosshair;
}

.heatmap-background {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    z-index: 0;
    pointer-events: none;
}

.heatmap-background :deep(canvas) {
    width: 100% !important;
    height: 100% !important;
}

.hero-content {
    position: relative;
    z-index: 1;
    pointer-events: none;
}

.hero-content .btn,
.hero-content a {
    pointer-events: auto;
}

.hero h1 {
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--color-primary) 0%, #fbbf24 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    text-shadow: 0 0 40px rgba(249, 115, 22, 0.3);
}

.tagline {
    font-size: 1.25rem;
    color: var(--color-text-muted);
    margin-bottom: 0.5rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.hint {
    font-size: 0.9rem;
    color: var(--color-primary);
    margin-bottom: 2rem;
    opacity: 0.8;
    animation: pulse 2s ease-in-out infinite;
}

@keyframes pulse {
    0%,
    100% {
        opacity: 0.6;
    }
    50% {
        opacity: 1;
    }
}

.hero-badges {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2rem;
}

.badge {
    background: rgba(30, 30, 30, 0.8);
    backdrop-filter: blur(8px);
    border: 1px solid var(--color-border);
    padding: 0.5rem 1rem;
    border-radius: 100px;
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

@media (max-width: 768px) {
    .hero {
        min-height: 400px;
    }

    .hero h1 {
        font-size: 2.5rem;
    }

    .tagline {
        font-size: 1rem;
    }

    .hero-actions {
        flex-direction: column;
        align-items: center;
    }
}
</style>
