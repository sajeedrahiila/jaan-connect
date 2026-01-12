# Supplier & Purchase Order Management System

## Overview

Comprehensive supplier management system that allows you to:
- Track suppliers and their products
- Monitor product stock levels across suppliers
- Generate purchase orders automatically when stock is low
- Track purchase order status and deliveries
- Include product barcodes with purchase orders
- Receive items and update inventory

## Database Schema

### Suppliers Table
```sql
CREATE TABLE suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  payment_terms VARCHAR(100),
  default_lead_time_days INTEGER (default: 7),
  is_active BOOLEAN (default: true),
  rating INTEGER (1-5),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Product-Supplier Relationship
Products table already has:
- `supplier_id` - Foreign key to suppliers
- `supplier_name` - Supplier name for reference
- `cost_price` - Unit cost from supplier
- `lead_time_days` - Days to receive stock from supplier

### Purchase Orders Table
```sql
CREATE TABLE purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE,
  supplier_id INTEGER REFERENCES suppliers(id),
  order_date TIMESTAMP,
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status VARCHAR(50) - 'draft'|'pending'|'confirmed'|'shipped'|'delivered'|'cancelled',
  payment_status VARCHAR(50) - 'unpaid'|'partial'|'paid',
  subtotal DECIMAL(12,2),
  tax_amount DECIMAL(12,2) (5% automatic),
  shipping_cost DECIMAL(12,2),
  total_amount DECIMAL(12,2) (auto-calculated),
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);
```

### Purchase Order Items Table
```sql
CREATE TABLE purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER CHECK (quantity > 0),
  unit_price DECIMAL(12,2),
  line_total DECIMAL(12,2) (auto-calculated: quantity × unit_price),
  received_quantity INTEGER DEFAULT 0,
  barcode VARCHAR(255) (auto-generated),
  notes TEXT,
  created_at TIMESTAMP
);
```

## API Endpoints

### Get Suppliers
**GET** `/api/admin/suppliers`
- **Auth**: Admin only
- **Returns**: Array of all active suppliers with contact info and ratings

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Green Valley Farms",
      "contact_person": "John Smith",
      "email": "john@greenvalley.com",
      "phone": "+1-555-0101",
      "address": "123 Farm Road, Iowa",
      "payment_terms": "Net 30",
      "default_lead_time_days": 7,
      "is_active": true,
      "rating": 5
    }
  ]
}
```

### Get Low Stock by Supplier
**GET** `/api/admin/low-stock-by-supplier`
- **Auth**: Admin only
- **Returns**: Suppliers with their low-stock products grouped together
- **Use Case**: Generate purchase orders for low inventory

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "supplier_name": "Green Valley Farms",
      "contact_person": "John Smith",
      "email": "john@greenvalley.com",
      "payment_terms": "Net 30",
      "default_lead_time_days": 7,
      "products": [
        {
          "product_id": 3,
          "product_name": "Organic Apples",
          "sku": "APL-001",
          "current_stock": 5,
          "low_stock_threshold": 10,
          "reorder_quantity": 30,
          "unit_cost": 2.50,
          "barcode": "APL-001-BC"
        }
      ]
    }
  ]
}
```

### Create Purchase Order
**POST** `/api/admin/purchase-orders`
- **Auth**: Admin only
- **Request Body**:
```json
{
  "supplier_id": 1,
  "expected_delivery_date": "2026-01-20",
  "items": [
    {
      "product_id": 3,
      "quantity": 50,
      "unit_price": 2.50
    }
  ],
  "notes": "Urgent restock needed"
}
```
- **Response**: Created purchase order with items and auto-calculated totals

### Get Purchase Orders
**GET** `/api/admin/purchase-orders`
- **Auth**: Admin only
- **Query Parameters**:
  - `supplier_id` - Filter by supplier
  - `status` - Filter by status (draft, pending, confirmed, shipped, delivered, cancelled)
  - `page` - Pagination (default: 1)
  - `per_page` - Items per page (default: 20)
- **Returns**: List of purchase orders with summary info

```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "po_number": "PO2026-00001",
      "supplier_id": 1,
      "supplier_name": "Green Valley Farms",
      "order_date": "2026-01-11T...",
      "expected_delivery_date": "2026-01-18",
      "status": "pending",
      "payment_status": "unpaid",
      "subtotal": 125.00,
      "tax_amount": 6.25,
      "total_amount": 131.25,
      "item_count": 3,
      "received_count": 0
    }
  ]
}
```

### Get Purchase Order Details
**GET** `/api/admin/purchase-orders/:id`
- **Auth**: Admin only
- **Returns**: Complete PO with all items and barcodes

### Update Purchase Order Status
**PUT** `/api/admin/purchase-orders/:id/status`
- **Auth**: Admin only
- **Request Body**:
```json
{
  "status": "shipped",
  "payment_status": "partial",
  "actual_delivery_date": "2026-01-19"
}
```
- **Response**: Updated purchase order

### Record Received Items
**POST** `/api/admin/purchase-orders/:id/receive-items`
- **Auth**: Admin only
- **Purpose**: Mark items as received and update product stock
- **Request Body**:
```json
{
  "items": [
    {
      "item_id": 1,
      "received_quantity": 50
    }
  ]
}
```
- **Effects**:
  - Updates `received_quantity` on purchase order item
  - Automatically increments product `stock_quantity`
  - Returns updated PO

## Frontend Pages

### Purchase Orders Page
**Location**: `/admin/purchase-orders`

**Features**:
- View all purchase orders with status
- Filter by status and search by PO number
- Display statistics:
  - Total POs
  - Pending orders
  - In transit orders
  - Total value
- Edit and manage purchase orders

**Low Stock Modal**:
- Click "Low Stock" button to view low inventory products grouped by supplier
- See all products from each supplier that are below reorder point
- Shows:
  - Current stock vs threshold
  - Recommended reorder quantity
  - Unit cost and total cost
  - Product barcodes
- "Create PO" button generates purchase order automatically

**Purchase Order Details**:
- View complete PO information
- See all items with:
  - Product name and SKU
  - Quantities ordered and received
  - Individual barcodes for tracking
  - Unit prices and line totals
- Track payment and delivery status
- Download PO as PDF

### Supplier Information in Products
- Products page shows supplier name for each product
- Edit product form shows supplier selection
- Display cost price from supplier

## Workflow Examples

### Example 1: Generate PO from Low Stock Alert
1. Admin clicks "Low Stock" on Purchase Orders page
2. System queries all products with stock ≤ low_stock_threshold
3. Groups products by supplier
4. Admin reviews each supplier's low-stock items
5. Clicks "Create PO" button
6. System automatically:
   - Creates purchase order
   - Calculates recommended order quantity
   - Uses product cost price as unit price
   - Calculates totals (subtotal + 5% tax)
   - Generates barcode for each item
7. PO is created in "draft" status
8. Admin can edit, add notes, or submit

### Example 2: Receive Items from Purchase Order
1. Supplier delivers items for a purchase order
2. Admin opens PO detail view
3. Receives items using barcode scanner or manual entry
4. Updates received quantity for each item
5. System automatically:
   - Updates product stock_quantity
   - Calculates received vs ordered percentage
   - Updates PO status
6. When all items received, PO status changes to "delivered"

### Example 3: View Supplier Performance
1. In low-stock view, can see supplier:
   - Contact information
   - Payment terms
   - Default lead time
   - Quality rating (1-5 stars)
2. Helps prioritize suppliers when choosing between multiple sources

## Features

### Auto-Calculated Fields
- **PO Number**: Format `PO{YYYY}-{5-digit sequence}`
- **Line Total**: `quantity × unit_price`
- **Subtotal**: Sum of all line totals
- **Tax**: `subtotal × 0.05` (5% fixed rate)
- **Total**: `subtotal + tax + shipping`
- **Item Barcode**: `POI{po_id}-{item_id}`

### Status Tracking
**Purchase Order Status**:
- `draft` - Being prepared, not sent yet
- `pending` - Sent to supplier, awaiting confirmation
- `confirmed` - Supplier confirmed the order
- `shipped` - Order is in transit
- `delivered` - Received and items processed
- `cancelled` - Order was cancelled

**Payment Status**:
- `unpaid` - Invoice created but not paid
- `partial` - Partial payment received
- `paid` - Fully paid

### Inventory Integration
- When items are received, product `stock_quantity` is automatically updated
- Low stock view uses `low_stock_threshold` field on products
- Reorder quantity automatically calculated as: `threshold × 3` (minimum 25, maximum 100)

## Security

- All endpoints require admin authentication
- Foreign key constraints prevent orphaned records
- Transactions ensure data consistency
- Cost prices visible to admin only

## Database Views

### low_stock_by_supplier (View)
- Pre-calculated data showing suppliers with low-stock products
- Used for the "Low Stock" feature
- Automatically updated when products or suppliers change
- Shows formatted product information for easy ordering

## Configuration

- **Tax Rate**: Fixed at 5% (can be made configurable)
- **Default Lead Time**: Per supplier (default 7 days)
- **Shipping Cost**: Editable per PO
- **Payment Terms**: Stored per supplier (informational)

## Future Enhancements

1. **PDF Generation**: Download formatted purchase orders
2. **Email Integration**: Send POs directly to supplier email
3. **Barcode Scanning**: Receive items using barcode scanner
4. **Purchase Analytics**: Track spending by supplier over time
5. **Automated Reordering**: Schedule automatic PO generation
6. **Multi-Supplier Comparison**: Compare prices across suppliers
7. **Purchase History**: Detailed history of supplier relationships
8. **Budget Tracking**: Monitor spending against budget
9. **Quality Ratings**: Track supplier quality metrics
10. **Lead Time Analysis**: Optimize stock based on actual lead times

## Testing Checklist

- [ ] Create new purchase order from low-stock alert
- [ ] Verify PO number auto-generates
- [ ] Check barcodes are created for all items
- [ ] Test totals calculation (subtotal, tax, total)
- [ ] Update purchase order status
- [ ] Record received items
- [ ] Verify product stock updated after receipt
- [ ] Filter purchase orders by status
- [ ] View purchase order details
- [ ] Check low-stock grouping by supplier
- [ ] Verify supplier contact info displays correctly
