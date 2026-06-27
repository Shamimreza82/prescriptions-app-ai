#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/Shamimreza82/prescriptions-app-ai.git"
APP_DIR="/media/algorify/Server/projects/production-current/prescriptions-app-ai$"
BACKEND_DIR="$APP_DIR/backend"
FRONTEND_DIR="$APP_DIR/frontend"
PM2_BACKEND="pres-backend"
PM2_FRONTEND="pres-frontend"

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

    # Load current values from existing files as defaults
    local curr_db_url=$(grep -oP '^DATABASE_URL="\K[^"]+' "$BACKEND_DIR/.env" 2>/dev/null || echo "")
    local curr_jwt=$(grep -oP '^JWT_SECRET="\K[^"]+' "$BACKEND_DIR/.env" 2>/dev/null || echo "")
    local curr_jwt_refresh=$(grep -oP '^JWT_REFRESH_SECRET="\K[^"]+' "$BACKEND_DIR/.env" 2>/dev/null || echo "")
    local curr_frontend_url=$(grep -oP '^FRONTEND_URL="\K[^"]+' "$BACKEND_DIR/.env" 2>/dev/null || echo "")
    local curr_port=$(grep -oP '^PORT=\K\d+' "$BACKEND_DIR/.env" 2>/dev/null || echo "")
    local curr_sentry=$(grep -oP '^SENTRY_DSN="\K[^"]+' "$BACKEND_DIR/.env" 2>/dev/null || echo "")

    info "Backend environment — press Enter to keep current values"
    read -rp "  Database URL [${curr_db_url:-postgresql://user:pass@localhost:5432/pres_manage?schema=public}]: " db_url
    db_url="${db_url:-${curr_db_url:-postgresql://user:pass@localhost:5432/pres_manage?schema=public}}"

    read -rp "  JWT Secret [${curr_jwt:-randomly generated}]: " jwt_secret
    jwt_secret="${jwt_secret:-${curr_jwt:-$(openssl rand -hex 32)}}"

    read -rp "  JWT Refresh Secret [${curr_jwt_refresh:-randomly generated}]: " jwt_refresh
    jwt_refresh="${jwt_refresh:-${curr_jwt_refresh:-$(openssl rand -hex 32)}}"

    read -rp "  Frontend URL [${curr_frontend_url:-http://123.136.30.206:3030}]: " frontend_url
    frontend_url="${frontend_url:-${curr_frontend_url:-http://123.136.30.206:3030}}"

    read -rp "  Server port [${curr_port:-5000}]: " port
    port="${port:-${curr_port:-5000}}"

    read -rp "  Sentry DSN [${curr_sentry:-leave empty to disable}]: " sentry_dsn
    sentry_dsn="${sentry_dsn:-$curr_sentry}"

    cat > "$BACKEND_DIR/.env" <<EOF
DATABASE_URL="${db_url}"
JWT_SECRET="${jwt_secret}"
JWT_REFRESH_SECRET="${jwt_refresh}"
JWT_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"
PORT=${port}
NODE_ENV=production
FRONTEND_URL="${frontend_url}"
SENTRY_DSN="${sentry_dsn}"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_REGION="ap-southeast-1"
AWS_S3_BUCKET=""
STRIPE_SECRET_KEY=""
STRIPE_WEBHOOK_SECRET=""
EOF
    log "backend/.env written"

    # Frontend
    local curr_api_url=$(grep -oP '^NEXT_PUBLIC_API_URL=\K.+' "$FRONTEND_DIR/.env.local" 2>/dev/null || echo "")
    local curr_fe_sentry=$(grep -oP '^NEXT_PUBLIC_SENTRY_DSN=\K.+' "$FRONTEND_DIR/.env.local" 2>/dev/null || echo "")

    info "Frontend environment — press Enter to keep current values"
    read -rp "  Next.js public API URL [${curr_api_url:-http://123.136.30.206:5000/api}]: " api_url
    api_url="${api_url:-${curr_api_url:-http://123.136.30.206:5000/api}}"

    read -rp "  Sentry DSN [${curr_fe_sentry:-leave empty to disable}]: " fe_sentry_dsn
    fe_sentry_dsn="${fe_sentry_dsn:-$curr_fe_sentry}"

    cat > "$FRONTEND_DIR/.env.local" <<EOF
NEXT_PUBLIC_API_URL=${api_url}
NEXT_PUBLIC_MEDICINE_API_URL=https://medicine-backen.onrender.com/api/v1
NEXT_PUBLIC_SENTRY_DSN=${fe_sentry_dsn}
EOF
    log "frontend/.env.local written"
}

install_deps() {
    info "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm install
    log "Backend dependencies installed"

    info "Installing frontend dependencies..."
    cd "$FRONTEND_DIR"
    npm install
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
    pm2 delete "$PM2_BACKEND" 2>/dev/null || true
    pm2 delete "$PM2_FRONTEND" 2>/dev/null || true
    pm2 start ecosystem.config.js
    log "Services started via ecosystem.config.js"

    pm2 save
    log "PM2 process list saved"
}

setup_nginx() {
    info "Nginx configuration..."

    read -rp "  Server domain or IP [your-domain.com]: " server_name
    server_name="${server_name:-your-domain.com}"

    read -rp "  Backend port [5000]: " backend_port
    backend_port="${backend_port:-5000}"

    read -rp "  Frontend port [3030]: " frontend_port
    frontend_port="${frontend_port:-3030}"

    cat > /etc/nginx/sites-available/prescriptions-app <<NGINX
server {
    listen 80;
    server_name ${server_name};

    client_max_body_size 50M;

    location /_next/ {
        proxy_pass http://127.0.0.1:${frontend_port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /api/ {
        proxy_pass http://127.0.0.1:${backend_port};
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
        proxy_pass http://127.0.0.1:${backend_port};
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }

    location / {
        proxy_pass http://127.0.0.1:${frontend_port};
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
NGINX

    if [ -L /etc/nginx/sites-enabled/prescriptions-app ]; then
        log "Nginx site already enabled"
    else
        ln -sf /etc/nginx/sites-available/prescriptions-app /etc/nginx/sites-enabled/
        log "Nginx site enabled"
    fi

    nginx -t && systemctl reload nginx
    log "Nginx reloaded with new configuration"

    info "Consider running: certbot --nginx -d ${server_name}"
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
info "  Frontend: http://$(cat /etc/nginx/sites-available/prescriptions-app 2>/dev/null | grep server_name | head -1 | awk '{print $2}' | tr -d ';')"
info "  Backend:  http://$(cat /etc/nginx/sites-available/prescriptions-app 2>/dev/null | grep server_name | head -1 | awk '{print $2}' | tr -d ';')/api/health"
info "  PM2:      pm2 list"
echo ""