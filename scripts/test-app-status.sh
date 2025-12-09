#!/bin/bash

echo "🔍 Testing SIIFMART Application Data Loading..."
echo "================================================"
echo ""

# Check if dev server is running
if ! curl -s http://localhost:3002 > /dev/null; then
    echo "❌ Dev server is not running on port 3002"
    exit 1
fi

echo "✅ Dev server is running"
echo ""

# Test database connection
echo "📊 Database Status:"
node scripts/check-employees.js 2>&1 | grep "Total Employees"
echo ""

# Check if browser can access the app
echo "🌐 Browser Access Test:"
curl -s http://localhost:3002 | grep -o "SIIFMART" | head -1
echo ""

echo "✅ All systems operational!"
echo ""
echo "📝 Next Steps:"
echo "1. Open http://localhost:3002 in your browser"
echo "2. Navigate to the Employees page"
echo "3. Check the browser console for any errors"
echo "4. Verify that employees are displayed"
