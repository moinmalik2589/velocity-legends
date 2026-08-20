import { defineConfig } from "vite";

export default defineConfig({
    base: "/velocity-legends/",

    server: {
        port: 1807,
        strictPort: true
    },

    build: {
        target: "es2020",
        sourcemap: false
    }
});