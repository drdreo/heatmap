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
     * The duration in milliseconds to keep points visible (default: 5000ms). Points older than this are excluded.
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
 *     { container, data: temporalData },
 *     withAnimation({ fadeOutDuration: 3000, loop: true })
 * );
 *
 * heatmap.play();
 * ```
 */
export function withAnimation(config: AnimationConfig = {}): AnimationFeature {
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
    let dataMin = 0;
    let dataMax = 0;
    let state: AnimationState = "idle";
    let currentTime = 0;
    let lastFrameTime = 0;
    let animationFrameId: number | null = null;
    let lastSearchIndex = 0;

    // Reference to heatmap
    let heatmapRef: Heatmap | null = null;

    function computeDataBounds(points: TemporalHeatmapPoint[]): {
        min: number;
        max: number;
    } {
        if (points.length === 0) return { min: 0, max: 0 };
        let min = Infinity;
        let max = -Infinity;
        for (const p of points) {
            if (p.value < min) min = p.value;
            if (p.value > max) max = p.value;
        }
        return { min, max };
    }

    function syncDataBounds(): void {
        if (!data || !heatmapRef) return;

        const detected = computeDataBounds(data.data);

        dataMin = heatmapRef.config.valueMin ?? detected.min;
        dataMax = heatmapRef.config.valueMax ?? detected.max;
    }

    function setTemporalData(newData: TemporalHeatmapData): void {
        // Sort data by timestamp
        const sortedData = [...newData.data].sort(
            (a, b) => a.timestamp - b.timestamp
        );
        data = { ...newData, data: sortedData };
        syncDataBounds();
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
        if (!data || !heatmapRef) return;

        const { renderer } = heatmapRef;

        if (data.data.length === 0) {
            renderer.clear();
            return;
        }

        const points = getActivePoints(timestamp);
        renderer.render(points);
    }

    function getActivePoints(timestamp: number): RenderablePoint[] {
        if (!data) return [];

        const points = data.data;
        const range = dataMax - dataMin || 1;
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
                Math.max(0, (point.value - dataMin) / range)
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

    return {
        kind: FeatureKind.Animation,

        setup(heatmap: Heatmap): void {
            heatmapRef = heatmap;

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
            data = null;
        }
    };
}
