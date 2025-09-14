import React from 'react';
import {
  SafeAreaView,
  Text,
  View,
  StyleSheet,
  StatusBar,
} from 'react-native';

const App = () => {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#FF0000" />
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>🚀 TEST BUILD - THIS IS RED! 🚀</Text>
          <Text style={styles.subtitle}>If you see this RED screen, the build system is working!</Text>
          <Text style={styles.subtitle}>Current time: {new Date().toLocaleTimeString()}</Text>
        </View>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FF0000', // Bright red - impossible to miss!
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 10,
  },
});

export default App;