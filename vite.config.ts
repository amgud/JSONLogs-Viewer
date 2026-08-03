import path from 'path';
import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA as pwa } from 'vite-plugin-pwa';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.GITHUB_PAGES ? `/${process.env.GITHUB_PAGES}/` : '/',
  plugins: [
    tailwindcss(),
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    pwa({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'pwa-icon.svg'],
      manifest: {
        name: 'JSONLogs Viewer',
        short_name: 'JSONLogsViewer',
        description: 'View and analyse structured logs',
        theme_color: '#1e293b',
        background_color: '#0f172a',
        display: 'standalone',
        scope: './',
        start_url: './',
        icons: [
          {
            src: 'pwa-64x64.png',
            sizes: '64x64',
            type: 'image/png',
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'maskable-icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
