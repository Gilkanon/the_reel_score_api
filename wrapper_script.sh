#!/bin/bash

set -e
set -x

echo "Waiting for Database..."
until nc -z -v -w30 db 5432
do
  echo "Waiting for database connection..."
  sleep 2
done
echo "Database is connected!"

echo "Running migrations..."
yarn prisma migrate dev --name init

echo "Starting app in background..."
yarn start:dev &
SERVER_PID=$!

echo "Waiting for App to launch on localhost:3000..."
until nc -z -v -w30 localhost 3000
do
  echo "Waiting for app port 3000..."
  sleep 2
done
echo "App is up!"

echo "Running E2E tests..."
yarn test:e2e

echo "Tests finished. Keeping container alive..."
wait $SERVER_PID