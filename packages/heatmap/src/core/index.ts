/**
 * Core Heatmap Module
 *
 * Exports the core renderer and types.
 */

export { validateConfig, type ResolvedConfig } from "./validation";
export { generatePalette, parseColor, createGradientCanvas } from "./gradient";
export type {
    AggregationMode,
    Heatmap,
    HeatmapConfig,
    HeatmapData,
    HeatmapFeature,
    HeatmapPoint,
    HeatmapStats,
    HeatmapRenderer,
    GradientStop,
    RGBAColor,
    RenderablePoint,
    RenderBoundaries,
    TooltipFeature,
    AnimationFeature,
    RendererFeature,
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

export {
    withCanvas2DRenderer,
    createCanvas2DRenderer,
    generatePointTemplate,
    generateOpacityLUT,
    type Canvas2DRendererConfig,
    type PointTemplate
} from "./render-pipeline";

export {
    withWebGLRenderer,
    createWebGLRenderer,
    isWebGLAvailable,
    type WebGLRendererConfig
} from "./webgl-renderer";
