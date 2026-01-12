# Quick Reference - Supplier & Purchase Order System

## 🎯 Quick Start

### Access Purchase Orders
- URL: `http://localhost:8081/admin/purchase-orders`
- Admin login required

### Generate PO from Low Stock
1. Click "Low Stock" button
2. View products below reorder threshold grouped by supplier
3. Click "Create PO" to auto-generate purchase order

### Key Buttons
| Button | Action |
|--------|--------|
| Low Stock | View low inventory products by supplier |
| New PO | Create purchase order manually |
| Create PO | Auto-generate PO for supplier's low-stock items |

## 📊 What's Included

### Database Tables
- `suppliers` - Vendor information
- `purchase_orders` - PO headers with totals
- `purchase_order_items` - Line items with quantities
- `products` - Now linked to suppliers via `supplier_id`

### API Endpoints (7 Total)
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/admin/suppliers` | List all suppliers |
| GET | `/api/admin/low-stock-by-supplier` | Get low-stock products by supplier |
| POST | `/api/admin/purchase-orders` | Create new PO |
| GET | `/api/admin/purchase-orders` | List POs |
| GET | `/api/admin/purchase-orders/:id` | PO details |
| PUT | `/api/admin/purchase-orders/:id/status` | Update status |
| POST | `/api/admin/purchase-orders/:id/receive-items` | Record receipts |

### Features
✅ Auto-generate PO numbers (PO2026-00001)
✅ Auto-generate barcodes (POI1-0001)
✅ Auto-calculate totals (subtotal + 5% tax)
✅ Group low stock by supplier
✅ Track supplier lead times
✅ Payment status tracking
✅ Inventory auto-update on receipt

## 📱 Pages

### Purchase Orders (/admin/purchase-orders)
- View all POs in table format
- Filter by status
- Search by PO number
- Statistics cards
- Low stock alerts

### Low Stock Modal
- Supplier grouped view
- Products below threshold
- Contact information
- Quick PO generation

### PO Details Modal
- Complete order information
- Items with barcodes
- Payment/delivery status
- Totals breakdown
- Download option

## 🗂️ File Locations

**Database**:
```
database/add_purchase_orders.sql          # Schema and functions
```

**Backend**:
```
server.ts                                  # API endpoints (lines 1778-1920)
```

**Frontend**:
```
src/pages/admin/PurchaseOrdersPage.tsx     # UI component
src/pages/admin/AdminLayout.tsx            # Navigation
src/App.tsx                                # Routes
```

**Documentation**:
```
SUPPLIER_AND_PO_SYSTEM.md                 # Full documentation
SUPPLIER_PO_IMPLEMENTATION.md             # Implementation details
```

## 💾 Sample Data

**Suppliers Added**:
- Sysco Foods (ID: 1)
- US Foods (ID: 2)

**Products with Suppliers**:
- milk (Sysco Foods) - Stock: 13
- Organic Apples (Sysco Foods) - Stock: 5 🔴
- Organic Carrots (Sysco Foods) - Stock: 3 🔴
- Fresh Lettuce (US Foods) - Stock: 8
- Tomatoes (US Foods) - Stock: 2 🔴

🔴 = Below threshold, shows in "Low Stock"

## ⚙️ Configuration

**Auto-Calculations**:
- Tax Rate: 5%
- Reorder Quantity: `low_stock_threshold × 3`
- Lead Time: Per supplier (7 days default)

**PO Number Format**: `PO{YYYY}-{5-digit sequence}`
**Item Barcode Format**: `POI{po_id}-{item_id}`

## 🔄 Data Flow

```
Low Stock Alert
    ↓
Click "Low Stock" button
    ↓
API: GET /api/admin/low-stock-by-supplier
    ↓
Frontend groups products by supplier
    ↓
Click "Create PO"
    ↓
API: POST /api/admin/purchase-orders
    ↓
Database:
  - Creates purchase_orders record
  - Creates purchase_order_items
  - Auto-generates barcode
  - Auto-calculates totals
    ↓
Frontend updates PO list
    ↓
Admin receives items
    ↓
API: POST /api/admin/purchase-orders/:id/receive-items
    ↓
Database:
  - Updates received_quantity
  - Increments product stock_quantity
    ↓
Inventory automatically replenished
```

## 🔐 Security

- Admin authentication required
- Foreign key constraints
- Transaction support
- Input validation
- Cost prices admin-only

## 📞 Support Data

### Supplier Fields
- Name, contact person, email, phone
- Address, payment terms
- Lead time (days)
- Rating (1-5 stars)
- Notes

### Product-Supplier Relationship
- Product → Supplier (via supplier_id)
- Product cost_price (from supplier)
- Product lead_time_days
- Product low_stock_threshold

### PO Fields
- PO Number (auto)
- Status: draft, pending, confirmed, shipped, delivered, cancelled
- Payment: unpaid, partial, paid
- Dates: order, expected delivery, actual delivery
- Totals: subtotal, tax (5%), shipping, total
- Items with barcodes

## 🚀 Next Steps

1. **Test the system**:
   - Go to `/admin/purchase-orders`
   - Click "Low Stock"
   - Generate a PO
   - View details

2. **Customize** (if needed):
   - Edit tax rate in `recalculate_po_totals()` function
   - Adjust reorder formula in `low_stock_by_supplier` view
   - Modify lead time calculations

3. **Integrate barcodes**:
   - Use barcode scanners to receive items
   - Print POs with barcodes
   - Track items using barcode system

4. **Monitor performance**:
   - Track spending by supplier
   - Monitor lead time accuracy
   - Analyze reorder patterns

## ✨ Highlights

**What Makes This Special**:
1. ✅ Fully automated PO generation from low stock
2. ✅ Complete barcode integration
3. ✅ Automatic inventory updates on receipt
4. ✅ Supplier grouping for batch ordering
5. ✅ Professional PO formatting with auto-calculations
6. ✅ Real-time status tracking
7. ✅ Payment status management
8. ✅ Delivery date tracking

All fully connected to database, APIs, and endpoints! 🎉
