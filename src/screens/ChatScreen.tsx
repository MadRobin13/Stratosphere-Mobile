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
import LinearGradient from 'react-native-linear-gradient';

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
          <LinearGradient
            colors={[theme.colors.primary + '20', theme.colors.secondary + '20']}
            style={styles.welcomeGradient}>
            <Icon name="sparkles" size={48} color={theme.colors.primary} />
            <Text style={[styles.welcomeTitle, {color: theme.colors.text}]}>
              Welcome to Stratosphere
            </Text>
            <Text style={[styles.welcomeSubtitle, {color: theme.colors.textSecondary}]}>
              Your AI-powered mobile development companion
            </Text>
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Icon name="mic" size={20} color={theme.colors.primary} />
                <Text style={[styles.featureText, {color: theme.colors.textSecondary}]}>
                  Voice commands
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="code-slash" size={20} color={theme.colors.primary} />
                <Text style={[styles.featureText, {color: theme.colors.textSecondary}]}>
                  Code assistance
                </Text>
              </View>
              <View style={styles.featureItem}>
                <Icon name="git-branch" size={20} color={theme.colors.primary} />
                <Text style={[styles.featureText, {color: theme.colors.textSecondary}]}>
                  Repository management
                </Text>
              </View>
            </View>
            {!isConnected && (
              <View style={styles.connectionWarning}>
                <Icon name="warning" size={16} color={theme.colors.warning} />
                <Text style={[styles.connectionWarningText, {color: theme.colors.warning}]}>
                  Not connected to computer app
                </Text>
              </View>
            )}
          </LinearGradient>
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
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
            Stratosphere
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
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
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
    marginTop: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 149, 0, 0.1)',
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
});

export default ChatScreen;