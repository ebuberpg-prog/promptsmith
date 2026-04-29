import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'path'

export default defineConfig({
  base: '/promptsmith/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'MUSE — Prompt Studio',
        short_name: 'MUSE',
        description: 'A local-first prompt workspace for AI image creators',
        theme_color: '#1a1918',
        background_color: '#1a1918',
        display: 'standalone',
        orientation: 'any',
        scope: '/promptsmith/',
        start_url: '/promptsmith/',
        icons: [
          {
            src: '/promptsmith/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/promptsmith/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: '/promptsmith/pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable'
          },
          {
            src: '/promptsmith/pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2,yaml}'],
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
      }
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-motion': ['framer-motion'],
          'vendor-icons': ['@phosphor-icons/react', 'lucide-react'],
          'vendor-state': ['zustand', '@tanstack/react-query', '@tanstack/react-virtual'],
          'vendor-search': ['fuse.js'],
        },
      },
    },
    chunkSizeWarningLimit: 600,
  }
})
