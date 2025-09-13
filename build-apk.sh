#!/bin/bash

echo "🏗️ Building Stratosphere Mobile APK"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: package.json not found. Make sure you're in the Stratosphere-Mobile directory${NC}"
    exit 1
fi

# Check if android directory exists
if [ ! -d "android" ]; then
    echo -e "${RED}❌ Error: android directory not found${NC}"
    exit 1
fi

echo "1. 🧹 Cleaning previous builds..."
rm -rf android/app/build/outputs/
cd android
./gradlew clean
cd ..

echo "2. 📦 Installing dependencies..."
npm install

echo "3. 🔧 Generating bundle..."
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

echo "4. 🏗️ Building APK..."
cd android
./gradlew assembleRelease

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ APK built successfully!${NC}"
    
    # Find the APK file
    APK_PATH=$(find app/build/outputs/apk/release -name "*.apk" | head -1)
    
    if [ -n "$APK_PATH" ]; then
        APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
        echo -e "${GREEN}📱 APK Location: android/$APK_PATH${NC}"
        echo -e "${GREEN}📊 APK Size: $APK_SIZE${NC}"
        
        # Copy APK to root directory with a better name
        cp "$APK_PATH" "../stratosphere-mobile-release.apk"
        echo -e "${GREEN}📋 APK copied to: stratosphere-mobile-release.apk${NC}"
        
        echo ""
        echo "🚀 Installation Instructions:"
        echo "1. Transfer stratosphere-mobile-release.apk to your Android device"
        echo "2. Enable 'Unknown sources' in Android settings"
        echo "3. Tap the APK file to install"
        echo "4. Open the app and enter your computer's IP: $(node ../setup-qr.js 2>/dev/null | grep 'Host:' | cut -d' ' -f4 || echo 'Run: node setup-qr.js to get IP')"
    else
        echo -e "${RED}❌ APK file not found in expected location${NC}"
    fi
else
    echo -e "${RED}❌ APK build failed${NC}"
    echo "Check the error messages above for details"
    exit 1
fi

cd ..