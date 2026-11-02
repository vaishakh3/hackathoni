import { defineConfig } from 'astro/config';
export default defineConfig({ site: 'https://hackathoni-seven.vercel.app', output: 'static', devToolbar: { enabled: false }, server: { port: 4321, host: true } });
