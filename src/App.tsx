import React from 'react';
import {StatusBar, LogBox} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppProvider} from './contexts/AppContext';
import {ThemeProvider} from './contexts/ThemeContext';
import {ConnectionProvider} from './contexts/ConnectionContext';

import OnboardingScreen from './screens/OnboardingScreen';
import SetupScreen from './screens/SetupScreen';
import MainTabNavigator from './navigation/MainTabNavigator';

import {RootStackParamList} from './types';

// Suppress specific warnings
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const Stack = createStackNavigator<RootStackParamList>();

const App: React.FC = () => {
  return (
    <GestureHandlerRootView style={{flex: 1}}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppProvider>
            <ConnectionProvider>
              <NavigationContainer>
                <StatusBar 
                  barStyle="light-content"
                  backgroundColor="transparent"
                  translucent={true}
                />
                <Stack.Navigator
                  initialRouteName="Onboarding"
                  screenOptions={{
                    headerShown: false,
                    gestureEnabled: true,
                    cardStyleInterpolator: ({current, layouts}) => {
                      return {
                        cardStyle: {
                          transform: [
                            {
                              translateX: current.progress.interpolate({
                                inputRange: [0, 1],
                                outputRange: [layouts.screen.width, 0],
                              }),
                            },
                          ],
                        },
                      };
                    },
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
                    component={MainTabNavigator}
                  />
                </Stack.Navigator>
              </NavigationContainer>
            </ConnectionProvider>
          </AppProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
};

export default App;