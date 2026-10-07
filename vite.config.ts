import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  // 使用仓库名作为 base 路径，确保 GitHub Pages 子路径正确加载
  base: '/baoyan-gpa-assistant/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
