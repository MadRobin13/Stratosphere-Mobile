import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import {useTheme} from '../contexts/ThemeContext';
import {useConnection} from '../contexts/ConnectionContext';
import {RootStackParamList} from '../types';

type SetupScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Setup'>;

interface Props {
  navigation: SetupScreenNavigationProp;
}

const SetupScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {connect, isConnected, isConnecting, lastError, healthCheck} = useConnection();
  
  const [host, setHost] = useState('192.168.1.100');
  const [port, setPort] = useState('3000');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [connectionSuccess, setConnectionSuccess] = useState(false);

  useEffect(() => {
    if (isConnected) {
      setConnectionSuccess(true);
    }
  }, [isConnected]);

  const validateInputs = () => {
    if (!host.trim()) {
      Alert.alert('Error', 'Please enter a valid host address');
      return false;
    }
    
    const portNumber = parseInt(port);
    if (!port.trim() || isNaN(portNumber) || portNumber < 1 || portNumber > 65535) {
      Alert.alert('Error', 'Please enter a valid port number (1-65535)');
      return false;
    }
    
    return true;
  };

  const handleTestConnection = async () => {
    if (!validateInputs()) return;
    
    setIsTestingConnection(true);
    
    try {
      const connected = await connect(host.trim(), parseInt(port));
      if (connected) {
        // Test the connection with health check
        const healthy = await healthCheck();
        if (healthy) {
          Alert.alert(
            'Success!',
            'Connected to your computer app successfully.',
            [{text: 'OK'}]
          );
          setConnectionSuccess(true);
        } else {
          Alert.alert(
            'Connection Issue',
            'Connected but the server is not responding properly. Please check your computer app.',
            [{text: 'OK'}]
          );
        }
      } else {
        Alert.alert(
          'Connection Failed',
          lastError || 'Could not connect to the computer app. Please check your settings and try again.',
          [{text: 'OK'}]
        );
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'An unexpected error occurred. Please try again.',
        [{text: 'OK'}]
      );
    } finally {
      setIsTestingConnection(false);
    }
  };

  const handleContinue = () => {
    if (isConnected) {
      navigation.replace('Main');
    } else {
      Alert.alert(
        'No Connection',
        'You can continue without a connection, but some features will be limited. Would you like to continue anyway?',
        [
          {text: 'Cancel', style: 'cancel'},
          {text: 'Continue', onPress: () => navigation.replace('Main')},
        ]
      );
    }
  };

  const renderConnectionStatus = () => {
    if (isTestingConnection || isConnecting) {
      return (
        <View style={[styles.statusContainer, {backgroundColor: theme.colors.warning + '20'}]}>
          <ActivityIndicator size="small" color={theme.colors.warning} />
          <Text style={[styles.statusText, {color: theme.colors.warning}]}>
            Connecting...
          </Text>
        </View>
      );
    }
    
    if (connectionSuccess && isConnected) {
      return (
        <View style={[styles.statusContainer, {backgroundColor: theme.colors.success + '20'}]}>
          <Icon name="checkmark-circle" size={20} color={theme.colors.success} />
          <Text style={[styles.statusText, {color: theme.colors.success}]}>
            Connected successfully!
          </Text>
        </View>
      );
    }
    
    if (lastError) {
      return (
        <View style={[styles.statusContainer, {backgroundColor: theme.colors.error + '20'}]}>
          <Icon name="alert-circle" size={20} color={theme.colors.error} />
          <Text style={[styles.statusText, {color: theme.colors.error}]}>
            {lastError}
          </Text>
        </View>
      );
    }
    
    return null;
  };

  const renderInstructions = () => (
    <View style={styles.instructionsContainer}>
      <Text style={[styles.instructionsTitle, {color: theme.colors.text}]}>
        How to Connect
      </Text>
      
      <View style={styles.step}>
        <View style={[styles.stepNumber, {backgroundColor: theme.colors.primary}]}>
          <Text style={styles.stepNumberText}>1</Text>
        </View>
        <Text style={[styles.stepText, {color: theme.colors.textSecondary}]}>
          Make sure your computer app is running and the HTTP API is enabled on the specified port (default: 3000)
        </Text>
      </View>
      
      <View style={styles.step}>
        <View style={[styles.stepNumber, {backgroundColor: theme.colors.primary}]}>
          <Text style={styles.stepNumberText}>2</Text>
        </View>
        <Text style={[styles.stepText, {color: theme.colors.textSecondary}]}>
          Enter your computer's IP address (check your network settings)
        </Text>
      </View>
      
      <View style={styles.step}>
        <View style={[styles.stepNumber, {backgroundColor: theme.colors.primary}]}>
          <Text style={styles.stepNumberText}>3</Text>
        </View>
        <Text style={[styles.stepText, {color: theme.colors.textSecondary}]}>
          Make sure both devices are on the same network
        </Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          
          {/* Header */}
          <LinearGradient
            colors={[theme.colors.primary + '20', theme.colors.secondary + '10']}
            style={styles.header}>
            <Icon name="wifi" size={48} color={theme.colors.primary} />
            <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
              Connect to Computer
            </Text>
            <Text style={[styles.headerSubtitle, {color: theme.colors.textSecondary}]}>
              Set up connection to your Voice Dev Assistant
            </Text>
          </LinearGradient>

          {/* Connection Form */}
          <View style={styles.formContainer}>
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: theme.colors.text}]}>
                Computer IP Address
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={host}
                onChangeText={setHost}
                placeholder="192.168.1.100"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="numeric"
                autoCapitalize="none"
                autoCorrect={false}
              />
              <Text style={[styles.inputHint, {color: theme.colors.textMuted}]}>
                Find this in your network settings or use ipconfig/ifconfig
              </Text>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, {color: theme.colors.text}]}>
                Port Number
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface,
                    color: theme.colors.text,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={port}
                onChangeText={setPort}
                placeholder="3001"
                placeholderTextColor={theme.colors.textMuted}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Text style={[styles.inputHint, {color: theme.colors.textMuted}]}>
                Default is 3001 (matches your computer app configuration)
              </Text>
            </View>

            {renderConnectionStatus()}
          </View>

          {renderInstructions()}

          {/* Action Buttons */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[
                styles.button,
                styles.testButton,
                {
                  borderColor: theme.colors.primary,
                  backgroundColor: 'transparent',
                },
                (isTestingConnection || isConnecting) && styles.buttonDisabled,
              ]}
              onPress={handleTestConnection}
              disabled={isTestingConnection || isConnecting}>
              {isTestingConnection || isConnecting ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Icon name="pulse" size={20} color={theme.colors.primary} />
              )}
              <Text style={[styles.testButtonText, {color: theme.colors.primary}]}>
                Test Connection
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.button,
                styles.continueButton,
                {backgroundColor: theme.colors.primary},
              ]}
              onPress={handleContinue}>
              <Text style={styles.continueButtonText}>
                Continue
              </Text>
              <Icon name="arrow-forward" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
    marginHorizontal: 20,
    marginTop: 20,
    borderRadius: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  formContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    height: 56,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  inputHint: {
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  instructionsContainer: {
    paddingHorizontal: 20,
    marginTop: 30,
  },
  instructionsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  stepNumberText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  stepText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
    marginTop: 2,
  },
  buttonContainer: {
    paddingHorizontal: 20,
    marginTop: 40,
  },
  button: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    marginBottom: 12,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  testButton: {
    borderWidth: 2,
  },
  continueButton: {
    // backgroundColor set dynamically
  },
  testButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
});

export default SetupScreen;