import {
    type AnimatedHeatmap,
    createHeatmap,
    type GradientStop,
    type Heatmap,
    type HeatmapPoint,
    withAnimation,
    withTooltip
} from "@drdreo/heatmap";
import "./style.css";

// ============================================================================
// BASIC DEMO
// ============================================================================

const basicConfig = {
    container: document.querySelector<HTMLElement>("#basic-heatmap-container")!,
    width: 800,
    height: 400,
    radius: 25,
    blur: 15
};

const basicHeatmap = createHeatmap(basicConfig);

// Initialize with some data
const initialBasicData: HeatmapPoint[] = [
    { x: 200, y: 200, value: 80 },
    { x: 250, y: 180, value: 60 },
    { x: 300, y: 220, value: 90 },
    { x: 500, y: 150, value: 70 },
    { x: 550, y: 180, value: 85 },
    { x: 400, y: 300, value: 50 }
];

basicHeatmap.setData({ min: 0, max: 100, data: initialBasicData });
updateBasicPointCount(initialBasicData.length);

let basicPointCount = initialBasicData.length;

function updateBasicPointCount(count: number) {
    const el = document.getElementById("basic-point-count");
    if (el) el.textContent = `Points: ${count}`;
}

// Click to add points
basicHeatmap.canvas.addEventListener("click", (event) => {
    const rect = basicHeatmap.canvas.getBoundingClientRect();
    const scaleX = basicHeatmap.width / rect.width;
    const scaleY = basicHeatmap.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    basicHeatmap.addPoint({ x, y, value: Math.random() * 100 });
    basicPointCount++;
    updateBasicPointCount(basicPointCount);
});

// Clear button
document.getElementById("basic-clear-btn")?.addEventListener("click", () => {
    basicHeatmap.clear();
    basicPointCount = 0;
    updateBasicPointCount(basicPointCount);
});

// Random points button
document.getElementById("basic-random-btn")?.addEventListener("click", () => {
    const points = generateRandomPoints(50, 800, 400);
    basicHeatmap.addPoints(points);
    basicPointCount += points.length;
    updateBasicPointCount(basicPointCount);
});

// ============================================================================
// TOOLTIP DEMO
// ============================================================================

const tooltipConfig = {
    container: document.querySelector<HTMLElement>(
        "#tooltip-heatmap-container"
    )!,
    width: 800,
    height: 400,
    radius: 30,
    blur: 20
};

const tooltipHeatmap = createHeatmap(
    tooltipConfig,
    withTooltip({
        formatter: (value, x, y) =>
            `Value: ${value.toFixed(1)} @ (${Math.round(x)}, ${Math.round(y)})`,
        offset: { x: 15, y: 15 },
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
    tooltipHeatmap.addPoints(generateRandomPoints(30, 800, 400));
});

// ============================================================================
// ANIMATION DEMO
// ============================================================================

const animationConfig = {
    container: document.querySelector<HTMLElement>(
        "#animation-heatmap-container"
    )!,
    width: 800,
    height: 400,
    radius: 25,
    blur: 15
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
    const numPoints = 200;

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

// Set initial temporal data
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

// Gradient presets
const gradientPresets: Record<string, GradientStop[]> = {
    default: [
        { offset: 0, color: "rgba(0, 0, 0, 0)" },
        { offset: 0.25, color: "rgba(98, 98, 246, 1)" },
        { offset: 0.5, color: "rgba(114, 255, 114, 1)" },
        { offset: 0.75, color: "rgba(255, 255, 38, 1)" },
        { offset: 1, color: "rgba(255, 0, 0, 1)" }
    ],
    thermal: [
        { offset: 0, color: "rgba(0, 0, 0, 0)" },
        { offset: 0.2, color: "rgba(128, 0, 128, 1)" },
        { offset: 0.4, color: "rgba(255, 0, 0, 1)" },
        { offset: 0.6, color: "rgba(255, 165, 0, 1)" },
        { offset: 0.8, color: "rgba(255, 255, 0, 1)" },
        { offset: 1, color: "rgba(255, 255, 255, 1)" }
    ],
    cool: [
        { offset: 0, color: "rgba(0, 0, 0, 0)" },
        { offset: 0.33, color: "rgba(128, 0, 255, 1)" },
        { offset: 0.66, color: "rgba(0, 255, 255, 1)" },
        { offset: 1, color: "rgba(0, 255, 128, 1)" }
    ],
    fire: [
        { offset: 0, color: "rgba(0, 0, 0, 0)" },
        { offset: 0.25, color: "rgba(139, 0, 0, 1)" },
        { offset: 0.5, color: "rgba(255, 69, 0, 1)" },
        { offset: 0.75, color: "rgba(255, 165, 0, 1)" },
        { offset: 1, color: "rgba(255, 255, 0, 1)" }
    ],
    ocean: [
        { offset: 0, color: "rgba(0, 0, 0, 0)" },
        { offset: 0.25, color: "rgba(0, 0, 139, 1)" },
        { offset: 0.5, color: "rgba(0, 139, 139, 1)" },
        { offset: 0.75, color: "rgba(0, 255, 255, 1)" },
        { offset: 1, color: "rgba(255, 255, 255, 1)" }
    ]
};

let customRadius = 25;
let customBlur = 15;
let customOpacity = 0.8;
let currentGradient = "default";

// Store current points for re-rendering
let customPoints: HeatmapPoint[] = generateRandomPoints(100, 800, 400);

// Create and setup custom heatmap
let customHeatmap: Heatmap;

function createCustomHeatmap() {
    const container = document.querySelector<HTMLElement>(
        "#custom-heatmap-container"
    )!;

    // Clear container
    container.innerHTML = "";

    customHeatmap = createHeatmap({
        container,
        width: 800,
        height: 400,
        radius: customRadius,
        blur: customBlur,
        maxOpacity: customOpacity,
        gradient: gradientPresets[currentGradient]
    });

    customHeatmap.setData({ min: 0, max: 100, data: customPoints });
}

// Initialize
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
    customBlur = parseInt(blurSlider.value);
    if (blurValue) blurValue.textContent = String(customBlur);
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

// Gradient select
const gradientSelect = document.getElementById(
    "gradient-select"
) as HTMLSelectElement;

gradientSelect?.addEventListener("change", () => {
    currentGradient = gradientSelect.value;
    createCustomHeatmap();
});

// Random button
document.getElementById("custom-random-btn")?.addEventListener("click", () => {
    customPoints = generateRandomPoints(100, 800, 400);
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
