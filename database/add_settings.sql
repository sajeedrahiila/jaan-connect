-- Create settings table for system configuration
CREATE TABLE IF NOT EXISTS settings (
  id SERIAL PRIMARY KEY,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'general',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES users(id)
);

-- Insert default settings
INSERT INTO settings (key, value, description, category) VALUES
  ('tax_rate', '0.08', 'Default tax rate (0.08 = 8%)', 'financial'),
  ('default_shipping_fee', '10.00', 'Default shipping fee in dollars', 'financial'),
  ('free_shipping_threshold', '100.00', 'Order total for free shipping', 'financial'),
  ('invoice_payment_terms_days', '30', 'Default payment terms in days', 'invoices')
ON CONFLICT (key) DO NOTHING;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);
CREATE INDEX IF NOT EXISTS idx_settings_category ON settings(category);

-- Function to get setting value
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT)
RETURNS TEXT AS $$
DECLARE
  setting_value TEXT;
BEGIN
  SELECT value INTO setting_value FROM settings WHERE key = setting_key;
  RETURN setting_value;
END;
$$ LANGUAGE plpgsql;

-- Trigger for settings timestamp updates
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;
CREATE TRIGGER update_settings_updated_at
  BEFORE UPDATE ON settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Fix existing invoices with NaN values by recalculating from invoice_items
DO $$
DECLARE
  inv RECORD;
  items_total NUMERIC(12,2);
  calculated_tax NUMERIC(12,2);
  calculated_shipping NUMERIC(12,2);
  calculated_total NUMERIC(12,2);
  tax_rate NUMERIC(5,4);
BEGIN
  -- Get current tax rate
  tax_rate := COALESCE(get_setting('tax_rate')::NUMERIC, 0.08);
  
  FOR inv IN SELECT id FROM invoices WHERE subtotal = 'NaN'::NUMERIC OR tax = 'NaN'::NUMERIC OR shipping_fee = 'NaN'::NUMERIC
  LOOP
    -- Calculate subtotal from invoice items
    SELECT COALESCE(SUM(total_price), 0) INTO items_total
    FROM invoice_items WHERE invoice_id = inv.id;
    
    -- Calculate tax
    calculated_tax := ROUND(items_total * tax_rate, 2);
    
    -- Set shipping (use default from settings)
    calculated_shipping := COALESCE(get_setting('default_shipping_fee')::NUMERIC, 10.00);
    
    -- Calculate total
    calculated_total := items_total + calculated_tax + calculated_shipping;
    
    -- Update invoice
    UPDATE invoices SET
      subtotal = items_total,
      tax = calculated_tax,
      shipping_fee = calculated_shipping,
      total = calculated_total,
      balance_due = calculated_total - COALESCE(amount_paid, 0)
    WHERE id = inv.id;
    
    RAISE NOTICE 'Fixed invoice %: subtotal=%, tax=%, shipping=%, total=%', 
      inv.id, items_total, calculated_tax, calculated_shipping, calculated_total;
  END LOOP;
END $$;
