/**
 * Core Heatmap
 *
 */

import type { AnimatedHeatmap } from "../features";
import { generatePalette } from "./gradient";
import { withCanvas2DRenderer } from "./render-pipeline";
import type {
    AnimationFeature,
    GradientStop,
    Heatmap,
    HeatmapConfig,
    HeatmapEventListener,
    HeatmapEventMap,
    HeatmapFeature,
    HeatmapPoint,
    HeatmapRenderer,
    HeatmapStats,
    RenderablePoint,
    RenderBoundaries
} from "./types";
import { FeatureKind } from "./types";
import { validateConfig } from "./validation";

type GridKey = `${number},${number}`;

/**
 * Internal state for the heatmap
 */
interface HeatmapState {
    points: HeatmapPoint[];
    /** Auto-detected minimum value from data points */
    dataMin: number;
    /** Auto-detected maxium value from data points */
    dataMax: number;
    valueGrid: Map<GridKey, number>;
    renderBoundaries: RenderBoundaries;
}

/**
 * Create a new heatmap instance with optional features
 *
 * @param config - Heatmap configuration
 * @param animation - Optional animation feature (withAnimation)
 * @param features - Optional features to apply (withCanvas2DRenderer, withAnimation, etc.)
 * @returns Heatmap instance (extended to AnimatedHeatmap when withAnimation is used)
 *
 * @example
 * ```ts
 * // Basic static heatmap (Canvas2D renderer auto-created)
 * const heatmap = createHeatmap({
 *     container,
 *     data: [{ x: 10, y: 20, value: 50 }, ...]
 * });
 *
 * // Explicit renderer
 * const heatmap = createHeatmap(
 *     { container, data },
 *     withCanvas2DRenderer({ useOffscreenCanvas: false })
 * );
 *
 * // Animated heatmap with temporal data
 * const heatmap = createHeatmap(
 *     { container, data: temporalData },
 *     withAnimation({ loop: true })
 * );
 * heatmap.play();
 * ```
 */
export function createHeatmap(
    config: HeatmapConfig,
    animation: AnimationFeature,
    ...features: HeatmapFeature[]
): AnimatedHeatmap;
export function createHeatmap(
    config: HeatmapConfig,
    first: HeatmapFeature,
    animation: AnimationFeature,
    ...features: HeatmapFeature[]
): AnimatedHeatmap;
export function createHeatmap(
    config: HeatmapConfig,
    ...features: HeatmapFeature[]
): Heatmap;
export function createHeatmap(
    config: HeatmapConfig,
    ...features: HeatmapFeature[]
): Heatmap {
    const heatmap = createCore(config);

    // Check if a renderer feature was provided
    const hasRenderer = features.some((f) => f.kind === FeatureKind.Renderer);

    // Auto-create Canvas2D renderer if none provided
    if (!hasRenderer) {
        features.push(withCanvas2DRenderer());
    }

    // Apply features (renderer features first, then others)
    for (const feature of features) {
        if (feature.kind === FeatureKind.Renderer) {
            feature.setup(heatmap);
        }
    }

    for (const feature of features) {
        if (feature.kind !== FeatureKind.Renderer) {
            feature.setup(heatmap);
        }
    }

    // Render initial data if provided (skip if it's temporal data for animation)
    const configData = config.data;
    const isTemporalData =
        configData &&
        typeof configData === "object" &&
        "startTime" in configData &&
        "endTime" in configData;

    if (
        configData &&
        Array.isArray(configData) &&
        configData.length > 0 &&
        !isTemporalData
    ) {
        heatmap.setData(configData);
    }

    const originalDestroy = heatmap.destroy;
    heatmap.destroy = () => {
        for (const feature of features) {
            feature.teardown?.();
        }
        originalDestroy();
    };

    return heatmap;
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
function createCore(config: HeatmapConfig): Heatmap {
    const { container } = config;

    const { width, height, gridSize, intensityExponent } =
        validateConfig(config);

    // Renderer will be attached by withCanvas2DRenderer or similar
    let renderer: HeatmapRenderer | null = null;

    const state: HeatmapState = {
        points: [],
        dataMin: config.valueMin ?? 0,
        dataMax: config.valueMax ?? 0,
        valueGrid: new Map(),
        renderBoundaries: { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 }
    };

    // Event emitter for reactive features
    const events = createEventEmitter();

    // --- Core Methods ---

    /**
     * Compute min value from data points
     */
    function computeDataMin(points: HeatmapPoint[]): number {
        if (points.length === 0) return 0;
        return Math.min(...points.map((p) => p.value));
    }

    /**
     * Compute max value from data points
     */
    function computeDataMax(points: HeatmapPoint[]): number {
        if (points.length === 0) return 0;
        return Math.max(...points.map((p) => p.value));
    }

    /**
     * Recompute and apply data bounds from current points
     * @returns Whether the bounds changed from previous values
     */
    function syncDataBounds(): boolean {
        const oldMin = state.dataMin;
        const oldMax = state.dataMax;

        state.dataMin = config.valueMin ?? computeDataMin(state.points);
        state.dataMax = config.valueMax ?? computeDataMax(state.points);

        return state.dataMin !== oldMin || state.dataMax !== oldMax;
    }

    function setData(data: HeatmapPoint[]): void {
        state.points = data;
        syncDataBounds();
        updateValueGrid(state.points);
        render();
        events.emit("datachange", {
            data,
            dataMin: state.dataMin,
            dataMax: state.dataMax
        });
    }

    function addPoint(point: HeatmapPoint): void {
        addPoints([point]);
    }

    function addPoints(points: HeatmapPoint[]): void {
        if (points.length === 0) return;

        const hadNoPoints = state.points.length === 0;
        state.points.push(...points);

        const boundsChanged = syncDataBounds();
        updateValueGrid(state.points);

        // Only do incremental render if bounds didn't change
        if (hadNoPoints || boundsChanged) {
            render();
        } else {
            const renderablePoints = points.map((p) =>
                toRenderablePoint(p, state.dataMin, state.dataMax)
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

    function setScale(min: number | undefined, max: number | undefined): void {
        config.valueMin = min;
        config.valueMax = max;

        syncDataBounds();
        render();

        events.emit("scalechange", {
            valueMin: min,
            valueMax: max,
            dataMin: state.dataMin,
            dataMax: state.dataMax
        });
    }

    function clear(): void {
        state.points = [];
        state.dataMin = 0;
        state.dataMax = 0;
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
                    ? { min: state.dataMin, max: state.dataMax }
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
            const newValue = existing + point.value;
            state.valueGrid.set(key, newValue);
        }
    }

    function render(): void {
        if (!renderer) return;

        if (!state.points || state.points.length === 0) {
            renderer.clear();
            return;
        }

        const points = computeRenderablePoints();
        renderer.render(points);
    }

    function computeRenderablePoints(): RenderablePoint[] {
        const points = state.points;
        const min = state.dataMin;
        const max = state.dataMax;
        return points.map((point) => toRenderablePoint(point, min, max));
    }

    function renderPoints(points: RenderablePoint[]): void {
        if (!renderer || points.length === 0) return;

        state.renderBoundaries = renderer.drawPoints(points);
        renderer.colorize(state.renderBoundaries);
    }

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
        setScale,
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
