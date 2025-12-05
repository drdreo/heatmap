<script setup lang="ts">
export interface ConfigOption {
    name: string;
    type: string;
    default?: string;
    description: string;
}

export interface MethodOption {
    name: string;
    parameters: string;
    description: string;
}

defineProps<{
    options?: ConfigOption[];
    methods?: MethodOption[];
}>();
</script>

<template>
    <div class="config-card">
        <table class="config-table">
            <thead>
                <tr v-if="options">
                    <th>Option</th>
                    <th>Type</th>
                    <th>Default</th>
                    <th>Description</th>
                </tr>
                <tr v-else-if="methods">
                    <th>Method</th>
                    <th>Parameters</th>
                    <th>Description</th>
                </tr>
            </thead>
            <tbody>
                <tr v-for="option in options" :key="option.name">
                    <td>
                        <code>{{ option.name }}</code>
                    </td>
                    <td>
                        <code>{{ option.type }}</code>
                    </td>
                    <td>
                        <code v-if="option.default">{{ option.default }}</code
                        ><span v-else>-</span>
                    </td>
                    <td>{{ option.description }}</td>
                </tr>
                <tr v-for="method in methods" :key="method.name">
                    <td>
                        <code>{{ method.name }}</code>
                    </td>
                    <td>
                        <code v-if="method.parameters">{{
                            method.parameters
                        }}</code
                        ><span v-else>-</span>
                    </td>
                    <td>{{ method.description }}</td>
                </tr>
            </tbody>
        </table>
    </div>
</template>

<style scoped>
.config-card {
    overflow-x: auto;
}

.config-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
}

.config-table th,
.config-table td {
    text-align: left;
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--color-border);
}

.config-table th {
    color: var(--color-text-muted);
    font-weight: 600;
    text-transform: uppercase;
    font-size: 0.75rem;
    letter-spacing: 0.05em;
    background: var(--color-bg-tertiary);
}

.config-table td {
    color: var(--color-text);
}

.config-table td code {
    background: var(--color-bg-tertiary);
    padding: 0.2rem 0.4rem;
    border-radius: 4px;
    font-size: 0.8rem;
}

.config-table tr:last-child td {
    border-bottom: none;
}

@media (max-width: 768px) {
    .config-table {
        font-size: 0.75rem;
    }

    .config-table th,
    .config-table td {
        padding: 0.5rem;
    }
}
</style>
