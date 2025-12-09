#!/bin/bash

# ============================================================================
# SIIFMART - Supabase Schema Deployment Script
# ============================================================================
# This script deploys the database schema to your Supabase project
# ============================================================================

echo "🚀 SIIFMART Database Schema Deployment"
echo "========================================"
echo ""

# Load environment variables
if [ -f .env.local ]; then
    export $(cat .env.local | grep -v '^#' | xargs)
else
    echo "❌ Error: .env.local file not found!"
    echo "Please create .env.local with your Supabase credentials"
    exit 1
fi

# Check if variables are set
if [ -z "$VITE_SUPABASE_URL" ]; then
    echo "❌ Error: VITE_SUPABASE_URL not set in .env.local"
    exit 1
fi

echo "✅ Environment variables loaded"
echo "📍 Project URL: $VITE_SUPABASE_URL"
echo ""

# Extract project reference from URL
PROJECT_REF=$(echo $VITE_SUPABASE_URL | sed 's/https:\/\///' | sed 's/.supabase.co//')
echo "📋 Project Reference: $PROJECT_REF"
echo ""

echo "⚠️  IMPORTANT: You need the database password to proceed"
echo "   Get it from: https://supabase.com/dashboard/project/$PROJECT_REF/settings/database"
echo ""
echo "   Or use the Supabase Dashboard SQL Editor:"
echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql"
echo ""
read -p "Do you have the database password? (y/n): " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo ""
    echo "📝 Alternative: Use Supabase Dashboard"
    echo "   1. Go to: https://supabase.com/dashboard/project/$PROJECT_REF/sql"
    echo "   2. Click 'New query'"
    echo "   3. Copy content from: supabase-schema.sql"
    echo "   4. Paste and click 'Run'"
    echo ""
    exit 0
fi

echo ""
read -sp "Enter database password: " DB_PASSWORD
echo ""

# Construct connection string
DB_URL="postgresql://postgres:$DB_PASSWORD@db.$PROJECT_REF.supabase.co:5432/postgres"

echo ""
echo "🔄 Deploying schema..."
echo ""

# Deploy schema using psql
PGPASSWORD=$DB_PASSWORD psql "$DB_URL" -f supabase-schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Schema deployed successfully!"
    echo ""
    echo "📊 Next steps:"
    echo "   1. Verify tables: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
    echo "   2. Test connection: npm run dev"
    echo "   3. Check browser console for connection test results"
    echo ""
else
    echo ""
    echo "❌ Deployment failed!"
    echo ""
    echo "📝 Try using the Supabase Dashboard instead:"
    echo "   https://supabase.com/dashboard/project/$PROJECT_REF/sql"
    echo ""
fi
