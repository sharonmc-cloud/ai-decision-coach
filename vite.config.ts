import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { decisionCoachApiPlugin } from './server/apiPlugin'

export default defineConfig({ plugins: [react(), decisionCoachApiPlugin()] })
