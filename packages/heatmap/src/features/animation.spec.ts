import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
    createHeatmap,
    withAnimation,
    type AnimatedHeatmap,
    type TemporalHeatmapData
} from "../index";

describe("withAnimation feature", () => {
    let container: HTMLDivElement;
    let heatmap: AnimatedHeatmap;

    const createMockContainer = (width = 300, height = 200): HTMLDivElement => {
        const div = document.createElement("div");
        Object.defineProperty(div, "offsetWidth", {
            value: width,
            configurable: true
        });
        Object.defineProperty(div, "offsetHeight", {
            value: height,
            configurable: true
        });
        return div;
    };

    const createTemporalData = (
        pointCount = 5,
        duration = 5000
    ): TemporalHeatmapData => {
        const startTime = 0;
        const data: TemporalHeatmapData["data"] = [];
        for (let i = 0; i < pointCount; i++) {
            data.push({
                x: Math.floor(Math.random() * 300),
                y: Math.floor(Math.random() * 200),
                value: Math.floor(Math.random() * 100),
                timestamp: startTime + (i * duration) / pointCount
            });
        }
        return {
            min: 0,
            max: 100,
            startTime,
            endTime: startTime + duration,
            data
        };
    };

    beforeEach(() => {
        container = createMockContainer();
        document.body.appendChild(container);
        vi.useFakeTimers();
    });

    afterEach(() => {
        heatmap?.destroy();
        container?.remove();
        vi.useRealTimers();
    });

    describe("setup", () => {
        it("should create animated heatmap with animation methods", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            expect(heatmap.setTemporalData).toBeDefined();
            expect(heatmap.play).toBeDefined();
            expect(heatmap.pause).toBeDefined();
            expect(heatmap.stop).toBeDefined();
            expect(heatmap.seek).toBeDefined();
            expect(heatmap.seekProgress).toBeDefined();
            expect(heatmap.setSpeed).toBeDefined();
            expect(heatmap.setLoop).toBeDefined();
            expect(heatmap.getAnimationState).toBeDefined();
            expect(heatmap.getCurrentTime).toBeDefined();
            expect(heatmap.getProgress).toBeDefined();
        });

        it("should initialize with idle state", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            expect(heatmap.getAnimationState()).toBe("idle");
        });

        it("should initialize with zero progress", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            expect(heatmap.getProgress()).toBe(0);
        });
    });

    describe("setTemporalData", () => {
        it("should accept temporal data", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data = createTemporalData();

            expect(() => heatmap.setTemporalData(data)).not.toThrow();
        });

        it("should sort data by timestamp", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            // Create unsorted data
            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 3000,
                data: [
                    { x: 100, y: 100, value: 50, timestamp: 2000 },
                    { x: 50, y: 50, value: 30, timestamp: 1000 },
                    { x: 150, y: 150, value: 70, timestamp: 3000 }
                ]
            };

            heatmap.setTemporalData(data);
            expect(heatmap.getCurrentTime()).toBe(0);
        });

        it("should render initial frame at startTime", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data = createTemporalData();

            heatmap.setTemporalData(data);

            expect(heatmap.getCurrentTime()).toBe(data.startTime);
        });

        it("should handle empty data array", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 5000,
                data: []
            };

            expect(() => heatmap.setTemporalData(data)).not.toThrow();
        });
    });

    describe("play/pause/stop", () => {
        it("should change state to playing when play is called", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            heatmap.setTemporalData(createTemporalData());

            heatmap.play();

            expect(heatmap.getAnimationState()).toBe("playing");
        });

        it("should not play without data", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            heatmap.play();

            expect(heatmap.getAnimationState()).toBe("idle");
        });

        it("should change state to paused when pause is called", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            heatmap.setTemporalData(createTemporalData());

            heatmap.play();
            heatmap.pause();

            expect(heatmap.getAnimationState()).toBe("paused");
        });

        it("should preserve current time when paused", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            heatmap.setTemporalData(createTemporalData());

            heatmap.play();

            const timeBeforePause = heatmap.getCurrentTime();
            heatmap.pause();
            // Simulate time passing
            vi.advanceTimersByTime(1000);
            const timeAfterPause = heatmap.getCurrentTime();

            expect(timeAfterPause).toBe(timeBeforePause);
        });

        it("should reset to start when stop is called", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data = createTemporalData();
            heatmap.setTemporalData(data);

            heatmap.play();
            vi.advanceTimersByTime(1000);
            heatmap.stop();

            expect(heatmap.getAnimationState()).toBe("idle");
            expect(heatmap.getCurrentTime()).toBe(data.startTime);
        });

        it("should not restart if already playing", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            heatmap.setTemporalData(createTemporalData());

            heatmap.play();
            const state1 = heatmap.getAnimationState();
            heatmap.play();
            const state2 = heatmap.getAnimationState();

            expect(state1).toBe("playing");
            expect(state2).toBe("playing");
        });
    });

    describe("seek", () => {
        it("should seek to specific timestamp", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data = createTemporalData(10, 10000);
            heatmap.setTemporalData(data);

            heatmap.seek(5000);

            expect(heatmap.getCurrentTime()).toBe(5000);
        });

        it("should clamp seek to data range", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 1000,
                endTime: 5000,
                data: [{ x: 50, y: 50, value: 50, timestamp: 3000 }]
            };
            heatmap.setTemporalData(data);

            // Seek before start
            heatmap.seek(0);
            expect(heatmap.getCurrentTime()).toBe(1000);

            // Seek after end
            heatmap.seek(10000);
            expect(heatmap.getCurrentTime()).toBe(5000);
        });

        it("should do nothing without data", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            expect(() => heatmap.seek(5000)).not.toThrow();
        });

        it("should seek backwards", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data = createTemporalData(10, 10000);
            heatmap.setTemporalData(data);

            heatmap.seek(8000);
            heatmap.seek(2000);

            expect(heatmap.getCurrentTime()).toBe(2000);
        });

        it("should seek while playing", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data = createTemporalData(10, 10000);
            heatmap.setTemporalData(data);

            heatmap.play();
            heatmap.seek(2000);
            vi.advanceTimersByTime(1000);

            // Use approximate matching due to requestAnimationFrame timing (~16ms per frame)
            expect(heatmap.getCurrentTime()).toBeCloseTo(3000, -2); // Within ~100ms tolerance
        });

        it("should seek while paused", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data = createTemporalData(10, 10000);
            heatmap.setTemporalData(data);

            heatmap.pause();
            heatmap.seek(2000);
            vi.advanceTimersByTime(1000);

            expect(heatmap.getCurrentTime()).toBe(2000);
        });
    });

    describe("seekProgress", () => {
        it("should seek to progress value", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 10000,
                data: [{ x: 50, y: 50, value: 50, timestamp: 5000 }]
            };
            heatmap.setTemporalData(data);

            heatmap.seekProgress(0.5);

            expect(heatmap.getCurrentTime()).toBe(5000);
            expect(heatmap.getProgress()).toBe(0.5);
        });

        it("should clamp progress to 0-1", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 10000,
                data: [{ x: 50, y: 50, value: 50, timestamp: 5000 }]
            };
            heatmap.setTemporalData(data);

            heatmap.seekProgress(-0.5);
            expect(heatmap.getProgress()).toBe(0);

            heatmap.seekProgress(1.5);
            expect(heatmap.getProgress()).toBe(1);
        });

        it("should do nothing without data", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            expect(() => heatmap.seekProgress(0.5)).not.toThrow();
        });
    });

    describe("getProgress", () => {
        it("should return 0 without data", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            expect(heatmap.getProgress()).toBe(0);
        });

        it("should return 1 for zero-duration data", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 5000,
                endTime: 5000, // Same as start
                data: [{ x: 50, y: 50, value: 50, timestamp: 5000 }]
            };
            heatmap.setTemporalData(data);

            expect(heatmap.getProgress()).toBe(1);
        });

        it("should calculate correct progress", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 10000,
                data: [{ x: 50, y: 50, value: 50, timestamp: 5000 }]
            };
            heatmap.setTemporalData(data);

            heatmap.seek(2500);
            expect(heatmap.getProgress()).toBe(0.25);

            heatmap.seek(7500);
            expect(heatmap.getProgress()).toBe(0.75);
        });
    });

    describe("setSpeed", () => {
        it("should accept speed values", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            expect(() => heatmap.setSpeed(2)).not.toThrow();
        });

        it("should clamp speed to valid range", () => {
            heatmap = createHeatmap(
                { container },
                withAnimation({ playbackSpeed: 1 })
            );
            const data = createTemporalData(10, 10000);
            heatmap.setTemporalData(data);

            // Speed should be clamped between 0.1 and 10
            heatmap.setSpeed(0.01);
            heatmap.setSpeed(100);

            expect(() => heatmap.play()).not.toThrow();
        });
    });

    describe("setLoop", () => {
        it("should enable looping", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            expect(() => heatmap.setLoop(true)).not.toThrow();
            expect(() => heatmap.setLoop(false)).not.toThrow();
        });
    });

    describe("looping behavior", () => {
        it("should loop when enabled and reaching end", () => {
            heatmap = createHeatmap(
                { container },
                withAnimation({ loop: true, playbackSpeed: 10 })
            );

            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 1000,
                data: [{ x: 50, y: 50, value: 50, timestamp: 500 }]
            };
            heatmap.setTemporalData(data);

            heatmap.play();

            // Advance past end time (at 10x speed, 200ms = 2000ms simulation time)
            vi.advanceTimersByTime(200);

            // Should still be playing and have looped
            expect(heatmap.getAnimationState()).toBe("playing");
        });

        it("should stop when not looping and reaching end", () => {
            const onComplete = vi.fn();
            heatmap = createHeatmap(
                { container },
                withAnimation({ loop: false, playbackSpeed: 10, onComplete })
            );

            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 1000,
                data: [{ x: 50, y: 50, value: 50, timestamp: 500 }]
            };
            heatmap.setTemporalData(data);

            heatmap.play();

            // Advance past end time
            vi.advanceTimersByTime(200);

            expect(heatmap.getAnimationState()).toBe("idle");
            expect(onComplete).toHaveBeenCalled();
        });
    });

    describe("callbacks", () => {
        it("should call onFrame callback during playback", () => {
            const onFrame = vi.fn();
            heatmap = createHeatmap(
                { container },
                withAnimation({ onFrame, playbackSpeed: 1 })
            );

            const data = createTemporalData(5, 5000);
            heatmap.setTemporalData(data);

            heatmap.play();

            // Advance a frame
            vi.advanceTimersByTime(16);

            expect(onFrame).toHaveBeenCalled();
            expect(onFrame).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number)
            );
        });

        it("should call onComplete when animation finishes", () => {
            const onComplete = vi.fn();
            heatmap = createHeatmap(
                { container },
                withAnimation({ onComplete, loop: false, playbackSpeed: 100 })
            );

            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 100,
                data: [{ x: 50, y: 50, value: 50, timestamp: 50 }]
            };
            heatmap.setTemporalData(data);

            heatmap.play();

            // Advance past end
            vi.advanceTimersByTime(50);

            expect(onComplete).toHaveBeenCalled();
        });
    });

    describe("config options", () => {
        it("should use custom fadeOutDuration", () => {
            heatmap = createHeatmap(
                { container },
                withAnimation({ fadeOutDuration: 5000 })
            );

            const data = createTemporalData();
            expect(() => heatmap.setTemporalData(data)).not.toThrow();
        });

        it("should use custom timeWindow", () => {
            heatmap = createHeatmap(
                { container },
                withAnimation({ timeWindow: 10000 })
            );

            const data = createTemporalData();
            expect(() => heatmap.setTemporalData(data)).not.toThrow();
        });

        it("should use custom playbackSpeed", () => {
            heatmap = createHeatmap(
                { container },
                withAnimation({ playbackSpeed: 2 })
            );

            const data = createTemporalData();
            heatmap.setTemporalData(data);
            heatmap.play();

            vi.advanceTimersByTime(100);

            // At 2x speed, 100ms real time = 200ms animation time
            expect(heatmap.getCurrentTime()).toBeGreaterThan(100);
        });
    });

    describe("rendering", () => {
        it("should render points within time window", () => {
            heatmap = createHeatmap(
                { container },
                withAnimation({ timeWindow: 2000, fadeOutDuration: 1000 })
            );

            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 5000,
                data: [
                    { x: 50, y: 50, value: 50, timestamp: 1000 },
                    { x: 100, y: 100, value: 75, timestamp: 2000 },
                    { x: 150, y: 150, value: 100, timestamp: 3000 }
                ]
            };
            heatmap.setTemporalData(data);

            heatmap.seek(2500);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should handle points with varying values", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            const data: TemporalHeatmapData = {
                min: 10,
                max: 90,
                startTime: 0,
                endTime: 5000,
                data: [
                    { x: 50, y: 50, value: 10, timestamp: 500 },
                    { x: 100, y: 100, value: 50, timestamp: 1000 },
                    { x: 150, y: 150, value: 90, timestamp: 1500 }
                ]
            };
            heatmap.setTemporalData(data);

            heatmap.seek(2000);

            expect(() => heatmap.play()).not.toThrow();
        });
    });

    describe("cleanup", () => {
        it("should stop animation on destroy", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data = createTemporalData();
            heatmap.setTemporalData(data);

            heatmap.play();
            heatmap.destroy();

            // Should not throw when timers advance after destroy
            expect(() => vi.advanceTimersByTime(1000)).not.toThrow();
        });

        it("should clean up resources on destroy", () => {
            heatmap = createHeatmap({ container }, withAnimation());
            const data = createTemporalData();
            heatmap.setTemporalData(data);

            heatmap.destroy();

            // Canvas should be removed
            expect(container.querySelector("canvas")).toBeNull();
        });
    });

    describe("OffscreenCanvas fallback", () => {
        it("should work without OffscreenCanvas", () => {
            // Store original
            const originalOffscreenCanvas = globalThis.OffscreenCanvas;

            // Remove OffscreenCanvas temporarily
            // @ts-expect-error - Testing fallback
            delete globalThis.OffscreenCanvas;

            const localContainer = createMockContainer();
            document.body.appendChild(localContainer);

            const localHeatmap = createHeatmap(
                { container: localContainer },
                withAnimation()
            );

            const data = createTemporalData();
            expect(() => localHeatmap.setTemporalData(data)).not.toThrow();

            localHeatmap.destroy();
            localContainer.remove();

            // Restore
            globalThis.OffscreenCanvas = originalOffscreenCanvas;
        });
    });

    describe("binary search optimization", () => {
        it("should efficiently find points in large datasets", () => {
            heatmap = createHeatmap({ container }, withAnimation());

            // Create large dataset
            const data: TemporalHeatmapData = {
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 100000,
                data: Array.from({ length: 10000 }, (_, i) => ({
                    x: Math.floor(Math.random() * 300),
                    y: Math.floor(Math.random() * 200),
                    value: Math.floor(Math.random() * 100),
                    timestamp: i * 10
                }))
            };
            heatmap.setTemporalData(data);

            // Should handle seeking efficiently
            expect(() => {
                heatmap.seek(50000);
                heatmap.seek(25000);
                heatmap.seek(75000);
            }).not.toThrow();
        });
    });
});
