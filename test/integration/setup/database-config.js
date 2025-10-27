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

export const dynamodbConfig = {
  type: 'dynamodb',
  region: 'us-east-1',
  accessKeyId: 'test',
  secretAccessKey: 'test',
  endpoint: 'http://localhost:8000'
}

export const redisConfig = {
  type: 'redis',
  host: 'localhost',
  port: 6379,
  password: 'testpass',
  database: 0
}

// Multi-database test configurations
export const testConfigurations = {
  postgres: postgresConfig,
  mysql: mysqlConfig,
  dynamodb: dynamodbConfig,
  redis: redisConfig
}