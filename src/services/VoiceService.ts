import Voice from '@react-native-voice/voice';
import Tts from 'react-native-tts';
import {PERMISSIONS, request, RESULTS} from 'react-native-permissions';
import {Platform} from 'react-native';

export interface VoiceServiceConfig {
  language: string;
  maxSpeechDuration?: number;
  enablePartialResults?: boolean;
}

export interface VoiceResult {
  text: string;
  confidence?: number;
  isFinal: boolean;
}

export interface TTSConfig {
  language: string;
  pitch: number;
  rate: number;
  quality?: 'low' | 'normal' | 'high' | 'enhanced';
}

class VoiceService {
  private isListening = false;
  private isInitialized = false;
  private currentConfig: VoiceServiceConfig = {
    language: 'en-US',
    maxSpeechDuration: 10000,
    enablePartialResults: true,
  };

  private ttsConfig: TTSConfig = {
    language: 'en-US',
    pitch: 1.0,
    rate: 0.5,
    quality: 'normal',
  };

  private onResultCallback?: (result: VoiceResult) => void;
  private onErrorCallback?: (error: string) => void;
  private onStartCallback?: () => void;
  private onEndCallback?: () => void;

  async initialize(config?: Partial<VoiceServiceConfig>): Promise<boolean> {
    try {
      if (config) {
        this.currentConfig = {...this.currentConfig, ...config};
      }

      // Initialize Voice recognition
      Voice.onSpeechStart = this.onSpeechStart;
      Voice.onSpeechRecognized = this.onSpeechRecognized;
      Voice.onSpeechEnd = this.onSpeechEnd;
      Voice.onSpeechError = this.onSpeechError;
      Voice.onSpeechResults = this.onSpeechResults;
      Voice.onSpeechPartialResults = this.onSpeechPartialResults;
      Voice.onSpeechVolumeChanged = this.onSpeechVolumeChanged;

      // Initialize TTS
      Tts.setDefaultLanguage(this.ttsConfig.language);
      Tts.setDefaultRate(this.ttsConfig.rate);
      Tts.setDefaultPitch(this.ttsConfig.pitch);

      // Set TTS quality if supported
      if (Platform.OS === 'ios') {
        Tts.setDefaultVoice('com.apple.ttsbundle.Samantha-compact');
      }

      this.isInitialized = true;
      return true;
    } catch (error) {
      console.error('Voice service initialization failed:', error);
      return false;
    }
  }

  async requestPermissions(): Promise<boolean> {
    try {
      const permission = Platform.OS === 'ios' 
        ? PERMISSIONS.IOS.MICROPHONE 
        : PERMISSIONS.ANDROID.RECORD_AUDIO;

      const result = await request(permission);
      return result === RESULTS.GRANTED;
    } catch (error) {
      console.error('Permission request failed:', error);
      return false;
    }
  }

  async startListening(
    onResult?: (result: VoiceResult) => void,
    onError?: (error: string) => void,
    onStart?: () => void,
    onEnd?: () => void
  ): Promise<boolean> {
    if (!this.isInitialized) {
      throw new Error('Voice service not initialized');
    }

    if (this.isListening) {
      console.warn('Already listening');
      return false;
    }

    this.onResultCallback = onResult;
    this.onErrorCallback = onError;
    this.onStartCallback = onStart;
    this.onEndCallback = onEnd;

    try {
      await Voice.start(this.currentConfig.language);
      this.isListening = true;
      return true;
    } catch (error) {
      console.error('Failed to start voice recognition:', error);
      this.onErrorCallback?.(error as string);
      return false;
    }
  }

  async stopListening(): Promise<void> {
    if (!this.isListening) return;

    try {
      await Voice.stop();
      this.isListening = false;
    } catch (error) {
      console.error('Failed to stop voice recognition:', error);
      this.isListening = false;
    }
  }

  async cancelListening(): Promise<void> {
    if (!this.isListening) return;

    try {
      await Voice.cancel();
      this.isListening = false;
    } catch (error) {
      console.error('Failed to cancel voice recognition:', error);
      this.isListening = false;
    }
  }

  async speak(text: string, config?: Partial<TTSConfig>): Promise<void> {
    try {
      if (config) {
        const tempConfig = {...this.ttsConfig, ...config};
        Tts.setDefaultLanguage(tempConfig.language);
        Tts.setDefaultRate(tempConfig.rate);
        Tts.setDefaultPitch(tempConfig.pitch);
      }

      await Tts.speak(text);
    } catch (error) {
      console.error('TTS failed:', error);
      throw error;
    }
  }

  async stopSpeaking(): Promise<void> {
    try {
      await Tts.stop();
    } catch (error) {
      console.error('Failed to stop TTS:', error);
    }
  }

  async isSpeaking(): Promise<boolean> {
    try {
      // Note: isSpeaking method may not be available in all TTS versions
      // Return false as a fallback for now
      return false;
    } catch (error) {
      return false;
    }
  }

  // Voice recognition event handlers
  private onSpeechStart = () => {
    console.log('Speech recognition started');
    this.onStartCallback?.();
  };

  private onSpeechRecognized = () => {
    console.log('Speech recognized');
  };

  private onSpeechEnd = () => {
    console.log('Speech recognition ended');
    this.isListening = false;
    this.onEndCallback?.();
  };

  private onSpeechError = (error: any) => {
    console.error('Speech recognition error:', error);
    this.isListening = false;
    this.onErrorCallback?.(error.error?.message || 'Speech recognition error');
  };

  private onSpeechResults = (event: any) => {
    const results = event.value;
    if (results && results.length > 0) {
      this.onResultCallback?.({
        text: results[0],
        confidence: 1.0,
        isFinal: true,
      });
    }
  };

  private onSpeechPartialResults = (event: any) => {
    if (!this.currentConfig.enablePartialResults) return;

    const results = event.value;
    if (results && results.length > 0) {
      this.onResultCallback?.({
        text: results[0],
        confidence: 0.8,
        isFinal: false,
      });
    }
  };

  private onSpeechVolumeChanged = (event: any) => {
    // Handle volume changes if needed
    // console.log('Volume changed:', event.value);
  };

  // Configuration methods
  updateConfig(config: Partial<VoiceServiceConfig>): void {
    this.currentConfig = {...this.currentConfig, ...config};
  }

  updateTTSConfig(config: Partial<TTSConfig>): void {
    this.ttsConfig = {...this.ttsConfig, ...config};
    
    // Apply changes immediately
    Tts.setDefaultLanguage(this.ttsConfig.language);
    Tts.setDefaultRate(this.ttsConfig.rate);
    Tts.setDefaultPitch(this.ttsConfig.pitch);
  }

  getConfig(): VoiceServiceConfig {
    return {...this.currentConfig};
  }

  getTTSConfig(): TTSConfig {
    return {...this.ttsConfig};
  }

  getIsListening(): boolean {
    return this.isListening;
  }

  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  // Cleanup
  async destroy(): Promise<void> {
    try {
      if (this.isListening) {
        await this.cancelListening();
      }
      
      await this.stopSpeaking();
      
      Voice.removeAllListeners();
      this.isInitialized = false;
    } catch (error) {
      console.error('Failed to destroy voice service:', error);
    }
  }
}

export default new VoiceService();