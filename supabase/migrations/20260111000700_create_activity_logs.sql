-- Create activity_logs table
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  type VARCHAR(50) NOT NULL,
  action VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  user_name VARCHAR(255),
  user_email VARCHAR(255),
  ip_address VARCHAR(45),
  details TEXT,
  severity VARCHAR(20) DEFAULT 'info',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_type ON activity_logs(type);
CREATE INDEX idx_activity_logs_severity ON activity_logs(severity);
CREATE INDEX idx_activity_logs_user_id ON activity_logs(user_id);

-- Insert some sample activities based on existing data
INSERT INTO activity_logs (type, action, description, user_name, user_email, severity, created_at)
SELECT 
  'order' as type,
  'Order Created' as action,
  'Order #' || order_number || ' placed for $' || total::text as description,
  COALESCE(u.full_name, u.email) as user_name,
  u.email as user_email,
  'success' as severity,
  o.created_at
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
ORDER BY o.created_at DESC
LIMIT 20;

-- Insert user registration activities
INSERT INTO activity_logs (type, action, description, user_id, user_name, user_email, severity, created_at)
SELECT 
  'user' as type,
  'User Registered' as action,
  'New user account created' as description,
  id as user_id,
  COALESCE(full_name, email) as user_name,
  email as user_email,
  'info' as severity,
  created_at
FROM users
ORDER BY created_at DESC
LIMIT 10;

-- Insert product update activities for recent product changes
INSERT INTO activity_logs (type, action, description, user_name, user_email, severity, created_at)
SELECT 
  'product' as type,
  'Product Updated' as action,
  'Product "' || name || '" updated' as description,
  'Admin' as user_name,
  'admin@jaanconnect.com' as user_email,
  'info' as severity,
  updated_at
FROM products
WHERE updated_at > created_at
ORDER BY updated_at DESC
LIMIT 10;

-- Insert invoice activities
INSERT INTO activity_logs (type, action, description, user_name, user_email, severity, created_at)
SELECT 
  'admin' as type,
  CASE 
    WHEN status = 'paid' THEN 'Invoice Paid'
    WHEN status = 'draft' THEN 'Invoice Created'
    ELSE 'Invoice Updated'
  END as action,
  'Invoice ' || invoice_number || ' for $' || total::text as description,
  customer_name as user_name,
  customer_email as user_email,
  CASE 
    WHEN status = 'paid' THEN 'success'
    WHEN status = 'overdue' THEN 'warning'
    ELSE 'info'
  END as severity,
  created_at
FROM invoices
ORDER BY created_at DESC
LIMIT 10;
