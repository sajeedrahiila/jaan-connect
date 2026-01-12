#!/bin/bash

# Jaan Connect - Load Testing Script
# Tests application with 200 concurrent users

echo "🚀 Starting Load Test for 200 Concurrent Users"
echo "=============================================="

# Check if apache2-utils is installed
if ! command -v ab &> /dev/null; then
    echo "Installing apache2-utils..."
    sudo apt-get update && sudo apt-get install -y apache2-utils
fi

# Test configurations
TOTAL_REQUESTS=1000
CONCURRENT_USERS=200
TARGET_URL="http://localhost:8080/"

echo "📊 Test Parameters:"
echo "  - Total Requests: $TOTAL_REQUESTS"
echo "  - Concurrent Users: $CONCURRENT_USERS"
echo "  - Target: $TARGET_URL"
echo ""

# Run Apache Bench
echo "⏱️ Running Apache Bench..."
ab -n $TOTAL_REQUESTS -c $CONCURRENT_USERS -t 60 $TARGET_URL > load-test-results.txt 2>&1

# Display results
echo ""
echo "✅ Load Test Complete!"
echo "=============================================="
cat load-test-results.txt

# Parse and highlight key metrics
echo ""
echo "📈 Key Metrics:"
echo "=============================================="
grep "Requests per second" load-test-results.txt || echo "Metric not found"
grep "Time per request" load-test-results.txt | head -1 || echo "Metric not found"
grep "Failed requests" load-test-results.txt || echo "Metric not found"

# Save results with timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
cp load-test-results.txt "load-test-results_${TIMESTAMP}.txt"

echo ""
echo "📁 Results saved to: load-test-results_${TIMESTAMP}.txt"
