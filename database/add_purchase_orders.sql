-- Purchase Order System
-- Tracks orders placed with suppliers for restocking

-- Create purchase orders table
CREATE TABLE IF NOT EXISTS purchase_orders (
  id SERIAL PRIMARY KEY,
  po_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_id INTEGER NOT NULL REFERENCES suppliers(id) ON DELETE RESTRICT,
  order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_delivery_date DATE,
  actual_delivery_date DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_status VARCHAR(50) NOT NULL DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'partial', 'paid')),
  subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  shipping_cost DECIMAL(12, 2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_orders_supplier ON purchase_orders(supplier_id);
CREATE INDEX idx_purchase_orders_status ON purchase_orders(status);
CREATE INDEX idx_purchase_orders_date ON purchase_orders(order_date DESC);

-- Create purchase order items table
CREATE TABLE IF NOT EXISTS purchase_order_items (
  id SERIAL PRIMARY KEY,
  purchase_order_id INTEGER NOT NULL REFERENCES purchase_orders(id) ON DELETE CASCADE,
  product_id INTEGER NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(12, 2) NOT NULL CHECK (unit_price > 0),
  line_total DECIMAL(12, 2) NOT NULL GENERATED ALWAYS AS (quantity * unit_price) STORED,
  received_quantity INTEGER DEFAULT 0 CHECK (received_quantity >= 0),
  barcode VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_purchase_order_items_po ON purchase_order_items(purchase_order_id);
CREATE INDEX idx_purchase_order_items_product ON purchase_order_items(product_id);

-- Function to generate PO number
CREATE OR REPLACE FUNCTION generate_po_number()
RETURNS VARCHAR(50) AS $$
DECLARE
  po_num VARCHAR(50);
BEGIN
  po_num := 'PO' || TO_CHAR(NOW(), 'YYYY') || '-' || LPAD((SELECT COUNT(*) + 1 FROM purchase_orders)::TEXT, 5, '0');
  RETURN po_num;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate PO number
CREATE OR REPLACE FUNCTION set_po_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.po_number IS NULL THEN
    NEW.po_number := generate_po_number();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_po_number ON purchase_orders;
CREATE TRIGGER trigger_set_po_number
BEFORE INSERT ON purchase_orders
FOR EACH ROW
EXECUTE FUNCTION set_po_number();

-- Function to recalculate PO totals
CREATE OR REPLACE FUNCTION recalculate_po_totals(po_id INTEGER)
RETURNS VOID AS $$
DECLARE
  calc_subtotal DECIMAL(12, 2);
BEGIN
  SELECT COALESCE(SUM(line_total), 0) INTO calc_subtotal
  FROM purchase_order_items
  WHERE purchase_order_id = po_id;
  
  UPDATE purchase_orders
  SET 
    subtotal = calc_subtotal,
    tax_amount = ROUND(calc_subtotal * 0.05, 2),
    total_amount = ROUND(calc_subtotal + (calc_subtotal * 0.05) + COALESCE(shipping_cost, 0), 2),
    updated_at = NOW()
  WHERE id = po_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate when items change
CREATE OR REPLACE FUNCTION trigger_recalculate_po()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'DELETE' THEN
    PERFORM recalculate_po_totals(OLD.purchase_order_id);
  ELSE
    PERFORM recalculate_po_totals(NEW.purchase_order_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_po_items_change ON purchase_order_items;
CREATE TRIGGER trigger_po_items_change
AFTER INSERT OR UPDATE OR DELETE ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION trigger_recalculate_po();

-- Function to generate barcodes for purchase order items
CREATE OR REPLACE FUNCTION generate_po_item_barcode(po_id INTEGER, item_id INTEGER)
RETURNS VARCHAR(255) AS $$
DECLARE
  barcode_val VARCHAR(255);
  po_num VARCHAR(50);
  prod_id INTEGER;
BEGIN
  SELECT po_number, product_id INTO po_num, prod_id
  FROM purchase_orders po
  JOIN purchase_order_items poi ON po.id = poi.purchase_order_id
  WHERE po.id = po_id AND poi.id = item_id;
  
  barcode_val := 'POI' || po_num || '-' || LPAD(item_id::TEXT, 4, '0');
  
  UPDATE purchase_order_items
  SET barcode = barcode_val
  WHERE id = item_id;
  
  RETURN barcode_val;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate barcode for PO items
CREATE OR REPLACE FUNCTION set_po_item_barcode()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.barcode IS NULL THEN
    NEW.barcode := 'POI' || NEW.purchase_order_id || '-' || LPAD(NEW.id::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_po_item_barcode ON purchase_order_items;
CREATE TRIGGER trigger_set_po_item_barcode
BEFORE INSERT ON purchase_order_items
FOR EACH ROW
EXECUTE FUNCTION set_po_item_barcode();

-- View for low stock products grouped by supplier
CREATE OR REPLACE VIEW low_stock_by_supplier AS
SELECT 
  s.id,
  s.name as supplier_name,
  s.contact_person,
  s.email,
  s.phone,
  s.payment_terms,
  s.default_lead_time_days,
  COUNT(p.id) as product_count,
  ARRAY_AGG(JSON_BUILD_OBJECT(
    'product_id', p.id,
    'product_name', p.name,
    'sku', p.sku,
    'current_stock', p.stock_quantity,
    'low_stock_threshold', p.low_stock_threshold,
    'reorder_quantity', LEAST(GREATEST(p.low_stock_threshold * 3, 10), 100),
    'unit_cost', COALESCE(p.cost_price, p.price),
    'barcode', p.barcode
  )) as products
FROM suppliers s
LEFT JOIN products p ON s.id = p.supplier_id
WHERE p.stock_quantity <= COALESCE(p.low_stock_threshold, 10) 
  AND s.is_active = true
GROUP BY s.id, s.name, s.contact_person, s.email, s.phone, s.payment_terms, s.default_lead_time_days
ORDER BY s.name;

COMMIT;
