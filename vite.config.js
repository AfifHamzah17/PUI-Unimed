import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      // 'prompt': pengguna memilih kapan memuat versi baru (lihat UpdatePrompt).
      registerType: 'prompt',
      includeAssets: ['favicon-32.png', 'celae-lockup-320.webp', 'celae-mark-96.webp', 'logo-96.webp', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'PUI Literasi dan Seni dalam Pendidikan',
        short_name: 'PUI Literasi Seni',
        description: 'Pusat Unggulan IPTEK Literasi dan Seni dalam Pendidikan, Universitas Negeri Medan.',
        lang: 'id',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#f7f7fa',
        theme_color: '#243266',
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // .mjs wajib ada di sini: worker pdf.js (±1 MB) ikut di-precache supaya pembaca PDF jalan offline.
        globPatterns: ['**/*.{js,mjs,css,html,webp,svg,woff2}', 'icons/*.png', 'favicon-32.png'],
        // Editor admin dan foto kegiatan tidak ikut di-precache: foto (puluhan MB bila kegiatan bertambah) cukup di-cache saat dilihat.
        globIgnores: ['**/editor-*.js', 'kegiatan/**'],
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /\.pdf$/],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/kegiatan/'),
            handler: 'CacheFirst',
            options: { cacheName: 'pui-foto-kegiatan', expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 30 }, cacheableResponse: { statuses: [200] } },
          },
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
  // Minifikasi JS (esbuild) tanpa komentar lisensi dan tanpa console.log/debug di produksi. console.error/warn tetap ada.
  esbuild: { legalComments: 'none', pure: ['console.log', 'console.debug'], drop: ['debugger'] },
  build: {
    // pdf.js 4.x memakai top-level await; target lama akan gagal build.
    target: 'es2022',
    cssMinify: true,
    cssCodeSplit: true, // CSS halaman yang dimuat malas ikut terpisah
    sourcemap: false,
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
