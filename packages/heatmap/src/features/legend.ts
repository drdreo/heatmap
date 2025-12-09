/**
 * Legend Feature
 *
 * Adds a gradient legend to a heatmap with reactive updates.
 * The legend shows the color gradient and value labels.
 */

import { createGradientCanvas } from "../core/gradient";
import { DEFAULT_GRADIENT } from "../core/defaults";
import {
    FeatureKind,
    type DataChangeEvent,
    type GradientChangeEvent,
    type GradientStop,
    type Heatmap,
    type LegendFeature
} from "../core/types";

/** Position options for the legend */
export type LegendPosition =
    | "top"
    | "top-left"
    | "top-right"
    | "bottom"
    | "bottom-left"
    | "bottom-right"
    | "left"
    | "right";

/** Orientation of the legend gradient */
export type LegendOrientation = "horizontal" | "vertical";

/** Legend configuration */
export interface LegendConfig {
    /**
     * Position of the legend relative to the heatmap (default: 'bottom-right')
     */
    position?: LegendPosition;

    /**
     * Orientation of the gradient (default: 'horizontal')
     */
    orientation?: LegendOrientation;

    /**
     * Width of the gradient bar in pixels
     * Default: 150 for horizontal, 20 for vertical
     */
    width?: number;

    /**
     * Height of the gradient bar in pixels
     * Default: 15 for horizontal, 100 for vertical
     */
    height?: number;

    /**
     * Number of labels to show (default: 5)
     */
    labelCount?: number;

    /**
     * Whether to always show min/max labels even if labelCount is low (default: true)
     */
    showMinMax?: boolean;

    /**
     * Custom formatter for label values
     * @param value - The numeric value to format
     * @param index - The index of the label (0 = min, last = max)
     */
    formatter?: (value: number, index: number) => string;

    /**
     * Custom CSS class name for the legend container
     */
    className?: string;

    /**
     * Custom inline styles for the legend container
     */
    style?: Partial<CSSStyleDeclaration>;

    /**
     * Fixed minimum value for the legend scale.
     * When set, this value will be used instead of auto-detecting from data.
     * Useful for maintaining consistent scales across different datasets.
     */
    min?: number;

    /**
     * Fixed maximum value for the legend scale.
     * When set, this value will be used instead of auto-detecting from data.
     * Useful for maintaining consistent scales across different datasets.
     *
     * Note: By default (when not set), the legend uses the maximum aggregated
     * grid value (gridMax) which matches what tooltips display. This ensures
     * the legend accurately represents the actual values users see.
     */
    max?: number;
}

/** Internal state for the legend */
interface LegendState {
    minValue: number;
    maxValue: number;
    gradientStops: GradientStop[];
    gradientCanvas: HTMLCanvasElement | null;
}

/** Default legend configuration */
const DEFAULT_LEGEND_CONFIG: Required<
    Omit<LegendConfig, "className" | "style" | "min" | "max">
> = {
    position: "bottom-right",
    orientation: "horizontal",
    width: 150,
    height: 15,
    labelCount: 5,
    showMinMax: true,
    formatter: (value: number) => Math.round(value).toString()
};

/**
 * Create a legend feature for the heatmap
 *
 * @example
 * ```ts
 * // Basic usage
 * const heatmap = createHeatmap({ container, data }, withLegend());
 *
 * // Custom formatter
 * const heatmap = createHeatmap(
 *     { container, data },
 *     withLegend({ formatter: (v) => `${v.toFixed(1)}°C`, labelCount: 3 })
 * );
 *
 * // Fixed min/max scale
 * const heatmap = createHeatmap(
 *     { container, data },
 *     withLegend({ min: 0, max: 100 })
 * );
 *
 * // Custom theme
 * const heatmap = createHeatmap(
 *     { container, data },
 *     withLegend({ position: 'top-left', className: 'dark-legend' })
 * );
 * ```
 */
export function withLegend(config: LegendConfig = {}): LegendFeature {
    let heatmapRef: Heatmap | null = null;
    let legendElement: HTMLDivElement | null = null;
    let gradientContainer: HTMLDivElement | null = null;
    let labelsContainer: HTMLDivElement | null = null;

    // Bound event handlers for cleanup
    let boundDataChangeHandler: ((event: DataChangeEvent) => void) | null =
        null;
    let boundGradientChangeHandler:
        | ((event: GradientChangeEvent) => void)
        | null = null;

    const resolvedConfig = {
        position: config.position ?? DEFAULT_LEGEND_CONFIG.position,
        orientation: config.orientation ?? DEFAULT_LEGEND_CONFIG.orientation,
        width:
            config.width ??
            (config.orientation === "vertical"
                ? 20
                : DEFAULT_LEGEND_CONFIG.width),
        height:
            config.height ??
            (config.orientation === "vertical"
                ? 100
                : DEFAULT_LEGEND_CONFIG.height),
        labelCount: config.labelCount ?? DEFAULT_LEGEND_CONFIG.labelCount,
        showMinMax: config.showMinMax ?? DEFAULT_LEGEND_CONFIG.showMinMax,
        formatter: config.formatter ?? DEFAULT_LEGEND_CONFIG.formatter,
        className: config.className,
        style: config.style,
        min: config.min,
        max: config.max
    };

    const state: LegendState = {
        minValue: 0,
        maxValue: 100,
        gradientStops: DEFAULT_GRADIENT,
        gradientCanvas: null
    };

    /**
     * Create the legend DOM element structure
     */
    function createLegendElement(): HTMLDivElement {
        const legend = document.createElement("div");
        legend.className = resolvedConfig.className ?? "heatmap-legend";

        // Base styles for positioning
        Object.assign(legend.style, {
            position: "absolute",
            display: "flex",
            flexDirection:
                resolvedConfig.orientation === "horizontal" ? "column" : "row",
            alignItems: "stretch",
            padding: "8px",
            background: "rgba(255, 255, 255, 0.9)",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0, 0, 0, 0.1)",
            fontSize: "11px",
            fontFamily: "system-ui, -apple-system, sans-serif",
            pointerEvents: "none",
            zIndex: "999",
            boxSizing: "border-box"
        });

        applyPositionStyles(legend, resolvedConfig.position);

        // Apply custom styles (overrides defaults)
        if (resolvedConfig.style) {
            Object.assign(legend.style, resolvedConfig.style);
        }

        // Create gradient container
        gradientContainer = document.createElement("div");
        gradientContainer.className = "heatmap-legend__gradient-container";
        Object.assign(gradientContainer.style, {
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
        });

        // Create labels container
        labelsContainer = document.createElement("div");
        labelsContainer.className = "heatmap-legend__labels";
        Object.assign(labelsContainer.style, {
            display: "flex",
            justifyContent: "space-between",
            color: "#333",
            ...(resolvedConfig.orientation === "horizontal"
                ? { marginTop: "4px", flexDirection: "row" }
                : { marginLeft: "4px", flexDirection: "column" })
        });

        legend.appendChild(gradientContainer);
        legend.appendChild(labelsContainer);

        return legend;
    }

    /**
     * Apply position-specific styles to the legend element
     */
    function applyPositionStyles(
        element: HTMLDivElement,
        position: LegendPosition
    ): void {
        // Reset position
        element.style.top = "";
        element.style.bottom = "";
        element.style.left = "";
        element.style.right = "";
        element.style.transform = "";

        const margin = "10px";

        switch (position) {
            case "top":
                element.style.top = margin;
                element.style.left = "50%";
                element.style.transform = "translateX(-50%)";
                break;
            case "top-left":
                element.style.top = margin;
                element.style.left = margin;
                break;
            case "top-right":
                element.style.top = margin;
                element.style.right = margin;
                break;
            case "bottom":
                element.style.bottom = margin;
                element.style.left = "50%";
                element.style.transform = "translateX(-50%)";
                break;
            case "bottom-left":
                element.style.bottom = margin;
                element.style.left = margin;
                break;
            case "bottom-right":
                element.style.bottom = margin;
                element.style.right = margin;
                break;
            case "left":
                element.style.top = "50%";
                element.style.left = margin;
                element.style.transform = "translateY(-50%)";
                break;
            case "right":
                element.style.top = "50%";
                element.style.right = margin;
                element.style.transform = "translateY(-50%)";
                break;
        }
    }

    /**
     * Calculate label values based on min/max and configuration
     */
    function calculateLabels(): number[] {
        const { minValue, maxValue } = state;
        const { labelCount, showMinMax } = resolvedConfig;

        if (labelCount <= 0) return [];
        if (labelCount === 1) return [(minValue + maxValue) / 2];

        const labels: number[] = [];
        const range = maxValue - minValue;

        for (let i = 0; i < labelCount; i++) {
            const t = i / (labelCount - 1);
            labels.push(minValue + t * range);
        }

        // Ensure min/max are included if showMinMax is true
        if (showMinMax && labelCount >= 2) {
            labels[0] = minValue;
            labels[labels.length - 1] = maxValue;
        }

        return labels;
    }

    /**
     * Create or update the gradient canvas
     */
    function updateGradientCanvas(): HTMLCanvasElement {
        const { width, height, orientation } = resolvedConfig;
        const isHorizontal = orientation === "horizontal";

        // For vertical orientation, reverse the gradient so max is at top and min at bottom
        const stops = isHorizontal
            ? state.gradientStops
            : state.gradientStops.map((stop) => ({
                  ...stop,
                  offset: 1 - stop.offset
              }));

        state.gradientCanvas = createGradientCanvas(
            width,
            height,
            stops,
            isHorizontal
        );

        state.gradientCanvas.className = "heatmap-legend__gradient";
        Object.assign(state.gradientCanvas.style, {
            display: "block",
            borderRadius: "2px"
        });

        return state.gradientCanvas;
    }

    /**
     * Update the gradient display in the DOM
     */
    function updateGradientDisplay(): void {
        if (!gradientContainer) {
            return;
        }

        gradientContainer.innerHTML = "";

        const canvas = updateGradientCanvas();
        gradientContainer.appendChild(canvas);
    }

    /**
     * Update the labels display in the DOM
     */
    function updateLabelsDisplay(): void {
        if (!labelsContainer) {
            return;
        }

        // Clear existing labels
        labelsContainer.innerHTML = "";

        const labels = calculateLabels();
        const { orientation } = resolvedConfig;

        // For vertical orientation, reverse labels so max is at top and min at bottom
        const displayLabels =
            orientation === "vertical" ? [...labels].reverse() : labels;

        displayLabels.forEach((value, index) => {
            // Use original index for formatter (0 = min, last = max)
            const originalIndex =
                orientation === "vertical" ? labels.length - 1 - index : index;
            const label = document.createElement("span");
            label.textContent = resolvedConfig.formatter(value, originalIndex);
            Object.assign(label.style, {
                whiteSpace: "nowrap",
                ...(orientation === "vertical" && {
                    textAlign: "left"
                })
            });
            labelsContainer!.appendChild(label);
        });
    }

    /**
     * Full update of the legend
     */
    function updateLegend(): void {
        updateGradientDisplay();
        updateLabelsDisplay();
    }

    /**
     * Handle data change event - update min/max values and labels.
     * Respects user-configured min/max values, otherwise uses effective values from renderer.
     * The effectiveMin/effectiveMax reflect the render scale (config.valueMin/valueMax or defaults),
     * ensuring the legend matches what the colors represent.
     */
    function handleDataChange(event: DataChangeEvent): void {
        // Use legend-specific config if provided, otherwise use effective render scale
        state.minValue = resolvedConfig.min ?? event.effectiveMin;
        state.maxValue = resolvedConfig.max ?? event.effectiveMax;
        updateLabelsDisplay();
    }

    /**
     * Handle gradient change event - update gradient display
     */
    function handleGradientChange(event: GradientChangeEvent): void {
        state.gradientStops = event.stops;
        state.gradientCanvas = null; // Invalidate cache
        updateGradientDisplay();
    }

    /**
     * Subscribe to heatmap events for reactivity
     */
    function subscribeToEvents(heatmap: Heatmap): void {
        boundDataChangeHandler = handleDataChange;
        boundGradientChangeHandler = handleGradientChange;

        heatmap.on("datachange", boundDataChangeHandler);
        heatmap.on("gradientchange", boundGradientChangeHandler);
    }

    /**
     * Unsubscribe from heatmap events
     */
    function unsubscribeFromEvents(heatmap: Heatmap): void {
        if (boundDataChangeHandler) {
            heatmap.off("datachange", boundDataChangeHandler);
        }
        if (boundGradientChangeHandler) {
            heatmap.off("gradientchange", boundGradientChangeHandler);
        }
    }

    /**
     * Initialize state from heatmap config.
     * User-configured min/max take precedence.
     * Initial data values will be set when setData is called (via datachange event).
     */
    function initializeState(heatmap: Heatmap): void {
        state.gradientStops = heatmap.config.gradient ?? DEFAULT_GRADIENT;

        // Use configured min/max if provided, otherwise use defaults
        // The actual data range will be set when setData is called
        if (resolvedConfig.min !== undefined) {
            state.minValue = resolvedConfig.min;
        }
        if (resolvedConfig.max !== undefined) {
            state.maxValue = resolvedConfig.max;
        }
    }

    return {
        kind: FeatureKind.Legend,

        setup(heatmap: Heatmap): void {
            heatmapRef = heatmap;

            initializeState(heatmap);

            legendElement = createLegendElement();
            heatmap.container.appendChild(legendElement);

            subscribeToEvents(heatmap);

            // Initial render
            updateLegend();
        },

        teardown(): void {
            if (heatmapRef) {
                unsubscribeFromEvents(heatmapRef);
            }

            legendElement?.remove();

            legendElement = null;
            gradientContainer = null;
            labelsContainer = null;
            boundDataChangeHandler = null;
            boundGradientChangeHandler = null;
            heatmapRef = null;

            state.gradientCanvas = null;
        }
    };
}
