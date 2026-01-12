#!/bin/bash
# Quick setup script for production deployment

set -e

echo "🚀 Jaan Connect - Production Setup Script"
echo "=========================================="

# Check Node.js version
node_version=$(node -v)
echo "✓ Node.js version: $node_version"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm not found. Please install Node.js first."
    exit 1
fi

# Check if PostgreSQL is running
echo ""
echo "Checking PostgreSQL connection..."
if command -v psql &> /dev/null; then
    if psql -h localhost -U jaan_admin -d jaan_connect -c "SELECT 1" &> /dev/null; then
        echo "✓ PostgreSQL is running"
    else
        echo "⚠️  PostgreSQL might not be running or credentials are incorrect"
        read -p "Continue anyway? (y/n) " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
else
    echo "⚠️  psql not found. Skipping database check."
fi

# Install dependencies
echo ""
echo "Installing dependencies..."
npm install
echo "✓ Dependencies installed"

# Install PM2 globally
echo ""
echo "Installing PM2..."
npm install -g pm2
echo "✓ PM2 installed"

# Install compression package if not already
if ! npm list compression > /dev/null 2>&1; then
    echo ""
    echo "Installing compression middleware..."
    npm install compression
    echo "✓ Compression installed"
fi

# Build for production
echo ""
echo "Building for production..."
npm run build
echo "✓ Build complete"

# Setup environment
echo ""
echo "Checking environment configuration..."
if [ ! -f .env.production ]; then
    echo "Creating .env.production template..."
    cat > .env.production << 'EOF'
NODE_ENV=production
PORT=3001
DATABASE_URL=postgresql://jaan_admin:jaan_password_2026@localhost:5432/jaan_connect
CORS_ORIGIN=http://localhost:8080
SESSION_SECRET=change-this-to-a-random-secret-key
EOF
    echo "✓ .env.production created (configure as needed)"
else
    echo "✓ .env.production already exists"
fi

# Create necessary directories
echo ""
echo "Setting up directories..."
mkdir -p logs uploads
echo "✓ Directories created"

# Show next steps
echo ""
echo "=========================================="
echo "✅ Setup Complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. Configure environment (if needed):"
echo "   nano .env.production"
echo ""
echo "2. Start the application:"
echo ""
echo "   Development:"
echo "   npm run server"
echo ""
echo "   Production (Cluster Mode - Recommended for 200+ users):"
echo "   pm2 start ecosystem.config.js --env production"
echo "   pm2 monit  # Monitor processes"
echo ""
echo "3. Run load tests (after server is running):"
echo "   bash load-test.sh"
echo ""
echo "4. Check logs:"
echo "   pm2 logs"
echo ""
echo "Performance Targets:"
echo "  • Concurrent Users: 200-500"
echo "  • Response Time: <200ms"
echo "  • Database Query Time: <50ms"
echo "  • Memory Usage: <1GB"
echo "  • CPU Usage: <70%"
echo ""
echo "Monitoring Commands:"
echo "  pm2 monit              # Real-time monitoring"
echo "  pm2 logs              # View application logs"
echo "  pm2 info jaan-api     # Process details"
echo "  pm2 restart all       # Restart all processes"
echo ""
echo "=========================================="
