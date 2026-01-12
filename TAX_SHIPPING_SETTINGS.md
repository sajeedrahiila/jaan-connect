# Tax and Shipping Settings System

## Overview
The Jaan Connect system includes a flexible settings management system that allows administrators to configure tax rates and shipping fees. These settings are automatically applied to all orders and invoices.

## Database Schema

### Settings Table
```sql
CREATE TABLE settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);
```

### Financial Settings

| Key | Default Value | Description |
|-----|---------------|-------------|
| `tax_rate` | `0.08` | Default tax rate (0.08 = 8%) |
| `default_shipping_fee` | `10.00` | Default shipping fee in dollars |
| `free_shipping_threshold` | `100.00` | Order total for free shipping |
| `invoice_payment_terms_days` | `30` | Default payment terms in days |

## Database Functions

### `get_setting(setting_key TEXT)`
Retrieves a setting value by key.

```sql
SELECT get_setting('tax_rate');
-- Returns: '0.08'
```

## API Endpoints

### Public Settings (No Auth Required)
**GET** `/api/settings/public`

Returns publicly accessible settings for frontend calculations.

**Response:**
```json
{
  "success": true,
  "data": {
    "tax_rate": "0.08",
    "default_shipping_fee": "10.00",
    "free_shipping_threshold": "100.00"
  }
}
```

### Admin Settings Endpoints (Requires Admin Auth)

#### Get All Settings
**GET** `/api/admin/settings`

Returns all system settings.

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "key": "tax_rate",
      "value": "0.08",
      "description": "Default tax rate (0.08 = 8%)",
      "category": "financial",
      "updated_at": "2026-01-11T19:00:00Z",
      "updated_by": "user-uuid"
    }
  ]
}
```

#### Get Settings by Category
**GET** `/api/admin/settings/:category`

Returns settings for a specific category (e.g., `financial`).

#### Update Setting
**PUT** `/api/admin/settings/:key`

Updates a specific setting value.

**Request Body:**
```json
{
  "value": "0.10"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "key": "tax_rate",
    "value": "0.10",
    "description": "Default tax rate (0.08 = 8%)",
    "category": "financial",
    "updated_at": "2026-01-11T20:00:00Z",
    "updated_by": "user-uuid"
  }
}
```

## Invoice Calculations

### Automatic Calculation Flow

When an invoice is created from an order, the system:

1. **Retrieves Settings** from the database:
   - Tax rate
   - Default shipping fee
   - Free shipping threshold

2. **Calculates Subtotal**: Sum of all invoice items

3. **Calculates Tax**: 
   ```
   tax = subtotal × tax_rate
   ```

4. **Determines Shipping**:
   ```
   if (subtotal >= free_shipping_threshold) {
     shipping_fee = 0
   } else {
     shipping_fee = default_shipping_fee
   }
   ```

5. **Calculates Total**:
   ```
   total = subtotal + tax + shipping_fee
   ```

### Example Calculation

Given settings:
- Tax Rate: 8% (0.08)
- Default Shipping: $10.00
- Free Shipping Threshold: $100.00

**Scenario 1: Order under threshold**
- Subtotal: $69.00
- Tax: $69.00 × 0.08 = $5.52
- Shipping: $10.00 (not free)
- **Total: $84.52**

**Scenario 2: Order over threshold**
- Subtotal: $345.00
- Tax: $345.00 × 0.08 = $27.60
- Shipping: $0.00 (free shipping!)
- **Total: $372.60**

## Admin UI

### Settings Page Location
`/admin/settings`

### Financial Settings Section

The admin can configure:

1. **Tax Rate**
   - Input: Decimal value (0-1)
   - Display: Percentage format
   - Example: 0.08 displays as "8%"

2. **Default Shipping Fee**
   - Input: Dollar amount
   - Can be set to 0 for free shipping
   - Applied to orders under free shipping threshold

3. **Free Shipping Threshold**
   - Input: Dollar amount
   - Orders above this amount get free shipping
   - Set to a very high value to disable free shipping

### Usage Instructions

1. Navigate to Admin → Settings
2. Scroll to "Financial Settings" card
3. Update desired values
4. Click "Save Financial Settings"
5. Changes apply immediately to new orders/invoices

## Server-Side Implementation

### Invoice Creation from Order
```typescript
// Get settings from database
const taxRateRes = await query("SELECT value FROM settings WHERE key = 'tax_rate'");
const shippingFeeRes = await query("SELECT value FROM settings WHERE key = 'default_shipping_fee'");
const freeShippingRes = await query("SELECT value FROM settings WHERE key = 'free_shipping_threshold'");

const taxRate = parseFloat(taxRateRes.rows[0].value) || 0.08;
const defaultShipping = parseFloat(shippingFeeRes.rows[0].value) || 10.00;
const freeShippingThreshold = parseFloat(freeShippingRes.rows[0].value) || 100.00;

// Calculate values
const subtotal = Number(order.subtotal) || 0;
const calculatedTax = Math.round(subtotal * taxRate * 100) / 100;
const calculatedShipping = subtotal >= freeShippingThreshold ? 0 : defaultShipping;
const calculatedTotal = subtotal + calculatedTax + calculatedShipping;
```

## Frontend Implementation

### Fetching Public Settings
```typescript
const res = await fetch(`${API_URL}/api/settings/public`);
const { data } = await res.json();

const taxRate = parseFloat(data.tax_rate);
const shippingFee = parseFloat(data.default_shipping_fee);
const freeThreshold = parseFloat(data.free_shipping_threshold);
```

### Updating Settings (Admin)
```typescript
const updateSetting = async (key: string, value: string) => {
  const token = localStorage.getItem('session_token');
  const res = await fetch(`${API_URL}/api/admin/settings/${key}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    credentials: 'include',
    body: JSON.stringify({ value }),
  });
  return res.ok;
};
```

## Special Cases

### Waiving Shipping
Admin can manually set shipping to $0.00 when creating/editing an invoice:
- In the invoice creation form, shipping fee can be overridden
- Set to "0" or "0.00" for free shipping on that specific order

### Custom Tax Rates
While the system uses a single default tax rate:
- Admin can override tax when manually creating invoices
- Future enhancement: Support for multiple tax rates by region

### Fixed NaN Values
The system automatically fixed existing invoices with NaN values by:
1. Recalculating subtotal from invoice items
2. Applying current tax rate from settings
3. Using default shipping fee from settings
4. Updating total and balance due

## Migration

To add settings to an existing database:

```bash
PGPASSWORD='your_password' psql -h localhost -U jaan_admin -d jaan_connect -f database/add_settings.sql
```

This will:
- Create settings table
- Insert default financial settings
- Fix any invoices with NaN values
- Set up triggers and indexes

## Benefits

1. **Centralized Configuration**: All tax and shipping rules in one place
2. **No Code Changes**: Adjust rates without deploying new code
3. **Audit Trail**: Track who changed settings and when
4. **Automatic Application**: New orders/invoices use current settings
5. **Flexible Pricing**: Easy to run promotions (free shipping, tax holidays)
6. **Historical Accuracy**: Existing invoices retain original calculations
