import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteStaticCopy } from 'vite-plugin-static-copy';

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'node_modules/pdfjs-dist/build/pdf.worker.min.mjs',
          dest: 'pdfgs'
        }
      ]
    })
  ],
  server: {
    port: 8080,
    host: true // To make it accessible from outside Docker
  },
  preview: {
    port: 8080,
    host: true,
    strictPort: true,
    allowedHosts: [
      'localhost',
      'gowows-web-252628919239.asia-south1.run.app' // ✅ Add your Cloud Run domain here
    ]
  }
});
