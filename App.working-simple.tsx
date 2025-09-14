import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
  TouchableOpacity,
} from 'react-native';

const App: React.FC = () => {
  const [screen, setScreen] = React.useState('home');

  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🚀 Stratosphere Mobile</Text>
          <Text style={styles.subtitle}>Simplified Version</Text>
        </View>
        
        <View style={styles.nav}>
          <TouchableOpacity 
            style={[styles.button, screen === 'home' && styles.activeButton]}
            onPress={() => setScreen('home')}
          >
            <Text style={styles.buttonText}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, screen === 'chat' && styles.activeButton]}
            onPress={() => setScreen('chat')}
          >
            <Text style={styles.buttonText}>Chat</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.button, screen === 'settings' && styles.activeButton]}
            onPress={() => setScreen('settings')}
          >
            <Text style={styles.buttonText}>Settings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {screen === 'home' && (
            <View style={styles.screen}>
              <Text style={styles.screenTitle}>🏠 Home Screen</Text>
              <Text style={styles.description}>
                Welcome to Stratosphere Mobile! This simplified version tests
                basic React Native functionality without complex dependencies.
              </Text>
            </View>
          )}
          
          {screen === 'chat' && (
            <View style={styles.screen}>
              <Text style={styles.screenTitle}>💬 Chat Screen</Text>
              <Text style={styles.description}>
                Chat functionality will be implemented here.
                Voice recording and API communication coming soon!
              </Text>
            </View>
          )}
          
          {screen === 'settings' && (
            <View style={styles.screen}>
              <Text style={styles.screenTitle}>⚙️ Settings Screen</Text>
              <Text style={styles.description}>
                App settings and configuration options.
                Theme switching and server setup will be added here.
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  nav: {
    flexDirection: 'row',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  button: {
    flex: 1,
    padding: 12,
    margin: 5,
    borderRadius: 8,
    backgroundColor: '#e9e9e9',
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#007AFF',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    lineHeight: 24,
  },
});

export default App;