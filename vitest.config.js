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
    // Only run integration tests in test directory
    include: ['test/integration/**/*.test.js'],
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