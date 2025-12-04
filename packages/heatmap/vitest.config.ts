import { defineConfig } from "vitest/config";
import { playwright } from "@vitest/browser-playwright";

export default defineConfig({
    test: {
        globals: false,
        include: ["src/**/*.test.ts", "src/**/*.spec.ts"],
        reporters: ["default"],
        coverage: {
            provider: "v8",
            reporter: ["text", "json", "html"],
            include: ["src/**/*.ts"],
            exclude: ["src/**/*.test.ts", "src/**/*.spec.ts", "src/index.ts"]
        },
        browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }]
        }
    }
});
