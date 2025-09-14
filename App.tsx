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
        duration: 5000, // Updated to force another refresh
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

// Voice Recording Screen
const VoiceScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isRecording, setIsRecording] = useState(false);

  const startPulse = () => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1.1, duration: 800, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1, duration: 800, useNativeDriver: true}),
      ]),
    ).start();
  };

  const stopPulse = () => {
    pulseAnim.stopAnimation();
    Animated.timing(pulseAnim, {toValue: 1, duration: 300, useNativeDriver: true}).start();
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      startPulse();
    } else {
      stopPulse();
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voice Command</Text>
      </View>
      
      <View style={styles.content}>
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
          
          <View style={styles.statusCard}>
            <Text style={styles.cardTitle}>Status</Text>
            <Text style={styles.cardText}>Status: {isRecording ? 'Recording' : 'Ready'}</Text>
            <Text style={styles.cardText}>Duration: 0:00</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Main')}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

// Chat Screen
const ChatScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Chat</Text>
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
    
    <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Main')}>
      <Text style={styles.backButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

// Projects Screen
const ProjectsScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Projects</Text>
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
    
    <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Main')}>
      <Text style={styles.backButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

// Settings Screen
const SettingsScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.container}>
    <View style={styles.header}>
      <Text style={styles.title}>Settings</Text>
    </View>
    
    <ScrollView style={styles.content}>
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Connection</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Server IP</Text>
          <TextInput style={styles.settingInput} value="192.168.1.100" />
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Port</Text>
          <TextInput style={styles.settingInput} value="3000" />
        </View>
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>Interface</Text>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Theme</Text>
          <TouchableOpacity style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>Dark</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.settingItem}>
          <Text style={styles.settingLabel}>Voice Quality</Text>
          <TouchableOpacity style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>High</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.primaryButton}>
        <Text style={styles.primaryButtonText}>Save Settings</Text>
      </TouchableOpacity>
    </ScrollView>
    
    <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Main')}>
      <Text style={styles.backButtonText}>Back</Text>
    </TouchableOpacity>
  </View>
);

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
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#333333',
  },
  headerText: {
    marginLeft: 15,
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
  backButton: {
    backgroundColor: 'transparent',
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
  },
  backButtonText: {
    color: '#888888',
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
});

export default App;
