-- Add enhanced supplier fields for grocery wholesale management
-- This migration adds comprehensive fields for supplier profiling

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS supplier_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_primary BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_backup BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS min_order_amount NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS order_days VARCHAR(255),
ADD COLUMN IF NOT EXISTS cutoff_time TIME,
ADD COLUMN IF NOT EXISTS delivery_days VARCHAR(255),
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS requires_1099 BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS accepts_returns BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS credit_days INTEGER DEFAULT 30,
ADD COLUMN IF NOT EXISTS restocking_fee_percent NUMERIC(5, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_method VARCHAR(100),
ADD COLUMN IF NOT EXISTS preferred_contact_time VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_cost NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS previous_cost NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS on_time_delivery_percent NUMERIC(5, 2),
ADD COLUMN IF NOT EXISTS avg_delivery_delay_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS order_fulfillment_percent NUMERIC(5, 2) DEFAULT 100;

-- Create view for supplier metrics
CREATE OR REPLACE VIEW supplier_metrics AS
SELECT 
  s.id,
  s.name,
  COUNT(DISTINCT p.id) as linked_products_count,
  COALESCE(AVG(p.cost_price), 0) as avg_supplier_cost,
  COALESCE((AVG(p.price) - AVG(p.cost_price)) / NULLIF(AVG(p.price), 0) * 100, 0) as avg_margin_percent,
  s.on_time_delivery_percent,
  s.avg_delivery_delay_days,
  s.order_fulfillment_percent,
  s.rating
FROM suppliers s
LEFT JOIN products p ON p.supplier_id = s.id
GROUP BY s.id, s.name, s.on_time_delivery_percent, s.avg_delivery_delay_days, 
         s.order_fulfillment_percent, s.rating;

-- Add comment to document supplier types
COMMENT ON COLUMN suppliers.supplier_type IS 'Type: wholesale_distributor, local_vendor, brand_manufacturer, farm_producer, cash_and_carry';
COMMENT ON COLUMN suppliers.order_method IS 'Order method: email, phone, portal, fax';
