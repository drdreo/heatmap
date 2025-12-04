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
    /** Minimum value in the dataset (for normalization) */
    min: number;
    /** Maximum value in the dataset (for normalization) */
    max: number;
    /** Array of data points */
    data: HeatmapPoint[];
}

/** Point ready to be rendered with computed alpha */
export interface RenderablePoint {
    x: number;
    y: number;
    /** Pre-computed alpha value (0-1) */
    alpha: number;
}

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

/** Configuration options for the heatmap */
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

    /** Initial data to render */
    data?: HeatmapData;
}

/** Core heatmap instance returned by createHeatmap */
export interface Heatmap {
    /** The container element */
    readonly container: HTMLElement;

    /** The canvas element */
    readonly canvas: HTMLCanvasElement;

    /** Canvas width */
    readonly width: number;

    /** Canvas height */
    readonly height: number;

    /** Set the data to render */
    setData(data: HeatmapData): void;

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
}

export const FeatureKind = {
    Tooltip: Symbol("tooltip"),
    Animation: Symbol("animation")
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
export type AnimationFeature = HeatmapFeature<typeof FeatureKind.Animation>;

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

