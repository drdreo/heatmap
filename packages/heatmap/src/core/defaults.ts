/**
 * Default Configuration Values
 *
 * All default values for the heatmap library in one place.
 */

import { GRADIENT_DEFAULT } from "./presets";

/** Default gradient (re-exported from presets for convenience) */
export const DEFAULT_GRADIENT = GRADIENT_DEFAULT;

/** Default configuration options */
export const DEFAULT_CONFIG = {
    radius: 25,
    blur: 0.85,
    maxOpacity: 0.8,
    minOpacity: 0,
    useOffscreenCanvas: true,
    gridSize: 10,
    blendMode: "source-over" as GlobalCompositeOperation,
    intensityExponent: 1
} as const;

