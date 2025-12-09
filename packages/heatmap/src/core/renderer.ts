/**
 * Core Heatmap
 *
 * Minimal heatmap shell. Rendering is handled by renderer features (withCanvas2DRenderer, etc.)
 */

import { generatePalette } from "./gradient";
import type {
    GradientStop,
    Heatmap,
    HeatmapConfig,
    HeatmapData,
    NormalizedHeatmapData,
    HeatmapEventListener,
    HeatmapEventMap,
    HeatmapPoint,
    HeatmapRenderer,
    HeatmapStats,
    RenderablePoint,
    RenderBoundaries
} from "./types";
import { validateConfig } from "./validation";
import { computeMinMax } from "./utils";

type GridKey = `${number},${number}`;

/**
 * Internal state for the heatmap
 */
interface HeatmapState {
    data: NormalizedHeatmapData | null;
    valueGrid: Map<GridKey, number>;
    renderBoundaries: RenderBoundaries;
}

/**
 * Simple typed event emitter for heatmap events
 */
function createEventEmitter() {
    const listeners = new Map<keyof HeatmapEventMap, Set<Function>>();

    return {
        on<K extends keyof HeatmapEventMap>(
            event: K,
            listener: HeatmapEventListener<K>
        ): void {
            if (!listeners.has(event)) {
                listeners.set(event, new Set());
            }
            listeners.get(event)!.add(listener);
        },

        off<K extends keyof HeatmapEventMap>(
            event: K,
            listener: HeatmapEventListener<K>
        ): void {
            listeners.get(event)?.delete(listener);
        },

        emit<K extends keyof HeatmapEventMap>(
            event: K,
            ...args: HeatmapEventMap[K] extends void ? [] : [HeatmapEventMap[K]]
        ): void {
            const eventListeners = listeners.get(event);
            if (eventListeners) {
                for (const listener of eventListeners) {
                    listener(...args);
                }
            }
        },

        clear(): void {
            listeners.clear();
        }
    };
}

/**
 * Create the core heatmap
 */
export function createCore(config: HeatmapConfig): Heatmap {
    const { container } = config;

    const { width, height, gridSize, intensityExponent } =
        validateConfig(config);

    // Renderer will be attached by withCanvas2DRenderer or similar
    let renderer: HeatmapRenderer | null = null;

    // Internal state
    const state: HeatmapState = {
        data: null,
        valueGrid: new Map(),
        renderBoundaries: { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 }
    };

    // Event emitter for reactive features
    const events = createEventEmitter();

    // --- Helper Functions ---

    /**
     * Normalize data by computing min/max from data points
     */
    function normalizeData(data: HeatmapData): NormalizedHeatmapData {
        const values = data.data.map(p => p.value);
        const { min, max } = computeMinMax(values);

        return {
            min,
            max,
            data: data.data
        };
    }

    // --- Core Methods ---

    function setData(data: HeatmapData): void {
        const normalizedData = normalizeData(data);
        state.data = normalizedData;
        updateValueGrid(normalizedData.data);
        render();
        events.emit("datachange", { data: normalizedData });
    }

    function addPoint(point: HeatmapPoint): void {
        addPoints([point]);
    }

    function addPoints(points: HeatmapPoint[]): void {
        if (points.length === 0) return;

        const newMax = Math.max(...points.map((p) => p.value));

        if (!state.data) {
            state.data = { min: 0, max: newMax, data: [...points] };
            updateValueGrid(state.data.data);
            render();
            return;
        }

        state.data.data.push(...points);
        const needsFullRender = newMax > state.data.max;
        if (needsFullRender) {
            state.data.max = newMax;
        }

        updateValueGrid(state.data.data);

        if (needsFullRender) {
            render();
        } else {
            const { min, max } = state.data;
            const renderablePoints = points.map((p) =>
                toRenderablePoint(p, min, max)
            );
            renderPoints(renderablePoints);
        }
    }

    function setGradient(stops: GradientStop[]): void {
        if (!renderer) return;
        renderer.setPalette(generatePalette(stops));
        render();
        events.emit("gradientchange", { stops });
    }

    function clear(): void {
        state.data = null;
        state.valueGrid.clear();
        renderer?.clear();
        events.emit("clear");
    }

    function getValueAt(x: number, y: number): number {
        const gridX = Math.floor(x / gridSize);
        const gridY = Math.floor(y / gridSize);
        const key = `${gridX},${gridY}` as const;
        return state.valueGrid.get(key) ?? 0;
    }

    function getDataURL(type = "image/png", quality?: number): string {
        if (!renderer) return "";
        return renderer.canvas.toDataURL(type, quality);
    }

    function getStats(): HeatmapStats {
        const { minX, minY, maxX, maxY } = state.renderBoundaries;
        const regionWidth = maxX - minX;
        const regionHeight = maxY - minY;
        const canvasArea = width * height;
        const renderArea = Math.max(0, regionWidth * regionHeight);
        const resolved = validateConfig(config);

        return {
            pointCount: state.data?.data.length ?? 0,
            radius: resolved.radius,
            renderBoundaries: {
                minX,
                minY,
                maxX,
                maxY,
                width: regionWidth,
                height: regionHeight
            },
            canvasSize: { width, height },
            renderCoveragePercent:
                canvasArea > 0 ? (renderArea / canvasArea) * 100 : 0,
            valueGridSize: state.valueGrid.size,
            dataRange: state.data
                ? { min: state.data.min, max: state.data.max }
                : null
        };
    }

    function destroy(): void {
        events.emit("destroy");
        events.clear();
        renderer?.dispose();
        renderer?.canvas.remove();
        state.valueGrid.clear();
        state.data = null;
    }

    // --- Internal Helpers ---

    function computeAlpha(value: number, min: number, max: number): number {
        const range = max - min || 1;
        const normalized = Math.min(1, Math.max(0, (value - min) / range));
        return Math.pow(normalized, intensityExponent);
    }

    function toRenderablePoint(
        point: HeatmapPoint,
        min: number,
        max: number
    ): RenderablePoint {
        return {
            x: point.x,
            y: point.y,
            alpha: computeAlpha(point.value, min, max)
        };
    }

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

    function render(): void {
        if (!renderer) return;

        if (!state.data || state.data.data.length === 0) {
            renderer.clear();
            return;
        }

        const points = computeRenderablePoints(state.data);
        renderer.render(points);
    }

    function computeRenderablePoints(data: NormalizedHeatmapData): RenderablePoint[] {
        const { min, max, data: points } = data;
        return points.map((point) => toRenderablePoint(point, min, max));
    }

    function renderPoints(points: RenderablePoint[]): void {
        if (!renderer || points.length === 0) return;

        state.renderBoundaries = renderer.drawPoints(points);
        renderer.colorize(state.renderBoundaries);
    }

    // Create the heatmap object
    const heatmap: Heatmap = {
        config,
        container,
        width,
        height,
        get canvas() {
            if (!renderer) {
                throw new Error(
                    "Renderer not initialized. Make sure withCanvas2DRenderer() is applied."
                );
            }
            return renderer.canvas;
        },
        get renderer() {
            if (!renderer) {
                throw new Error(
                    "Renderer not initialized. Make sure withCanvas2DRenderer() is applied."
                );
            }
            return renderer;
        },
        set renderer(r: HeatmapRenderer) {
            renderer = r;
        },
        setData,
        addPoint,
        addPoints,
        setGradient,
        clear,
        getValueAt,
        getDataURL,
        getStats,
        destroy,
        on: events.on,
        off: events.off
    };

    return heatmap;
}
