/**
 * Leaflet Heatmap Integration
 *
 * Creates a heatmap that integrates with a Leaflet map.
 * Handles container creation, coordinate conversion, and map event synchronization.
 */

import { LatLng } from "leaflet";
import type { LeafletMap } from "leaflet";
import { createHeatmap, type Heatmap, type HeatmapFeature, type HeatmapPoint } from "@drdreo/heatmap";
import type {
    LeafletHeatmapConfig,
    LeafletHeatmap,
    LeafletHeatmapData,
    LeafletHeatmapPoint
} from "./types";

/** Default configuration values */
const DEFAULTS = {
    scaleRadius: false,
    scaleRadiusBaseZoom: 10
} as const;

/**
 * Create a heatmap integrated with a Leaflet map.
 *
 * @param map The Leaflet map instance
 * @param config Heatmap configuration (container is managed internally)
 * @param features Optional heatmap features (withWebGLRenderer, withLegend, etc.)
 * @returns A LeafletHeatmap instance with geographic data methods
 */
export function createLeafletHeatmap(
    map: LeafletMap,
    config: LeafletHeatmapConfig = {},
    ...features: HeatmapFeature[]
): LeafletHeatmap {
    const scaleRadius = config.scaleRadius ?? DEFAULTS.scaleRadius;
    const scaleRadiusBaseZoom = config.scaleRadiusBaseZoom ?? DEFAULTS.scaleRadiusBaseZoom;

    // Store geographic data
    let latlngData: LeafletHeatmapPoint[] = [];

    // Animation frame ID for throttling renders
    let renderFrameId: number | null = null;
    let pendingRender = false;

    // Get initial map size
    const size = map.getSize();

    // Create container - append to map container directly, not overlay pane
    // This gives us a fixed position overlay that doesn't move with the map
    const container = document.createElement("div");
    container.className = "leaflet-heatmap-container";
    Object.assign(container.style, {
        position: "absolute",
        top: "0",
        left: "0",
        width: `${size.x}px`,
        height: `${size.y}px`,
        pointerEvents: "none",
        zIndex: "400" // Above tiles, below markers
    });

    // Append to the map's container element
    const mapContainer = map.getContainer();
    mapContainer.appendChild(container);

    // Extract core heatmap config (remove Leaflet-specific options)
    const { scaleRadius: _, scaleRadiusBaseZoom: __, ...coreConfig } = config;

    // Create the underlying heatmap
    const heatmap = createHeatmap(
        {
            ...coreConfig,
            container,
            width: size.x,
            height: size.y
        },
        ...features
    ) as LeafletHeatmap;

    /**
     * Convert geographic points to pixel coordinates.
     * Optimized to filter points in a single pass and avoid unnecessary object creation.
     */
    function projectPoints(): HeatmapPoint[] {
        const zoom = map.getZoom();
        const baseRadius = config.radius ?? 25;

        // Calculate radius scale factor based on zoom
        const radiusScale = scaleRadius ? Math.pow(2, zoom - scaleRadiusBaseZoom) : 1;
        const scaledRadius = baseRadius * radiusScale;

        const mapSize = map.getSize();
        const padding = scaledRadius * 2;

        // Get visible bounds in lat/lng for early filtering
        const bounds = map.getBounds();
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();

        // Add padding to bounds (approximate degrees based on zoom)
        // At zoom 10, roughly 0.01 degrees per pixel
        const degreesPerPixel = 180 / (256 * Math.pow(2, zoom));
        const latPadding = padding * degreesPerPixel;
        const lngPadding = padding * degreesPerPixel;

        const minLat = sw.lat - latPadding;
        const maxLat = ne.lat + latPadding;
        const minLng = sw.lng - lngPadding;
        const maxLng = ne.lng + lngPadding;

        const result: HeatmapPoint[] = [];
        const len = latlngData.length;

        // Single pass: filter by bounds then project
        for (let i = 0; i < len; i++) {
            const point = latlngData[i];

            // Early geographic bounds check (faster than projecting all points)
            if (
                point.lat < minLat ||
                point.lat > maxLat ||
                point.lng < minLng ||
                point.lng > maxLng
            ) {
                continue;
            }

            // Project to pixel coordinates (reuse point object pattern)
            const pixel = map.latLngToContainerPoint(point);

            // Secondary pixel bounds check for edge cases
            if (
                pixel.x >= -padding &&
                pixel.x <= mapSize.x + padding &&
                pixel.y >= -padding &&
                pixel.y <= mapSize.y + padding
            ) {
                result.push({
                    x: pixel.x,
                    y: pixel.y,
                    value: point.value
                });
            }
        }

        return result;
    }

    /**
     * Re-render the heatmap with current geographic data.
     * Uses requestAnimationFrame throttling to avoid excessive renders during rapid map movements.
     */
    function render(): void {
        // Skip if already pending
        if (pendingRender) {
            return;
        }

        pendingRender = true;

        // Cancel any existing frame
        if (renderFrameId !== null) {
            cancelAnimationFrame(renderFrameId);
        }

        renderFrameId = requestAnimationFrame(() => {
            pendingRender = false;
            renderFrameId = null;

            const heatmapPoints = projectPoints();
            heatmap.setData(heatmapPoints);
        });
    }

    /**
     * Render immediately without throttling (for resize and initial render)
     */
    function renderImmediate(): void {
        // Cancel any pending throttled render
        if (renderFrameId !== null) {
            cancelAnimationFrame(renderFrameId);
            renderFrameId = null;
        }
        pendingRender = false;

        const heatmapPoints = projectPoints();
        heatmap.setData(heatmapPoints);
    }

    /**
     * Handle map resize
     */
    function handleResize(): void {
        const newSize = map.getSize();

        // Update container size
        container.style.width = `${newSize.x}px`;
        container.style.height = `${newSize.y}px`;

        // Resize the heatmap canvas if method exists
        if ("resize" in heatmap && typeof heatmap.resize === "function") {
            (heatmap as Heatmap & { resize: (w: number, h: number) => void }).resize(newSize.x, newSize.y);
        }

        renderImmediate();
    }

    // Register map event listeners
    // Use 'move' for smooth updates during pan, 'moveend' for final position
    const onMove = () => render();
    const onZoom = () => render();
    const onResize = () => handleResize();

    map.on("move", onMove);
    map.on("zoom", onZoom);
    map.on("resize", onResize);

    // Initial render
    render();

    // Extend heatmap with Leaflet-specific methods
    heatmap.setLatLngData = (data: LeafletHeatmapData): void => {
        latlngData = [...data];
        render();
    };

    heatmap.addLatLngData = (
        pointOrPoints: LeafletHeatmapPoint | LeafletHeatmapPoint[]
    ): void => {
        const points = Array.isArray(pointOrPoints) ? pointOrPoints : [pointOrPoints];
        latlngData.push(...points);
        render();
    };

    heatmap.getLatLngData = (): LeafletHeatmapPoint[] => {
        return [...latlngData];
    };

    heatmap.getValueAtLatLng = (latlng: LatLng): number => {
        const pixel = map.latLngToContainerPoint(latlng);
        return heatmap.getValueAt(pixel.x, pixel.y);
    };

    heatmap.clearLatLngData = (): void => {
        latlngData = [];
        heatmap.clear();
    };

    // Override destroy to clean up Leaflet bindings
    const originalDestroy = heatmap.destroy.bind(heatmap);
    heatmap.destroy = (): void => {
        // Cancel any pending animation frame
        if (renderFrameId !== null) {
            cancelAnimationFrame(renderFrameId);
            renderFrameId = null;
        }

        // Remove event listeners
        map.off("move", onMove);
        map.off("zoom", onZoom);
        map.off("resize", onResize);

        // Remove container from DOM
        container.remove();

        // Clear data
        latlngData = [];

        // Call original destroy
        originalDestroy();
    };

    return heatmap;
}

