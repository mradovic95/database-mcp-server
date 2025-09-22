import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // Run tests sequentially for database integration tests to avoid conflicts
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true
      }
    },
    // Increase timeout for database operations
    testTimeout: 30000,
    hookTimeout: 30000,
    // Environment variables for tests
    env: {
      NODE_ENV: 'test'
    },
    // Run all tests in test directory
    include: ['test/**/*.test.js'],
    // Reporter configuration
    reporter: ['verbose'],
    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.js'],
      exclude: ['test/**/*']
    }
  }
})