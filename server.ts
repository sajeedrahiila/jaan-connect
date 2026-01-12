import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import multer from 'multer';
import compression from 'compression';
import path from 'path';
import fs from 'fs';
import * as auth from './src/lib/auth-local.js';
import { query } from './src/lib/db.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Performance Middleware - Enable compression for 200+ concurrent users
app.use(compression());

// Request timeout protection
app.use((req, res, next) => {
  req.setTimeout(60000); // 60 second timeout
  res.setTimeout(60000);
  next();
});

// Middleware
app.use(cors({
  origin: 'http://localhost:8080',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cookieParser());

// Static serving for local uploads
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });
app.use('/uploads', express.static(UPLOAD_DIR));

// Multer storage for local files
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
  filename: (_req, file, cb) => {
    const safeName = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    const ts = Date.now();
    cb(null, `${ts}-${safeName}`);
  },
});
const upload = multer({ storage });

// Auth middleware to verify session
const requireAuth = async (req: any, res: any, next: any) => {
  const token = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  const user = await auth.verifySession(token);
  
  if (!user) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
  
  req.user = user;
  next();
};

// Admin middleware
const requireAdmin = async (req: any, res: any, next: any) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

// ============================================
// AUTH ROUTES
// ============================================

// Sign up
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, fullName } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const user = await auth.createUser(email, password, fullName || '');
    const { session } = await auth.signIn(email, password) || {};
    
    if (!session) {
      return res.status(500).json({ error: 'Failed to create session' });
    }
    
    res.cookie('session_token', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.json({ user, session });
  } catch (error: any) {
    console.error('Signup error:', error);
    
    if (error.code === '23505') { // Unique constraint violation
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// Sign in
app.post('/api/auth/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    
    const result = await auth.signIn(email, password);
    
    if (!result) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }
    
    res.cookie('session_token', result.session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });
    
    res.json({ user: result.user, session: result.session });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Failed to sign in' });
  }
});

// Sign out
app.post('/api/auth/signout', async (req, res) => {
  try {
    const token = req.cookies.session_token || req.headers.authorization?.replace('Bearer ', '');
    
    if (token) {
      await auth.signOut(token);
    }
    
    res.clearCookie('session_token');
    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Failed to sign out' });
  }
});

// Get current user
app.get('/api/auth/user', requireAuth, async (req: any, res) => {
  res.json({ user: req.user });
});

// ============================================
// HEALTH CHECK
// ============================================
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Start server

// ============================================
// UPLOADS (LOCAL STORAGE)
// ============================================
app.post('/api/admin/uploads', requireAuth, requireAdmin, upload.array('files', 10), (req: any, res: any) => {
  const files = req.files as any[] | undefined;
  if (!files || !files.length) {
    return res.status(400).json({ success: false, error: 'No files uploaded' });
  }
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  const urls = files.map((f: any) => `${baseUrl}/uploads/${f.filename}`);
  res.json({ success: true, data: { urls } });
});

// ============================================
// PRODUCTS ENDPOINTS
// ============================================

// Get categories
app.get('/api/categories', async (req, res) => {
  try {
    const result = await query('SELECT id, name, slug, description, image FROM categories ORDER BY name');
    const categories = result.rows.map((c: any) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      description: c.description || '',
      image: c.image || '/placeholder.svg',
      product_count: 0,
    }));
    res.json({ success: true, data: categories });
  } catch (e) {
    console.error('Categories error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// Get products with filters
app.get('/api/products', async (req, res) => {
  try {
    const { category_id, search, in_stock_only, min_price, max_price, sort_by, page = '1', per_page = '12' } = req.query as any;
    const filters: string[] = [];
    const params: any[] = [];

    if (category_id) {
      params.push(Number(category_id));
      filters.push(`category_id = $${params.length}`);
    }
    if (search) {
      params.push(`%${String(search).toLowerCase()}%`);
      filters.push(`LOWER(name) LIKE $${params.length} OR LOWER(description) LIKE $${params.length}`);
    }
    if (in_stock_only === 'true') {
      filters.push(`stock_status <> 'out_of_stock'`);
    }
    if (min_price) {
      params.push(Number(min_price));
      filters.push(`price >= $${params.length}`);
    }
    if (max_price) {
      params.push(Number(max_price));
      filters.push(`price <= $${params.length}`);
    }

    let orderBy = 'created_at DESC';
    switch (sort_by) {
      case 'name': orderBy = 'name ASC'; break;
      case 'price_asc': orderBy = 'price ASC'; break;
      case 'price_desc': orderBy = 'price DESC'; break;
      case 'newest': orderBy = 'created_at DESC'; break;
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const pageNum = Number(page) || 1;
    const perPageNum = Number(per_page) || 12;
    const offset = (pageNum - 1) * perPageNum;

    const totalRes = await query(`SELECT COUNT(*)::int AS count FROM products ${where}`, params);
    const productsRes = await query(
      `SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id ${where} ORDER BY ${orderBy} LIMIT $${params.length+1} OFFSET $${params.length+2}`,
      [...params, perPageNum, offset]
    );

    const products = productsRes.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description || '',
      price: Number(p.price),
      compare_price: p.compare_price ? Number(p.compare_price) : undefined,
      sku: p.sku,
      barcode: p.barcode || undefined,
      category_id: p.category_id,
      category_name: p.category_name || '',
      images: Array.isArray(p.images) ? p.images : [],
      stock_quantity: p.stock_quantity,
      stock_status: p.stock_status,
      unit: p.unit,
      weight: p.weight ? Number(p.weight) : undefined,
      is_featured: p.is_featured,
      is_new: p.is_new,
      created_at: new Date(p.created_at).toISOString().slice(0,10),
      updated_at: new Date(p.updated_at).toISOString().slice(0,10),
    }));

    res.json({ success: true, data: { data: products, total: totalRes.rows[0].count, page: pageNum, per_page: perPageNum, total_pages: Math.ceil(totalRes.rows[0].count / perPageNum) } });
  } catch (e) {
    console.error('Products error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// Get product by slug
app.get('/api/products/slug/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const result = await query('SELECT p.*, c.name AS category_name FROM products p LEFT JOIN categories c ON c.id = p.category_id WHERE p.slug = $1', [slug]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Product not found' });
    const p = result.rows[0];
    res.json({ success: true, data: {
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      short_description: p.short_description || '',
      price: Number(p.price),
      compare_price: p.compare_price ? Number(p.compare_price) : undefined,
      sku: p.sku,
      barcode: p.barcode || undefined,
      category_id: p.category_id,
      category_name: p.category_name || '',
      images: Array.isArray(p.images) ? p.images : [],
      stock_quantity: p.stock_quantity,
      stock_status: p.stock_status,
      unit: p.unit,
      weight: p.weight ? Number(p.weight) : undefined,
      is_featured: p.is_featured,
      is_new: p.is_new,
      created_at: new Date(p.created_at).toISOString().slice(0,10),
      updated_at: new Date(p.updated_at).toISOString().slice(0,10),
    } });
  } catch (e) {
    console.error('Product slug error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

// Public: submit contact form (B2B partnership inquiry)
app.post('/api/contact', async (req, res) => {
  try {
    const { fullName, companyName, businessEmail, phoneNumber, message } = req.body;

    // Validate required fields
    if (!fullName || !companyName || !businessEmail || !phoneNumber || !message) {
      return res.status(400).json({ success: false, error: 'All fields are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(businessEmail)) {
      return res.status(400).json({ success: false, error: 'Invalid email format' });
    }

    const result = await query(
      `INSERT INTO contact_submissions (full_name, company_name, business_email, phone_number, message, status)
       VALUES ($1, $2, $3, $4, $5, 'new')
       RETURNING id, full_name, company_name, business_email, phone_number, message, status, created_at`,
      [fullName, companyName, businessEmail, phoneNumber, message]
    );

    res.status(201).json({
      success: true,
      message: 'Contact submission received. Our team will get back to you shortly.',
      data: result.rows[0]
    });
  } catch (e) {
    console.error('Contact submission error', e);
    res.status(500).json({ success: false, error: 'Failed to submit contact form' });
  }
});

// Admin: create product
app.post('/api/admin/products', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { 
      name, sku, price, comparePrice, category, stock, description, unit, weight, isFeatured, isNew, images,
      // New grocery fields
      onHandQuantity, lowStockThreshold, allowNegativeStock, upcCode, 
      isTaxable, taxCategory, expiryDate, batchNumber, lotNumber, expiryAlertDays,
      costPrice, supplierName, supplierId, caseSize, leadTimeDays, hasVariants
    } = req.body;
    
    const catRes = await query('SELECT id FROM categories WHERE name = $1 LIMIT 1', [category]);
    const categoryId = catRes.rows[0]?.id || null;
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const result = await query(
      `INSERT INTO products (
        name, slug, description, short_description, price, compare_price, sku, category_id, images, 
        stock_quantity, unit, weight, is_featured, is_new,
        on_hand_quantity, low_stock_threshold, allow_negative_stock, upc_code,
        is_taxable, tax_category, expiry_date, batch_number, lot_number, expiry_alert_days,
        cost_price, supplier_name, supplier_id, case_size, lead_time_days, has_variants
      )
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30)
       RETURNING *`,
      [
        name, slug, description, '', Number(price), comparePrice ? Number(comparePrice) : null, 
        sku, categoryId, Array.isArray(images) ? images : [], Number(stock || 0), unit, weight ? Number(weight) : null, 
        !!isFeatured, !!isNew,
        // New fields
        Number(onHandQuantity || stock || 0), Number(lowStockThreshold || 10), !!allowNegativeStock, upcCode || null,
        !!isTaxable, taxCategory || 'grocery', expiryDate || null, batchNumber || null, lotNumber || null, 
        Number(expiryAlertDays || 7), costPrice ? Number(costPrice) : null, supplierName || null, 
        supplierId ? Number(supplierId) : null, caseSize ? Number(caseSize) : null, 
        leadTimeDays ? Number(leadTimeDays) : null, !!hasVariants
      ]
    );
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Create product error', e);
    res.status(500).json({ success: false, error: 'Failed to create product' });
  }
});

// Admin: update product
app.put('/api/admin/products/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { 
      name, sku, price, comparePrice, category, stock, description, unit, weight, isFeatured, isNew, images,
      // New grocery fields
      onHandQuantity, lowStockThreshold, allowNegativeStock, upcCode, adjustmentReason,
      isTaxable, taxCategory, expiryDate, batchNumber, lotNumber, expiryAlertDays,
      costPrice, supplierName, supplierId, caseSize, leadTimeDays, hasVariants
    } = req.body;
    
    const catRes = await query('SELECT id FROM categories WHERE name = $1 LIMIT 1', [category]);
    const categoryId = catRes.rows[0]?.id || null;
    const slug = String(name).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

    const result = await query(
      `UPDATE products
       SET name=$1, slug=$2, description=$3, short_description=$4, price=$5, compare_price=$6, sku=$7,
           category_id=$8, images=$9, stock_quantity=$10, unit=$11, weight=$12, is_featured=$13, is_new=$14,
           on_hand_quantity=$15, low_stock_threshold=$16, allow_negative_stock=$17, upc_code=$18,
           is_taxable=$19, tax_category=$20, expiry_date=$21, batch_number=$22, lot_number=$23, expiry_alert_days=$24,
           cost_price=$25, supplier_name=$26, supplier_id=$27, case_size=$28, lead_time_days=$29, has_variants=$30,
           last_adjustment_reason=$31, updated_at=now()
       WHERE id=$32
       RETURNING *`,
      [
        name, slug, description, '', Number(price), comparePrice ? Number(comparePrice) : null, sku, 
        categoryId, Array.isArray(images) ? images : [], Number(stock || 0), unit, weight ? Number(weight) : null, 
        !!isFeatured, !!isNew,
        // New fields
        Number(onHandQuantity !== undefined ? onHandQuantity : stock || 0), Number(lowStockThreshold || 10), 
        !!allowNegativeStock, upcCode || null, !!isTaxable, taxCategory || 'grocery', expiryDate || null, 
        batchNumber || null, lotNumber || null, Number(expiryAlertDays || 7), costPrice ? Number(costPrice) : null, 
        supplierName || null, supplierId ? Number(supplierId) : null, caseSize ? Number(caseSize) : null, 
        leadTimeDays ? Number(leadTimeDays) : null, !!hasVariants, adjustmentReason || null, Number(id)
      ]
    );

    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Update product error', e);
    res.status(500).json({ success: false, error: 'Failed to update product' });
  }
});

// Admin: delete product
app.delete('/api/admin/products/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM products WHERE id = $1 RETURNING id', [Number(id)]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Product not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete product error', e);
    res.status(500).json({ success: false, error: 'Failed to delete product' });
  }
});

// ============================================
// PRODUCT VARIANTS ENDPOINTS
// ============================================

// Get variants for a product
app.get('/api/admin/products/:id/variants', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await query(
      'SELECT * FROM product_variants WHERE product_id = $1 ORDER BY sort_order, variant_name',
      [Number(id)]
    );
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Get variants error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch variants' });
  }
});

// Create product variant
app.post('/api/admin/products/:id/variants', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { 
      variantName, variantType, sku, upcCode, price, comparePrice, costPrice,
      onHandQuantity, lowStockThreshold, weight, weightUnit, attributes, sortOrder
    } = req.body;

    const result = await query(
      `INSERT INTO product_variants (
        product_id, variant_name, variant_type, sku, upc_code, price, compare_price, cost_price,
        on_hand_quantity, low_stock_threshold, weight, weight_unit, attributes, sort_order
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING *`,
      [
        Number(id), variantName, variantType, sku || null, upcCode || null, 
        Number(price), comparePrice ? Number(comparePrice) : null, costPrice ? Number(costPrice) : null,
        Number(onHandQuantity || 0), Number(lowStockThreshold || 10), 
        weight ? Number(weight) : null, weightUnit || 'kg', attributes || null, Number(sortOrder || 0)
      ]
    );

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Create variant error', e);
    res.status(500).json({ success: false, error: 'Failed to create variant' });
  }
});

// Update product variant
app.put('/api/admin/variants/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { 
      variantName, variantType, sku, upcCode, price, comparePrice, costPrice,
      onHandQuantity, lowStockThreshold, weight, weightUnit, attributes, sortOrder, isActive
    } = req.body;

    const result = await query(
      `UPDATE product_variants
       SET variant_name=$1, variant_type=$2, sku=$3, upc_code=$4, price=$5, compare_price=$6, cost_price=$7,
           on_hand_quantity=$8, low_stock_threshold=$9, weight=$10, weight_unit=$11, attributes=$12, 
           sort_order=$13, is_active=$14, updated_at=now()
       WHERE id=$15
       RETURNING *`,
      [
        variantName, variantType, sku || null, upcCode || null, Number(price), 
        comparePrice ? Number(comparePrice) : null, costPrice ? Number(costPrice) : null,
        Number(onHandQuantity || 0), Number(lowStockThreshold || 10), weight ? Number(weight) : null, 
        weightUnit || 'kg', attributes || null, Number(sortOrder || 0), !!isActive, Number(id)
      ]
    );

    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Variant not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Update variant error', e);
    res.status(500).json({ success: false, error: 'Failed to update variant' });
  }
});

// Delete product variant
app.delete('/api/admin/variants/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM product_variants WHERE id = $1 RETURNING id', [Number(id)]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Variant not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete variant error', e);
    res.status(500).json({ success: false, error: 'Failed to delete variant' });
  }
});

// ============================================
// INVENTORY ADJUSTMENTS ENDPOINTS
// ============================================

// Record inventory adjustment
app.post('/api/admin/inventory/adjust', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { productId, variantId, adjustmentType, quantityChange, reason, notes } = req.body;
    
    // Get current quantity
    let currentQty = 0;
    let tableName = 'products';
    let idColumn = 'id';
    let targetId = productId;
    
    if (variantId) {
      const varRes = await query('SELECT on_hand_quantity FROM product_variants WHERE id = $1', [Number(variantId)]);
      if (varRes.rows.length) currentQty = varRes.rows[0].on_hand_quantity;
      tableName = 'product_variants';
      targetId = variantId;
    } else if (productId) {
      const prodRes = await query('SELECT on_hand_quantity FROM products WHERE id = $1', [Number(productId)]);
      if (prodRes.rows.length) currentQty = prodRes.rows[0].on_hand_quantity;
    }
    
    const newQty = currentQty + Number(quantityChange);
    
    // Update inventory
    await query(
      `UPDATE ${tableName} SET on_hand_quantity = $1, last_adjustment_reason = $2, updated_at = now() WHERE id = $3`,
      [newQty, adjustmentType, Number(targetId)]
    );
    
    // Record adjustment
    const result = await query(
      `INSERT INTO inventory_adjustments (
        product_id, variant_id, adjustment_type, quantity_change, quantity_before, quantity_after,
        reason, notes, adjusted_by_user_id, adjusted_by_name
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        productId ? Number(productId) : null, variantId ? Number(variantId) : null,
        adjustmentType, Number(quantityChange), currentQty, newQty, reason || null, notes || null,
        req.user.id, req.user.full_name || req.user.email
      ]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Inventory adjustment error', e);
    res.status(500).json({ success: false, error: 'Failed to adjust inventory' });
  }
});

// Get inventory adjustment history
app.get('/api/admin/inventory/adjustments', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { productId, variantId, type, limit = 100 } = req.query;
    
    let whereClause = '';
    const params: any[] = [];
    
    if (productId) {
      params.push(Number(productId));
      whereClause = `WHERE product_id = $${params.length}`;
    } else if (variantId) {
      params.push(Number(variantId));
      whereClause = `WHERE variant_id = $${params.length}`;
    }
    
    if (type) {
      params.push(type);
      whereClause += whereClause ? ` AND adjustment_type = $${params.length}` : `WHERE adjustment_type = $${params.length}`;
    }
    
    params.push(Number(limit));
    
    const result = await query(
      `SELECT * FROM inventory_adjustments ${whereClause} ORDER BY created_at DESC LIMIT $${params.length}`,
      params
    );
    
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Get adjustments error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch adjustments' });
  }
});

// ============================================
// SUPPLIERS ENDPOINTS
// ============================================

// Get all suppliers with metrics
app.get('/api/admin/suppliers', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { active } = req.query;
    let whereClause = '';
    
    if (active !== undefined) {
      whereClause = active === 'true' ? 'WHERE s.is_active = true' : 'WHERE s.is_active = false';
    }
    
    const result = await query(`
      SELECT 
        s.*,
        COALESCE(sm.linked_products_count, 0) as linked_products_count,
        COALESCE(sm.avg_supplier_cost, 0) as avg_supplier_cost,
        COALESCE(sm.avg_margin_percent, 0) as avg_margin_percent
      FROM suppliers s
      LEFT JOIN supplier_metrics sm ON s.id = sm.id
      ${whereClause}
      ORDER BY s.name
    `);
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Get suppliers error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
  }
});

// Create supplier
app.post('/api/admin/suppliers', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { 
      name, contactPerson, email, phone, address, paymentTerms, 
      defaultLeadTimeDays, rating, notes,
      supplierType, isPrimary, isBackup,
      minOrderAmount, orderDays, cutoffTime, deliveryDays,
      taxId, requires1099,
      acceptsReturns, creditDays, restockingFeePercent,
      orderMethod, preferredContactTime
    } = req.body;
    
    const result = await query(
      `INSERT INTO suppliers (
        name, contact_person, email, phone, address, payment_terms, 
        default_lead_time_days, rating, notes,
        supplier_type, is_primary, is_backup,
        min_order_amount, order_days, cutoff_time, delivery_days,
        tax_id, requires_1099,
        accepts_returns, credit_days, restocking_fee_percent,
        order_method, preferred_contact_time
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23)
      RETURNING *`,
      [
        name, contactPerson || null, email || null, phone || null, address || null,
        paymentTerms || null, Number(defaultLeadTimeDays || 7), rating ? Number(rating) : null, notes || null,
        supplierType || null, !!isPrimary, !!isBackup,
        minOrderAmount ? Number(minOrderAmount) : null,
        orderDays || null, cutoffTime || null, deliveryDays || null,
        taxId || null, !!requires1099,
        acceptsReturns !== false, creditDays ? Number(creditDays) : 30, 
        restockingFeePercent ? Number(restockingFeePercent) : 0,
        orderMethod || null, preferredContactTime || null
      ]
    );
    
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Create supplier error', e);
    res.status(500).json({ success: false, error: 'Failed to create supplier' });
  }
});

// Update supplier
app.put('/api/admin/suppliers/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { 
      name, contactPerson, email, phone, address, paymentTerms, 
      defaultLeadTimeDays, isActive, rating, notes,
      supplierType, isPrimary, isBackup,
      minOrderAmount, orderDays, cutoffTime, deliveryDays,
      taxId, requires1099,
      acceptsReturns, creditDays, restockingFeePercent,
      orderMethod, preferredContactTime,
      onTimeDeliveryPercent, avgDeliveryDelayDays, orderFulfillmentPercent
    } = req.body;
    
    const result = await query(
      `UPDATE suppliers
       SET name=$1, contact_person=$2, email=$3, phone=$4, address=$5, payment_terms=$6,
           default_lead_time_days=$7, is_active=$8, rating=$9, notes=$10,
           supplier_type=$11, is_primary=$12, is_backup=$13,
           min_order_amount=$14, order_days=$15, cutoff_time=$16, delivery_days=$17,
           tax_id=$18, requires_1099=$19,
           accepts_returns=$20, credit_days=$21, restocking_fee_percent=$22,
           order_method=$23, preferred_contact_time=$24,
           on_time_delivery_percent=$25, avg_delivery_delay_days=$26, order_fulfillment_percent=$27,
           updated_at=now()
       WHERE id=$28
       RETURNING *`,
      [
        name, contactPerson || null, email || null, phone || null, address || null, paymentTerms || null,
        Number(defaultLeadTimeDays || 7), !!isActive, rating ? Number(rating) : null, notes || null,
        supplierType || null, !!isPrimary, !!isBackup,
        minOrderAmount ? Number(minOrderAmount) : null, orderDays || null, cutoffTime || null, deliveryDays || null,
        taxId || null, !!requires1099,
        acceptsReturns !== false, creditDays ? Number(creditDays) : 30, restockingFeePercent ? Number(restockingFeePercent) : 0,
        orderMethod || null, preferredContactTime || null,
        onTimeDeliveryPercent ? Number(onTimeDeliveryPercent) : null, 
        avgDeliveryDelayDays ? Number(avgDeliveryDelayDays) : 0,
        orderFulfillmentPercent ? Number(orderFulfillmentPercent) : 100,
        Number(id)
      ]
    );
    
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Update supplier error', e);
    res.status(500).json({ success: false, error: 'Failed to update supplier' });
  }
});

// Delete supplier
app.delete('/api/admin/suppliers/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await query('DELETE FROM suppliers WHERE id = $1 RETURNING id', [Number(id)]);
    if (!result.rows.length) return res.status(404).json({ success: false, error: 'Supplier not found' });
    res.json({ success: true });
  } catch (e) {
    console.error('Delete supplier error', e);
    res.status(500).json({ success: false, error: 'Failed to delete supplier' });
  }
});

// ============================================
// ORDERS ENDPOINTS
// ============================================

// Create order (public - from checkout)
app.post('/api/orders', async (req, res) => {
  try {
    const {
      customer_name, customer_email, customer_phone,
      shipping_address, billing_address,
      items, subtotal, tax, shipping_fee, total, payment_method, notes, user_id
    } = req.body;

    // Generate order number
    const orderNumRes = await query('SELECT generate_order_number() AS number');
    const orderNumber = orderNumRes.rows[0].number;

    // Insert order
    const orderRes = await query(
      `INSERT INTO orders (
        order_number, user_id, customer_name, customer_email, customer_phone,
        shipping_street, shipping_street2, shipping_city, shipping_state, shipping_zip, shipping_country,
        billing_street, billing_street2, billing_city, billing_state, billing_zip, billing_country,
        subtotal, tax, shipping_fee, total, payment_method, notes, status
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24)
      RETURNING *`,
      [
        orderNumber, user_id || null, customer_name, customer_email, customer_phone || null,
        shipping_address.street, shipping_address.street2 || null, shipping_address.city,
        shipping_address.state, shipping_address.zip, shipping_address.country,
        billing_address?.street || shipping_address.street, billing_address?.street2 || null,
        billing_address?.city || shipping_address.city, billing_address?.state || shipping_address.state,
        billing_address?.zip || shipping_address.zip, billing_address?.country || shipping_address.country,
        Number(subtotal), Number(tax), Number(shipping_fee), Number(total), payment_method, notes || null, 'pending'
      ]
    );

    const order = orderRes.rows[0];

    // Insert order items
    for (const item of items) {
      await query(
        `INSERT INTO order_items (order_id, product_id, product_name, product_sku, quantity, unit_price, total_price)
         VALUES ($1,$2,$3,$4,$5,$6,$7)`,
        [order.id, item.product_id, item.product_name, item.product_sku, item.quantity, Number(item.unit_price), Number(item.total_price)]
      );

      // Update product stock
      await query('UPDATE products SET stock_quantity = stock_quantity - $1 WHERE id = $2', [item.quantity, item.product_id]);
    }

    res.json({ success: true, data: { order_number: orderNumber, order_id: order.id } });
  } catch (e) {
    console.error('Create order error', e);
    res.status(500).json({ success: false, error: 'Failed to create order' });
  }
});

// Get orders (admin or user's own)
app.get('/api/orders', requireAuth, async (req: any, res) => {
  try {
    const isAdmin = req.user.role === 'admin';
    const { status, page = '1', per_page = '20' } = req.query as any;

    const filters: string[] = [];
    const params: any[] = [];

    if (!isAdmin) {
      params.push(req.user.id);
      filters.push(`user_id = $${params.length}`);
    }

    if (status && status !== 'all') {
      params.push(status);
      filters.push(`status = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const pageNum = Number(page) || 1;
    const perPageNum = Number(per_page) || 20;
    const offset = (pageNum - 1) * perPageNum;

    const totalRes = await query(`SELECT COUNT(*)::int AS count FROM orders ${where}`, params);
    const ordersRes = await query(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPageNum, offset]
    );

    res.json({
      success: true,
      data: {
        data: ordersRes.rows,
        total: totalRes.rows[0].count,
        page: pageNum,
        per_page: perPageNum,
        total_pages: Math.ceil(totalRes.rows[0].count / perPageNum)
      }
    });
  } catch (e) {
    console.error('Get orders error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch orders' });
  }
});

// Get order details with items
app.get('/api/orders/:id', requireAuth, async (req: any, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const whereClause = isAdmin ? 'WHERE o.id = $1' : 'WHERE o.id = $1 AND o.user_id = $2';
    const params = isAdmin ? [Number(id)] : [Number(id), req.user.id];

    const orderRes = await query(`SELECT * FROM orders ${whereClause}`, params);
    if (!orderRes.rows.length) return res.status(404).json({ success: false, error: 'Order not found' });

    const order = orderRes.rows[0];

    const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
    order.items = itemsRes.rows;

    res.json({ success: true, data: order });
  } catch (e) {
    console.error('Get order error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch order' });
  }
});

// Get user's invoices
app.get('/api/user/invoices', requireAuth, async (req: any, res) => {
  try {
    const { status, page = '1', per_page = '20' } = req.query as any;
    const userId = req.user.id;

    const filters: string[] = ['user_id = $1'];
    const params: any[] = [userId];

    if (status && status !== 'all') {
      params.push(status);
      filters.push(`status = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const pageNum = Number(page) || 1;
    const perPageNum = Number(per_page) || 20;
    const offset = (pageNum - 1) * perPageNum;

    const totalRes = await query(`SELECT COUNT(*)::int AS count FROM invoices WHERE user_id = $1`, [userId]);
    const invoicesRes = await query(
      `SELECT * FROM invoices ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPageNum, offset]
    );

    res.json({
      success: true,
      data: {
        data: invoicesRes.rows,
        total: totalRes.rows[0].count,
        page: pageNum,
        per_page: perPageNum,
        total_pages: Math.ceil(totalRes.rows[0].count / perPageNum),
      },
    });
  } catch (e) {
    console.error('Get user invoices error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// Admin: update order status
app.put('/api/admin/orders/:id/status', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, tracking_number } = req.body;

    // Get current order data
    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [Number(id)]);
    if (!orderRes.rows.length) return res.status(404).json({ success: false, error: 'Order not found' });
    
    const order = orderRes.rows[0];
    const oldStatus = order.status;

    // Update order status
    const result = await query(
      'UPDATE orders SET status = $1, tracking_number = $2, updated_at = now() WHERE id = $3 RETURNING *',
      [status, tracking_number || null, Number(id)]
    );

    // If order is cancelled, restore inventory
    if (status === 'cancelled' && oldStatus !== 'cancelled') {
      const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [Number(id)]);
      
      for (const item of itemsRes.rows) {
        if (item.product_id) {
          await query(
            'UPDATE products SET stock_quantity = stock_quantity + $1 WHERE id = $2',
            [item.quantity, item.product_id]
          );
        }
      }
    }

    // Create invoice automatically when order is shipped or delivered
    if (['shipped', 'delivered'].includes(status) && oldStatus !== status) {
      // Check if invoice already exists for this order
      const existingInvoice = await query(
        'SELECT id FROM invoices WHERE order_id = $1',
        [Number(id)]
      );

      if (existingInvoice.rows.length === 0) {
        // Get tax rate and shipping fee from settings
        const taxRateRes = await query("SELECT value FROM settings WHERE key = 'tax_rate'");
        const shippingFeeRes = await query("SELECT value FROM settings WHERE key = 'default_shipping_fee'");
        const freeShippingRes = await query("SELECT value FROM settings WHERE key = 'free_shipping_threshold'");
        
        const taxRate = taxRateRes.rows.length > 0 ? parseFloat(taxRateRes.rows[0].value) : 0.08;
        const defaultShipping = shippingFeeRes.rows.length > 0 ? parseFloat(shippingFeeRes.rows[0].value) : 10.00;
        const freeShippingThreshold = freeShippingRes.rows.length > 0 ? parseFloat(freeShippingRes.rows[0].value) : 100.00;
        
        // Recalculate subtotal, tax, and shipping
        const subtotal = Number(order.subtotal) || 0;
        const calculatedTax = Math.round(subtotal * taxRate * 100) / 100;
        const calculatedShipping = subtotal >= freeShippingThreshold ? 0 : defaultShipping;
        const calculatedTotal = subtotal + calculatedTax + calculatedShipping;
        
        // Generate invoice number
        const invoiceNumberRes = await query('SELECT generate_invoice_number()');
        const invoice_number = invoiceNumberRes.rows[0].generate_invoice_number;

        const issue_date = new Date();
        const due_date = new Date(issue_date);
        due_date.setDate(due_date.getDate() + 30);

        // Create invoice
        const invoiceRes = await query(
          `INSERT INTO invoices (
            invoice_number, order_id, user_id, customer_name, customer_email, customer_phone,
            billing_street, billing_street2, billing_city, billing_state, billing_zip, billing_country,
            subtotal, tax, shipping_fee, total, balance_due, status, issue_date, due_date
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
          RETURNING id`,
          [
            invoice_number, order.id, order.user_id, order.customer_name, order.customer_email, order.customer_phone,
            order.billing_street || order.shipping_street,
            order.billing_street2 || order.shipping_street2,
            order.billing_city || order.shipping_city,
            order.billing_state || order.shipping_state,
            order.billing_zip || order.shipping_zip,
            order.billing_country || order.shipping_country,
            subtotal, calculatedTax, calculatedShipping, calculatedTotal, calculatedTotal, 
            status === 'delivered' ? 'sent' : 'draft',
            issue_date.toISOString().split('T')[0],
            due_date.toISOString().split('T')[0]
          ]
        );

        const invoice_id = invoiceRes.rows[0].id;

        // Copy order items to invoice items
        const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
        for (const item of itemsRes.rows) {
          await query(
            `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [invoice_id, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price]
          );
        }
      }
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Update order status error', e);
    res.status(500).json({ success: false, error: 'Failed to update order' });
  }
});

// Admin: dashboard stats
app.get('/api/admin/stats', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const usersRes = await query('SELECT COUNT(*)::int AS count FROM users');
    const productsRes = await query('SELECT COUNT(*)::int AS count FROM products');
    const ordersRes = await query('SELECT COUNT(*)::int AS count FROM orders');
    const pendingRes = await query("SELECT COUNT(*)::int AS count FROM orders WHERE status = 'pending'");
    const revenueRes = await query('SELECT COALESCE(SUM(total), 0)::numeric AS total FROM orders');
    
    // Invoice-based stats
    const invoicesRes = await query('SELECT COUNT(*)::int AS count FROM invoices');
    const invoiceRevenueRes = await query('SELECT COALESCE(SUM(total), 0)::numeric AS total FROM invoices');
    const receivablesRes = await query("SELECT COALESCE(SUM(balance_due), 0)::numeric AS total FROM invoices WHERE status != 'paid' AND status != 'cancelled'");
    const paidInvoicesRes = await query("SELECT COALESCE(SUM(amount_paid), 0)::numeric AS total FROM invoices");
    const overdueRes = await query("SELECT COUNT(*)::int AS count FROM invoices WHERE status = 'overdue' OR (status != 'paid' AND status != 'cancelled' AND due_date < CURRENT_DATE)");

    res.json({
      success: true,
      data: {
        totalUsers: usersRes.rows[0].count,
        totalProducts: productsRes.rows[0].count,
        totalOrders: ordersRes.rows[0].count,
        pendingOrders: pendingRes.rows[0].count,
        revenue: Number(revenueRes.rows[0].total),
        // Invoice stats
        totalInvoices: invoicesRes.rows[0].count,
        invoiceRevenue: Number(invoiceRevenueRes.rows[0].total),
        receivables: Number(receivablesRes.rows[0].total),
        paidAmount: Number(paidInvoicesRes.rows[0].total),
        overdueInvoices: overdueRes.rows[0].count
      }
    });
  } catch (e) {
    console.error('Stats error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch stats' });
  }
});

// Admin: dashboard data (charts, top products, recent orders/activity)
app.get('/api/admin/dashboard-data', requireAuth, requireAdmin, async (_req: any, res: any) => {
  try {
    // Revenue trend for last 7 days
    const trendRes = await query(
      `SELECT
         to_char(created_at::date, 'Dy') AS label,
         created_at::date AS day,
         COALESCE(SUM(total), 0)::numeric AS revenue,
         COUNT(*)::int AS orders
       FROM orders
       WHERE created_at >= CURRENT_DATE - INTERVAL '6 days'
       GROUP BY day
       ORDER BY day`
    );

    // Category breakdown by sales
    const categoryRes = await query(
      `SELECT 
         COALESCE(c.name, 'Uncategorized') AS name,
         COUNT(DISTINCT oi.order_id)::int AS orders,
         COALESCE(SUM(oi.total_price), 0)::numeric AS sales
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       LEFT JOIN categories c ON p.category_id = c.id
       GROUP BY c.name
       ORDER BY sales DESC
       LIMIT 6`
    );

    // Top products by revenue
    const topProductsRes = await query(
      `SELECT 
         p.name,
         COALESCE(SUM(oi.quantity), 0)::int AS sales,
         COALESCE(SUM(oi.total_price), 0)::numeric AS revenue
       FROM order_items oi
       LEFT JOIN products p ON oi.product_id = p.id
       GROUP BY p.id, p.name
       ORDER BY revenue DESC
       LIMIT 5`
    );

    // Recent orders
    const recentOrdersRes = await query(
      `SELECT 
         id,
         order_number,
         customer_name,
         total,
         status,
         created_at
       FROM orders
       ORDER BY created_at DESC
       LIMIT 5`
    );

    // Recent activity (best-effort)
    let activity: any[] = [];
    try {
      const activityRes = await query(
        `SELECT id, action, entity_type, entity_id, details, created_at
         FROM activity_logs
         ORDER BY created_at DESC
         LIMIT 6`
      );
      activity = activityRes.rows;
    } catch (_e) {
      activity = [];
    }

    res.json({
      success: true,
      data: {
        revenueTrend: trendRes.rows,
        categoryBreakdown: categoryRes.rows,
        topProducts: topProductsRes.rows,
        recentOrders: recentOrdersRes.rows,
        recentActivity: activity,
      }
    });
  } catch (e) {
    console.error('Dashboard data error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch dashboard data' });
  }
});

// Admin: get detailed analytics
app.get('/api/admin/analytics', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    // Get total metrics
    const totalOrdersRes = await query('SELECT COUNT(*)::int AS count FROM orders');
    const totalCustomersRes = await query('SELECT COUNT(DISTINCT user_id)::int AS count FROM orders WHERE user_id IS NOT NULL');
    const totalRevenueRes = await query('SELECT COALESCE(SUM(total), 0)::numeric AS total FROM orders');
    
    const totalOrders = totalOrdersRes.rows[0].count;
    const totalCustomers = totalCustomersRes.rows[0].count;
    const totalRevenue = Number(totalRevenueRes.rows[0].total);
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

    // Get previous period for comparison (last 30 days vs previous 30 days)
    const last30DaysRevenueRes = await query(
      `SELECT COALESCE(SUM(total), 0)::numeric AS total FROM orders 
       WHERE created_at >= NOW() - INTERVAL '30 days'`
    );
    const prev30DaysRevenueRes = await query(
      `SELECT COALESCE(SUM(total), 0)::numeric AS total FROM orders 
       WHERE created_at >= NOW() - INTERVAL '60 days' 
       AND created_at < NOW() - INTERVAL '30 days'`
    );
    
    const last30Revenue = Number(last30DaysRevenueRes.rows[0].total);
    const prev30Revenue = Number(prev30DaysRevenueRes.rows[0].total);
    const revenueChange = prev30Revenue > 0 ? ((last30Revenue - prev30Revenue) / prev30Revenue * 100) : 0;

    // Monthly revenue trend (last 12 months)
    const monthlyTrendRes = await query(`
      SELECT 
        TO_CHAR(created_at, 'Mon') as month,
        COALESCE(SUM(total), 0)::numeric as revenue,
        COUNT(*)::int as orders,
        COUNT(DISTINCT user_id)::int as customers
      FROM orders
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY TO_CHAR(created_at, 'Mon'), EXTRACT(MONTH FROM created_at)
      ORDER BY EXTRACT(MONTH FROM created_at)
    `);

    // Category breakdown (from order items)
    const categoryBreakdownRes = await query(`
      SELECT 
        COALESCE(c.name, 'Uncategorized') as name,
        COUNT(DISTINCT oi.order_id)::int as orders,
        COALESCE(SUM(oi.total_price), 0)::numeric as sales
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      LEFT JOIN categories c ON p.category_id = c.id
      GROUP BY c.name
      ORDER BY sales DESC
      LIMIT 10
    `);

    // Order status distribution
    const statusDistributionRes = await query(`
      SELECT 
        status,
        COUNT(*)::int as count
      FROM orders
      GROUP BY status
      ORDER BY count DESC
    `);

    // Top customers
    const topCustomersRes = await query(`
      SELECT 
        COALESCE(u.full_name, u.email) as name,
        COUNT(o.id)::int as orders,
        COALESCE(SUM(o.total), 0)::numeric as revenue
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      WHERE o.user_id IS NOT NULL
      GROUP BY u.id, u.full_name, u.email
      ORDER BY revenue DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        metrics: {
          totalRevenue,
          totalOrders,
          totalCustomers,
          avgOrderValue,
          revenueChange: Number(revenueChange.toFixed(1))
        },
        monthlyTrend: monthlyTrendRes.rows.map(row => ({
          month: row.month,
          revenue: Number(row.revenue),
          orders: row.orders,
          customers: row.customers
        })),
        categoryBreakdown: categoryBreakdownRes.rows.map(row => ({
          name: row.name,
          orders: row.orders,
          sales: Number(row.sales)
        })),
        statusDistribution: statusDistributionRes.rows.map(row => ({
          status: row.status,
          count: row.count
        })),
        topCustomers: topCustomersRes.rows.map(row => ({
          name: row.name,
          orders: row.orders,
          revenue: Number(row.revenue)
        }))
      }
    });
  } catch (e) {
    console.error('Analytics error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch analytics' });
  }
});

// Admin: get activity logs
app.get('/api/admin/activity', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { type, severity, page = 1, per_page = 50, search } = req.query;
    const params: any[] = [];
    const conditions: string[] = [];
    
    let paramCount = 1;

    if (type) {
      conditions.push(`type = $${paramCount}`);
      params.push(type);
      paramCount++;
    }

    if (severity) {
      conditions.push(`severity = $${paramCount}`);
      params.push(severity);
      paramCount++;
    }

    if (search) {
      conditions.push(`(description ILIKE $${paramCount} OR user_name ILIKE $${paramCount} OR user_email ILIKE $${paramCount})`);
      params.push(`%${search}%`);
      paramCount++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countRes = await query(
      `SELECT COUNT(*)::int AS count FROM activity_logs ${whereClause}`,
      params
    );

    // Get paginated activities
    const limit = parseInt(per_page as string, 10);
    const offset = (parseInt(page as string, 10) - 1) * limit;
    params.push(limit, offset);

    const activitiesRes = await query(
      `SELECT * FROM activity_logs 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT $${paramCount} OFFSET $${paramCount + 1}`,
      params
    );

    res.json({
      success: true,
      data: {
        activities: activitiesRes.rows,
        total: countRes.rows[0].count,
        page: parseInt(page as string, 10),
        per_page: limit
      }
    });
  } catch (e) {
    console.error('Activity logs error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch activity logs' });
  }
});

// Admin: get all users with roles
app.get('/api/admin/users', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { search } = req.query;
    const params: any[] = [];
    let where = '';

    if (search) {
      params.push(`%${search}%`);
      where = `WHERE u.email ILIKE $1 OR u.full_name ILIKE $1`;
    }

    const usersRes = await query(
      `SELECT 
        u.id, u.email, u.full_name, u.created_at,
        p.phone,
        COALESCE(ur.role, 'user') AS role
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN user_roles ur ON u.id = ur.user_id
       ${where}
       ORDER BY u.created_at DESC`,
      params
    );

    res.json({ success: true, data: usersRes.rows });
  } catch (e) {
    console.error('Get users error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

// Admin: update user role
app.put('/api/admin/users/:id/role', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!['user', 'moderator', 'admin'].includes(role)) {
      return res.status(400).json({ success: false, error: 'Invalid role' });
    }

    // Check if role exists
    const existingRes = await query('SELECT id FROM user_roles WHERE user_id = $1', [id]);

    if (existingRes.rows.length > 0) {
      // Update existing role
      await query('UPDATE user_roles SET role = $1 WHERE user_id = $2', [role, id]);
    } else {
      // Insert new role
      await query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [id, role]);
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Update user role error', e);
    res.status(500).json({ success: false, error: 'Failed to update user role' });
  }
});

// Admin: get invoices
app.get('/api/admin/invoices', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { status, search, page = '1', per_page = '20' } = req.query;
    const params: any[] = [];
    const filters: string[] = [];

    if (status && status !== 'all') {
      // Special computed buckets
      if (status === 'unpaid') {
        filters.push(`(status <> 'paid' AND balance_due > 0)`);
      } else if (status === 'overdue') {
        filters.push(`(balance_due > 0 AND due_date < CURRENT_DATE)`);
      } else {
        params.push(status);
        filters.push(`status = $${params.length}`);
      }
    }

    if (search) {
      params.push(`%${search}%`);
      filters.push(`(invoice_number ILIKE $${params.length} OR customer_name ILIKE $${params.length} OR customer_email ILIKE $${params.length})`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const pageNum = Number(page) || 1;
    const perPageNum = Number(per_page) || 20;
    const offset = (pageNum - 1) * perPageNum;

    const totalRes = await query(`SELECT COUNT(*)::int AS count FROM invoices ${where}`, params);
    const invoicesRes = await query(
      `SELECT * FROM invoices ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPageNum, offset]
    );

    res.json({
      success: true,
      data: {
        data: invoicesRes.rows,
        total: totalRes.rows[0].count,
        page: pageNum,
        per_page: perPageNum,
        total_pages: Math.ceil(totalRes.rows[0].count / perPageNum)
      }
    });
  } catch (e) {
    console.error('Get invoices error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// Admin: invoice stats (paid revenue, outstanding unpaid, sent count, overdue count)
app.get('/api/admin/invoices/stats', requireAuth, requireAdmin, async (_req: any, res: any) => {
  try {
    const paidRevenueRes = await query(`SELECT COALESCE(SUM(total), 0) AS total_revenue FROM invoices WHERE status = 'paid'`);
    const outstandingRes = await query(`SELECT COALESCE(SUM(balance_due), 0) AS outstanding FROM invoices WHERE status <> 'paid' AND balance_due > 0`);
    const sentCountRes = await query(`SELECT COUNT(*)::int AS sent_count FROM invoices WHERE status = 'sent'`);
    const overdueCountRes = await query(`SELECT COUNT(*)::int AS overdue_count FROM invoices WHERE balance_due > 0 AND due_date < CURRENT_DATE`);

    res.json({
      success: true,
      data: {
        total_revenue: Number(paidRevenueRes.rows[0].total_revenue) || 0,
        outstanding: Number(outstandingRes.rows[0].outstanding) || 0,
        sent_count: sentCountRes.rows[0].sent_count || 0,
        overdue_count: overdueCountRes.rows[0].overdue_count || 0,
      }
    });
  } catch (e) {
    console.error('Invoice stats error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice stats' });
  }
});

// Admin: create invoice manually
app.post('/api/admin/invoices', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const {
      customer_name, customer_email, customer_phone,
      billing_street, billing_street2, billing_city, billing_state, billing_zip, billing_country = 'United States',
      subtotal, tax, shipping_fee, total, status = 'draft', due_days = 30, notes
    } = req.body;

    // Generate invoice number
    const invoiceNumber = await query('SELECT generate_invoice_number()');
    const invoice_number = invoiceNumber.rows[0].generate_invoice_number;

    const issue_date = new Date();
    const due_date = new Date(issue_date);
    due_date.setDate(due_date.getDate() + Number(due_days));

    const invoiceRes = await query(
      `INSERT INTO invoices (
        invoice_number, customer_name, customer_email, customer_phone,
        billing_street, billing_street2, billing_city, billing_state, billing_zip, billing_country,
        subtotal, tax, shipping_fee, total, balance_due, status, issue_date, due_date, notes
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19)
      RETURNING *`,
      [
        invoice_number, customer_name, customer_email, customer_phone,
        billing_street, billing_street2, billing_city, billing_state, billing_zip, billing_country,
        subtotal, tax, shipping_fee, total, total, status,
        issue_date.toISOString().split('T')[0],
        due_date.toISOString().split('T')[0],
        notes
      ]
    );

    res.json({ success: true, data: invoiceRes.rows[0] });
  } catch (e) {
    console.error('Create invoice error', e);
    res.status(500).json({ success: false, error: 'Failed to create invoice' });
  }
});

// Admin: update invoice
app.put('/api/admin/invoices/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const {
      customer_name, customer_email, customer_phone,
      billing_street, billing_street2, billing_city, billing_state, billing_zip, billing_country,
      subtotal, tax, shipping_fee, total, amount_paid, status, notes, items
    } = req.body;

    // Calculate balance due
    const paid = Number(amount_paid) || 0;
    const invoiceTotal = Number(total);
    const balance_due = invoiceTotal - paid;

    // Update invoice
    const result = await query(
      `UPDATE invoices SET
        customer_name = $1, customer_email = $2, customer_phone = $3,
        billing_street = $4, billing_street2 = $5, billing_city = $6, billing_state = $7, 
        billing_zip = $8, billing_country = $9,
        subtotal = $10, tax = $11, shipping_fee = $12, total = $13, 
        amount_paid = $14, balance_due = $15, status = $16, notes = $17,
        updated_at = NOW()
      WHERE id = $18
      RETURNING *`,
      [
        customer_name, customer_email, customer_phone,
        billing_street, billing_street2 || null, billing_city, billing_state, 
        billing_zip, billing_country || 'United States',
        Number(subtotal), Number(tax), Number(shipping_fee), invoiceTotal,
        paid, balance_due, status, notes || null,
        Number(id)
      ]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Invoice not found' });
    }

    // Update invoice items if provided
    if (items && Array.isArray(items)) {
      // Delete existing items
      await query('DELETE FROM invoice_items WHERE invoice_id = $1', [Number(id)]);
      
      // Insert updated items
      for (const item of items) {
        await query(
          `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            Number(id),
            item.product_id || null,
            item.description,
            Number(item.quantity),
            Number(item.unit_price),
            Number(item.total_price)
          ]
        );
      }
    }

    // Log activity
    await query(
      `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details)
       VALUES ($1, $2, $3, $4, $5)`,
      [
        req.user.id,
        'update',
        'invoice',
        Number(id),
        JSON.stringify({ 
          invoice_number: result.rows[0].invoice_number,
          total: invoiceTotal,
          status,
          updated_by: req.user.email 
        })
      ]
    ).catch(() => {}); // Ignore if activity_logs table doesn't exist

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Update invoice error', e);
    res.status(500).json({ success: false, error: 'Failed to update invoice' });
  }
});

// Admin: get invoice details
app.get('/api/admin/invoices/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const invoiceRes = await query('SELECT * FROM invoices WHERE id = $1', [Number(id)]);
    if (!invoiceRes.rows.length) return res.status(404).json({ success: false, error: 'Invoice not found' });

    const invoice = invoiceRes.rows[0];

    const itemsRes = await query('SELECT * FROM invoice_items WHERE invoice_id = $1', [invoice.id]);
    invoice.items = itemsRes.rows;

    res.json({ success: true, data: invoice });
  } catch (e) {
    console.error('Get invoice error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

// Admin: create invoice from order
app.post('/api/admin/invoices/from-order/:orderId', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { orderId } = req.params;
    const { due_days = 30 } = req.body;

    // Get order details
    const orderRes = await query('SELECT * FROM orders WHERE id = $1', [Number(orderId)]);
    if (!orderRes.rows.length) return res.status(404).json({ success: false, error: 'Order not found' });

    const order = orderRes.rows[0];

    // Get order items
    const itemsRes = await query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);

    // Get tax rate and shipping fee from settings
    const taxRateRes = await query("SELECT value FROM settings WHERE key = 'tax_rate'");
    const shippingFeeRes = await query("SELECT value FROM settings WHERE key = 'default_shipping_fee'");
    const freeShippingRes = await query("SELECT value FROM settings WHERE key = 'free_shipping_threshold'");
    
    const taxRate = taxRateRes.rows.length > 0 ? parseFloat(taxRateRes.rows[0].value) : 0.08;
    const defaultShipping = shippingFeeRes.rows.length > 0 ? parseFloat(shippingFeeRes.rows[0].value) : 10.00;
    const freeShippingThreshold = freeShippingRes.rows.length > 0 ? parseFloat(freeShippingRes.rows[0].value) : 100.00;
    
    // Recalculate from order items to ensure accuracy
    const subtotal = Number(order.subtotal) || 0;
    const calculatedTax = Math.round(subtotal * taxRate * 100) / 100;
    const calculatedShipping = subtotal >= freeShippingThreshold ? 0 : defaultShipping;
    const calculatedTotal = subtotal + calculatedTax + calculatedShipping;

    // Generate invoice number
    const invoiceNumber = await query('SELECT generate_invoice_number()');
    const invoice_number = invoiceNumber.rows[0].generate_invoice_number;

    const issue_date = new Date();
    const due_date = new Date(issue_date);
    due_date.setDate(due_date.getDate() + Number(due_days));

    // Create invoice
    const invoiceRes = await query(
      `INSERT INTO invoices (
        invoice_number, order_id, user_id, customer_name, customer_email, customer_phone,
        billing_street, billing_street2, billing_city, billing_state, billing_zip, billing_country,
        subtotal, tax, shipping_fee, total, balance_due, status, issue_date, due_date
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *`,
      [
        invoice_number, order.id, order.user_id, order.customer_name, order.customer_email, order.customer_phone,
        order.billing_street || order.shipping_street,
        order.billing_street2 || order.shipping_street2,
        order.billing_city || order.shipping_city,
        order.billing_state || order.shipping_state,
        order.billing_zip || order.shipping_zip,
        order.billing_country || order.shipping_country,
        subtotal, calculatedTax, calculatedShipping, calculatedTotal, calculatedTotal, 'draft',
        issue_date.toISOString().split('T')[0],
        due_date.toISOString().split('T')[0]
      ]
    );

    const invoice = invoiceRes.rows[0];

    // Create invoice items
    for (const item of itemsRes.rows) {
      await query(
        `INSERT INTO invoice_items (invoice_id, product_id, description, quantity, unit_price, total_price)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [invoice.id, item.product_id, item.product_name, item.quantity, item.unit_price, item.total_price]
      );
    }

    res.json({ success: true, data: invoice });
  } catch (e) {
    console.error('Create invoice error', e);
    res.status(500).json({ success: false, error: 'Failed to create invoice' });
  }
});

// Admin: update invoice status
app.put('/api/admin/invoices/:id/status', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, amount_paid } = req.body;

    const updates: string[] = ['status = $1', 'updated_at = NOW()'];
    const params: any[] = [status];

    if (status === 'paid' && amount_paid !== undefined) {
      updates.push(`amount_paid = $${params.length + 1}`);
      updates.push(`balance_due = total - $${params.length + 1}`);
      updates.push(`paid_date = CURRENT_DATE`);
      params.push(amount_paid);
    }

    params.push(Number(id));

    await query(
      `UPDATE invoices SET ${updates.join(', ')} WHERE id = $${params.length}`,
      params
    );

    res.json({ success: true });
  } catch (e) {
    console.error('Update invoice status error', e);
    res.status(500).json({ success: false, error: 'Failed to update invoice status' });
  }
});

// Admin: get customers
app.get('/api/admin/customers', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { status, tier, search, page = '1', per_page = '20' } = req.query as any;
    const filters: string[] = [];
    const params: any[] = [];

    if (status && status !== 'all') {
      // Active = has order in last 90 days
      if (status === 'active') {
        filters.push(`EXISTS (SELECT 1 FROM orders WHERE user_id = u.id AND created_at > NOW() - INTERVAL '90 days')`);
      } else {
        filters.push(`NOT EXISTS (SELECT 1 FROM orders WHERE user_id = u.id AND created_at > NOW() - INTERVAL '90 days')`);
      }
    }

    if (search) {
      params.push(`%${search}%`);
      filters.push(`(u.email ILIKE $${params.length} OR u.full_name ILIKE $${params.length})`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const pageNum = Number(page) || 1;
    const perPageNum = Number(per_page) || 20;
    const offset = (pageNum - 1) * perPageNum;

    const totalRes = await query(`SELECT COUNT(*)::int AS count FROM users u ${where}`, params);
    
    const customersRes = await query(
      `SELECT 
        u.id, u.email, u.full_name, u.created_at,
        p.phone,
        COUNT(DISTINCT o.id)::int AS total_orders,
        COALESCE(SUM(o.total), 0)::numeric AS total_spent,
        MAX(o.created_at) AS last_order_date,
        CASE 
          WHEN SUM(o.total) >= 5000 THEN 'Platinum'
          WHEN SUM(o.total) >= 2000 THEN 'Gold'
          WHEN SUM(o.total) >= 500 THEN 'Silver'
          ELSE 'Bronze'
        END AS tier,
        CASE 
          WHEN MAX(o.created_at) > NOW() - INTERVAL '90 days' THEN 'active'
          ELSE 'inactive'
        END AS status
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN orders o ON u.id = o.user_id
       ${where}
       GROUP BY u.id, u.email, u.full_name, u.created_at, p.phone
       ORDER BY total_spent DESC
       LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPageNum, offset]
    );

    res.json({
      success: true,
      data: {
        data: customersRes.rows,
        total: totalRes.rows[0].count,
        page: pageNum,
        per_page: perPageNum,
        total_pages: Math.ceil(totalRes.rows[0].count / perPageNum)
      }
    });
  } catch (e) {
    console.error('Get customers error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// Admin: get customer details
app.get('/api/admin/customers/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const customerRes = await query(
      `SELECT 
        u.id, u.email, u.full_name, u.created_at,
        p.phone, p.avatar_url,
        COUNT(DISTINCT o.id)::int AS total_orders,
        COALESCE(SUM(o.total), 0)::numeric AS total_spent,
        MAX(o.created_at) AS last_order_date
       FROM users u
       LEFT JOIN profiles p ON u.id = p.user_id
       LEFT JOIN orders o ON u.id = o.user_id
       WHERE u.id = $1
       GROUP BY u.id, u.email, u.full_name, u.created_at, p.phone, p.avatar_url`,
      [id]
    );

    if (!customerRes.rows.length) {
      return res.status(404).json({ success: false, error: 'Customer not found' });
    }

    const customer = customerRes.rows[0];

    // Get recent orders
    const ordersRes = await query(
      `SELECT id, order_number, created_at, total, status 
       FROM orders 
       WHERE user_id = $1 
       ORDER BY created_at DESC 
       LIMIT 10`,
      [id]
    );

    customer.orders = ordersRes.rows;

    res.json({ success: true, data: customer });
  } catch (e) {
    console.error('Get customer error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

// ============================================
// SETTINGS ENDPOINTS
// ============================================

// Get all settings (admin only)
app.get('/api/admin/settings', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const result = await query('SELECT * FROM settings ORDER BY category, key');
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Get settings error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// Get settings by category
app.get('/api/admin/settings/:category', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { category } = req.params;
    const result = await query('SELECT * FROM settings WHERE category = $1 ORDER BY key', [category]);
    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Get settings by category error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// Update setting (admin only)
app.put('/api/admin/settings/:key', requireAuth, requireAdmin, async (req: any, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    
    const result = await query(
      'UPDATE settings SET value = $1, updated_at = now(), updated_by = $2 WHERE key = $3 RETURNING *',
      [value, req.user.id, key]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Setting not found' });
    }
    
    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Update setting error', e);
    res.status(500).json({ success: false, error: 'Failed to update setting' });
  }
});

// Get public settings (for tax calculation on frontend)
app.get('/api/settings/public', async (req, res) => {
  try {
    const result = await query(
      "SELECT key, value FROM settings WHERE key IN ('tax_rate', 'default_shipping_fee', 'free_shipping_threshold')"
    );
    
    const settings: any = {};
    result.rows.forEach((row: any) => {
      settings[row.key] = row.value;
    });
    
    res.json({ success: true, data: settings });
  } catch (e) {
    console.error('Get public settings error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch settings' });
  }
});

// Admin: get inventory data
app.get('/api/admin/inventory', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const result = await query(`
      SELECT 
        id,
        name,
        sku,
        stock_quantity as currentStock,
        COALESCE(low_stock_threshold, 10) as minStock,
        price as unitCost,
        COALESCE(category_id, 0) as categoryId,
        price
      FROM products
      ORDER BY name ASC
    `);

    const products = result.rows.map((p: any) => ({
      id: p.id,
      name: p.name,
      sku: p.sku,
      currentStock: p.currentstock,
      minStock: p.minstock,
      unitCost: Number(p.unitcost),
      categoryId: p.categoryid,
      price: Number(p.price),
    }));

    // Calculate totals
    const totalValue = products.reduce((sum: number, p: any) => sum + (p.currentStock * p.unitCost), 0);
    const outOfStock = products.filter((p: any) => p.currentStock === 0).length;
    const lowStock = products.filter((p: any) => p.currentStock > 0 && p.currentStock <= p.minStock).length;

    res.json({ 
      success: true, 
      data: {
        products,
        stats: {
          totalItems: products.length,
          totalValue: Number(totalValue.toFixed(2)),
          outOfStockCount: outOfStock,
          lowStockCount: lowStock,
        }
      }
    });
  } catch (e) {
    console.error('Get inventory error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch inventory' });
  }
});

// Admin: Get suppliers
app.get('/api/admin/suppliers', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const result = await query(`
      SELECT 
        s.id, 
        s.name, 
        s.contact_person, 
        s.email, 
        s.phone, 
        s.address, 
        s.payment_terms, 
        s.default_lead_time_days, 
        s.is_active, 
        s.rating, 
        s.notes, 
        s.created_at,
        COALESCE(json_agg(
          json_build_object(
            'id', p.id,
            'name', p.name,
            'sku', p.sku,
            'stock_quantity', p.stock_quantity,
            'price', p.price,
            'cost_price', p.cost_price,
            'low_stock_threshold', p.low_stock_threshold,
            'barcode', p.barcode
          )
          ORDER BY p.name
        ) FILTER (WHERE p.id IS NOT NULL), '[]') as products
      FROM suppliers s
      LEFT JOIN products p ON p.supplier_id = s.id
      GROUP BY s.id
      ORDER BY s.name ASC
    `);

    res.json({ 
      success: true, 
      data: result.rows
    });
  } catch (e) {
    console.error('Get suppliers error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
  }
});

// Admin: Get low stock products grouped by supplier
app.get('/api/admin/low-stock-by-supplier', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const result = await query(`
      SELECT 
        s.id,
        s.name as supplier_name,
        s.contact_person,
        s.email,
        s.phone,
        s.payment_terms,
        s.default_lead_time_days,
        json_agg(
          json_build_object(
            'product_id', p.id,
            'product_name', p.name,
            'sku', p.sku,
            'current_stock', p.stock_quantity,
            'low_stock_threshold', COALESCE(p.low_stock_threshold, 10),
            'reorder_quantity', GREATEST(COALESCE(p.low_stock_threshold, 10) * 3, 25),
            'unit_cost', COALESCE(p.cost_price, p.price),
            'barcode', p.barcode
          ) ORDER BY p.name
        ) as products
      FROM suppliers s
      LEFT JOIN products p ON s.id = p.supplier_id 
        AND p.stock_quantity <= COALESCE(p.low_stock_threshold, 10)
      WHERE s.is_active = true
      GROUP BY s.id, s.name, s.contact_person, s.email, s.phone, s.payment_terms, s.default_lead_time_days
      HAVING COUNT(p.id) > 0
      ORDER BY s.name
    `);

    res.json({ 
      success: true, 
      data: result.rows
    });
  } catch (e) {
    console.error('Get low stock by supplier error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch low stock products' });
  }
});

// Admin: Create purchase order
app.post('/api/admin/purchase-orders', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { supplier_id, expected_delivery_date, items, notes } = req.body;

    if (!supplier_id || !items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    // Begin transaction
    const client = await query('BEGIN', []);

    try {
      // Create purchase order
      const poResult = await query(`
        INSERT INTO purchase_orders (supplier_id, expected_delivery_date, notes, status, created_by)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, po_number, supplier_id, order_date, expected_delivery_date, status, 
                  subtotal, tax_amount, shipping_cost, total_amount
      `, [supplier_id, expected_delivery_date || null, notes || '', 'draft', req.user.id]);

      const po = poResult.rows[0];

      // Insert items
      for (const item of items) {
        await query(`
          INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_price)
          VALUES ($1, $2, $3, $4)
        `, [po.id, item.product_id, item.quantity, item.unit_price]);
      }

      // Recalculate totals
      await query('SELECT recalculate_po_totals($1)', [po.id]);

      // Fetch updated PO with items
      const updatedPo = await query(`
        SELECT po.*, json_agg(
          json_build_object(
            'id', poi.id,
            'product_id', poi.product_id,
            'product_name', p.name,
            'quantity', poi.quantity,
            'unit_price', poi.unit_price,
            'line_total', poi.line_total,
            'barcode', poi.barcode
          )
        ) as items
        FROM purchase_orders po
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        LEFT JOIN products p ON poi.product_id = p.id
        WHERE po.id = $1
        GROUP BY po.id
      `, [po.id]);

      await query('COMMIT', []);
      res.status(201).json({ success: true, data: updatedPo.rows[0] });
    } catch (error) {
      await query('ROLLBACK', []);
      throw error;
    }
  } catch (e) {
    console.error('Create purchase order error', e);
    res.status(500).json({ success: false, error: 'Failed to create purchase order' });
  }
});

// Admin: Get purchase orders
app.get('/api/admin/purchase-orders', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { supplier_id, status, page = '1', per_page = '20' } = req.query;
    const filters: string[] = [];
    const params: any[] = [];

    if (supplier_id) {
      params.push(Number(supplier_id));
      filters.push(`po.supplier_id = $${params.length}`);
    }

    if (status) {
      params.push(status);
      filters.push(`po.status = $${params.length}`);
    }

    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const pageNum = Number(page) || 1;
    const perPageNum = Number(per_page) || 20;
    const offset = (pageNum - 1) * perPageNum;

    params.push(perPageNum);
    params.push(offset);

    const result = await query(`
      SELECT 
        po.id, po.po_number, po.supplier_id, s.name as supplier_name,
        po.order_date, po.expected_delivery_date, po.actual_delivery_date,
        po.status, po.payment_status, po.subtotal, po.tax_amount, 
        po.shipping_cost, po.total_amount, po.notes,
        COUNT(poi.id)::int as item_count,
        COALESCE(SUM(poi.received_quantity), 0)::int as received_count
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      ${where}
      GROUP BY po.id, s.name
      ORDER BY po.order_date DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);

    res.json({ success: true, data: result.rows });
  } catch (e) {
    console.error('Get purchase orders error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase orders' });
  }
});

// Admin: Get purchase order with items
app.get('/api/admin/purchase-orders/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;

    const result = await query(`
      SELECT po.*, s.name as supplier_name,
        json_agg(
          json_build_object(
            'id', poi.id,
            'product_id', poi.product_id,
            'product_name', p.name,
            'sku', p.sku,
            'quantity', poi.quantity,
            'unit_price', poi.unit_price,
            'line_total', poi.line_total,
            'received_quantity', COALESCE(poi.received_quantity, 0),
            'barcode', poi.barcode
          ) ORDER BY poi.id
        ) as items
      FROM purchase_orders po
      JOIN suppliers s ON po.supplier_id = s.id
      LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
      LEFT JOIN products p ON poi.product_id = p.id
      WHERE po.id = $1
      GROUP BY po.id, s.name
    `, [Number(id)]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Get purchase order error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch purchase order' });
  }
});

// Admin: Update purchase order status
app.put('/api/admin/purchase-orders/:id/status', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status, payment_status, actual_delivery_date } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, error: 'Status is required' });
    }

    const result = await query(`
      UPDATE purchase_orders
      SET 
        status = $2,
        payment_status = COALESCE($3, payment_status),
        actual_delivery_date = COALESCE($4, actual_delivery_date),
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [Number(id), status, payment_status || null, actual_delivery_date || null]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Purchase order not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Update purchase order status error', e);
    res.status(500).json({ success: false, error: 'Failed to update purchase order' });
  }
});

// Admin: Record received items
app.post('/api/admin/purchase-orders/:id/receive-items', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { items } = req.body; // Array of { item_id, received_quantity }

    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: 'No items provided' });
    }

    const client = await query('BEGIN', []);

    try {
      // Update received quantities
      for (const item of items) {
        await query(`
          UPDATE purchase_order_items
          SET received_quantity = $2, updated_at = NOW()
          WHERE id = $1
        `, [item.item_id, item.received_quantity]);

        // Get product info to update stock
        const poItemRes = await query(`
          SELECT product_id FROM purchase_order_items WHERE id = $1
        `, [item.item_id]);

        if (poItemRes.rows.length > 0) {
          const productId = poItemRes.rows[0].product_id;
          
          // Update product stock
          await query(`
            UPDATE products
            SET stock_quantity = stock_quantity + $2, updated_at = NOW()
            WHERE id = $1
          `, [productId, item.received_quantity]);
        }
      }

      await query('COMMIT', []);

      // Fetch updated PO
      const result = await query(`
        SELECT po.*, s.name as supplier_name,
          json_agg(
            json_build_object(
              'id', poi.id,
              'product_id', poi.product_id,
              'product_name', p.name,
              'quantity', poi.quantity,
              'received_quantity', COALESCE(poi.received_quantity, 0),
              'barcode', poi.barcode
            ) ORDER BY poi.id
          ) as items
        FROM purchase_orders po
        JOIN suppliers s ON po.supplier_id = s.id
        LEFT JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
        LEFT JOIN products p ON poi.product_id = p.id
        WHERE po.id = $1
        GROUP BY po.id, s.name
      `, [Number(id)]);

      res.json({ success: true, data: result.rows[0] });
    } catch (error) {
      await query('ROLLBACK', []);
      throw error;
    }
  } catch (e) {
    console.error('Receive items error', e);
    res.status(500).json({ success: false, error: 'Failed to receive items' });
  }
});

// Admin: get contact submissions
app.get('/api/admin/contact-submissions', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { status = 'all', page = '1', perPage = '20', search = '' } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const perPageNum = Math.max(1, Math.min(100, parseInt(perPage)));
    const offset = (pageNum - 1) * perPageNum;

    let where = '';
    let params: any[] = [];

    if (status && status !== 'all') {
      where += `WHERE status = $${params.length + 1}`;
      params.push(status);
    }

    if (search) {
      const searchParam = `%${search}%`;
      if (where) {
        where += ` AND (full_name ILIKE $${params.length + 1} OR company_name ILIKE $${params.length + 2} OR business_email ILIKE $${params.length + 3})`;
      } else {
        where += `WHERE (full_name ILIKE $${params.length + 1} OR company_name ILIKE $${params.length + 2} OR business_email ILIKE $${params.length + 3})`;
      }
      params.push(searchParam, searchParam, searchParam);
    }

    const totalRes = await query(`SELECT COUNT(*)::int AS count FROM contact_submissions ${where}`, params);
    const submissionsRes = await query(
      `SELECT id, full_name, company_name, business_email, phone_number, message, status, created_at, updated_at, read_at
       FROM contact_submissions ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
      [...params, perPageNum, offset]
    );

    res.json({
      success: true,
      data: {
        data: submissionsRes.rows,
        total: totalRes.rows[0].count,
        page: pageNum,
        per_page: perPageNum,
        total_pages: Math.ceil(totalRes.rows[0].count / perPageNum)
      }
    });
  } catch (e) {
    console.error('Get contact submissions error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch contact submissions' });
  }
});

// Admin: get single contact submission
app.get('/api/admin/contact-submissions/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await query(
      `SELECT id, full_name, company_name, business_email, phone_number, message, status, created_at, updated_at, read_at
       FROM contact_submissions WHERE id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    // Mark as read
    if (!result.rows[0].read_at) {
      await query(
        'UPDATE contact_submissions SET read_at = now() WHERE id = $1',
        [id]
      );
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Get contact submission error', e);
    res.status(500).json({ success: false, error: 'Failed to fetch submission' });
  }
});

// Admin: update contact submission status
app.put('/api/admin/contact-submissions/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['new', 'read', 'in-progress', 'resolved', 'archived'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const result = await query(
      `UPDATE contact_submissions SET status = $1, updated_at = now() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    res.json({ success: true, data: result.rows[0] });
  } catch (e) {
    console.error('Update contact submission error', e);
    res.status(500).json({ success: false, error: 'Failed to update submission' });
  }
});

// Admin: delete contact submission
app.delete('/api/admin/contact-submissions/:id', requireAuth, requireAdmin, async (req: any, res: any) => {
  try {
    const { id } = req.params;
    const result = await query(
      'DELETE FROM contact_submissions WHERE id = $1 RETURNING id',
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ success: false, error: 'Submission not found' });
    }

    res.json({ success: true, message: 'Submission deleted successfully' });
  } catch (e) {
    console.error('Delete contact submission error', e);
    res.status(500).json({ success: false, error: 'Failed to delete submission' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/signup`);
  console.log(`   POST http://localhost:${PORT}/api/auth/signin`);
  console.log(`   POST http://localhost:${PORT}/api/auth/signout`);
  console.log(`   GET  http://localhost:${PORT}/api/auth/user`);
  console.log(`   GET  http://localhost:${PORT}/api/health`);
  console.log(`   GET  http://localhost:${PORT}/api/categories`);
  console.log(`   GET  http://localhost:${PORT}/api/products`);
  console.log(`   GET  http://localhost:${PORT}/api/products/slug/:slug`);
  console.log(`   POST http://localhost:${PORT}/api/admin/uploads`);
  console.log(`   POST http://localhost:${PORT}/api/admin/products`);
  console.log(`   PUT  http://localhost:${PORT}/api/admin/products/:id`);
  console.log(`   DELETE http://localhost:${PORT}/api/admin/products/:id`);
  console.log(`   POST http://localhost:${PORT}/api/orders`);
  console.log(`   GET  http://localhost:${PORT}/api/orders`);
  console.log(`   GET  http://localhost:${PORT}/api/orders/:id`);
  console.log(`   PUT  http://localhost:${PORT}/api/admin/orders/:id/status`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/stats`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/analytics`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/users`);
  console.log(`   PUT  http://localhost:${PORT}/api/admin/users/:id/role`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/invoices`);
  console.log(`   POST http://localhost:${PORT}/api/admin/invoices`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/invoices/:id`);
  console.log(`   PUT  http://localhost:${PORT}/api/admin/invoices/:id`);
  console.log(`   POST http://localhost:${PORT}/api/admin/invoices/from-order/:orderId`);
  console.log(`   PUT  http://localhost:${PORT}/api/admin/invoices/:id/status`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/customers`);
  console.log(`   GET  http://localhost:${PORT}/api/admin/customers/:id`);
});

export default app;
