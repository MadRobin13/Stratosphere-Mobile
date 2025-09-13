# Stratosphere Mobile

A React Native mobile companion app for the Voice Dev Assistant computer application. Provides voice-powered AI development assistance with ChatGPT-style interface.

## Features

- 🎤 **Voice-First Interface**: Natural speech-to-text and text-to-speech
- 🤖 **AI Integration**: Connects to computer app's Gemini AI backend
- 📱 **ChatGPT-Style UI**: Modern, intuitive chat interface
- 🔄 **Real-time Sync**: HTTP API with polling for real-time updates
- 📁 **Repository Management**: View and manage projects remotely
- 🎨 **Modern Design**: Dark/light themes with smooth animations
- 🔐 **Secure Connection**: HTTP API with session-based authentication

## Prerequisites

- Node.js (v16 or higher)
- React Native development environment
- Android Studio (for Android development)
- Xcode (for iOS development)
- Running Voice Dev Assistant computer app

## Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MadRobin13/Stratosphere-Mobile.git
   cd Stratosphere-Mobile
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **iOS Setup** (iOS only)
   ```bash
   cd ios && pod install && cd ..
   ```

4. **Start Metro bundler**
   ```bash
   npm start
   ```

5. **Run on device**
   ```bash
   # Android
   npm run android
   
   # iOS
   npm run ios
   ```

## Configuration

### Computer App Connection

1. Ensure your Voice Dev Assistant computer app is running
2. Note your computer's IP address on the local network
3. Open the mobile app and go through the setup process
4. Enter your computer's IP and port (default: 3000)

### Permissions Required

- **Microphone**: For voice recognition
- **Network**: For HTTP API connection

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── VoiceButton.tsx    # Voice recording button
│   └── MessageBubble.tsx  # Chat message component
├── screens/             # Application screens
│   ├── OnboardingScreen.tsx
│   ├── SetupScreen.tsx
│   ├── ChatScreen.tsx
│   ├── ProjectsScreen.tsx
│   └── SettingsScreen.tsx
├── contexts/            # React contexts for state management
│   ├── ThemeContext.tsx   # Theme and appearance
│   ├── AppContext.tsx     # Global app state
│   └── ConnectionContext.tsx # HTTP API connection
├── services/            # External service integrations
│   ├── ApiService.ts      # HTTP API client
│   └── VoiceService.ts    # Speech recognition/synthesis
├── navigation/          # Navigation configuration
│   └── MainTabNavigator.tsx
├── types/               # TypeScript type definitions
│   └── index.ts
└── App.tsx              # Main application component
```

## Development

### Scripts

```bash
npm start          # Start Metro bundler
npm run android    # Run Android app
npm run ios        # Run iOS app
npm run lint       # Run ESLint
npm test          # Run tests
npm run clean     # Clean build artifacts
```

### Voice Commands Examples

- "Generate a React component for user authentication"
- "Review the code in main.js and suggest improvements"
- "Debug this error in my API call"
- "Refactor this function to be more efficient"
- "Create unit tests for the user service"

## Architecture

### Communication Flow

1. **Mobile App** ↔ HTTP API ↔ **Computer App Backend**
2. **Computer App** ↔ **Gemini AI API**
3. **Computer App** ↔ **Local File System**
4. **Computer App** ↔ **GitHub API**

### Key Technologies

- **React Native 0.72**: Cross-platform mobile framework
- **TypeScript**: Type-safe development
- **React Navigation**: Screen navigation
- **Axios**: HTTP client for API communication
- **AsyncStorage**: Local data persistence
- **Voice Recognition**: @react-native-voice/voice
- **Text-to-Speech**: react-native-tts

## Features in Detail

### Voice Interface

- Push-to-talk voice recording
- Real-time speech transcription
- Automatic message sending
- Voice response playback
- Haptic feedback

### Chat Interface

- ChatGPT-style message bubbles
- Real-time typing indicators
- Message history persistence
- Voice message indicators
- Smooth animations

### Project Management

- Repository browsing
- File structure visualization
- Project statistics
- Remote file access
- Real-time file watching

### Connection Management

- HTTP API session management
- Connection status monitoring
- Automatic reconnection with retry logic
- Polling for real-time updates
- Error handling and recovery

## Troubleshooting

### Common Issues

**Voice not working:**
- Check microphone permissions
- Ensure device supports speech recognition
- Try restarting the app

**Can't connect to computer:**
- Verify both devices are on the same network
- Check computer app is running with HTTP API enabled on correct port
- Ensure firewall allows HTTP connections (port 3000 by default)
- Check computer app CORS configuration

**App crashes:**
- Clear app data and restart
- Check React Native environment setup
- View logs with `npx react-native log-android` or `npx react-native log-ios`

### Debug Mode

Enable debug mode in Settings to see:
- HTTP API connection details
- Session management status
- Voice recognition status
- API request/response logs
- Performance metrics

## Building for Release

### Android

```bash
npm run build:android
# APK will be in android/app/build/outputs/apk/release/
```

### iOS

```bash
# Open iOS project in Xcode
open ios/StratosphereMobile.xcworkspace

# Build for release through Xcode
# or use command line tools
```

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
1. Check the troubleshooting section
2. Search existing GitHub issues
3. Create a new issue with detailed information

---

**Note**: This mobile app requires the Voice Dev Assistant computer application to be running for full functionality.