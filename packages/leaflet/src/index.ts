/**
 * Leaflet Heatmap Integration
 *
 * A dedicated factory for creating heatmaps on Leaflet maps.
 * Handles container management, coordinate conversion, and map synchronization.
 *
 * @packageDocumentation
 *
 * @example
 * ```ts
 * import { LeafletMap, TileLayer } from 'leaflet';
 * import { createLeafletHeatmap } from '@drdreo/heatmap-leaflet';
 * import { withWebGLRenderer, GRADIENT_THERMAL } from '@drdreo/heatmap';
 *
 * // Create Leaflet map
 * const map = new LeafletMap('map').setView([51.505, -0.09], 13);
 * new TileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);
 *
 * // Create heatmap - container is managed automatically
 * const heatmap = createLeafletHeatmap(map, {
 *     radius: 25,
 *     gradient: GRADIENT_THERMAL,
 *     scaleRadius: true
 * }, withWebGLRenderer());
 *
 * // Use geographic coordinates
 * heatmap.setLatLngData([
 *     { lat: 51.5, lng: -0.09, value: 100 },
 *     { lat: 51.51, lng: -0.1, value: 50 }
 * ]);
 * ```
 */

// Export types
export type {
    LeafletHeatmapPoint,
    LeafletHeatmapData,
    LeafletHeatmapConfig,
    LeafletHeatmap
} from "./types";

// Export factory function
export { createLeafletHeatmap } from "./leaflet";
