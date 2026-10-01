import { defineConfig } from 'vite';
import { fileURLToPath } from 'node:url';

// Remove Phaser's automatic browser suspension at build time. Runtime overrides
// still register forbidden browser listeners and leave them in the uploaded ZIP.
function hostControlledPhaser() {
  return {
    name: 'playables-host-controlled-phaser',
    enforce: 'pre',
    transform(code, id) {
      if (!/\/phaser\/dist\/phaser(?:\.esm)?\.js$/.test(id.replaceAll('\\', '/'))) return;
      const handler = /var VisibilityHandler = function \(game\)[\s\S]*?module\.exports = VisibilityHandler;/g;
      const matches = [...code.matchAll(handler)];
      if (matches.length !== 1) throw new Error('Phaser suspension adapter changed; review the Playables integration');
      return { code: code.replace(handler, 'module.exports = function () {};'), map: null };
    },
  };
}

export default defineConfig({
  base: './',
  resolve: { alias: [{ find: /^phaser$/, replacement: fileURLToPath(new URL('./node_modules/phaser/dist/phaser.esm.js', import.meta.url)) }] },
  plugins: [hostControlledPhaser()],
  optimizeDeps: { exclude: ['phaser'] },
  server: { port: 5173 },
  build: { target: 'es2020', rollupOptions: { output: { manualChunks: { phaser: ['phaser'] } } } },
});
