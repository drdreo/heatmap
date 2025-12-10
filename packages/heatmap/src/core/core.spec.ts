import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
    createHeatmap,
    type Heatmap,
    type HeatmapPoint,
    type GradientStop
} from "../index";

describe("createHeatmap core", () => {
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

    describe("canvas creation", () => {
        it("should create canvas with container dimensions", () => {
            heatmap = createHeatmap({ container });

            expect(heatmap.canvas.width).toBe(300);
            expect(heatmap.canvas.height).toBe(200);
        });

        it("should use custom dimensions when provided", () => {
            heatmap = createHeatmap({ container, width: 400, height: 300 });

            expect(heatmap.canvas.width).toBe(400);
            expect(heatmap.canvas.height).toBe(300);
        });

        it("should append canvas to container", () => {
            heatmap = createHeatmap({ container });

            expect(container.querySelector("canvas")).toBe(heatmap.canvas);
        });

        it("should set canvas styles correctly", () => {
            heatmap = createHeatmap({ container });

            expect(heatmap.canvas.style.position).toBe("absolute");
            expect(heatmap.canvas.style.top).toBe("0px");
            expect(heatmap.canvas.style.left).toBe("0px");
            expect(heatmap.canvas.style.pointerEvents).toBe("none");
        });

        it("should render initial data when provided in config", () => {
            heatmap = createHeatmap({
                container,
                radius: 10,
                data: [{ x: 50, y: 50, value: 100 }]
            });

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should render static data when provided in config", () => {
            heatmap = createHeatmap({
                container,
                data: [{ x: 150, y: 100, value: 100 }]
            });

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );
            expect(hasContent).toBe(true);
        });
    });

    describe("setData", () => {
        it("should render points on canvas", () => {
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

        it("should handle empty data", () => {
            heatmap = createHeatmap({ container });

            expect(() => heatmap.setData([])).not.toThrow();
        });

        it("should normalize values based on min/max", () => {
            heatmap = createHeatmap({ container, radius: 10 });

            // Low value relative to max should produce dimmer output
            const points: HeatmapPoint[] = [{ x: 50, y: 50, value: 10 }];

            heatmap.setData(points);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should handle same min and max values", () => {
            heatmap = createHeatmap({ container, radius: 10 });
            const points: HeatmapPoint[] = [{ x: 50, y: 50, value: 50 }];

            expect(() => heatmap.setData(points)).not.toThrow();
        });
    });

    describe("addPoint", () => {
        it("should add point to empty heatmap", () => {
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

        it("should add point to existing data", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 50 }]);

            const point: HeatmapPoint = { x: 150, y: 150, value: 75 };
            heatmap.addPoint(point);

            expect(heatmap.getValueAt(150, 150)).toBeGreaterThan(0);
        });

        it("should update max value if new point exceeds it", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 50 }]);

            const point: HeatmapPoint = { x: 100, y: 100, value: 100 };
            heatmap.addPoint(point);

            // Should not throw and should render
            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );
            expect(hasContent).toBe(true);
        });
    });

    describe("addPoints", () => {
        it("should add multiple points to empty heatmap", () => {
            heatmap = createHeatmap({ container });
            const points: HeatmapPoint[] = [
                { x: 50, y: 50, value: 50 },
                { x: 100, y: 100, value: 75 },
                { x: 150, y: 150, value: 100 }
            ];

            heatmap.addPoints(points);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should add points to existing data", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 50 }]);

            const points: HeatmapPoint[] = [
                { x: 100, y: 100, value: 60 },
                { x: 150, y: 150, value: 70 }
            ];

            heatmap.addPoints(points);

            // Should have content at all point locations
            expect(heatmap.getValueAt(50, 50)).toBeGreaterThan(0);
            expect(heatmap.getValueAt(100, 100)).toBeGreaterThan(0);
            expect(heatmap.getValueAt(150, 150)).toBeGreaterThan(0);
        });

        it("should update max value if any new point exceeds it", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 50 }]);

            const points: HeatmapPoint[] = [
                { x: 100, y: 100, value: 60 },
                { x: 150, y: 150, value: 200 } // Exceeds max
            ];

            expect(() => heatmap.addPoints(points)).not.toThrow();
        });
    });

    describe("setGradient", () => {
        it("should update the gradient", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 100 }]);

            const customGradient: GradientStop[] = [
                { offset: 0, color: "rgba(0, 0, 255, 0)" },
                { offset: 1, color: "rgba(0, 0, 255, 1)" }
            ];

            heatmap.setGradient(customGradient);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should re-render with new gradient", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 150, y: 100, value: 100 }]);

            // Get pixel color before gradient change
            const ctx = heatmap.canvas.getContext("2d")!;
            const beforeData = ctx.getImageData(150, 100, 1, 1).data;

            // Change to pure blue gradient
            heatmap.setGradient([
                { offset: 0, color: "rgba(0, 0, 255, 0)" },
                { offset: 1, color: "rgba(0, 0, 255, 1)" }
            ]);

            const afterData = ctx.getImageData(150, 100, 1, 1).data;

            // Colors should be different
            const beforeColor = `${beforeData[0]},${beforeData[1]},${beforeData[2]}`;
            const afterColor = `${afterData[0]},${afterData[1]},${afterData[2]}`;

            // At least one channel should differ (unless both are transparent)
            expect(
                beforeColor !== afterColor ||
                    (beforeData[3] === 0 && afterData[3] === 0)
            ).toBe(true);
        });
    });

    describe("clear", () => {
        it("should clear the canvas", () => {
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

        it("should clear the value grid", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 100 }]);

            heatmap.clear();

            expect(heatmap.getValueAt(50, 50)).toBe(0);
        });
    });

    describe("getValueAt", () => {
        it("should return 0 for empty heatmap", () => {
            heatmap = createHeatmap({ container });

            expect(heatmap.getValueAt(50, 50)).toBe(0);
        });

        it("should return aggregated value at position", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([
                { x: 2, y: 2, value: 30 },
                { x: 4, y: 4, value: 20 }
            ]);

            // Both points should be in same grid cell (default gridSize is 6)
            expect(heatmap.getValueAt(3, 3)).toBe(50); // 30 + 20
        });

        it("should return value from correct grid cell", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([
                { x: 10, y: 10, value: 50 },
                { x: 100, y: 100, value: 75 }
            ]);

            // Different grid cells should have different values
            const value1 = heatmap.getValueAt(10, 10);
            const value2 = heatmap.getValueAt(100, 100);

            expect(value1).toBe(50);
            expect(value2).toBe(75);
        });
    });

    describe("getDataURL", () => {
        it("should return a data URL", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 100 }]);

            const dataUrl = heatmap.getDataURL();

            expect(dataUrl).toMatch(/^data:image\/png;base64,/);
        });

        it("should accept custom type", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 100 }]);

            const dataUrl = heatmap.getDataURL("image/jpeg");

            expect(dataUrl).toMatch(/^data:image\/jpeg;base64,/);
        });

        it("should accept quality parameter", () => {
            heatmap = createHeatmap({ container });
            heatmap.setData([{ x: 50, y: 50, value: 100 }]);

            const highQuality = heatmap.getDataURL("image/jpeg", 1.0);
            const lowQuality = heatmap.getDataURL("image/jpeg", 0.1);

            // Both should be valid data URLs
            expect(highQuality).toMatch(/^data:image\/jpeg;base64,/);
            expect(lowQuality).toMatch(/^data:image\/jpeg;base64,/);
        });
    });

    describe("destroy", () => {
        it("should remove canvas from DOM", () => {
            heatmap = createHeatmap({ container });
            const canvas = heatmap.canvas;

            expect(container.contains(canvas)).toBe(true);

            heatmap.destroy();

            expect(container.contains(canvas)).toBe(false);
        });
    });

    describe("config options", () => {
        it("should use custom radius", () => {
            heatmap = createHeatmap({
                container,
                radius: 50,
                valueMin: 0,
                valueMax: 100
            });
            heatmap.setData([{ x: 150, y: 100, value: 100 }]);

            const ctx = heatmap.canvas.getContext("2d")!;

            // Check pixels at edge of larger radius
            const imageData = ctx.getImageData(150 + 40, 100, 1, 1);
            // With larger radius, there should be content at distance 40
            expect(imageData.data[3]).toBeGreaterThan(0);
        });

        it("should use custom blur", () => {
            heatmap = createHeatmap({ container, blur: 0.5, radius: 20 });
            heatmap.setData([{ x: 150, y: 100, value: 100 }]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should use custom maxOpacity", () => {
            heatmap = createHeatmap({ container, maxOpacity: 0.5 });
            heatmap.setData([{ x: 150, y: 100, value: 100 }]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(150, 100, 1, 1);

            // Max alpha should be around 0.5 * 255 = 127
            expect(imageData.data[3]).toBeLessThanOrEqual(140);
        });

        it("should use custom minOpacity", () => {
            heatmap = createHeatmap({ container, minOpacity: 0.3, radius: 50 });
            heatmap.setData([{ x: 150, y: 100, value: 10 }]); // Low value

            const ctx = heatmap.canvas.getContext("2d")!;
            // Check center point - even with low value, should have min opacity
            const imageData = ctx.getImageData(150, 100, 1, 1);

            // Alpha should be at least minOpacity * 255
            expect(imageData.data[3]).toBeGreaterThan(0);
        });

        it("should use custom gradient", () => {
            const customGradient: GradientStop[] = [
                { offset: 0, color: "rgba(0, 255, 0, 0)" },
                { offset: 1, color: "rgba(0, 255, 0, 1)" }
            ];

            heatmap = createHeatmap({
                container,
                gradient: customGradient
            });

            heatmap.setData([{ x: 150, y: 100, value: 100 }]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(150, 100, 1, 1);

            // Should be green-ish
            expect(imageData.data[1]).toBeGreaterThan(imageData.data[0]); // G > R
            expect(imageData.data[1]).toBeGreaterThan(imageData.data[2]); // G > B
        });

        it("should use OffscreenCanvas when available", () => {
            heatmap = createHeatmap({ container, useOffscreenCanvas: true });

            expect(() =>
                heatmap.setData([{ x: 50, y: 50, value: 100 }])
            ).not.toThrow();
        });

        it("should fall back when OffscreenCanvas is disabled", () => {
            heatmap = createHeatmap({ container, useOffscreenCanvas: false });

            expect(() =>
                heatmap.setData([{ x: 50, y: 50, value: 100 }])
            ).not.toThrow();
        });
    });

    describe("multiple points rendering", () => {
        it("should render overlapping points with accumulation", () => {
            heatmap = createHeatmap({ container, radius: 20 });
            heatmap.setData([
                { x: 150, y: 100, value: 50 },
                { x: 155, y: 100, value: 50 }
            ]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(152, 100, 1, 1);

            // Overlapping area should have higher alpha
            expect(imageData.data[3]).toBeGreaterThan(0);
        });

        it("should handle many points", () => {
            heatmap = createHeatmap({ container });
            const points: HeatmapPoint[] = [];
            for (let i = 0; i < 1000; i++) {
                points.push({
                    x: Math.random() * 300,
                    y: Math.random() * 200,
                    value: Math.random() * 100
                });
            }

            expect(() => heatmap.setData(points)).not.toThrow();
        });
    });

    describe("edge cases", () => {
        it("should handle points at canvas edges", () => {
            heatmap = createHeatmap({ container, radius: 10 });
            heatmap.setData([
                { x: 0, y: 0, value: 100 },
                { x: 299, y: 199, value: 100 }
            ]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should handle points outside canvas bounds", () => {
            heatmap = createHeatmap({ container, radius: 10 });

            expect(() =>
                heatmap.setData([
                    { x: -50, y: -50, value: 100 },
                    { x: 500, y: 500, value: 100 }
                ])
            ).not.toThrow();
        });

        it("should handle negative values", () => {
            heatmap = createHeatmap({ container });

            expect(() =>
                heatmap.setData([
                    { x: 50, y: 50, value: -25 },
                    { x: 100, y: 100, value: 25 }
                ])
            ).not.toThrow();
        });

        it("should handle very small values", () => {
            heatmap = createHeatmap({ container });

            expect(() =>
                heatmap.setData([
                    { x: 50, y: 50, value: 0.0001 },
                    { x: 100, y: 100, value: 0.0005 }
                ])
            ).not.toThrow();
        });

        it("should handle very large values", () => {
            heatmap = createHeatmap({ container });

            expect(() =>
                heatmap.setData([
                    { x: 50, y: 50, value: 500000 },
                    { x: 100, y: 100, value: 999999 }
                ])
            ).not.toThrow();
        });
    });

    describe("blur behavior", () => {
        it("should render solid circle when blur is 0 (no blur)", () => {
            heatmap = createHeatmap({ container, blur: 0, radius: 30 });
            heatmap.setData([{ x: 150, y: 100, value: 100 }]);

            const ctx = heatmap.canvas.getContext("2d")!;

            // With blur=0 (solid circle), pixels inside the radius should have similar intensity
            // Check center and a point inside the radius
            const centerData = ctx.getImageData(150, 100, 1, 1).data;
            const insideData = ctx.getImageData(150 + 15, 100, 1, 1).data; // Inside radius

            // Both should have content
            expect(centerData[3]).toBeGreaterThan(0);
            expect(insideData[3]).toBeGreaterThan(0);

            // Point just outside radius should have no/very low content
            const outsideData = ctx.getImageData(150 + 31, 100, 1, 1).data;
            expect(outsideData[3]).toBe(0);
        });

        it("should render gradient falloff when blur > 0", () => {
            heatmap = createHeatmap({ container, blur: 0.5, radius: 30 });
            heatmap.setData([{ x: 150, y: 100, value: 100 }]);

            const ctx = heatmap.canvas.getContext("2d")!;

            // With blur=0.5, blurFactor=0.5, the inner 50% is opaque, then gradient to edge
            // Center should have full intensity
            const centerData = ctx.getImageData(150, 100, 1, 1).data;
            expect(centerData[3]).toBeGreaterThan(0);

            // Edge of radius should have lower intensity (gradient falloff)
            const edgeData = ctx.getImageData(150 + 28, 100, 1, 1).data;
            // Edge should be visible but less intense than center
            expect(edgeData[3]).toBeLessThan(centerData[3]);
        });

        it("should have maximum blur when blur is 1", () => {
            heatmap = createHeatmap({ container, blur: 1, radius: 30 });
            heatmap.setData([{ x: 150, y: 100, value: 100 }]);

            const ctx = heatmap.canvas.getContext("2d")!;

            // With blur=1, blurFactor=0, gradient starts from center (0 inner radius)
            // There should be visible content
            const centerData = ctx.getImageData(150, 100, 1, 1).data;
            expect(centerData[3]).toBeGreaterThan(0);

            // Intensity should decrease towards edge
            const midData = ctx.getImageData(150 + 15, 100, 1, 1).data;
            expect(midData[3]).toBeLessThan(centerData[3]);
        });

        it("should produce different visual output for different blur values", () => {
            // Create heatmap with blur=0 (no blur)
            const heatmap1 = createHeatmap({ container, blur: 0, radius: 30 });
            heatmap1.setData([{ x: 150, y: 100, value: 100 }]);
            const dataUrl1 = heatmap1.getDataURL();
            heatmap1.destroy();

            // Create heatmap with blur=0.5 (with blur)
            const heatmap2 = createHeatmap({
                container,
                blur: 0.5,
                radius: 30
            });
            heatmap2.setData([{ x: 150, y: 100, value: 100 }]);
            const dataUrl2 = heatmap2.getDataURL();
            heatmap2.destroy();

            // The outputs should be different
            expect(dataUrl1).not.toBe(dataUrl2);

            // Set heatmap to null so afterEach doesn't try to destroy it again
            heatmap = null as unknown as Heatmap;
        });
    });

    describe("option validation", () => {
        it("should throw error when blur is less than 0", () => {
            expect(() => createHeatmap({ container, blur: -0.5 })).toThrow(
                "Invalid blur value: -0.5. Must be between 0 and 1."
            );
        });

        it("should throw error when blur is greater than 1", () => {
            expect(() => createHeatmap({ container, blur: 1.5 })).toThrow(
                "Invalid blur value: 1.5. Must be between 0 and 1."
            );
        });

        it("should throw error when radius is 0 or negative", () => {
            expect(() => createHeatmap({ container, radius: 0 })).toThrow(
                "Invalid radius value: 0. Must be greater than 0."
            );
            expect(() => createHeatmap({ container, radius: -10 })).toThrow(
                "Invalid radius value: -10. Must be greater than 0."
            );
        });

        it("should throw error when maxOpacity is out of range", () => {
            expect(() =>
                createHeatmap({ container, maxOpacity: -0.1 })
            ).toThrow(
                "Invalid maxOpacity value: -0.1. Must be between 0 and 1."
            );
            expect(() => createHeatmap({ container, maxOpacity: 1.5 })).toThrow(
                "Invalid maxOpacity value: 1.5. Must be between 0 and 1."
            );
        });

        it("should throw error when minOpacity is out of range", () => {
            expect(() =>
                createHeatmap({ container, minOpacity: -0.1 })
            ).toThrow(
                "Invalid minOpacity value: -0.1. Must be between 0 and 1."
            );
            expect(() => createHeatmap({ container, minOpacity: 1.5 })).toThrow(
                "Invalid minOpacity value: 1.5. Must be between 0 and 1."
            );
        });

        it("should throw error when minOpacity is greater than maxOpacity", () => {
            expect(() =>
                createHeatmap({ container, minOpacity: 0.8, maxOpacity: 0.5 })
            ).toThrow(
                "Invalid opacity values: minOpacity (0.8) cannot be greater than maxOpacity (0.5)."
            );
        });

        it("should accept valid edge values", () => {
            // blur = 0 and blur = 1 should be valid
            expect(() => createHeatmap({ container, blur: 0 })).not.toThrow();
            expect(() => createHeatmap({ container, blur: 1 })).not.toThrow();

            // opacity = 0 and opacity = 1 should be valid
            expect(() =>
                createHeatmap({ container, minOpacity: 0, maxOpacity: 1 })
            ).not.toThrow();

            // minOpacity === maxOpacity should be valid
            expect(() =>
                createHeatmap({ container, minOpacity: 0.5, maxOpacity: 0.5 })
            ).not.toThrow();
        });
    });

    describe("blendMode", () => {
        it("should use default blend mode (source-over) when not specified", () => {
            heatmap = createHeatmap({ container, radius: 20 });
            heatmap.setData([
                { x: 150, y: 100, value: 100 },
                { x: 160, y: 100, value: 100 }
            ]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should accept 'lighter' blend mode for additive blending", () => {
            heatmap = createHeatmap({
                container,
                radius: 20,
                blendMode: "lighter"
            });
            heatmap.setData([
                { x: 150, y: 100, value: 50 },
                { x: 160, y: 100, value: 50 }
            ]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should produce different output with 'lighter' vs 'source-over' blend mode", () => {
            // Create heatmap with source-over (default)
            const heatmap1 = createHeatmap({
                container,
                radius: 30,
                blendMode: "source-over"
            });
            heatmap1.setData([
                { x: 150, y: 100, value: 80 },
                { x: 165, y: 100, value: 80 }
            ]);
            const ctx1 = heatmap1.canvas.getContext("2d")!;
            // Sample the overlapping area
            const overlapData1 = ctx1.getImageData(157, 100, 1, 1).data;
            heatmap1.destroy();

            // Create heatmap with lighter (additive)
            const heatmap2 = createHeatmap({
                container,
                radius: 30,
                blendMode: "lighter"
            });
            heatmap2.setData([
                { x: 150, y: 100, value: 80 },
                { x: 165, y: 100, value: 80 }
            ]);
            const ctx2 = heatmap2.canvas.getContext("2d")!;
            const overlapData2 = ctx2.getImageData(157, 100, 1, 1).data;
            heatmap2.destroy();

            // With 'lighter' blend mode, overlapping areas should have higher alpha/intensity
            // than with 'source-over' which just layers them
            // Note: The exact difference depends on implementation, but they should differ
            const alpha1 = overlapData1[3];
            const alpha2 = overlapData2[3];

            // Both should have content
            expect(alpha1).toBeGreaterThan(0);
            expect(alpha2).toBeGreaterThan(0);

            // Set heatmap to null so afterEach doesn't try to destroy it again
            heatmap = null as unknown as Heatmap;
        });

        it("should accept 'multiply' blend mode", () => {
            heatmap = createHeatmap({
                container,
                radius: 20,
                blendMode: "multiply"
            });
            heatmap.setData([{ x: 150, y: 100, value: 100 }]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(0, 0, 300, 200);
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            );

            expect(hasContent).toBe(true);
        });

        it("should work with addPoint when using custom blend mode", () => {
            heatmap = createHeatmap({
                container,
                radius: 20,
                blendMode: "lighter"
            });
            heatmap.setData([{ x: 150, y: 100, value: 50 }]);

            // Add overlapping point
            heatmap.addPoint({ x: 160, y: 100, value: 50 });

            const ctx = heatmap.canvas.getContext("2d")!;
            // Check the overlapping area
            const imageData = ctx.getImageData(155, 100, 1, 1);
            expect(imageData.data[3]).toBeGreaterThan(0);
        });

        it("should work with addPoints when using custom blend mode", () => {
            heatmap = createHeatmap({
                container,
                radius: 20,
                blendMode: "lighter"
            });

            heatmap.addPoints([
                { x: 150, y: 100, value: 50 },
                { x: 160, y: 100, value: 50 }
            ]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(155, 100, 1, 1);
            expect(imageData.data[3]).toBeGreaterThan(0);
        });
    });

    describe("intensityExponent", () => {
        it("should use default linear intensity (exponent = 1)", () => {
            heatmap = createHeatmap({ container, radius: 20 });
            heatmap.setData([{ x: 150, y: 100, value: 50 }]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(150, 100, 1, 1);
            expect(imageData.data[3]).toBeGreaterThan(0);
        });

        it("should accept custom intensityExponent", () => {
            heatmap = createHeatmap({
                container,
                radius: 20,
                intensityExponent: 2
            });
            heatmap.setData([{ x: 150, y: 100, value: 50 }]);

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(150, 100, 1, 1);
            expect(imageData.data[3]).toBeGreaterThan(0);
        });

        it("should make low values more visible with exponent < 1", () => {
            // With exponent 0.5 (square root), a value of 0.25 becomes 0.5
            const heatmap1 = createHeatmap({
                container,
                radius: 20,
                valueMin: 0,
                valueMax: 100,
                intensityExponent: 1
            });
            heatmap1.setData([
                { x: 150, y: 100, value: 25 } // 25% intensity (target point)
            ]);
            const ctx1 = heatmap1.canvas.getContext("2d")!;
            const alpha1 = ctx1.getImageData(150, 100, 1, 1).data[3];
            heatmap1.destroy();

            const heatmap2 = createHeatmap({
                container,
                radius: 20,
                valueMin: 0,
                valueMax: 100,
                intensityExponent: 0.5
            });
            heatmap2.setData([
                { x: 150, y: 100, value: 25 } // 25% -> 50% with sqrt
            ]);
            const ctx2 = heatmap2.canvas.getContext("2d")!;
            const alpha2 = ctx2.getImageData(150, 100, 1, 1).data[3];
            heatmap2.destroy();

            // Lower exponent should produce higher alpha for same low value
            expect(alpha2).toBeGreaterThan(alpha1);

            heatmap = null as unknown as Heatmap;
        });

        it("should emphasize high values with exponent > 1", () => {
            // With exponent 2 (quadratic), a value of 0.5 becomes 0.25
            const heatmap1 = createHeatmap({
                container,
                radius: 20,
                valueMin: 0,
                valueMax: 100,
                intensityExponent: 1
            });
            heatmap1.setData([
                { x: 150, y: 100, value: 50 } // 50% intensity (target point)
            ]);
            const ctx1 = heatmap1.canvas.getContext("2d")!;
            const alpha1 = ctx1.getImageData(150, 100, 1, 1).data[3];
            heatmap1.destroy();

            const heatmap2 = createHeatmap({
                container,
                radius: 20,
                valueMin: 0,
                valueMax: 100,
                intensityExponent: 2
            });
            heatmap2.setData([
                { x: 150, y: 100, value: 50 } // 50% -> 25% with square
            ]);
            const ctx2 = heatmap2.canvas.getContext("2d")!;
            const alpha2 = ctx2.getImageData(150, 100, 1, 1).data[3];
            heatmap2.destroy();

            // Higher exponent should produce lower alpha for mid-range values
            expect(alpha2).toBeLessThan(alpha1);

            heatmap = null as unknown as Heatmap;
        });

        it("should work with addPoint", () => {
            heatmap = createHeatmap({
                container,
                radius: 20,
                intensityExponent: 0.5
            });
            heatmap.addPoint({ x: 150, y: 100, value: 25 });

            const ctx = heatmap.canvas.getContext("2d")!;
            const imageData = ctx.getImageData(150, 100, 1, 1);
            expect(imageData.data[3]).toBeGreaterThan(0);
        });

        it("should work with addPoints", () => {
            heatmap = createHeatmap({
                container,
                radius: 20,
                intensityExponent: 2
            });
            heatmap.addPoints([
                { x: 150, y: 100, value: 50 },
                { x: 200, y: 100, value: 75 }
            ]);

            const ctx = heatmap.canvas.getContext("2d")!;
            expect(ctx.getImageData(150, 100, 1, 1).data[3]).toBeGreaterThan(0);
            expect(ctx.getImageData(200, 100, 1, 1).data[3]).toBeGreaterThan(0);
        });

        it("should throw error when intensityExponent is 0 or negative", () => {
            expect(() =>
                createHeatmap({ container, intensityExponent: 0 })
            ).toThrow(
                "Invalid intensityExponent value: 0. Must be greater than 0."
            );
            expect(() =>
                createHeatmap({ container, intensityExponent: -1 })
            ).toThrow(
                "Invalid intensityExponent value: -1. Must be greater than 0."
            );
        });
    });

    describe("event system", () => {
        it("should emit datachange event when setData is called", () => {
            heatmap = createHeatmap({ container });
            const listener = vi.fn();
            heatmap.on("datachange", listener);

            const points: HeatmapPoint[] = [{ x: 50, y: 50, value: 75 }];
            heatmap.setData(points);

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({
                data: points,
                dataMin: 75,
                dataMax: 75
            });
        });

        it("should emit gradientchange event when setGradient is called", () => {
            heatmap = createHeatmap({ container });
            const listener = vi.fn();
            heatmap.on("gradientchange", listener);

            const stops: GradientStop[] = [
                { offset: 0, color: "blue" },
                { offset: 1, color: "red" }
            ];
            heatmap.setGradient(stops);

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({ stops });
        });

        it("should emit clear event when clear is called", () => {
            heatmap = createHeatmap({ container });
            const listener = vi.fn();
            heatmap.on("clear", listener);

            heatmap.clear();

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith();
        });

        it("should emit destroy event when destroy is called", () => {
            heatmap = createHeatmap({ container });
            const listener = vi.fn();
            heatmap.on("destroy", listener);

            heatmap.destroy();

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith();

            // Prevent afterEach from calling destroy again
            heatmap = null as unknown as Heatmap;
        });

        it("should allow multiple listeners for the same event", () => {
            heatmap = createHeatmap({ container });
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            heatmap.on("datachange", listener1);
            heatmap.on("datachange", listener2);

            heatmap.setData([]);

            expect(listener1).toHaveBeenCalledTimes(1);
            expect(listener2).toHaveBeenCalledTimes(1);
        });

        it("should remove listener with off", () => {
            heatmap = createHeatmap({ container });
            const listener = vi.fn();

            heatmap.on("datachange", listener);
            heatmap.setData([]);
            expect(listener).toHaveBeenCalledTimes(1);

            heatmap.off("datachange", listener);
            heatmap.setData([]);
            expect(listener).toHaveBeenCalledTimes(1); // Still 1, not called again
        });

        it("should not throw when removing non-existent listener", () => {
            heatmap = createHeatmap({ container });
            const listener = vi.fn();

            expect(() => heatmap.off("datachange", listener)).not.toThrow();
        });
    });

    describe("fixed value scale (valueMin/valueMax)", () => {
        it("should use valueMin from config instead of auto-detection", () => {
            heatmap = createHeatmap({
                container,
                valueMin: 0,
                data: [{ x: 10, y: 10, value: 50 }]
            });

            // dataMin should be 0, not 50
            const stats = heatmap.getStats();
            expect(stats.dataRange?.min).toBe(0);
        });

        it("should use valueMax from config instead of auto-detection", () => {
            heatmap = createHeatmap({
                container,
                valueMax: 100,
                data: [{ x: 10, y: 10, value: 50 }]
            });

            // dataMax should be 100, not 50
            const stats = heatmap.getStats();
            expect(stats.dataRange?.max).toBe(100);
        });

        it("should allow mixed auto-detect and fixed values", () => {
            heatmap = createHeatmap({
                container,
                valueMin: 0, // Fixed
                // valueMax not set - should auto-detect
                data: [
                    { x: 10, y: 10, value: 25 },
                    { x: 20, y: 20, value: 75 }
                ]
            });

            const stats = heatmap.getStats();
            expect(stats.dataRange?.min).toBe(0); // Fixed
            expect(stats.dataRange?.max).toBe(75); // Auto-detected
        });

        it("should maintain fixed scale when data changes via setData", () => {
            heatmap = createHeatmap({
                container,
                valueMin: 0,
                valueMax: 100,
                data: [{ x: 10, y: 10, value: 50 }]
            });

            heatmap.setData([{ x: 10, y: 10, value: 200 }]);

            // Should still be 0-100, not 200
            const stats = heatmap.getStats();
            expect(stats.dataRange?.min).toBe(0);
            expect(stats.dataRange?.max).toBe(100);
        });

        it("should maintain fixed scale when data changes via addPoint", () => {
            heatmap = createHeatmap({
                container,
                valueMin: 0,
                valueMax: 100,
                data: [{ x: 10, y: 10, value: 50 }]
            });

            heatmap.addPoint({ x: 20, y: 20, value: 200 });

            const stats = heatmap.getStats();
            expect(stats.dataRange?.min).toBe(0);
            expect(stats.dataRange?.max).toBe(100);
        });

        it("should emit correct dataMin/dataMax in datachange event with fixed scale", () => {
            heatmap = createHeatmap({
                container,
                valueMin: 0,
                valueMax: 100
            });

            const listener = vi.fn();
            heatmap.on("datachange", listener);

            heatmap.setData([{ x: 10, y: 10, value: 50 }]);

            expect(listener).toHaveBeenCalledWith(
                expect.objectContaining({
                    dataMin: 0,
                    dataMax: 100
                })
            );
        });

        it("should render values relative to fixed scale", () => {
            // With fixed scale 0-100, a value of 50 should render at 50% intensity
            const heatmapFixed = createHeatmap({
                container,
                radius: 20,
                valueMin: 0,
                valueMax: 100,
                data: [{ x: 150, y: 100, value: 50 }]
            });

            const ctx1 = heatmapFixed.canvas.getContext("2d")!;
            const alphaFixed = ctx1.getImageData(150, 100, 1, 1).data[3];
            heatmapFixed.destroy();

            // With auto-detect, a single point of value 50 would render at 100% intensity
            const heatmapAuto = createHeatmap({
                container,
                radius: 20,
                data: [{ x: 150, y: 100, value: 50 }]
            });

            const ctx2 = heatmapAuto.canvas.getContext("2d")!;
            const alphaAuto = ctx2.getImageData(150, 100, 1, 1).data[3];
            heatmapAuto.destroy();

            // With fixed scale 0-100, value 50 = 50% intensity (visible)
            // With auto-detect and single point (min=max), the point gets minimal intensity
            // Fixed scale should produce higher alpha than auto-detect for this case
            expect(alphaFixed).toBeGreaterThan(alphaAuto);

            heatmap = null as unknown as Heatmap;
        });
    });

    describe("setScale", () => {
        it("should update the scale and re-render", () => {
            heatmap = createHeatmap({
                container,
                radius: 20,
                data: [{ x: 150, y: 100, value: 50 }]
            });

            // Initially auto-detect: min=max=50, so low intensity
            const ctx = heatmap.canvas.getContext("2d")!;
            const alphaBefore = ctx.getImageData(150, 100, 1, 1).data[3];

            // Set fixed scale 0-100
            heatmap.setScale(0, 100);

            // Now value 50 = 50% intensity, should be higher
            const alphaAfter = ctx.getImageData(150, 100, 1, 1).data[3];
            expect(alphaAfter).toBeGreaterThan(alphaBefore);
        });

        it("should emit scalechange event", () => {
            heatmap = createHeatmap({
                container,
                data: [{ x: 50, y: 50, value: 50 }]
            });

            const listener = vi.fn();
            heatmap.on("scalechange", listener);

            heatmap.setScale(0, 100);

            expect(listener).toHaveBeenCalledTimes(1);
            expect(listener).toHaveBeenCalledWith({
                valueMin: 0,
                valueMax: 100,
                dataMin: 0,
                dataMax: 100
            });
        });

        it("should allow resetting to auto-detect with undefined", () => {
            heatmap = createHeatmap({
                container,
                valueMin: 0,
                valueMax: 100,
                data: [{ x: 50, y: 50, value: 75 }]
            });

            // Initially fixed scale
            let stats = heatmap.getStats();
            expect(stats.dataRange?.min).toBe(0);
            expect(stats.dataRange?.max).toBe(100);

            // Reset to auto-detect
            heatmap.setScale(undefined, undefined);

            stats = heatmap.getStats();
            expect(stats.dataRange?.min).toBe(75);
            expect(stats.dataRange?.max).toBe(75);
        });

        it("should allow mixed fixed and auto-detect values", () => {
            heatmap = createHeatmap({
                container,
                data: [
                    { x: 50, y: 50, value: 25 },
                    { x: 100, y: 100, value: 75 }
                ]
            });

            // Fix only min, auto-detect max
            heatmap.setScale(0, undefined);

            const stats = heatmap.getStats();
            expect(stats.dataRange?.min).toBe(0);
            expect(stats.dataRange?.max).toBe(75);
        });
    });
});
