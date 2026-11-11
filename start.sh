#!/usr/bin/env bash
set -e

cd "$(dirname "$0")"

if [ ! -d "app/node_modules" ]; then
    echo "Dependencies missing. Running setup..."
    ./setup.sh
fi

echo "Starting Agent Video Editor..."
npm --prefix app start

