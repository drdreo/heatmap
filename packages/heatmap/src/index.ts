/**
 * Composable Heatmap Library
 *
 * A modern, performant, tree-shakeable heatmap rendering library.
 *
 * Features:
 * - High-performance Canvas2D rendering
 * - Composable features via withXXX() pattern
 * - Tree-shakeable (only include what you use)
 * - Zero external dependencies
 *
 */

// Re-export core types
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
    RenderBoundaries,
    HeatmapRenderer,
    AnimationFeature,
    TooltipFeature,
    LegendFeature,
    RendererFeature,
    TemporalHeatmapPoint,
    TemporalHeatmapData,
    HeatmapEventMap,
    HeatmapEventListener,
    DataChangeEvent,
    GradientChangeEvent,
    ScaleChangeEvent
} from "./core/types";

export { FeatureKind } from "./core/types";
export { DEFAULT_CONFIG, DEFAULT_GRADIENT } from "./core/defaults";

// Re-export gradient presets
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
} from "./core/presets";

// Re-export gradient utilities
export {
    createGradientCanvas,
    generatePalette,
    parseColor
} from "./core/gradient";

// Re-export validation utilities
export { validateConfig, type ResolvedConfig } from "./core/validation";

export { createHeatmap } from "./core/core";

// Re-export renderer utilities
export {
    withCanvas2DRenderer,
    generatePointTemplate,
    generateOpacityLUT,
    type Canvas2DRendererConfig,
    type PointTemplate
} from "./core/render-pipeline";

export {
    withWebGLRenderer,
    isWebGLAvailable,
    type WebGLRendererConfig
} from "./core/webgl-renderer";

// Re-export features
export { withTooltip, type TooltipConfig } from "./features/tooltip";
export {
    withLegend,
    type LegendConfig,
    type LegendPosition,
    type LegendOrientation
} from "./features/legend";
export {
    withAnimation,
    type AnimationConfig,
    type AnimatedHeatmap,
    type AnimationState
} from "./features/animation";
