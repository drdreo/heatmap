/**
 * Gradient utilities for heatmap color interpolation
 */

import { DEFAULT_GRADIENT } from "./defaults";
import type { GradientStop, RGBAColor } from "./types";

/**
 * Parse a CSS color string to RGBA values
 */
export function parseColor(color: string): RGBAColor {
    // Handle rgba format
    const rgbaMatch = color.match(
        /rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*(?:,\s*([\d.]+))?\s*\)/
    );
    if (rgbaMatch) {
        return {
            r: parseInt(rgbaMatch[1], 10),
            g: parseInt(rgbaMatch[2], 10),
            b: parseInt(rgbaMatch[3], 10),
            a: rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1
        };
    }

    // Handle hex format
    const hexMatch = color.match(
        /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})?$/i
    );
    if (hexMatch) {
        return {
            r: parseInt(hexMatch[1], 16),
            g: parseInt(hexMatch[2], 16),
            b: parseInt(hexMatch[3], 16),
            a: hexMatch[4] !== undefined ? parseInt(hexMatch[4], 16) / 255 : 1
        };
    }

    // Handle short hex format
    const shortHexMatch = color.match(/^#?([a-f\d])([a-f\d])([a-f\d])$/i);
    if (shortHexMatch) {
        return {
            r: parseInt(shortHexMatch[1] + shortHexMatch[1], 16),
            g: parseInt(shortHexMatch[2] + shortHexMatch[2], 16),
            b: parseInt(shortHexMatch[3] + shortHexMatch[3], 16),
            a: 1
        };
    }

    // Default to transparent black
    return { r: 0, g: 0, b: 0, a: 0 };
}

/**
 * Interpolate between two colors
 */
function lerpColor(color1: RGBAColor, color2: RGBAColor, t: number): RGBAColor {
    return {
        r: Math.round(color1.r + (color2.r - color1.r) * t),
        g: Math.round(color1.g + (color2.g - color1.g) * t),
        b: Math.round(color1.b + (color2.b - color1.b) * t),
        a: color1.a + (color2.a - color1.a) * t
    };
}

/**
 * Generate a 256-entry color palette from gradient stops
 * This is cached and used for fast lookups during rendering
 */
export function generatePalette(
    stops: GradientStop[] = DEFAULT_GRADIENT
): Uint8ClampedArray {
    const palette = new Uint8ClampedArray(256 * 4);

    // Sort stops by offset
    const sortedStops = [...stops].sort((a, b) => a.offset - b.offset);

    // Parse all colors upfront
    const parsedStops = sortedStops.map((stop) => ({
        offset: stop.offset,
        color: parseColor(stop.color)
    }));

    // Generate 256 color entries
    for (let i = 0; i < 256; i++) {
        const t = i / 255;

        // Find the two stops to interpolate between
        let lowerStop = parsedStops[0];
        let upperStop = parsedStops[parsedStops.length - 1];

        for (let j = 0; j < parsedStops.length - 1; j++) {
            if (t >= parsedStops[j].offset && t <= parsedStops[j + 1].offset) {
                lowerStop = parsedStops[j];
                upperStop = parsedStops[j + 1];
                break;
            }
        }

        // Calculate interpolation factor between the two stops
        const range = upperStop.offset - lowerStop.offset;
        const localT = range > 0 ? (t - lowerStop.offset) / range : 0;

        // Interpolate color
        const color = lerpColor(lowerStop.color, upperStop.color, localT);

        // Store in palette (RGBA format)
        const idx = i * 4;
        palette[idx] = color.r;
        palette[idx + 1] = color.g;
        palette[idx + 2] = color.b;
        palette[idx + 3] = Math.round(color.a * 255);
    }

    return palette;
}

/**
 * Create a gradient canvas for preview/legend purposes
 */
export function createGradientCanvas(
    width: number,
    height: number,
    stops: GradientStop[] = DEFAULT_GRADIENT,
    horizontal = true
): HTMLCanvasElement {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const ctx = canvas.getContext("2d")!;
    const gradient = ctx.createLinearGradient(
        0,
        0,
        horizontal ? width : 0,
        horizontal ? 0 : height
    );

    for (const stop of stops) {
        gradient.addColorStop(stop.offset, stop.color);
    }

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    return canvas;
}
