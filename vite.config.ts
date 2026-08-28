import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { decisionCoachApiPlugin } from './server/apiPlugin.js'

export default defineConfig({ plugins: [react(), decisionCoachApiPlugin()] })
