/**
 * Heatmap Features
 *
 * Tree-shakeable features that can be composed with the core heatmap.
 */

export {
    withLegend,
    type LegendConfig,
    type LegendPosition,
    type LegendOrientation
} from "./legend";
export { withTooltip, type TooltipConfig } from "./tooltip";
export {
    withAnimation,
    type AnimationConfig,
    type AnimatedHeatmap,
    type TemporalHeatmapPoint,
    type TemporalHeatmapData,
    type AnimationState
} from "./animation";
