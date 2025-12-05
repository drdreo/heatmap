<script setup lang="ts">
import HeroSection from "./components/sections/HeroSection.vue";
import NavBar from "./components/sections/NavBar.vue";
import GettingStarted from "./components/sections/GettingStarted.vue";
import CustomizationDemo from "./components/sections/CustomizationDemo.vue";
import BasicDemo from "./components/sections/BasicDemo.vue";
import TooltipDemo from "./components/sections/TooltipDemo.vue";
import AnimationDemo from "./components/sections/AnimationDemo.vue";
import ApiReference from "./components/sections/ApiReference.vue";
import FooterSection from "./components/sections/FooterSection.vue";
</script>

<template>
    <div id="app">
        <HeroSection />
        <NavBar />
        <main>
            <GettingStarted />
            <CustomizationDemo />
            <BasicDemo />
            <TooltipDemo />
            <AnimationDemo />
            <ApiReference />
            <FooterSection />
        </main>
    </div>
</template>

<style>
:root {
    /* Colors */
    --color-bg: #0f0f10;
    --color-bg-secondary: #1a1a1c;
    --color-bg-tertiary: #242428;
    --color-text: #e4e4e7;
    --color-text-muted: #a1a1aa;
    --color-primary: #f97316;
    --color-primary-hover: #fb923c;
    --color-primary-dark: #c2410c;
    --color-border: #27272a;
    --color-border-light: #3f3f46;
    --color-accent: #f97316;

    /* Typography */
    font-family:
        "Inter",
        -apple-system,
        BlinkMacSystemFont,
        "Segoe UI",
        Roboto,
        sans-serif;
    line-height: 1.6;
    font-weight: 400;

    /* Sizing */
    --max-width: 1200px;
    --border-radius: 12px;
    --border-radius-sm: 8px;
}

* {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
}

body {
    background-color: var(--color-bg);
    color: var(--color-text);
    min-height: 100vh;
}

a {
    color: var(--color-primary);
    text-decoration: none;
    transition: color 0.2s ease;
}

a:hover {
    color: var(--color-primary-hover);
}

/* App Container */
#app {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: 0 1.5rem;
}

/* Buttons */
.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.75rem 1.5rem;
    font-size: 1rem;
    font-weight: 500;
    border-radius: var(--border-radius-sm);
    border: 1px solid var(--color-border);
    background: var(--color-bg-secondary);
    color: var(--color-text);
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
}

.btn:hover {
    background: var(--color-bg-tertiary);
    border-color: var(--color-border-light);
}

.btn-primary {
    background: var(--color-primary);
    border-color: var(--color-primary);
    color: white;
}

.btn-primary:hover {
    background: var(--color-primary-hover);
    border-color: var(--color-primary-hover);
}

.btn-secondary {
    background: transparent;
    border-color: var(--color-border-light);
}

.btn-full {
    width: 100%;
}

/* Scrollbar */
::-webkit-scrollbar {
    width: 8px;
    height: 8px;
}

::-webkit-scrollbar-track {
    background: var(--color-bg-secondary);
}

::-webkit-scrollbar-thumb {
    background: var(--color-border-light);
    border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
    background: var(--color-text-muted);
}

/* Selection */
::selection {
    background: rgba(249, 115, 22, 0.3);
}

/* Focus Styles */
button:focus-visible,
select:focus-visible,
input:focus-visible {
    outline: 2px solid var(--color-primary);
    outline-offset: 2px;
}
</style>
