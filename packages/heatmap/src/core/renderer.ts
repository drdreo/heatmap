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
    HeatmapEventListener,
    HeatmapEventMap,
    HeatmapPoint,
    HeatmapRenderer,
    HeatmapStats,
    RenderablePoint,
    RenderBoundaries
} from "./types";
import { validateConfig } from "./validation";

type GridKey = `${number},${number}`;

/**
 * Internal state for the heatmap
 */
interface HeatmapState {
    points: HeatmapPoint[];
    /** Auto-detected minimum value from data points */
    dataMin: number;
    /** Maximum aggregated value from the grid (may exceed max individual point) */
    gridMax: number;
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
        points: [],
        dataMin: 0,
        gridMax: 0,
        valueGrid: new Map(),
        renderBoundaries: { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 }
    };

    // Event emitter for reactive features
    const events = createEventEmitter();

    // --- Core Methods ---

    /**
     * Get effective min value for rendering.
     * Defaults to 0 for intuitive behavior (value 50 out of max 100 = 50% intensity).
     * Can be overridden via config.valueMin for special cases (e.g., negative values).
     */
    function getEffectiveMin(): number {
        return config.valueMin ?? 0;
    }

    /**
     * Get effective max value for rendering (config override or gridMax)
     */
    function getEffectiveMax(): number {
        return config.valueMax ?? state.gridMax;
    }

    /**
     * Compute min value from data points (for reporting in events)
     */
    function computeDataMin(points: HeatmapPoint[]): number {
        if (points.length === 0) return 0;
        return Math.min(...points.map((p) => p.value));
    }

    function setData(points: HeatmapPoint[]): void {
        state.points = points;
        state.dataMin = computeDataMin(points);
        state.gridMax = renderAndGetGridMax();

        events.emit("datachange", {
            points,
            dataMin: state.dataMin,
            gridMax: state.gridMax,
            effectiveMin: getEffectiveMin(),
            effectiveMax: getEffectiveMax()
        });
    }

    function addPoint(point: HeatmapPoint): void {
        addPoints([point]);
    }

    function addPoints(points: HeatmapPoint[]): void {
        if (points.length === 0) return;

        const newMin = Math.min(...points.map((p) => p.value));
        const newMax = Math.max(...points.map((p) => p.value));

        const needsFullRender =
            state.points.length === 0 ||
            newMin < state.dataMin ||
            newMax > state.gridMax;

        state.points.push(...points);

        if (newMin < state.dataMin) {
            state.dataMin = newMin;
        }

        state.gridMax = updateValueGrid(state.points);

        if (needsFullRender) {
            render();
        } else {
            const renderablePoints = points.map((p) =>
                toRenderablePoint(p, getEffectiveMin(), getEffectiveMax())
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
        state.points = [];
        state.dataMin = 0;
        state.gridMax = 0;
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
            pointCount: state.points.length,
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
            dataRange:
                state.points.length > 0
                    ? { min: state.dataMin, max: state.gridMax }
                    : null
        };
    }

    function destroy(): void {
        events.emit("destroy");
        events.clear();
        renderer?.dispose();
        renderer?.canvas.remove();
        state.valueGrid.clear();
        state.points = [];
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

    /**
     * Updates the value grid and returns the maximum aggregated value.
     * Multiple points in the same grid cell have their values summed,
     * so the gridMax may exceed the max individual point value.
     */
    function updateValueGrid(points: HeatmapPoint[]): number {
        state.valueGrid.clear();
        let gridMax = 0;
        for (const point of points) {
            const gridX = Math.floor(point.x / gridSize);
            const gridY = Math.floor(point.y / gridSize);
            const key = `${gridX},${gridY}` as const;
            const existing = state.valueGrid.get(key) ?? 0;
            const newValue = existing + point.value;
            state.valueGrid.set(key, newValue);
            if (newValue > gridMax) {
                gridMax = newValue;
            }
        }
        return gridMax;
    }

    /**
     * Render the heatmap and return the gridMax value.
     * Returns 0 if there's no data or renderer.
     */
    function renderAndGetGridMax(): number {
        if (!renderer) return 0;

        if (state.points.length === 0) {
            renderer.clear();
            return 0;
        }

        const gridMax = updateValueGrid(state.points);
        const points = computeRenderablePoints(gridMax);
        renderer.render(points);
        return gridMax;
    }

    function render(): void {
        renderAndGetGridMax();
    }

    /**
     * Compute renderable points with normalized alpha values.
     * Uses effectiveMin/effectiveMax from config if set, otherwise uses auto-detected values.
     */
    function computeRenderablePoints(gridMax: number): RenderablePoint[] {
        const effectiveMin = getEffectiveMin();
        const effectiveMax = config.valueMax ?? gridMax;
        return state.points.map((point) =>
            toRenderablePoint(point, effectiveMin, effectiveMax)
        );
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
