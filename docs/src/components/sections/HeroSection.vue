<script setup lang="ts"></script>

<template>
    <header class="hero">
        <div class="hero-content">
            <h1>🔥 Heatmap</h1>
            <p class="tagline">
                A modern, performant, tree-shakeable heatmap rendering library
            </p>
            <div class="hero-badges">
                <span class="badge">Zero Dependencies</span>
                <span class="badge">Tree-Shakeable</span>
                <span class="badge">TypeScript</span>
                <span class="badge">Canvas2D</span>
            </div>
            <div class="hero-actions">
                <a
                    href="https://github.com/drdreo/heatmap"
                    target="_blank"
                    class="btn btn-secondary"
                >
                    GitHub
                </a>
            </div>
        </div>
    </header>
</template>

<style scoped>
.hero {
    padding: 6rem 0 4rem;
    text-align: center;
    background: linear-gradient(
        180deg,
        rgba(249, 115, 22, 0.1) 0%,
        transparent 100%
    );
    margin-bottom: 2rem;
}

.hero h1 {
    font-size: 4rem;
    font-weight: 800;
    margin-bottom: 1rem;
    background: linear-gradient(135deg, var(--color-primary) 0%, #fbbf24 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
}

.tagline {
    font-size: 1.25rem;
    color: var(--color-text-muted);
    margin-bottom: 2rem;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
}

.hero-badges {
    display: flex;
    gap: 0.75rem;
    justify-content: center;
    flex-wrap: wrap;
    margin-bottom: 2rem;
}

.badge {
    background: var(--color-bg-secondary);
    border: 1px solid var(--color-border);
    padding: 0.5rem 1rem;
    border-radius: 100px;
    font-size: 0.875rem;
    color: var(--color-text-muted);
}

.hero-actions {
    display: flex;
    gap: 1rem;
    justify-content: center;
}

@media (max-width: 768px) {
    .hero h1 {
        font-size: 2.5rem;
    }

    .tagline {
        font-size: 1rem;
    }

    .hero-actions {
        flex-direction: column;
        align-items: center;
    }
}
</style>
