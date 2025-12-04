import { describe, expect, it, beforeEach, afterEach, vi } from "vitest"
import {
    createHeatmap,
    withTooltip,
    type Heatmap,
    type HeatmapData,
    type HeatmapPoint
} from "../index"

describe("createHeatmap (composable API)", () => {
    let container: HTMLDivElement
    let heatmap: Heatmap

    const createMockContainer = (width = 300, height = 200): HTMLDivElement => {
        const div = document.createElement("div")
        Object.defineProperty(div, "offsetWidth", {
            value: width,
            configurable: true
        })
        Object.defineProperty(div, "offsetHeight", {
            value: height,
            configurable: true
        })
        return div
    }

    beforeEach(() => {
        container = createMockContainer()
        document.body.appendChild(container)
    })

    afterEach(() => {
        heatmap?.destroy()
        container?.remove()
    })

    describe("basic heatmap", () => {
        it("should create canvas with container dimensions", () => {
            heatmap = createHeatmap({ container })

            expect(heatmap.canvas.width).toBe(300)
            expect(heatmap.canvas.height).toBe(200)
        })

        it("should use custom dimensions when provided", () => {
            heatmap = createHeatmap({ container, width: 400, height: 300 })

            expect(heatmap.canvas.width).toBe(400)
            expect(heatmap.canvas.height).toBe(300)
        })

        it("should append canvas to container", () => {
            heatmap = createHeatmap({ container })

            expect(container.querySelector("canvas")).toBe(heatmap.canvas)
        })

        it("should set canvas styles correctly", () => {
            heatmap = createHeatmap({ container })

            expect(heatmap.canvas.style.position).toBe("absolute")
            expect(heatmap.canvas.style.top).toBe("0px")
            expect(heatmap.canvas.style.left).toBe("0px")
            expect(heatmap.canvas.style.pointerEvents).toBe("none")
        })

        it("should render initial data when provided in config", () => {
            heatmap = createHeatmap({
                container,
                radius: 10,
                data: {
                    min: 0,
                    max: 100,
                    data: [{ x: 50, y: 50, value: 100 }]
                }
            })

            const ctx = heatmap.canvas.getContext("2d")!
            const imageData = ctx.getImageData(0, 0, 300, 200)
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            )

            expect(hasContent).toBe(true)
        })
    })

    describe("setData", () => {
        it("should render points on canvas", () => {
            heatmap = createHeatmap({ container, radius: 10 })
            const data: HeatmapData = {
                min: 0,
                max: 100,
                data: [{ x: 50, y: 50, value: 100 }]
            }

            heatmap.setData(data)

            const ctx = heatmap.canvas.getContext("2d")!
            const imageData = ctx.getImageData(0, 0, 300, 200)
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            )

            expect(hasContent).toBe(true)
        })

        it("should handle empty data", () => {
            heatmap = createHeatmap({ container })
            const data: HeatmapData = { min: 0, max: 100, data: [] }

            expect(() => heatmap.setData(data)).not.toThrow()
        })
    })

    describe("addPoint", () => {
        it("should add point to empty heatmap", () => {
            heatmap = createHeatmap({ container })
            const point: HeatmapPoint = { x: 100, y: 100, value: 50 }

            heatmap.addPoint(point)

            const ctx = heatmap.canvas.getContext("2d")!
            const imageData = ctx.getImageData(0, 0, 300, 200)
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            )

            expect(hasContent).toBe(true)
        })
    })

    describe("clear", () => {
        it("should clear the canvas", () => {
            heatmap = createHeatmap({ container })
            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 50, y: 50, value: 100 }]
            })

            heatmap.clear()

            const ctx = heatmap.canvas.getContext("2d")!
            const imageData = ctx.getImageData(0, 0, 300, 200)
            const hasContent = imageData.data.some(
                (val, i) => i % 4 === 3 && val > 0
            )

            expect(hasContent).toBe(false)
        })
    })

    describe("getDataURL", () => {
        it("should return a data URL", () => {
            heatmap = createHeatmap({ container })
            heatmap.setData({
                min: 0,
                max: 100,
                data: [{ x: 50, y: 50, value: 100 }]
            })

            const dataUrl = heatmap.getDataURL()

            expect(dataUrl).toMatch(/^data:image\/png;base64,/)
        })
    })

    describe("destroy", () => {
        it("should remove canvas from DOM", () => {
            heatmap = createHeatmap({ container })
            const canvas = heatmap.canvas

            expect(container.contains(canvas)).toBe(true)

            heatmap.destroy()

            expect(container.contains(canvas)).toBe(false)
        })
    })

    describe("getValueAt", () => {
        it("should return 0 for empty heatmap", () => {
            heatmap = createHeatmap({ container })

            expect(heatmap.getValueAt(50, 50)).toBe(0)
        })

        it("should return aggregated value at position", () => {
            heatmap = createHeatmap({ container })
            heatmap.setData({
                min: 0,
                max: 100,
                data: [
                    { x: 2, y: 2, value: 30 },
                    { x: 4, y: 4, value: 20 }
                ]
            })

            // Both points should be in same grid cell (default gridSize is 6)
            expect(heatmap.getValueAt(3, 3)).toBe(50) // 30 + 20
        })
    })
})

describe("withTooltip feature", () => {
    let container: HTMLDivElement
    let heatmap: Heatmap

    const createMockContainer = (width = 300, height = 200): HTMLDivElement => {
        const div = document.createElement("div")
        Object.defineProperty(div, "offsetWidth", {
            value: width,
            configurable: true
        })
        Object.defineProperty(div, "offsetHeight", {
            value: height,
            configurable: true
        })
        return div
    }

    const findTooltip = (selector = ".heatmap-tooltip") =>
        container.querySelector(selector)

    beforeEach(() => {
        container = createMockContainer()
        document.body.appendChild(container)
    })

    afterEach(() => {
        heatmap?.destroy()
        container?.remove()
    })

    it("should create tooltip element when feature is added", () => {
        heatmap = createHeatmap({ container }, withTooltip())

        const tooltip = findTooltip()
        expect(tooltip).not.toBeNull()
    })

    it("should not create tooltip without the feature", () => {
        heatmap = createHeatmap({ container })

        const tooltip = findTooltip()
        expect(tooltip).toBeNull()
    })

    it("should use custom className for tooltip", () => {
        heatmap = createHeatmap(
            { container },
            withTooltip({ className: "my-custom-tooltip" })
        )

        const tooltip = findTooltip(".my-custom-tooltip")
        expect(tooltip).not.toBeNull()
    })

    it("should show tooltip on mousemove", () => {
        heatmap = createHeatmap({ container }, withTooltip())
        heatmap.setData({
            min: 0,
            max: 100,
            data: [{ x: 50, y: 50, value: 75 }]
        })

        const tooltip = findTooltip() as HTMLElement
        expect(tooltip.style.display).toBe("none")

        // Simulate mouse move
        const event = new MouseEvent("mousemove", {
            clientX: 50,
            clientY: 50,
            bubbles: true
        })
        container.dispatchEvent(event)

        expect(tooltip.style.display).toBe("block")
    })

    it("should hide tooltip on mouseleave", () => {
        heatmap = createHeatmap({ container }, withTooltip())
        heatmap.setData({
            min: 0,
            max: 100,
            data: [{ x: 50, y: 50, value: 75 }]
        })

        // Show tooltip first
        const moveEvent = new MouseEvent("mousemove", {
            clientX: 50,
            clientY: 50,
            bubbles: true
        })
        container.dispatchEvent(moveEvent)

        const tooltip = findTooltip() as HTMLElement
        expect(tooltip.style.display).toBe("block")

        // Hide on leave
        const leaveEvent = new MouseEvent("mouseleave", { bubbles: true })
        container.dispatchEvent(leaveEvent)

        expect(tooltip.style.display).toBe("none")
    })

    it("should use custom formatter", () => {
        heatmap = createHeatmap(
            { container },
            withTooltip({
                formatter: (value) => `${value} clicks`
            })
        )

        heatmap.setData({
            min: 0,
            max: 100,
            data: [{ x: 6, y: 6, value: 42 }]
        })

        // Mock getBoundingClientRect for proper coordinate calculation
        const rect = { left: 0, top: 0, width: 300, height: 200 }
        vi.spyOn(container, "getBoundingClientRect").mockReturnValue(
            rect as DOMRect
        )

        // Simulate mouse move at the point location
        const event = new MouseEvent("mousemove", {
            clientX: 6,
            clientY: 6,
            bubbles: true
        })
        container.dispatchEvent(event)

        const tooltip = findTooltip() as HTMLElement
        expect(tooltip.textContent).toBe("42 clicks")
    })

    it("should remove tooltip on destroy", () => {
        heatmap = createHeatmap({ container }, withTooltip())

        expect(findTooltip()).not.toBeNull()

        heatmap.destroy()

        expect(findTooltip()).toBeNull()
    })

    it("should apply custom styles to tooltip", () => {
        heatmap = createHeatmap(
            { container },
            withTooltip({
                style: {
                    backgroundColor: "red",
                    fontSize: "20px"
                }
            })
        )

        const tooltip = findTooltip() as HTMLElement
        expect(tooltip.style.backgroundColor).toBe("red")
        expect(tooltip.style.fontSize).toBe("20px")
    })
})
