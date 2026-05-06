import { defineConfig } from 'vite';

export default defineConfig({
  // Files are now in the root, so no complex paths needed
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: 'index.html',
        about: 'about.html',
        admin: 'admin.html',
        carDetails: 'car-details.html',
        login: 'login.html',
        testDrive: 'test-drive.html'
      }
    }
  }
});