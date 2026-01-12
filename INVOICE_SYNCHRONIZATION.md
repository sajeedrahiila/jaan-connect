# Invoice Editing Synchronization

## Overview
When an admin edits an invoice (amounts, prices, items, etc.), the changes are synchronized across all relevant views and calculations throughout the application.

## Components Involved

### 1. Database Layer
- **Tables**: `invoices`, `invoice_items`, `orders`, `order_items`
- **Calculations**: All totals (subtotal, tax, shipping, total, balance_due) are recalculated on update
- **Status**: Invoice status and payment status tracked independently

### 2. Backend API Endpoints

#### PUT /api/admin/invoices/:id
**Purpose**: Update invoice details and items
**Request Body**:
```json
{
  "customer_name": "string",
  "customer_email": "string",
  "billing_address": "string",
  "status": "pending|paid|overdue|cancelled",
  "payment_status": "pending|paid|partial|failed",
  "payment_method": "string",
  "notes": "string",
  "items": [
    {
      "product_id": "number",
      "product_name": "string",
      "quantity": "number",
      "unit_price": "number"
    }
  ]
}
```

**Process**:
1. Deletes all existing invoice_items
2. Inserts new invoice_items from request
3. Calculates subtotal from items
4. Gets tax_rate and shipping from settings table
5. Calculates tax_amount and total_amount
6. Updates invoice with all new values
7. Recalculates balance_due based on payment_status

**Response**: Updated invoice object with all recalculated fields

#### GET /api/admin/stats
**Purpose**: Dashboard statistics including invoice metrics
**Returns**:
```json
{
  "totalUsers": "number",
  "totalProducts": "number",
  "totalOrders": "number",
  "revenue": "number (from orders)",
  "pendingOrders": "number",
  "totalInvoices": "number",
  "invoiceRevenue": "number (sum of all invoice totals)",
  "receivables": "number (sum of balance_due)",
  "paidAmount": "number (sum of paid invoices)",
  "overdueInvoices": "number (count of overdue)"
}
```

#### GET /api/user/invoices
**Purpose**: Customer's invoice list for their account
**Auth**: Requires user authentication
**Returns**: All invoices for logged-in user

### 3. Frontend Components

#### InvoiceEditDialog.tsx
**Location**: `src/components/admin/InvoiceEditDialog.tsx`
**Features**:
- Edit customer information (name, email, billing address)
- Modify invoice items (add/remove/edit quantities and prices)
- Update financial details (payment status, payment method)
- Auto-calculation of subtotal, tax, shipping, and total
- Status management (pending, paid, overdue, cancelled)
- Notes section for additional information

**Auto-Calculations**:
- Subtotal = Sum of (quantity × unit_price) for all items
- Tax = Subtotal × tax_rate (from settings)
- Shipping = default_shipping_fee (from settings, free if subtotal > free_shipping_threshold)
- Total = Subtotal + Tax + Shipping
- Balance Due = Calculated based on payment_status (paid = 0, else = total)

#### InvoicesPage.tsx
**Location**: `src/pages/admin/InvoicesPage.tsx`
**Features**:
- Lists all invoices with filtering
- Edit button opens InvoiceEditDialog
- Refresh on edit completion
- Real-time updates after edits

#### Dashboard.tsx
**Location**: `src/pages/admin/Dashboard.tsx`
**Features**:
- Primary stats cards: Revenue, Receivables, Total Invoices, Pending Orders
- Invoice metrics section: Invoice Revenue, Paid Amount, Overdue Invoices
- Auto-refresh capability
- All stats pulled from enhanced /api/admin/stats endpoint

#### Account.tsx
**Location**: `src/pages/Account.tsx`
**Features**:
- Customer view of their invoices
- Displays invoice status, amounts, due dates
- View invoice details
- Automatically reflects admin edits on refresh

## Synchronization Flow

When an admin edits an invoice:

```
1. Admin opens InvoiceEditDialog from InvoicesPage
   ↓
2. Makes changes to invoice items, amounts, or status
   ↓
3. Clicks "Save Changes"
   ↓
4. PUT /api/admin/invoices/:id called with updated data
   ↓
5. Backend:
   - Deletes old invoice_items
   - Inserts new invoice_items
   - Recalculates all financial fields
   - Updates invoice record
   ↓
6. Frontend receives updated invoice
   ↓
7. InvoicesPage refreshes invoice list
   ↓
8. Dashboard stats automatically update on next fetch
   ↓
9. Customer's Account page shows updated invoice on next load
```

## Data Consistency

### Database Level
- All calculations use DECIMAL(10,2) for financial accuracy
- Foreign key constraints maintain referential integrity
- Triggers ensure barcodes are generated automatically

### API Level
- All updates are transactional (BEGIN/COMMIT)
- Error handling rolls back on failure
- Consistent calculation formulas across all endpoints

### Frontend Level
- React Query cache invalidation on edits
- Optimistic updates where appropriate
- Real-time recalculation in edit dialog

## Testing Synchronization

To verify synchronization works correctly:

1. **Login as Admin**: Navigate to http://localhost:8082/auth
2. **Go to Invoices**: Click "Invoices" in admin menu
3. **Edit an Invoice**: 
   - Click "Edit" on any invoice
   - Change the quantity or price of an item
   - Note the auto-calculated totals
   - Click "Save Changes"
4. **Verify Dashboard**: 
   - Go to Dashboard
   - Check that "Accounts Receivable" reflects the new balance
   - Verify "Invoice Revenue" shows updated total
5. **Check Customer View**:
   - Logout and login as the customer
   - Go to "My Account"
   - Verify the invoice shows updated amounts
6. **Verify Invoice List**:
   - Login as admin again
   - Check Invoices page shows updated data
   - Status changes should be reflected

## Settings Integration

Invoice calculations depend on system settings:

- **tax_rate**: Applied to subtotal (default: 8% = 0.08)
- **default_shipping_fee**: Added to total (default: $10.00)
- **free_shipping_threshold**: No shipping if subtotal exceeds this (default: $100.00)

Admins can modify these in Settings page, affecting all future invoice calculations.

## Error Handling

- **Missing Items**: Returns 400 if no items provided
- **Invalid Product IDs**: Validates product existence
- **Database Errors**: Returns 500 with error message
- **Authentication**: Requires admin privileges for all edit operations
- **Authorization**: Users can only view their own invoices

## Future Enhancements

- Real-time WebSocket updates for instant synchronization
- Invoice version history/audit log
- Batch invoice editing
- Automated payment reconciliation
- Email notifications on invoice changes
