import type { AnimatedHeatmap } from "../features";
import { withCanvas2DRenderer } from "./render-pipeline.ts";
import { createCore } from "./renderer.ts";
import { FeatureKind } from "./types.ts";
import type {
    AnimationFeature,
    Heatmap,
    HeatmapConfig,
    HeatmapFeature
} from "./types.ts";

/**
 * Create a new heatmap instance with optional features
 *
 * @param config - Heatmap configuration
 * @param features - Optional features to apply (withCanvas2DRenderer, withAnimation, etc.)
 * @returns Heatmap instance (extended to AnimatedHeatmap when withAnimation is used)
 *
 * @example
 * ```ts
 * // Basic static heatmap (Canvas2D renderer auto-created)
 * const heatmap = createHeatmap({
 *     container,
 *     data: { min: 0, max: 100, data: points }
 * });
 *
 * // Explicit renderer
 * const heatmap = createHeatmap(
 *     { container, data },
 *     withCanvas2DRenderer({ useOffscreenCanvas: false })
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
    const heatmap = createCore(config);

    // Check if a renderer feature was provided
    const hasRenderer = features.some((f) => f.kind === FeatureKind.Renderer);

    // Auto-create Canvas2D renderer if none provided
    if (!hasRenderer) {
        const defaultRenderer = withCanvas2DRenderer();
        defaultRenderer.setup(heatmap);
    }

    // Apply features (renderer features first, then others)
    for (const feature of features) {
        if (feature.kind === FeatureKind.Renderer) {
            feature.setup(heatmap);
        }
    }

    for (const feature of features) {
        if (feature.kind !== FeatureKind.Renderer) {
            feature.setup(heatmap);
        }
    }

    // Render initial data if provided (only static data, not temporal)
    if (config.data && !("startTime" in config.data)) {
        heatmap.setData(config.data);
    }

    const originalDestroy = heatmap.destroy;
    heatmap.destroy = () => {
        for (const feature of features) {
            feature.teardown?.();
        }
        originalDestroy();
    };

    return heatmap;
}
