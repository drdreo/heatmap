/**
 * Render Pipeline
 *
 * Unified rendering abstraction layer for heatmaps.
 * Provides a consistent interface that can be implemented by different renderers
 * (Canvas2D, WebGL, Worker-based, etc.)
 */

import { generatePalette } from "./gradient";
import { DEFAULT_GRADIENT } from "./defaults";
import type {
    GradientStop,
    HeatmapRenderer,
    RenderablePoint,
    RenderBoundaries,
    RendererFeature
} from "./types";
import { FeatureKind } from "./types";
import { validateConfig, type ResolvedConfig } from "./validation";

/**
 * Configuration for the Canvas2D renderer
 */
export interface Canvas2DRendererConfig {
    /** Use offscreen canvas for shadow canvas.  (default: false) */
    useOffscreenCanvas?: boolean;
}

/**
 * Pre-generated point template
 */
export interface PointTemplate {
    canvas: HTMLCanvasElement;
    size: number;
}

/**
 * Generate a point template (radial gradient circle)
 *
 * The blur parameter controls the gradient:
 * - blur = 0 → solid circle, no gradient (blurFactor = 1)
 * - blur = 0.85 (default) → small opaque core, gradient to edge
 * - blur = 1 → full gradient from center to edge (blurFactor = 0)
 */
export function generatePointTemplate(
    radius: number,
    blur: number
): PointTemplate {
    const size = radius * 2;
    const center = radius;

    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;

    const ctx = canvas.getContext("2d")!;

    const blurFactor = 1 - blur;
    const innerRadius = radius * blurFactor;

    if (blurFactor === 1) {
        ctx.beginPath();
        ctx.arc(center, center, radius, 0, 2 * Math.PI, false);
        ctx.fillStyle = "rgba(0, 0, 0, 1)";
        ctx.fill();
    } else {
        const gradient = ctx.createRadialGradient(
            center,
            center,
            innerRadius,
            center,
            center,
            radius
        );

        gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, size, size);
    }

    return { canvas, size };
}

/**
 * Generate opacity lookup table (256 entries)
 */
export function generateOpacityLUT(
    minOpacity: number,
    maxOpacity: number
): Uint8ClampedArray {
    const lut = new Uint8ClampedArray(256);
    const opacityRange = maxOpacity - minOpacity;

    for (let alpha = 0; alpha < 256; alpha++) {
        const normalizedAlpha = alpha / 255;
        const scaledOpacity = minOpacity + normalizedAlpha * opacityRange;
        lut[alpha] = Math.round(scaledOpacity * 255);
    }

    return lut;
}

/**
 * Create a shadow canvas (off-screen rendering target)
 */
function createShadowCanvas(
    width: number,
    height: number,
    useOffscreenCanvas: boolean
): HTMLCanvasElement | OffscreenCanvas {
    if (useOffscreenCanvas && typeof OffscreenCanvas !== "undefined") {
        return new OffscreenCanvas(width, height);
    }

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    return canvas;
}

/**
 * Create a Canvas2D-based renderer
 */
export function createCanvas2DRenderer(
    config: ResolvedConfig,
    gradient: GradientStop[] = DEFAULT_GRADIENT,
    useOffscreenCanvas: boolean = false
): HeatmapRenderer {
    const { width, height, radius, blur, minOpacity, maxOpacity, blendMode } =
        config;

    // Create main canvas
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d", { willReadFrequently: false })!;

    // Create shadow canvas for grayscale rendering
    const shadowCanvas = createShadowCanvas(width, height, useOffscreenCanvas);
    const shadowCtx = shadowCanvas.getContext("2d", {
        willReadFrequently: true
    })! as CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

    // Generate point template
    const template = generatePointTemplate(radius, blur);

    // Generate palette and opacity LUT
    let palette = generatePalette(gradient);
    let opacityLUT = generateOpacityLUT(minOpacity, maxOpacity);

    // Current render boundaries
    let currentBounds: RenderBoundaries = {
        minX: Infinity,
        minY: Infinity,
        maxX: 0,
        maxY: 0
    };

    function clear(): void {
        ctx.clearRect(0, 0, width, height);
        shadowCtx.clearRect(0, 0, width, height);
        currentBounds = { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 };
    }

    function drawPoints(points: RenderablePoint[]): RenderBoundaries {
        currentBounds = {
            minX: Infinity,
            minY: Infinity,
            maxX: 0,
            maxY: 0
        };

        const templateSize = template.size;
        const offset = templateSize / 2;

        shadowCtx.globalCompositeOperation = blendMode;

        let len = points.length;
        while (len--) {
            const point = points[len];

            const pointMinX = point.x - offset;
            const pointMinY = point.y - offset;
            const pointMaxX = point.x + offset;
            const pointMaxY = point.y + offset;

            currentBounds.minX = Math.min(currentBounds.minX, pointMinX);
            currentBounds.minY = Math.min(currentBounds.minY, pointMinY);
            currentBounds.maxX = Math.max(currentBounds.maxX, pointMaxX);
            currentBounds.maxY = Math.max(currentBounds.maxY, pointMaxY);

            shadowCtx.globalAlpha = Math.max(0.01, point.alpha);
            shadowCtx.drawImage(
                template.canvas,
                pointMinX,
                pointMinY,
                templateSize,
                templateSize
            );
        }
        shadowCtx.globalAlpha = 1;
        shadowCtx.globalCompositeOperation = "source-over";

        currentBounds.minX = Math.max(0, Math.floor(currentBounds.minX));
        currentBounds.minY = Math.max(0, Math.floor(currentBounds.minY));
        currentBounds.maxX = Math.min(width, Math.ceil(currentBounds.maxX));
        currentBounds.maxY = Math.min(height, Math.ceil(currentBounds.maxY));

        return currentBounds;
    }

    function colorize(bounds?: RenderBoundaries): void {
        const { minX, minY, maxX, maxY } = bounds ?? currentBounds;
        const regionWidth = maxX - minX;
        const regionHeight = maxY - minY;

        if (regionWidth <= 0 || regionHeight <= 0) {
            return;
        }

        const imageData = shadowCtx.getImageData(
            minX,
            minY,
            regionWidth,
            regionHeight
        );
        const pixels = imageData.data;

        for (let i = 3; i < pixels.length; i += 4) {
            const alpha = pixels[i];
            if (alpha === 0) continue;

            const paletteIdx = alpha * 4;

            pixels[i - 3] = palette[paletteIdx];
            pixels[i - 2] = palette[paletteIdx + 1];
            pixels[i - 1] = palette[paletteIdx + 2];
            pixels[i] = opacityLUT[alpha];
        }

        ctx.putImageData(imageData, minX, minY);
    }

    function render(points: RenderablePoint[]): void {
        clear();
        if (points.length === 0) return;
        const bounds = drawPoints(points);
        colorize(bounds);
    }

    function setPalette(newPalette: Uint8ClampedArray): void {
        palette = newPalette;
    }

    function dispose(): void {
        ctx.clearRect(0, 0, width, height);
        shadowCtx.clearRect(0, 0, width, height);
    }

    return {
        canvas,
        width,
        height,
        get palette() {
            return palette;
        },
        get opacityLUT() {
            return opacityLUT;
        },
        clear,
        drawPoints,
        colorize,
        render,
        setPalette,
        dispose
    };
}

/**
 * Create a Canvas2D renderer feature
 *
 * @example
 * ```ts
 * // Explicit renderer
 * const heatmap = createHeatmap(
 *     { container, data },
 *     withCanvas2DRenderer()
 * );
 *
 * // With custom config
 * const heatmap = createHeatmap(
 *     { container, data },
 *     withCanvas2DRenderer({ useOffscreenCanvas: false })
 * );
 * ```
 */
export function withCanvas2DRenderer(
    config: Canvas2DRendererConfig = {}
): RendererFeature {
    const { useOffscreenCanvas = false } = config;

    return {
        kind: FeatureKind.Renderer,

        setup(heatmap) {
            const resolved = validateConfig(heatmap.config);
            const gradient = heatmap.config.gradient ?? DEFAULT_GRADIENT;

            const renderer = createCanvas2DRenderer(
                resolved,
                gradient,
                useOffscreenCanvas
            );

            // Style the canvas for overlay positioning
            Object.assign(renderer.canvas.style, {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                pointerEvents: "none"
            });

            heatmap.renderer = renderer;
            heatmap.container.appendChild(renderer.canvas);
        },

        teardown() {
            // Cleanup handled by heatmap.destroy()
        }
    };
}
