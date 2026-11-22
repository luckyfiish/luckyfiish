import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function resolveBasePath(): string {
  if (process.env.GITHUB_ACTIONS === 'true') {
    return './';
  }
  return process.env.VITE_BASE_PATH || '/';
}

export default defineConfig({
  base: resolveBasePath(),
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
  preview: {
    host: '0.0.0.0',
    port: 3000,
    allowedHosts: true,
  },
});
