import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Test file patterns
    include: ['tests/**/*.test.{js,ts}', 'tests/**/*.spec.{js,ts}'],
    
    // Environment setup
    environment: 'jsdom',
    
    // Global setup
    globals: true,
    
    // Test timeout
    testTimeout: 10000,
    
    // Setup files to run before each test
    setupFiles: ['./tests/setup.ts'],
    
    // Coverage configuration
    coverage: {
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'js-sdk-legacy/',
        'tests/',
        '**/*.d.ts'
      ]
    }
  },
  
  // Resolve TypeScript paths
  resolve: {
    alias: {
      '@': '/src'
    }
  }
});