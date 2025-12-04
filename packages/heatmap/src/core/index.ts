/**
 * Core Heatmap Module
 *
 * Exports the core renderer and types.
 */

export { createCore } from "./renderer";
export { generatePalette, parseColor, createGradientCanvas } from "./gradient";
export type {
    Heatmap,
    HeatmapConfig,
    HeatmapData,
    HeatmapFeature,
    HeatmapPoint,
    HeatmapStats,
    GradientStop,
    RGBAColor,
    RenderablePoint,
    TooltipFeature,
    AnimationFeature
} from "./types";
export { DEFAULT_CONFIG, DEFAULT_GRADIENT, FeatureKind } from "./types";
