<script setup lang="ts">
import CodeBlock from "../ui/CodeBlock.vue";

const installCode = `npm install @drdreo/heatmap`;

const quickStartCode = `import { createHeatmap } from '@drdreo/heatmap';

const heatmap = createHeatmap({
    container: document.getElementById('heatmap')!,
    data: [
            { x: 200, y: 200, value: 80 },
            { x: 400, y: 150, value: 60 }
    ]
});`;
</script>

<template>
    <section id="getting-started" class="section">
        <h2>Getting Started</h2>
        <div class="card">
            <h3>Installation</h3>
            <CodeBlock language="bash">{{ installCode }}</CodeBlock>
        </div>
        <div class="card">
            <h3>Quick Start</h3>
            <CodeBlock language="typescript">{{ quickStartCode }}</CodeBlock>
        </div>
    </section>
</template>

<style scoped>
.section {
    margin-bottom: 6rem;
    scroll-margin-top: 5rem;
}

.section h2 {
    font-size: 2.5rem;
    font-weight: 700;
    margin-bottom: 1rem;
    color: var(--color-text);
}

.card {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius);
    padding: 1.5rem;
    margin-bottom: 1.5rem;
}

.card h3 {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 1rem;
    color: var(--color-text);
}

@media (max-width: 768px) {
    .section h2 {
        font-size: 1.75rem;
    }
}
</style>
