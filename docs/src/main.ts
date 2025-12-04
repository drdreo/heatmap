import {
    type AnimatedHeatmap,
    createHeatmap,
    GRADIENT_PRESETS,
    type GradientPresetName,
    type Heatmap,
    type HeatmapPoint,
    withAnimation,
    withTooltip
} from "@drdreo/heatmap";
import "./style.css";

// ============================================================================
// BASIC DEMO
// ============================================================================

const basicContainer = document.querySelector<HTMLElement>(
    "#basic-heatmap-container"
)!;
const basicWidth = basicContainer.clientWidth;
const basicHeight = basicContainer.clientHeight;

const basicConfig = {
    container: basicContainer,
    width: basicWidth,
    height: basicHeight
};

const basicHeatmap = createHeatmap(basicConfig);

// Initialize with some data
const initialBasicData: HeatmapPoint[] = [
    { x: 200, y: 20, value: 80 },
    { x: 250, y: 180, value: 60 },
    { x: 300, y: 220, value: 90 },
    { x: 500, y: 150, value: 70 },
    { x: 550, y: 180, value: 85 },
    { x: 400, y: 30, value: 50 }
];

basicHeatmap.setData({ min: 0, max: 100, data: initialBasicData });
updateBasicPointCount(initialBasicData.length);

let basicPointCount = initialBasicData.length;
let showStats = false;

function updateBasicPointCount(count: number) {
    const el = document.getElementById("basic-point-count");
    if (el) el.textContent = `Points: ${count}`;
}

function updateStatsDisplay() {
    if (!showStats) return;

    const stats = basicHeatmap.getStats();

    // Update each stat element
    const setStatValue = (id: string, value: string | number) => {
        const el = document.getElementById(id);
        if (el) el.textContent = String(value);
    };

    setStatValue("stat-point-count", stats.pointCount);
    setStatValue("stat-radius", stats.radius);
    setStatValue("stat-grid-size", stats.valueGridSize);
    setStatValue(
        "stat-data-range",
        stats.dataRange
            ? `${stats.dataRange.min.toFixed(1)} - ${stats.dataRange.max.toFixed(1)}`
            : "-"
    );
    setStatValue(
        "stat-canvas-size",
        `${stats.canvasSize.width} × ${stats.canvasSize.height}`
    );

    const bounds = stats.renderBoundaries;
    setStatValue(
        "stat-render-bounds",
        `(${bounds.minX.toFixed(0)}, ${bounds.minY.toFixed(0)}) → (${bounds.maxX.toFixed(0)}, ${bounds.maxY.toFixed(0)}) [${bounds.width.toFixed(0)} × ${bounds.height.toFixed(0)}]`
    );

    setStatValue("stat-coverage", `${stats.renderCoveragePercent.toFixed(1)}%`);
}

// Toggle stats panel
document.getElementById("basic-show-stats")?.addEventListener("change", (e) => {
    showStats = (e.target as HTMLInputElement).checked;
    const panel = document.getElementById("basic-stats-panel");
    if (panel) {
        panel.classList.toggle("hidden", !showStats);
    }
    if (showStats) {
        updateStatsDisplay();
    }
});

// Click to add points
basicContainer.addEventListener("click", (event) => {
    const rect = basicHeatmap.canvas.getBoundingClientRect();
    const scaleX = basicHeatmap.width / rect.width;
    const scaleY = basicHeatmap.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    basicHeatmap.addPoint({ x, y, value: Math.random() * 100 });
    basicPointCount++;
    updateBasicPointCount(basicPointCount);
    updateStatsDisplay();
});

// Clear button
document.getElementById("basic-clear-btn")?.addEventListener("click", () => {
    basicHeatmap.clear();
    basicPointCount = 0;
    updateBasicPointCount(basicPointCount);
    updateStatsDisplay();
});

// Random points button
document.getElementById("basic-random-btn")?.addEventListener("click", () => {
    const points = generateRandomPoints(200, basicWidth, basicHeight);
    basicHeatmap.addPoints(points);
    basicPointCount += points.length;
    updateBasicPointCount(basicPointCount);
    updateStatsDisplay();
});

// ============================================================================
// TOOLTIP DEMO
// ============================================================================

const tooltipConfig = {
    container: document.querySelector<HTMLElement>(
        "#tooltip-heatmap-container"
    )!,
    gridSize: 10
};

const tooltipDemoWidth = tooltipConfig.container.clientWidth;
const tooltipDemoHeight = tooltipConfig.container.clientHeight;

const tooltipHeatmap = createHeatmap(
    tooltipConfig,
    withTooltip({
        formatter: (value, x, y) =>
            `Value: ${value.toFixed(1)} @ (${Math.round(x)}, ${Math.round(y)})`,
        offset: { x: 15, y: 15 },
        className: "with-tooltip",
        enforceBounds: true
    })
);

// Initialize with clustered data for better tooltip demo
const tooltipInitialData: HeatmapPoint[] = [
    // Cluster 1
    { x: 150, y: 150, value: 95 },
    { x: 170, y: 140, value: 80 },
    { x: 160, y: 170, value: 70 },
    { x: 140, y: 160, value: 85 },
    // Cluster 2
    { x: 400, y: 200, value: 100 },
    { x: 420, y: 190, value: 90 },
    { x: 380, y: 210, value: 75 },
    { x: 410, y: 220, value: 88 },
    // Cluster 3
    { x: 650, y: 300, value: 70 },
    { x: 630, y: 280, value: 65 },
    { x: 670, y: 310, value: 60 }
];

tooltipHeatmap.setData({ min: 0, max: 100, data: tooltipInitialData });

// Click to add points
tooltipHeatmap.canvas.addEventListener("click", (event) => {
    const rect = tooltipHeatmap.canvas.getBoundingClientRect();
    const scaleX = tooltipHeatmap.width / rect.width;
    const scaleY = tooltipHeatmap.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    tooltipHeatmap.addPoint({ x, y, value: Math.random() * 100 });
});

document.getElementById("tooltip-clear-btn")?.addEventListener("click", () => {
    tooltipHeatmap.clear();
});

document.getElementById("tooltip-random-btn")?.addEventListener("click", () => {
    tooltipHeatmap.addPoints(
        generateRandomPoints(100, tooltipDemoWidth, tooltipDemoHeight)
    );
});

// ============================================================================
// ANIMATION DEMO
// ============================================================================

const animationContainer = document.querySelector<HTMLElement>(
    "#animation-heatmap-container"
)!;
const animationConfig = {
    container: animationContainer
};

const animatedHeatmap = createHeatmap(
    animationConfig,
    withAnimation({
        fadeOutDuration: 2000,
        timeWindow: 3000,
        playbackSpeed: 1,
        loop: false,
        onFrame: (timestamp, progress) => {
            updateAnimationUI(timestamp, progress);
        },
        onComplete: () => {
            updateAnimationState("idle");
        }
    })
) as AnimatedHeatmap;

// Generate temporal data simulating activity over 30 seconds
function generateTemporalData() {
    const duration = 30000; // 30 seconds
    const data = [];
    const numPoints = 1000;

    for (let i = 0; i < numPoints; i++) {
        const timestamp = Math.random() * duration;
        // Create some clustering patterns
        let x: number, y: number;
        const cluster = Math.floor(Math.random() * 4);

        switch (cluster) {
            case 0: // Top-left cluster
                x = 100 + Math.random() * 150;
                y = 80 + Math.random() * 100;
                break;
            case 1: // Center cluster
                x = 350 + Math.random() * 100;
                y = 150 + Math.random() * 100;
                break;
            case 2: // Right cluster
                x = 600 + Math.random() * 150;
                y = 200 + Math.random() * 150;
                break;
            default: // Random
                x = Math.random() * 800;
                y = Math.random() * 400;
        }

        data.push({
            x,
            y,
            value: 30 + Math.random() * 70,
            timestamp
        });
    }

    return {
        min: 0,
        max: 100,
        startTime: 0,
        endTime: duration,
        data: data.sort((a, b) => a.timestamp - b.timestamp)
    };
}

animatedHeatmap.setTemporalData(generateTemporalData());

function updateAnimationUI(timestamp: number, progress: number) {
    const progressSlider = document.getElementById(
        "animation-progress"
    ) as HTMLInputElement;
    const timeDisplay = document.getElementById("animation-time");

    if (progressSlider) {
        progressSlider.value = String(progress * 100);
    }

    if (timeDisplay) {
        const seconds = Math.floor(timestamp / 1000);
        const ms = Math.floor((timestamp % 1000) / 10);
        timeDisplay.textContent = `${String(seconds).padStart(2, "0")}:${String(ms).padStart(2, "0")}`;
    }
}

function updateAnimationState(state: string) {
    const stateDisplay = document.getElementById("animation-state");
    if (stateDisplay) {
        stateDisplay.textContent =
            state.charAt(0).toUpperCase() + state.slice(1);
    }
}

// Play button
document.getElementById("animation-play-btn")?.addEventListener("click", () => {
    animatedHeatmap.play();
    updateAnimationState("playing");
});

// Pause button
document
    .getElementById("animation-pause-btn")
    ?.addEventListener("click", () => {
        animatedHeatmap.pause();
        updateAnimationState("paused");
    });

// Stop button
document.getElementById("animation-stop-btn")?.addEventListener("click", () => {
    animatedHeatmap.stop();
    updateAnimationState("idle");
    // Regenerate data for a fresh experience
    animatedHeatmap.setTemporalData(generateTemporalData());
});

// Speed control
const speedSlider = document.getElementById(
    "animation-speed"
) as HTMLInputElement;
const speedValue = document.getElementById("animation-speed-value");

speedSlider?.addEventListener("input", () => {
    const speed = parseFloat(speedSlider.value);
    animatedHeatmap.setSpeed(speed);
    if (speedValue) speedValue.textContent = `${speed}x`;
});

// Loop checkbox
const loopCheckbox = document.getElementById(
    "animation-loop"
) as HTMLInputElement;
loopCheckbox?.addEventListener("change", () => {
    animatedHeatmap.setLoop(loopCheckbox.checked);
});

// Progress slider
const progressSlider = document.getElementById(
    "animation-progress"
) as HTMLInputElement;
progressSlider?.addEventListener("input", () => {
    const progress = parseFloat(progressSlider.value) / 100;
    animatedHeatmap.seekProgress(progress);
});

// ============================================================================
// CUSTOMIZATION DEMO
// ============================================================================

// Use gradient presets from the library
const gradientPresets = GRADIENT_PRESETS;

const customContainer = document.querySelector<HTMLElement>(
    "#custom-heatmap-container"
)!;
let customRadius = 25;
let customBlur = 0.85;
let customOpacity = 0.8;
let customGridSize = 20;
let currentGradient: GradientPresetName = "cool";
let currentBlendMode: GlobalCompositeOperation = "source-over";
let currentIntensityExponent = 1;

let customPoints: HeatmapPoint[] = generateRandomPoints(
    200,
    customContainer.clientWidth,
    customContainer.clientHeight
);
let customHeatmap: Heatmap;

function createCustomHeatmap() {
    customContainer.innerHTML = "";

    customHeatmap = createHeatmap(
        {
            container: customContainer,
            radius: customRadius,
            blur: customBlur,
            maxOpacity: customOpacity,
            gridSize: customGridSize,
            gradient: gradientPresets[currentGradient],
            blendMode: currentBlendMode,
            intensityExponent: currentIntensityExponent
        },
        withTooltip()
    );

    customHeatmap.setData({ min: 0, max: 100, data: customPoints });
}

createCustomHeatmap();

// Radius slider
const radiusSlider = document.getElementById(
    "radius-slider"
) as HTMLInputElement;
const radiusValue = document.getElementById("radius-value");

radiusSlider?.addEventListener("input", () => {
    customRadius = parseInt(radiusSlider.value);
    if (radiusValue) radiusValue.textContent = String(customRadius);
    createCustomHeatmap();
});

// Blur slider
const blurSlider = document.getElementById("blur-slider") as HTMLInputElement;
const blurValue = document.getElementById("blur-value");

blurSlider?.addEventListener("input", () => {
    customBlur = parseFloat(blurSlider.value);
    if (blurValue) blurValue.textContent = customBlur.toFixed(1);
    createCustomHeatmap();
});

// Opacity slider
const opacitySlider = document.getElementById(
    "opacity-slider"
) as HTMLInputElement;
const opacityValue = document.getElementById("opacity-value");

opacitySlider?.addEventListener("input", () => {
    customOpacity = parseFloat(opacitySlider.value);
    if (opacityValue) opacityValue.textContent = customOpacity.toFixed(1);
    createCustomHeatmap();
});

// Grid Size slider
const gridSizeSlider = document.getElementById(
    "gridsize-slider"
) as HTMLInputElement;
const gridSizeValue = document.getElementById("gridsize-value");

gridSizeSlider?.addEventListener("input", () => {
    customGridSize = parseInt(gridSizeSlider.value);
    if (gridSizeValue) gridSizeValue.textContent = String(customGridSize);
    createCustomHeatmap();
});

// Gradient select
const gradientSelect = document.getElementById(
    "gradient-select"
) as HTMLSelectElement;

gradientSelect?.addEventListener("change", () => {
    currentGradient = gradientSelect.value as GradientPresetName;
    createCustomHeatmap();
});

// Blend mode select
const blendModeSelect = document.getElementById(
    "blendmode-select"
) as HTMLSelectElement;

blendModeSelect?.addEventListener("change", () => {
    currentBlendMode = blendModeSelect.value as GlobalCompositeOperation;
    createCustomHeatmap();
});

// Intensity exponent slider
const intensitySlider = document.getElementById(
    "intensity-slider"
) as HTMLInputElement;
const intensityValue = document.getElementById("intensity-value");

intensitySlider?.addEventListener("input", () => {
    currentIntensityExponent = parseFloat(intensitySlider.value);
    if (intensityValue) intensityValue.textContent = currentIntensityExponent.toFixed(1);
    createCustomHeatmap();
});

// Random button
document.getElementById("custom-random-btn")?.addEventListener("click", () => {
    customPoints = generateRandomPoints(
        100,
        customContainer.clientWidth,
        customContainer.clientHeight
    );
    createCustomHeatmap();
});

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function generateRandomPoints(
    count: number,
    width: number,
    height: number
): HeatmapPoint[] {
    return Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        value: Math.random() * 100
    }));
}

// ============================================================================
// SMOOTH SCROLL FOR NAV
// ============================================================================

document.querySelectorAll('.nav a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener(
        "click",
        function (this: HTMLAnchorElement, e: Event) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute("href")!);
            target?.scrollIntoView({ behavior: "smooth" });
        }
    );
});

// ============================================================================
// HIGHLIGHT ACTIVE NAV ITEM ON SCROLL
// ============================================================================

const sections = document.querySelectorAll(".section");
const navLinks = document.querySelectorAll(".nav a");

const observerOptions = {
    root: null,
    rootMargin: "-50% 0px",
    threshold: 0
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            const id = entry.target.getAttribute("id");
            navLinks.forEach((link) => {
                link.classList.remove("active");
                if (link.getAttribute("href") === `#${id}`) {
                    link.classList.add("active");
                }
            });
        }
    });
}, observerOptions);

sections.forEach((section) => observer.observe(section));
