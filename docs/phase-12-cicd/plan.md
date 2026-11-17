# Phase 12 — CI/CD Pipeline & Deployment

## Goal
Automated CI/CD pipelines using GitHub Actions. Main branch only. Zero downtime deployments. Sensitive files never committed.

---

## GitHub Actions Workflow Files

### 4 Workflow Files (in `.github/workflows/`)

#### 1. `backend-ci.yml` — Backend Testing
```yaml
name: Backend CI

on:
  push:
    branches: [main]
    paths: ['backend/**']
  pull_request:
    branches: [main]
    paths: ['backend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    
    services:
      mysql:
        image: mysql:8.0
        env:
          MYSQL_ROOT_PASSWORD: root
          MYSQL_DATABASE: auramed_test
        options: --health-cmd="mysqladmin ping" --health-interval=10s
        ports: ['3306:3306']
    
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: '8.4'
          extensions: pdo_mysql, mbstring, openssl
          coverage: none
      
      - name: Install dependencies
        working-directory: backend
        run: composer install --no-interaction --prefer-dist
      
      - name: Setup test environment
        working-directory: backend
        run: |
          cp .env.example .env.testing
          php artisan key:generate --env=testing
      
      - name: Run migrations
        working-directory: backend
        run: php artisan migrate --env=testing --force
      
      - name: Run Pest tests
        working-directory: backend
        run: php artisan test --env=testing
      
      - name: PHP CS Fixer (style check)
        working-directory: backend
        run: vendor/bin/pint --test
```

#### 2. `frontend-ci.yml` — Frontend Testing
```yaml
name: Frontend CI

on:
  push:
    branches: [main]
    paths: ['frontend/**']
  pull_request:
    branches: [main]
    paths: ['frontend/**']

jobs:
  test:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
          cache: 'npm'
          cache-dependency-path: frontend/package-lock.json
      
      - name: Install dependencies
        working-directory: frontend
        run: npm ci
      
      - name: ESLint (zero warnings)
        working-directory: frontend
        run: npm run lint -- --max-warnings 0
      
      - name: Vitest unit tests
        working-directory: frontend
        run: npm run test -- --run
      
      - name: Build verification
        working-directory: frontend
        run: npm run build
```

#### 3. `backend-deploy.yml` — Backend Production Deploy
```yaml
name: Backend Deploy

on:
  push:
    branches: [main]
    paths: ['backend/**']

needs: [backend-ci]  # Only deploy if CI passes

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Deploy to production via SSH
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: |
            cd /path/to/auramed/backend
            git pull origin main
            composer install --no-dev --optimize-autoloader --no-interaction
            php artisan config:cache
            php artisan route:cache
            php artisan view:cache
            php artisan migrate --force
            php artisan queue:restart
            php artisan storage:link
            echo "✅ Backend deployed successfully"
```

#### 4. `frontend-deploy.yml` — Frontend Production Deploy
```yaml
name: Frontend Deploy

on:
  push:
    branches: [main]
    paths: ['frontend/**']

jobs:
  deploy:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '24'
      
      - name: Install and build
        working-directory: frontend
        env:
          VITE_API_URL: ${{ secrets.VITE_API_URL }}
        run: |
          npm ci
          npm run build
      
      - name: Deploy dist to server
        uses: appleboy/scp-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          source: 'frontend/dist/*'
          target: '/path/to/auramed/public_html'
          strip_components: 2
      
      - name: Reload nginx
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.PROD_HOST }}
          username: ${{ secrets.PROD_USER }}
          key: ${{ secrets.PROD_SSH_KEY }}
          script: sudo systemctl reload nginx
```

---

## GitHub Secrets Required
```
PROD_HOST          → Production server IP/hostname
PROD_USER          → SSH username
PROD_SSH_KEY       → Private SSH key (ED25519)
VITE_API_URL       → https://api.auramed.yourdomain.com
```

> [!CAUTION]
> Never add `PROD_DB_PASSWORD` or any database credentials to GitHub secrets if they can be avoided. Use `.env` file on the server directly (not committed).

---

## Production `.env` on Server (Never Committed)
```bash
# backend/.env (exists on server ONLY, NOT in git)
APP_ENV=production
APP_DEBUG=false
APP_KEY=base64:...
APP_URL=https://api.auramed.yourdomain.com

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=auramed_prod
DB_USERNAME=auramed_user
DB_PASSWORD=STRONG_PASSWORD_HERE

SANCTUM_STATEFUL_DOMAINS=auramed.yourdomain.com

CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file

MAIL_MAILER=smtp
MAIL_HOST=...
```

---

## Files NEVER Uploaded to Production
- `vendor/` (composer install on server)
- `node_modules/` (never on server)
- `.env` (server-managed only)
- `storage/logs/` (server-generated)
- `storage/framework/` (server-generated)
- `database/*.sqlite`
- `frontend/dist/` (built by CI, uploaded via SCP)
- `.git/` (not needed in web root)
- `tests/` (not needed in production)

---

## Production Database Safety
- Migrations run with `--force` flag only (no interactive prompt in CI)
- Never use `migrate:fresh` or `migrate:reset` in CI/CD
- If destructive migration needed: manual review + backup first
- Production DB backups: daily mysqldump cronjob on server (outside CI scope)

---

## Deliverables for Phase 12
- [ ] `.github/workflows/backend-ci.yml` working
- [ ] `.github/workflows/frontend-ci.yml` working
- [ ] `.github/workflows/backend-deploy.yml` working
- [ ] `.github/workflows/frontend-deploy.yml` working
- [ ] GitHub Secrets configured
- [ ] Production `.env` on server (not in git)
- [ ] `.gitignore` confirmed: all sensitive/unnecessary files excluded
- [ ] Zero-downtime deploy verified (no `artisan down` needed)
- [ ] Post-deploy verification: `GET /api/health` returns 200
