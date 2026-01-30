import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: 'prompt',
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30 // 30 days
              }
            }
          },
          {
            urlPattern: /^https:\/\/.*\.(?:api|json)$/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 5 // 5 minutes
              },
              networkTimeoutSeconds: 10
            }
          }
        ]
      },
      includeAssets: [
        'favicon.ico',
        'apple-touch-icon.png',
        'apple-touch-icon-180x180.png',
        'masked-icon.svg',
        'pwa-192x192.png',
        'pwa-512x512.png'
      ],
      manifest: {
        name: 'CavaYo - Feel at Home',
        short_name: 'CavaYo',
        description: 'Find your perfect short-term stay in Uganda. Premium stays, prime locations, exclusive residences.',
        theme_color: '#00ac90',
        background_color: '#F7FFF7',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        id: '/',
        icons: [
          {
            src: 'pwa-72x72.png',
            sizes: '72x72',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-96x96.png',
            sizes: '96x96',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-128x128.png',
            sizes: '128x128',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-144x144.png',
            sizes: '144x144',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-152x152.png',
            sizes: '152x152',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: 'pwa-384x384.png',
            sizes: '384x384',
            type: 'image/png',
            purpose: 'any'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ],
        screenshots: [
          {
            src: 'screenshot-mobile.png',
            sizes: '473x840',
            type: 'image/png',
            form_factor: 'narrow',
            label: 'CavaYo Mobile View'
          },
          {
            src: 'screenshot-desktop.png',
            sizes: '1920x966',
            type: 'image/png',
            form_factor: 'wide',
            label: 'CavaYo Desktop View'
          }
        ],
        categories: ['travel', 'lodging', 'business'],
        shortcuts: [
          {
            name: 'Explore Stays',
            short_name: 'Explore',
            description: 'Browse available properties',
            url: '/explore/discovery',
            icons: [{ src: 'pwa-96x96.png', sizes: '96x96' }]
          },
          {
            name: 'Become a Host',
            short_name: 'Host',
            description: 'List your property',
            url: '/pre-onboard/register-host',
            icons: [{ src: 'pwa-96x96.png', sizes: '96x96' }]
          }
        ]
      },
      devOptions: {
        enabled: true,
        type: 'module'
      }
    })
  ].filter(Boolean),
  server: {
    host: "::",
    port: 8080,
    proxy: {
      '/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
