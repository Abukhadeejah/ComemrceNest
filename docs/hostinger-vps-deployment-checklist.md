# Hostinger VPS Deployment Checklist (Next.js)

Use this checklist whenever you deploy `web` to Hostinger VPS.

## 1) Environment variables

Set these variables in the shell/process manager that starts Next.js:

- `NODE_ENV=production`
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `SUPABASE_SERVICE_ROLE_KEY=...`
- `NEXTAUTH_URL=...` (if auth routes are used)
- `NEXTAUTH_SECRET=...` (if auth routes are used)

### Quick verify

```bash
printenv | grep -E 'NODE_ENV|NEXT_PUBLIC_SUPABASE_URL|SUPABASE_SERVICE_ROLE_KEY|NEXTAUTH_URL|NEXTAUTH_SECRET'
```

## 2) Install and build

From project root (`web`):

```bash
npm ci
npm run build
```

Expected: build finishes without `Failed to collect page data` errors.

## 3) Start/restart app

Choose one process manager.

### Option A: PM2

```bash
pm2 start ecosystem.config.cjs --env production
# On next deploys (after fresh build)
pm2 restart commercenest-web
pm2 save
```

If PM2 startup is not configured yet:

```bash
pm2 startup
pm2 save
```

### Option B: systemd service

Template files in repo:
- `deploy/systemd/commercenest-web.service`
- `deploy/systemd/web.env.example`

Before enabling service, update `User`, `WorkingDirectory`, and `ExecStart` in service file if your VPS uses different values.

First-time setup:

```bash
sudo mkdir -p /etc/commercenest
sudo cp deploy/systemd/web.env.example /etc/commercenest/web.env
sudo nano /etc/commercenest/web.env
sudo chmod 600 /etc/commercenest/web.env

sudo cp deploy/systemd/commercenest-web.service /etc/systemd/system/commercenest-web.service
sudo systemctl daemon-reload
sudo systemctl enable commercenest-web
sudo systemctl start commercenest-web
```

On next deploys:

```bash
sudo systemctl restart commercenest-web
sudo systemctl status commercenest-web --no-pager
```

## 4) Smoke checks after deploy

```bash
curl -I http://127.0.0.1:3000/
curl -i http://127.0.0.1:3000/api/health
curl -i http://127.0.0.1:3000/api/admin/attributes
curl -i http://127.0.0.1:3000/api/admin/attributes/test-id
```

Notes:
- Last two admin routes may return `401/403/404` depending on auth/data, which is okay.
- They should not return process crash/500 caused by missing env at startup.

## 5) Reverse proxy check (Nginx/Apache)

- Ensure proxy forwards to app port (commonly `3000`).
- Ensure `Host` header is forwarded.
- Reload proxy config after changes.

## 6) If you still see route build errors

1. Re-check env values are present **during build** and **during runtime**.
2. Re-run build manually: `npm run build`.
3. Check process logs:
   - PM2: `pm2 logs commercenest-web --lines 200`
   - systemd: `journalctl -u commercenest-web -n 200 --no-pager`
4. Confirm Node version matches project expectation (Node 20+ recommended for Next 16).

## 7) Minimal rollback plan

- Keep previous build directory or previous container image.
- If health checks fail after deploy, restart last known good release and restore previous env file.

---

## One-time hardening tip

Prefer setting secrets in your process manager config (PM2 ecosystem file or systemd EnvironmentFile) instead of exporting manually per shell session.
