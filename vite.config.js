import { defineConfig } from 'vite'
import path from 'path'

export default defineConfig({
  base: '/excel-lambda-optimizer/',
  build: {
    outDir: 'docs',
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
})
