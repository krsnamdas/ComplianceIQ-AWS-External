import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      // Ignore the runtime data/ dir: the app writes region JSON and uploaded
      // documents there at runtime (local dev storage fallback). Those writes
      // must NOT trigger a Vite full-page reload — that was bouncing admins out
      // of the editor on document upload/delete.
      watch:
        process.env.DISABLE_HMR === 'true'
          ? null
          : { ignored: ['**/data/**'] },
    },
  };
});
