import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vuetify from 'vite-plugin-vuetify'
import path from 'path'

export default defineConfig({
  plugins: [
    vue(),
    vuetify({ autoImport: true })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  build: {
    outDir: path.resolve(__dirname, '../frontend-dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return

          if (/[\\/]node_modules[\\/](vue|vue-router|@vue)[\\/]/.test(id)) {
            return 'vendor-vue'
          }

          if (/[\\/]node_modules[\\/]vuetify[\\/]/.test(id)) {
            return 'vendor-vuetify'
          }
        }
      }
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/upload': {
        target: 'http://localhost:8080',
        changeOrigin: true
      },
      '/file': {
        target: 'http://localhost:8080',
        changeOrigin: true
      }
    }
  }
})
