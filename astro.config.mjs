import { defineConfig } from 'astro/config';
export default defineConfig({ output: 'static', devToolbar: { enabled: false }, server: { port: 4321, host: true } });
