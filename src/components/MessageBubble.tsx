import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../contexts/ThemeContext';
import {Message} from '../types';

interface MessageBubbleProps {
  message: Message;
  onLongPress?: (message: Message) => void;
  showTimestamp?: boolean;
  isTyping?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  message,
  onLongPress,
  showTimestamp = false,
  isTyping = false,
}) => {
  const {theme} = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  const isUser = message.role === 'user';
  const isAssistant = message.role === 'assistant';

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, slideAnim]);

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const messageDate = new Date(date);
    
    if (now.toDateString() === messageDate.toDateString()) {
      return messageDate.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    }
    
    return messageDate.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getBubbleStyle = () => {
    if (isUser) {
      return {
        backgroundColor: theme.colors.chatBubbleUser,
        alignSelf: 'flex-end' as const,
        marginLeft: 50,
        borderTopRightRadius: 4,
      };
    } else {
      return {
        backgroundColor: theme.colors.chatBubbleAssistant,
        alignSelf: 'flex-start' as const,
        marginRight: 50,
        borderTopLeftRadius: 4,
      };
    }
  };

  const getTextStyle = () => {
    return {
      color: isUser ? 'white' : theme.colors.text,
      fontSize: 16,
      lineHeight: 22,
    };
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    return (
      <View style={styles.typingContainer}>
        <View style={styles.typingDot}>
          <ActivityIndicator size="small" color={theme.colors.textMuted} />
        </View>
        <Text style={[styles.typingText, {color: theme.colors.textMuted}]}>
          AI is typing...
        </Text>
      </View>
    );
  };

  const renderMessageContent = () => {
    if (message.isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={isUser ? 'white' : theme.colors.primary} />
          <Text style={[getTextStyle(), styles.loadingText, {marginLeft: 8}]}>
            Processing...
          </Text>
        </View>
      );
    }

    return (
      <View>
        <Text style={getTextStyle()}>
          {message.content}
        </Text>
        {message.isVoice && (
          <View style={styles.voiceIndicator}>
            <Icon
              name="mic"
              size={14}
              color={isUser ? 'white' : theme.colors.textMuted}
            />
            <Text style={[
              styles.voiceText,
              {color: isUser ? 'white' : theme.colors.textMuted}
            ]}>
              Voice message
            </Text>
          </View>
        )}
      </View>
    );
  };

  return (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{translateY: slideAnim}],
        },
      ]}>
      <View style={[styles.container, {alignItems: isUser ? 'flex-end' : 'flex-start'}]}>
        {!isUser && (
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, {backgroundColor: theme.colors.primary}]}>
              <Icon name="sparkles" size={16} color="white" />
            </View>
          </View>
        )}
        
        <View style={styles.messageContainer}>
          <TouchableOpacity
            style={[
              styles.bubble,
              getBubbleStyle(),
              message.isLoading && styles.loadingBubble,
            ]}
            onLongPress={() => onLongPress?.(message)}
            activeOpacity={0.8}>
            {renderMessageContent()}
          </TouchableOpacity>
          
          {showTimestamp && (
            <Text style={[
              styles.timestamp,
              {
                color: theme.colors.textMuted,
                textAlign: isUser ? 'right' : 'left',
              }
            ]}>
              {formatTimestamp(message.timestamp)}
            </Text>
          )}
        </View>
      </View>
      
      {isTyping && renderTypingIndicator()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: 4,
    paddingHorizontal: 16,
  },
  avatarContainer: {
    marginRight: 8,
    marginTop: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  messageContainer: {
    flex: 1,
  },
  bubble: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    maxWidth: '85%',
  },
  loadingBubble: {
    opacity: 0.8,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loadingText: {
    fontStyle: 'italic',
  },
  voiceIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
  },
  voiceText: {
    fontSize: 12,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 16,
  },
  typingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 56,
    paddingVertical: 8,
  },
  typingDot: {
    marginRight: 8,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
});

export default MessageBubble;