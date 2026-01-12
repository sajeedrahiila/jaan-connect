# Production Deployment Guide - 200+ Concurrent Users

## Quick Start

### 1. Install Dependencies
```bash
npm install
npm install -g pm2
```

### 2. Build for Production
```bash
npm run build
```

### 3. Start with PM2 (Clustering Mode)
```bash
# Development
npm run server

# Production (with clustering)
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## Environment Variables

Create `.env.production`:
```env
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://jaan_admin:jaan_password_2026@localhost:5432/jaan_connect

# CORS - Update for production domain
CORS_ORIGIN=https://yourdomain.com

# Session
SESSION_SECRET=your-secret-key-here

# API Rate Limiting (optional)
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX=100
```

---

## Database Optimization for 200+ Users

### 1. Add Indexes (Essential)
```bash
npm run db:migrate
```

### 2. Connection Pool Tuning
Already configured in `src/lib/db.ts`:
- Max connections: 50
- Min connections: 10
- Idle timeout: 30 seconds
- Statement timeout: 60 seconds

### 3. Monitor Connections
```sql
-- Check current connections
SELECT count(*) FROM pg_stat_activity;

-- Monitor slow queries
SELECT query, calls, mean_time 
FROM pg_stat_statements 
ORDER BY mean_time DESC 
LIMIT 10;
```

---

## Server Configuration

### A. Single Server Setup (200-500 users)

**Minimum Requirements:**
- 4+ CPU cores
- 8GB RAM
- 50GB SSD
- Node.js 18+

**Start Script:**
```bash
# With cluster mode (uses all CPU cores)
pm2 start ecosystem.config.js --env production
pm2 monit
```

### B. Multi-Server Setup (500+ users)

**Nginx Load Balancer Config:**
```nginx
upstream jaan_api {
    server 10.0.1.10:3001 weight=1;
    server 10.0.1.11:3001 weight=1;
    server 10.0.1.12:3001 weight=1;
    keepalive 32;
}

server {
    listen 80;
    server_name api.jaan-distributors.com;

    location / {
        proxy_pass http://jaan_api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 60s;
        proxy_connect_timeout 60s;
    }
}
```

---

## Performance Monitoring

### 1. PM2 Monitoring
```bash
# Real-time monitoring
pm2 monit

# Log monitoring
pm2 logs jaan-api

# Get detailed stats
pm2 info jaan-api
```

### 2. Database Query Monitoring
```bash
# Enable slow query log
ALTER SYSTEM SET log_min_duration_statement = 1000; -- log queries > 1 second
SELECT pg_reload_conf();

# View slow queries
tail -f /var/log/postgresql/postgresql.log
```

### 3. Application Metrics
- Response time: Target <200ms
- Database query time: Target <50ms
- Memory usage: Monitor with `pm2 monit`
- CPU usage: Monitor with `pm2 monit` or `top`

---

## Load Testing (200 Users)

### 1. Run Load Test
```bash
chmod +x load-test.sh
./load-test.sh
```

### 2. With Artillery (Advanced)
```bash
npm install -g artillery
artillery quick --count 200 --num 50 http://your-server:3001/
```

### 3. Expected Results
```
Requests per second:     500-1000
Time per request:        100-300ms
Failed requests:         < 0.5%
95th percentile:         < 500ms
99th percentile:         < 1000ms
```

---

## Caching Strategy

### 1. Redis Setup (Optional but Recommended)
```bash
# Install Redis
sudo apt-get install redis-server

# Start Redis
redis-server --daemonize yes
```

### 2. Add Redis Caching
```typescript
import redis from 'redis';

const redisClient = redis.createClient({
  host: 'localhost',
  port: 6379,
});

// Cache products
const cacheKey = 'products:all';
const cached = await redisClient.get(cacheKey);
if (cached) return JSON.parse(cached);

const products = await query('SELECT * FROM products');
await redisClient.setex(cacheKey, 300, JSON.stringify(products)); // 5 min TTL
```

---

## Security Hardening

### 1. Enable HTTPS
```bash
# With Let's Encrypt & Certbot
sudo apt-get install certbot python3-certbot-nginx
sudo certbot certonly --nginx -d api.jaan-distributors.com
```

### 2. Rate Limiting
```typescript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // requests per window
});

app.use('/api/', limiter);
```

### 3. Environment Variables
```bash
# Never commit .env files
echo ".env.production" >> .gitignore

# Set securely on server
export NODE_ENV=production
export DATABASE_URL="postgres://..."
```

---

## Scaling Checklist

- [ ] Database connection pool optimized (50 connections)
- [ ] Compression enabled on server
- [ ] PM2 ecosystem.config.js configured
- [ ] Load test passes with 200 users
- [ ] Response time < 200ms
- [ ] Database queries < 50ms
- [ ] Error rate < 0.5%
- [ ] Memory usage stable
- [ ] CPU usage < 70%
- [ ] Indexes created on frequently queried columns
- [ ] Session management configured
- [ ] CORS configured for production domain
- [ ] Logging enabled (PM2 logs)
- [ ] Monitoring set up (pm2 monit or external tool)
- [ ] Backup strategy in place
- [ ] Health check endpoint configured

---

## Troubleshooting

### High Memory Usage
```bash
# Check memory leaks
pm2 monit

# Restart affected processes
pm2 restart all

# Increase heap size
pm2 start ecosystem.config.js --node-args="--max-old-space-size=4096"
```

### Database Connection Errors
```sql
-- Check current connections
SELECT * FROM pg_stat_activity;

-- Kill idle connections
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE idle_in_transaction_session_timeout > interval '1 hour';
```

### Slow API Responses
1. Check database query time: `EXPLAIN ANALYZE SELECT ...`
2. Add missing indexes
3. Check server CPU/memory: `pm2 monit`
4. Review application logs: `pm2 logs`

---

## Maintenance

### Daily
- Monitor PM2 processes: `pm2 monit`
- Check error logs: `pm2 logs`
- Database backups

### Weekly
- Analyze database performance
- Review slow query logs
- Check disk space

### Monthly
- Database maintenance (VACUUM, ANALYZE)
- Update dependencies
- Review security logs
- Capacity planning review

---

## Contacts & Support

- Database Issues: Check PostgreSQL logs
- Performance Issues: Use PM2 monitoring + slow query logs
- Load Test Results: See `load-test-results_*.txt`

For 200+ concurrent users, this configuration should provide stable performance.
Target: 99.9% uptime, <200ms response times.
