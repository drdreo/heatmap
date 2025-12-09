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
export interface HeatmapData {
    /** Array of data points */
    data: HeatmapPoint[];
}

/** Temporal data point with timestamp */
export interface TemporalHeatmapPoint extends HeatmapPoint {
    /** Timestamp in milliseconds */
    timestamp: number;
}

/** Temporal data for animated heatmaps */
export interface TemporalHeatmapData {
    /** Minimum value in the dataset */
    min: number;
    /** Maximum value in the dataset */
    max: number;
    /** Start timestamp of the data range */
    startTime: number;
    /** End timestamp of the data range */
    endTime: number;
    /** Array of temporal data points */
    data: TemporalHeatmapPoint[];
}

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
    /** The data points that were set */
    points: HeatmapPoint[];
    /**
     * The minimum value found in the data points.
     * Auto-detected from the point with the lowest value.
     */
    dataMin: number;
    /**
     * The maximum aggregated value in the grid.
     * This may be higher than the max individual point value when multiple
     * points are grouped into the same grid cell (their values are summed).
     */
    gridMax: number;
    /**
     * The effective minimum value used for rendering.
     * This is config.valueMin if set, otherwise dataMin.
     * Use this for legend display to match the rendered colors.
     */
    effectiveMin: number;
    /**
     * The effective maximum value used for rendering.
     * This is config.valueMax if set, otherwise gridMax.
     * Use this for legend display to match the rendered colors.
     */
    effectiveMax: number;
}

/** Event payload for gradient changes */
export interface GradientChangeEvent {
    /** The new gradient stops */
    stops: GradientStop[];
}

/** Map of heatmap event names to their payload types */
export interface HeatmapEventMap {
    /** Fired when setData() is called */
    datachange: DataChangeEvent;
    /** Fired when setGradient() is called */
    gradientchange: GradientChangeEvent;
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
    /** Auto-detected data range (min from points, max from grid aggregation) */
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
     * Fixed minimum value for the color scale (default: 0).
     *
     * By default, the scale starts at 0 for intuitive behavior where a value
     * of 50 with max 100 shows at 50% intensity. Set this to a different value
     * for special cases like:
     * - Negative value ranges (e.g., valueMin: -100)
     * - Data that doesn't include zero (e.g., temperatures starting at 20°C)
     *
     * The legend will automatically use this value.
     */
    valueMin?: number;

    /**
     * Fixed maximum value for the color scale (default: auto-detected from data).
     *
     * When set, this value is used for color normalization instead of the
     * auto-detected maximum. Values exceeding this will be clamped to full
     * intensity. Useful for:
     * - Maintaining consistent scales across multiple heatmaps
     * - Preventing outliers from compressing the color range
     * - Setting a known maximum (e.g., 100 for percentages)
     *
     * The legend will automatically use this value when set.
     */
    valueMax?: number;

    /**
     * Initial data points to render.
     * Min/max values are auto-detected from the data.
     * Use config.valueMin/valueMax to override the scale.
     */
    data?: HeatmapPoint[];
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

export const FeatureKind = {
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
