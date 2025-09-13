import React from 'react';
import {StatusBar, LogBox} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createStackNavigator} from '@react-navigation/stack';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';

import {AppProvider} from './src/contexts/AppContext';
import {ThemeProvider} from './src/contexts/ThemeContext';
import {ConnectionProvider} from './src/contexts/ConnectionContext';

import OnboardingScreen from './src/screens/OnboardingScreen';
import SetupScreen from './src/screens/SetupScreen';
import MainTabNavigator from './src/navigation/MainTabNavigator';

import {RootStackParamList} from './src/types';

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