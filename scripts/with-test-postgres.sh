#!/usr/bin/env bash
# Starts marista-postgres-test, runs the given command, and always tears down the container (and volume) on exit.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

COMPOSE_FILES=(-f docker-compose.test.yml)

cleanup() {
  docker compose "${COMPOSE_FILES[@]}" down -v
}

trap cleanup EXIT INT TERM

docker compose "${COMPOSE_FILES[@]}" up -d --wait postgres-test

exec "$@"
