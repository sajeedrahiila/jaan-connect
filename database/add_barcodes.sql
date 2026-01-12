-- Add barcode columns to orders and invoices tables

-- Add barcode to orders table
ALTER TABLE orders ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_orders_barcode ON orders(barcode) WHERE barcode IS NOT NULL;

-- Add barcode to invoices table
ALTER TABLE invoices ADD COLUMN IF NOT EXISTS barcode TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_invoices_barcode ON invoices(barcode) WHERE barcode IS NOT NULL;

-- Function to generate order barcode (CODE128 format)
-- Format: ORD + order_number digits only
CREATE OR REPLACE FUNCTION generate_order_barcode(order_num TEXT)
RETURNS TEXT AS $$
DECLARE
  numeric_part TEXT;
BEGIN
  -- Extract numeric part from order number (e.g., "ORD-00003" -> "00003")
  numeric_part := regexp_replace(order_num, '[^0-9]', '', 'g');
  -- Return barcode in format: ORD + numeric part
  RETURN 'ORD' || LPAD(numeric_part, 8, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate invoice barcode (CODE128 format)
-- Format: INV + year + invoice number digits
CREATE OR REPLACE FUNCTION generate_invoice_barcode(invoice_num TEXT)
RETURNS TEXT AS $$
DECLARE
  numeric_part TEXT;
  year_part TEXT;
BEGIN
  -- Extract year and numeric part from invoice number (e.g., "INV-2026-00003" -> "2026" + "00003")
  year_part := substring(invoice_num from '\d{4}');
  numeric_part := substring(invoice_num from '\d+$');
  -- Return barcode in format: INV + year + number
  RETURN 'INV' || year_part || LPAD(numeric_part, 5, '0');
END;
$$ LANGUAGE plpgsql;

-- Update existing orders with barcodes
UPDATE orders 
SET barcode = generate_order_barcode(order_number)
WHERE barcode IS NULL;

-- Update existing invoices with barcodes
UPDATE invoices 
SET barcode = generate_invoice_barcode(invoice_number)
WHERE barcode IS NULL;

-- Trigger to auto-generate barcode when order is created
CREATE OR REPLACE FUNCTION auto_generate_order_barcode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.barcode IS NULL AND NEW.order_number IS NOT NULL THEN
    NEW.barcode := generate_order_barcode(NEW.order_number);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_order_barcode ON orders;
CREATE TRIGGER trigger_auto_generate_order_barcode
  BEFORE INSERT OR UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_order_barcode();

-- Trigger to auto-generate barcode when invoice is created
CREATE OR REPLACE FUNCTION auto_generate_invoice_barcode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.barcode IS NULL AND NEW.invoice_number IS NOT NULL THEN
    NEW.barcode := generate_invoice_barcode(NEW.invoice_number);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_generate_invoice_barcode ON invoices;
CREATE TRIGGER trigger_auto_generate_invoice_barcode
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION auto_generate_invoice_barcode();
