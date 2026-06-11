# Bezon - EC2 Deployment Guide

Stack: **Node.js API** + **React (Vite)** + **Neon PostgreSQL** + **Nginx**

---

## 1. EC2 Setup (one time)

Spin up an **Ubuntu 22.04** instance (t3.small or larger). Open ports **22, 80, 443** in the security group.

```bash
ssh -i your-key.pem ubuntu@YOUR_EC2_IP

# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs git nginx
```

---

## 2. Clone the Repo

```bash
cd /home/ubuntu
git clone https://github.com/YOUR_USERNAME/bezon.git
cd bezon
```

---

## 3. Configure Environment

```bash
cp apps/api/.env.example apps/api/.env
nano apps/api/.env
```

Fill in these values - everything else can stay as the example:

```env
NODE_ENV=production
PORT=5002

DATABASE_URL=<your Neon connection string>

JWT_SECRET=<run: openssl rand -hex 64>
COOKIE_SECRET=<run: openssl rand -hex 64>

ALLOWED_ORIGINS=http://YOUR_EC2_IP   # or https://yourdomain.com

RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=xxxx

S3_BUCKET_NAME=bezon-assets
S3_REGION=ap-south-1
AWS_ACCESS_KEY_ID=xxxx
AWS_SECRET_ACCESS_KEY=xxxx
```

> [!CAUTION]
> Never commit `.env` to git. It's already in `.gitignore`.

---

## 4. Build & Start

```bash
bash start.sh
```

This installs deps, runs Prisma migrations on Neon, builds the API and React app, then starts the Node server on port 5002.

The process runs in the foreground. To keep it alive after SSH disconnect, run it in a `screen` session:

```bash
screen -S bezon
bash start.sh
# Press Ctrl+A then D to detach
# Re-attach later with: screen -r bezon
```

---

## 5. Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/bezon
```

```nginx
server {
    listen 80;
    server_name YOUR_EC2_IP_OR_DOMAIN;

    root /home/ubuntu/bezon/apps/web/dist;
    index index.html;

    # React Router
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy API to Node.js
    location /api {
        proxy_pass http://127.0.0.1:5002;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header Cookie $http_cookie;
        proxy_read_timeout 60s;
    }

    location /mastra {
        proxy_pass http://127.0.0.1:5002;
        proxy_set_header Host $host;
        proxy_set_header Cookie $http_cookie;
    }

    client_max_body_size 20M;
}
```

```bash
sudo ln -sf /etc/nginx/sites-available/bezon /etc/nginx/sites-enabled/bezon
sudo nginx -t && sudo systemctl reload nginx
```

---

## 6. Verify

```bash
curl http://localhost:5002/api/v1/health
# Should return: {"success":true,"message":"Bezon API is healthy",...}
```

Then open `http://YOUR_EC2_IP` in a browser.

---

## Re-deploying After a Code Change

```bash
cd /home/ubuntu/bezon
git pull
bash start.sh
```

---

## Optional: HTTPS with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

---

## First-Time Seed (Optional)

```bash
npm run db:seed --workspace=@bezon/api
```
