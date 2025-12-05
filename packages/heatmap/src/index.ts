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

import { createCore } from "./core/renderer";
import type {
    AnimationFeature,
    Heatmap,
    HeatmapConfig,
    HeatmapFeature
} from "./core/types";
import type { AnimatedHeatmap } from "./features/animation";

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
    AnimationFeature,
    TooltipFeature,
    TemporalHeatmapPoint,
    TemporalHeatmapData
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

// Re-export features
export { withTooltip, type TooltipConfig } from "./features/tooltip";
export {
    withAnimation,
    type AnimationConfig,
    type AnimatedHeatmap,
    type AnimationState
} from "./features/animation";

/**
 * Create a new heatmap instance with optional features
 *
 * @param config - Heatmap configuration
 * @param features - Optional features to apply (withTooltip, withAnimation, etc.)
 * @returns Heatmap instance (extended to AnimatedHeatmap when withAnimation is used)
 *
 * @example
 * ```ts
 * // Basic static heatmap
 * const heatmap = createHeatmap({
 *     container,
 *     data: { min: 0, max: 100, data: points }
 * });
 *
 * // Static heatmap with tooltip
 * const heatmap = createHeatmap(
 *     { container, data: staticData },
 *     withTooltip({ formatter: (v) => `${v} clicks` })
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
// Overload: animation feature first returns AnimatedHeatmap
export function createHeatmap(
    config: HeatmapConfig,
    animation: AnimationFeature,
    ...features: HeatmapFeature[]
): AnimatedHeatmap;
// Overload: animation feature second returns AnimatedHeatmap
export function createHeatmap(
    config: HeatmapConfig,
    first: HeatmapFeature,
    animation: AnimationFeature,
    ...features: HeatmapFeature[]
): AnimatedHeatmap;
// Overload: no animation feature returns Heatmap
export function createHeatmap(
    config: HeatmapConfig,
    ...features: HeatmapFeature[]
): Heatmap;
// Implementation
export function createHeatmap(
    config: HeatmapConfig,
    ...features: HeatmapFeature[]
): Heatmap {
    // Create core renderer
    const heatmap = createCore(config);

    // Apply features
    for (const feature of features) {
        feature.setup(heatmap);
    }

    // Wrap destroy to teardown features
    const originalDestroy = heatmap.destroy;
    heatmap.destroy = () => {
        for (const feature of features) {
            feature.teardown?.();
        }
        originalDestroy();
    };

    return heatmap;
}
