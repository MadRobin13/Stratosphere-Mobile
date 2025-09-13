import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  TextInput,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';

import {useTheme} from '../contexts/ThemeContext';
import {useApp} from '../contexts/AppContext';
import {useConnection} from '../contexts/ConnectionContext';

const SettingsScreen: React.FC = () => {
  const {theme, toggleTheme, setTheme, themeMode} = useTheme();
  const {settings, updateSettings, clearAllSessions} = useApp();
  const {config, isConnected, disconnect, reconnect, getDebugInfo, clearChatHistory} = useConnection();
  
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleThemeChange = () => {
    const modes = ['light', 'dark', 'system'] as const;
    const currentIndex = modes.indexOf(themeMode);
    const nextMode = modes[(currentIndex + 1) % modes.length];
    setTheme(nextMode);
  };

  const handleClearChat = () => {
    Alert.alert(
      'Clear All Chats',
      'This will permanently delete all your chat history both locally and on the server. This action cannot be undone.',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Clear All',
          style: 'destructive',
          onPress: async () => {
            try {
              // Clear local chat history
              clearAllSessions();
              
              // Clear server-side chat history if connected
              if (isConnected) {
                const success = await clearChatHistory();
                if (success) {
                  Alert.alert('Success', 'All chat history has been cleared from both device and server.');
                } else {
                  Alert.alert('Partial Success', 'Local chat history cleared, but failed to clear server history.');
                }
              } else {
                Alert.alert('Success', 'Local chat history has been cleared.');
              }
            } catch (error) {
              console.error('Error clearing chat history:', error);
              Alert.alert('Error', 'Failed to clear chat history. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleConnectionToggle = async () => {
    if (isConnected) {
      disconnect();
    } else {
      await reconnect();
    }
  };

  const renderSettingItem = ({
    icon,
    title,
    subtitle,
    rightComponent,
    onPress,
    showChevron = false,
  }: {
    icon: string;
    title: string;
    subtitle?: string;
    rightComponent?: React.ReactNode;
    onPress?: () => void;
    showChevron?: boolean;
  }) => (
    <TouchableOpacity
      style={[styles.settingItem, {backgroundColor: theme.colors.surface}]}
      onPress={onPress}
      disabled={!onPress}>
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, {backgroundColor: theme.colors.primary + '20'}]}>
          <Icon name={icon} size={20} color={theme.colors.primary} />
        </View>
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, {color: theme.colors.text}]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, {color: theme.colors.textSecondary}]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent && (
        <View style={styles.settingRight}>
          {rightComponent}
        </View>
      )}
      {showChevron && (
        <Icon name="chevron-forward" size={20} color={theme.colors.textMuted} />
      )}
    </TouchableOpacity>
  );

  const renderSection = (title: string, children: React.ReactNode) => (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
        {title}
      </Text>
      {children}
    </View>
  );

  const getThemeDisplayName = () => {
    switch (themeMode) {
      case 'light': return 'Light';
      case 'dark': return 'Dark';
      case 'system': return 'System';
    }
  };

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border}]}>
        <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
          Settings
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>

        {/* Connection Settings */}
        {renderSection('Connection', (
          <>
            {renderSettingItem({
              icon: 'wifi',
              title: 'Computer Connection',
              subtitle: isConnected ? `Connected to ${config.serverUrl}:${config.port}` : 'Not connected',
              rightComponent: (
                <Switch
                  value={isConnected}
                  onValueChange={handleConnectionToggle}
                  trackColor={{false: theme.colors.border, true: theme.colors.primary + '40'}}
                  thumbColor={isConnected ? theme.colors.primary : theme.colors.textMuted}
                />
              ),
            })}
            
            {renderSettingItem({
              icon: 'refresh',
              title: 'Auto Reconnect',
              subtitle: 'Automatically reconnect when connection is lost',
              rightComponent: (
                <Switch
                  value={settings.connectionSettings.autoReconnect}
                  onValueChange={(value) => updateSettings({
                    connectionSettings: {
                      ...settings.connectionSettings,
                      autoReconnect: value,
                    },
                  })}
                  trackColor={{false: theme.colors.border, true: theme.colors.primary + '40'}}
                  thumbColor={settings.connectionSettings.autoReconnect ? theme.colors.primary : theme.colors.textMuted}
                />
              ),
            })}
          </>
        ))}

        {/* Voice Settings */}
        {renderSection('Voice', (
          <>
            {renderSettingItem({
              icon: 'mic',
              title: 'Voice Recognition',
              subtitle: 'Enable voice commands and speech-to-text',
              rightComponent: (
                <Switch
                  value={settings.voiceEnabled}
                  onValueChange={(value) => updateSettings({voiceEnabled: value})}
                  trackColor={{false: theme.colors.border, true: theme.colors.primary + '40'}}
                  thumbColor={settings.voiceEnabled ? theme.colors.primary : theme.colors.textMuted}
                />
              ),
            })}
            
            {renderSettingItem({
              icon: 'send',
              title: 'Auto Send',
              subtitle: 'Automatically send voice messages after speech ends',
              rightComponent: (
                <Switch
                  value={settings.autoSend}
                  onValueChange={(value) => updateSettings({autoSend: value})}
                  trackColor={{false: theme.colors.border, true: theme.colors.primary + '40'}}
                  thumbColor={settings.autoSend ? theme.colors.primary : theme.colors.textMuted}
                />
              ),
            })}
          </>
        ))}

        {/* Appearance */}
        {renderSection('Appearance', (
          renderSettingItem({
            icon: 'color-palette',
            title: 'Theme',
            subtitle: `Currently using ${getThemeDisplayName()} theme`,
            onPress: handleThemeChange,
            showChevron: true,
          })
        ))}

        {/* Data & Privacy */}
        {renderSection('Data & Privacy', (
          renderSettingItem({
            icon: 'trash',
            title: 'Clear Chat History',
            subtitle: 'Delete all saved conversations',
            onPress: handleClearChat,
            showChevron: true,
          })
        ))}

        {/* Advanced Settings */}
        {renderSection('Advanced', (
          <>
            {renderSettingItem({
              icon: 'settings',
              title: 'Advanced Options',
              subtitle: showAdvanced ? 'Hide advanced settings' : 'Show advanced settings',
              onPress: () => setShowAdvanced(!showAdvanced),
              rightComponent: (
                <Icon
                  name={showAdvanced ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={theme.colors.textMuted}
                />
              ),
            })}
            
            {showAdvanced && (
              <>
                <View style={[styles.advancedSection, {backgroundColor: theme.colors.surfaceVariant}]}>
                  <Text style={[styles.advancedTitle, {color: theme.colors.text}]}>
                    Connection Settings
                  </Text>
                  
                  <View style={styles.inputRow}>
                    <Text style={[styles.inputLabel, {color: theme.colors.textSecondary}]}>
                      Default Host
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.background,
                          color: theme.colors.text,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      value={settings.connectionSettings.host}
                      onChangeText={(text) => updateSettings({
                        connectionSettings: {
                          ...settings.connectionSettings,
                          host: text,
                        },
                      })}
                      placeholder="192.168.1.100"
                      placeholderTextColor={theme.colors.textMuted}
                    />
                  </View>
                  
                  <View style={styles.inputRow}>
                    <Text style={[styles.inputLabel, {color: theme.colors.textSecondary}]}>
                      Default Port
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: theme.colors.background,
                          color: theme.colors.text,
                          borderColor: theme.colors.border,
                        },
                      ]}
                      value={settings.connectionSettings.port.toString()}
                      onChangeText={(text) => {
                        const port = parseInt(text) || 3000;
                        updateSettings({
                          connectionSettings: {
                            ...settings.connectionSettings,
                            port,
                          },
                        });
                      }}
                      placeholder="3000"
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="number-pad"
                    />
                  </View>
                </View>
              </>
            )}
          </>
        ))}

        {/* About */}
        {renderSection('About', (
          <>
            {renderSettingItem({
              icon: 'information-circle',
              title: 'App Version',
              subtitle: '1.0.0',
            })}
            
            {renderSettingItem({
              icon: 'logo-github',
              title: 'Source Code',
              subtitle: 'View on GitHub',
              onPress: () => Alert.alert('Info', 'Source code available on GitHub'),
              showChevron: true,
            })}
            
            {renderSettingItem({
              icon: 'help-circle',
              title: 'Help & Support',
              subtitle: 'Get help and report issues',
              onPress: () => Alert.alert('Help', 'Visit our documentation for help and support'),
              showChevron: true,
            })}
          </>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  section: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingSubtitle: {
    fontSize: 14,
    marginTop: 2,
    lineHeight: 18,
  },
  settingRight: {
    marginLeft: 12,
  },
  advancedSection: {
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  advancedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputRow: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
  },
  input: {
    height: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
  },
});

export default SettingsScreen;