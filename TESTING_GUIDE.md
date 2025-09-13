# Testing Guide: HTTP API Migration

This guide provides comprehensive testing steps for the mobile app's HTTP API migration and the new git commit rules.

## 🏗️ Pre-Testing Setup

### 1. Mobile App Setup

```bash
# Navigate to mobile app directory
cd /Users/madrobin/Documents/code/github/Stratosphere-Mobile

# Install dependencies (already done)
npm install

# Check TypeScript compilation (should pass now)
npx tsc --noEmit

# Start Metro bundler
npm start
```

### 2. Desktop App Setup (HTN25_Project)
You'll need your desktop app running with HTTP API endpoints enabled on port 3000.

```bash
cd /Users/madrobin/Documents/code/github/HTN25_Project

# Start the desktop app with HTTP API enabled
npm run dev
```

## 📱 Mobile App Testing

### Phase 1: Basic Functionality Testing

#### 1.1 TypeScript Compilation ✅
```bash
npx tsc --noEmit
# Should pass with no errors
```

#### 1.2 Metro Bundler Start
```bash
npm start
# Should start successfully without errors
```

#### 1.3 Build Test (Android)
```bash
# Test Android build (if you have Android setup)
npm run android

# Or just test the bundle
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android-test.bundle
```

### Phase 2: API Service Testing

#### 2.1 Unit Test the API Service
Create a simple test to verify the API service:

```bash
# Create a simple test file
cat > src/services/__tests__/ApiService.test.ts << 'EOF'
import ApiService from '../ApiService';

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService({
      baseURL: 'http://localhost:3000',
      timeout: 10000,
      retryAttempts: 2,
      retryDelay: 500,
    });
  });

  test('should initialize with correct config', () => {
    const debugInfo = apiService.getDebugInfo();
    expect(debugInfo.baseURL).toBe('http://localhost:3000');
    expect(debugInfo.deviceId).toBeDefined();
  });

  test('should handle connection status correctly', () => {
    expect(apiService.getConnectionStatus()).toBe(false);
  });

  test('should generate device ID', () => {
    const debugInfo = apiService.getDebugInfo();
    expect(debugInfo.deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });
});
EOF

# Run the test
npm test -- src/services/__tests__/ApiService.test.ts
```

### Phase 3: Integration Testing

#### 3.1 Connection Testing
Test the connection flow with your desktop app:

1. **Start Desktop App** on port 3000 with HTTP API enabled
2. **Launch Mobile App** in simulator/device
3. **Navigate to Setup Screen**
4. **Enter Connection Details**:
   - Host: Your computer's IP address (e.g., 192.168.1.100)
   - Port: 3000
5. **Test Connection** button should show success

#### 3.2 Session Management Testing
Verify session creation and management:

1. **Check Debug Info** in Settings > Advanced (if you add this feature)
2. **Verify Session ID** is created and stored
3. **Test Reconnection** by disconnecting and reconnecting
4. **Check Session Persistence** across app restarts

#### 3.3 Chat Functionality Testing

**Text Messages**:
1. Send a simple text message: "Hello, test message"
2. Verify message appears in chat
3. Check for assistant response from desktop app
4. Test message history persistence

**Voice Messages** (if desktop app supports it):
1. Hold voice button and speak
2. Verify transcription appears
3. Check voice message indicator
4. Test voice response playback

### Phase 4: Error Handling Testing

#### 4.1 Network Scenarios
```bash
# Test offline behavior
# 1. Start app online
# 2. Turn off WiFi/disconnect network
# 3. Try sending messages (should queue)
# 4. Reconnect network (should process queue)
```

#### 4.2 Server Error Scenarios
1. **Server Down**: Stop desktop app, try connecting
2. **Wrong Port**: Connect to wrong port
3. **Invalid Responses**: Test with malformed responses (if possible)

### Phase 5: Performance Testing

#### 5.1 Polling Performance
Monitor network usage during polling:
1. Connect to desktop app
2. Let app run for 5-10 minutes
3. Monitor network requests in development tools
4. Verify polling happens every 5 seconds

#### 5.2 Memory Usage
Check for memory leaks:
1. Run app for extended period
2. Switch between screens multiple times
3. Send many messages
4. Check memory usage in development tools

## 🔧 Git Commit Rules Testing

### Phase 1: Setup Conventional Commits

#### 1.1 Install Commitizen (Optional)
```bash
cd /Users/madrobin/Documents/code/github/HTN25_Project

# Install globally
npm install -g commitizen cz-conventional-changelog

# Configure
echo '{"path": "cz-conventional-changelog"}' > ~/.czrc
```

#### 1.2 Test Conventional Commit Format
```bash
# Navigate to HTN25_Project
cd /Users/madrobin/Documents/code/github/HTN25_Project

# Make a test change
echo "# Test change" >> test-change.md

# Stage the change
git add test-change.md

# Test conventional commit (using commitizen)
git cz
# Select: feat
# Scope: test
# Description: add test change for commit validation
# Breaking changes: n
# Issues closed: n
```

#### 1.3 Test Manual Conventional Commits
```bash
# Test different commit types
git commit -m "feat(mobile): add HTTP API support"
git commit -m "fix(voice): resolve microphone permission issue"
git commit -m "docs(readme): update installation instructions"
git commit -m "chore(deps): update React Native version"
```

### Phase 2: Validate Commit History
```bash
# Check commit history follows conventional format
git log --oneline -10

# Verify format: type(scope): description
```

### Phase 3: Test Branch Naming
```bash
# Create branches following conventions
git checkout -b feature/improved-error-handling
git checkout -b fix/connection-timeout-issue
git checkout -b docs/update-testing-guide
```

## 🧪 Automated Testing Scripts

### Create Test Runner Script
```bash
# Create test script in Stratosphere-Mobile directory
cat > test-migration.sh << 'EOF'
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

echo "2. Running Unit Tests..."
npm test -- --watchAll=false
if [ $? -ne 0 ]; then
    echo "❌ Unit tests failed"
    exit 1
fi
echo "✅ Unit tests passed"

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
EOF

chmod +x test-migration.sh
```

### Run Basic Tests
```bash
cd /Users/madrobin/Documents/code/github/Stratosphere-Mobile
./test-migration.sh
```

## 📊 Testing Checklist

### Core Functionality ✅
- [ ] TypeScript compilation passes
- [ ] Metro bundler starts successfully
- [ ] App builds without errors
- [ ] API service initializes correctly
- [ ] Connection to desktop app works
- [ ] Session management functions
- [ ] Chat messages send and receive
- [ ] Voice functionality works
- [ ] Settings screen functions
- [ ] Projects screen loads data

### Error Handling
- [ ] Offline behavior works correctly
- [ ] Server connection errors handled gracefully
- [ ] Invalid responses don't crash app
- [ ] Network timeouts handled properly
- [ ] Session expiry handled correctly

### Performance
- [ ] Polling doesn't cause performance issues
- [ ] Memory usage is stable
- [ ] No memory leaks detected
- [ ] App remains responsive under load
- [ ] Network usage is reasonable

### Git Commit Rules
- [ ] Conventional commits format works
- [ ] Branch naming follows conventions
- [ ] Commitizen integration works (if installed)
- [ ] Commit history is clean and readable
- [ ] changes.md and warp.md files are accessible

## 🐛 Common Issues and Solutions

### TypeScript Errors
```bash
# If you see vector icons errors:
npm install --save-dev @types/react-native-vector-icons

# If you see animation type errors:
# Add 'as any' type assertion (already fixed)
```

### Metro Bundler Issues
```bash
# Clear Metro cache
npx react-native start --reset-cache

# Clear node modules and reinstall
rm -rf node_modules && npm install
```

### Connection Issues
1. **Check Desktop App**: Ensure it's running on port 3000
2. **Check IP Address**: Use correct local network IP
3. **Check Firewall**: Ensure port 3000 is not blocked
4. **Check CORS**: Desktop app should allow mobile origins

### Voice Issues
1. **Check Permissions**: Ensure microphone permissions granted
2. **Check Platform**: Some voice features may be platform-specific
3. **Check TTS**: Text-to-speech may have different APIs on different platforms

## 🚀 Next Steps After Testing

1. **Fix any identified issues**
2. **Update documentation** with test results
3. **Create CI/CD pipeline** for automated testing
4. **Set up staging environment** for integration testing
5. **Plan production deployment** with monitoring

## 📝 Test Results Template

```markdown
## Test Results - [Date]

### Environment
- Platform: [iOS/Android/Both]
- Device: [Device model or simulator]
- React Native Version: 0.72.6
- Node.js Version: [version]

### Core Functionality
- TypeScript Compilation: ✅/❌
- App Build: ✅/❌ 
- Connection to Desktop: ✅/❌
- Chat Functionality: ✅/❌
- Voice Features: ✅/❌

### Performance
- Memory Usage: [Acceptable/High/Low]
- Network Usage: [Normal/High/Low]
- Polling Frequency: [5s as expected/Other]

### Issues Found
1. [Issue description]
   - Severity: [High/Medium/Low]
   - Steps to reproduce: [steps]
   - Expected vs Actual behavior

### Git Commit Testing
- Conventional commits: ✅/❌
- Branch naming: ✅/❌
- Documentation: ✅/❌

### Overall Status
- Ready for Production: ✅/❌
- Needs Minor Fixes: ✅/❌
- Needs Major Changes: ✅/❌
```

Remember to document all findings and update the changes.md file with any issues discovered during testing!