# Supplier & Purchase Order System - Architecture Diagram

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        ADMIN DASHBOARD                              │
│                   /admin/purchase-orders                            │
└──────────────────────┬──────────────────────────────────────────────┘
                       │
        ┌──────────────┴──────────────┐
        │                             │
    ┌───▼────────┐          ┌────────▼───┐
    │ Low Stock  │          │ View All   │
    │  Button    │          │     POs    │
    └───┬────────┘          └────┬───────┘
        │                        │
        │                        │
    ┌───▼────────────────────────▼───────┐
    │  PurchaseOrdersPage.tsx             │
    │  - Display PO list                  │
    │  - Filter & search                  │
    │  - Statistics cards                 │
    │  - Low stock modal                  │
    │  - PO detail modal                  │
    └───┬──────────────────────────────────┘
        │
        │ API Calls
        │
    ┌───▼──────────────────────────────────────────────────────────┐
    │                    EXPRESS.JS BACKEND                        │
    │                    server.ts (APIs)                          │
    ├──────────────────────────────────────────────────────────────┤
    │                                                               │
    │  GET  /api/admin/suppliers                                   │
    │  GET  /api/admin/low-stock-by-supplier                       │
    │  POST /api/admin/purchase-orders                             │
    │  GET  /api/admin/purchase-orders                             │
    │  GET  /api/admin/purchase-orders/:id                         │
    │  PUT  /api/admin/purchase-orders/:id/status                  │
    │  POST /api/admin/purchase-orders/:id/receive-items           │
    │                                                               │
    └───┬──────────────────────────────────────────────────────────┘
        │
        │ SQL Queries
        │
    ┌───▼──────────────────────────────────────────────────────────┐
    │                    POSTGRESQL DATABASE                       │
    ├──────────────────────────────────────────────────────────────┤
    │                                                               │
    │  ┌─────────────────┐      ┌──────────────────┐              │
    │  │   SUPPLIERS     │      │    PRODUCTS      │              │
    │  ├─────────────────┤      ├──────────────────┤              │
    │  │ id (PK)         │      │ id (PK)          │              │
    │  │ name            │      │ name             │              │
    │  │ contact_person  │      │ supplier_id (FK) │◄─────┐       │
    │  │ email           │      │ stock_quantity   │      │       │
    │  │ phone           │      │ cost_price       │      │       │
    │  │ lead_time       │      │ low_stock_...    │      │       │
    │  │ payment_terms   │      └──────────────────┘      │       │
    │  │ rating          │                                 │       │
    │  └─────────────────┘                                 │       │
    │         △                                             │       │
    │         │ FK                                         │       │
    │         │                                             │       │
    │  ┌──────┴────────────────────────────────────────────┘       │
    │  │                                                            │
    │  │  ┌─────────────────────┐    ┌──────────────────────┐     │
    │  │  │ PURCHASE_ORDERS     │    │ PURCHASE_ORDER_ITEMS │     │
    │  │  ├─────────────────────┤    ├──────────────────────┤     │
    │  │  │ id (PK)             │    │ id (PK)              │     │
    │  │  │ po_number (auto)    │    │ purchase_order_id FK │     │
    │  │  │ supplier_id (FK)────┼────│ product_id FK        │     │
    │  │  │ order_date          │    │ quantity             │     │
    │  │  │ expected_delivery   │    │ unit_price           │     │
    │  │  │ status              │    │ line_total (calc)    │     │
    │  │  │ payment_status      │    │ received_quantity    │     │
    │  │  │ subtotal (calc)     │    │ barcode (auto)       │     │
    │  │  │ tax_amount (calc)   │    └──────────────────────┘     │
    │  │  │ total_amount (calc) │                                  │
    │  │  └─────────────────────┘                                  │
    │  │                                                            │
    │  │  ┌──────────────────────────┐                            │
    │  │  │ LOW_STOCK_BY_SUPPLIER    │ (View)                    │
    │  │  ├──────────────────────────┤                            │
    │  │  │ supplier_id              │                            │
    │  │  │ supplier_name            │                            │
    │  │  │ contact_person           │                            │
    │  │  │ products (aggregated)    │                            │
    │  │  │  - product_id            │                            │
    │  │  │  - product_name          │                            │
    │  │  │  - sku                   │                            │
    │  │  │  - current_stock         │                            │
    │  │  │  - low_threshold         │                            │
    │  │  │  - reorder_qty (calc)    │                            │
    │  │  │  - barcode               │                            │
    │  │  └──────────────────────────┘                            │
    │  │                                                            │
    │  └────────────────────────────────────────────────────────┐  │
    │                                                           │  │
    └───────────────────────────────────────────────────────────┘  │
        │                                                            │
        │ Transactions & Auto-Calcs                                │
        │                                                            │
        ├─ BEGIN / COMMIT / ROLLBACK                                │
        ├─ generate_po_number()                                     │
        ├─ set_po_number() - Trigger                               │
        ├─ recalculate_po_totals() - Function                      │
        ├─ trigger_po_items_change() - Trigger                     │
        ├─ set_po_item_barcode() - Trigger                         │
        └─ generate_po_item_barcode() - Function                   │
                                                                    │
```

## Data Flow - Creating a Purchase Order

```
User Action: Click "Low Stock"
        │
        ▼
GET /api/admin/low-stock-by-supplier
        │
        ├─ Query suppliers table
        ├─ LEFT JOIN products WHERE stock_quantity ≤ low_stock_threshold
        ├─ Aggregate products by supplier
        └─ Return JSON with grouped data
        │
        ▼
Frontend renders Low Stock Modal
        │
        ├─ Supplier 1: Green Valley Farms
        │  ├─ Organic Apples (Stock: 5, Threshold: 10, Reorder: 30)
        │  ├─ Organic Carrots (Stock: 3, Threshold: 10, Reorder: 30)
        │  └─ [Create PO Button]
        │
        ├─ Supplier 2: Fresh Produce Co
        │  ├─ Tomatoes (Stock: 2, Threshold: 10, Reorder: 30)
        │  └─ [Create PO Button]
        │
        └─ Supplier 3: ...
        │
User Action: Click "Create PO" for Supplier 1
        │
        ▼
POST /api/admin/purchase-orders
  {
    supplier_id: 1,
    items: [
      { product_id: 3, quantity: 30, unit_price: 2.50 },
      { product_id: 4, quantity: 30, unit_price: 1.80 }
    ]
  }
        │
        ▼
Backend Processing:
        ├─ BEGIN TRANSACTION
        ├─ INSERT into purchase_orders
        │  └─ Trigger: set_po_number() → PO2026-00001
        │
        ├─ INSERT into purchase_order_items (for each item)
        │  └─ Trigger: set_po_item_barcode() → POI1-0001, POI1-0002
        │
        ├─ SELECT recalculate_po_totals(po_id)
        │  ├─ Calculate subtotal: (30×2.50) + (30×1.80) = 129.00
        │  ├─ Calculate tax: 129.00 × 0.05 = 6.45
        │  ├─ Calculate total: 129.00 + 6.45 + 0 = 135.45
        │  └─ UPDATE purchase_orders SET subtotal, tax_amount, total_amount
        │
        ├─ COMMIT TRANSACTION
        └─ Return: { po_number: 'PO2026-00001', items: [...], total: 135.45 }
        │
        ▼
Frontend:
        ├─ Close modal
        ├─ Show success toast: "PO PO2026-00001 created"
        └─ Refresh PO list
```

## Data Flow - Receiving Items

```
User opens PO detail
        │
        ▼
Delivery arrives with items
        │
User scans barcode or manually enters quantity
        │
Click "Receive Items"
        │
        ▼
POST /api/admin/purchase-orders/:id/receive-items
  {
    items: [
      { item_id: 1, received_quantity: 30 },
      { item_id: 2, received_quantity: 30 }
    ]
  }
        │
        ▼
Backend Processing:
        ├─ BEGIN TRANSACTION
        │
        ├─ For each item:
        │  ├─ UPDATE purchase_order_items
        │  │  └─ SET received_quantity = 30
        │  │
        │  ├─ SELECT product_id
        │  │
        │  └─ UPDATE products
        │     └─ SET stock_quantity = stock_quantity + 30
        │
        ├─ COMMIT TRANSACTION
        │
        └─ Return updated PO with receipt status
        │
        ▼
Frontend:
        ├─ Update received counts (30/30 ✓)
        ├─ Show toast: "Items received successfully"
        └─ Refresh PO detail
        │
        ▼
Inventory Updated Automatically ✓
        │
Product stock updated in real-time
```

## Component Hierarchy

```
AdminLayout
  ├─ Sidebar Navigation
  │  └─ "Purchase Orders" → /admin/purchase-orders
  │
  └─ Outlet (Page Content)
     │
     └─ PurchaseOrdersPage
        │
        ├─ Page Header
        │  ├─ "Low Stock" Button
        │  └─ "New PO" Button
        │
        ├─ Statistics Cards
        │  ├─ Total POs
        │  ├─ Pending
        │  ├─ In Transit
        │  └─ Total Value
        │
        ├─ Filters
        │  ├─ Search box
        │  └─ Status dropdown
        │
        ├─ PO Table
        │  ├─ PO Number
        │  ├─ Supplier
        │  ├─ Items (received/total)
        │  ├─ Total
        │  ├─ Status badge
        │  ├─ Payment icon
        │  ├─ Delivery date
        │  └─ Actions (View)
        │
        ├─ Low Stock Modal (Dialog)
        │  └─ For each supplier:
        │     ├─ Supplier info
        │     ├─ Products list
        │     └─ "Create PO" button
        │
        └─ PO Detail Modal (Dialog)
           ├─ PO info
           ├─ Status & Payment
           ├─ Items table
           ├─ Totals breakdown
           └─ Actions
```

## Key Auto-Calculations

```
Line Total = Quantity × Unit Price
   ↓
Subtotal = SUM(All Line Totals)
   ↓
Tax = Subtotal × 0.05 (5%)
   ↓
Total = Subtotal + Tax + Shipping
   ↓
Balance Due = Total (when unpaid)
           = 0 (when paid)
           = Partial Amount (when partial)

Reorder Quantity = MIN(MAX(Low Stock × 3, 25), 100)
   ↓
Expected Delivery = Today + Supplier Lead Time Days
```

## Security & Validation Flow

```
User Request
   ↓
Check Authentication (JWT Token)
   ↓
Check Authorization (Admin Role)
   ↓
Validate Input (Schema)
   ├─ Quantity > 0
   ├─ Unit Price > 0
   ├─ Supplier ID exists
   ├─ Product ID exists
   └─ ...
   ↓
Execute Transaction (All or Nothing)
   ├─ Foreign Key Constraints
   ├─ Not-Null Constraints
   ├─ Check Constraints
   └─ Triggers (Auto-calcs)
   ↓
Success Response / Error Response
```

## Status Flow Diagram

```
┌─────────┐
│  DRAFT  │  ← Initial status
└────┬────┘
     │
     ▼
┌────────────┐     Can edit, add items
│  PENDING   │  ← Sent to supplier
└────┬───────┘
     │
     ▼
┌────────────┐     Waiting for delivery
│ CONFIRMED  │  ← Supplier confirmed
└────┬───────┘
     │
     ▼
┌────────────┐     Items in transit
│  SHIPPED   │  ← Supplier shipped
└────┬───────┘
     │
     ▼
┌────────────┐     Received items
│ DELIVERED  │  ← Complete, closed
└────────────┘

     Any Status
        │
        ▼
    ┌──────────┐
    │CANCELLED │ ← Order cancelled
    └──────────┘
```

## Payment Status Flow

```
┌────────┐
│ UNPAID │  ← No payment
└───┬────┘
    │
    ▼
┌────────────┐
│  PARTIAL   │  ← Some payment received
└───┬────────┘
    │
    ▼
┌──────┐
│ PAID │  ← Fully paid
└──────┘
```

## System Features Overview

```
                    SUPPLIER & PO SYSTEM
                          │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
   ┌────▼─────┐      ┌─────▼──────┐      ┌────▼──────┐
   │ Supplier  │      │  Purchase  │      │ Inventory │
   │ Management│      │   Order    │      │ Integration│
   └────┬─────┘      │   Management      └────┬──────┘
        │            └─────┬──────┘           │
        │                  │                   │
        ├─ Add supplier    ├─ Create PO      └─ Auto stock update
        ├─ Ratings        ├─ Status tracking  ├─ Low stock alerts
        ├─ Payment terms  ├─ Payment tracking ├─ Reorder quantity
        ├─ Lead times     ├─ Barcodes        └─ Threshold config
        ├─ Contact info   └─ Item receipt
        └─ Active/Inactive
```

## Technology Stack

```
Frontend:
  ├─ React 18+
  ├─ TypeScript
  ├─ Framer Motion (animations)
  ├─ Shadcn/ui (components)
  └─ React Router (navigation)

Backend:
  ├─ Express.js
  ├─ TypeScript (tsx watch)
  ├─ PostgreSQL Driver
  └─ CORS enabled

Database:
  ├─ PostgreSQL 13+
  ├─ pl/pgsql (triggers & functions)
  ├─ Foreign keys (referential integrity)
  ├─ Transactions (ACID compliance)
  └─ Views (pre-calculated data)
```

This architecture ensures **reliable, scalable, and maintainable** supplier and purchase order management! 🎉
