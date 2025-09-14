import React, {useState, useEffect, useRef} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Animated,
  Dimensions,
} from 'react-native';

const {width, height} = Dimensions.get('window');

// Define screen types
type ScreenName = 'Loading' | 'Onboarding' | 'Setup' | 'Main' | 'Voice' | 'Chat' | 'Projects' | 'Settings';

// Animated Logo Component (Original)
const SpinningLogo = ({size = 60, color = '#FFFFFF'}: {size?: number; color?: string}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 3500, // Fixed back button UX
        useNativeDriver: true,
      }),
    );
    spinAnimation.start();
    return () => spinAnimation.stop();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.logoContainer, {width: size, height: size}]}>
      <Animated.View style={[styles.logoOuter, {transform: [{rotate: spin}], borderColor: color}]}>
        <View style={[styles.logoDot, {backgroundColor: color}]} />
      </Animated.View>
      <View style={[styles.logoInner, {backgroundColor: color}]}>
        <View style={styles.logoHighlight} />
      </View>
    </View>
  );
};

// Minimalistic Icons
const MicIcon = ({size = 24, color = '#FFFFFF'}: {size?: number; color?: string}) => (
  <View style={[styles.micIcon, {width: size, height: size, borderColor: color}]}>
    <View style={[styles.micBody, {backgroundColor: color}]} />
    <View style={[styles.micBase, {backgroundColor: color}]} />
  </View>
);

const ChatIcon = ({size = 24, color = '#FFFFFF'}: {size?: number; color?: string}) => (
  <View style={[styles.chatIcon, {width: size, height: size, borderColor: color}]}>
    <View style={[styles.chatDot, {backgroundColor: color}]} />
  </View>
);

const ProjectIcon = ({size = 24, color = '#FFFFFF'}: {size?: number; color?: string}) => (
  <View style={[styles.projectIcon, {width: size, height: size}]}>
    <View style={[styles.folder, {borderColor: color}]} />
    <View style={[styles.folderTab, {backgroundColor: color}]} />
  </View>
);

const SettingsIcon = ({size = 24, color = '#FFFFFF'}: {size?: number; color?: string}) => (
  <View style={[styles.settingsIcon, {width: size, height: size}]}>
    <View style={[styles.gear, {borderColor: color}]} />
    <View style={[styles.gearCenter, {backgroundColor: color}]} />
  </View>
);


// Loading Screen with Original Spinning Logo
const LoadingScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => {
  const fadeIn = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.3)).current;
  const textFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sequential animation
    Animated.sequence([
      // Initial fade in
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      // Logo scales up
      Animated.timing(logoScale, {
        toValue: 1,
        duration: 1200,
        useNativeDriver: true,
      }),
      // Text appears
      Animated.timing(textFade, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate after animation completes
    const timer = setTimeout(() => {
      navigateTo('Onboarding');
    }, 3500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.loadingScreen}>
      <Animated.View style={[styles.loadingContent, {opacity: fadeIn}]}>
        <Animated.View style={[styles.logoContainer, {transform: [{scale: logoScale}]}]}>
          <SpinningLogo size={100} color="#FFFFFF" />
        </Animated.View>
        
        <Animated.View style={[styles.titleContainer, {opacity: textFade}]}>
          <Text style={styles.loadingTitle}>STRATOSPHERE</Text>
          <Text style={styles.loadingSubtitle}>Mobile Development Assistant</Text>
        </Animated.View>
      </Animated.View>
    </View>
  );
};

// Enhanced Voice Recording Screen
const VoiceScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [lastTranscription, setLastTranscription] = useState('');
  const [voiceMessages, setVoiceMessages] = useState<Array<{id: number, transcription: string, timestamp: Date}>>([]);

  const durationInterval = useRef<NodeJS.Timeout | null>(null);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1.2, duration: 600, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1, duration: 600, useNativeDriver: true}),
      ]),
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {toValue: 1, duration: 300, useNativeDriver: true}).start();
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleRecording = () => {
    if (!isRecording) {
      // Start recording
      setIsRecording(true);
      setRecordingDuration(0);
      startPulse();
      
      // Start duration timer
      durationInterval.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);
      
      // Simulate voice recognition after 3 seconds
      setTimeout(() => {
        if (isRecording) {
          setLastTranscription('Analyzing your React Native app performance...');
        }
      }, 3000);
      
    } else {
      // Stop recording
      setIsRecording(false);
      stopPulse();
      
      if (durationInterval.current) {
        clearInterval(durationInterval.current);
      }
      
      // Add to message history
      const newMessage = {
        id: Date.now(),
        transcription: lastTranscription || 'Voice message recorded',
        timestamp: new Date()
      };
      setVoiceMessages(prev => [newMessage, ...prev]);
      setLastTranscription('');
    }
  };

  const clearHistory = () => {
    setVoiceMessages([]);
    alert('Voice history cleared');
  };

  return (
    <View style={styles.container}>
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.simpleBackButton} onPress={() => navigateTo('Main')}>
          <Text style={styles.simpleBackButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <MicIcon size={20} color="#FFFFFF" />
          <Text style={styles.headerTitleText}>Voice Command</Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
        {/* Recording Controls */}
        <View style={styles.voiceControls}>
          <Animated.View style={{transform: [{scale: pulseAnim}]}}>
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={toggleRecording}
            >
              <MicIcon size={32} color={isRecording ? '#000000' : '#FFFFFF'} />
              <Text style={[styles.recordButtonText, {color: isRecording ? '#000000' : '#FFFFFF'}]}>
                {isRecording ? 'Stop Recording' : 'Start Recording'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
        
        {/* Status Card */}
        <View style={styles.statusCard}>
          <Text style={styles.cardTitle}>Recording Status</Text>
          <Text style={styles.cardText}>Status: {isRecording ? 'Recording...' : 'Ready'}</Text>
          <Text style={styles.cardText}>Duration: {formatDuration(recordingDuration)}</Text>
          <Text style={styles.cardText}>Quality: High Definition</Text>
          {lastTranscription && (
            <>
              <Text style={styles.cardTitle}>Live Transcription:</Text>
              <Text style={styles.cardText}>{lastTranscription}</Text>
            </>
          )}
        </View>
        
        {/* Voice History */}
        {voiceMessages.length > 0 && (
          <View style={styles.settingsSection}>
            <View style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center'}}>
              <Text style={styles.sectionTitle}>Recent Voice Messages</Text>
              <TouchableOpacity style={styles.actionButton} onPress={clearHistory}>
                <Text style={styles.actionButtonText}>Clear</Text>
              </TouchableOpacity>
            </View>
            
            {voiceMessages.slice(0, 5).map(message => (
              <View key={message.id} style={styles.messageReceived}>
                <Text style={styles.messageText}>{message.transcription}</Text>
                <Text style={[styles.cardText, {marginTop: 5, fontSize: 12}]}>
                  {message.timestamp.toLocaleTimeString()}
                </Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

// Chat Screen
const ChatScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBackButton} onPress={() => navigateTo('Main')}>
        <Text style={styles.headerBackButtonText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <ChatIcon size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Chat</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
    
    <ScrollView style={styles.chatMessages} contentContainerStyle={styles.messagesContent}>
      <View style={styles.messageReceived}>
        <Text style={styles.messageText}>Assistant: Ready to help with your development tasks.</Text>
      </View>
      
      <View style={styles.messageSent}>
        <Text style={styles.messageSentText}>I need help optimizing my React Native app performance</Text>
      </View>
      
      <View style={styles.messageReceived}>
        <Text style={styles.messageText}>Assistant: I can analyze your app's performance and suggest optimizations.</Text>
      </View>
    </ScrollView>
    
    <View style={styles.chatInputContainer}>
      <TextInput
        style={styles.textInput}
        placeholder="Type your message..."
        placeholderTextColor="#666666"
      />
      <TouchableOpacity style={styles.sendButton}>
        <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Projects Screen
const ProjectsScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <TouchableOpacity style={styles.headerBackButton} onPress={() => navigateTo('Main')}>
        <Text style={styles.headerBackButtonText}>← Back</Text>
      </TouchableOpacity>
      <View style={styles.headerCenter}>
        <ProjectIcon size={24} color="#FFFFFF" />
        <Text style={styles.headerTitle}>Projects</Text>
      </View>
      <View style={styles.headerSpacer} />
    </View>
    
    <ScrollView style={styles.content}>
      <View style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <ProjectIcon size={20} color="#FFFFFF" />
          <Text style={styles.projectTitle}>Stratosphere Mobile</Text>
          <View style={styles.statusActive} />
        </View>
        <Text style={styles.projectDescription}>React Native mobile application</Text>
        <Text style={styles.projectStatus}>Active</Text>
      </View>
      
      <View style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <ProjectIcon size={20} color="#FFFFFF" />
          <Text style={styles.projectTitle}>HTN25 Project</Text>
          <View style={styles.statusDevelopment} />
        </View>
        <Text style={styles.projectDescription}>Desktop development interface</Text>
        <Text style={styles.projectStatus}>In Development</Text>
      </View>
      
      <View style={styles.projectCard}>
        <View style={styles.projectHeader}>
          <ProjectIcon size={20} color="#FFFFFF" />
          <Text style={styles.projectTitle}>AI Assistant</Text>
          <View style={styles.statusPlanning} />
        </View>
        <Text style={styles.projectDescription}>Voice-powered development tool</Text>
        <Text style={styles.projectStatus}>Planning</Text>
      </View>
      
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>New Project</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);

// Enhanced Settings Screen with State Management
const SettingsScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => {
  const [serverIP, setServerIP] = useState('192.168.1.100');
  const [port, setPort] = useState('3000');
  const [theme, setTheme] = useState<'Dark' | 'Light'>('Dark');
  const [voiceQuality, setVoiceQuality] = useState<'Low' | 'Medium' | 'High'>('High');
  const [notifications, setNotifications] = useState(true);
  const [autoSend, setAutoSend] = useState(true);
  const [hapticFeedback, setHapticFeedback] = useState(true);

  const toggleTheme = () => {
    setTheme(theme === 'Dark' ? 'Light' : 'Dark');
  };

  const cycleVoiceQuality = () => {
    const qualities: Array<'Low' | 'Medium' | 'High'> = ['Low', 'Medium', 'High'];
    const currentIndex = qualities.indexOf(voiceQuality);
    const nextIndex = (currentIndex + 1) % qualities.length;
    setVoiceQuality(qualities[nextIndex]);
  };

  const saveSettings = () => {
    // Here you would typically save to AsyncStorage or send to API
    console.log('Settings saved:', { serverIP, port, theme, voiceQuality, notifications, autoSend, hapticFeedback });
    alert('Settings saved successfully!');
  };

  const resetToDefaults = () => {
    setServerIP('192.168.1.100');
    setPort('3000');
    setTheme('Dark');
    setVoiceQuality('High');
    setNotifications(true);
    setAutoSend(true);
    setHapticFeedback(true);
    alert('Settings reset to defaults');
  };

  const testConnection = () => {
    alert(`Testing connection to ${serverIP}:${port}...\n\nConnection successful!`);
  };

  const clearChatHistory = () => {
    alert('Chat history cleared successfully');
  };

  return (
    <View style={styles.container}>
      {/* Fixed Header with Back Button */}
      <View style={styles.fixedHeader}>
        <TouchableOpacity style={styles.simpleBackButton} onPress={() => navigateTo('Main')}>
          <Text style={styles.simpleBackButtonText}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <SettingsIcon size={20} color="#FFFFFF" />
          <Text style={styles.headerTitleText}>Settings</Text>
        </View>
      </View>
      
      <ScrollView style={styles.scrollContent} contentContainerStyle={styles.scrollPadding}>
        {/* Connection Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Connection</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Server IP</Text>
            <TextInput 
              style={styles.settingInput} 
              value={serverIP}
              onChangeText={setServerIP}
              placeholder="192.168.1.100"
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Port</Text>
            <TextInput 
              style={styles.settingInput} 
              value={port}
              onChangeText={setPort}
              placeholder="3000"
              placeholderTextColor="#666666"
              keyboardType="numeric"
            />
          </View>
          
          <TouchableOpacity style={styles.actionButton} onPress={testConnection}>
            <Text style={styles.actionButtonText}>Test Connection</Text>
          </TouchableOpacity>
        </View>
        
        {/* Interface Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Interface</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Theme</Text>
            <TouchableOpacity style={styles.toggleButton} onPress={toggleTheme}>
              <Text style={styles.toggleButtonText}>{theme}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Notifications</Text>
            <TouchableOpacity 
              style={[styles.toggleButton, !notifications && styles.toggleButtonOff]} 
              onPress={() => setNotifications(!notifications)}
            >
              <Text style={[styles.toggleButtonText, !notifications && styles.toggleButtonTextOff]}>
                {notifications ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Haptic Feedback</Text>
            <TouchableOpacity 
              style={[styles.toggleButton, !hapticFeedback && styles.toggleButtonOff]} 
              onPress={() => setHapticFeedback(!hapticFeedback)}
            >
              <Text style={[styles.toggleButtonText, !hapticFeedback && styles.toggleButtonTextOff]}>
                {hapticFeedback ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Voice Settings */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Voice</Text>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Voice Quality</Text>
            <TouchableOpacity style={styles.toggleButton} onPress={cycleVoiceQuality}>
              <Text style={styles.toggleButtonText}>{voiceQuality}</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.settingItem}>
            <Text style={styles.settingLabel}>Auto-send Voice</Text>
            <TouchableOpacity 
              style={[styles.toggleButton, !autoSend && styles.toggleButtonOff]} 
              onPress={() => setAutoSend(!autoSend)}
            >
              <Text style={[styles.toggleButtonText, !autoSend && styles.toggleButtonTextOff]}>
                {autoSend ? 'On' : 'Off'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Data Management */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Data</Text>
          
          <TouchableOpacity style={styles.actionButton} onPress={clearChatHistory}>
            <Text style={styles.actionButtonText}>Clear Chat History</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.dangerButton} onPress={resetToDefaults}>
            <Text style={styles.dangerButtonText}>Reset to Defaults</Text>
          </TouchableOpacity>
        </View>
        
        {/* Save Button */}
        <TouchableOpacity style={styles.primaryButton} onPress={saveSettings}>
          <Text style={styles.primaryButtonText}>Save Settings</Text>
        </TouchableOpacity>
        
        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appInfoText}>Stratosphere Mobile v1.0.0</Text>
          <Text style={styles.appInfoText}>Built with React Native</Text>
        </View>
      </ScrollView>
    </View>
  );
};

// Main Screen
const MainScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <SpinningLogo size={40} color="#FFFFFF" />
      <View style={styles.headerText}>
        <Text style={styles.title}>STRATOSPHERE</Text>
        <Text style={styles.subtitle}>Development Assistant</Text>
      </View>
    </View>
    
    <View style={styles.content}>
      <View style={styles.featureGrid}>
        <TouchableOpacity 
          style={styles.featureCard} 
          onPress={() => navigateTo('Voice')}
        >
          <MicIcon size={32} color="#FFFFFF" />
          <Text style={styles.featureTitle}>Voice Command</Text>
          <Text style={styles.featureDescription}>Voice-powered assistance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.featureCard} 
          onPress={() => navigateTo('Chat')}
        >
          <ChatIcon size={32} color="#FFFFFF" />
          <Text style={styles.featureTitle}>Chat</Text>
          <Text style={styles.featureDescription}>Text-based assistance</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.featureCard} 
          onPress={() => navigateTo('Projects')}
        >
          <ProjectIcon size={32} color="#FFFFFF" />
          <Text style={styles.featureTitle}>Projects</Text>
          <Text style={styles.featureDescription}>Manage your projects</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.featureCard} 
          onPress={() => navigateTo('Settings')}
        >
          <SettingsIcon size={32} color="#FFFFFF" />
          <Text style={styles.featureTitle}>Settings</Text>
          <Text style={styles.featureDescription}>Configure your app</Text>
        </TouchableOpacity>
      </View>
    </View>
  </View>
);

// Onboarding Screen
const OnboardingScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.container}>
    <View style={styles.welcomeScreen}>
      <SpinningLogo size={100} color="#FFFFFF" />
      <Text style={styles.welcomeTitle}>WELCOME TO STRATOSPHERE</Text>
      <Text style={styles.welcomeDescription}>
        Your mobile development assistant.{"\n"}
        Ready to enhance your coding workflow?
      </Text>
      
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => navigateTo('Setup')}
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={() => navigateTo('Main')}
      >
        <Text style={styles.secondaryButtonText}>Skip Setup</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Setup Screen
const SetupScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.container}>
    <View style={styles.welcomeScreen}>
      <Text style={styles.title}>Connection Setup</Text>
      <Text style={styles.welcomeDescription}>
        Configure connection to your development server
      </Text>
      
      <View style={styles.setupCard}>
        <Text style={styles.cardTitle}>Server Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.cardText}>IP: 192.168.1.100</Text>
          <View style={styles.statusActive} />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.cardText}>Port: 3000</Text>
          <View style={styles.statusActive} />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.cardText}>Connection: Ready</Text>
          <View style={styles.statusActive} />
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.primaryButton}
        onPress={() => navigateTo('Main')}
      >
        <Text style={styles.primaryButtonText}>Continue</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={() => navigateTo('Onboarding')}
      >
        <Text style={styles.secondaryButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Main App Component - Minimalistic Theme
const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Loading');
  
  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#000000"
        translucent={false}
      />
      <SafeAreaView style={styles.container}>
        {currentScreen === 'Loading' && <LoadingScreen navigateTo={navigateTo} />}
        {currentScreen === 'Onboarding' && <OnboardingScreen navigateTo={navigateTo} />}
        {currentScreen === 'Setup' && <SetupScreen navigateTo={navigateTo} />}
        {currentScreen === 'Main' && <MainScreen navigateTo={navigateTo} />}
        {currentScreen === 'Voice' && <VoiceScreen navigateTo={navigateTo} />}
        {currentScreen === 'Chat' && <ChatScreen navigateTo={navigateTo} />}
        {currentScreen === 'Projects' && <ProjectsScreen navigateTo={navigateTo} />}
        {currentScreen === 'Settings' && <SettingsScreen navigateTo={navigateTo} />}
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  // Base containers
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeScreen: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading screen
  loadingScreen: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContent: {
    alignItems: 'center',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: 40,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    textAlign: 'center',
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#888888',
    marginTop: 8,
    textAlign: 'center',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerText: {
    marginLeft: 15,
  },
  headerBackButton: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginLeft: -60, // Compensate for back button width
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    marginLeft: 10,
  },
  headerSpacer: {
    width: 60, // Same width as back button for centering
  },

  // Fixed Header Styles (New Solution)
  fixedHeader: {
    backgroundColor: '#000000',
    paddingTop: 10,
    paddingBottom: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#222222',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  simpleBackButton: {
    padding: 8,
  },
  simpleBackButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    marginLeft: -50, // Compensate for back button
  },
  headerTitleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  scrollContent: {
    flex: 1,
    backgroundColor: '#000000',
  },
  scrollPadding: {
    padding: 20,
    paddingBottom: 40, // Extra bottom padding for safe scrolling
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 14,
    color: '#888888',
    marginTop: 2,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 20,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#CCCCCC',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 40,
    paddingHorizontal: 20,
  },

  // Original Logo styles
  logoContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoOuter: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: 1000,
    borderWidth: 2,
  },
  logoDot: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    top: -4,
    left: '50%',
    marginLeft: -4,
  },
  logoInner: {
    width: '60%',
    height: '60%',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  logoHighlight: {
    position: 'absolute',
    top: '20%',
    right: '20%',
    width: '25%',
    height: '25%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 1000,
  },


  // Icons
  micIcon: {
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  micBody: {
    width: 8,
    height: 12,
    borderRadius: 4,
    position: 'absolute',
  },
  micBase: {
    width: 14,
    height: 3,
    borderRadius: 2,
    position: 'absolute',
    bottom: -2,
  },
  chatIcon: {
    borderWidth: 2,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chatDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  projectIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  folder: {
    width: 18,
    height: 14,
    borderWidth: 2,
    borderRadius: 2,
    position: 'absolute',
  },
  folderTab: {
    width: 6,
    height: 2,
    borderRadius: 1,
    position: 'absolute',
    top: -3,
    left: 2,
  },
  settingsIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gear: {
    width: 16,
    height: 16,
    borderWidth: 2,
    borderRadius: 8,
    position: 'absolute',
  },
  gearCenter: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
  },

  // Buttons
  primaryButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  primaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#333333',
    alignItems: 'center',
    marginBottom: 16,
  },
  secondaryButtonText: {
    color: '#CCCCCC',
    fontSize: 16,
    fontWeight: '500',
  },

  // Feature Grid
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  featureCard: {
    backgroundColor: '#111111',
    width: '48%',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#222222',
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  featureDescription: {
    fontSize: 12,
    color: '#888888',
    textAlign: 'center',
    lineHeight: 16,
  },

  // Voice Screen
  voiceControls: {
    alignItems: 'center',
    marginVertical: 40,
  },
  recordButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    alignItems: 'center',
    marginBottom: 30,
  },
  recordingButton: {
    backgroundColor: '#888888',
  },
  recordButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  statusCard: {
    backgroundColor: '#111111',
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#222222',
    minWidth: 250,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  cardText: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },

  // Chat Screen
  chatMessages: {
    flex: 1,
    padding: 16,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageReceived: {
    backgroundColor: '#111111',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: '#222222',
  },
  messageSent: {
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
    alignSelf: 'flex-end',
    maxWidth: '85%',
  },
  messageText: {
    fontSize: 16,
    color: '#CCCCCC',
  },
  messageSentText: {
    fontSize: 16,
    color: '#000000',
  },
  chatInputContainer: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#222222',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginRight: 12,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#111111',
  },
  sendButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },

  // Projects Screen
  projectCard: {
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222222',
  },
  projectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  projectTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 12,
    flex: 1,
  },
  projectDescription: {
    fontSize: 14,
    color: '#CCCCCC',
    marginBottom: 4,
  },
  projectStatus: {
    fontSize: 12,
    color: '#888888',
    fontWeight: '500',
  },
  statusActive: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  statusDevelopment: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#888888',
  },
  statusPlanning: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#444444',
  },

  // Settings Screen
  settingsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#111111',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#222222',
  },
  settingLabel: {
    fontSize: 16,
    color: '#CCCCCC',
    flex: 1,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    color: '#FFFFFF',
    backgroundColor: '#000000',
    minWidth: 120,
    textAlign: 'right',
  },
  toggleButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '600',
  },

  // Setup Screen
  setupCard: {
    backgroundColor: '#111111',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: '#222222',
    minWidth: 280,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },

  // Enhanced Settings Styles
  actionButton: {
    backgroundColor: '#333333',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  dangerButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  dangerButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  toggleButtonOff: {
    backgroundColor: '#333333',
  },
  toggleButtonTextOff: {
    color: '#666666',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#222222',
  },
  appInfoText: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
});

export default App;
