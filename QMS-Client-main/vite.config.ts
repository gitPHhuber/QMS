import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { VitePWA } from "vite-plugin-pwa";


export default defineConfig({
  preview: {
    host: "0.0.0.0",
    port: 4173,
  },

  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      includeAssets: [
        "favicon.ico",
        "apple-touch-icon.png",
        "maskable-icon-512x512.svg",
      ],
      manifest: {
        name: "MES_crypto",
        short_name: "Vite PWA Project",
        theme_color: "#ffffff",
        icons: [
          {
            src: "pwa-64x64.png",
            sizes: "64x64",
            type: "image/png",
          },
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "maskable-icon-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],

  resolve: {
    alias: {
      public: "/public",
      src: "/src",
      api: "/src/api",
      assets: "/src/assets",
      components: "/src/components",
      pages: "src/pages",
      store: "/src/store",
      types: "/src/types",
    },
  },
});
