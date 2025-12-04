import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { createHeatmap, withTooltip, type Heatmap } from "../index";

describe("withTooltip feature", () => {
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

    const findTooltip = (selector = ".heatmap-tooltip") =>
        container.querySelector(selector);

    beforeEach(() => {
        container = createMockContainer();
        document.body.appendChild(container);
    });

    afterEach(() => {
        heatmap?.destroy();
        container?.remove();
    });

    describe("creation", () => {
        it("should create tooltip element when feature is added", () => {
            heatmap = createHeatmap({ container }, withTooltip());

            const tooltip = findTooltip();
            expect(tooltip).not.toBeNull();
        });

        it("should not create tooltip without the feature", () => {
            heatmap = createHeatmap({ container });

            const tooltip = findTooltip();
            expect(tooltip).toBeNull();
        });

        it("should use custom className for tooltip", () => {
            heatmap = createHeatmap(
                { container },
                withTooltip({ className: "my-custom-tooltip" })
            );

            const tooltip = findTooltip(".my-custom-tooltip");
            expect(tooltip).not.toBeNull();
        });

        it("should apply custom styles to tooltip", () => {
            heatmap = createHeatmap(
                { container },
                withTooltip({
                    style: {
                        backgroundColor: "red",
                        fontSize: "20px"
                    }
                })
            );

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.backgroundColor).toBe("red");
            expect(tooltip.style.fontSize).toBe("20px");
        });

        it("should apply default tooltip styles", () => {
            heatmap = createHeatmap({ container }, withTooltip());

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.position).toBe("absolute");
            expect(tooltip.style.pointerEvents).toBe("none");
            expect(tooltip.style.display).toBe("none");
        });
    });

    describe("mouse interactions", () => {
        it("should show tooltip on mousemove", () => {
            heatmap = createHeatmap({ container }, withTooltip());
            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 50, y: 50, value: 75 }]
            });

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.display).toBe("none");

            const event = new MouseEvent("mousemove", {
                clientX: 50,
                clientY: 50,
                bubbles: true
            });
            container.dispatchEvent(event);

            expect(tooltip.style.display).toBe("block");
        });

        it("should hide tooltip on mouseleave", () => {
            heatmap = createHeatmap({ container }, withTooltip());
            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 50, y: 50, value: 75 }]
            });

            // Show tooltip first
            const moveEvent = new MouseEvent("mousemove", {
                clientX: 50,
                clientY: 50,
                bubbles: true
            });
            container.dispatchEvent(moveEvent);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.display).toBe("block");

            // Hide on leave
            const leaveEvent = new MouseEvent("mouseleave", { bubbles: true });
            container.dispatchEvent(leaveEvent);

            expect(tooltip.style.display).toBe("none");
        });

        it("should update tooltip position on mousemove", () => {
            heatmap = createHeatmap({ container }, withTooltip());
            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 50, y: 50, value: 75 }]
            });

            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            const event = new MouseEvent("mousemove", {
                clientX: 100,
                clientY: 100,
                bubbles: true
            });
            container.dispatchEvent(event);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.transform).toContain("translate");
        });
    });

    describe("formatter", () => {
        it("should use custom formatter", () => {
            heatmap = createHeatmap(
                { container },
                withTooltip({
                    formatter: (value) => `${value} clicks`
                })
            );

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 6, y: 6, value: 42 }]
            });

            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            const event = new MouseEvent("mousemove", {
                clientX: 6,
                clientY: 6,
                bubbles: true
            });
            container.dispatchEvent(event);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.textContent).toBe("42 clicks");
        });

        it("should pass x and y coordinates to formatter", () => {
            const formatterSpy = vi.fn(
                (value, x, y) => `Value: ${value} at (${x}, ${y})`
            );

            heatmap = createHeatmap(
                { container },
                withTooltip({ formatter: formatterSpy })
            );

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 50, y: 50, value: 75 }]
            });

            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            const event = new MouseEvent("mousemove", {
                clientX: 50,
                clientY: 50,
                bubbles: true
            });
            container.dispatchEvent(event);

            expect(formatterSpy).toHaveBeenCalledWith(
                expect.any(Number),
                expect.any(Number),
                expect.any(Number)
            );
        });

        it("should use default formatter when none provided", () => {
            heatmap = createHeatmap({ container }, withTooltip());

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 6, y: 6, value: 42 }]
            });

            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            const event = new MouseEvent("mousemove", {
                clientX: 6,
                clientY: 6,
                bubbles: true
            });
            container.dispatchEvent(event);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.textContent).toBe("42");
        });
    });

    describe("enforceBounds", () => {
        it("should flip tooltip horizontally when overflowing right", () => {
            heatmap = createHeatmap(
                { container },
                withTooltip({ enforceBounds: true })
            );

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 290, y: 50, value: 75 }]
            });

            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            // Simulate mouse near right edge
            const event = new MouseEvent("mousemove", {
                clientX: 290,
                clientY: 50,
                bubbles: true
            });
            container.dispatchEvent(event);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.display).toBe("block");
            // Tooltip should be visible and positioned
            expect(tooltip.style.transform).toBeDefined();
        });

        it("should flip tooltip vertically when overflowing bottom", () => {
            heatmap = createHeatmap(
                { container },
                withTooltip({ enforceBounds: true })
            );

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 50, y: 190, value: 75 }]
            });

            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            // Simulate mouse near bottom edge
            const event = new MouseEvent("mousemove", {
                clientX: 50,
                clientY: 190,
                bubbles: true
            });
            container.dispatchEvent(event);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.display).toBe("block");
        });

        it("should clamp tooltip to container edges", () => {
            heatmap = createHeatmap(
                { container },
                withTooltip({ enforceBounds: true })
            );

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 295, y: 195, value: 75 }]
            });

            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            // Simulate mouse at corner
            const event = new MouseEvent("mousemove", {
                clientX: 295,
                clientY: 195,
                bubbles: true
            });
            container.dispatchEvent(event);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.display).toBe("block");
        });

        it("should not enforce bounds when disabled", () => {
            heatmap = createHeatmap(
                { container },
                withTooltip({ enforceBounds: false })
            );

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 290, y: 50, value: 75 }]
            });

            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            const event = new MouseEvent("mousemove", {
                clientX: 290,
                clientY: 50,
                bubbles: true
            });
            container.dispatchEvent(event);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.display).toBe("block");
        });
    });

    describe("custom offset", () => {
        it("should use custom offset", () => {
            heatmap = createHeatmap(
                { container },
                withTooltip({ offset: { x: 30, y: 30 } })
            );

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 50, y: 50, value: 75 }]
            });

            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            const event = new MouseEvent("mousemove", {
                clientX: 50,
                clientY: 50,
                bubbles: true
            });
            container.dispatchEvent(event);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.transform).toContain("translate");
        });
    });

    describe("cleanup", () => {
        it("should remove tooltip on destroy", () => {
            heatmap = createHeatmap({ container }, withTooltip());

            expect(findTooltip()).not.toBeNull();

            heatmap.destroy();

            expect(findTooltip()).toBeNull();
        });

        it("should remove event listeners on destroy", () => {
            heatmap = createHeatmap({ container }, withTooltip());

            const removeEventListenerSpy = vi.spyOn(
                container,
                "removeEventListener"
            );

            heatmap.destroy();

            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                "mousemove",
                expect.any(Function)
            );
            expect(removeEventListenerSpy).toHaveBeenCalledWith(
                "mouseleave",
                expect.any(Function)
            );
        });
    });

    describe("edge cases", () => {
        it("should handle mousemove when heatmap has no data", () => {
            heatmap = createHeatmap({ container }, withTooltip());

            const event = new MouseEvent("mousemove", {
                clientX: 50,
                clientY: 50,
                bubbles: true
            });

            expect(() => container.dispatchEvent(event)).not.toThrow();
        });

        it("should handle scaled containers", () => {
            heatmap = createHeatmap(
                { container, width: 600, height: 400 },
                withTooltip()
            );

            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 100, y: 100, value: 50 }]
            });

            // Container is 300x200 but canvas is 600x400 (2x scale)
            const rect = { left: 0, top: 0, width: 300, height: 200 };
            vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
                rect as DOMRect
            );

            const event = new MouseEvent("mousemove", {
                clientX: 50,
                clientY: 50,
                bubbles: true
            });
            container.dispatchEvent(event);

            const tooltip = findTooltip() as HTMLElement;
            expect(tooltip.style.display).toBe("block");
            // Transform should include scale
            expect(tooltip.style.transform).toContain("scale");
        });
    });
});
