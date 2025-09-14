import React, {useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';

// Define screen types
type ScreenName = 'Onboarding' | 'Setup' | 'Main' | 'Voice' | 'Chat' | 'Projects' | 'Settings';

// Voice Recording Screen
const VoiceScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
    <Text style={styles.title}>🎤 Voice Recording</Text>
    <Text style={styles.description}>
      Record voice messages and send them to your development assistant.
    </Text>
    
    <View style={styles.voiceControls}>
      <TouchableOpacity style={styles.recordButton}>
        <Text style={styles.recordButtonText}>🔴 Start Recording</Text>
      </TouchableOpacity>
      
      <View style={styles.statusCard}>
        <Text style={styles.cardTitle}>Recording Status</Text>
        <Text style={styles.cardText}>Status: Ready to record</Text>
        <Text style={styles.cardText}>Duration: 0:00</Text>
        <Text style={styles.cardText}>Quality: High</Text>
      </View>
    </View>
    
    <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Main')}>
      <Text style={styles.backButtonText}>← Back to Main</Text>
    </TouchableOpacity>
  </ScrollView>
);

// Chat Screen
const ChatScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <SafeAreaView style={styles.container}>
    <View style={styles.chatHeader}>
      <Text style={styles.title}>💬 Chat Interface</Text>
    </View>
    
    <ScrollView style={styles.chatMessages} contentContainerStyle={styles.messagesContent}>
      <View style={styles.messageReceived}>
        <Text style={styles.messageText}>Hello! I'm your development assistant. How can I help you today?</Text>
      </View>
      
      <View style={styles.messageSent}>
        <Text style={styles.messageText}>I need help with my React Native app</Text>
      </View>
      
      <View style={styles.messageReceived}>
        <Text style={styles.messageText}>I'd be happy to help! What specific issue are you facing?</Text>
      </View>
    </ScrollView>
    
    <View style={styles.chatInput}>
      <TextInput
        style={styles.textInput}
        placeholder="Type your message..."
        multiline={false}
      />
      <TouchableOpacity style={styles.sendButton}>
        <Text style={styles.sendButtonText}>Send</Text>
      </TouchableOpacity>
    </View>
    
    <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Main')}>
      <Text style={styles.backButtonText}>← Back to Main</Text>
    </TouchableOpacity>
  </SafeAreaView>
);

// Projects Screen
const ProjectsScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
    <Text style={styles.title}>📁 Project Management</Text>
    <Text style={styles.description}>
      Organize and manage your development projects.
    </Text>
    
    <View style={styles.projectList}>
      <View style={styles.projectCard}>
        <Text style={styles.projectTitle}>🚀 Stratosphere Mobile</Text>
        <Text style={styles.projectDescription}>React Native mobile app</Text>
        <Text style={styles.projectStatus}>Status: Active</Text>
      </View>
      
      <View style={styles.projectCard}>
        <Text style={styles.projectTitle}>🌐 HTN25 Desktop</Text>
        <Text style={styles.projectDescription}>Desktop companion app</Text>
        <Text style={styles.projectStatus}>Status: In Development</Text>
      </View>
      
      <View style={styles.projectCard}>
        <Text style={styles.projectTitle}>🤖 AI Assistant</Text>
        <Text style={styles.projectDescription}>Voice AI integration</Text>
        <Text style={styles.projectStatus}>Status: Planning</Text>
      </View>
    </View>
    
    <TouchableOpacity style={styles.addButton}>
      <Text style={styles.addButtonText}>+ Add New Project</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Main')}>
      <Text style={styles.backButtonText}>← Back to Main</Text>
    </TouchableOpacity>
  </ScrollView>
);

// Settings Screen
const SettingsScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
    <Text style={styles.title}>⚙️ Settings</Text>
    <Text style={styles.description}>
      Configure your app preferences and server connection.
    </Text>
    
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>Server Configuration</Text>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Server IP:</Text>
        <TextInput style={styles.settingInput} value="192.168.1.100" />
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Port:</Text>
        <TextInput style={styles.settingInput} value="3000" />
      </View>
    </View>
    
    <View style={styles.settingsSection}>
      <Text style={styles.sectionTitle}>App Preferences</Text>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Theme: Light</Text>
        <TouchableOpacity style={styles.toggleButton}>
          <Text style={styles.toggleButtonText}>Toggle</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.settingItem}>
        <Text style={styles.settingLabel}>Voice Quality: High</Text>
        <TouchableOpacity style={styles.toggleButton}>
          <Text style={styles.toggleButtonText}>Change</Text>
        </TouchableOpacity>
      </View>
    </View>
    
    <TouchableOpacity style={styles.saveButton}>
      <Text style={styles.saveButtonText}>Save Settings</Text>
    </TouchableOpacity>
    
    <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Main')}>
      <Text style={styles.backButtonText}>← Back to Main</Text>
    </TouchableOpacity>
  </ScrollView>
);

// Enhanced Main Screen with clickable cards
const MainScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
    <Text style={styles.title}>🚀 Stratosphere Mobile</Text>
    <Text style={styles.description}>
      Your mobile companion for voice development assistance.
    </Text>
    
    <View style={styles.featureGrid}>
      <TouchableOpacity 
        style={styles.clickableFeatureCard} 
        onPress={() => navigateTo('Voice')}
      >
        <Text style={styles.featureIcon}>🎤</Text>
        <Text style={styles.featureTitle}>Voice Recording</Text>
        <Text style={styles.featureDescription}>Record and send voice messages</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.clickableFeatureCard} 
        onPress={() => navigateTo('Chat')}
      >
        <Text style={styles.featureIcon}>💬</Text>
        <Text style={styles.featureTitle}>Chat Interface</Text>
        <Text style={styles.featureDescription}>Text-based communication</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.clickableFeatureCard} 
        onPress={() => navigateTo('Projects')}
      >
        <Text style={styles.featureIcon}>📁</Text>
        <Text style={styles.featureTitle}>Project Management</Text>
        <Text style={styles.featureDescription}>Organize your development projects</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.clickableFeatureCard} 
        onPress={() => navigateTo('Settings')}
      >
        <Text style={styles.featureIcon}>⚙️</Text>
        <Text style={styles.featureTitle}>Settings</Text>
        <Text style={styles.featureDescription}>Configure app preferences</Text>
      </TouchableOpacity>
    </View>
    
    <TouchableOpacity style={styles.backButton} onPress={() => navigateTo('Setup')}>
      <Text style={styles.backButtonText}>← Back to Setup</Text>
    </TouchableOpacity>
  </ScrollView>
);

// Original screens (Onboarding, Setup) remain the same
const OnboardingScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.screen}>
    <Text style={styles.title}>📱 Welcome to Stratosphere Mobile</Text>
    <Text style={styles.description}>
      Your mobile companion for voice development assistance.
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
      <Text style={styles.secondaryButtonText}>Skip to Main App</Text>
    </TouchableOpacity>
  </View>
);

const SetupScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.screen}>
    <Text style={styles.title}>⚙️ Setup Connection</Text>
    <Text style={styles.description}>
      Configure your server connection to enable voice assistant features.
    </Text>
    
    <View style={styles.setupCard}>
      <Text style={styles.cardTitle}>Server Configuration</Text>
      <Text style={styles.cardText}>Server IP: 192.168.1.100</Text>
      <Text style={styles.cardText}>Port: 3000</Text>
      <Text style={styles.cardText}>Status: Ready to connect</Text>
    </View>
    
    <TouchableOpacity 
      style={styles.primaryButton}
      onPress={() => navigateTo('Main')}
    >
      <Text style={styles.primaryButtonText}>Continue to App</Text>
    </TouchableOpacity>
    
    <TouchableOpacity 
      style={styles.secondaryButton}
      onPress={() => navigateTo('Onboarding')}
    >
      <Text style={styles.secondaryButtonText}>← Back</Text>
    </TouchableOpacity>
  </View>
);

// Main App Component
const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<ScreenName>('Onboarding');
  
  const navigateTo = (screen: ScreenName) => {
    setCurrentScreen(screen);
  };

  return (
    <>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <SafeAreaView style={styles.container}>
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
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    padding: 20,
  },
  screen: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
    marginBottom: 30,
    paddingHorizontal: 20,
  },
  primaryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    marginBottom: 15,
    minWidth: 200,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    minWidth: 200,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  setupCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 30,
    minWidth: 280,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    marginBottom: 30,
  },
  clickableFeatureCard: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 12,
    margin: 8,
    width: 140,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  featureIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 5,
  },
  featureDescription: {
    fontSize: 12,
    textAlign: 'center',
    color: '#666',
    lineHeight: 16,
  },
  backButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  backButtonText: {
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  // Voice Screen Styles
  voiceControls: {
    alignItems: 'center',
    marginBottom: 30,
  },
  recordButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 50,
    marginBottom: 30,
  },
  recordButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  statusCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    minWidth: 250,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  // Chat Screen Styles
  chatHeader: {
    padding: 20,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  chatMessages: {
    flex: 1,
    padding: 15,
  },
  messagesContent: {
    paddingBottom: 20,
  },
  messageReceived: {
    backgroundColor: '#e9e9eb',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    alignSelf: 'flex-start',
    maxWidth: '80%',
  },
  messageSent: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 18,
    marginBottom: 10,
    alignSelf: 'flex-end',
    maxWidth: '80%',
  },
  messageText: {
    fontSize: 16,
    color: '#333',
  },
  chatInput: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    alignItems: 'center',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginRight: 10,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 20,
  },
  sendButtonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  // Projects Screen Styles
  projectList: {
    marginBottom: 30,
  },
  projectCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
    color: '#333',
  },
  projectDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  projectStatus: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  // Settings Screen Styles
  settingsSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  settingInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    fontSize: 16,
    minWidth: 120,
    textAlign: 'right',
  },
  toggleButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default App;