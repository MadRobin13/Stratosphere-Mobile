import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';

const App: React.FC = () => {
  return (
    <>
      <StatusBar barStyle="dark-content" />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🚀 Stratosphere Mobile</Text>
          <Text style={styles.subtitle}>Minimal Test Version</Text>
          <Text style={styles.description}>
            If you can see this, React Native is working!
          </Text>
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
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    textAlign: 'center',
    color: '#666',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    color: '#888',
    lineHeight: 24,
  },
});

export default App;