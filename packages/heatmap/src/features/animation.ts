/**
 * Animation Feature
 *
 * Adds temporal animation support to a heatmap.
 */

import {
    type AnimationFeature,
    FeatureKind,
    type Heatmap,
    type RenderablePoint,
    type TemporalHeatmapData,
    type TemporalHeatmapPoint
} from "../core/types";
import { generatePalette } from "../core/gradient";

/** Re-export temporal types from core */
export type { TemporalHeatmapPoint, TemporalHeatmapData } from "../core/types";

/** Animation state */
export type AnimationState = "idle" | "playing" | "paused";

/** Animation configuration */
export interface AnimationConfig {
    /**
     * Duration of point fade-out in milliseconds (default: 2000)
     */
    fadeOutDuration?: number;

    /**
     * Time window in milliseconds to accumulate points (default: 5000)
     */
    timeWindow?: number;

    /**
     * Animation playback speed multiplier (default: 1)
     */
    playbackSpeed?: number;

    /**
     * Whether to loop the animation (default: false)
     */
    loop?: boolean;

    /**
     * Callback fired on each animation frame
     */
    onFrame?: (timestamp: number, progress: number) => void;

    /**
     * Callback fired when animation completes
     */
    onComplete?: () => void;
}

/** Extended heatmap with animation controls */
export interface AnimatedHeatmap extends Heatmap {
    /** Set temporal data for animation */
    setTemporalData(data: TemporalHeatmapData): void;
    /** Start or resume animation */
    play(): void;
    /** Pause the animation */
    pause(): void;
    /** Stop and reset to beginning */
    stop(): void;
    /** Seek to a specific timestamp */
    seek(timestamp: number): void;
    /** Seek to a progress value (0-1) */
    seekProgress(progress: number): void;
    /** Set playback speed */
    setSpeed(speed: number): void;
    /** Set loop mode */
    setLoop(loop: boolean): void;
    /** Get current animation state */
    getAnimationState(): AnimationState;
    /** Get current timestamp */
    getCurrentTime(): number;
    /** Get animation progress (0-1) */
    getProgress(): number;
}

/** Default animation configuration */
const DEFAULT_ANIMATION_CONFIG = {
    fadeOutDuration: 2000,
    timeWindow: 5000,
    playbackSpeed: 1,
    loop: false
} as const;

/**
 * Create an animation feature for the heatmap
 *
 * @example
 * ```ts
 * const heatmap = createHeatmap(
 *     { container },
 *     temporalData,
 *     withAnimation({ fadeOutDuration: 3000, loop: true })
 * );
 *
 * heatmap.play();
 * ```
 */
export function withAnimation(config: AnimationConfig = {}): AnimationFeature {
    let heatmapRef: Heatmap | null = null;

    // Animation config
    const fadeOutDuration =
        config.fadeOutDuration ?? DEFAULT_ANIMATION_CONFIG.fadeOutDuration;
    const timeWindow = config.timeWindow ?? DEFAULT_ANIMATION_CONFIG.timeWindow;
    let playbackSpeed =
        config.playbackSpeed ?? DEFAULT_ANIMATION_CONFIG.playbackSpeed;
    let loop = config.loop ?? DEFAULT_ANIMATION_CONFIG.loop;
    const onFrame = config.onFrame;
    const onComplete = config.onComplete;

    // Animation state
    let data: TemporalHeatmapData | null = null;
    let state: AnimationState = "idle";
    let currentTime = 0;
    let lastFrameTime = 0;
    let animationFrameId: number | null = null;
    let lastSearchIndex = 0;

    // Canvas contexts for animation rendering
    let shadowCanvas: HTMLCanvasElement | OffscreenCanvas | null = null;
    let shadowCtx:
        | CanvasRenderingContext2D
        | OffscreenCanvasRenderingContext2D
        | null = null;
    let ctx: CanvasRenderingContext2D | null = null;
    let pointTemplate: HTMLCanvasElement | null = null;
    let palette: Uint8ClampedArray | null = null;
    let maxOpacity = 0.8;
    let minOpacity = 0;

    function setTemporalData(newData: TemporalHeatmapData): void {
        // Sort data by timestamp
        const sortedData = [...newData.data].sort(
            (a, b) => a.timestamp - b.timestamp
        );
        data = { ...newData, data: sortedData };
        currentTime = newData.startTime;
        lastSearchIndex = 0;
        renderFrame(currentTime);
    }

    function play(): void {
        if (state === "playing" || !data) return;

        state = "playing";
        lastFrameTime = performance.now();
        animationLoop();
    }

    function pause(): void {
        state = "paused";
        if (animationFrameId !== null) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = null;
        }
    }

    function stop(): void {
        pause();
        state = "idle";
        if (data) {
            currentTime = data.startTime;
            lastSearchIndex = 0;
            renderFrame(currentTime);
        }
    }

    function seek(timestamp: number): void {
        if (!data) return;

        currentTime = Math.max(
            data.startTime,
            Math.min(timestamp, data.endTime)
        );

        if (currentTime < data.data[lastSearchIndex]?.timestamp) {
            lastSearchIndex = 0;
        }

        renderFrame(currentTime);
    }

    function seekProgress(progress: number): void {
        if (!data) return;

        const duration = data.endTime - data.startTime;
        const timestamp =
            data.startTime + duration * Math.max(0, Math.min(1, progress));
        seek(timestamp);
    }

    function setSpeed(speed: number): void {
        playbackSpeed = Math.max(0.1, Math.min(10, speed));
    }

    function setLoop(shouldLoop: boolean): void {
        loop = shouldLoop;
    }

    function getAnimationState(): AnimationState {
        return state;
    }

    function getCurrentTime(): number {
        return currentTime;
    }

    function getProgress(): number {
        if (!data) return 0;
        const duration = data.endTime - data.startTime;
        return duration === 0 ? 1 : (currentTime - data.startTime) / duration;
    }

    function animationLoop(): void {
        if (state !== "playing" || !data) return;

        const now = performance.now();
        const deltaTime = now - lastFrameTime;

        currentTime += deltaTime * playbackSpeed;
        lastFrameTime = now;

        if (currentTime >= data.endTime) {
            if (loop) {
                currentTime = data.startTime;
                lastSearchIndex = 0;
            } else {
                currentTime = data.endTime;
                state = "idle";
                renderFrame(currentTime);
                onComplete?.();
                return;
            }
        }

        renderFrame(currentTime);
        onFrame?.(currentTime, getProgress());
        animationFrameId = requestAnimationFrame(animationLoop);
    }

    function renderFrame(timestamp: number): void {
        if (
            !data ||
            !heatmapRef ||
            !shadowCtx ||
            !ctx ||
            !pointTemplate ||
            !palette
        )
            return;

        const { width, height } = heatmapRef;

        // Clear canvases
        ctx.clearRect(0, 0, width, height);
        shadowCtx.clearRect(0, 0, width, height);

        if (data.data.length === 0) return;

        const points = getActivePoints(timestamp);

        if (points.length === 0) return;

        // Draw points
        const templateSize = pointTemplate.width;
        const offset = templateSize / 2;

        for (const point of points) {
            shadowCtx.globalAlpha = point.alpha;
            shadowCtx.drawImage(
                pointTemplate,
                point.x - offset,
                point.y - offset,
                templateSize,
                templateSize
            );
        }
        shadowCtx.globalAlpha = 1;

        // Colorize
        const imageData = shadowCtx.getImageData(0, 0, width, height);
        const pixels = imageData.data;
        const opacityRange = maxOpacity - minOpacity;

        for (let i = 0; i < pixels.length; i += 4) {
            const alpha = pixels[i + 3];
            if (alpha > 0) {
                const paletteIdx = alpha * 4;
                pixels[i] = palette[paletteIdx];
                pixels[i + 1] = palette[paletteIdx + 1];
                pixels[i + 2] = palette[paletteIdx + 2];

                const normalizedAlpha = alpha / 255;
                const scaledOpacity =
                    minOpacity + normalizedAlpha * opacityRange;
                pixels[i + 3] = Math.round(scaledOpacity * 255);
            }
        }

        ctx.putImageData(imageData, 0, 0);
    }

    function getActivePoints(timestamp: number): RenderablePoint[] {
        if (!data) return [];

        const { min, max, data: points } = data;
        const range = max - min || 1;
        const windowStart = timestamp - timeWindow;
        const result: RenderablePoint[] = [];

        const startIdx = binarySearchStart(points, windowStart);

        for (let i = startIdx; i < points.length; i++) {
            const point = points[i];

            if (point.timestamp > timestamp) break;

            const age = Math.min(
                1,
                (timestamp - point.timestamp) / fadeOutDuration
            );
            if (age >= 1) continue;

            const normalizedValue = Math.min(
                1,
                Math.max(0, (point.value - min) / range)
            );
            const decayMultiplier = 1 - easeOutQuad(age);

            result.push({
                x: point.x,
                y: point.y,
                alpha: normalizedValue * decayMultiplier
            });
        }

        lastSearchIndex = startIdx;
        return result;
    }

    function binarySearchStart(
        points: TemporalHeatmapPoint[],
        windowStart: number
    ): number {
        let left = lastSearchIndex;
        let right = points.length - 1;

        if (left > 0 && points[left - 1]?.timestamp >= windowStart) {
            left = 0;
        }

        while (left < right) {
            const mid = (left + right) >>> 1;
            if (points[mid].timestamp < windowStart) {
                left = mid + 1;
            } else {
                right = mid;
            }
        }

        return left;
    }

    function easeOutQuad(t: number): number {
        return t * (2 - t);
    }

    function generatePointTemplate(
        radius: number,
        blur: number
    ): HTMLCanvasElement {
        const size = radius * 2 + blur * 2;
        const center = size / 2;

        const canvas = document.createElement("canvas");
        canvas.width = size;
        canvas.height = size;

        const templateCtx = canvas.getContext("2d")!;
        const gradient = templateCtx.createRadialGradient(
            center,
            center,
            0,
            center,
            center,
            radius
        );

        gradient.addColorStop(0, "rgba(0, 0, 0, 1)");
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        templateCtx.fillStyle = gradient;
        templateCtx.fillRect(0, 0, size, size);

        return canvas;
    }

    return {
        kind: FeatureKind.Animation,

        setup(heatmap: Heatmap): void {
            heatmapRef = heatmap;

            const { width, height, canvas } = heatmap;
            ctx = canvas.getContext("2d", { willReadFrequently: false })!;

            // Create shadow canvas
            if (typeof OffscreenCanvas !== "undefined") {
                shadowCanvas = new OffscreenCanvas(width, height);
                shadowCtx = shadowCanvas.getContext("2d", {
                    willReadFrequently: true
                })!;
            } else {
                shadowCanvas = document.createElement("canvas");
                shadowCanvas.width = width;
                shadowCanvas.height = height;
                shadowCtx = shadowCanvas.getContext("2d", {
                    willReadFrequently: true
                })!;
            }

            // Generate point template (use reasonable defaults)
            pointTemplate = generatePointTemplate(25, 15);
            palette = generatePalette();

            // Extend heatmap with animation methods
            const animatedHeatmap = heatmap as AnimatedHeatmap;
            animatedHeatmap.setTemporalData = setTemporalData;
            animatedHeatmap.play = play;
            animatedHeatmap.pause = pause;
            animatedHeatmap.stop = stop;
            animatedHeatmap.seek = seek;
            animatedHeatmap.seekProgress = seekProgress;
            animatedHeatmap.setSpeed = setSpeed;
            animatedHeatmap.setLoop = setLoop;
            animatedHeatmap.getAnimationState = getAnimationState;
            animatedHeatmap.getCurrentTime = getCurrentTime;
            animatedHeatmap.getProgress = getProgress;

            // Check for initial temporal data in config
            const configData = heatmap.config.data;
            if (configData && "startTime" in configData) {
                setTemporalData(configData);
            }
        },

        teardown(): void {
            pause();
            heatmapRef = null;
            shadowCanvas = null;
            shadowCtx = null;
            ctx = null;
            pointTemplate = null;
            palette = null;
            data = null;
        }
    };
}
