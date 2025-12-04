import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { generatePalette, parseColor, createGradientCanvas } from "./gradient";
import { DEFAULT_GRADIENT, type GradientStop } from "./types";

describe("gradient", () => {
    describe("parseColor", () => {
        it("should parse rgba color", () => {
            const color = parseColor("rgba(255, 128, 64, 0.5)");
            expect(color).toEqual({ r: 255, g: 128, b: 64, a: 0.5 });
        });

        it("should parse rgb color with default alpha", () => {
            const color = parseColor("rgb(100, 150, 200)");
            expect(color).toEqual({ r: 100, g: 150, b: 200, a: 1 });
        });

        it("should parse hex color", () => {
            const color = parseColor("#ff8040");
            expect(color).toEqual({ r: 255, g: 128, b: 64, a: 1 });
        });

        it("should parse short hex color", () => {
            const color = parseColor("#f80");
            expect(color).toEqual({ r: 255, g: 136, b: 0, a: 1 });
        });

        it("should return transparent black for invalid color", () => {
            const color = parseColor("invalid");
            expect(color).toEqual({ r: 0, g: 0, b: 0, a: 0 });
        });

        it("should handle rgba with spaces", () => {
            const color = parseColor("rgba( 10 , 20 , 30 , 0.8 )");
            expect(color).toEqual({ r: 10, g: 20, b: 30, a: 0.8 });
        });
    });

    describe("generatePalette", () => {
        it("should generate a 256-entry palette", () => {
            const palette = generatePalette(DEFAULT_GRADIENT);
            expect(palette).toBeInstanceOf(Uint8ClampedArray);
            expect(palette.length).toBe(256 * 4); // 256 RGBA entries
        });

        it("should have transparent color at index 0", () => {
            const palette = generatePalette(DEFAULT_GRADIENT);
            // First color should be transparent (from DEFAULT_GRADIENT)
            expect(palette[3]).toBe(0); // Alpha channel of first entry
        });

        it("should have opaque color at index 255", () => {
            const palette = generatePalette(DEFAULT_GRADIENT);
            const lastIdx = 255 * 4;
            // Last color should be red (from DEFAULT_GRADIENT)
            expect(palette[lastIdx]).toBe(255); // R
            expect(palette[lastIdx + 1]).toBe(0); // G
            expect(palette[lastIdx + 2]).toBe(0); // B
            expect(palette[lastIdx + 3]).toBe(255); // A
        });

        it("should interpolate colors correctly", () => {
            const simpleGradient: GradientStop[] = [
                { offset: 0, color: "rgba(0, 0, 0, 1)" },
                { offset: 1, color: "rgba(255, 255, 255, 1)" }
            ];
            const palette = generatePalette(simpleGradient);

            // Middle value (index 128) should be approximately gray
            const midIdx = 128 * 4;
            expect(palette[midIdx]).toBeGreaterThan(120);
            expect(palette[midIdx]).toBeLessThan(136);
            expect(palette[midIdx + 1]).toBeGreaterThan(120);
            expect(palette[midIdx + 1]).toBeLessThan(136);
        });

        it("should handle single color gradient", () => {
            const singleColor: GradientStop[] = [
                { offset: 0, color: "rgba(128, 128, 128, 1)" }
            ];
            const palette = generatePalette(singleColor);

            // All entries should be the same color
            expect(palette[0]).toBe(128);
            expect(palette[255 * 4]).toBe(128);
        });

        it("should sort gradient stops by offset", () => {
            const unsortedGradient: GradientStop[] = [
                { offset: 1, color: "rgba(255, 0, 0, 1)" },
                { offset: 0, color: "rgba(0, 0, 255, 1)" }
            ];
            const palette = generatePalette(unsortedGradient);

            // First should be blue
            expect(palette[0]).toBe(0); // R
            expect(palette[2]).toBe(255); // B

            // Last should be red
            const lastIdx = 255 * 4;
            expect(palette[lastIdx]).toBe(255); // R
            expect(palette[lastIdx + 2]).toBe(0); // B
        });
    });

    describe("createGradientCanvas", () => {
        beforeEach(() => {
            // Mock canvas and context
            const mockContext = {
                createLinearGradient: vi.fn(() => ({
                    addColorStop: vi.fn()
                })),
                fillRect: vi.fn()
            };

            vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(
                mockContext as unknown as CanvasRenderingContext2D
            );
        });

        afterEach(() => {
            vi.restoreAllMocks();
        });

        it("should create canvas with specified dimensions", () => {
            const canvas = createGradientCanvas(200, 50);
            expect(canvas.width).toBe(200);
            expect(canvas.height).toBe(50);
        });

        it("should create horizontal gradient by default", () => {
            const canvas = createGradientCanvas(100, 20);
            const ctx = canvas.getContext("2d")!;

            expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 0, 100, 0);
        });

        it("should create vertical gradient when specified", () => {
            const canvas = createGradientCanvas(
                100,
                20,
                DEFAULT_GRADIENT,
                false
            );
            const ctx = canvas.getContext("2d")!;

            expect(ctx.createLinearGradient).toHaveBeenCalledWith(0, 0, 0, 20);
        });
    });
});
