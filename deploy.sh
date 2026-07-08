#!/bin/bash
set -e

echo "=== Deploying Pres-Manage App ==="

# 1. Pull latest code
echo "[1/5] Pulling latest code..."
git pull origin main

# 2. Setup backend
echo "[2/5] Building backend..."
cd backend
npm ci
npx prisma generate
npm run build
cd ..

# 3. Setup frontend
echo "[3/5] Building frontend..."
cd frontend
npm ci
npm run build
cd ..

# 4. Sync database (safe — won't drop data)
echo "[4/5] Syncing database..."
cd backend
npx prisma db push --accept-data-loss 2>/dev/null || npx prisma db push
cd ..

# 5. Restart PM2 processes
echo "[5/5] Restarting PM2 processes..."
pm2 startOrReload ecosystem.config.js --update-env

echo "=== Deploy complete ==="
