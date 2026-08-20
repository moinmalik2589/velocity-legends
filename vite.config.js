import { defineConfig } from 'vite';

export default defineConfig({
    base: "/Velocity-Legends/",
    server: {
        port: 1807,
        strictPort: true
    },
    build: {
        target: "es2020",
        sourcemap: false,
        rolldownOptions: {
            output: {
                manualChunks(id) {
                    if (id.includes("node_modules/three/")) return "three";
                    if (id.includes("node_modules/phaser/")) return "phaser";
                }
            }
        }
    }
});
