# Deploy Guide — Pres-Manage App

Deploy the app on a private VPS using **PM2 + Nginx**.

---

## Prerequisites

- Ubuntu 22.04+ (or Debian-based)
- Node.js 20, npm, PostgreSQL 16, nginx, PM2

### Install Dependencies

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo bash -
sudo apt install -y nodejs nginx certbot python3-certbot-nginx postgresql git
sudo npm install -g pm2
```

---

## Setup

### 1. Clone the Repository

```bash
git clone <your-repo-url> ~/app
cd ~/app
```

### 2. Configure Environment

```bash
cp backend/.env.example backend/.env
nano backend/.env
```

Fill in the required values:

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | `postgresql://user:password@localhost:5432/pres_manage?schema=public` |
| `JWT_SECRET` | `openssl rand -hex 32` |
| `JWT_REFRESH_SECRET` | `openssl rand -hex 32` |
| `FRONTEND_URL` | `https://your-domain.com` |

### 3. Create Database

```bash
sudo -u postgres createdb pres_manage
# Optionally create a dedicated user:
sudo -u postgres psql -c "CREATE USER appuser WITH PASSWORD 'strong-password';"
sudo -u postgres psql -c "GRANT ALL ON DATABASE pres_manage TO appuser;"
```

### 4. First Deploy

```bash
bash deploy.sh
```

This will:
- Pull latest code
- Install dependencies (both frontend & backend)
- Generate Prisma client
- Build both apps
- Push database schema
- Start/Restart PM2 processes

### 5. Verify PM2 Processes

```bash
pm2 status
# Should show: pres-api (online), pres-frontend (online)
```

---

## Nginx Configuration

### 1. Create Site Config

```bash
sudo nano /etc/nginx/sites-available/pres-manage
```

Paste the following (replace `your-domain.com` with your actual domain):

```nginx
server {
    listen 80;
    server_name your-domain.com;

    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

### 2. Enable Site & SSL

```bash
sudo ln -s /etc/nginx/sites-available/pres-manage /etc/nginx/sites-enabled/
sudo certbot --nginx -d your-domain.com
sudo nginx -s reload
```

---

## Deploy Updates

```bash
bash deploy.sh
```

Or manually:

```bash
git pull origin main
cd backend && npm ci && npx prisma generate && npm run build && cd ..
cd frontend && npm ci && npm run build && cd ..
pm2 startOrReload ecosystem.config.js --update-env
```

---

## CI/CD with GitHub Actions

Two workflows are provided in `.github/workflows/`:

### CI — `ci.yml`

Runs on **every push and pull request**. Checks code quality before merging:

- TypeScript typecheck (backend + frontend)
- ESLint (frontend)
- Build (backend + frontend)

### CD — `deploy.yml`

Runs on **push to `main`**. Auto-deploys to your VPS:

1. Connects via SSH using `appleboy/ssh-action`
2. Pulls the latest code
3. Runs `bash deploy.sh`

### Required GitHub Secrets

Go to your repo → **Settings → Secrets and variables → Actions** and add:

| Secret | Description |
|--------|-------------|
| `VPS_HOST` | Your VPS IP or domain (e.g. `192.168.1.100`) |
| `VPS_USER` | SSH username (e.g. `ubuntu` or `root`) |
| `VPS_SSH_KEY` | Private SSH key (paste the whole key, including `-----BEGIN...-----`) |

Also add the **public key** to `~/.ssh/authorized_keys` on your VPS.

---

## Useful PM2 Commands

```bash
pm2 status                  # Check all processes
pm2 logs pres-api           # View backend logs
pm2 logs pres-frontend      # View frontend logs
pm2 monit                   # Resource monitor
pm2 startup                 # Auto-start on server boot
pm2 save                    # Save process list
```

---

## Useful Nginx Commands

```bash
sudo nginx -t               # Test config
sudo nginx -s reload        # Reload config
sudo nginx -s restart       # Restart nginx
sudo tail -f /var/log/nginx/error.log
```

---

## Project Structure (After Build)

```
├── backend/
│   ├── dist/               # Compiled Express API
│   ├── node_modules/
│   └── prisma/
├── frontend/
│   ├── .next/
│   │   ├── standalone/     # Next.js standalone server
│   │   └── static/         # Static assets
│   ├── node_modules/
│   └── public/
├── .github/
│   └── workflows/
│       ├── ci.yml          # Typecheck + lint + build
│       └── deploy.yml      # Auto-deploy to VPS
├── ecosystem.config.js     # PM2 process config
├── deploy.sh               # Deploy script
└── logs/                   # PM2 log files
```
