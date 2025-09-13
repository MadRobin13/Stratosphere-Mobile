#!/bin/bash

echo "🧪 Testing Mobile App HTTP API Migration"
echo "========================================"

echo "1. TypeScript Compilation Check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    echo "❌ TypeScript compilation failed"
    exit 1
fi
echo "✅ TypeScript compilation passed"

echo "2. Jest Setup Check..."
if [ -f "src/services/__tests__/ApiService.test.ts" ]; then
    echo "✅ Unit test files created"
else
    echo "⚠️ No unit test files found"
fi

echo "3. Bundle Test..."
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output test.bundle
if [ $? -ne 0 ]; then
    echo "❌ Bundle creation failed"
    exit 1
fi
echo "✅ Bundle creation passed"

echo "4. Cleanup..."
rm -f test.bundle

echo "🎉 All basic tests passed!"
echo "Next steps:"
echo "1. Start desktop app on port 3000"
echo "2. Run 'npm run android' or 'npm run ios'"
echo "3. Test connection to desktop app"
echo "4. Test chat functionality"
echo "5. Test voice features"