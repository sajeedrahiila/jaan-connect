# Barcode System Documentation

## Overview
The Jaan Connect system now includes automatic barcode generation for both orders and invoices using CODE128 format barcodes.

## Database Schema

### Orders Table
- **Column**: `barcode` (TEXT, UNIQUE)
- **Format**: `ORD00000001` (11 characters)
- **Example**: For order `ORD-00003`, barcode is `ORD00000003`

### Invoices Table
- **Column**: `barcode` (TEXT, UNIQUE)
- **Format**: `INV202600003` (14 characters)
- **Example**: For invoice `INV-2026-00003`, barcode is `INV202600003`

## Database Functions

### `generate_order_barcode(order_num TEXT)`
Generates a barcode value from an order number.
```sql
SELECT generate_order_barcode('ORD-00003');
-- Returns: ORD00000003
```

### `generate_invoice_barcode(invoice_num TEXT)`
Generates a barcode value from an invoice number.
```sql
SELECT generate_invoice_barcode('INV-2026-00003');
-- Returns: INV202600003
```

## Database Triggers

### Orders
Automatically generates barcode when an order is created or updated:
- Trigger: `trigger_auto_generate_order_barcode`
- Function: `auto_generate_order_barcode()`

### Invoices
Automatically generates barcode when an invoice is created or updated:
- Trigger: `trigger_auto_generate_invoice_barcode`
- Function: `auto_generate_invoice_barcode()`

## Frontend Implementation

### Barcode Utility (`src/lib/barcode.ts`)

#### Functions:

1. **`generateOrderBarcodeValue(orderNumber: string): string`**
   - Generates barcode value from order number
   - Client-side utility for consistency with database

2. **`generateInvoiceBarcodeValue(invoiceNumber: string): string`**
   - Generates barcode value from invoice number
   - Client-side utility for consistency with database

3. **`generateBarcodeImage(value: string, options?): Promise<string>`**
   - Generates barcode as base64 image data URL
   - Uses jsbarcode library
   - Returns PNG image in base64 format

4. **`generateOrderBarcode(orderNumber: string, options?): Promise<string>`**
   - Complete function to generate order barcode image
   - Returns base64 image ready for display

5. **`generateInvoiceBarcode(invoiceNumber: string, options?): Promise<string>`**
   - Complete function to generate invoice barcode image
   - Returns base64 image ready for display

### Usage Examples:

```typescript
import { generateOrderBarcode, generateInvoiceBarcode } from '@/lib/barcode';

// Generate order barcode
const orderBarcodeImage = await generateOrderBarcode('ORD-00003', {
  width: 2,
  height: 60,
  displayValue: true,
  fontSize: 12,
});

// Generate invoice barcode
const invoiceBarcodeImage = await generateInvoiceBarcode('INV-2026-00003', {
  width: 2,
  height: 60,
  displayValue: true,
  fontSize: 12,
});

// Display in component
<img src={barcodeImage} alt="Barcode" />
```

## Components with Barcode Display

### InvoiceViewer (`src/components/admin/InvoiceViewer.tsx`)
- Displays barcode in the invoice header
- Shows both barcode image and barcode value
- Barcode is included in PDF exports and prints

### OrderDetailDialog (`src/components/admin/OrderDetailDialog.tsx`)
- Displays barcode in the order details header
- Shows barcode image next to status badge

## API Endpoints

All existing endpoints automatically return barcode data:

### Orders
- `GET /api/orders` - Returns all orders with barcodes
- `GET /api/orders/:id` - Returns order details with barcode
- `POST /api/orders` - Creates order (barcode auto-generated)

### Invoices
- `GET /api/admin/invoices` - Returns all invoices with barcodes
- `GET /api/admin/invoices/:id` - Returns invoice details with barcode
- `GET /api/user/invoices` - Returns user invoices with barcodes
- `POST /api/admin/invoices` - Creates invoice (barcode auto-generated)

## Migration

To add barcodes to an existing database:

```bash
cd /home/zulfiqar/sajeed/jaan-connect
PGPASSWORD='jaan_password_2026' psql -h localhost -U jaan_admin -d jaan_connect -f database/add_barcodes.sql
```

This will:
1. Add barcode columns to orders and invoices tables
2. Create barcode generation functions
3. Create triggers for automatic barcode generation
4. Backfill barcodes for existing records

## Barcode Specifications

- **Format**: CODE128 (industry standard)
- **Library**: jsbarcode v3.12.3
- **Image Format**: PNG (base64 encoded)
- **Default Dimensions**: 2px width, 50-60px height
- **Background**: White
- **Foreground**: Black
- **Display Value**: Configurable (default: true)

## Scanning Barcodes

Barcodes can be scanned using any CODE128-compatible barcode scanner. The scanned value will match the barcode column in the database:
- Order barcodes: `ORD00000001`, `ORD00000002`, etc.
- Invoice barcodes: `INV202600001`, `INV202600002`, etc.

## Future Enhancements

Potential additions:
- QR codes for mobile scanning
- Barcode scanning API endpoint for warehouse operations
- Barcode-based search functionality
- Track and trace system using barcodes
- Batch processing using barcode scanning
