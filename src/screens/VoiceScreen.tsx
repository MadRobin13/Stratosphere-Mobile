import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import {useNavigation} from '@react-navigation/native';

import {useTheme} from '../contexts/ThemeContext';
import {useApp} from '../contexts/AppContext';
import {useConnection} from '../contexts/ConnectionContext';
import VoiceService, {VoiceResult} from '../services/VoiceService';
import VoiceButton from '../components/VoiceButton';

const {width, height} = Dimensions.get('window');

const VoiceScreen: React.FC = () => {
  const {theme} = useTheme();
  const {currentSession, addMessage, createNewSession, settings} = useApp();
  const {isConnected, sendVoiceMessage} = useConnection();
  const navigation = useNavigation();
  
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [partialVoiceText, setPartialVoiceText] = useState('');
  const [lastResponse, setLastResponse] = useState('');
  
  const waveAnimation = useRef(new Animated.Value(0)).current;
  const responseAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    initializeVoice();
    
    return () => {
      VoiceService.destroy();
    };
  }, []);

  useEffect(() => {
    if (!currentSession) {
      createNewSession();
    }
  }, [currentSession, createNewSession]);

  useEffect(() => {
    if (isVoiceListening) {
      // Start wave animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnimation, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveAnimation.stopAnimation();
      Animated.timing(waveAnimation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVoiceListening, waveAnimation]);

  const initializeVoice = async () => {
    try {
      const hasPermission = await VoiceService.requestPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Microphone Permission Required',
          'Please allow microphone access to use voice features.',
          [{text: 'OK'}]
        );
        return;
      }

      const initialized = await VoiceService.initialize({
        language: 'en-US',
        enablePartialResults: true,
      });
      
      setIsVoiceEnabled(initialized && settings.voiceEnabled);
    } catch (error) {
      console.error('Voice initialization failed:', error);
      setIsVoiceEnabled(false);
    }
  };

  const handleVoiceStart = async () => {
    if (!isVoiceEnabled) return;

    try {
      const started = await VoiceService.startListening(
        handleVoiceResult,
        handleVoiceError,
        () => setIsVoiceListening(true),
        () => {
          setIsVoiceListening(false);
          if (partialVoiceText.trim()) {
            handleSendVoiceMessage(partialVoiceText);
          }
        }
      );

      if (!started) {
        Alert.alert('Voice Error', 'Failed to start voice recognition');
      }
    } catch (error) {
      console.error('Voice start error:', error);
      Alert.alert('Voice Error', 'Failed to start voice recognition');
    }
  };

  const handleVoiceStop = async () => {
    if (!isVoiceListening) return;

    try {
      await VoiceService.stopListening();
    } catch (error) {
      console.error('Voice stop error:', error);
    }
  };

  const handleVoiceResult = (result: VoiceResult) => {
    if (result.isFinal) {
      setPartialVoiceText(result.text);
      if (settings.autoSend) {
        handleSendVoiceMessage(result.text);
      }
    } else {
      setPartialVoiceText(result.text);
    }
  };

  const handleVoiceError = (error: string) => {
    console.error('Voice error:', error);
    setIsVoiceListening(false);
    setPartialVoiceText('');
    Alert.alert('Voice Error', error);
  };

  const handleSendVoiceMessage = async (text: string) => {
    if (!text.trim() || !currentSession) return;

    setIsProcessing(true);
    setPartialVoiceText('');

    try {
      if (isConnected) {
        const context = {
          projectContext: currentSession.projectContext,
          sessionId: currentSession.id,
        };
        
        const result = await sendVoiceMessage(text.trim(), 'en-US', context);

        if (result) {
          addMessage({
            content: result.userMessage.content,
            role: 'user',
            isVoice: true,
          });
          
          addMessage({
            content: result.message.content,
            role: 'assistant',
            isVoice: false,
          });

          setLastResponse(result.message.content);
          
          // Animate response appearance
          Animated.timing(responseAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }).start();

          // Auto-hide after 5 seconds
          setTimeout(() => {
            Animated.timing(responseAnimation, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }).start();
          }, 5000);

        } else {
          addMessage({
            content: text.trim(),
            role: 'user',
            isVoice: true,
          });
          
          addMessage({
            content: 'Sorry, I encountered an error. Please try again.',
            role: 'assistant',
          });
        }
      } else {
        Alert.alert(
          'Not Connected', 
          'Please connect to your computer app to use voice features.'
        );
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
      Alert.alert('Error', 'Failed to process voice message');
    } finally {
      setIsProcessing(false);
    }
  };

  const waveScale = waveAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.2],
  });

  const waveOpacity = waveAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  const renderWaveform = () => {
    const waves = Array.from({length: 5}, (_, index) => (
      <Animated.View
        key={index}
        style={[
          styles.wave,
          {
            transform: [{scale: waveScale}],
            opacity: waveOpacity,
            borderColor: theme.colors.primary,
            width: 60 + index * 40,
            height: 60 + index * 40,
            borderRadius: 30 + index * 20,
            position: 'absolute',
          },
        ]}
      />
    ));

    return <View style={styles.waveContainer}>{waves}</View>;
  };

  const renderProjectContext = () => {
    if (currentSession?.projectContext) {
      return (
        <View style={[styles.projectBanner, {backgroundColor: theme.colors.success + '20'}]}>
          <Icon name="folder-open" size={16} color={theme.colors.success} />
          <Text style={[styles.projectText, {color: theme.colors.success}]}>
            Working on: {currentSession.projectContext.files?.[0]?.name || 'Project Active'}
          </Text>
        </View>
      );
    }
    return null;
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}>
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <Icon name="chevron-back" size={28} color={theme.colors.text} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Text style={[styles.title, {color: theme.colors.text}]}>
              Voice Chat
            </Text>
            <View style={styles.connectionStatus}>
              <View
                style={[
                  styles.connectionDot,
                  {backgroundColor: isConnected ? theme.colors.success : theme.colors.error},
                ]}
              />
              <Text style={[styles.connectionText, {color: theme.colors.textSecondary}]}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </Text>
            </View>
          </View>
          <View style={styles.headerSpacer} />
        </View>

        {renderProjectContext()}

        {/* Main Voice Interface */}
        <View style={styles.voiceInterface}>
          <View style={styles.voiceButtonContainer}>
            {isVoiceListening && renderWaveform()}
            
            <VoiceButton
              isListening={isVoiceListening}
              isEnabled={isVoiceEnabled && isConnected}
              onPressIn={handleVoiceStart}
              onPressOut={handleVoiceStop}
              size="large"
              showText={false}
              disabled={isProcessing}
            />
          </View>

          {/* Status Text */}
          <View style={styles.statusContainer}>
            <Text style={[styles.statusText, {color: theme.colors.text}]}>
              {isProcessing 
                ? 'Processing...'
                : isVoiceListening 
                ? 'Listening...'
                : isVoiceEnabled 
                ? 'Hold to speak'
                : 'Voice not available'
              }
            </Text>
            
            {partialVoiceText ? (
              <Text style={[styles.partialText, {color: theme.colors.textSecondary}]}>
                "{partialVoiceText}"
              </Text>
            ) : null}
          </View>
        </View>

        {/* Response Display */}
        <Animated.View 
          style={[
            styles.responseContainer,
            {
              opacity: responseAnimation,
              backgroundColor: theme.colors.surface,
              borderColor: theme.colors.border,
            }
          ]}>
          <Icon name="chatbubble-ellipses" size={20} color={theme.colors.primary} />
          <Text style={[styles.responseText, {color: theme.colors.text}]}>
            {lastResponse}
          </Text>
        </Animated.View>

        {/* Instructions */}
        <View style={styles.instructions}>
          <Text style={[styles.instructionTitle, {color: theme.colors.text}]}>
            Voice Commands
          </Text>
          <Text style={[styles.instructionText, {color: theme.colors.textSecondary}]}>
            • Hold the microphone button and speak
          </Text>
          <Text style={[styles.instructionText, {color: theme.colors.textSecondary}]}>
            • Ask about code, request reviews, or get explanations
          </Text>
          <Text style={[styles.instructionText, {color: theme.colors.textSecondary}]}>
            • Open a project for better context-aware assistance
          </Text>
        </View>

      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  backButton: {
    paddingRight: 8,
  },
  headerContent: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 36, // Same width as back button for centering
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 14,
  },
  projectBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 20,
  },
  projectText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  voiceInterface: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  voiceButtonContainer: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  waveContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wave: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  statusContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statusText: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  partialText: {
    fontSize: 16,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  responseContainer: {
    marginHorizontal: 20,
    marginBottom: 30,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  responseText: {
    fontSize: 16,
    lineHeight: 22,
    marginLeft: 12,
    flex: 1,
  },
  instructions: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  instructionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 15,
    lineHeight: 20,
    marginBottom: 4,
  },
});

export default VoiceScreen;