<script setup lang="ts">
defineProps<{
    language?: string;
    title?: string;
}>();
</script>

<template>
    <div class="code-example">
        <h4 v-if="title">{{ title }}</h4>
        <pre><code :class="language ? `language-${language}` : ''"><slot /></code></pre>
    </div>
</template>

<style scoped>
.code-example {
    margin-top: 2rem;
}

.code-example h4 {
    font-size: 0.875rem;
    font-weight: 600;
    color: var(--color-text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.75rem;
}

pre {
    background: var(--color-bg-tertiary);
    border: 1px solid var(--color-border);
    border-radius: var(--border-radius-sm);
    padding: 1.25rem;
    overflow-x: auto;
    margin: 0;
}

code {
    font-family: "JetBrains Mono", "Fira Code", "Consolas", monospace;
    font-size: 0.875rem;
    line-height: 1.7;
}
</style>
