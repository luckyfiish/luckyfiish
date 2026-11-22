import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

function resolveBasePath(): string {
  if (process.env.GITHUB_ACTIONS === 'true' && process.env.GITHUB_REPOSITORY) {
    const [owner, repo] = process.env.GITHUB_REPOSITORY.split('/');
    if (
      owner &&
      repo &&
      repo.toLowerCase() === `${owner.toLowerCase()}.github.io`
    ) {
      return '/';
    }
    if (repo) {
      return `/${repo}/`;
    }
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
