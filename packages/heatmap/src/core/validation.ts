/**
 * Configuration Validation
 *
 * Validates heatmap configuration options and provides helpful error messages.
 */

import { DEFAULT_CONFIG, type HeatmapConfig } from "./types";

/**
 * Validated and resolved configuration values
 */
export interface ResolvedConfig {
    width: number;
    height: number;
    radius: number;
    blur: number;
    maxOpacity: number;
    minOpacity: number;
    gridSize: number;
    blendMode: GlobalCompositeOperation;
    intensityExponent: number;
}

/**
 * Validate and resolve configuration options.
 * Applies defaults and throws descriptive errors for invalid values.
 *
 * @param config - The heatmap configuration to validate
 * @returns Resolved configuration with all values populated
 * @throws Error if any option is invalid
 */
export function validateConfig(config: HeatmapConfig): ResolvedConfig {
    const width = config.width ?? config.container.offsetWidth;
    const height = config.height ?? config.container.offsetHeight;
    const radius = config.radius ?? DEFAULT_CONFIG.radius;
    const blur = config.blur ?? DEFAULT_CONFIG.blur;
    const maxOpacity = config.maxOpacity ?? DEFAULT_CONFIG.maxOpacity;
    const minOpacity = config.minOpacity ?? DEFAULT_CONFIG.minOpacity;
    const gridSize = config.gridSize ?? DEFAULT_CONFIG.gridSize;
    const blendMode = config.blendMode ?? DEFAULT_CONFIG.blendMode;
    const intensityExponent = config.intensityExponent ?? DEFAULT_CONFIG.intensityExponent;

    validateBlur(blur);
    validateRadius(radius);
    validateOpacity(minOpacity, maxOpacity);
    validateGridSize(gridSize);
    validateIntensityExponent(intensityExponent);

    return { width, height, radius, blur, maxOpacity, minOpacity, gridSize, blendMode, intensityExponent };
}

/**
 * Validate blur value is within 0-1 range
 */
function validateBlur(blur: number): void {
    if (blur < 0 || blur > 1) {
        throw new Error(
            `Invalid blur value: ${blur}. Must be between 0 and 1.`
        );
    }
}

/**
 * Validate radius is a positive number
 */
function validateRadius(radius: number): void {
    if (radius <= 0) {
        throw new Error(
            `Invalid radius value: ${radius}. Must be greater than 0.`
        );
    }
}

/**
 * Validate opacity values are within 0-1 range and min <= max
 */
function validateOpacity(minOpacity: number, maxOpacity: number): void {
    if (maxOpacity < 0 || maxOpacity > 1) {
        throw new Error(
            `Invalid maxOpacity value: ${maxOpacity}. Must be between 0 and 1.`
        );
    }
    if (minOpacity < 0 || minOpacity > 1) {
        throw new Error(
            `Invalid minOpacity value: ${minOpacity}. Must be between 0 and 1.`
        );
    }
    if (minOpacity > maxOpacity) {
        throw new Error(
            `Invalid opacity values: minOpacity (${minOpacity}) cannot be greater than maxOpacity (${maxOpacity}).`
        );
    }
}

/**
 * Validate grid size is a positive integer
 */
function validateGridSize(gridSize: number): void {
    if (gridSize <= 0 || !Number.isInteger(gridSize)) {
        throw new Error(
            `Invalid gridSize value: ${gridSize}. Must be a positive integer.`
        );
    }
}

/**
 * Validate intensity exponent is a positive number
 */
function validateIntensityExponent(intensityExponent: number): void {
    if (intensityExponent <= 0) {
        throw new Error(
            `Invalid intensityExponent value: ${intensityExponent}. Must be greater than 0.`
        );
    }
}

