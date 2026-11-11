import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig({
  base: '/Dynamic-Calc-Mobile/mobile/', plugins: [react()],
  build: { rollupOptions: { preserveEntrySignatures: 'strict', input: { main: new URL('./index.html', import.meta.url).pathname, adapter: new URL('./src/adapter/index.ts', import.meta.url).pathname } } },
});
