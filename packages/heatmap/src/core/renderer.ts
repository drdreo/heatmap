/**
 * Core Heatmap Renderer
 *
 * Minimal, focused rendering engine. Features are added via composition.
 */

import { generatePalette } from "./gradient";
import {
    DEFAULT_CONFIG,
    DEFAULT_GRADIENT,
    type GradientStop,
    type Heatmap,
    type HeatmapConfig,
    type HeatmapData,
    type HeatmapPoint,
    type HeatmapStats,
    type RenderablePoint
} from "./types";
import { validateConfig } from "./validation";

/**
 * Render boundaries for dirty rectangle optimization
 */
interface RenderBoundaries {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

type GridKey = `${number},${number}`;

/**
 * Internal state for the heatmap renderer
 */
interface HeatmapState {
    data: HeatmapData | null;
    palette: Uint8ClampedArray;
    opacityLUT: Uint8ClampedArray;
    defaultTemplate: HTMLCanvasElement;
    valueGrid: Map<GridKey, number>;
    renderBoundaries: RenderBoundaries;
}

/**
 * Create the core heatmap renderer
 */
export function createCore(config: HeatmapConfig): Heatmap {
    const { container, gradient = DEFAULT_GRADIENT } = config;

    const { width, height, radius, blur, maxOpacity, minOpacity } = validateConfig(config);
    const gridSize = 6; // Default grid size for value lookups

    // Create main canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    Object.assign(canvas.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: "100%",
        height: "100%",
        pointerEvents: "none"
    });

    const ctx = canvas.getContext("2d", { willReadFrequently: false })!;

    // Create shadow canvas for grayscale rendering
    const useOffscreen =
        (config.useOffscreenCanvas ?? DEFAULT_CONFIG.useOffscreenCanvas) &&
        typeof OffscreenCanvas !== "undefined";

    const shadowCanvas = useOffscreen
        ? new OffscreenCanvas(width, height)
        : createShadowCanvas(width, height);

    const shadowCtx = shadowCanvas.getContext("2d", {
        willReadFrequently: true
    })!;

    // Internal state
    const state: HeatmapState = {
        data: null,
        palette: generatePalette(gradient),
        opacityLUT: generateOpacityLUT(minOpacity, maxOpacity),
        defaultTemplate: generatePointTemplate(radius, blur),
        valueGrid: new Map(),
        renderBoundaries: { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 }
    };

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
            updateValueGrid(state.data.data);
            render();
            return;
        }

        state.data.data.push(point);
        const needsFullRender = point.value > state.data.max;
        if (needsFullRender) {
            state.data.max = point.value;
        }

        updateValueGrid(state.data.data);

        if (needsFullRender) {
            // Full re-render needed because max changed (affects all alpha values)
            render();
        } else {
            // Incremental render - only draw the new point
            const { min, max } = state.data;
            const range = max - min || 1;
            const renderablePoint: RenderablePoint = {
                x: point.x,
                y: point.y,
                alpha: Math.min(1, Math.max(0, (point.value - min) / range))
            };
            renderPoints([renderablePoint]);
        }
    }

    function addPoints(points: HeatmapPoint[]): void {
        if (points.length === 0) return;

        if (!state.data) {
            const max = Math.max(...points.map((p) => p.value));
            state.data = { min: 0, max, data: points };
            updateValueGrid(state.data.data);
            render();
            return;
        }

        state.data.data.push(...points);
        const newMax = Math.max(...points.map((p) => p.value));
        const needsFullRender = newMax > state.data.max;
        if (needsFullRender) {
            state.data.max = newMax;
        }

        updateValueGrid(state.data.data);

        if (needsFullRender) {
            // Full re-render needed because max changed (affects all alpha values)
            render();
        } else {
            // Incremental render - only draw the new points
            const { min, max } = state.data;
            const range = max - min || 1;
            const renderablePoints: RenderablePoint[] = points.map((point) => ({
                x: point.x,
                y: point.y,
                alpha: Math.min(1, Math.max(0, (point.value - min) / range))
            }));
            renderPoints(renderablePoints);
        }
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
        const key = `${gridX},${gridY}` as const;
        return state.valueGrid.get(key) ?? 0;
    }

    function getDataURL(type = "image/png", quality?: number): string {
        return canvas.toDataURL(type, quality);
    }

    function getStats(): HeatmapStats {
        const { minX, minY, maxX, maxY } = state.renderBoundaries;
        const regionWidth = maxX - minX;
        const regionHeight = maxY - minY;
        const canvasArea = width * height;
        const renderArea = Math.max(0, regionWidth * regionHeight);

        return {
            pointCount: state.data?.data.length ?? 0,
            radius,
            renderBoundaries: {
                minX,
                minY,
                maxX,
                maxY,
                width: regionWidth,
                height: regionHeight
            },
            canvasSize: { width, height },
            renderCoveragePercent: canvasArea > 0 ? (renderArea / canvasArea) * 100 : 0,
            valueGridSize: state.valueGrid.size,
            dataRange: state.data ? { min: state.data.min, max: state.data.max } : null
        };
    }

    function destroy(): void {
        canvas.remove();
        state.valueGrid.clear();
        state.data = null;
    }

    // --- Internal Helpers ---

    function updateValueGrid(points: HeatmapPoint[]): void {
        state.valueGrid.clear();
        for (const point of points) {
            const gridX = Math.floor(point.x / gridSize);
            const gridY = Math.floor(point.y / gridSize);
            const key = `${gridX},${gridY}` as const;
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
        renderPointsWithClear(points);
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

    /**
     * Draw points to shadow canvas and track render boundaries
     * Shared logic between full render and partial render
     */
    function drawPoints(points: RenderablePoint[]): void {
        // Reset render boundaries
        state.renderBoundaries = { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 };

        // Use pre-generated default template (most points use same radius)
        const template = state.defaultTemplate;
        const templateSize = template.width;
        const offset = templateSize / 2;

        let len = points.length;
        while (len--) {
            const point = points[len];

            const pointMinX = point.x - offset;
            const pointMinY = point.y - offset;
            const pointMaxX = point.x + offset;
            const pointMaxY = point.y + offset;

            // Track render boundaries
            state.renderBoundaries.minX = Math.min(state.renderBoundaries.minX, pointMinX);
            state.renderBoundaries.minY = Math.min(state.renderBoundaries.minY, pointMinY);
            state.renderBoundaries.maxX = Math.max(state.renderBoundaries.maxX, pointMaxX);
            state.renderBoundaries.maxY = Math.max(state.renderBoundaries.maxY, pointMaxY);

            // Clamp minimum alpha to ensure very small values are visible
            shadowCtx.globalAlpha = Math.max(0.01, point.alpha);
            shadowCtx.drawImage(template, pointMinX, pointMinY, templateSize, templateSize);
        }
        shadowCtx.globalAlpha = 1;

        // Clamp boundaries to canvas dimensions
        state.renderBoundaries.minX = Math.max(0, Math.floor(state.renderBoundaries.minX));
        state.renderBoundaries.minY = Math.max(0, Math.floor(state.renderBoundaries.minY));
        state.renderBoundaries.maxX = Math.min(width, Math.ceil(state.renderBoundaries.maxX));
        state.renderBoundaries.maxY = Math.min(height, Math.ceil(state.renderBoundaries.maxY));
    }

    function renderPointsWithClear(points: RenderablePoint[]): void {
        clearCanvases();
        renderPoints(points);
    }

    function renderPoints(points: RenderablePoint[]): void {
        if (points.length === 0) return;

        drawPoints(points);
        colorize();
    }

    function colorize(): void {
        const { minX, minY, maxX, maxY } = state.renderBoundaries;
        const regionWidth = maxX - minX;
        const regionHeight = maxY - minY;

        // Skip if no valid region
        if (regionWidth <= 0 || regionHeight <= 0) return;

        const imageData = shadowCtx.getImageData(minX, minY, regionWidth, regionHeight);
        const pixels = imageData.data;

        // Optimized loop: start at alpha channel (index 3) and work backwards
        for (let i = 3; i < pixels.length; i += 4) {
            const alpha = pixels[i];
            if (alpha === 0) continue;

            const paletteIdx = alpha * 4;

            pixels[i - 3] = state.palette[paletteIdx];
            pixels[i - 2] = state.palette[paletteIdx + 1];
            pixels[i - 1] = state.palette[paletteIdx + 2];
            pixels[i] = state.opacityLUT[alpha];
        }

        ctx.putImageData(imageData, minX, minY);
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
        getStats,
        destroy
    };
}

// --- Utility Functions ---

function createShadowCanvas(width: number, height: number): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

function generatePointTemplate(
    radius: number,
    blur: number
): HTMLCanvasElement {
    const size = radius * 2;
    const center = radius;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d")!;

    // blur config is inverted to get blurFactor (matching heatmap.js behavior):
    // - blur = 0 means no blur (solid circle, blurFactor = 1)
    // - blur = 1 means maximum blur (gradient from center to edge, blurFactor = 0)
    // The blurFactor determines the inner radius where the opaque part ends
    const blurFactor = 1 - blur;
    const innerRadius = radius * blurFactor;

    if (blurFactor === 1) {
        // No blur - draw solid circle
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fill();
    } else {
        // Create gradient from inner radius (opaque) to outer radius (transparent)
        const gradient = ctx.createRadialGradient(
            center,
            center,
            innerRadius,
            center,
            center,
            radius
        );

        gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
    }

    return canvas;
}

/**
 * Generate opacity lookup table (256 entries)
 * Pre-computes all possible opacity values for the colorize loop
 */
function generateOpacityLUT(minOpacity: number, maxOpacity: number): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256);
    const opacityRange = maxOpacity - minOpacity;

    for (let alpha = 0; alpha < 256; alpha++) {
        const normalizedAlpha = alpha / 255;
        const scaledOpacity = minOpacity + normalizedAlpha * opacityRange;
        lut[alpha] = Math.round(scaledOpacity * 255);
    }

    return lut;
}

