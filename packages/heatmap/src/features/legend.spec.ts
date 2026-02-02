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

    const findGradientCanvas = () =>
        container.querySelector(".heatmap-legend__gradient");

    const getLabels = (): string[] => {
        const labelsContainer = container.querySelector(
            ".heatmap-legend__labels"
        );
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
        it("should create legend with all required elements", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const legend = findLegend() as HTMLElement;
            expect(legend).not.toBeNull();
            expect(legend.style.position).toBe("absolute");
            expect(legend.style.zIndex).toBe("999");

            // Gradient canvas
            const canvas = findGradientCanvas() as HTMLCanvasElement;
            expect(canvas?.tagName.toLowerCase()).toBe("canvas");

            // Labels container
            expect(
                container.querySelector(".heatmap-legend__labels")
            ).not.toBeNull();
        });

        it("should not create legend without the feature", () => {
            heatmap = createHeatmap({ container });
            expect(findLegend()).toBeNull();
        });

        it("should use default labels 0-100 when no data", () => {
            heatmap = createHeatmap({ container }, withLegend());
            expect(getLabels()).toEqual(["0", "25", "50", "75", "100"]);
        });

        it("should derive labels from data (dataMin to dataMax)", () => {
            heatmap = createHeatmap(
                { container, data: [{ x: 50, y: 50, value: 30 }] },
                withLegend()
            );

            const labels = getLabels();
            // With a single point, min and max are both 30
            expect(labels[0]).toBe("30");
            expect(labels[labels.length - 1]).toBe("30");
        });
    });

    describe("positioning", () => {
        it.each([
            ["bottom-right", { bottom: "10px", right: "10px" }],
            ["top-left", { top: "10px", left: "10px" }],
            ["top-right", { top: "10px", right: "10px" }],
            ["bottom-left", { bottom: "10px", left: "10px" }]
        ] as const)(
            "should position legend at %s",
            (position, expectedStyles) => {
                heatmap = createHeatmap(
                    { container },
                    withLegend({ position })
                );

                const legend = findLegend() as HTMLElement;
                for (const [prop, value] of Object.entries(expectedStyles)) {
                    expect(
                        legend.style[prop as keyof CSSStyleDeclaration]
                    ).toBe(value);
                }
            }
        );

        it.each([
            ["top", { top: "10px", left: "50%" }],
            ["bottom", { bottom: "10px", left: "50%" }],
            ["left", { top: "50%", left: "10px" }],
            ["right", { top: "50%", right: "10px" }]
        ] as const)(
            "should center legend at %s with transform",
            (position, expectedStyles) => {
                heatmap = createHeatmap(
                    { container },
                    withLegend({ position })
                );

                const legend = findLegend() as HTMLElement;
                for (const [prop, value] of Object.entries(expectedStyles)) {
                    expect(
                        legend.style[prop as keyof CSSStyleDeclaration]
                    ).toBe(value);
                }
                expect(legend.style.transform).toContain("translate");
            }
        );
    });

    describe("dimensions", () => {
        it("should use horizontal defaults (150x15)", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const canvas = findGradientCanvas() as HTMLCanvasElement;
            expect(canvas.width).toBe(150);
            expect(canvas.height).toBe(15);
        });

        it("should use vertical defaults (20x100)", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ orientation: "vertical" })
            );

            const canvas = findGradientCanvas() as HTMLCanvasElement;
            expect(canvas.width).toBe(20);
            expect(canvas.height).toBe(100);
        });

        it("should use custom dimensions", () => {
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
        it("should respect labelCount", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ labelCount: 3 })
            );
            expect(getLabels().length).toBe(3);
        });

        it("should handle labelCount edge cases (0 and 1)", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ labelCount: 0 })
            );
            expect(getLabels().length).toBe(0);
            heatmap.destroy();

            heatmap = createHeatmap(
                {
                    container,
                    valueMin: 0,
                    valueMax: 100,
                    data: [{ x: 50, y: 50, value: 100 }]
                },
                withLegend({ labelCount: 1 })
            );
            expect(getLabels()).toEqual(["50"]); // midpoint of 0-100
        });

        it("should evenly distribute labels", () => {
            heatmap = createHeatmap(
                {
                    container,
                    valueMin: 0,
                    valueMax: 100,
                    data: [{ x: 50, y: 50, value: 100 }]
                },
                withLegend({ labelCount: 5 })
            );
            expect(getLabels().map(Number)).toEqual([0, 25, 50, 75, 100]);
        });
    });

    describe("formatter", () => {
        it("should apply custom formatter with value and index", () => {
            const formatterSpy = vi.fn((value, index) => `${value}[${index}]`);

            heatmap = createHeatmap(
                { container },
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
                    valueMin: 0,
                    valueMax: 99,
                    data: [{ x: 50, y: 50, value: 99 }]
                },
                withLegend({ labelCount: 4 })
            );
            expect(getLabels()).toEqual(["0", "33", "66", "99"]);
        });

        it("should format decimal values", () => {
            heatmap = createHeatmap(
                {
                    container,
                    valueMin: 0,
                    valueMax: 2.5,
                    data: [
                        { x: 50, y: 50, value: 0.5 },
                        { x: 150, y: 100, value: 2.5 }
                    ]
                },
                withLegend({ formatter: (v) => v.toFixed(1), labelCount: 3 })
            );
            expect(getLabels()).toEqual(["0.0", "1.3", "2.5"]);
        });
    });

    describe("custom min/max configuration", () => {
        it("should use explicit valueMin for range-based data (e.g., temps 50-100)", () => {
            heatmap = createHeatmap(
                {
                    container,
                    valueMin: 50,
                    data: [{ x: 10, y: 10, value: 100 }]
                },
                withLegend()
            );

            const labels = getLabels();
            expect(labels[0]).toBe("50");
            expect(labels[labels.length - 1]).toBe("100");
        });

        it("should keep configured valueMin even if data is below it", () => {
            heatmap = createHeatmap(
                {
                    container,
                    valueMin: 50,
                    data: [{ x: 10, y: 10, value: 40 }]
                },
                withLegend()
            );
            expect(getLabels()[0]).toBe("50");
        });

        it("should use explicit valueMax to extend scale beyond data", () => {
            heatmap = createHeatmap(
                {
                    container,
                    valueMin: 0,
                    valueMax: 100,
                    data: [{ x: 50, y: 50, value: 50 }]
                },
                withLegend({ labelCount: 3 })
            );

            const labels = getLabels();
            expect(labels[0]).toBe("0");
            expect(labels[labels.length - 1]).toBe("100");
        });

        it("should use both configured valueMin and valueMax", () => {
            heatmap = createHeatmap(
                {
                    container,
                    valueMin: 0,
                    valueMax: 100,
                    data: [{ x: 50, y: 50, value: 50 }]
                },
                withLegend({ labelCount: 5 })
            );
            expect(getLabels().map(Number)).toEqual([0, 25, 50, 75, 100]);
        });

        it("should keep configured valueMin/valueMax when data changes", () => {
            heatmap = createHeatmap(
                { container, valueMin: 0, valueMax: 100 },
                withLegend({ labelCount: 3 })
            );

            expect(getLabels()[0]).toBe("0");
            expect(getLabels()[2]).toBe("100");

            heatmap.setData([{ x: 50, y: 50, value: 150 }]);

            // Should still use configured valueMin/valueMax
            expect(getLabels()[0]).toBe("0");
            expect(getLabels()[2]).toBe("100");
        });
    });

    describe("reactive updates", () => {
        it("should update labels when setData is called", () => {
            heatmap = createHeatmap({ container }, withLegend());

            expect(getLabels()[4]).toBe("100"); // default max

            heatmap.setData([{ x: 100, y: 100, value: 150 }]);

            expect(getLabels()[4]).toBe("150"); // new gridMax
        });

        it("should show max value when points overlap (default max mode)", () => {
            heatmap = createHeatmap({ container, gridSize: 10 }, withLegend());

            // Two points in same grid cell - legend shows max value (default aggregation)
            // This ensures tooltip values and legend values are consistent
            heatmap.setData([
                { x: 2, y: 2, value: 30 },
                { x: 4, y: 4, value: 20 }
            ]);

            // Legend shows max grid value (30), matching what tooltip would show
            expect(getLabels()[4]).toBe("30");
        });

        it("should update gradient on setGradient but not labels", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const initialCanvas = findGradientCanvas();
            const initialLabels = getLabels();

            heatmap.setGradient(GRADIENT_THERMAL);

            expect(findGradientCanvas()).not.toBe(initialCanvas);
            expect(getLabels()).toEqual(initialLabels);
        });

        it("should update labels on setData but not gradient", () => {
            heatmap = createHeatmap({ container }, withLegend());

            const initialCanvas = findGradientCanvas();

            heatmap.setData([{ x: 50, y: 50, value: 200 }]);

            expect(findGradientCanvas()).toBe(initialCanvas);
            expect(getLabels()[4]).toBe("200");
        });
    });

    describe("custom styling", () => {
        it("should use custom className", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({ className: "my-legend" })
            );
            expect(findLegend(".my-legend")).not.toBeNull();
        });

        it("should apply and override styles", () => {
            heatmap = createHeatmap(
                { container },
                withLegend({
                    style: {
                        backgroundColor: "red",
                        position: "fixed",
                        zIndex: "2000"
                    }
                })
            );

            const legend = findLegend() as HTMLElement;
            expect(legend.style.backgroundColor).toBe("red");
            expect(legend.style.position).toBe("fixed");
            expect(legend.style.zIndex).toBe("2000");
        });
    });

    describe("teardown", () => {
        it("should remove legend on destroy", () => {
            heatmap = createHeatmap({ container }, withLegend());
            expect(findLegend()).not.toBeNull();

            heatmap.destroy();
            expect(findLegend()).toBeNull();
        });

        it("should handle multiple destroy calls gracefully", () => {
            heatmap = createHeatmap({ container }, withLegend());
            heatmap.destroy();
            expect(() => heatmap.destroy()).not.toThrow();
        });
    });

    describe("integration", () => {
        it("should work with heatmap gradient config", () => {
            heatmap = createHeatmap(
                { container, gradient: GRADIENT_THERMAL },
                withLegend()
            );
            expect(findGradientCanvas()).not.toBeNull();
        });

        it("should work with multiple features", () => {
            heatmap = createHeatmap({ container }, withLegend(), withTooltip());

            expect(findLegend()).not.toBeNull();
            expect(container.querySelector(".heatmap-tooltip")).not.toBeNull();
        });

        it("should preserve heatmap stats after setData", () => {
            heatmap = createHeatmap({ container }, withLegend());

            heatmap.setData([
                { x: 50, y: 50, value: 75 },
                { x: 100, y: 100, value: 25 }
            ]);

            const stats = heatmap.getStats();
            expect(stats.pointCount).toBe(2);
            expect(stats.dataRange?.min).toBe(25);
            expect(stats.dataRange?.max).toBe(75);
        });
    });
});
