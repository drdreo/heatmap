<script setup lang="ts">
// FooterSection component
</script>

<template>
    <footer class="footer">
        <p>
            Built with care by
            <a href="https://github.com/drdreo" target="_blank">@drdreo</a>
        </p>
        <p class="footer-links">
            <a href="https://github.com/drdreo/heatmap" target="_blank"
                >GitHub</a
            >
            <span>|</span>
            <a
                href="https://www.npmjs.com/package/@drdreo/heatmap"
                target="_blank"
                >npm</a
            >
        </p>
    </footer>
</template>

<style scoped>
.footer {
    text-align: center;
    padding: 4rem 0;
    border-top: 1px solid var(--color-border);
    margin-top: 4rem;
    color: var(--color-text-muted);
}

.footer p {
    margin-bottom: 0.5rem;
}

.footer-links {
    display: flex;
    gap: 1rem;
    justify-content: center;
    align-items: center;
}

.footer-links span {
    color: var(--color-border-light);
}
</style>
