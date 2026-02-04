/**
 * Leaflet Heatmap Types
 *
 */

import type { Heatmap, HeatmapConfig } from "@drdreo/heatmap";
import type { LatLng, LeafletMap } from "leaflet";

/** A heatmap point with geographic coordinates */
export interface LeafletHeatmapPoint {
    /** Latitude coordinate */
    lat: number;
    /** Longitude coordinate */
    lng: number;
    /** Value at this point (e.g., intensity, count) */
    value: number;
}

/** Data type for Leaflet heatmap - array of geographic points */
export type LeafletHeatmapData = LeafletHeatmapPoint[];

/**
 * Configuration for the Leaflet heatmap.
 * Extends core HeatmapConfig but container is managed internally.
 */
export interface LeafletHeatmapConfig extends Omit<
    HeatmapConfig,
    "container" | "width" | "height" | "data"
> {
    /**
     * Scale the radius based on zoom level.
     * When true, the radius will increase/decrease with zoom.
     * When false, radius remains constant regardless of zoom.
     * @default false
     */
    scaleRadius?: boolean;

    /**
     * Base zoom level for radius scaling.
     * The radius value will be used as-is at this zoom level.
     * Only applies when scaleRadius is true.
     * @default 10
     */
    scaleRadiusBaseZoom?: number;
}

/**
 * Leaflet heatmap instance with geographic data methods.
 */
export interface LeafletHeatmap extends Heatmap {
    /**
     * Set geographic data points.
     * Automatically converts lat/lng to pixel coordinates based on current map view.
     * @param data Array of geographic points
     */
    setLatLngData(data: LeafletHeatmapData): void;

    /**
     * Add geographic data point(s) incrementally.
     * @param pointOrPoints Single point or array of points
     */
    addLatLngData(
        pointOrPoints: LeafletHeatmapPoint | LeafletHeatmapPoint[]
    ): void;

    /**
     * Get all current geographic data points.
     */
    getLatLngData(): LeafletHeatmapPoint[];

    /**
     * Get interpolated value at a specific geographic location.
     * @param latlng The geographic point to query
     * @returns The interpolated value at that location, or 0 if out of bounds
     */
    getValueAtLatLng(latlng: LatLng): number;

    /**
     * Clear all geographic data and the heatmap.
     */
    clearLatLngData(): void;
}
