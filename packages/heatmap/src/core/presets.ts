/**
 * Gradient Presets
 *
 * Pre-defined gradient color schemes for common use cases.
 * Users can use these directly or as a starting point for customization.
 */

import type { GradientStop } from "./types";

/** Default gradient: transparent -> indigo -> teal -> emerald -> amber -> rose (cold to hot) */
export const GRADIENT_DEFAULT: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 0, 0)" },
    { offset: 0.2, color: "rgba(79, 70, 229, 1)" },
    { offset: 0.4, color: "rgba(20, 184, 166, 1)" },
    { offset: 0.6, color: "rgba(52, 211, 153, 1)" },
    { offset: 0.8, color: "rgba(251, 191, 36, 1)" },
    { offset: 1, color: "rgba(244, 63, 94, 1)" }
];

/** Thermal imaging style: purple -> red -> orange -> yellow -> white */
export const GRADIENT_THERMAL: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 0, 0)" },
    { offset: 0.2, color: "rgba(128, 0, 128, 1)" },
    { offset: 0.4, color: "rgba(255, 0, 0, 1)" },
    { offset: 0.6, color: "rgba(255, 165, 0, 1)" },
    { offset: 0.8, color: "rgba(255, 255, 0, 1)" },
    { offset: 1, color: "rgba(255, 255, 255, 1)" }
];

/** Cool tones: purple -> cyan -> teal */
export const GRADIENT_COOL: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 0, 0)" },
    { offset: 0.33, color: "rgba(128, 0, 255, 1)" },
    { offset: 0.66, color: "rgba(0, 255, 255, 1)" },
    { offset: 1, color: "rgba(0, 255, 128, 1)" }
];

/** Fire/heat: dark red -> orange-red -> orange -> yellow */
export const GRADIENT_FIRE: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 0, 0)" },
    { offset: 0.25, color: "rgba(139, 0, 0, 1)" },
    { offset: 0.5, color: "rgba(255, 69, 0, 1)" },
    { offset: 0.75, color: "rgba(255, 165, 0, 1)" },
    { offset: 1, color: "rgba(255, 255, 0, 1)" }
];

/** Ocean depths: dark blue -> teal -> cyan -> white */
export const GRADIENT_OCEAN: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 0, 0)" },
    { offset: 0.25, color: "rgba(0, 0, 139, 1)" },
    { offset: 0.5, color: "rgba(0, 139, 139, 1)" },
    { offset: 0.75, color: "rgba(0, 255, 255, 1)" },
    { offset: 1, color: "rgba(255, 255, 255, 1)" }
];

/** Monochrome grayscale: transparent black -> white */
export const GRADIENT_GRAYSCALE: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 0, 0)" },
    { offset: 0.25, color: "rgba(64, 64, 64, 1)" },
    { offset: 0.5, color: "rgba(128, 128, 128, 1)" },
    { offset: 0.75, color: "rgba(192, 192, 192, 1)" },
    { offset: 1, color: "rgba(255, 255, 255, 1)" }
];

/** Sunset colors: purple -> magenta -> orange -> yellow */
export const GRADIENT_SUNSET: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 0, 0)" },
    { offset: 0.25, color: "rgba(75, 0, 130, 1)" },
    { offset: 0.5, color: "rgba(255, 20, 147, 1)" },
    { offset: 0.75, color: "rgba(255, 140, 0, 1)" },
    { offset: 1, color: "rgba(255, 215, 0, 1)" }
];

/** Viridis-inspired scientific visualization: purple -> blue -> green -> yellow */
export const GRADIENT_VIRIDIS: GradientStop[] = [
    { offset: 0, color: "rgba(0, 0, 0, 0)" },
    { offset: 0.25, color: "rgba(68, 1, 84, 1)" },
    { offset: 0.5, color: "rgba(33, 145, 140, 1)" },
    { offset: 0.75, color: "rgba(94, 201, 98, 1)" },
    { offset: 1, color: "rgba(253, 231, 37, 1)" }
];

/**
 * Collection of all gradient presets for easy access
 */
export const GRADIENT_PRESETS = {
    default: GRADIENT_DEFAULT,
    thermal: GRADIENT_THERMAL,
    cool: GRADIENT_COOL,
    fire: GRADIENT_FIRE,
    ocean: GRADIENT_OCEAN,
    grayscale: GRADIENT_GRAYSCALE,
    sunset: GRADIENT_SUNSET,
    viridis: GRADIENT_VIRIDIS
} as const;

/** Available gradient preset names */
export type GradientPresetName = keyof typeof GRADIENT_PRESETS;
