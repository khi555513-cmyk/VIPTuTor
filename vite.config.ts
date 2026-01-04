
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.API_KEY': JSON.stringify(process.env.API_KEY)
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 3000,
    rollupOptions: {
      input: {
        main: './index.html'
      },
      output: {
        manualChunks: {
          'react-core': ['react', 'react-dom'],
          'ui-icons': ['lucide-react'],
          'google-ai': ['@google/genai'],
          'text-processing': ['marked', 'dompurify', 'mammoth']
        }
      }
    }
  },
  server: {
    host: true
  }
});
