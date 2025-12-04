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

    /** Blur amount for smoothing (default: 15) */
    blur?: number;

    /** Maximum opacity of the heatmap layer (0-1, default: 0.8) */
    maxOpacity?: number;

    /** Minimum opacity of the heatmap layer (0-1, default: 0) */
    minOpacity?: number;

    /** Custom gradient definition */
    gradient?: GradientStop[];

    /** Use offscreen canvas for better performance (default: true) */
    useOffscreenCanvas?: boolean;

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

    /** Clean up resources */
    destroy(): void;
}

/**
 * Feature kind symbols for type-safe feature identification
 */
export const FeatureKind = {
    Tooltip: Symbol("tooltip"),
    Animation: Symbol("animation")
} as const;

/**
 * Base feature interface with kind for type discrimination
 */
export interface HeatmapFeature<K extends symbol = symbol> {
    /** Unique identifier for the feature kind */
    readonly kind: K;

    /** Setup the feature on the heatmap */
    setup(heatmap: Heatmap): void;

    /** Cleanup when heatmap is destroyed */
    teardown?(): void;
}

/** Tooltip feature type */
export type TooltipFeature = HeatmapFeature<typeof FeatureKind.Tooltip>;

/** Animation feature type */
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

/** Default gradient: transparent -> blue -> green -> yellow -> red */
export const DEFAULT_GRADIENT: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 0, 0)" },
    { offset: 0.25, color: "rgba(98, 98, 246, 1)" },
    { offset: 0.5, color: "rgba(114, 255, 114, 1)" },
    { offset: 0.75, color: "rgba(255, 255, 38, 1)" },
    { offset: 1, color: "rgba(255, 0, 0, 1)" }
];

/** Default configuration values */
export const DEFAULT_CONFIG = {
    radius: 25,
    blur: 15,
    maxOpacity: 0.8,
    minOpacity: 0,
    useOffscreenCanvas: true
} as const;
