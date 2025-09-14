import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import {useNavigation} from '@react-navigation/native';

import {useTheme} from '../contexts/ThemeContext';
import {useApp} from '../contexts/AppContext';
import {useConnection} from '../contexts/ConnectionContext';
import MessageBubble from '../components/MessageBubble';
import VoiceButton from '../components/VoiceButton';
import VoiceService, {VoiceResult} from '../services/VoiceService';
import {Message} from '../types';

const ChatScreen: React.FC = () => {
  const {theme} = useTheme();
  const {currentSession, addMessage, updateMessage, createNewSession, settings} = useApp();
  const {isConnected, sendMessage, sendVoiceMessage, getChatHistory} = useConnection();
  const navigation = useNavigation();
  
  const [inputText, setInputText] = useState('');
  const [isVoiceListening, setIsVoiceListening] = useState(false);
  const [isVoiceEnabled, setIsVoiceEnabled] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [partialVoiceText, setPartialVoiceText] = useState('');
  
  const scrollViewRef = useRef<ScrollView>(null);
  const inputRef = useRef<TextInput>(null);
  const keyboardHeight = useRef(0);

  useEffect(() => {
    initializeVoice();
    
    const keyboardWillShow = Keyboard.addListener('keyboardWillShow', (e) => {
      keyboardHeight.current = e.endCoordinates.height;
    });
    
    const keyboardWillHide = Keyboard.addListener('keyboardWillHide', () => {
      keyboardHeight.current = 0;
    });

    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
      VoiceService.destroy();
    };
  }, []);

  useEffect(() => {
    if (!currentSession) {
      createNewSession();
    }
  }, [currentSession, createNewSession]);

  useEffect(() => {
    scrollToBottom();
  }, [currentSession?.messages]);

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

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({animated: true});
    }, 100);
  };

  const handleSendMessage = async (text: string, isVoiceMessage = false) => {
    if (!text.trim()) return;
    if (!currentSession) {
      createNewSession();
      return;
    }

    // Clear input first
    setInputText('');
    setPartialVoiceText('');

    // Show typing indicator
    setIsTyping(true);

    try {
      if (isConnected) {
        // Send message via HTTP API
        const context = {
          projectContext: currentSession.projectContext,
          sessionId: currentSession.id,
        };
        
        const result = isVoiceMessage 
          ? await sendVoiceMessage(text.trim(), 'en-US', context)
          : await sendMessage(text.trim(), false, context);

        if (result) {
          // Add both user and assistant messages from API response
          addMessage({
            content: result.userMessage.content,
            role: 'user',
            isVoice: result.userMessage.isVoice,
          });
          
          addMessage({
            content: result.message.content,
            role: 'assistant',
            isVoice: result.message.isVoice,
          });
        } else {
          // If API call failed, add user message and error response
          addMessage({
            content: text.trim(),
            role: 'user',
            isVoice: isVoiceMessage,
          });
          
          addMessage({
            content: 'Sorry, I encountered an error. Please try again.',
            role: 'assistant',
          });
        }
      } else {
        // Add user message first
        addMessage({
          content: text.trim(),
          role: 'user',
          isVoice: isVoiceMessage,
        });
        
        // Show connection error
        setTimeout(() => {
          addMessage({
            content: "I'm not connected to the computer app. Please check your connection and try again.",
            role: 'assistant',
          });
          setIsTyping(false);
        }, 500);
        return;
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add user message if not added yet
      if (currentSession.messages[currentSession.messages.length - 1]?.content !== text.trim()) {
        addMessage({
          content: text.trim(),
          role: 'user',
          isVoice: isVoiceMessage,
        });
      }
      
      addMessage({
        content: 'Sorry, I encountered an error. Please try again.',
        role: 'assistant',
      });
    } finally {
      setIsTyping(false);
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
            handleSendMessage(partialVoiceText, true);
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
        handleSendMessage(result.text, true);
      } else {
        setInputText(result.text);
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

  const handleNewChat = () => {
    createNewSession();
    setInputText('');
    setPartialVoiceText('');
  };

  const renderWelcomeMessage = () => {
    if (currentSession?.messages.length === 0) {
      return (
        <View style={styles.welcomeContainer}>
          <View style={styles.welcomeGradient}>
            <View style={styles.logoContainer}>
              <View style={styles.stratosphereLogo}>
                <View style={styles.orbitRing} />
                <View style={styles.centerDot} />
                <View style={[styles.orbitRing, styles.outerRing]} />
              </View>
            </View>
            <Text style={[styles.welcomeTitle, {color: '#FFFFFF'}]}>
              Stratosphere
            </Text>
            <Text style={[styles.welcomeSubtitle, {color: '#888888'}]}>
              AI-powered development assistant
            </Text>
            
            {/* Project Context Display */}
            {currentSession?.projectContext ? (
              <View style={[styles.projectContextContainer, styles.activeProject]}>
                <View style={styles.projectIndicator} />
                <Text style={[styles.projectContextText, {color: '#FFFFFF'}]}>
                  Active: {currentSession.projectContext.files?.[0]?.name || 'Project Connected'}
                </Text>
              </View>
            ) : (
              <View style={[styles.projectContextContainer, styles.inactiveProject]}>
                <View style={[styles.projectIndicator, styles.inactiveIndicator]} />
                <Text style={[styles.projectContextText, {color: '#666666'}]}>
                  No project context • Connect from Projects tab
                </Text>
              </View>
            )}
            
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <View style={styles.micIcon} />
                </View>
                <Text style={[styles.featureText, {color: '#CCCCCC'}]}>
                  Voice
                </Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <View style={styles.codeIcon}>
                    <View style={styles.codeLine} />
                    <View style={[styles.codeLine, styles.codeLineShort]} />
                  </View>
                </View>
                <Text style={[styles.featureText, {color: '#CCCCCC'}]}>
                  Code
                </Text>
              </View>
              <View style={styles.featureItem}>
                <View style={styles.featureIcon}>
                  <View style={styles.branchIcon}>
                    <View style={styles.branchLine} />
                    <View style={[styles.branchLine, styles.branchSplit]} />
                  </View>
                </View>
                <Text style={[styles.featureText, {color: '#CCCCCC'}]}>
                  Git
                </Text>
              </View>
            </View>
            {!isConnected && (
              <View style={styles.connectionWarning}>
                <View style={styles.warningDot} />
                <Text style={[styles.connectionWarningText, {color: '#FFFFFF'}]}>
                  Connection required for AI features
                </Text>
              </View>
            )}
          </View>
        </View>
      );
    }
    return null;
  };

  const renderMessages = () => {
    if (!currentSession?.messages.length) return null;

    return currentSession.messages.map((message) => (
      <MessageBubble
        key={message.id}
        message={message}
        showTimestamp={true}
      />
    ));
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border}]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}>
          <Icon name="chevron-back" size={24} color={theme.colors.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, {color: '#FFFFFF'}]}>
            Stratosphere
          </Text>
          <View style={styles.connectionStatus}>
            <View
              style={[
                styles.connectionDot,
                {backgroundColor: isConnected ? '#FFFFFF' : '#666666'},
              ]}
            />
            <Text style={[styles.connectionText, {color: '#CCCCCC'}]}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.newChatButton, {backgroundColor: theme.colors.primary}]}
          onPress={handleNewChat}>
          <Icon name="add" size={20} color="white" />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={100}>
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}>
          {renderWelcomeMessage()}
          {renderMessages()}
          {isTyping && (
            <MessageBubble
              message={{
                id: 'typing',
                content: '',
                role: 'assistant',
                timestamp: new Date(),
                isLoading: true,
              }}
              isTyping={true}
            />
          )}
        </ScrollView>

        {/* Input Area */}
        <View style={[styles.inputContainer, {backgroundColor: theme.colors.surface, borderTopColor: theme.colors.border}]}>
          {partialVoiceText ? (
            <View style={[styles.voicePreview, {backgroundColor: theme.colors.surfaceVariant}]}>
              <Icon name="mic" size={16} color={theme.colors.primary} />
              <Text style={[styles.voicePreviewText, {color: theme.colors.text}]}>
                {partialVoiceText}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.inputRow}>
            <TextInput
              ref={inputRef}
              style={[
                styles.textInput,
                {
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  borderColor: theme.colors.border,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Type a message or hold to speak..."
              placeholderTextColor={theme.colors.textMuted}
              multiline
              maxLength={1000}
              editable={!isVoiceListening}
            />
            
            <View style={styles.inputActions}>
              <VoiceButton
                isListening={isVoiceListening}
                isEnabled={isVoiceEnabled}
                onPressIn={handleVoiceStart}
                onPressOut={handleVoiceStop}
                size="small"
                showText={false}
                style={styles.voiceButton}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  {
                    backgroundColor: inputText.trim() ? theme.colors.primary : theme.colors.textMuted,
                  },
                ]}
                onPress={() => handleSendMessage(inputText)}
                disabled={!inputText.trim()}>
                <Icon name="send" size={18} color="white" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    paddingRight: 8,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  connectionText: {
    fontSize: 12,
  },
  newChatButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    paddingTop: 16,
    paddingBottom: 16,
  },
  welcomeContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  welcomeGradient: {
    padding: 32,
    borderRadius: 2,
    alignItems: 'center',
    backgroundColor: '#000000',
    borderWidth: 1,
    borderColor: '#333333',
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
    textAlign: 'center',
  },
  welcomeSubtitle: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  projectContextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 1,
    backgroundColor: 'transparent',
  },
  projectContextText: {
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
    textAlign: 'center',
  },
  featuresContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 24,
    width: '100%',
  },
  featureItem: {
    alignItems: 'center',
    flex: 1,
  },
  featureText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  connectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#FF6B6B',
  },
  connectionWarningText: {
    fontSize: 14,
    marginLeft: 8,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 12 : 16,
    borderTopWidth: 1,
  },
  voicePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 8,
  },
  voicePreviewText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    marginRight: 8,
  },
  inputActions: {
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  voiceButton: {
    marginRight: 8,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Minimalistic Stratosphere Logo
  logoContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  stratosphereLogo: {
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  orbitRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFFFFF',
    opacity: 0.6,
  },
  outerRing: {
    width: 56,
    height: 56,
    borderRadius: 28,
    opacity: 0.3,
  },
  centerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  
  // Project Context Indicators
  activeProject: {
    borderColor: '#FFFFFF',
    borderWidth: 1,
  },
  inactiveProject: {
    borderColor: '#333333',
    borderWidth: 1,
  },
  projectIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  inactiveIndicator: {
    backgroundColor: '#666666',
  },
  
  // Minimalistic Feature Icons
  featureIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  
  // Voice Icon (circle with inner dot)
  micIcon: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#CCCCCC',
    backgroundColor: 'transparent',
  },
  
  // Code Icon (horizontal lines)
  codeIcon: {
    width: 20,
    height: 12,
    justifyContent: 'space-between',
  },
  codeLine: {
    height: 2,
    backgroundColor: '#CCCCCC',
    borderRadius: 1,
    width: '100%',
  },
  codeLineShort: {
    width: '70%',
  },
  
  // Branch Icon (Y-shaped lines)
  branchIcon: {
    width: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  branchLine: {
    position: 'absolute',
    width: 2,
    height: 12,
    backgroundColor: '#CCCCCC',
    borderRadius: 1,
  },
  branchSplit: {
    transform: [{ rotate: '45deg' }],
    height: 8,
    top: 2,
    left: 2,
  },
  
  // Warning Indicator
  warningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FF6B6B',
    marginRight: 8,
  },
});

export default ChatScreen;