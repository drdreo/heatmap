/**
 * Tooltip Feature
 *
 * Adds hover tooltip functionality to a heatmap.
 */

import { FeatureKind, type Heatmap, type TooltipFeature } from "../core/types";

/** Tooltip configuration */
export interface TooltipConfig {
    /**
     * Custom formatter for tooltip text.
     * Receives the value at the hovered position.
     * Default: (value) => `${value}`
     */
    formatter?: (value: number, x: number, y: number) => string;

    /**
     * Offset from cursor position in pixels (default: { x: 15, y: 15 })
     */
    offset?: { x: number; y: number };

    /**
     * Enforce container boundaries (default: false)
     */
    enforceBounds?: boolean;

    /**
     * Custom CSS class name for the tooltip element
     */
    className?: string;

    /**
     * Custom inline styles for the tooltip element
     */
    style?: Partial<CSSStyleDeclaration>;
}

/** Default tooltip configuration */
const DEFAULT_TOOLTIP_CONFIG = {
    offset: { x: 15, y: 15 },
    enforceBounds: false,
    formatter: (value: number) => `${value}`
} as const;

/**
 * Create a tooltip feature for the heatmap
 *
 * @example
 * ```ts
 * const heatmap = createHeatmap(
 *     { container },
 *     withTooltip({ formatter: (v) => `${v} clicks` })
 * );
 * ```
 */
export function withTooltip(config: TooltipConfig = {}): TooltipFeature {
    let tooltipElement: HTMLDivElement | null = null;
    let boundMouseMove: ((e: MouseEvent) => void) | null = null;
    let boundMouseLeave: (() => void) | null = null;
    let heatmapRef: Heatmap | null = null;

    const resolvedConfig = {
        offset: config.offset ?? DEFAULT_TOOLTIP_CONFIG.offset,
        enforceBounds:
            config.enforceBounds ?? DEFAULT_TOOLTIP_CONFIG.enforceBounds,
        formatter: config.formatter ?? DEFAULT_TOOLTIP_CONFIG.formatter,
        className: config.className,
        style: config.style
    };

    function createTooltipElement(): HTMLDivElement {
        const el = document.createElement("div");
        el.className = resolvedConfig.className ?? "heatmap-tooltip";

        Object.assign(el.style, {
            position: "absolute",
            pointerEvents: "none",
            opacity: "0.9",
            background: "rgba(0, 0, 0, 0.8)",
            color: "#fff",
            fontSize: "14px",
            padding: "5px 8px",
            borderRadius: "4px",
            zIndex: "1000",
            display: "none",
            whiteSpace: "nowrap",
            left: "0",
            top: "0",
            transformOrigin: "left top"
        });

        if (resolvedConfig.style) {
            Object.assign(el.style, resolvedConfig.style);
        }

        return el;
    }

    function handleMouseMove(event: MouseEvent): void {
        if (!tooltipElement || !heatmapRef) {
            return;
        }

        const containerRect = heatmapRef.container.getBoundingClientRect();

        // Mouse position relative to the container (in screen/visual coordinates)
        const mouseX = event.clientX - containerRect.left;
        const mouseY = event.clientY - containerRect.top;

        // Calculate the scale factor (container may be CSS transformed)
        const scaleX = heatmapRef.width / containerRect.width;
        const scaleY = heatmapRef.height / containerRect.height;
        const scale = Math.max(scaleX, scaleY);

        // Convert mouse position to data coordinates for grid lookup
        const dataX = Math.round(mouseX * scaleX);
        const dataY = Math.round(mouseY * scaleY);

        // Look up value
        const value = heatmapRef.getValueAt(dataX, dataY);

        // Format tooltip text
        tooltipElement.textContent = resolvedConfig.formatter(
            value,
            dataX,
            dataY
        );
        tooltipElement.style.display = "block";

        let tooltipX = mouseX + resolvedConfig.offset.x;
        let tooltipY = mouseY + resolvedConfig.offset.y;

        // Enforce container boundaries if enabled
        if (resolvedConfig.enforceBounds) {
            const tooltipWidth = tooltipElement.offsetWidth;
            const tooltipHeight = tooltipElement.offsetHeight;
            const containerWidth = containerRect.width;
            const containerHeight = containerRect.height;

            // Flip horizontally if overflowing right
            if (tooltipX + tooltipWidth > containerWidth) {
                tooltipX = mouseX - tooltipWidth - resolvedConfig.offset.x;
            }
            // Flip vertically if overflowing bottom
            if (tooltipY + tooltipHeight > containerHeight) {
                tooltipY = mouseY - tooltipHeight - resolvedConfig.offset.y;
            }

            // Clamp to container edges
            tooltipX = Math.max(
                0,
                Math.min(tooltipX, containerWidth - tooltipWidth)
            );
            tooltipY = Math.max(
                0,
                Math.min(tooltipY, containerHeight - tooltipHeight)
            );
        }

        // Position tooltip with scale to maintain size in scaled containers
        tooltipElement.style.transform = `scale(${scale}) translate(${tooltipX}px, ${tooltipY}px)`;
    }

    function handleMouseLeave(): void {
        if (tooltipElement) {
            tooltipElement.style.display = "none";
        }
    }

    return {
        kind: FeatureKind.Tooltip,

        setup(heatmap: Heatmap): void {
            heatmapRef = heatmap;

            // Create and append tooltip element
            tooltipElement = createTooltipElement();
            heatmap.container.appendChild(tooltipElement);

            // Bind event handlers
            boundMouseMove = handleMouseMove;
            boundMouseLeave = handleMouseLeave;

            heatmap.container.addEventListener("mousemove", boundMouseMove);
            heatmap.container.addEventListener("mouseleave", boundMouseLeave);
        },

        teardown(): void {
            if (heatmapRef && boundMouseMove) {
                heatmapRef.container.removeEventListener(
                    "mousemove",
                    boundMouseMove
                );
            }
            if (heatmapRef && boundMouseLeave) {
                heatmapRef.container.removeEventListener(
                    "mouseleave",
                    boundMouseLeave
                );
            }

            tooltipElement?.remove();
            tooltipElement = null;
            boundMouseMove = null;
            boundMouseLeave = null;
            heatmapRef = null;
        }
    };
}
