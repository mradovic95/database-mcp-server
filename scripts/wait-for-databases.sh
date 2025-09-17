#!/bin/bash

# Wait for PostgreSQL to be ready
echo "Waiting for PostgreSQL..."
until docker compose -f docker-compose.test.yml exec postgres pg_isready -U testuser -d testdb; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done
echo "PostgreSQL ping successful!"

# Test PostgreSQL connection
echo "Testing PostgreSQL connection..."
until docker compose -f docker-compose.test.yml exec postgres psql -U testuser -d testdb -c "SELECT 1;" > /dev/null 2>&1; do
  echo "PostgreSQL connection test failed - sleeping"
  sleep 2
done
echo "PostgreSQL is ready!"

# Wait for MySQL to be ready
echo "Waiting for MySQL..."
until docker compose -f docker-compose.test.yml exec mysql mysqladmin ping -h localhost -u testuser -ptestpass --silent; do
  echo "MySQL is unavailable - sleeping"
  sleep 2
done
echo "MySQL ping successful!"

# Test MySQL connection and give extra time
echo "Testing MySQL connection..."
until docker compose -f docker-compose.test.yml exec mysql mysql -u testuser -ptestpass testdb -e "SELECT 1;" > /dev/null 2>&1; do
  echo "MySQL connection test failed - sleeping"
  sleep 2
done
echo "MySQL is ready!"

# Additional safety wait for MySQL to fully stabilize
echo "Waiting additional 3 seconds for MySQL to stabilize..."
sleep 3

echo "All databases are ready for testing!"