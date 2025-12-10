/**
 * WebGL Renderer
 *
 * High-performance WebGL-based heatmap renderer for large datasets.
 * Uses a two-pass approach like Canvas2D:
 * 1. First pass: Render grayscale intensity to a framebuffer (with additive blending)
 * 2. Second pass: Colorize based on accumulated intensity
 *
 * Falls back to Canvas2D if WebGL is not available.
 */

import { generatePalette } from "./gradient";
import { DEFAULT_GRADIENT } from "./defaults";
import { createCanvas2DRenderer, generateOpacityLUT } from "./render-pipeline";
import type {
    GradientStop,
    HeatmapRenderer,
    RenderablePoint,
    RenderBoundaries,
    RendererFeature
} from "./types";
import { FeatureKind } from "./types";
import { validateConfig, type ResolvedConfig } from "./validation";

/**
 * Configuration for the WebGL renderer
 */
export interface WebGLRendererConfig {
    /** Whether to use antialiasing (default: true) */
    antialias?: boolean;
    /** Whether to fall back to Canvas2D if WebGL is unavailable (default: true) */
    fallback?: boolean;
}

// Vertex shader for intensity pass - draws points as quads
const INTENSITY_VERTEX_SHADER = `
    attribute vec2 a_position;
    attribute float a_alpha;
    
    uniform vec2 u_resolution;
    uniform float u_pointSize;
    
    varying float v_alpha;
    
    void main() {
        // Convert from pixels to clip space (-1 to 1)
        vec2 clipSpace = (a_position / u_resolution) * 2.0 - 1.0;
        // Flip Y axis (canvas has Y down, WebGL has Y up)
        gl_Position = vec4(clipSpace.x, -clipSpace.y, 0.0, 1.0);
        gl_PointSize = u_pointSize;
        v_alpha = a_alpha;
    }
`;

// Fragment shader for intensity pass - draws grayscale radial gradient points
const INTENSITY_FRAGMENT_SHADER = `
    precision mediump float;
    
    varying float v_alpha;
    
    uniform float u_blur;
    
    void main() {
        // Calculate distance from center of point (gl_PointCoord is 0-1)
        vec2 center = gl_PointCoord - vec2(0.5);
        float dist = length(center) * 2.0;
        
        if (dist > 1.0) {
            discard;
        }
        
        // Apply blur factor to create gradient
        float blurFactor = 1.0 - u_blur;
        float innerRadius = blurFactor;
        
        // Calculate falloff using smoothstep for a more natural heatmap look
        float falloff;
        if (blurFactor >= 1.0) {
            // No blur - solid circle
            falloff = 1.0;
        } else if (dist <= innerRadius) {
            // Inside inner radius - full opacity
            falloff = 1.0;
        } else {
            // Smooth gradient from inner to outer radius using smoothstep
            float t = (dist - innerRadius) / (1.0 - innerRadius);
            falloff = 1.0 - smoothstep(0.0, 1.0, t);
        }
        
        // Output grayscale intensity (will be accumulated via additive blending)
        float intensity = v_alpha * falloff;
        gl_FragColor = vec4(intensity, intensity, intensity, intensity);
    }
`;

// Vertex shader for colorize pass - full screen quad
const COLORIZE_VERTEX_SHADER = `
    attribute vec2 a_position;
    varying vec2 v_texCoord;
    
    void main() {
        gl_Position = vec4(a_position, 0.0, 1.0);
        // Convert from clip space (-1 to 1) to texture coords (0 to 1)
        v_texCoord = (a_position + 1.0) / 2.0;
    }
`;

// Fragment shader for colorize pass - applies palette based on intensity
const COLORIZE_FRAGMENT_SHADER = `
    precision mediump float;
    
    varying vec2 v_texCoord;
    
    uniform sampler2D u_intensityTexture;
    uniform sampler2D u_palette;
    uniform float u_minOpacity;
    uniform float u_maxOpacity;
    
    void main() {
        // Sample raw accumulated intensity from framebuffer
        float rawIntensity = texture2D(u_intensityTexture, v_texCoord).r;
        
        if (rawIntensity < 0.001) {
            discard;
        }
        
        // Apply smoothstep to map the accumulated intensity to a more natural gradient distribution
        // This creates a smooth S-curve that spreads colors across the gradient better
        // Values accumulate beyond 1.0 but we clamp after applying smoothstep
        float intensity = smoothstep(0.0, 1.0, rawIntensity);
        
        // Look up color from palette texture (256 colors)
        vec4 color = texture2D(u_palette, vec2(intensity, 0.5));
        
        // Apply opacity range using smoothstep for gradual fade-in
        float opacity = smoothstep(u_minOpacity, u_maxOpacity, intensity);
        
        gl_FragColor = vec4(color.rgb, opacity);
    }
`;

/**
 * Compile a shader
 */
function compileShader(
    gl: WebGLRenderingContext,
    type: number,
    source: string
): WebGLShader | null {
    const shader = gl.createShader(type);
    if (!shader) return null;

    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error("Shader compile error:", gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
    }

    return shader;
}

/**
 * Create and link a shader program
 */
function createProgram(
    gl: WebGLRenderingContext,
    vertexShader: WebGLShader,
    fragmentShader: WebGLShader
): WebGLProgram | null {
    const program = gl.createProgram();
    if (!program) return null;

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error("Program link error:", gl.getProgramInfoLog(program));
        gl.deleteProgram(program);
        return null;
    }

    return program;
}

/**
 * Create a palette texture from Uint8ClampedArray
 */
function createPaletteTexture(
    gl: WebGLRenderingContext,
    palette: Uint8ClampedArray
): WebGLTexture | null {
    const texture = gl.createTexture();
    if (!texture) return null;

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        256,
        1,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        palette
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    return texture;
}

/**
 * Create a framebuffer with a texture attachment
 */
function createFramebuffer(
    gl: WebGLRenderingContext,
    width: number,
    height: number
): { framebuffer: WebGLFramebuffer; texture: WebGLTexture } | null {
    const framebuffer = gl.createFramebuffer();
    if (!framebuffer) return null;

    const texture = gl.createTexture();
    if (!texture) {
        gl.deleteFramebuffer(framebuffer);
        return null;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        width,
        height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        null
    );
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER,
        gl.COLOR_ATTACHMENT0,
        gl.TEXTURE_2D,
        texture,
        0
    );

    // Check framebuffer status
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error("Framebuffer incomplete:", status);
        gl.deleteFramebuffer(framebuffer);
        gl.deleteTexture(texture);
        return null;
    }

    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    return { framebuffer, texture };
}

/**
 * Check if WebGL is available
 */
export function isWebGLAvailable(): boolean {
    try {
        const canvas = document.createElement("canvas");
        return !!(
            canvas.getContext("webgl") ||
            canvas.getContext("experimental-webgl")
        );
    } catch {
        return false;
    }
}

/**
 * Create a WebGL-based renderer
 */
export function createWebGLRenderer(
    config: ResolvedConfig,
    gradient: GradientStop[] = DEFAULT_GRADIENT,
    antialias: boolean = true
): HeatmapRenderer | null {
    const { width, height, radius, blur, minOpacity, maxOpacity } = config;

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const gl = canvas.getContext("webgl", {
        antialias,
        alpha: true,
        premultipliedAlpha: false
    }) as WebGLRenderingContext | null;

    if (!gl) {
        console.warn("WebGL not available");
        return null;
    }

    // Compile intensity pass shaders
    const intensityVertexShader = compileShader(
        gl,
        gl.VERTEX_SHADER,
        INTENSITY_VERTEX_SHADER
    );
    const intensityFragmentShader = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        INTENSITY_FRAGMENT_SHADER
    );

    if (!intensityVertexShader || !intensityFragmentShader) {
        return null;
    }

    const intensityProgram = createProgram(
        gl,
        intensityVertexShader,
        intensityFragmentShader
    );
    if (!intensityProgram) {
        return null;
    }

    // Compile colorize pass shaders
    const colorizeVertexShader = compileShader(
        gl,
        gl.VERTEX_SHADER,
        COLORIZE_VERTEX_SHADER
    );
    const colorizeFragmentShader = compileShader(
        gl,
        gl.FRAGMENT_SHADER,
        COLORIZE_FRAGMENT_SHADER
    );

    if (!colorizeVertexShader || !colorizeFragmentShader) {
        return null;
    }

    const colorizeProgram = createProgram(
        gl,
        colorizeVertexShader,
        colorizeFragmentShader
    );
    if (!colorizeProgram) {
        return null;
    }

    // Get intensity program locations
    const intensityPositionLoc = gl.getAttribLocation(
        intensityProgram,
        "a_position"
    );
    const intensityAlphaLoc = gl.getAttribLocation(intensityProgram, "a_alpha");
    const intensityResolutionLoc = gl.getUniformLocation(
        intensityProgram,
        "u_resolution"
    );
    const intensityPointSizeLoc = gl.getUniformLocation(
        intensityProgram,
        "u_pointSize"
    );
    const intensityBlurLoc = gl.getUniformLocation(intensityProgram, "u_blur");

    // Get colorize program locations
    const colorizePositionLoc = gl.getAttribLocation(
        colorizeProgram,
        "a_position"
    );
    const colorizeIntensityTexLoc = gl.getUniformLocation(
        colorizeProgram,
        "u_intensityTexture"
    );
    const colorizePaletteLoc = gl.getUniformLocation(
        colorizeProgram,
        "u_palette"
    );
    const colorizeMinOpacityLoc = gl.getUniformLocation(
        colorizeProgram,
        "u_minOpacity"
    );
    const colorizeMaxOpacityLoc = gl.getUniformLocation(
        colorizeProgram,
        "u_maxOpacity"
    );

    // Create buffers
    const positionBuffer = gl.createBuffer();
    const alphaBuffer = gl.createBuffer();

    // Create full-screen quad buffer for colorize pass
    const quadBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
    gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
        gl.STATIC_DRAW
    );

    // Create framebuffer for intensity pass
    const fb = createFramebuffer(gl, width, height);
    if (!fb) {
        console.warn("Failed to create framebuffer");
        return null;
    }

    // Generate palette and create texture
    let palette = generatePalette(gradient);
    const opacityLUT = generateOpacityLUT(minOpacity, maxOpacity);
    let paletteTexture = createPaletteTexture(gl, palette);

    // Current render boundaries
    let currentBounds: RenderBoundaries = {
        minX: Infinity,
        minY: Infinity,
        maxX: 0,
        maxY: 0
    };

    gl.viewport(0, 0, width, height);

    function clear(): void {
        if (!gl) return;

        // Clear framebuffer
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb!.framebuffer);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // Clear main canvas
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        currentBounds = { minX: Infinity, minY: Infinity, maxX: 0, maxY: 0 };
    }

    function drawPoints(points: RenderablePoint[]): RenderBoundaries {
        if (!gl) {
            throw new Error("WebGL context not available");
        }
        if (points.length === 0) {
            return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
        }

        // Prepare position and alpha data
        const positions = new Float32Array(points.length * 2);
        const alphas = new Float32Array(points.length);

        currentBounds = {
            minX: Infinity,
            minY: Infinity,
            maxX: 0,
            maxY: 0
        };

        for (let i = 0; i < points.length; i++) {
            const point = points[i];
            positions[i * 2] = point.x;
            positions[i * 2 + 1] = point.y;
            alphas[i] = Math.max(0.01, point.alpha);

            // Track bounds
            const offset = radius;
            currentBounds.minX = Math.min(currentBounds.minX, point.x - offset);
            currentBounds.minY = Math.min(currentBounds.minY, point.y - offset);
            currentBounds.maxX = Math.max(currentBounds.maxX, point.x + offset);
            currentBounds.maxY = Math.max(currentBounds.maxY, point.y + offset);
        }

        // Clamp bounds
        currentBounds.minX = Math.max(0, Math.floor(currentBounds.minX));
        currentBounds.minY = Math.max(0, Math.floor(currentBounds.minY));
        currentBounds.maxX = Math.min(width, Math.ceil(currentBounds.maxX));
        currentBounds.maxY = Math.min(height, Math.ceil(currentBounds.maxY));

        // === Pass 1: Render intensity to framebuffer ===
        gl.bindFramebuffer(gl.FRAMEBUFFER, fb!.framebuffer);
        gl.useProgram(intensityProgram);

        // Enable additive blending for intensity accumulation
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ONE);

        // Set uniforms
        gl.uniform2f(intensityResolutionLoc, width, height);
        gl.uniform1f(intensityPointSizeLoc, radius * 2);
        gl.uniform1f(intensityBlurLoc, blur);

        // Upload position data
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(intensityPositionLoc);
        gl.vertexAttribPointer(intensityPositionLoc, 2, gl.FLOAT, false, 0, 0);

        // Upload alpha data
        gl.bindBuffer(gl.ARRAY_BUFFER, alphaBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, alphas, gl.DYNAMIC_DRAW);
        gl.enableVertexAttribArray(intensityAlphaLoc);
        gl.vertexAttribPointer(intensityAlphaLoc, 1, gl.FLOAT, false, 0, 0);

        // Draw points to framebuffer
        gl.drawArrays(gl.POINTS, 0, points.length);

        return currentBounds;
    }

    function colorize(_bounds?: RenderBoundaries): void {
        if (!gl) return;

        // === Pass 2: Colorize to main canvas ===
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);

        // Clear the main canvas before rendering the accumulated framebuffer
        // This is necessary because we're rendering the ENTIRE framebuffer content
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        gl.useProgram(colorizeProgram);

        // Standard alpha blending for final output
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

        // Bind intensity texture
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, fb!.texture);
        gl.uniform1i(colorizeIntensityTexLoc, 0);

        // Bind palette texture
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
        gl.uniform1i(colorizePaletteLoc, 1);

        // Set opacity uniforms
        gl.uniform1f(colorizeMinOpacityLoc, minOpacity);
        gl.uniform1f(colorizeMaxOpacityLoc, maxOpacity);

        // Draw full-screen quad
        gl.bindBuffer(gl.ARRAY_BUFFER, quadBuffer);
        gl.enableVertexAttribArray(colorizePositionLoc);
        gl.vertexAttribPointer(colorizePositionLoc, 2, gl.FLOAT, false, 0, 0);

        gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    function render(points: RenderablePoint[]): void {
        clear();
        if (points.length === 0) return;
        const bounds = drawPoints(points);
        colorize(bounds);
    }

    function setPalette(newPalette: Uint8ClampedArray): void {
        palette = newPalette;
        // Update texture
        if (gl && paletteTexture) {
            gl.bindTexture(gl.TEXTURE_2D, paletteTexture);
            gl.texImage2D(
                gl.TEXTURE_2D,
                0,
                gl.RGBA,
                256,
                1,
                0,
                gl.RGBA,
                gl.UNSIGNED_BYTE,
                palette
            );
        }
    }

    function dispose(): void {
        gl?.deleteBuffer(positionBuffer);
        gl?.deleteBuffer(alphaBuffer);
        gl?.deleteBuffer(quadBuffer);
        gl?.deleteTexture(paletteTexture);
        gl?.deleteTexture(fb!.texture);
        gl?.deleteFramebuffer(fb!.framebuffer);
        gl?.deleteProgram(intensityProgram);
        gl?.deleteProgram(colorizeProgram);
        gl?.deleteShader(intensityVertexShader);
        gl?.deleteShader(intensityFragmentShader);
        gl?.deleteShader(colorizeVertexShader);
        gl?.deleteShader(colorizeFragmentShader);
    }

    return {
        canvas,
        width,
        height,
        get palette() {
            return palette;
        },
        get opacityLUT() {
            return opacityLUT;
        },
        clear,
        drawPoints,
        colorize,
        render,
        setPalette,
        dispose
    };
}

/**
 * Create a WebGL renderer feature
 *
 * Uses GPU-accelerated rendering for better performance with large datasets.
 * Falls back to Canvas2D if WebGL is not available (configurable).
 *
 * @example
 * ```ts
 * // WebGL renderer with fallback
 * const heatmap = createHeatmap(
 *     { container, data },
 *     withWebGLRenderer()
 * );
 *
 * // WebGL renderer without fallback (will throw if unavailable)
 * const heatmap = createHeatmap(
 *     { container, data },
 *     withWebGLRenderer({ fallback: false })
 * );
 * ```
 */
export function withWebGLRenderer(
    config: WebGLRendererConfig = {}
): RendererFeature {
    const { antialias = true, fallback = true } = config;

    return {
        kind: FeatureKind.Renderer,

        setup(heatmap) {
            const resolved = validateConfig(heatmap.config);
            const gradient = heatmap.config.gradient ?? DEFAULT_GRADIENT;

            let renderer = createWebGLRenderer(resolved, gradient, antialias);
            if (!renderer) {
                if (!fallback) {
                    throw new Error("WebGL is not available");
                }
                renderer = createCanvas2DRenderer(resolved, gradient);
            }

            // Style the canvas for overlay positioning
            Object.assign(renderer.canvas.style, {
                position: "absolute",
                top: "0",
                left: "0",
                width: "100%",
                height: "100%",
                pointerEvents: "none"
            });

            heatmap.renderer = renderer;
            heatmap.container.appendChild(renderer.canvas);
        },

        teardown() {
            // Cleanup handled by heatmap.destroy()
        }
    };
}
