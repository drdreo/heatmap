import { defineConfig } from "vitest/config"

export default defineConfig({
    test: {
        globals: false,
        environment: "jsdom",
        include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["src/**/*.ts"],
            exclude: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/index.ts"]
        }
    }
})
