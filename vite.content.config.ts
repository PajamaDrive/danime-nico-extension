import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// コンテンツスクリプト専用のIIFEビルド設定
export default defineConfig({
  base: '',
  build: {
    outDir: 'dist',
    emptyOutDir: false, // ESMのビルド結果を消さないようにfalse
    rollupOptions: {
      input: {
        content: resolve(__dirname, 'src/content.ts')
      },
      output: {
        format: 'iife',
        entryFileNames: '[name].js',
        name: 'content',
        inlineDynamicImports: true
      }
    }
  }
});
