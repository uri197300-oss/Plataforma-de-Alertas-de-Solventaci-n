import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  base: '/Plataforma-de-Alertas-de-Solventaci-n/',
  plugins: [react()],
})
