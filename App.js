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
  ImageBackground,
} from 'react-native';

const {width, height} = Dimensions.get('window');

// Define screen types
type ScreenName = 'Loading' | 'Onboarding' | 'Setup' | 'Main' | 'Voice' | 'Chat' | 'Projects' | 'Settings';

// Animated Logo Component
const SpinningLogo = ({size = 60, color = '#00D4FF'}: {size?: number; color?: string}) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const spinAnimation = Animated.loop(
      Animated.timing(spinValue, {
        toValue: 1,
        duration: 8000,
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

// Rocket Loading Screen
const LoadingScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => {
  const rocketY = useRef(new Animated.Value(height)).current;
  const fadeIn = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Rocket launch animation
    Animated.parallel([
      Animated.timing(rocketY, {
        toValue: height * 0.3,
        duration: 2000,
        useNativeDriver: true,
      }),
      Animated.timing(fadeIn, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-navigate after 3 seconds
    const timer = setTimeout(() => {
      navigateTo('Onboarding');
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.loadingScreen}>
      <View style={styles.stars}>
        {[...Array(50)].map((_, i) => (
          <View
            key={i}
            style={[
              styles.star,
              {
                left: Math.random() * width,
                top: Math.random() * height,
                opacity: Math.random() * 0.8 + 0.2,
              },
            ]}
          />
        ))}
      </View>
      
      <Animated.View style={[styles.rocketContainer, {transform: [{translateY: rocketY}]}]}>
        <Text style={styles.rocket}>🚀</Text>
        <View style={styles.flames}>
          <Text style={styles.flame}>🔥</Text>
          <Text style={styles.flame}>🔥</Text>
        </View>
      </Animated.View>
      
      <Animated.View style={[styles.loadingContent, {opacity: fadeIn}]}>
        <Text style={styles.loadingTitle}>STRATOSPHERE V2</Text>
        <SpinningLogo size={80} color="#00D4FF" />
        <Text style={styles.loadingSubtitle}>Launching your development assistant...</Text>
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
        Animated.timing(pulseAnim, {toValue: 1.2, duration: 1000, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 1, duration: 1000, useNativeDriver: true}),
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
    <View style={styles.darkContainer}>
      <ScrollView contentContainerStyle={styles.spaceScrollContent}>
        <Text style={styles.spaceTitle}>🎤 Voice Command Center</Text>
        <Text style={styles.spaceDescription}>
          Transmit your voice commands to mission control
        </Text>
        
        <View style={styles.voiceControls}>
          <Animated.View style={{transform: [{scale: pulseAnim}]}}>
            <TouchableOpacity 
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={toggleRecording}
            >
              <Text style={styles.recordButtonText}>
                {isRecording ? '⏹️ Stop' : '🎙️ Record'}
              </Text>
            </TouchableOpacity>
          </Animated.View>
          
          <View style={styles.spaceCard}>
            <Text style={styles.cardTitle}>Mission Status</Text>
            <Text style={styles.cardText}>Status: {isRecording ? 'Recording...' : 'Standby'}</Text>
            <Text style={styles.cardText}>Duration: 0:00</Text>
            <Text style={styles.cardText}>Signal: Strong</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.spaceBackButton} onPress={() => navigateTo('Main')}>
          <Text style={styles.spaceBackButtonText}>← Return to Base</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

// Chat Screen
const ChatScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.darkContainer}>
    <View style={styles.spaceHeader}>
      <Text style={styles.spaceTitle}>💬 Communication Hub</Text>
    </View>
    
    <ScrollView style={styles.chatMessages} contentContainerStyle={styles.messagesContent}>
      <View style={styles.messageReceived}>
        <Text style={styles.messageText}>🤖 Mission Control here. Ready to assist with your development mission.</Text>
      </View>
      
      <View style={styles.messageSent}>
        <Text style={styles.messageSentText}>I need help optimizing my React Native app performance</Text>
      </View>
      
      <View style={styles.messageReceived}>
        <Text style={styles.messageText}>🚀 Roger that! Let's analyze your app's performance metrics and identify optimization opportunities.</Text>
      </View>
    </ScrollView>
    
    <View style={styles.spaceChatInput}>
      <TextInput
        style={styles.spaceTextInput}
        placeholder="Transmit message to mission control..."
        placeholderTextColor="#666"
      />
      <TouchableOpacity style={styles.spaceSendButton}>
        <Text style={styles.spaceSendButtonText}>🚀</Text>
      </TouchableOpacity>
    </View>
    
    <TouchableOpacity style={styles.spaceBackButton} onPress={() => navigateTo('Main')}>
      <Text style={styles.spaceBackButtonText}>← Return to Base</Text>
    </TouchableOpacity>
  </View>
);

// Projects Screen
const ProjectsScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.darkContainer}>
    <ScrollView contentContainerStyle={styles.spaceScrollContent}>
      <Text style={styles.spaceTitle}>📁 Mission Control Center</Text>
      <Text style={styles.spaceDescription}>
        Monitor and manage your active development missions
      </Text>
      
      <View style={styles.projectList}>
        <View style={styles.spaceProjectCard}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>🚀 Stratosphere Mobile</Text>
            <View style={styles.statusActive} />
          </View>
          <Text style={styles.projectDescription}>React Native mobile command center</Text>
          <Text style={styles.projectStatus}>Status: Mission Active</Text>
        </View>
        
        <View style={styles.spaceProjectCard}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>🌐 HTN25 Ground Control</Text>
            <View style={styles.statusDevelopment} />
          </View>
          <Text style={styles.projectDescription}>Desktop mission control interface</Text>
          <Text style={styles.projectStatus}>Status: Under Development</Text>
        </View>
        
        <View style={styles.spaceProjectCard}>
          <View style={styles.projectHeader}>
            <Text style={styles.projectTitle}>🤖 AI Navigator</Text>
            <View style={styles.statusPlanning} />
          </View>
          <Text style={styles.projectDescription}>Intelligent voice guidance system</Text>
          <Text style={styles.projectStatus}>Status: Mission Planning</Text>
        </View>
      </View>
      
      <TouchableOpacity style={styles.spaceAddButton}>
        <Text style={styles.spaceAddButtonText}>🛸 Launch New Mission</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.spaceBackButton} onPress={() => navigateTo('Main')}>
        <Text style={styles.spaceBackButtonText}>← Return to Base</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);

// Settings Screen
const SettingsScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.darkContainer}>
    <ScrollView contentContainerStyle={styles.spaceScrollContent}>
      <Text style={styles.spaceTitle}>⚙️ System Configuration</Text>
      <Text style={styles.spaceDescription}>
        Configure your spacecraft systems and connections
      </Text>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>🛰️ Ground Control Connection</Text>
        <View style={styles.spaceSettingItem}>
          <Text style={styles.settingLabel}>Ground Station IP:</Text>
          <TextInput style={styles.spaceSettingInput} value="192.168.1.100" />
        </View>
        <View style={styles.spaceSettingItem}>
          <Text style={styles.settingLabel}>Communication Port:</Text>
          <TextInput style={styles.spaceSettingInput} value="3000" />
        </View>
      </View>
      
      <View style={styles.settingsSection}>
        <Text style={styles.sectionTitle}>🎮 Interface Preferences</Text>
        <View style={styles.spaceSettingItem}>
          <Text style={styles.settingLabel}>Theme: Space Dark</Text>
          <TouchableOpacity style={styles.spaceToggleButton}>
            <Text style={styles.spaceToggleButtonText}>Switch</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.spaceSettingItem}>
          <Text style={styles.settingLabel}>Voice Quality: Ultra</Text>
          <TouchableOpacity style={styles.spaceToggleButton}>
            <Text style={styles.spaceToggleButtonText}>Adjust</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.spaceSaveButton}>
        <Text style={styles.spaceSaveButtonText}>💾 Save Configuration</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.spaceBackButton} onPress={() => navigateTo('Main')}>
        <Text style={styles.spaceBackButtonText}>← Return to Base</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);

// Enhanced Main Screen with space theme
const MainScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.darkContainer}>
    <ScrollView contentContainerStyle={styles.spaceScrollContent}>
      <View style={styles.mainHeader}>
        <SpinningLogo size={60} color="#00D4FF" />
        <Text style={styles.spaceMainTitle}>STRATOSPHERE</Text>
        <Text style={styles.spaceMainSubtitle}>Mobile Command Center</Text>
      </View>
      
      <Text style={styles.spaceDescription}>
        Your personal spacecraft for development missions
      </Text>
      
      <View style={styles.spaceFeatureGrid}>
        <TouchableOpacity 
          style={styles.spaceFeatureCard} 
          onPress={() => navigateTo('Voice')}
        >
          <Text style={styles.spaceFeatureIcon}>🎙️</Text>
          <Text style={styles.spaceFeatureTitle}>Voice Command</Text>
          <Text style={styles.spaceFeatureDescription}>Transmit voice commands</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.spaceFeatureCard} 
          onPress={() => navigateTo('Chat')}
        >
          <Text style={styles.spaceFeatureIcon}>💬</Text>
          <Text style={styles.spaceFeatureTitle}>Communication</Text>
          <Text style={styles.spaceFeatureDescription}>Text-based mission control</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.spaceFeatureCard} 
          onPress={() => navigateTo('Projects')}
        >
          <Text style={styles.spaceFeatureIcon}>🛸</Text>
          <Text style={styles.spaceFeatureTitle}>Mission Center</Text>
          <Text style={styles.spaceFeatureDescription}>Manage active missions</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.spaceFeatureCard} 
          onPress={() => navigateTo('Settings')}
        >
          <Text style={styles.spaceFeatureIcon}>⚙️</Text>
          <Text style={styles.spaceFeatureTitle}>System Config</Text>
          <Text style={styles.spaceFeatureDescription}>Spacecraft settings</Text>
        </TouchableOpacity>
      </View>
      
      <TouchableOpacity style={styles.spaceBackButton} onPress={() => navigateTo('Setup')}>
        <Text style={styles.spaceBackButtonText}>← Pre-flight Check</Text>
      </TouchableOpacity>
    </ScrollView>
  </View>
);

// Space-themed Onboarding
const OnboardingScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.darkContainer}>
    <View style={styles.spaceScreen}>
      <SpinningLogo size={100} color="#00D4FF" />
      <Text style={styles.spaceWelcomeTitle}>WELCOME TO STRATOSPHERE</Text>
      <Text style={styles.spaceDescription}>
        Your personal spacecraft for development missions.{'\n'}
        Ready to launch into the coding stratosphere?
      </Text>
      
      <TouchableOpacity 
        style={styles.spacePrimaryButton}
        onPress={() => navigateTo('Setup')}
      >
        <Text style={styles.spacePrimaryButtonText}>🚀 Begin Mission</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.spaceSecondaryButton}
        onPress={() => navigateTo('Main')}
      >
        <Text style={styles.spaceSecondaryButtonText}>Skip Pre-flight →</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Space-themed Setup
const SetupScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.darkContainer}>
    <View style={styles.spaceScreen}>
      <Text style={styles.spaceTitle}>🛰️ Pre-flight Systems Check</Text>
      <Text style={styles.spaceDescription}>
        Establishing connection with ground control for optimal mission performance
      </Text>
      
      <View style={styles.spaceSetupCard}>
        <Text style={styles.cardTitle}>Ground Control Status</Text>
        <View style={styles.statusRow}>
          <Text style={styles.cardText}>Ground Station IP: 192.168.1.100</Text>
          <View style={styles.statusActive} />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.cardText}>Communication Port: 3000</Text>
          <View style={styles.statusActive} />
        </View>
        <View style={styles.statusRow}>
          <Text style={styles.cardText}>Signal Strength: Excellent</Text>
          <View style={styles.statusActive} />
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.spacePrimaryButton}
        onPress={() => navigateTo('Main')}
      >
        <Text style={styles.spacePrimaryButtonText}>🚀 Launch Mission</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.spaceSecondaryButton}
        onPress={() => navigateTo('Onboarding')}
      >
        <Text style={styles.spaceSecondaryButtonText}>← Abort Mission</Text>
      </TouchableOpacity>
    </View>
  </View>
);

// Main App Component - Space Theme Active!
const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Loading');
  
  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  return (
    <>
      <StatusBar 
        barStyle="light-content"
        backgroundColor="#0A0A0A"
        translucent={false}
      />
      <SafeAreaView style={styles.darkContainer}>
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
  darkContainer: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  spaceScrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  spaceScreen: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Loading screen styles
  loadingScreen: {
    flex: 1,
    backgroundColor: '#000011',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stars: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 1,
  },
  rocketContainer: {
    alignItems: 'center',
    position: 'absolute',
  },
  rocket: {
    fontSize: 60,
  },
  flames: {
    flexDirection: 'row',
    marginTop: -10,
  },
  flame: {
    fontSize: 20,
    marginHorizontal: 2,
  },
  loadingContent: {
    alignItems: 'center',
    marginTop: 50,
  },
  loadingTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00D4FF',
    letterSpacing: 4,
    marginBottom: 30,
  },
  loadingSubtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 20,
  },

  // Logo styles
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

  // Typography
  spaceTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#00D4FF',
    letterSpacing: 1,
  },
  spaceMainTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#00D4FF',
    letterSpacing: 2,
    marginLeft: 10,
  },
  spaceMainSubtitle: {
    fontSize: 14,
    color: '#666',
    letterSpacing: 1,
  },
  spaceWelcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#00D4FF',
    letterSpacing: 2,
    marginTop: 20,
    marginBottom: 15,
    textAlign: 'center',
  },
  spaceDescription: {
    fontSize: 16,
    textAlign: 'center',
    color: '#AAA',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },

  // Buttons
  spacePrimaryButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
    shadowColor: '#00D4FF',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spacePrimaryButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  spaceSecondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#333',
    minWidth: 200,
    alignItems: 'center',
  },
  spaceSecondaryButtonText: {
    color: '#AAA',
    fontSize: 16,
    fontWeight: '500',
  },
  spaceBackButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 20,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  spaceBackButtonText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '500',
  },

  // Cards
  spaceSetupCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 25,
    borderRadius: 16,
    marginBottom: 30,
    minWidth: 300,
    borderWidth: 1,
    borderColor: '#333',
  },
  spaceCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    minWidth: 280,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#00D4FF',
  },
  cardText: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 8,
  },

  // Main screen
  mainHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },

  // Feature grid
  spaceFeatureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  spaceFeatureCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    margin: 8,
    width: 150,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  spaceFeatureIcon: {
    fontSize: 36,
    marginBottom: 12,
  },
  spaceFeatureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#00D4FF',
    marginBottom: 8,
  },
  spaceFeatureDescription: {
    fontSize: 12,
    textAlign: 'center',
    color: '#888',
    lineHeight: 16,
  },

  // Voice screen
  voiceControls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButton: {
    backgroundColor: '#FF4444',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 30,
    shadowColor: '#FF4444',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  recordingButton: {
    backgroundColor: '#FF6666',
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },

  // Chat screen
  spaceHeader: {
    padding: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  chatMessages: {
    flex: 1,
    padding: 15,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageReceived: {
    backgroundColor: 'rgba(0, 212, 255, 0.1)',
    padding: 15,
    borderRadius: 18,
    marginBottom: 10,
    alignSelf: 'flex-start',
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: 'rgba(0, 212, 255, 0.3)',
  },
  messageSent: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 15,
    borderRadius: 18,
    marginBottom: 10,
    alignSelf: 'flex-end',
    maxWidth: '85%',
    borderWidth: 1,
    borderColor: '#333',
  },
  messageText: {
    fontSize: 16,
    color: '#AAA',
  },
  messageSentText: {
    fontSize: 16,
    color: '#FFF',
  },
  spaceChatInput: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderTopWidth: 1,
    borderTopColor: '#333',
    alignItems: 'center',
  },
  spaceTextInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginRight: 10,
    fontSize: 16,
    color: '#FFF',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  spaceSendButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  spaceSendButtonText: {
    fontSize: 18,
  },

  // Projects screen
  projectList: {
    marginBottom: 30,
  },
  spaceProjectCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 16,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#333',
  },
  projectHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#00D4FF',
    flex: 1,
  },
  projectDescription: {
    fontSize: 14,
    color: '#AAA',
    marginBottom: 8,
  },
  projectStatus: {
    fontSize: 12,
    color: '#888',
    fontWeight: '500',
  },
  statusActive: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00FF88',
  },
  statusDevelopment: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFB800',
  },
  statusPlanning: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FF4444',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  spaceAddButton: {
    backgroundColor: '#00FF88',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#00FF88',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spaceAddButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // Settings screen
  settingsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#00D4FF',
  },
  spaceSettingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#333',
  },
  settingLabel: {
    fontSize: 16,
    color: '#AAA',
    flex: 1,
  },
  spaceSettingInput: {
    borderWidth: 1,
    borderColor: '#444',
    borderRadius: 8,
    padding: 10,
    fontSize: 16,
    minWidth: 130,
    textAlign: 'right',
    color: '#FFF',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  spaceToggleButton: {
    backgroundColor: '#00D4FF',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 8,
  },
  spaceToggleButtonText: {
    color: '#000',
    fontSize: 14,
    fontWeight: 'bold',
  },
  spaceSaveButton: {
    backgroundColor: '#00FF88',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 25,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#00FF88',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  spaceSaveButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;