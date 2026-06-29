import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    // Corregimos el error de TS dándole tipo 'string' al parámetro id
    resolveId(id: string) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
    
    // Configuración estratégica de la PWA
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      workbox: {
        // Cachea de manera persistente todos tus archivos estáticos al compilar
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // Clave para que React Router funcione en modo offline sin dar error 404
        navigateFallback: '/index.html',
      },
      manifest: {
        name: 'La Romana - Flota Clientes',
        short_name: 'FlotaClientes',
        description: 'Sistema de gestión de flota de camiones y gandolas',
        theme_color: '#0066CC',
        background_color: '#ffffff',
        display: 'standalone', // Abre la app en su propia ventana nativa sin barra de navegación
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable' // Clave para que se adapte a cualquier forma de icono en móviles
          }
        ]
      }
    })
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv'],
})