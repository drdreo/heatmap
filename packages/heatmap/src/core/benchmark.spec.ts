import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { createHeatmap, type Heatmap, type HeatmapPoint } from "../index";
import { withCanvas2DRenderer } from "./render-pipeline";
import { withWebGLRenderer, isWebGLAvailable } from "./webgl-renderer";
import { heatData } from "./heat-data.mock";

/**
 * Generate a large dataset for performance testing
 */
function generateLargeDataset(
    count: number,
    width: number,
    height: number
): HeatmapPoint[] {
    const points: HeatmapPoint[] = [];
    for (let i = 0; i < count; i++) {
        points.push({
            x: Math.random() * width,
            y: Math.random() * height,
            value: Math.random() * 100
        });
    }
    return points;
}

/**
 * Generate clustered dataset (more realistic - points tend to cluster)
 */
function generateClusteredDataset(
    count: number,
    width: number,
    height: number,
    clusterCount = 10
): HeatmapPoint[] {
    const points: HeatmapPoint[] = [];
    const clusters = Array.from({ length: clusterCount }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        spread: 20 + Math.random() * 50
    }));

    for (let i = 0; i < count; i++) {
        const cluster = clusters[Math.floor(Math.random() * clusterCount)];
        points.push({
            x: cluster.x + (Math.random() - 0.5) * cluster.spread * 2,
            y: cluster.y + (Math.random() - 0.5) * cluster.spread * 2,
            value: Math.random() * 100
        });
    }
    return points;
}

describe("Canvas2D Renderer Performance Benchmarks", () => {
    let container: HTMLDivElement;
    let heatmap: Heatmap;

    const createMockContainer = (width = 800, height = 600): HTMLDivElement => {
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

    describe("Benchmark: Standard Canvas2D Renderer", () => {
        const testCases = [
            { name: "small", count: 1000 },
            { name: "medium", count: 10000 },
            { name: "large", count: 50000 },
            { name: "very-large", count: 100000 }
        ];

        for (const testCase of testCases) {
            it(`should render ${testCase.count} points`, () => {
                const data = generateLargeDataset(testCase.count, 800, 600);

                heatmap = createHeatmap(
                    { container, radius: 15 },
                    withCanvas2DRenderer()
                );

                const start = performance.now();
                heatmap.setData(data);
                const end = performance.now();

                console.log(
                    `Canvas2D (${testCase.name}): ${(end - start).toFixed(2)}ms for ${testCase.count} points`
                );

                // Verify rendering occurred
                const ctx = heatmap.canvas.getContext("2d")!;
                const imageData = ctx.getImageData(0, 0, 800, 600);
                const hasContent = imageData.data.some(
                    (val, i) => i % 4 === 3 && val > 0
                );
                expect(hasContent).toBe(true);
            });
        }
    });

    describe("Benchmark: Real-world mock data", () => {
        it("should render mock data (small canvas 320x50)", () => {
            heatmap = createHeatmap(
                { container, width: 320, height: 50, radius: 25 },
                withCanvas2DRenderer()
            );

            const start = performance.now();
            heatmap.setData(heatData);
            const end = performance.now();

            console.log(
                `Canvas2D (320x50, r=25): ${(end - start).toFixed(2)}ms for ${heatData.length} points`
            );

            expect(heatmap.getStats().pointCount).toBe(heatData.length);
        });

        it("should render mock data (large canvas 1920x1080)", () => {
            const largeContainer = createMockContainer(1920, 1080);
            document.body.appendChild(largeContainer);

            heatmap = createHeatmap(
                {
                    container: largeContainer,
                    width: 1920,
                    height: 1080,
                    radius: 25
                },
                withCanvas2DRenderer()
            );

            const start = performance.now();
            heatmap.setData(heatData);
            const end = performance.now();

            console.log(
                `Canvas2D (1920x1080, r=25): ${(end - start).toFixed(2)}ms for ${heatData.length} points`
            );

            largeContainer.remove();
            expect(heatmap.getStats().pointCount).toBe(heatData.length);
        });

        it("should render mock data (user scenario 300x250)", () => {
            const userContainer = createMockContainer(300, 250);
            document.body.appendChild(userContainer);

            heatmap = createHeatmap(
                { container: userContainer, width: 300, height: 250 },
                withCanvas2DRenderer()
            );

            const start = performance.now();
            heatmap.setData(heatData);
            const end = performance.now();

            console.log(
                `Canvas2D (300x250, r=25): ${(end - start).toFixed(2)}ms for ${heatData.length} points`
            );

            userContainer.remove();
            expect(heatmap.getStats().pointCount).toBe(heatData.length);
        });
    });

    describe("Benchmark: Clustered data (realistic)", () => {
        it("should handle clustered 50k points", () => {
            const data = generateClusteredDataset(50000, 800, 600, 15);

            heatmap = createHeatmap(
                { container, radius: 20 },
                withCanvas2DRenderer()
            );

            const start = performance.now();
            heatmap.setData(data);
            const end = performance.now();

            console.log(
                `Canvas2D (clustered 50k): ${(end - start).toFixed(2)}ms`
            );

            // Should complete in reasonable time
            expect(end - start).toBeLessThan(5000);
        });
    });

    describe("Benchmark: Multiple renders (animation scenario)", () => {
        it("should handle multiple rapid renders efficiently", () => {
            heatmap = createHeatmap(
                { container, radius: 15 },
                withCanvas2DRenderer()
            );

            const frameCount = 30;
            const pointsPerFrame = 10000;
            const times: number[] = [];

            for (let i = 0; i < frameCount; i++) {
                const data = generateLargeDataset(pointsPerFrame, 800, 600);
                const start = performance.now();
                heatmap.setData(data);
                const end = performance.now();
                times.push(end - start);
            }

            const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
            const maxTime = Math.max(...times);
            const minTime = Math.min(...times);

            console.log(
                `Multiple renders (${frameCount} frames, ${pointsPerFrame} points each):`
            );
            console.log(`  Average: ${avgTime.toFixed(2)}ms`);
            console.log(`  Min: ${minTime.toFixed(2)}ms`);
            console.log(`  Max: ${maxTime.toFixed(2)}ms`);

            // Average frame time should be reasonable
            expect(avgTime).toBeLessThan(1000);
        });
    });

    describe("Benchmark: Radius impact", () => {
        const radiusTests = [10, 25, 50, 100];

        for (const testRadius of radiusTests) {
            it(`should measure performance with radius=${testRadius}`, () => {
                const data = generateLargeDataset(10000, 800, 600);

                heatmap = createHeatmap(
                    { container, radius: testRadius },
                    withCanvas2DRenderer()
                );

                const start = performance.now();
                heatmap.setData(data);
                const end = performance.now();

                console.log(
                    `Canvas2D (r=${testRadius}): ${(end - start).toFixed(2)}ms for 10k points`
                );

                expect(heatmap.getStats().pointCount).toBe(10000);
            });
        }
    });

    describe("Benchmark: WebGL vs Canvas2D", () => {
        it("should compare WebGL and Canvas2D performance", () => {
            const data = generateLargeDataset(50000, 800, 600);

            // Canvas2D
            const canvas2dHeatmap = createHeatmap(
                { container, radius: 15 },
                withCanvas2DRenderer()
            );

            const canvas2dStart = performance.now();
            canvas2dHeatmap.setData(data);
            const canvas2dEnd = performance.now();
            const canvas2dTime = canvas2dEnd - canvas2dStart;

            canvas2dHeatmap.destroy();

            // WebGL (if available)
            let webglTime: number | null = null;
            if (isWebGLAvailable()) {
                const webglHeatmap = createHeatmap(
                    { container, radius: 15 },
                    withWebGLRenderer()
                );

                const webglStart = performance.now();
                webglHeatmap.setData(data);
                const webglEnd = performance.now();
                webglTime = webglEnd - webglStart;

                webglHeatmap.destroy();
            }

            console.log(`\nRenderer Comparison (50k points):`);
            console.log(`  Canvas2D: ${canvas2dTime.toFixed(2)}ms`);
            if (webglTime !== null) {
                console.log(`  WebGL: ${webglTime.toFixed(2)}ms`);
                console.log(
                    `  Speedup: ${(canvas2dTime / webglTime).toFixed(2)}x`
                );
            } else {
                console.log(`  WebGL: not available`);
            }

            // Just verify it ran
            expect(canvas2dTime).toBeGreaterThan(0);
        });
    });
});
