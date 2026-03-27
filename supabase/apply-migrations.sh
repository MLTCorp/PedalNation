#!/bin/bash
# PedalNation - Apply Database Migrations
# Run this script after authenticating with your personal Supabase account
#
# Prerequisites:
#   1. supabase CLI installed (npx supabase or global install)
#   2. Your personal Supabase account credentials
#
# Usage:
#   chmod +x supabase/apply-migrations.sh
#   ./supabase/apply-migrations.sh

set -e

PROJECT_REF="ehlsnvfzhrtyscsgimdm"

echo "PedalNation Database Migration Setup"
echo "======================================"
echo ""
echo "Step 1: Login to Supabase (personal account that owns $PROJECT_REF)"
npx supabase login

echo ""
echo "Step 2: Link to PedalNation project"
npx supabase link --project-ref "$PROJECT_REF"

echo ""
echo "Step 3: Apply all migrations"
npx supabase db push

echo ""
echo "Done! All migrations applied to project $PROJECT_REF"
echo ""
echo "Next: Copy your anon key and service role key from:"
echo "https://app.supabase.com/project/$PROJECT_REF/settings/api"
echo ""
echo "Update .env with:"
echo "  PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>"
echo "  SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>"
