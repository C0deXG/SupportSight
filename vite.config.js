import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
// https://vite.dev/config/
export default defineConfig({
    plugins: [react()],
    resolve: {
        alias: {
            '@': path.resolve(__dirname, './src'),
            'crypto': 'crypto-browserify'
        },
    },
    define: {
        'process.env.NODE_DEBUG': 'false',
        global: 'globalThis',
    },
    build: {
        sourcemap: true,
        rollupOptions: {
            external: ['crypto'],
        }
    },
    optimizeDeps: {
        exclude: ['crypto']
    }
});
