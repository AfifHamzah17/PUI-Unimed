import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': pengguna memilih kapan memuat versi baru (lihat UpdatePrompt).
      registerType: 'prompt',
      includeAssets: ['favicon-32.png', 'logo-96.webp', 'logo-320.webp', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'PUI Literasi dan Seni dalam Pendidikan',
        short_name: 'PUI Literasi Seni',
        description: 'Pusat Unggulan IPTEK Literasi dan Seni dalam Pendidikan, Universitas Negeri Medan.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f1f4ef',
        theme_color: '#0a2018',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // .mjs wajib ada di sini: worker pdf.js (±1 MB) ikut di-precache supaya pembaca PDF jalan offline.
        globPatterns: ['**/*.{js,mjs,css,html,webp,svg,woff2}', 'icons/*.png', 'favicon-32.png'],
        globIgnores: ['**/editor-*.js'], // editor admin tidak perlu ikut di-precache untuk semua pengunjung
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /\.pdf$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.endsWith('.pdf'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'pui-dokumen',
              rangeRequests: true,
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 90 },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: { cacheName: 'pui-font-css' },
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'pui-font-file',
              cacheableResponse: { statuses: [0, 200] },
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  build: {
    // pdf.js 4.x memakai top-level await; target lama akan gagal build.
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;
          if (/node_modules\/(react-pdf|pdfjs-dist)\//.test(id)) return 'pdf';
          if (/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run)\//.test(id)) return 'react';
          if (id.includes('@phosphor-icons')) return 'icons';
          // Editor teks kaya: hanya dimuat di admin (import dinamis), jangan ikut paket publik.
          if (/node_modules\/(@tiptap|prosemirror-[^/]+|orderedmap|rope-sequence|w3c-keyname|linkifyjs|crelt|@remirror)\//.test(id)) return 'editor';
          return undefined;
        },
      },
    },
  },
  optimizeDeps: {
    exclude: ['pdfjs-dist'],
    esbuildOptions: { target: 'es2022' },
  },
});
