import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppProvider} from './contexts/AppContext';
import {ConnectionProvider} from './contexts/ConnectionContext';
import {ThemeProvider} from './contexts/ThemeContext';

import OnboardingScreen from './screens/OnboardingScreen';
import SetupScreen from './screens/SetupScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import {RootStackParamList} from './types';

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  console.log('🚀 App.tsx: Starting with new navigation and context providers');
  
  return (
    <SafeAreaProvider>
      <AppProvider>
        <ThemeProvider>
          <ConnectionProvider>
            <NavigationContainer>
              <StatusBar barStyle="light-content" backgroundColor="#000000" />
              <Stack.Navigator
                initialRouteName="Onboarding"
                screenOptions={{
                  headerShown: false,
                  cardStyle: {backgroundColor: '#000000'},
                }}>
                <Stack.Screen name="Onboarding" component={OnboardingScreen} />
                <Stack.Screen name="Setup" component={SetupScreen} />
                <Stack.Screen name="Main" component={MainTabNavigator} />
              </Stack.Navigator>
            </NavigationContainer>
          </ConnectionProvider>
        </ThemeProvider>
      </AppProvider>
    </SafeAreaProvider>
  );
};

export default App;