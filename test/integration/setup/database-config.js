// Test database configurations - assumes PostgreSQL and MySQL are running via Docker Compose
export const postgresConfig = {
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'testdb',
  user: 'testuser',
  password: 'testpass',
  ssl: false,
  maxConnections: 5
}

export const mysqlConfig = {
  type: 'mysql',
  host: 'localhost',
  port: 3306,
  database: 'testdb',
  user: 'testuser',
  password: 'testpass',
  ssl: false,
  maxConnections: 5
}

// Multi-database test configurations
export const testConfigurations = {
  postgres: postgresConfig,
  mysql: mysqlConfig
}