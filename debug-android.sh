#!/bin/bash

echo "🔍 Android Debug Helper for Stratosphere Mobile"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}📱 Checking connected Android devices...${NC}"
adb devices

echo ""
echo -e "${YELLOW}🎯 Instructions:${NC}"
echo "1. Connect your Android device via USB"
echo "2. Enable Developer Options and USB Debugging"
echo "3. Install the debug APK: stratosphere-mobile-debug.apk"
echo "4. Run this script again AFTER installing the app"
echo ""

# Check if device is connected
DEVICE_COUNT=$(adb devices | grep -v "List of devices attached" | grep "device" | wc -l)

if [ $DEVICE_COUNT -eq 0 ]; then
    echo -e "${RED}❌ No Android devices detected${NC}"
    echo ""
    echo "Enable USB Debugging:"
    echo "• Settings > About Phone > Tap 'Build Number' 7 times"
    echo "• Settings > Developer Options > Enable USB Debugging"
    echo "• Connect device and approve computer access"
    exit 1
fi

echo -e "${GREEN}✅ Device connected!${NC}"
echo ""

# Check if app is installed
APP_INSTALLED=$(adb shell pm list packages | grep "com.stratospheremobile" | wc -l)

if [ $APP_INSTALLED -eq 0 ]; then
    echo -e "${YELLOW}📦 App not installed. Install with:${NC}"
    echo "adb install stratosphere-mobile-debug.apk"
    echo ""
    echo "Or transfer the APK to your device and install manually."
    exit 1
fi

echo -e "${GREEN}✅ Stratosphere Mobile app is installed${NC}"
echo ""

echo -e "${BLUE}🚀 Starting real-time log monitoring...${NC}"
echo "Launch the app on your device now and watch for crash logs below:"
echo "Press Ctrl+C to stop monitoring"
echo ""

# Clear log buffer and start monitoring
adb logcat -c
adb logcat | grep -E "(stratosphere|ReactNative|React|AndroidRuntime|FATAL|ERROR)" --line-buffered | while read line; do
    if [[ $line == *"FATAL"* ]] || [[ $line == *"AndroidRuntime"* ]]; then
        echo -e "${RED}💥 CRASH: $line${NC}"
    elif [[ $line == *"ERROR"* ]]; then
        echo -e "${YELLOW}⚠️  ERROR: $line${NC}"
    else
        echo -e "${GREEN}📋 LOG: $line${NC}"
    fi
done