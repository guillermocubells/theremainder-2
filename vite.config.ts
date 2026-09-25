import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "The Remainder — The Lost Trees of the High Altitudes",
        short_name: "The Remainder",
        description: "A botanical archive of rare specimens from montane forests and cloud-veiled ridges.",
        theme_color: "#4A6741",
        background_color: "#FAF8F5",
        display: "standalone",
        orientation: "portrait-primary",
        start_url: "/",
        scope: "/",
        categories: ["shopping", "lifestyle"],
        icons: [
          { src: "/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        // Sin esto, un service worker ya instalado sigue mandando hasta que se
        // cierran TODAS las pestanas del sitio. En movil la pestana se queda
        // abierta, asi que un visitante que cargo la version que precacheaba
        // 30 MB se quedaba atrapado en ella indefinidamente, aunque el arreglo
        // ya estuviera desplegado. Con estas tres, el nuevo toma el control en
        // la siguiente carga y tira las caches viejas.
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        maximumFileSizeToCacheInBytes: 6 * 1024 * 1024,
        // Solo el armazon de la aplicacion. Las fotos del catalogo NO se
        // precachean: son 206 ficheros y ~30 MB, y precachearlas obliga al
        // navegador a descargarlos ANTES de que la web sea usable. En movil eso
        // es una pagina colgada. Se sirven bajo demanda con la regla de abajo.
        globPatterns: ["**/*.{js,css,html,ico,svg,woff2}"],
        navigateFallback: "/index.html",
        navigateFallbackAllowlist: [/^\/(?!api\/).*/],
        runtimeCaching: [
          {
            // Fotos del catalogo: se descargan cuando hacen falta y se quedan
            // cacheadas. Con tope de entradas para no llenar el disco del
            // visitante con un catalogo que puede seguir creciendo.
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.startsWith("/plantas/") ||
              url.pathname.startsWith("/lovable-uploads/"),
            handler: "CacheFirst",
            options: {
              cacheName: "fotos-catalogo",
              expiration: { maxEntries: 120, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
            handler: "CacheFirst",
            options: {
              cacheName: "google-fonts",
              expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.includes("/rest/v1/plants") ||
              url.pathname.includes("/rest/v1/categories"),
            handler: "StaleWhileRevalidate",
            options: {
              cacheName: "catalog-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 2 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: ({ url }: { url: URL }) =>
              url.pathname.includes("/storage/v1/object/public/") ||
              url.pathname.includes("/storage/v1/render/image/public/"),
            handler: "CacheFirst",
            options: {
              cacheName: "plant-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 90 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
