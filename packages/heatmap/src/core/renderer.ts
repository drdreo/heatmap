/**
 * Core Heatmap Renderer
 *
 * Minimal, focused rendering engine. Features are added via composition.
 */

import { generatePalette } from './gradient';
import {
    DEFAULT_CONFIG,
    DEFAULT_GRADIENT,
    GradientStop,
    Heatmap,
    HeatmapConfig,
    HeatmapData,
    HeatmapPoint,
    RenderablePoint
} from './types';

/**
 * Internal state for the heatmap renderer
 */
interface HeatmapState {
    data: HeatmapData | null;
    palette: Uint8ClampedArray;
    pointTemplate: HTMLCanvasElement | null;
    valueGrid: Map<string, number>;
}

/**
 * Create the core heatmap renderer
 */
export function createCore(config: HeatmapConfig): Heatmap {
    const { container, gradient = DEFAULT_GRADIENT } = config;

    // Resolve dimensions
    const width = config.width ?? container.offsetWidth;
    const height = config.height ?? container.offsetHeight;
    const radius = config.radius ?? DEFAULT_CONFIG.radius;
    const blur = config.blur ?? DEFAULT_CONFIG.blur;
    const maxOpacity = config.maxOpacity ?? DEFAULT_CONFIG.maxOpacity;
    const minOpacity = config.minOpacity ?? DEFAULT_CONFIG.minOpacity;
    const gridSize = 6; // Default grid size for value lookups

    // Create main canvas
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    Object.assign(canvas.style, {
        position: 'absolute',
        top: '0',
        left: '0',
        width: '100%',
        height: '100%',
        pointerEvents: 'none'
    });

    const ctx = canvas.getContext('2d', { willReadFrequently: false })!;

    // Create shadow canvas for grayscale rendering
    const useOffscreen =
        (config.useOffscreenCanvas ?? DEFAULT_CONFIG.useOffscreenCanvas) &&
        typeof OffscreenCanvas !== 'undefined';

    const shadowCanvas = useOffscreen
        ? new OffscreenCanvas(width, height)
        : createShadowCanvas(width, height);

    const shadowCtx = shadowCanvas.getContext('2d', { willReadFrequently: true })!;

    // Internal state
    const state: HeatmapState = {
        data: null,
        palette: generatePalette(gradient),
        pointTemplate: generatePointTemplate(radius, blur),
        valueGrid: new Map()
    };

    // Append canvas to container
    container.appendChild(canvas);

    // Render initial data if provided
    if (config.data) {
        setData(config.data);
    }

    // --- Core Methods ---

    function setData(data: HeatmapData): void {
        state.data = data;
        updateValueGrid(data.data);
        render();
    }

    function addPoint(point: HeatmapPoint): void {
        if (!state.data) {
            state.data = { min: 0, max: point.value, data: [point] };
        } else {
            state.data.data.push(point);
            if (point.value > state.data.max) {
                state.data.max = point.value;
            }
        }
        updateValueGrid(state.data.data);
        render();
    }

    function addPoints(points: HeatmapPoint[]): void {
        if (!state.data) {
            state.data = { min: 0, max: points[0].value, data: points };
        } else {
            state.data.data.push(...points);
            const max = Math.max(...state.data.data.map((p) => p.value));
            if (max > state.data.max) {
                state.data.max = max;
            }
        }

        updateValueGrid(state.data.data);
        render();
    }

    function setGradient(stops: GradientStop[]): void {
        state.palette = generatePalette(stops);
        render();
    }

    function clear(): void {
        state.data = null;
        state.valueGrid.clear();
        clearCanvases();
    }

    function getValueAt(x: number, y: number): number {
        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        return state.valueGrid.get(`${gridX},${gridY}`) ?? 0;
    }

    function getDataURL(type = 'image/png', quality?: number): string {
        return canvas.toDataURL(type, quality);
    }

    function destroy(): void {
        canvas.remove();
        state.pointTemplate = null;
        state.valueGrid.clear();
        state.data = null;
    }

    // --- Internal Helpers ---

    function updateValueGrid(points: HeatmapPoint[]): void {
        state.valueGrid.clear();
        for (const point of points) {
            const gridX = Math.floor(point.x / gridSize);
            const gridY = Math.floor(point.y / gridSize);
            const key = `${gridX},${gridY}`;
            const existing = state.valueGrid.get(key) ?? 0;
            state.valueGrid.set(key, existing + point.value);
        }
    }

    function clearCanvases(): void {
        ctx.clearRect(0, 0, width, height);
        shadowCtx.clearRect(0, 0, width, height);
    }

    function render(): void {
        if (!state.data || state.data.data.length === 0) {
            clearCanvases();
            return;
        }

        const points = computeRenderablePoints(state.data);
        renderPoints(points);
    }

    function computeRenderablePoints(data: HeatmapData): RenderablePoint[] {
        const { min, max, data: points } = data;
        const range = max - min || 1;

        return points.map((point) => ({
            x: point.x,
            y: point.y,
            alpha: Math.min(1, Math.max(0, (point.value - min) / range))
        }));
    }

    function renderPoints(points: RenderablePoint[]): void {
        clearCanvases();

        if (points.length === 0 || !state.pointTemplate) return;

        // Draw grayscale points
        const templateSize = state.pointTemplate.width;
        const offset = templateSize / 2;

        for (const point of points) {
            shadowCtx.globalAlpha = point.alpha;
            shadowCtx.drawImage(
                state.pointTemplate,
                point.x - offset,
                point.y - offset,
                templateSize,
                templateSize
            );
        }
        shadowCtx.globalAlpha = 1;

        // Colorize
        colorize();
    }

    function colorize(): void {
        const imageData = shadowCtx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        const opacityRange = maxOpacity - minOpacity;

        for (let i = 0; i < pixels.length; i += 4) {
            const alpha = pixels[i + 3];

            if (alpha > 0) {
                const paletteIdx = alpha * 4;

                pixels[i] = state.palette[paletteIdx];
                pixels[i + 1] = state.palette[paletteIdx + 1];
                pixels[i + 2] = state.palette[paletteIdx + 2];

                const normalizedAlpha = alpha / 255;
                const scaledOpacity = minOpacity + normalizedAlpha * opacityRange;
                pixels[i + 3] = Math.round(scaledOpacity * 255);
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    // Return the public API
    return {
        container,
        canvas,
        width,
        height,
        setData,
        addPoint,
        addPoints,
        setGradient,
        clear,
        getValueAt,
        getDataURL,
        destroy
    };
}

// --- Utility Functions ---

function createShadowCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function generatePointTemplate(radius: number, blur: number): HTMLCanvasElement {
    const size = radius * 2 + blur * 2;
    const center = size / 2;

    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext('2d')!;
    const gradient = ctx.createRadialGradient(center, center, 0, center, center, radius);

    gradient.addColorStop(0, 'rgba(0, 0, 0, 1)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, size, size);

    return canvas;
}
