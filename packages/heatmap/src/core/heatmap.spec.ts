import { describe, expect, it, beforeEach, afterEach } from "vitest";
import {
    createHeatmap,
    withTooltip,
    withAnimation,
    type Heatmap,
    type HeatmapPoint,
    type AnimatedHeatmap
} from "../index";

describe("createHeatmap (composable API)", () => {
    let container: HTMLDivElement;
    let heatmap: Heatmap;

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
        container?.remove();
    });

    describe("basic creation", () => {
        it("should create canvas with container dimensions", () => {
            heatmap = createHeatmap({ container });

            expect(heatmap.canvas.width).toBe(300);
            expect(heatmap.canvas.height).toBe(200);
        });

        it("should expose container reference", () => {
            heatmap = createHeatmap({ container });

            expect(heatmap.container).toBe(container);
        });

        it("should expose width and height", () => {
            heatmap = createHeatmap({ container, width: 400, height: 300 });

            expect(heatmap.width).toBe(400);
            expect(heatmap.height).toBe(300);
        });
    });

    describe("feature composition", () => {
        it("should work without any features", () => {
            heatmap = createHeatmap({ container });

            expect(heatmap.setData).toBeDefined();
            expect(heatmap.addPoint).toBeDefined();
            expect(heatmap.clear).toBeDefined();
        });

        it("should compose with tooltip feature", () => {
            heatmap = createHeatmap({ container }, withTooltip());

            expect(container.querySelector(".heatmap-tooltip")).not.toBeNull();
        });

        it("should compose with animation feature", () => {
            const animatedHeatmap = createHeatmap(
                { container },
                withAnimation()
            );

            expect(animatedHeatmap.play).toBeDefined();
            expect(animatedHeatmap.pause).toBeDefined();
            expect(animatedHeatmap.stop).toBeDefined();
        });

        it("should compose with multiple features", () => {
            const animatedHeatmap = createHeatmap(
                { container },
                withTooltip(),
                withAnimation()
            );

            // Has tooltip
            expect(container.querySelector(".heatmap-tooltip")).not.toBeNull();
            // Has animation
            expect(animatedHeatmap.play).toBeDefined();
        });

        it("should teardown features on destroy", () => {
            heatmap = createHeatmap({ container }, withTooltip());

            expect(container.querySelector(".heatmap-tooltip")).not.toBeNull();

            heatmap.destroy();

            expect(container.querySelector(".heatmap-tooltip")).toBeNull();
        });
    });

    describe("core API", () => {
        it("should set and render data", () => {
            heatmap = createHeatmap({ container, radius: 10 });
            const points: HeatmapPoint[] = [{ x: 50, y: 50, value: 100 }];

            heatmap.setData(points);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should add individual points", () => {
            heatmap = createHeatmap({ container });
            const point: HeatmapPoint = { x: 100, y: 100, value: 50 };

            heatmap.addPoint(point);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should add multiple points at once", () => {
            heatmap = createHeatmap({ container });
            const points: HeatmapPoint[] = [
                { x: 50, y: 50, value: 30 },
                { x: 100, y: 100, value: 50 },
                { x: 150, y: 150, value: 70 }
            ];

            heatmap.addPoints(points);

            expect(heatmap.getValueAt(50, 50)).toBe(30);
            expect(heatmap.getValueAt(100, 100)).toBe(50);
            expect(heatmap.getValueAt(150, 150)).toBe(70);
        });

        it("should clear all data", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 100 }]);

            heatmap.clear();

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(false);
        });

        it("should get value at position", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([
                { x: 2, y: 2, value: 30 },
                { x: 4, y: 4, value: 20 }
            ]);

            // Default aggregation is 'max', so returns the max value in the cell
            expect(heatmap.getValueAt(3, 3)).toBe(30);
        });

        it("should export as data URL", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 100 }]);

            const dataUrl = heatmap.getDataURL();

            expect(dataUrl).toMatch(/^data:image\/png;base64,/);
        });

        it("should update gradient", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 100 }]);

            expect(() =>
                heatmap.setGradient([
                    { offset: 0, color: "rgba(0, 0, 255, 0)" },
                    { offset: 1, color: "rgba(0, 0, 255, 1)" }
                ])
            ).not.toThrow();
        });
    });

    describe("type safety", () => {
        it("should return AnimatedHeatmap when animation feature is first", () => {
            const hm: AnimatedHeatmap = createHeatmap(
                { container },
                withAnimation()
            );

            expect(hm.play).toBeDefined();
            expect(hm.pause).toBeDefined();
            hm.destroy();
        });

        it("should return AnimatedHeatmap when animation feature is second", () => {
            const hm: AnimatedHeatmap = createHeatmap(
                { container },
                withTooltip(),
                withAnimation()
            );

            expect(hm.play).toBeDefined();
            expect(hm.pause).toBeDefined();
            hm.destroy();
        });
    });
});
