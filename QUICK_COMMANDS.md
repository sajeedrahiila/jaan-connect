# Quick Command Reference - 200+ User Capacity

## 🚀 Quick Start (60 seconds)

```bash
# 1. Install & setup (one-time)
bash setup-production.sh

# 2. Start application
pm2 start ecosystem.config.js --env production

# 3. Verify it's running
pm2 status

# 4. Test with 200 users
bash load-test.sh
```

---

## 📊 Monitoring Commands

```bash
# Real-time CPU/Memory/Status
pm2 monit

# View live logs
pm2 logs

# Process details
pm2 info jaan-api

# Restart everything
pm2 restart all

# Stop everything
pm2 stop all

# View process list
pm2 status

# Web dashboard (access http://localhost:9615)
pm2 web
```

---

## 🧪 Load Testing

```bash
# Quick test (200 concurrent users, 1000 requests)
bash load-test.sh

# Custom with Apache Bench
ab -n 1000 -c 200 http://localhost:8080/

# Expected output
# Requests per second:    500-1000
# Time per request:       100-300 ms
# Failed requests:        < 5
```

---

## 📈 Performance Checks

```bash
# Check database connection count
psql -h localhost -U jaan_admin -d jaan_connect -c \
  "SELECT count(*) FROM pg_stat_activity;"

# View slow queries (> 1 second)
psql -h localhost -U jaan_admin -d jaan_connect -c \
  "SELECT query, calls, mean_time FROM pg_stat_statements \
   ORDER BY mean_time DESC LIMIT 10;"

# Check memory usage
ps aux | grep node

# Check disk space
df -h
```

---

## 🔧 Development vs Production

### Development Mode
```bash
# Backend only
npm run server

# Frontend only
npm run dev

# Both together
npm run dev:all
```

### Production Mode
```bash
# Build first
npm run build

# Start with cluster mode (uses all CPU cores)
pm2 start ecosystem.config.js --env production

# Save state for auto-restart
pm2 save

# Auto-start on boot
pm2 startup
```

---

## 🗄️ Database Operations

```bash
# Connect to database
psql -h localhost -U jaan_admin -d jaan_connect

# Create recommended indexes
psql -h localhost -U jaan_admin -d jaan_connect << 'SQL'
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX idx_invoices_user_id ON invoices(user_id);
SQL

# Check query performance
EXPLAIN ANALYZE SELECT * FROM products WHERE category_id = 1;

# Vacuum and analyze (maintenance)
VACUUM ANALYZE;
```

---

## 📋 Configuration Files

### Check Compression Middleware
```bash
grep -n "compression" server.ts
```

### Check Connection Pool
```bash
grep -n "max\|min\|timeout" src/lib/db.ts | head -10
```

### Check PM2 Config
```bash
cat ecosystem.config.js | grep -E "instances|memory|node_args"
```

### Check Load Test Script
```bash
head -20 load-test.sh
```

---

## 🆘 Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs

# Check port is available
netstat -tlnp | grep 3001

# Check Node process
ps aux | grep node

# Kill and restart
pm2 kill
pm2 start ecosystem.config.js --env production
```

### High Memory Usage
```bash
# Monitor memory
pm2 monit

# If consistently > 1GB
pm2 restart all

# Check for memory leaks in logs
pm2 logs | grep -i "memory\|leak"
```

### Database Connection Errors
```bash
# Check active connections
psql -h localhost -U jaan_admin -d jaan_connect -c \
  "SELECT count(*) FROM pg_stat_activity;"

# If > 50, kill idle ones
psql -h localhost -U jaan_admin -d jaan_connect -c \
  "SELECT pg_terminate_backend(pid) FROM pg_stat_activity \
   WHERE state = 'idle' AND query_start < NOW() - INTERVAL '10 minutes';"
```

### Slow Responses
```bash
# 1. Check database
psql -h localhost -U jaan_admin -d jaan_connect -c \
  "SELECT query, mean_time FROM pg_stat_statements \
   ORDER BY mean_time DESC LIMIT 5;"

# 2. Check server logs
pm2 logs | grep "duration"

# 3. Add missing indexes (see PERFORMANCE_CHECKLIST.md)

# 4. Check CPU/Memory
pm2 monit
```

---

## 📚 Documentation Files

```bash
# Architecture overview
cat IMPLEMENTATION_SUMMARY.md

# Step-by-step deployment
cat DEPLOYMENT_GUIDE.md

# Scalability decisions
cat SCALABILITY_GUIDE.md

# Pre/post-launch checks
cat PERFORMANCE_CHECKLIST.md

# This quick reference
cat QUICK_COMMANDS.md
```

---

## 🎯 Pre-Production Checklist

```bash
# ✓ Install dependencies
npm install

# ✓ Verify compression package
npm list compression

# ✓ Build production bundle
npm run build && du -sh dist/

# ✓ Test PM2 config
pm2 start ecosystem.config.js --env production --dry-run

# ✓ Check database connection
psql -h localhost -U jaan_admin -d jaan_connect -c "SELECT 1;"

# ✓ Run load test
bash load-test.sh

# ✓ Monitor resources
pm2 monit
```

---

## 📊 Performance Targets

For **200 concurrent users**, expect:

```
✓ Requests/sec:     500-1000
✓ Response time:    100-300 ms (average)
✓ p95 response:     < 500 ms
✓ p99 response:     < 1000 ms
✓ Memory usage:     < 1 GB
✓ CPU usage:        < 70%
✓ Error rate:       < 0.5%
✓ Success rate:     > 99.5%
```

If any metrics fall short, see PERFORMANCE_CHECKLIST.md for optimization steps.

---

## 🔗 Key Files Structure

```
jaan-connect/
├── server.ts                      ← Compression + timeouts
├── src/lib/db.ts                  ← Connection pool (50 max)
├── ecosystem.config.js            ← PM2 cluster config
├── load-test.sh                   ← Load test script
├── setup-production.sh            ← Setup automation
├── package.json                   ← Dependencies (includes compression)
│
├── IMPLEMENTATION_SUMMARY.md      ← This overview
├── DEPLOYMENT_GUIDE.md            ← Step-by-step guide
├── SCALABILITY_GUIDE.md           ← Architecture decisions
├── PERFORMANCE_CHECKLIST.md       ← Pre/post-launch checks
└── QUICK_COMMANDS.md              ← This file
```

---

## 🎓 Learning Resources

- **PM2**: https://pm2.keymetrics.io/
- **PostgreSQL**: https://www.postgresql.org/docs/
- **Express**: https://expressjs.com/
- **Node.js**: https://nodejs.org/docs/

---

## 💾 Save PM2 Configuration

```bash
# After testing, save process list
pm2 save

# Auto-start on server reboot
pm2 startup

# Check saved config
pm2 status
```

---

## 🔐 Environment Setup

```bash
# Create .env.production
cp .env.example .env.production

# Edit with your values
nano .env.production

# Important variables:
# NODE_ENV=production
# DATABASE_URL=postgresql://...
# PORT=3001
# CORS_ORIGIN=https://yourdomain.com
```

---

**Status**: ✅ Ready for 200+ concurrent users
**Last Updated**: 2024
**Version**: 1.0

Use `cat IMPLEMENTATION_SUMMARY.md` for detailed overview.
