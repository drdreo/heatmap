import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import {
    createHeatmap,
    withLegend,
    withTooltip,
    GRADIENT_THERMAL,
    type Heatmap
} from "../index";

describe("withLegend feature", () => {
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

    const findLegend = (selector = ".heatmap-legend") =>
        container.querySelector(selector);

    const findGradientContainer = () =>
        container.querySelector(".heatmap-legend__gradient-container");

    const findLabelsContainer = () =>
        container.querySelector(".heatmap-legend__labels");

    const findGradientCanvas = () =>
        container.querySelector(".heatmap-legend__gradient");

    const getLabels = (): string[] => {
        const labelsContainer = findLabelsContainer();
        if (!labelsContainer) return [];
        return Array.from(labelsContainer.querySelectorAll("span")).map(
            (span) => span.textContent || ""
        );
    };

    beforeEach(() => {
        container = createMockContainer();
        document.body.appendChild(container);
    });

    afterEach(() => {
        heatmap?.destroy();
        container?.remove();
    });

    describe("initialization", () => {
        it("should create legend element when feature is added", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const legend = findLegend();
            expect(legend).not.toBeNull();
        });

        it("should not create legend without the feature", () => {
            heatmap = createHeatmap({ container });

            const legend = findLegend();
            expect(legend).toBeNull();
        });

        it("should create gradient container", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const gradientContainer = findGradientContainer();
            expect(gradientContainer).not.toBeNull();
        });

        it("should create labels container", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const labelsContainer = findLabelsContainer();
            expect(labelsContainer).not.toBeNull();
        });

        it("should create gradient canvas", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const gradientCanvas = findGradientCanvas();
            expect(gradientCanvas).not.toBeNull();
            expect(gradientCanvas?.tagName.toLowerCase()).toBe("canvas");
        });

        it("should apply default styles to legend", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const legend = findLegend() as HTMLElement;
            expect(legend.style.position).toBe("absolute");
            expect(legend.style.pointerEvents).toBe("none");
            expect(legend.style.zIndex).toBe("999");
        });

        it("should use default min/max values when no data provided", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const labels = getLabels();
            // Default min=0, max=100, labelCount=5
            expect(labels).toEqual(["0", "25", "50", "75", "100"]);
        });

        it("should use data min/max values from config", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: {
                        min: 10,
                        max: 50,
                        data: [{ x: 50, y: 50, value: 30 }]
                    }
                },
                withLegend()
            );

            const labels = getLabels();
            expect(labels[0]).toBe("10");
            expect(labels[labels.length - 1]).toBe("50");
        });
    });

    describe("positioning", () => {
        it("should position legend at bottom-right by default", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const legend = findLegend() as HTMLElement;
            expect(legend.style.bottom).toBe("10px");
            expect(legend.style.right).toBe("10px");
        });

        it("should position legend at top-left when configured", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ position: "top-left" })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.top).toBe("10px");
            expect(legend.style.left).toBe("10px");
        });

        it("should position legend at top-right when configured", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ position: "top-right" })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.top).toBe("10px");
            expect(legend.style.right).toBe("10px");
        });

        it("should position legend at bottom-left when configured", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ position: "bottom-left" })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.bottom).toBe("10px");
            expect(legend.style.left).toBe("10px");
        });

        it("should center legend at top when configured", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ position: "top" })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.top).toBe("10px");
            expect(legend.style.left).toBe("50%");
            expect(legend.style.transform).toContain("translateX(-50%)");
        });

        it("should center legend at bottom when configured", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ position: "bottom" })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.bottom).toBe("10px");
            expect(legend.style.left).toBe("50%");
            expect(legend.style.transform).toContain("translateX(-50%)");
        });

        it("should center legend at left when configured", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ position: "left" })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.top).toBe("50%");
            expect(legend.style.left).toBe("10px");
            expect(legend.style.transform).toContain("translateY(-50%)");
        });

        it("should center legend at right when configured", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ position: "right" })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.top).toBe("50%");
            expect(legend.style.right).toBe("10px");
            expect(legend.style.transform).toContain("translateY(-50%)");
        });
    });

    describe("orientation", () => {
        it("should use default width/height for horizontal", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const canvas = findGradientCanvas() as HTMLCanvasElement;
            expect(canvas.width).toBe(150);
            expect(canvas.height).toBe(15);
        });

        it("should use default width/height for vertical", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ orientation: "vertical" })
            );

            const canvas = findGradientCanvas() as HTMLCanvasElement;
            expect(canvas.width).toBe(20);
            expect(canvas.height).toBe(100);
        });

        it("should use custom width/height when provided", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ width: 200, height: 25 })
            );

            const canvas = findGradientCanvas() as HTMLCanvasElement;
            expect(canvas.width).toBe(200);
            expect(canvas.height).toBe(25);
        });
    });

    describe("labels", () => {
        it("should show 5 labels by default", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const labels = getLabels();
            expect(labels.length).toBe(5);
        });

        it("should use custom label count", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ labelCount: 3 })
            );

            const labels = getLabels();
            expect(labels.length).toBe(3);
        });

        it("should include min/max values in labels", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: { min: 0, max: 100, data: [] }
                },
                withLegend({ labelCount: 5, showMinMax: true })
            );

            const labels = getLabels();
            expect(labels[0]).toBe("0");
            expect(labels[labels.length - 1]).toBe("100");
        });

        it("should handle labelCount of 1", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: { min: 0, max: 100, data: [] }
                },
                withLegend({ labelCount: 1 })
            );

            const labels = getLabels();
            expect(labels.length).toBe(1);
            expect(labels[0]).toBe("50"); // midpoint
        });

        it("should handle labelCount of 0", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ labelCount: 0 })
            );

            const labels = getLabels();
            expect(labels.length).toBe(0);
        });

        it("should evenly distribute labels", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: { min: 0, max: 100, data: [] }
                },
                withLegend({ labelCount: 5 })
            );

            const labels = getLabels().map(Number);
            expect(labels).toEqual([0, 25, 50, 75, 100]);
        });
    });

    describe("formatter", () => {
        it("should use custom formatter", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: { min: 0, max: 100, data: [] }
                },
                withLegend({
                    formatter: (value) => `${value}°C`,
                    labelCount: 3
                })
            );

            const labels = getLabels();
            expect(labels).toEqual(["0°C", "50°C", "100°C"]);
        });

        it("should pass index to formatter", () => {
            const formatterSpy = vi.fn((value, index) => `${value}[${index}]`);

            heatmap = createHeatmap(
                {
                    container,
                    data: { min: 0, max: 100, data: [] }
                },
                withLegend({ formatter: formatterSpy, labelCount: 3 })
            );

            expect(formatterSpy).toHaveBeenCalledWith(0, 0);
            expect(formatterSpy).toHaveBeenCalledWith(50, 1);
            expect(formatterSpy).toHaveBeenCalledWith(100, 2);
        });

        it("should use default formatter to round values", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: { min: 0, max: 99, data: [] }
                },
                withLegend({ labelCount: 4 })
            );

            const labels = getLabels();
            // 0, 33, 66, 99 - all rounded
            expect(labels).toEqual(["0", "33", "66", "99"]);
        });
    });

    describe("reactive updates - setData", () => {
        it("should update labels when setData is called", () => {
            heatmap = createHeatmap({ container }, withLegend());

            // Initial labels (default 0-100)
            let labels = getLabels();
            expect(labels[0]).toBe("0");
            expect(labels[labels.length - 1]).toBe("100");

            // Update data with new range
            heatmap.setData({
                min: 50,
                max: 200,
                data: [{ x: 100, y: 100, value: 150 }]
            });

            labels = getLabels();
            expect(labels[0]).toBe("50");
            expect(labels[labels.length - 1]).toBe("200");
        });

        it("should preserve heatmap rendering after setData", () => {
            heatmap = createHeatmap({ container }, withLegend());

            heatmap.setData({
                min: 0,
                max: 100,
                data: [
                    { x: 50, y: 50, value: 75 },
                    { x: 100, y: 100, value: 25 }
                ]
            });

            const stats = heatmap.getStats();
            expect(stats.pointCount).toBe(2);
            expect(stats.dataRange?.max).toBe(100);
        });
    });

    describe("reactive updates - setGradient", () => {
        it("should still exist when setGradient is called", () => {
            heatmap = createHeatmap({ container }, withLegend());

            // Change to thermal gradient
            heatmap.setGradient(GRADIENT_THERMAL);

            // The canvas should be updated (same element but content changed)
            const gradientCanvas2 = findGradientCanvas() as HTMLCanvasElement;

            expect(gradientCanvas2).not.toBeNull();
        });

        it("should invalidate cached gradient canvas on setGradient", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const canvas1 = findGradientCanvas();

            heatmap.setGradient(GRADIENT_THERMAL);

            const canvas2 = findGradientCanvas();

            // New canvas should be created (cache invalidated)
            // Both should exist but be different instances
            expect(canvas1).not.toBeNull();
            expect(canvas2).not.toBeNull();
            expect(canvas1).not.toBe(canvas2);
        });
    });

    describe("custom styling", () => {
        it("should use custom className", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ className: "my-custom-legend" })
            );

            const legend = findLegend(".my-custom-legend");
            expect(legend).not.toBeNull();
        });

        it("should apply custom styles", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({
                    style: {
                        backgroundColor: "red",
                        borderRadius: "10px"
                    }
                })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.backgroundColor).toBe("red");
            expect(legend.style.borderRadius).toBe("10px");
        });

        it("should allow custom styles to override defaults", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({
                    style: {
                        position: "fixed",
                        zIndex: "2000"
                    }
                })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.position).toBe("fixed");
            expect(legend.style.zIndex).toBe("2000");
        });
    });

    describe("teardown", () => {
        it("should remove legend element on destroy", () => {
            heatmap = createHeatmap({ container }, withLegend());

            expect(findLegend()).not.toBeNull();

            heatmap.destroy();

            expect(findLegend()).toBeNull();
        });

        it("should not affect heatmap after legend teardown", () => {
            heatmap = createHeatmap({ container }, withLegend());

            heatmap.destroy();

            // Container should still exist (not removed by legend)
            expect(container.parentNode).not.toBeNull();
        });

        it("should handle multiple destroy calls gracefully", () => {
            heatmap = createHeatmap({ container }, withLegend());
            heatmap.destroy();

            expect(() => {
                heatmap.destroy();
                // Calling destroy again should not throw
                // (though in practice the heatmap is already destroyed)
            }).not.toThrow();
        });
    });

    describe("edge cases", () => {
        it("should handle data with same min and max", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: {
                        min: 50,
                        max: 50,
                        data: [{ x: 50, y: 50, value: 50 }]
                    }
                },
                withLegend()
            );

            const labels = getLabels();
            // All labels should be the same value
            labels.forEach((label) => expect(label).toBe("50"));
        });

        it("should handle negative values", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: { min: -100, max: 100, data: [] }
                },
                withLegend({ labelCount: 5 })
            );

            const labels = getLabels();
            expect(labels).toContain("-100");
            expect(labels).toContain("0");
            expect(labels).toContain("100");
        });

        it("should handle decimal values with formatter", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: { min: 0.5, max: 2.5, data: [] }
                },
                withLegend({
                    formatter: (v) => v.toFixed(1),
                    labelCount: 3
                })
            );

            const labels = getLabels();
            expect(labels).toEqual(["0.5", "1.5", "2.5"]);
        });

        it("should work with gradient from heatmap config", () => {
            heatmap = createHeatmap(
                { container, gradient: GRADIENT_THERMAL },
                withLegend()
            );

            const gradientCanvas = findGradientCanvas();
            expect(gradientCanvas).not.toBeNull();
        });

        it("should work with multiple features", () => {
            heatmap = createHeatmap({ container }, withLegend(), withTooltip());

            expect(findLegend()).not.toBeNull();
            expect(container.querySelector(".heatmap-tooltip")).not.toBeNull();
        });
    });

    describe("performance", () => {
        it("should only update labels on setData, not gradient", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const initialGradient = findGradientCanvas();
            const initialLabels = getLabels();

            heatmap.setData({ min: 0, max: 200, data: [] });

            // Gradient canvas should be the same (not recreated)
            const newGradientCanvas = findGradientCanvas();
            const newLabels = getLabels();

            expect(newLabels).not.toEqual(initialLabels);
            expect(newGradientCanvas).toBe(initialGradient);
        });

        it("should only update gradient on setGradient, not labels", () => {
            heatmap = createHeatmap(
                {
                    container,
                    data: { min: 0, max: 100, data: [] }
                },
                withLegend()
            );
            const initialGradient = findGradientCanvas();
            const initialLabels = getLabels();

            heatmap.setGradient(GRADIENT_THERMAL);

            const newGradientCanvas = findGradientCanvas();
            // Labels should remain unchanged
            const newLabels = getLabels();
            expect(newLabels).toEqual(initialLabels);
            expect(initialGradient).not.toBe(newGradientCanvas);
        });
    });
});
