# 🧪 Grocery Enhancements Testing Guide

## Quick Start
1. **Frontend:** http://localhost:8081/
2. **Backend:** http://localhost:3001/api/
3. **Admin Login Required:** All endpoints require authentication

---

## 🔑 Login to Admin Panel

### Step 1: Access Admin Panel
```
http://localhost:8081/admin/dashboard
```

### Step 2: Login Credentials
Use any admin account from your users table, or create one via:
```sql
-- In psql
UPDATE users SET role = 'admin' WHERE email = 'your-email@example.com';
```

---

## 📦 Test 1: Create Product with All Grocery Features

### Navigate to Products
1. Admin Dashboard → **Products** (sidebar)
2. Click **Add Product** button

### Fill Basic Info Tab
- **Product Name:** Organic Whole Wheat Flour
- **SKU:** FLR-WWH-001
- **UPC-A:** Click "Generate" button → Should create 12-digit code
- **Category:** Grains
- **Description:** Premium stone-ground whole wheat flour from local farms
- **Toggles:** 
  - ✅ Featured
  - ☐ Mark as New

**Expected:** UPC generator creates valid 12-digit code with check digit

---

### Fill Inventory Tab
- **On-Hand Quantity:** 150
- **Low Stock Alert:** 20
- **Unit:** Pound (lb)
- **Weight:** 5
- **Adjustment Reason:** Restock
- **Toggles:**
  - ☐ Allow Negative Stock
  - ✅ This product has variants

**Expected:** Form accepts all values, variants toggle shows message about managing after creation

---

### Fill Pricing & Tax Tab
- **Price:** 12.99
- **Compare Price:** 15.99
- **Unit Pricing Display:** Should auto-calculate **$2.60 / oz** (12.99 / 80 oz)
- **Taxable:** ☐ Unchecked
- **Tax Category:** Grocery (Tax-Exempt)
- **Cost Price:** 8.50
- **Margin %:** Should auto-calculate **34.6%**

**Expected:** 
- Unit pricing updates automatically as you type
- Margin percentage calculated live
- Tax status shows "✓ Tax-exempt (standard grocery)"
- NO warning (selling above cost)

**Test Below-Cost Warning:**
- Change Cost Price to 15.00 → Should show red warning "⚠ Selling below cost!"

---

### Fill Expiry & Batch Tab
- **Expiry Date:** 2026-06-30
- **Batch Number:** BATCH-2024-WWF-001
- **Lot Number:** LOT-A1234
- **Expiry Alert Days:** 14

**Expected:** All fields accept values, date picker works

---

### Fill Supplier Tab
- **Supplier Name:** Local Farm Co-op
- **Case Size:** 12 (12 bags per case)
- **Lead Time:** 5 days

**Expected:** Form accepts supplier info

---

### Submit Product
1. Click **Create Product** button
2. Wait for success toast
3. Product should appear in products table

**Expected:**
- Success toast appears
- Dialog closes
- New product visible in table

---

## 🔄 Test 2: Add Product Variants

### Open Variants Dialog
1. Find your created product in table
2. Click **Edit** (pencil icon)
3. Go to **Inventory** tab
4. Verify **Has Variants** is enabled
5. Click **Manage Variants** button

### Add First Variant: 1 lb bag
- **Name:** 1 lb
- **SKU:** FLR-WWH-001-1LB
- **UPC:** 012345678001
- **Price:** 3.99
- **Cost:** 2.50
- **Stock:** 80
- Click **Save** (checkmark icon)

### Add Second Variant: 5 lb bag
- Click **Add Variant** button
- **Name:** 5 lb
- **SKU:** FLR-WWH-001-5LB
- **UPC:** 012345678002
- **Price:** 12.99
- **Cost:** 8.50
- **Stock:** 150
- Click **Save**

### Add Third Variant: 10 lb bag
- Click **Add Variant**
- **Name:** 10 lb
- **SKU:** FLR-WWH-001-10LB
- **UPC:** 012345678003
- **Price:** 22.99
- **Cost:** 15.00
- **Stock:** 45
- Click **Save**

**Expected:**
- All 3 variants appear in table
- **Margin column** shows calculated percentages:
  - 1 lb: 37.3%
  - 5 lb: 34.6%
  - 10 lb: 34.7%
- **Stock badges** show green (all have stock)
- **Status badges** show "Active"

### Edit a Variant
1. Click **Edit** icon on 5 lb variant
2. Change **Price** to 11.99
3. Change **Stock** to 200
4. Click **Save**

**Expected:**
- Margin recalculates to 29.1%
- Stock updates to 200

### Delete a Variant
1. Click **Delete** icon on 1 lb variant
2. Confirm deletion
3. Variant removed from table

**Expected:**
- Confirmation dialog appears
- Variant disappears after confirmation

---

## 📊 Test 3: Inventory Adjustments

### Create Inventory Adjustment
```bash
# Using curl (requires auth cookie)
curl -X POST http://localhost:3001/api/admin/inventory/adjust \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "productId": 1,
    "variantId": null,
    "quantity": -20,
    "reason": "damage",
    "notes": "Water damage from roof leak"
  }'
```

**Expected Response:**
```json
{
  "id": 1,
  "product_id": 1,
  "quantity_change": -20,
  "reason": "damage",
  "notes": "Water damage from roof leak",
  "adjusted_by_id": "user-uuid",
  "adjusted_at": "2026-01-11T12:00:00Z"
}
```

### View Adjustment History
```bash
curl http://localhost:3001/api/admin/inventory/adjustments?productId=1 \
  -H "Cookie: your-session-cookie"
```

**Expected:** Array of all adjustments for product ID 1

---

## 💰 Test 4: Tax Categories

### Create Tax-Exempt Product (Grocery)
1. Click **Add Product**
2. Name: "Fresh Organic Apples"
3. Go to **Pricing & Tax** tab
4. **Taxable:** ☐ Unchecked
5. **Tax Category:** Grocery (Tax-Exempt)
6. Submit

**Expected:** Product saved with `is_taxable = false`, `tax_category = 'grocery'`

### Create Taxable Product (Prepared Food)
1. Click **Add Product**
2. Name: "Hot Rotisserie Chicken"
3. Go to **Pricing & Tax** tab
4. **Taxable:** ✅ Checked
5. **Tax Category:** Prepared Food
6. Submit

**Expected:** 
- Product saved with `is_taxable = true`, `tax_category = 'prepared_food'`
- Tax status shows "✓ Subject to sales tax"

### Create Beverage Product
1. Add Product: "Organic Orange Juice"
2. **Taxable:** ✅ Checked
3. **Tax Category:** Beverage
4. Submit

**Expected:** Product saved with beverage tax category

---

## 🚚 Test 5: Supplier Management

### View Suppliers
```bash
curl http://localhost:3001/api/admin/suppliers \
  -H "Cookie: your-session-cookie"
```

**Expected Response:**
```json
[
  {
    "id": "uuid-1",
    "name": "Sysco Foods",
    "contact_email": "orders@sysco.com",
    "contact_phone": "1-800-SYSCO-01",
    "is_active": true
  },
  {
    "id": "uuid-2",
    "name": "US Foods",
    "contact_email": "sales@usfoods.com",
    "is_active": true
  },
  {
    "id": "uuid-3",
    "name": "Local Farm Co-op",
    "contact_email": "orders@localfarm.coop",
    "is_active": true
  }
]
```

### Create New Supplier
```bash
curl -X POST http://localhost:3001/api/admin/suppliers \
  -H "Content-Type: application/json" \
  -H "Cookie: your-session-cookie" \
  -d '{
    "name": "Organic Valley",
    "contact_name": "John Smith",
    "contact_email": "john@organicvalley.com",
    "contact_phone": "608-555-1234",
    "address": "1 Organic Way, La Farge, WI 54639",
    "payment_terms": "Net 30",
    "minimum_order": 500.00,
    "lead_time_days": 3,
    "rating": 5,
    "notes": "Premium organic dairy supplier"
  }'
```

**Expected:** New supplier created with ID returned

---

## 🔢 Test 6: UPC-A Generation

### Manual Test
1. Create new product
2. Leave UPC field empty
3. Click **Generate** button next to UPC field
4. Verify generated code is exactly 12 digits
5. Check digit should be mathematically correct

### Algorithm Verification
```javascript
// Example: 01234567890X (X = check digit)
// Odd positions (1,3,5,7,9,11): 0+2+4+6+8+0 = 20
// Even positions (2,4,6,8,10): 1+3+5+7+9 = 25
// Check: (10 - ((20*3 + 25) % 10)) % 10 = (10 - (85 % 10)) % 10 = 5
// Final UPC: 012345678905
```

### Test Cases
| Generated UPC | Last Digit (Check) | Valid? |
|---------------|-------------------|--------|
| 01234567890**5** | 5 | ✅ |
| 78945612340**3** | 3 | ✅ |
| 99999999999**6** | 6 | ✅ |

---

## 📈 Test 7: Auto-Calculations

### Unit Pricing
| Price | Weight | Unit | Expected Per Oz |
|-------|--------|------|-----------------|
| $12.99 | 5 lb | lb | $0.1624 |
| $4.99 | 16 oz | oz | $0.3119 |
| $9.99 | 1 kg | kg | $0.2830 |

**Formula:** 
- lb: price / (weight * 16)
- kg: price / (weight * 35.274)
- oz: price / weight

### Margin Calculation
| Price | Cost | Expected Margin |
|-------|------|----------------|
| $12.99 | $8.50 | 34.6% |
| $3.99 | $2.50 | 37.3% |
| $10.00 | $12.00 | -20.0% (loss) |

**Formula:** ((price - cost) / price) * 100

---

## 🐛 Common Issues & Solutions

### Issue 1: "Unauthorized" Error
**Cause:** Not logged in as admin
**Solution:** Login at `/admin/login` with admin credentials

### Issue 2: UPC Generator Not Working
**Cause:** JavaScript error or missing toast
**Solution:** Check browser console, verify Lucide icons loaded

### Issue 3: Variants Not Showing
**Cause:** `has_variants` not enabled
**Solution:** Edit product, go to Inventory tab, enable "Has Variants" toggle

### Issue 4: Margin Shows "-"
**Cause:** Cost price not entered
**Solution:** Enter cost price in Pricing & Tax tab

### Issue 5: Unit Price Not Calculating
**Cause:** Weight or price field empty
**Solution:** Enter both price and weight values

---

## ✅ Complete Test Checklist

### Database
- [ ] Migration executed successfully
- [ ] All 3 new tables created
- [ ] 13 indexes created
- [ ] Triggers active (margin, unit price)
- [ ] Sample suppliers inserted

### API Endpoints
- [ ] POST /api/admin/products (30 params)
- [ ] PUT /api/admin/products/:id (32 params)
- [ ] GET /api/admin/products/:id/variants
- [ ] POST /api/admin/products/:id/variants
- [ ] PUT /api/admin/variants/:id
- [ ] DELETE /api/admin/variants/:id
- [ ] POST /api/admin/inventory/adjust
- [ ] GET /api/admin/inventory/adjustments
- [ ] GET /api/admin/suppliers
- [ ] POST /api/admin/suppliers
- [ ] PUT /api/admin/suppliers/:id
- [ ] DELETE /api/admin/suppliers/:id

### UI Components
- [ ] EnhancedProductDialog loads
- [ ] All 5 tabs render correctly
- [ ] UPC generator works
- [ ] Unit price auto-calculates
- [ ] Margin auto-calculates
- [ ] Below-cost warning appears
- [ ] Tax category dropdown works
- [ ] VariantsDialog opens
- [ ] Variant CRUD operations work
- [ ] Inline editing in variants table

### Business Logic
- [ ] Grocery products tax-exempt
- [ ] Prepared food taxable
- [ ] UPC-A is 12 digits
- [ ] Unit pricing in oz
- [ ] Margin percentage accurate
- [ ] Inventory adjustments logged
- [ ] Low stock threshold enforced
- [ ] Negative stock toggle works
- [ ] Expiry alerts configured
- [ ] Supplier data saved

---

## 📊 Success Metrics

### Data Quality
- ✅ All UPCs exactly 12 digits
- ✅ All margins calculated correctly
- ✅ All unit prices in ounces
- ✅ All tax categories valid ENUM

### Performance
- ✅ Product creation < 500ms
- ✅ Variant list loads < 200ms
- ✅ Auto-calculations instant
- ✅ No console errors

### User Experience
- ✅ Forms validate properly
- ✅ Error messages clear
- ✅ Success toasts appear
- ✅ Tooltips helpful
- ✅ Tabs organized logically

---

## 🔧 Debugging Commands

### Check Database Tables
```sql
-- Verify products table structure
\d products

-- Verify variants table
\d product_variants

-- Verify inventory adjustments
\d inventory_adjustments

-- Verify suppliers
\d suppliers

-- Check triggers
\df calculate_margin
\df calculate_price_per_unit
```

### Check Sample Data
```sql
-- View products with new fields
SELECT id, name, upc_code, tax_category, on_hand_quantity, margin_percentage 
FROM products LIMIT 5;

-- View variants
SELECT * FROM product_variants WHERE parent_product_id = 1;

-- View adjustments
SELECT * FROM inventory_adjustments ORDER BY adjusted_at DESC LIMIT 10;

-- View suppliers
SELECT * FROM suppliers WHERE is_active = true;
```

### Check API Logs
```bash
# View server logs
tail -f server.log

# Or if using tsx watch
# Check terminal output for request logs
```

---

**Last Updated:** January 11, 2026
**Status:** ✅ Ready for Testing
