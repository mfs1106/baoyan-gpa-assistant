import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 相对路径，支持 GitHub Pages 子路径 /baoyan-gpa-assistant/ 和本地根路径都能正常加载
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
