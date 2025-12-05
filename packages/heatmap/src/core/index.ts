/**
 * Core Heatmap Module
 *
 * Exports the core renderer and types.
 */

export { createCore } from "./renderer";
export { validateConfig, type ResolvedConfig } from "./validation";
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
    AnimationFeature,
    TemporalHeatmapPoint,
    TemporalHeatmapData
} from "./types";
export { FeatureKind } from "./types";
export { DEFAULT_CONFIG, DEFAULT_GRADIENT } from "./defaults";
export {
    GRADIENT_DEFAULT,
    GRADIENT_THERMAL,
    GRADIENT_COOL,
    GRADIENT_FIRE,
    GRADIENT_OCEAN,
    GRADIENT_GRAYSCALE,
    GRADIENT_SUNSET,
    GRADIENT_VIRIDIS,
    GRADIENT_PRESETS,
    type GradientPresetName
} from "./presets";
