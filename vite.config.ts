import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "tailwindcss";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    cors: {
      origin: false,
    },
    hmr: {
      protocol: 'ws',
      host: 'localhost'
    },
    watch: {
      usePolling: true
    },
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp'
    },
    fs: {
      strict: false // Allow serving files from outside the root directory
    }
  },
  plugins: [react()],
  css: {
    postcss: {
      plugins: [tailwindcss()],
    },
  },
  assetsInclude: ['**/*.mp3'], // Explicitly include MP3 files as assets
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          wavesurfer: ['wavesurfer.js']
        }
      }
    }
  }
});
