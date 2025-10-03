import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // allows network access
    port: 5173, // your frontend port
    allowedHosts: [
      'localhost',
      '.ngrok-free.app',
      '.ngrok-free.dev'
    ],
  },
});
