import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {StackNavigationProp} from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

import {useTheme} from '../contexts/ThemeContext';
import {useApp} from '../contexts/AppContext';
import {RootStackParamList} from '../types';

type OnboardingScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  'Onboarding'
>;

interface Props {
  navigation: OnboardingScreenNavigationProp;
}

const {width} = Dimensions.get('window');

const onboardingData = [
  {
    id: 1,
    icon: 'sparkles',
    title: 'Welcome to Stratosphere',
    subtitle: 'Your AI-powered mobile development companion',
    description: 'Connect with your computer app to access powerful AI development tools from anywhere.',
  },
  {
    id: 2,
    icon: 'mic',
    title: 'Voice-First Development',
    subtitle: 'Code with your voice',
    description: 'Use natural voice commands to generate, review, and debug code. Just speak and watch the magic happen.',
  },
  {
    id: 3,
    icon: 'git-branch',
    title: 'Repository Management',
    subtitle: 'Manage projects remotely',
    description: 'View, edit, and contribute to your repositories from your mobile device with full context awareness.',
  },
  {
    id: 4,
    icon: 'rocket',
    title: 'Ready to Start?',
    subtitle: 'Let\'s get you connected',
    description: 'Connect to your computer app and start developing with the power of AI assistance.',
  },
];

const OnboardingScreen: React.FC<Props> = ({navigation}) => {
  const {theme} = useTheme();
  const {setIsFirstLaunch} = useApp();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      handleGetStarted();
    }
  };

  const handleSkip = () => {
    handleGetStarted();
  };

  const handleGetStarted = () => {
    setIsFirstLaunch(false);
    navigation.replace('Setup');
  };

  const renderDots = () => {
    return (
      <View style={styles.dotsContainer}>
        {onboardingData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor: index === currentIndex 
                  ? theme.colors.primary 
                  : theme.colors.border,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  };

  const currentData = onboardingData[currentIndex];
  const isLastSlide = currentIndex === onboardingData.length - 1;

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      <LinearGradient
        colors={[theme.colors.background, theme.colors.surface]}
        style={styles.gradient}>
        
        {/* Skip Button */}
        {!isLastSlide && (
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}>
            <Text style={[styles.skipText, {color: theme.colors.textMuted}]}>
              Skip
            </Text>
          </TouchableOpacity>
        )}

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[theme.colors.primary + '20', theme.colors.primary + '10']}
              style={styles.iconGradient}>
              <Icon
                name={currentData.icon}
                size={80}
                color={theme.colors.primary}
              />
            </LinearGradient>
          </View>

          <Text style={[styles.title, {color: theme.colors.text}]}>
            {currentData.title}
          </Text>

          <Text style={[styles.subtitle, {color: theme.colors.primary}]}>
            {currentData.subtitle}
          </Text>

          <Text style={[styles.description, {color: theme.colors.textSecondary}]}>
            {currentData.description}
          </Text>
        </View>

        {/* Navigation */}
        <View style={styles.navigation}>
          {renderDots()}
          
          <View style={styles.buttonContainer}>
            {currentIndex > 0 && (
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.backButton,
                  {borderColor: theme.colors.border}
                ]}
                onPress={() => setCurrentIndex(currentIndex - 1)}>
                <Text style={[styles.backButtonText, {color: theme.colors.text}]}>
                  Back
                </Text>
              </TouchableOpacity>
            )}
            
            <TouchableOpacity
              style={[
                styles.button,
                styles.nextButton,
                {backgroundColor: theme.colors.primary},
                currentIndex === 0 && styles.fullWidthButton,
              ]}
              onPress={handleNext}>
              <Text style={styles.nextButtonText}>
                {isLastSlide ? 'Get Started' : 'Next'}
              </Text>
              <Icon
                name={isLastSlide ? 'rocket' : 'arrow-forward'}
                size={20}
                color="white"
                style={styles.buttonIcon}
              />
            </TouchableOpacity>
          </View>
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
  skipButton: {
    alignSelf: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  iconContainer: {
    marginBottom: 40,
  },
  iconGradient: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: width - 80,
  },
  navigation: {
    paddingHorizontal: 40,
    paddingBottom: 20,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    minWidth: 120,
  },
  fullWidthButton: {
    flex: 1,
  },
  backButton: {
    borderWidth: 2,
    backgroundColor: 'transparent',
  },
  nextButton: {
    marginLeft: 12,
    flex: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  buttonIcon: {
    marginLeft: 8,
  },
});

export default OnboardingScreen;