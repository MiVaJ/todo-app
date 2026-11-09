import { defineConfig } from 'vite';

export default defineConfig({
  // Относительный путь, чтобы сайт работал на GitHub Pages под любым именем репозитория
  base: './',
  test: { environment: 'jsdom' }
});
