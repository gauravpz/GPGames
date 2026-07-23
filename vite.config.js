import { defineConfig } from 'vite';

export default defineConfig({
  // Use relative paths so the built index.html works both on a web server
  // AND from file:///android_asset/ inside Android WebView
  base: './',
});
