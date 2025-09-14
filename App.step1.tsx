import React from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  StatusBar,
} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';

// Simple placeholder screens
const OnboardingScreen = () => (
  <SafeAreaView style={styles.screen}>
    <Text style={styles.title}>📱 Onboarding</Text>
    <Text style={styles.description}>
      Welcome to Stratosphere Mobile!{'\n'}
      This is the onboarding screen.
    </Text>
  </SafeAreaView>
);

const SetupScreen = () => (
  <SafeAreaView style={styles.screen}>
    <Text style={styles.title}>⚙️ Setup</Text>
    <Text style={styles.description}>
      Configure your server connection here.
    </Text>
  </SafeAreaView>
);

const MainScreen = () => (
  <SafeAreaView style={styles.screen}>
    <Text style={styles.title}>🚀 Main App</Text>
    <Text style={styles.description}>
      This is where the main app functionality will be.
    </Text>
  </SafeAreaView>
);

// Type definition for navigation
type RootStackParamList = {
  Onboarding: undefined;
  Setup: undefined;
  Main: undefined;
};

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <NavigationContainer>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="transparent"
        translucent={true}
      />
      <Stack.Navigator
        initialRouteName="Onboarding"
        screenOptions={{
          headerShown: false,
        }}>
        <Stack.Screen 
          name="Onboarding" 
          component={OnboardingScreen} 
        />
        <Stack.Screen 
          name="Setup" 
          component={SetupScreen} 
        />
        <Stack.Screen 
          name="Main" 
          component={MainScreen}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  title: {
    fontSize: 24,
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
  },
});

export default App;