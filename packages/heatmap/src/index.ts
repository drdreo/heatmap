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
 * Basic Usage:
 * ```ts
 * import { createHeatmap } from './lib';
 *
 * const heatmap = createHeatmap({
 *     container: document.getElementById('heatmap')!,
 *     radius: 25,
 *     maxOpacity: 0.8,
 *     data: { min: 0, max: 100, data: [...] }
 * });
 * ```
 *
 * With Features:
 * ```ts
 * import { createHeatmap, withTooltip, withAnimation } from './lib';
 *
 * const heatmap = createHeatmap(
 *     { container, radius: 25 },
 *     withTooltip({ formatter: (v) => `${v} clicks` }),
 *     withAnimation({ fadeOutDuration: 3000 })
 * );
 * ```
 */

import { createCore } from './core/renderer';
import { AnimationFeature, Heatmap, HeatmapConfig, HeatmapFeature } from './core/types';
import { AnimatedHeatmap } from './features/animation';

// Re-export core types
export type {
    Heatmap,
    HeatmapConfig,
    HeatmapData,
    HeatmapFeature,
    HeatmapPoint,
    GradientStop,
    RGBAColor,
    RenderablePoint,
    AnimationFeature,
    TooltipFeature
} from './core/types';

export { FeatureKind, DEFAULT_CONFIG, DEFAULT_GRADIENT } from './core/types';

// Re-export gradient utilities
export { createGradientCanvas, generatePalette, parseColor } from './core/gradient';

// Re-export features
export { withTooltip, type TooltipConfig } from './features/tooltip';
export {
    withAnimation,
    type AnimationConfig,
    type AnimatedHeatmap,
    type TemporalHeatmapPoint,
    type TemporalHeatmapData,
    type AnimationState
} from './features/animation';

/**
 * Create a new heatmap instance with optional features
 *
 * @param config - Heatmap configuration
 * @param features - Optional features to apply (withTooltip, withAnimation, etc.)
 * @returns Heatmap instance (extended to AnimatedHeatmap when withAnimation is used)
 *
 * @example
 * ```ts
 * // Basic heatmap
 * const heatmap = createHeatmap({ container });
 *
 * // With tooltip
 * const heatmap = createHeatmap(
 *     { container },
 *     withTooltip({ formatter: (v) => `${v} clicks` })
 * );
 *
 * // With animation - automatically typed as AnimatedHeatmap!
 * const heatmap = createHeatmap(
 *     { container },
 *     withAnimation({ loop: true })
 * );
 * heatmap.play(); // No cast needed!
 * ```
 */
// Overload: animation feature first returns AnimatedHeatmap
export function createHeatmap(
    config: HeatmapConfig,
    animation: AnimationFeature,
    ...features: HeatmapFeature[]
): AnimatedHeatmap;
// Overload: animation feature second (e.g., after tooltip) returns AnimatedHeatmap
export function createHeatmap(
    config: HeatmapConfig,
    first: HeatmapFeature,
    animation: AnimationFeature,
    ...features: HeatmapFeature[]
): AnimatedHeatmap;
// Overload: without animation feature returns Heatmap
export function createHeatmap(config: HeatmapConfig, ...features: HeatmapFeature[]): Heatmap;
// Implementation
export function createHeatmap(config: HeatmapConfig, ...features: HeatmapFeature[]): Heatmap {
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
