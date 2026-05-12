import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: "/self_help",
  server: {
    host: '0.0.0.0',
    port: 5173,
    open: true,
    historyApiFallback: {
      rewrites: [
        {
          from: /^\/self_help\/(?!.*\.[^/]+$).*$/,
          to: '/index.html'
        },
        {
          from: /^\/$/,
          to: '/self_help/'
        }
      ]
    },
    proxy: {
      // KB API lives on production — must be before the generic /api rule
      '/api/knowledge-bases': {
        target: 'https://dupe.bytedance.net/self_help/',
        changeOrigin: true,
        secure: false,
      },
      '/api': {
        target: 'http://10.71.105.154:8001/self_help/',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom'],
          arco: ['@arco-design/web-react'],
          router: ['react-router-dom'],
          axios: ['axios']
        }
      }
    }
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.jsx'],
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  }
})