-- Grocery Store Enhancements Migration
-- Adds inventory control, tax management, variants, expiry tracking, cost/margin, and supplier info

-- 1. Add new columns to products table for enhanced grocery features
ALTER TABLE products
  -- Inventory Control
  ADD COLUMN IF NOT EXISTS on_hand_quantity INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS low_stock_threshold INTEGER DEFAULT 10,
  ADD COLUMN IF NOT EXISTS allow_negative_stock BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_adjustment_reason VARCHAR(100),
  
  -- Tax Controls (US-specific)
  ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS tax_category VARCHAR(50) DEFAULT 'grocery',
  
  -- Barcode (change to UPC-A for US)
  ADD COLUMN IF NOT EXISTS upc_code VARCHAR(12),
  
  -- Unit Pricing
  ADD COLUMN IF NOT EXISTS price_per_unit NUMERIC(10, 4),
  ADD COLUMN IF NOT EXISTS display_unit VARCHAR(20),
  
  -- Expiry & Batch
  ADD COLUMN IF NOT EXISTS expiry_date DATE,
  ADD COLUMN IF NOT EXISTS batch_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS lot_number VARCHAR(50),
  ADD COLUMN IF NOT EXISTS expiry_alert_days INTEGER DEFAULT 7,
  
  -- Cost & Margin (admin-only)
  ADD COLUMN IF NOT EXISTS cost_price NUMERIC(10, 2),
  ADD COLUMN IF NOT EXISTS margin_percentage NUMERIC(5, 2),
  
  -- Supplier Info
  ADD COLUMN IF NOT EXISTS supplier_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS supplier_id INTEGER,
  ADD COLUMN IF NOT EXISTS case_size INTEGER,
  ADD COLUMN IF NOT EXISTS lead_time_days INTEGER,
  
  -- Variants support
  ADD COLUMN IF NOT EXISTS has_variants BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS parent_product_id INTEGER REFERENCES products(id) ON DELETE CASCADE;

-- 2. Create product_variants table for size/flavor variations
CREATE TABLE IF NOT EXISTS product_variants (
  id SERIAL PRIMARY KEY,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  variant_name VARCHAR(255) NOT NULL,
  variant_type VARCHAR(50) NOT NULL, -- 'size', 'flavor', 'color', etc.
  
  -- Each variant has its own inventory
  sku VARCHAR(100) UNIQUE,
  upc_code VARCHAR(12),
  price NUMERIC(10, 2) NOT NULL,
  compare_price NUMERIC(10, 2),
  cost_price NUMERIC(10, 2),
  
  on_hand_quantity INTEGER DEFAULT 0,
  low_stock_threshold INTEGER DEFAULT 10,
  weight NUMERIC(10, 3),
  weight_unit VARCHAR(20) DEFAULT 'kg',
  
  -- Variant-specific details
  attributes JSONB, -- e.g., {"size": "5 lb", "color": "red"}
  
  is_active BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create inventory_adjustments table for tracking stock changes
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  variant_id INTEGER REFERENCES product_variants(id) ON DELETE CASCADE,
  
  adjustment_type VARCHAR(50) NOT NULL, -- 'restock', 'spoilage', 'damage', 'theft', 'correction', 'sale', 'return'
  quantity_change INTEGER NOT NULL, -- positive for increase, negative for decrease
  quantity_before INTEGER NOT NULL,
  quantity_after INTEGER NOT NULL,
  
  reason TEXT,
  notes TEXT,
  
  adjusted_by_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  adjusted_by_name VARCHAR(255),
  
  reference_order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  
  payment_terms VARCHAR(100), -- e.g., "Net 30", "COD"
  default_lead_time_days INTEGER DEFAULT 7,
  
  is_active BOOLEAN DEFAULT true,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_products_on_hand_quantity ON products(on_hand_quantity);
CREATE INDEX IF NOT EXISTS idx_products_low_stock ON products(on_hand_quantity) WHERE on_hand_quantity <= low_stock_threshold;
CREATE INDEX IF NOT EXISTS idx_products_expiry_date ON products(expiry_date);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_parent_id ON products(parent_product_id);
CREATE INDEX IF NOT EXISTS idx_products_tax_category ON products(tax_category);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_upc ON product_variants(upc_code);

CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_product_id ON inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_variant_id ON inventory_adjustments(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_adjustments_created_at ON inventory_adjustments(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_suppliers_name ON suppliers(name);

-- 6. Add triggers to auto-update margin percentage
CREATE OR REPLACE FUNCTION calculate_margin()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cost_price IS NOT NULL AND NEW.cost_price > 0 AND NEW.price IS NOT NULL THEN
    NEW.margin_percentage := ((NEW.price - NEW.cost_price) / NEW.price) * 100;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_calculate_margin
  BEFORE INSERT OR UPDATE OF price, cost_price ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_margin();

CREATE TRIGGER variants_calculate_margin
  BEFORE INSERT OR UPDATE OF price, cost_price ON product_variants
  FOR EACH ROW
  EXECUTE FUNCTION calculate_margin();

-- 7. Add trigger to auto-update price_per_unit
CREATE OR REPLACE FUNCTION calculate_price_per_unit()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.weight IS NOT NULL AND NEW.weight > 0 AND NEW.price IS NOT NULL THEN
    -- Convert to ounces if in kg/g, keep as-is if already in oz/lb
    IF NEW.unit = 'kg' THEN
      NEW.price_per_unit := NEW.price / (NEW.weight * 35.274); -- kg to oz
      NEW.display_unit := 'oz';
    ELSIF NEW.unit = 'g' THEN
      NEW.price_per_unit := NEW.price / (NEW.weight * 0.035274); -- g to oz
      NEW.display_unit := 'oz';
    ELSIF NEW.unit = 'lb' THEN
      NEW.price_per_unit := NEW.price / (NEW.weight * 16); -- lb to oz
      NEW.display_unit := 'oz';
    ELSIF NEW.unit = 'oz' THEN
      NEW.price_per_unit := NEW.price / NEW.weight;
      NEW.display_unit := 'oz';
    ELSE
      NEW.price_per_unit := NEW.price / NEW.weight;
      NEW.display_unit := NEW.unit;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_calculate_price_per_unit
  BEFORE INSERT OR UPDATE OF price, weight, unit ON products
  FOR EACH ROW
  EXECUTE FUNCTION calculate_price_per_unit();

-- 8. Insert sample suppliers
INSERT INTO suppliers (name, contact_person, email, phone, payment_terms, default_lead_time_days, is_active, rating)
VALUES 
  ('Sysco Foods', 'John Smith', 'orders@sysco.com', '555-0100', 'Net 30', 3, true, 5),
  ('US Foods', 'Jane Doe', 'sales@usfoods.com', '555-0200', 'Net 30', 5, true, 4),
  ('Local Farm Co-op', 'Bob Wilson', 'contact@localfarm.com', '555-0300', 'COD', 1, true, 5)
ON CONFLICT DO NOTHING;

-- 9. Update existing products with default values
UPDATE products 
SET 
  on_hand_quantity = COALESCE(stock, 0),
  low_stock_threshold = 10,
  allow_negative_stock = false,
  is_taxable = false,
  tax_category = 'grocery',
  expiry_alert_days = 7
WHERE on_hand_quantity IS NULL;

COMMENT ON COLUMN products.tax_category IS 'US tax categories: grocery (exempt), prepared_food, beverage, alcohol';
COMMENT ON COLUMN products.upc_code IS 'UPC-A barcode (12 digits) - standard US grocery barcode';
COMMENT ON COLUMN products.price_per_unit IS 'Automatically calculated price per display unit (e.g., per oz)';
COMMENT ON COLUMN products.cost_price IS 'Admin-only: wholesale/cost price for margin calculation';
COMMENT ON COLUMN products.margin_percentage IS 'Auto-calculated: (price - cost) / price * 100';
