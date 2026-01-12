# Scalability Guide - Handling 200+ Concurrent Users

## Current Architecture Assessment

Your application can handle 200 concurrent users with the following optimizations:

## 1. Backend Optimization (Node.js/Express)

### Connection Pooling
- **Current**: Default PostgreSQL connection pool
- **Recommended**: Increase connection pool size to 20-50 connections
- **Location**: `src/lib/db.ts`

```typescript
const pool = new Pool({
  max: 50,           // Max connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### HTTP/2 Support
- Enable HTTP/2 for better multiplexing
- Use compression middleware (gzip)

### Request Timeout
- Set appropriate timeouts to prevent hanging connections
- Current timeout should be 30-60 seconds

---

## 2. Database Optimization

### Query Optimization
- ✅ Add database indexes on frequently queried columns
- ✅ Use query result caching
- ✅ Optimize slow queries (currently monitored)

### Current Indexes Needed
```sql
-- Products table
CREATE INDEX idx_products_category ON products(category_id);
CREATE INDEX idx_products_active ON products(active);

-- Orders table
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at DESC);

-- Activity logs (if frequently queried)
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_timestamp ON activity_logs(timestamp DESC);
```

### Connection Pool Settings
- Connections per server: 20-50
- Max pool size: Increase from default 10 to 30+

---

## 3. Caching Strategy

### Redis Cache (Recommended)
```typescript
// Cache product listings
// TTL: 5-10 minutes
const CACHE_TTL = 300;

// Cache database queries
// Cache user sessions
// Cache product inventory counts
```

### Browser Caching
- Static assets: 1 year
- API responses: 5-10 minutes
- HTML pages: No-cache (always fresh)

---

## 4. Frontend Optimization

### Code Splitting
✅ Already using Vite - routes are code-split

### Image Optimization
- Use WebP format
- Lazy load images
- Optimize image sizes

### Bundle Size
- Current: Check with `npm run build --report`
- Recommendation: <500KB for initial load

---

## 5. Load Balancing Strategy

### For 200+ Users, Deploy with:

#### Option A: Single Server (Up to 500 users)
- Vertical scaling: 4+ CPU cores, 8GB+ RAM
- Increase Node.js worker threads
- Optimize database queries

#### Option B: Multiple Servers (500+ users)
```
Load Balancer (Nginx/HAProxy)
    ↓
    ├── Server 1 (Node.js)
    ├── Server 2 (Node.js)
    └── Server 3 (Node.js)
    ↓
PostgreSQL (Master-Slave Replication)
```

---

## 6. Performance Tuning

### Node.js Cluster Mode
```typescript
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

if (cluster.isMaster) {
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }
}
```

### Memory Management
- Set Node.js heap size: `--max-old-space-size=4096`
- Monitor memory leaks
- Clean up unused connections

### Database Batching
- Batch insert operations
- Use prepared statements
- Connection pooling reuse

---

## 7. Monitoring & Metrics

### Key Metrics to Monitor
- Response time (target: <200ms)
- Database query time (target: <50ms)
- Memory usage (target: <1GB)
- CPU usage (target: <70%)
- Connection count (target: <30)
- Error rate (target: <0.1%)

### Tools
- PM2 for process management
- New Relic or DataDog for monitoring
- PostgreSQL slow query log

---

## 8. Implementation Checklist

### Immediate (Week 1)
- [ ] Add database indexes
- [ ] Enable compression middleware
- [ ] Set up PM2 with cluster mode
- [ ] Implement basic caching

### Short-term (Week 2-3)
- [ ] Set up Redis cache
- [ ] Implement query optimization
- [ ] Add monitoring/alerting
- [ ] Performance testing with 200 concurrent users

### Medium-term (Month 1-2)
- [ ] Load balancer setup (Nginx)
- [ ] Database replication
- [ ] CDN for static assets
- [ ] Advanced caching strategies

---

## 9. Quick Start - Enable Scalability

### Step 1: Increase Connection Pool
Edit `src/lib/db.ts`:
```typescript
const pool = new Pool({
  max: 50,
  idleTimeoutMillis: 30000,
});
```

### Step 2: Install PM2
```bash
npm install -g pm2
pm2 ecosystem.config.js start
```

### Step 3: Add Compression
Edit `server.ts`:
```typescript
import compression from 'compression';
app.use(compression());
```

### Step 4: Enable Clustering
```bash
npm install cluster
# Use PM2 cluster mode or add clustering code
```

---

## 10. Load Testing Commands

### Using Apache Bench
```bash
ab -n 200 -c 200 http://localhost:8080/
```

### Using Artillery
```bash
npm install -g artillery
artillery quick --count 200 --num 10 http://localhost:8080/
```

### Expected Results for 200 Users
- Response time: 100-300ms
- Error rate: <0.5%
- Database queries: <50ms
- Throughput: 100+ requests/second

---

## Estimated Capacity

| Configuration | Users | Setup Time |
|---|---|---|
| Single Server (4 cores, 8GB) | 200-500 | 1-2 days |
| Load Balanced (3 servers) | 500-1000 | 3-5 days |
| Distributed with Redis | 1000+ | 1-2 weeks |

Your current setup can handle **200 concurrent users** with minor optimizations.
Target: **500+ concurrent users** with the recommended changes.
