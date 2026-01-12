#!/bin/bash

# Database configuration
DB_NAME="jaan_connect"
DB_USER="jaan_admin"
DB_PASSWORD="jaan_password_2026"
DB_PORT="5432"

echo "🗄️  Setting up local PostgreSQL database for Jaan Connect..."

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL service:"
    echo "   sudo systemctl start postgresql"
    exit 1
fi

# Create database user if it doesn't exist
echo "📝 Creating database user..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_user WHERE usename = '$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';"

# Create database if it doesn't exist
echo "📝 Creating database..."
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Grant privileges
echo "🔐 Granting privileges..."
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "✅ Database setup complete!"
echo ""
echo "Database Details:"
echo "  Name: $DB_NAME"
echo "  User: $DB_USER"
echo "  Password: $DB_PASSWORD"
echo "  Port: $DB_PORT"
echo "  Connection String: postgresql://$DB_USER:$DB_PASSWORD@localhost:$DB_PORT/$DB_NAME"
echo ""
echo "Next steps:"
echo "  1. Run the migration script: psql -U $DB_USER -d $DB_NAME -f database/migration.sql"
echo "  2. Update your .env file with the database connection string"
