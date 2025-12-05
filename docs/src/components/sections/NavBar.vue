<script setup lang="ts">
import { ref, onMounted, onUnmounted } from "vue";

interface NavItem {
    id: string;
    label: string;
}

const navItems: NavItem[] = [
    { id: "getting-started", label: "Getting Started" },
    { id: "customization", label: "Customization" },
    { id: "basic-demo", label: "Basic Demo" },
    { id: "tooltip-demo", label: "Tooltip" },
    { id: "animation-demo", label: "Animation" },
    { id: "legend-demo", label: "Legend" },
    { id: "api", label: "API" }
];

const activeSection = ref<string>("");

function scrollToSection(e: Event, id: string) {
    e.preventDefault();
    const target = document.getElementById(id);
    target?.scrollIntoView({ behavior: "smooth" });
}

let observer: IntersectionObserver | null = null;

onMounted(() => {
    const sections = document.querySelectorAll(".section");

    observer = new IntersectionObserver(
        (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    activeSection.value = entry.target.getAttribute("id") || "";
                }
            });
        },
        {
            root: null,
            rootMargin: "-50% 0px",
            threshold: 0
        }
    );

    sections.forEach((section) => observer?.observe(section));
});

onUnmounted(() => {
    observer?.disconnect();
});
</script>

<template>
    <nav class="nav">
        <ul>
            <li v-for="item in navItems" :key="item.id">
                <a
                    :href="`#${item.id}`"
                    :class="{ active: activeSection === item.id }"
                    @click="scrollToSection($event, item.id)"
                >
                    {{ item.label }}
                </a>
            </li>
        </ul>
    </nav>
</template>

<style scoped>
.nav {
    position: sticky;
    top: 0;
    background: rgba(15, 15, 16, 0.9);
    backdrop-filter: blur(10px);
    border-bottom: 1px solid var(--color-border);
    z-index: 100;
    padding: 0.75rem 0;
    margin-bottom: 3rem;
}

.nav ul {
    display: flex;
    gap: 2rem;
    justify-content: center;
    list-style: none;
    flex-wrap: wrap;
}

.nav a {
    color: var(--color-text-muted);
    font-size: 0.9rem;
    font-weight: 500;
    padding: 0.5rem 0;
    border-bottom: 2px solid transparent;
    transition: all 0.2s ease;
}

.nav a:hover {
    color: var(--color-text);
    border-bottom-color: var(--color-primary);
}

.nav a.active {
    color: var(--color-primary);
    border-bottom-color: var(--color-primary);
}

@media (max-width: 768px) {
    .nav ul {
        gap: 1rem;
    }
}
</style>
