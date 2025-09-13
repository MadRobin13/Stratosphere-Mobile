import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
  ViewStyle,
  Vibration,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {useTheme} from '../contexts/ThemeContext';

interface VoiceButtonProps {
  isListening: boolean;
  isEnabled: boolean;
  onPressIn: () => void;
  onPressOut: () => void;
  style?: ViewStyle;
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  disabled?: boolean;
}

const VoiceButton: React.FC<VoiceButtonProps> = ({
  isListening,
  isEnabled,
  onPressIn,
  onPressOut,
  style,
  size = 'medium',
  showText = true,
  disabled = false,
}) => {
  const {theme} = useTheme();
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isListening) {
      // Start pulse animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Start glow animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      // Stop animations
      pulseAnim.stopAnimation();
      glowAnim.stopAnimation();
      
      // Reset to original state
      Animated.parallel([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [isListening, pulseAnim, glowAnim]);

  const handlePressIn = () => {
    if (disabled || !isEnabled) return;
    
    Vibration.vibrate(50); // Haptic feedback
    
    Animated.timing(scaleAnim, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
    
    onPressIn();
  };

  const handlePressOut = () => {
    if (disabled || !isEnabled) return;
    
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 100,
      useNativeDriver: true,
    }).start();
    
    onPressOut();
  };

  const getSizeConfig = () => {
    switch (size) {
      case 'small':
        return {
          buttonSize: 48,
          iconSize: 20,
          fontSize: 12,
        };
      case 'large':
        return {
          buttonSize: 80,
          iconSize: 32,
          fontSize: 16,
        };
      default:
        return {
          buttonSize: 64,
          iconSize: 24,
          fontSize: 14,
        };
    }
  };

  const sizeConfig = getSizeConfig();
  
  const buttonColor = disabled || !isEnabled
    ? theme.colors.textMuted
    : isListening
    ? theme.colors.voiceButtonActive
    : theme.colors.primary;

  const glowColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [`${theme.colors.voiceButtonActive}00`, `${theme.colors.voiceButtonActive}40`],
  });

  const dynamicStyles = StyleSheet.create({
    button: {
      width: sizeConfig.buttonSize,
      height: sizeConfig.buttonSize,
      borderRadius: sizeConfig.buttonSize / 2,
      backgroundColor: buttonColor,
      justifyContent: 'center',
      alignItems: 'center',
      elevation: isListening ? 8 : 4,
      shadowColor: buttonColor,
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: isListening ? 0.3 : 0.2,
      shadowRadius: isListening ? 8 : 4,
    },
    glow: {
      position: 'absolute',
      width: sizeConfig.buttonSize + 20,
      height: sizeConfig.buttonSize + 20,
      borderRadius: (sizeConfig.buttonSize + 20) / 2,
    backgroundColor: glowColor as any,
    },
    text: {
      fontSize: sizeConfig.fontSize,
      fontWeight: '600',
      color: theme.colors.text,
      marginTop: 8,
      textAlign: 'center',
    },
  });

  const getButtonText = () => {
    if (disabled || !isEnabled) return 'Voice Disabled';
    if (isListening) return 'Listening...';
    return 'Hold to Talk';
  };

  return (
    <View style={[styles.container, style]}>
      <Animated.View style={[dynamicStyles.glow, {opacity: glowAnim}]} />
      <Animated.View
        style={[
          {transform: [{scale: Animated.multiply(pulseAnim, scaleAnim)}]},
        ]}>
        <TouchableOpacity
          style={dynamicStyles.button}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          disabled={disabled || !isEnabled}
          activeOpacity={0.8}>
          <Icon
            name={isListening ? 'mic' : disabled || !isEnabled ? 'mic-off' : 'mic-outline'}
            size={sizeConfig.iconSize}
            color="white"
          />
        </TouchableOpacity>
      </Animated.View>
      {showText && (
        <Text style={dynamicStyles.text}>{getButtonText()}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default VoiceButton;