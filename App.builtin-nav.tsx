import React, {useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
  Animated,
} from 'react-native';

// Define screen types
type ScreenName = 'Onboarding' | 'Setup' | 'Main';

// Individual Screen Components
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

const MainScreen = ({navigateTo}: {navigateTo: (screen: ScreenName) => void}) => (
  <View style={styles.screen}>
    <Text style={styles.title}>🚀 Stratosphere Mobile</Text>
    <Text style={styles.description}>
      Main application screen with voice assistant capabilities.
    </Text>
    
    <View style={styles.featureGrid}>
      <View style={styles.featureCard}>
        <Text style={styles.featureIcon}>🎤</Text>
        <Text style={styles.featureTitle}>Voice Recording</Text>
        <Text style={styles.featureDescription}>Record and send voice messages</Text>
      </View>
      
      <View style={styles.featureCard}>
        <Text style={styles.featureIcon}>💬</Text>
        <Text style={styles.featureTitle}>Chat Interface</Text>
        <Text style={styles.featureDescription}>Text-based communication</Text>
      </View>
      
      <View style={styles.featureCard}>
        <Text style={styles.featureIcon}>📁</Text>
        <Text style={styles.featureTitle}>Project Management</Text>
        <Text style={styles.featureDescription}>Organize your development projects</Text>
      </View>
      
      <View style={styles.featureCard}>
        <Text style={styles.featureIcon}>⚙️</Text>
        <Text style={styles.featureTitle}>Settings</Text>
        <Text style={styles.featureDescription}>Configure app preferences</Text>
      </View>
    </View>
    
    <TouchableOpacity 
      style={styles.secondaryButton}
      onPress={() => navigateTo('Setup')}
    >
      <Text style={styles.secondaryButtonText}>← Back to Setup</Text>
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
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
  featureCard: {
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
});

export default App;