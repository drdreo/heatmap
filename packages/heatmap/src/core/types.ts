/**
 * Core Heatmap Types
 *
 * Type definitions for the composable heatmap library.
 */

/** A single data point in the heatmap */
export interface HeatmapPoint {
    /** X coordinate in pixels */
    x: number;
    /** Y coordinate in pixels */
    y: number;
    /** Value at this point (e.g., click count) */
    value: number;
}

/** Color stop for gradient definition */
export interface GradientStop {
    /** Position from 0 to 1 */
    offset: number;
    /** CSS color string (hex, rgb, rgba, hsl) */
    color: string;
}

/** RGBA color representation for internal processing */
export interface RGBAColor {
    r: number;
    g: number;
    b: number;
    a: number;
}

/** Data to be rendered on the heatmap */
export type HeatmapData = HeatmapPoint[];

/** Temporal data point with timestamp */
export interface TemporalHeatmapPoint extends HeatmapPoint {
    /** Timestamp in milliseconds */
    timestamp: number;
}

/** Temporal data for animated heatmaps */
export type TemporalHeatmapData = {
    /** Start timestamp of the data range */
    startTime: number;
    /** End timestamp of the data range */
    endTime: number;
    /** Array of temporal data points */
    data: TemporalHeatmapPoint[];
};

/** Point ready to be rendered with computed alpha */
export interface RenderablePoint {
    x: number;
    y: number;
    /** Pre-computed alpha value (0-1) */
    alpha: number;
}

/** Render boundaries for dirty-rect optimization */
export interface RenderBoundaries {
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
}

/** Event payload for data changes */
export interface DataChangeEvent {
    /** The new data that was set */
    data: HeatmapPoint[];
    dataMin: number;
    dataMax: number;
}

/** Event payload for gradient changes */
export interface GradientChangeEvent {
    /** The new gradient stops */
    stops: GradientStop[];
}

/** Event payload for scale changes */
export interface ScaleChangeEvent {
    /** The new minimum value (undefined if auto-detecting) */
    valueMin: number | undefined;
    /** The new maximum value (undefined if auto-detecting) */
    valueMax: number | undefined;
    /** The effective minimum value used for rendering */
    dataMin: number;
    /** The effective maximum value used for rendering */
    dataMax: number;
}

/** Map of heatmap event names to their payload types */
export interface HeatmapEventMap {
    /** Fired when setData() is called */
    datachange: DataChangeEvent;
    /** Fired when setGradient() is called */
    gradientchange: GradientChangeEvent;
    /** Fired when setScale() is called */
    scalechange: ScaleChangeEvent;
    /** Fired when clear() is called */
    clear: void;
    /** Fired when destroy() is called (before cleanup) */
    destroy: void;
}

/** Event listener callback type */
export type HeatmapEventListener<K extends keyof HeatmapEventMap> =
    HeatmapEventMap[K] extends void
        ? () => void
        : (event: HeatmapEventMap[K]) => void;

/** Debug statistics for performance monitoring */
export interface HeatmapStats {
    /** Total number of data points */
    pointCount: number;
    /** Default point radius */
    radius: number;
    /** Current render boundaries */
    renderBoundaries: {
        minX: number;
        minY: number;
        maxX: number;
        maxY: number;
        width: number;
        height: number;
    };
    /** Canvas dimensions */
    canvasSize: { width: number; height: number };
    /** Percentage of canvas covered by render region */
    renderCoveragePercent: number;
    /** Number of grid cells in value lookup */
    valueGridSize: number;
    /** Data range */
    dataRange: { min: number; max: number } | null;
}

/**
 * Base configuration options for the heatmap (shared between static and animated)
 */
export interface HeatmapConfig {
    /** Container element to render the heatmap canvas into */
    container: HTMLElement;

    /**
     * Width of the heatmap canvas in pixels (defaults to container width).
     * This should match the coordinate space of your data points.
     */
    width?: number;

    /**
     * Height of the heatmap canvas in pixels (defaults to container height).
     * This should match the coordinate space of your data points.
     */
    height?: number;

    /** Radius of each data point's influence in pixels (default: 25) */
    radius?: number;

    /** Blur factor (0-1): 0 = no blur (solid circle), 1 = maximum blur (default: 0.85) */
    blur?: number;

    /** Maximum opacity of the heatmap layer (0-1, default: 0.8) */
    maxOpacity?: number;

    /** Minimum opacity of the heatmap layer (0-1, default: 0) */
    minOpacity?: number;

    /** Custom gradient definition */
    gradient?: GradientStop[];

    /** Use offscreen canvas for better performance (default: true) */
    useOffscreenCanvas?: boolean;

    /** Grid cell size for value lookups in pixels (default: 10) */
    gridSize?: number;

    /**
     * Canvas blend mode for overlapping points (default: 'source-over')
     *
     * Useful values:
     * - 'source-over': Default compositing (standard layering)
     * - 'lighter': Additive blending (overlapping areas glow brighter)
     *
     * Note: Most other blend modes (multiply, screen, etc.) won't produce
     * visible differences due to how the heatmap uses grayscale intensity.
     */
    blendMode?: GlobalCompositeOperation;

    /**
     * Exponent for intensity curve (default: 1)
     *
     * Controls how values map to visual intensity:
     * - 1: Linear mapping (default)
     * - < 1 (e.g., 0.5): Makes low values more visible (square root curve)
     * - > 1 (e.g., 2): Emphasizes high values, dims low values (quadratic curve)
     */
    intensityExponent?: number;

    /**
     * Initial data to render.
     * Use HeatmapData for static heatmaps, TemporalHeatmapData for animated heatmaps.
     */
    data?: HeatmapData | TemporalHeatmapData;

    /**
     * Fixed minimum value for the heatmap scale.
     * When set, this value will be used instead of auto-detecting from data.
     * Useful for maintaining consistent scales across different datasets.
     * @example valueMin: 0 // Always start scale at 0
     */
    valueMin?: number;

    /**
     * Fixed maximum value for the heatmap scale.
     * When set, this value will be used instead of auto-detecting from data.
     * Useful for maintaining consistent scales across different datasets.
     * @example valueMax: 100 // Always end scale at 100
     */
    valueMax?: number;
}

/**
 * Renderer interface - the abstraction for rendering heatmaps.
 * Can be implemented by Canvas2D, WebGL, etc.
 */
export interface HeatmapRenderer {
    /** The canvas element */
    readonly canvas: HTMLCanvasElement;
    /** Canvas width */
    readonly width: number;
    /** Canvas height */
    readonly height: number;
    /** Color palette for the gradient */
    readonly palette: Uint8ClampedArray;
    /** Opacity lookup table */
    readonly opacityLUT: Uint8ClampedArray;

    /** Clear the canvas */
    clear(): void;

    /** Draw points to the shadow canvas, returns boundaries */
    drawPoints(points: RenderablePoint[]): RenderBoundaries;

    /** Apply colorization from shadow canvas to main canvas */
    colorize(bounds?: RenderBoundaries): void;

    /** Convenience: clear + draw + colorize in one call */
    render(points: RenderablePoint[]): void;

    /** Update the color palette */
    setPalette(palette: Uint8ClampedArray): void;

    /** Clean up resources */
    dispose(): void;
}

/** Core heatmap instance returned by createHeatmap */
export interface Heatmap {
    /** The original configuration */
    readonly config: HeatmapConfig;

    /** The container element */
    readonly container: HTMLElement;

    /** The canvas element */
    readonly canvas: HTMLCanvasElement;

    /** Canvas width */
    readonly width: number;

    /** Canvas height */
    readonly height: number;

    /** The renderer instance (shared across features) */
    renderer: HeatmapRenderer;

    /** Set the data points to render. */
    setData(points: HeatmapPoint[]): void;

    /** Add a single point to existing data */
    addPoint(point: HeatmapPoint): void;

    /** Add a points to existing data */
    addPoints(points: HeatmapPoint[]): void;

    /** Update the gradient */
    setGradient(stops: GradientStop[]): void;

    /**
     * Update the value scale for rendering.
     * This affects both the heatmap intensity and legend labels.
     * @param min - Minimum value for the scale (or undefined to auto-detect from data)
     * @param max - Maximum value for the scale (or undefined to auto-detect from data)
     */
    setScale(min: number | undefined, max: number | undefined): void;

    /** Clear the heatmap */
    clear(): void;

    /** Get value at a position (for tooltips/interactions) */
    getValueAt(x: number, y: number): number;

    /** Get the canvas as a data URL */
    getDataURL(type?: string, quality?: number): string;

    /** Get debug statistics for performance monitoring */
    getStats(): HeatmapStats;

    /** Clean up resources */
    destroy(): void;

    /**
     * Subscribe to heatmap events
     * @param event - Event name to listen for
     * @param listener - Callback function
     */
    on<K extends keyof HeatmapEventMap>(
        event: K,
        listener: HeatmapEventListener<K>
    ): void;

    /**
     * Unsubscribe from heatmap events
     * @param event - Event name to stop listening for
     * @param listener - Callback function to remove
     */
    off<K extends keyof HeatmapEventMap>(
        event: K,
        listener: HeatmapEventListener<K>
    ): void;
}

export const FeatureKind: {
    readonly Tooltip: symbol;
    readonly Legend: symbol;
    readonly Animation: symbol;
    readonly Renderer: symbol;
} = {
    Tooltip: Symbol("tooltip"),
    Legend: Symbol("legend"),
    Animation: Symbol("animation"),
    Renderer: Symbol("renderer")
} as const;

export interface HeatmapFeature<K extends symbol = symbol> {
    /** Unique identifier for the feature kind */
    readonly kind: K;

    /** Setup the feature on the heatmap */
    setup(heatmap: Heatmap): void;

    /** Cleanup when heatmap is destroyed */
    teardown?(): void;
}

export type TooltipFeature = HeatmapFeature<typeof FeatureKind.Tooltip>;
export type LegendFeature = HeatmapFeature<typeof FeatureKind.Legend>;
export type AnimationFeature = HeatmapFeature<typeof FeatureKind.Animation>;
export type RendererFeature = HeatmapFeature<typeof FeatureKind.Renderer>;

/**
 * Helper type to check if a feature array contains a specific feature kind
 */
export type HasFeature<
    Features extends HeatmapFeature[],
    Kind extends symbol
> = Features extends (infer F)[]
    ? F extends HeatmapFeature<Kind>
        ? true
        : false
    : false;
