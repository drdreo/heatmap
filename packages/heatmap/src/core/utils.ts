/**
 * Shared utility functions for the heatmap core
 */

/**
 * Compute min/max values from an array of values
 * 
 * @param values - Array of numeric values
 * @returns Object with min and max, or default values if array is empty
 */
export function computeMinMax(values: number[]): { min: number; max: number } {
    if (values.length === 0) {
        return { min: 0, max: 100 };
    }
    
    return {
        min: Math.min(...values),
        max: Math.max(...values)
    };
}
