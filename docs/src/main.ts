import { createHeatmap, withTooltip } from "@drdreo/heatmap"
import "./style.css"

const config = {
    container: document.querySelector<HTMLElement>("#heatmap-container")!,
    // Use original data dimensions for proper coordinate mapping
    // The canvas will be CSS-scaled to fit the container
    width: 800,
    height: 400
}

const heatmap = createHeatmap(config, withTooltip())
heatmap.setData({
    min: 0,
    max: 100,
    data: [
        { x: 200, y: 200, value: 80 },
        { x: 250, y: 180, value: 60 },
        { x: 300, y: 220, value: 90 },
        { x: 500, y: 150, value: 70 },
        { x: 550, y: 180, value: 85 },
        { x: 400, y: 300, value: 50 }
    ]
})

// Add click handler to add points
const canvas = heatmap.canvas
canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    heatmap.addPoint({ x, y, value: Math.random() * 100 })
})

// Clear button
document.getElementById("clear-btn")?.addEventListener("click", () => {
    heatmap.clear()
})

// Random points button
document.getElementById("random-btn")?.addEventListener("click", () => {
    const points = Array.from({ length: 50 }, () => ({
        x: Math.random() * 800,
        y: Math.random() * 400,
        value: Math.random() * 100
    }))

    heatmap.addPoints(points)
})
