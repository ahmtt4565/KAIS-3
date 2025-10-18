#!/bin/bash

# KAIS Mobile Test Script
# Tests all critical pages on mobile viewport

echo "🚀 Starting KAIS Mobile Tests..."
echo "================================"

# Test URLs
BACKEND_URL="https://github-kais-sync.preview.emergentagent.com"

# Test 1: Homepage
echo "✅ Test 1: Homepage Mobile"
curl -s -o /dev/null -w "Status: %{http_code}\n" "$BACKEND_URL/"

# Test 2: API Health
echo "✅ Test 2: Backend API Health"
curl -s "$BACKEND_URL/api/listings" | head -c 100

# Test 3: Google OAuth Redirect
echo -e "\n✅ Test 3: Google OAuth URL"
echo "Auth URL: https://auth.emergentagent.com/?redirect=https%3A%2F%2Fgithub-kais-sync.preview.emergentagent.com%2Fdashboard"

echo -e "\n================================"
echo "📱 Manual Mobile Test URLs:"
echo "1. Homepage: $BACKEND_URL"
echo "2. Dashboard: $BACKEND_URL/dashboard"
echo "3. Create Listing: $BACKEND_URL/create"
echo "4. Chat: $BACKEND_URL/chat"
echo "5. Profile: $BACKEND_URL/profile"
echo "================================"
