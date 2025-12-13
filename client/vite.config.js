import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { nodePolyfills } from 'vite-plugin-node-polyfills'; // Import cái này

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Cấu hình bắt buộc để Video Call không bị sập
    nodePolyfills({
      // Danh sách các module cần giả lập
      include: ['events', 'stream', 'util', 'process', 'buffer'], 
      globals: {
        Buffer: true,
        global: true,
        process: true,
      },
      protocolImports: true,
    }),
  ],
  define: {
    // Fix lỗi 'global is not defined'
    'global': 'window', 
  },
});