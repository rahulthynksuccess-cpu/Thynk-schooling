# ─────────────────────────────────────────────────────────
# HOSTINGER DEPLOYMENT GUIDE — thynkschooling.in
# ─────────────────────────────────────────────────────────
# This file is for reference. Do NOT commit secrets.
# Set all variables in Hostinger → Node.js App → Environment.

# 1. Build the app locally first:
#      npm run build
#
# 2. Upload the entire project to Hostinger via:
#    - Git (recommended): push to GitHub, connect in Hostinger
#    - FTP: upload all files
#
# 3. In Hostinger control panel:
#    - Node.js version: 20.x
#    - Startup command: npm run start
#    - Port: 3000 (Hostinger maps this to 80/443)
#
# 4. Set environment variables in Hostinger panel.
#    Required variables — fill these in Hostinger, NOT here:
#
#    NEXT_PUBLIC_APP_NAME=Thynk Schooling
#    NEXT_PUBLIC_APP_URL=https://thynkschooling.in
#    NEXT_PUBLIC_APP_ENV=production
#    NEXT_PUBLIC_API_URL=https://api.thynkschooling.in/api
#    NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_xxxxx
#    JWT_SECRET=<strong random string>
#    JWT_REFRESH_SECRET=<strong random string>
#    DATABASE_URL=postgresql://user:pass@localhost:5432/thynk_schooling
#    REDIS_URL=redis://localhost:6379
#    AWS_S3_BUCKET=thynk-schooling-media
#    AWS_ACCESS_KEY_ID=...
#    AWS_SECRET_ACCESS_KEY=...
#    MSG91_API_KEY=...
#    RAZORPAY_KEY_SECRET=...
#    BUILD_OUTPUT=standalone
#
# 5. After setting env vars, trigger a rebuild in Hostinger.
#
# 6. SSL: Enable free SSL (Let's Encrypt) in Hostinger panel.
#
# ─────────────────────────────────────────────────────────
