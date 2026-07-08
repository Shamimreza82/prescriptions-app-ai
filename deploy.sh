#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/Shamimreza82/prescriptions-app-ai.git"
APP_DIR="/media/algorify/Server/projects/production-current/prescriptions-app-ai"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
VPS_IP="123.136.30.206"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
error() { echo -e "${RED}[✗]${NC} $1"; }
info()  { echo -e "${CYAN}[i]${NC} $1"; }

cleanup() {
    if [ $? -ne 0 ]; then
        error "Deployment failed at line $LINENO"
    fi
}
trap cleanup EXIT

check_prerequisites() {
    info "Checking prerequisites..."
    command -v node >/dev/null 2>&1 || { error "Node.js is required"; exit 1; }
    command -v npm  >/dev/null 2>&1 || { error "npm is required"; exit 1; }
    command -v git  >/dev/null 2>&1 || { error "git is required"; exit 1; }
    command -v pm2  >/dev/null 2>&1 || { error "PM2 is required (npm install -g pm2)"; exit 1; }
    command -v nginx >/dev/null 2>&1 || { error "Nginx is required"; exit 1; }
    log "All prerequisites met"
}

clone_or_pull() {
    info "Setting up application..."
    if [ -d "$APP_DIR/.git" ]; then
        cd "$APP_DIR"
        git pull origin main
        log "Repository updated"
    else
        mkdir -p "$APP_DIR"
        git clone "$REPO_URL" "$APP_DIR"
        cd "$APP_DIR"
        log "Repository cloned"
    fi
}

setup_env() {
    info "Environment configuration..."

    if [ ! -f "$BACKEND_DIR/.env" ]; then
        warn "backend/.env not found — creating"

        read -rp "  Database URL [postgresql://postgres:finupsbd@localhost:5432/pres_bd?schema=public]: " db_url
        db_url="${db_url:-postgresql://postgres:finupsbd@localhost:5432/pres_bd?schema=public}"

        read -rp "  JWT Secret [randomly generated]: " jwt_secret
        jwt_secret="${jwt_secret:-$(openssl rand -hex 32)}"

        read -rp "  JWT Refresh Secret [randomly generated]: " jwt_refresh
        jwt_refresh="${jwt_refresh:-$(openssl rand -hex 32)}"

        read -rp "  Frontend URL [http://${VPS_IP}]: " frontend_url
        frontend_url="${frontend_url:-http://${VPS_IP}}"

        cat > "$BACKEND_DIR/.env" <<EOF
DATABASE_URL="${db_url}"
JWT_SECRET="${jwt_secret}"
JWT_REFRESH_SECRET="${jwt_refresh}"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=5000
NODE_ENV=production
FRONTEND_URL="${frontend_url}"
EOF
        log "backend/.env created"
    else
        log "backend/.env already exists — skipping"
    fi

    if [ ! -f "$FRONTEND_DIR/.env.local" ]; then
        warn "frontend/.env.local not found — creating"

        read -rp "  Next.js public API URL [http://${VPS_IP}/api]: " api_url
        api_url="${api_url:-http://${VPS_IP}/api}"

        cat > "$FRONTEND_DIR/.env.local" <<EOF
NEXT_PUBLIC_API_URL=${api_url}
NEXT_PUBLIC_MEDICINE_API_URL=https://medicine-backen.onrender.com/api/v1
EOF
        log "frontend/.env.local created"
    else
        log "frontend/.env.local already exists — skipping"
    fi
}

install_deps() {
    info "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm ci
    log "Backend dependencies installed"

    info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm ci
    log "Frontend dependencies installed"
}

setup_database() {
    info "Setting up database..."
    cd "$BACKEND_DIR"
    npx prisma generate
    log "Prisma client generated"

    npx prisma db push
    log "Database schema synced"
}

build() {
    info "Building backend..."
    cd "$BACKEND_DIR"
    npm run build
    log "Backend built"

    info "Building frontend..."
    cd "$FRONTEND_DIR"
    npm run build
    log "Frontend built"
}

start_pm2() {
    info "Starting services with PM2..."
    cd "$APP_DIR"
    pm2 startOrReload ecosystem.config.js --update-env
    pm2 save
    log "PM2 processes started"
}

setup_nginx() {
    info "Nginx configuration..."
    local nginx_conf="$APP_DIR/nginx-prescriptions-app.conf"

    cat > "$nginx_conf" <<EOF
server {
    listen 80;
    server_name ${VPS_IP};

    client_max_body_size 50M;

    location /_next/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }

    location /uploads/ {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

    log "Nginx config saved to $nginx_conf"
    warn "Run these commands with sudo to enable it:"
    echo ""
    echo "  sudo cp $nginx_conf /etc/nginx/sites-available/prescriptions-app"
    echo "  sudo ln -sf /etc/nginx/sites-available/prescriptions-app /etc/nginx/sites-enabled/"
    echo "  sudo nginx -t && sudo systemctl reload nginx"
    echo ""
}

echo ""
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo -e "${CYAN}   Prescriptions App — Deploy Script   ${NC}"
echo -e "${CYAN}═══════════════════════════════════════${NC}"
echo ""

check_prerequisites
clone_or_pull
setup_env
install_deps
setup_database
build
start_pm2
setup_nginx

echo ""
log "Deployment complete!"
info "  Frontend: http://${VPS_IP}"
info "  Backend:  http://${VPS_IP}/api/health"
info "  PM2:      pm2 list"
echo ""
