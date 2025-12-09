import type { AnimatedHeatmap } from "../features";
import { withCanvas2DRenderer } from "./render-pipeline";
import { createCore } from "./renderer";
import type {
    AnimationFeature,
    Heatmap,
    HeatmapConfig,
    HeatmapFeature
} from "./types";
import { FeatureKind } from "./types";

/**
 * Create a new heatmap instance with optional features
 *
 * @param config - Heatmap configuration
 * @param animation - Optional animation feature (withAnimation)
 * @param features - Optional features to apply (withCanvas2DRenderer, withAnimation, etc.)
 * @returns Heatmap instance (extended to AnimatedHeatmap when withAnimation is used)
 *
 * @example
 * ```ts
 * // Basic static heatmap (Canvas2D renderer auto-created)
 * const heatmap = createHeatmap({
 *     container,
 *     data: [{ x: 10, y: 20, value: 50 }, ...]
 * });
 *
 * // With fixed scale
 * const heatmap = createHeatmap({
 *     container,
 *     data: points,
 *     valueMin: 0,
 *     valueMax: 100
 * });
 *
 * // Animated heatmap with temporal data
 * const heatmap = createHeatmap(
 *     { container },
 *     withAnimation({ loop: true })
 * );
 * heatmap.setTemporalData(temporalData);
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
        features.push(withCanvas2DRenderer());
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

    // Render initial data if provided (skip if it's temporal data for animation)
    const configData = config.data;
    const isTemporalData =
        configData &&
        typeof configData === "object" &&
        "startTime" in configData &&
        "endTime" in configData;

    if (
        configData &&
        Array.isArray(configData) &&
        configData.length > 0 &&
        !isTemporalData
    ) {
        heatmap.setData(configData);
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
