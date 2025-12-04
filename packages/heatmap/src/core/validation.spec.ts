import { describe, expect, it, beforeEach } from "vitest";
import { validateConfig } from "./validation";
import { DEFAULT_CONFIG } from "./types";

describe("validateConfig", () => {
    let container: HTMLDivElement;

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
    });

    describe("default values", () => {
        it("should resolve container dimensions when not specified", () => {
            const result = validateConfig({ container });

            expect(result.width).toBe(300);
            expect(result.height).toBe(200);
        });

        it("should use default radius when not specified", () => {
            const result = validateConfig({ container });

            expect(result.radius).toBe(DEFAULT_CONFIG.radius);
        });

        it("should use default blur when not specified", () => {
            const result = validateConfig({ container });

            expect(result.blur).toBe(DEFAULT_CONFIG.blur);
        });

        it("should use default opacity values when not specified", () => {
            const result = validateConfig({ container });

            expect(result.maxOpacity).toBe(DEFAULT_CONFIG.maxOpacity);
            expect(result.minOpacity).toBe(DEFAULT_CONFIG.minOpacity);
        });

        it("should use custom values when specified", () => {
            const result = validateConfig({
                container,
                width: 500,
                height: 400,
                radius: 30,
                blur: 0.5,
                maxOpacity: 0.9,
                minOpacity: 0.1
            });

            expect(result.width).toBe(500);
            expect(result.height).toBe(400);
            expect(result.radius).toBe(30);
            expect(result.blur).toBe(0.5);
            expect(result.maxOpacity).toBe(0.9);
            expect(result.minOpacity).toBe(0.1);
        });
    });

    describe("blur validation", () => {
        it("should accept blur = 0 (no blur)", () => {
            expect(() => validateConfig({ container, blur: 0 })).not.toThrow();
        });

        it("should accept blur = 1 (maximum blur)", () => {
            expect(() => validateConfig({ container, blur: 1 })).not.toThrow();
        });

        it("should accept blur values between 0 and 1", () => {
            expect(() =>
                validateConfig({ container, blur: 0.5 })
            ).not.toThrow();
            expect(() =>
                validateConfig({ container, blur: 0.85 })
            ).not.toThrow();
        });

        it("should throw error when blur is less than 0", () => {
            expect(() => validateConfig({ container, blur: -0.1 })).toThrow(
                "Invalid blur value: -0.1. Must be between 0 and 1."
            );
        });

        it("should throw error when blur is greater than 1", () => {
            expect(() => validateConfig({ container, blur: 1.5 })).toThrow(
                "Invalid blur value: 1.5. Must be between 0 and 1."
            );
        });

        it("should throw error for large invalid blur values", () => {
            expect(() => validateConfig({ container, blur: 30 })).toThrow(
                "Invalid blur value: 30. Must be between 0 and 1."
            );
        });
    });

    describe("radius validation", () => {
        it("should accept positive radius values", () => {
            expect(() =>
                validateConfig({ container, radius: 1 })
            ).not.toThrow();
            expect(() =>
                validateConfig({ container, radius: 25 })
            ).not.toThrow();
            expect(() =>
                validateConfig({ container, radius: 100 })
            ).not.toThrow();
        });

        it("should throw error when radius is 0", () => {
            expect(() => validateConfig({ container, radius: 0 })).toThrow(
                "Invalid radius value: 0. Must be greater than 0."
            );
        });

        it("should throw error when radius is negative", () => {
            expect(() => validateConfig({ container, radius: -10 })).toThrow(
                "Invalid radius value: -10. Must be greater than 0."
            );
        });
    });

    describe("opacity validation", () => {
        it("should accept maxOpacity = 0", () => {
            expect(() =>
                validateConfig({ container, maxOpacity: 0, minOpacity: 0 })
            ).not.toThrow();
        });

        it("should accept maxOpacity = 1", () => {
            expect(() =>
                validateConfig({ container, maxOpacity: 1 })
            ).not.toThrow();
        });

        it("should accept minOpacity = 0", () => {
            expect(() =>
                validateConfig({ container, minOpacity: 0 })
            ).not.toThrow();
        });

        it("should accept minOpacity = 1", () => {
            expect(() =>
                validateConfig({ container, minOpacity: 1, maxOpacity: 1 })
            ).not.toThrow();
        });

        it("should accept minOpacity equal to maxOpacity", () => {
            expect(() =>
                validateConfig({ container, minOpacity: 0.5, maxOpacity: 0.5 })
            ).not.toThrow();
        });

        it("should throw error when maxOpacity is less than 0", () => {
            expect(() =>
                validateConfig({ container, maxOpacity: -0.1 })
            ).toThrow(
                "Invalid maxOpacity value: -0.1. Must be between 0 and 1."
            );
        });

        it("should throw error when maxOpacity is greater than 1", () => {
            expect(() =>
                validateConfig({ container, maxOpacity: 1.5 })
            ).toThrow(
                "Invalid maxOpacity value: 1.5. Must be between 0 and 1."
            );
        });

        it("should throw error when minOpacity is less than 0", () => {
            expect(() =>
                validateConfig({ container, minOpacity: -0.1 })
            ).toThrow(
                "Invalid minOpacity value: -0.1. Must be between 0 and 1."
            );
        });

        it("should throw error when minOpacity is greater than 1", () => {
            expect(() =>
                validateConfig({ container, minOpacity: 1.5 })
            ).toThrow(
                "Invalid minOpacity value: 1.5. Must be between 0 and 1."
            );
        });

        it("should throw error when minOpacity is greater than maxOpacity", () => {
            expect(() =>
                validateConfig({ container, minOpacity: 0.8, maxOpacity: 0.5 })
            ).toThrow(
                "Invalid opacity values: minOpacity (0.8) cannot be greater than maxOpacity (0.5)."
            );
        });
    });
});
