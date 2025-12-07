import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
    createHeatmap,
    withWebGLRenderer,
    isWebGLAvailable,
    type Heatmap
} from "../index";

describe("WebGL Renderer", () => {
    let container: HTMLDivElement;
    let heatmap: Heatmap | null;

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

    beforeEach(() => {
        container = createMockContainer();
        document.body.appendChild(container);
    });

    afterEach(() => {
        heatmap?.destroy();
        heatmap = null;
        container?.remove();
    });

    describe("isWebGLAvailable", () => {
        it("should return true in browser environment with WebGL support", () => {
            // Modern browsers support WebGL
            expect(isWebGLAvailable()).toBe(true);
        });
    });

    describe("withWebGLRenderer", () => {
        it("should create a heatmap with WebGL renderer", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());

            expect(heatmap.canvas).toBeInstanceOf(HTMLCanvasElement);
            expect(heatmap.canvas.width).toBe(300);
            expect(heatmap.canvas.height).toBe(200);
        });

        it("should render initial data", () => {
            heatmap = createHeatmap(
                {
                    container,
                    radius: 20,
                    data: {
                        min: 0,
                        max: 100,
                        data: [{ x: 150, y: 100, value: 100 }]
                    }
                },
                withWebGLRenderer()
            );

            // WebGL canvas - we can check the canvas exists and has correct dimensions
            expect(heatmap.canvas.width).toBe(300);
            expect(heatmap.canvas.height).toBe(200);
        });

        it("should work with setData", () => {
            heatmap = createHeatmap(
                { container, radius: 20 },
                withWebGLRenderer()
            );

            expect(() =>
                heatmap!.setData({
                    min: 0,
                    max: 100,
                    data: [{ x: 150, y: 100, value: 100 }]
                })
            ).not.toThrow();
        });

        it("should work with addPoint", () => {
            heatmap = createHeatmap(
                { container, radius: 20 },
                withWebGLRenderer()
            );

            expect(() =>
                heatmap!.addPoint({ x: 150, y: 100, value: 100 })
            ).not.toThrow();
        });

        it("should work with addPoints", () => {
            heatmap = createHeatmap(
                { container, radius: 20 },
                withWebGLRenderer()
            );

            expect(() =>
                heatmap!.addPoints([
                    { x: 150, y: 100, value: 100 },
                    { x: 200, y: 100, value: 50 }
                ])
            ).not.toThrow();
        });

        it("should work with setGradient", () => {
            heatmap = createHeatmap(
                {
                    container,
                    radius: 20,
                    data: {
                        min: 0,
                        max: 100,
                        data: [{ x: 150, y: 100, value: 100 }]
                    }
                },
                withWebGLRenderer()
            );

            expect(() =>
                heatmap!.setGradient([
                    { offset: 0, color: "rgba(0, 0, 255, 0)" },
                    { offset: 1, color: "rgba(0, 0, 255, 1)" }
                ])
            ).not.toThrow();
        });

        it("should work with clear", () => {
            heatmap = createHeatmap(
                {
                    container,
                    radius: 20,
                    data: {
                        min: 0,
                        max: 100,
                        data: [{ x: 150, y: 100, value: 100 }]
                    }
                },
                withWebGLRenderer()
            );

            expect(() => heatmap!.clear()).not.toThrow();
        });

        it("should append canvas to container", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());

            expect(container.querySelector("canvas")).toBe(heatmap.canvas);
        });

        it("should set canvas styles correctly", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());

            expect(heatmap.canvas.style.position).toBe("absolute");
            expect(heatmap.canvas.style.top).toBe("0px");
            expect(heatmap.canvas.style.left).toBe("0px");
            expect(heatmap.canvas.style.pointerEvents).toBe("none");
        });

        it("should accept antialias option", () => {
            heatmap = createHeatmap(
                { container },
                withWebGLRenderer({ antialias: false })
            );

            expect(heatmap.canvas).toBeInstanceOf(HTMLCanvasElement);
        });

        it("should use custom dimensions when provided", () => {
            heatmap = createHeatmap(
                { container, width: 400, height: 300 },
                withWebGLRenderer()
            );

            expect(heatmap.canvas.width).toBe(400);
            expect(heatmap.canvas.height).toBe(300);
        });
    });

    describe("integration with other features", () => {
        it("should work with withAnimation feature", async () => {
            const animationModule = await import("../features/animation");
            const { withAnimation } = animationModule;
            type AnimatedHeatmap = animationModule.AnimatedHeatmap;

            heatmap = createHeatmap(
                { container, radius: 20 },
                withWebGLRenderer(),
                withAnimation()
            );

            const animatedHeatmap = heatmap as unknown as AnimatedHeatmap;

            // Animation feature adds animation control methods
            expect(typeof animatedHeatmap.play).toBe("function");
            expect(typeof animatedHeatmap.pause).toBe("function");
            expect(typeof animatedHeatmap.seek).toBe("function");
            expect(typeof animatedHeatmap.getAnimationState).toBe("function");

            // Set temporal data
            animatedHeatmap.setTemporalData({
                min: 0,
                max: 100,
                startTime: 0,
                endTime: 1000,
                data: [
                    { x: 150, y: 100, value: 100, timestamp: 0 },
                    { x: 200, y: 100, value: 100, timestamp: 1000 }
                ]
            });

            // Should be able to seek
            expect(() => animatedHeatmap.seek(0)).not.toThrow();
            expect(() => animatedHeatmap.seek(500)).not.toThrow();
        });

        it("should work with withTooltip feature", async () => {
            const { withTooltip } = await import("../features/tooltip");

            heatmap = createHeatmap(
                { container, radius: 20 },
                withWebGLRenderer(),
                withTooltip()
            );

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 150, y: 100, value: 75 }]
            });

            // Should be able to get value
            expect(heatmap.getValueAt(150, 100)).toBe(75);
        });

        it("should work with withLegend feature", async () => {
            const { withLegend } = await import("../features/legend");

            heatmap = createHeatmap(
                {
                    container,
                    radius: 20,
                    data: {
                        min: 0,
                        max: 100,
                        data: [{ x: 150, y: 100, value: 100 }]
                    }
                },
                withWebGLRenderer(),
                withLegend({ position: "bottom-right" })
            );

            // Should render without errors
            expect(heatmap.canvas).toBeInstanceOf(HTMLCanvasElement);
        });
    });

    describe("renderer interface compliance", () => {
        it("should expose renderer property on heatmap", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());

            expect(heatmap.renderer).toBeDefined();
            expect(heatmap.renderer.canvas).toBe(heatmap.canvas);
            expect(heatmap.renderer.palette).toBeInstanceOf(Uint8ClampedArray);
            expect(heatmap.renderer.opacityLUT).toBeInstanceOf(
                Uint8ClampedArray
            );
            expect(typeof heatmap.renderer.clear).toBe("function");
            expect(typeof heatmap.renderer.drawPoints).toBe("function");
            expect(typeof heatmap.renderer.colorize).toBe("function");
            expect(typeof heatmap.renderer.render).toBe("function");
            expect(typeof heatmap.renderer.setPalette).toBe("function");
            expect(typeof heatmap.renderer.dispose).toBe("function");
        });

        it("should have correct width and height on renderer", () => {
            heatmap = createHeatmap(
                { container, width: 400, height: 300 },
                withWebGLRenderer()
            );

            expect(heatmap.renderer.width).toBe(400);
            expect(heatmap.renderer.height).toBe(300);
        });

        it("should have palette of correct size (256 * 4 = 1024 bytes)", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());

            expect(heatmap.renderer.palette.length).toBe(256 * 4);
        });

        it("should have opacityLUT of correct size (256 bytes)", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());

            expect(heatmap.renderer.opacityLUT.length).toBe(256);
        });
    });

    describe("WebGL context", () => {
        it("should create WebGL context on canvas", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());

            // The canvas should have a WebGL context (not 2D)
            // We can verify by checking that getContext('webgl') returns the existing context
            const gl = heatmap.canvas.getContext("webgl");
            expect(gl).not.toBeNull();
        });

        it("should handle multiple renders without errors", () => {
            heatmap = createHeatmap(
                { container, radius: 20 },
                withWebGLRenderer()
            );

            // Multiple setData calls
            for (let i = 0; i < 10; i++) {
                expect(() =>
                    heatmap!.setData({
                        min: 0,
                        max: 100,
                        data: [{ x: 150, y: 100, value: i * 10 }]
                    })
                ).not.toThrow();
            }
        });

        it("should handle many points efficiently", () => {
            heatmap = createHeatmap(
                { container, radius: 10 },
                withWebGLRenderer()
            );

            const points = [];
            for (let i = 0; i < 1000; i++) {
                points.push({
                    x: Math.random() * 300,
                    y: Math.random() * 200,
                    value: Math.random() * 100
                });
            }

            expect(() =>
                heatmap!.setData({
                    min: 0,
                    max: 100,
                    data: points
                })
            ).not.toThrow();
        });
    });

    describe("cleanup", () => {
        it("should cleanup WebGL resources on destroy", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());

            const canvas = heatmap.canvas;
            expect(container.contains(canvas)).toBe(true);

            heatmap.destroy();
            heatmap = null;

            expect(container.contains(canvas)).toBe(false);
        });

        it("should allow creating new heatmap after destroying previous one", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());
            heatmap.destroy();
            heatmap = null;

            // Create a new one
            heatmap = createHeatmap({ container }, withWebGLRenderer());
            expect(heatmap.canvas).toBeInstanceOf(HTMLCanvasElement);
        });
    });

    describe("edge cases", () => {
        it("should handle empty data", () => {
            heatmap = createHeatmap({ container }, withWebGLRenderer());

            expect(() =>
                heatmap!.setData({ min: 0, max: 100, data: [] })
            ).not.toThrow();
        });

        it("should handle points at canvas edges", () => {
            heatmap = createHeatmap(
                { container, radius: 10 },
                withWebGLRenderer()
            );

            expect(() =>
                heatmap!.setData({
                    min: 0,
                    max: 100,
                    data: [
                        { x: 0, y: 0, value: 100 },
                        { x: 299, y: 199, value: 100 }
                    ]
                })
            ).not.toThrow();
        });

        it("should handle points outside canvas bounds", () => {
            heatmap = createHeatmap(
                { container, radius: 10 },
                withWebGLRenderer()
            );

            expect(() =>
                heatmap!.setData({
                    min: 0,
                    max: 100,
                    data: [
                        { x: -50, y: -50, value: 100 },
                        { x: 500, y: 500, value: 100 }
                    ]
                })
            ).not.toThrow();
        });

        it("should handle same min and max values", () => {
            heatmap = createHeatmap(
                { container, radius: 10 },
                withWebGLRenderer()
            );

            expect(() =>
                heatmap!.setData({
                    min: 50,
                    max: 50,
                    data: [{ x: 150, y: 100, value: 50 }]
                })
            ).not.toThrow();
        });
    });
});
