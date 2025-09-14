import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  AppState,
  AppStateStatus,
  TextInput,
  Animated,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import Icon from 'react-native-vector-icons/Ionicons';

import {useTheme} from '../contexts/ThemeContext';
import {useConnection} from '../contexts/ConnectionContext';
import {Repository, ProjectFile} from '../types';
import {Project, ProjectDetails} from '../services/ApiService';
import Logo from '../components/Logo';

const ProjectsScreen: React.FC = () => {
  const {theme} = useTheme();
  const {
    isConnected,
    repositories, // Only used for display, always fetch fresh data
    currentProject,
    getProjects,
    rescanRepositories,
    openProject,
    getCurrentProject,
    forceProjectSync,
    lastProjectSync,
    projectSyncEnabled,
    syncError,
    syncRetryCount,
    autoOpeningProject,
  } = useConnection();
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [expandedRepo, setExpandedRepo] = useState<string | null>(null);
  const [currentProjectDetails, setCurrentProjectDetails] = useState<ProjectDetails | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [freshRepositories, setFreshRepositories] = useState<Project[]>([]); // Always fresh from computer app
  const [filteredRepositories, setFilteredRepositories] = useState<Project[]>([]);
  const [autoRefreshCountdown, setAutoRefreshCountdown] = useState(15);
  const [lastAutoRefresh, setLastAutoRefresh] = useState<Date>(new Date());
  const [isLoadingFresh, setIsLoadingFresh] = useState(false);
  const fadeAnim = new Animated.Value(1);

  useEffect(() => {
    if (isConnected) {
      loadProjects();
      loadCurrentProject();
    }
  }, [isConnected]);

  // Auto-refresh when screen comes into focus - ALWAYS get fresh data
  useFocusEffect(
    React.useCallback(() => {
      if (isConnected) {
        console.log('ProjectsScreen focused, loading fresh repository data from computer app...');
        loadFreshProjects(); // Always load fresh data
        loadCurrentProject();
        setLastAutoRefresh(new Date());
        setAutoRefreshCountdown(15);
        
        // Trigger visual refresh animation
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.7,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }, [isConnected])
  );

  // Filter repositories based on search query - use fresh repositories
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredRepositories(freshRepositories);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = freshRepositories.filter(repo => 
        repo.name.toLowerCase().includes(query) ||
        (repo.description && repo.description.toLowerCase().includes(query)) ||
        (repo.language && repo.language.toLowerCase().includes(query)) ||
        repo.path.toLowerCase().includes(query)
      );
      setFilteredRepositories(filtered);
    }
  }, [freshRepositories, searchQuery]);

  // Auto-refresh countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      const timeSinceRefresh = Math.floor((new Date().getTime() - lastAutoRefresh.getTime()) / 1000);
      const remaining = Math.max(0, 15 - timeSinceRefresh);
      setAutoRefreshCountdown(remaining);
      
      // Auto-refresh when countdown reaches zero - get fresh data
      if (remaining === 0 && isConnected) {
        console.log('Auto-refreshing projects (15s timer) - loading fresh data from computer app');
        loadFreshProjects();
        setLastAutoRefresh(new Date());
      }
    }, 1000);
    
    return () => clearInterval(timer);
  }, [lastAutoRefresh, isConnected]);

  // App focus listener for automatic sync
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && isConnected) {
        // App came to foreground, force sync projects
        console.log('App focused, forcing project sync...');
        forceProjectSync();
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isConnected, forceProjectSync]);

  const loadFreshProjects = async () => {
    setIsLoadingFresh(true);
    try {
      console.log('ProjectsScreen.loadFreshProjects: Making direct fresh query to computer app...');
      
      // First try regular getProjects
      let projects = await getProjects();
      
      // If we get the wrong repositories (hardcoded ones), try rescanning
      if (projects && projects.length === 2 && 
          projects.some(p => p.name === 'HTN25 Project' || p.name === 'Stratosphere Mobile')) {
        console.log('ProjectsScreen.loadFreshProjects: Detected hardcoded repositories, trying rescan...');
        projects = await rescanRepositories();
      }
      
      if (projects && projects.length > 0) {
        console.log(`ProjectsScreen.loadFreshProjects: SUCCESS - Got ${projects.length} fresh repositories:`);
        console.log('ProjectsScreen.loadFreshProjects: Repository list:', projects.map(p => `${p.name} (${p.path})`).join(', '));
        setFreshRepositories(projects);
      } else {
        console.log('ProjectsScreen.loadFreshProjects: WARNING - No fresh repositories received from computer app');
        setFreshRepositories([]);
      }
    } catch (error) {
      console.error('ProjectsScreen.loadFreshProjects: ERROR - Failed to get fresh repositories:', error);
      setFreshRepositories([]);
    } finally {
      setIsLoadingFresh(false);
    }
  };

  const loadProjects = async () => {
    // Always load fresh data, ignore cached repositories
    await loadFreshProjects();
  };

  const loadCurrentProject = async () => {
    try {
      const project = await getCurrentProject();
      setCurrentProjectDetails(project);
    } catch (error) {
      console.error('Failed to load current project:', error);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      if (isConnected) {
        console.log('handleRefresh: Forcing fresh repository data from computer app...');
        // Always load fresh repositories directly
        await loadFreshProjects();
        await loadCurrentProject();
        setLastAutoRefresh(new Date());
        setAutoRefreshCountdown(15);
        
        // Visual feedback animation
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.8,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 150,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleOpenProject = async (project: Project) => {
    if (!isConnected) {
      Alert.alert(
        'Not Connected',
        'Please connect to your computer app first.',
        [{text: 'OK'}]
      );
      return;
    }

    try {
      const projectDetails = await openProject(project.id, project.path);
      if (projectDetails) {
        setCurrentProjectDetails(projectDetails);
        Alert.alert(
          'Project Opened',
          `Successfully opened ${project.name}`,
          [{text: 'OK'}]
        );
      } else {
        Alert.alert(
          'Error',
          'Failed to open project. Please try again.',
          [{text: 'OK'}]
        );
      }
    } catch (error) {
      console.error('Failed to open project:', error);
      Alert.alert(
        'Error',
        'An error occurred while opening the project.',
        [{text: 'OK'}]
      );
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getLanguageColor = (language: string | undefined) => {
    const colors: Record<string, string> = {
      JavaScript: '#f1e05a',
      TypeScript: '#2b7489',
      Python: '#3572A5',
      Java: '#b07219',
      'C++': '#f34b7d',
      C: '#555555',
      Go: '#00ADD8',
      Rust: '#dea584',
      Swift: '#ffac45',
      Kotlin: '#F18E33',
      Dart: '#00B4AB',
      PHP: '#4F5D95',
      Ruby: '#701516',
      HTML: '#e34c26',
      CSS: '#1572B6',
      Shell: '#89e051',
    };
    return colors[language || ''] || theme.colors.textMuted;
  };

  const renderConnectionStatus = () => {
    const formatSyncTime = (date: Date | null) => {
      if (!date) return 'Never';
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffSecs = Math.floor(diffMs / 1000);
      const diffMins = Math.floor(diffSecs / 60);
      
      if (diffSecs < 60) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      return date.toLocaleTimeString();
    };

    return (
      <View>
        <View style={[
          styles.connectionBanner,
          {backgroundColor: isConnected ? theme.colors.success + '20' : theme.colors.error + '20'}
        ]}>
          <Icon
            name={isConnected ? 'checkmark-circle' : 'alert-circle'}
            size={20}
            color={isConnected ? theme.colors.success : theme.colors.error}
          />
          <Text style={[
            styles.connectionText,
            {color: isConnected ? theme.colors.success : theme.colors.error}
          ]}>
            {isConnected ? 'Connected to computer app' : 'Not connected to computer app'}
          </Text>
        </View>
        {isConnected && (autoOpeningProject || (projectSyncEnabled && (syncError || lastProjectSync))) && (
          <View style={[styles.syncStatus, {backgroundColor: autoOpeningProject ? theme.colors.primary + '10' : (syncError ? theme.colors.error + '10' : theme.colors.surface)}]}>
            <Icon
              name={autoOpeningProject ? 'folder-open' : (syncError ? 'warning' : 'sync')}
              size={14}
              color={autoOpeningProject ? theme.colors.primary : (syncError ? theme.colors.error : theme.colors.textMuted)}
            />
            <Text style={[styles.syncText, {color: autoOpeningProject ? theme.colors.primary : (syncError ? theme.colors.error : theme.colors.textMuted)}]}>
              {autoOpeningProject 
                ? 'Auto-opening last used repository...' 
                : (syncError 
                  ? `Sync error (${syncRetryCount} failures): ${syncError}` 
                  : `Last sync: ${formatSyncTime(lastProjectSync)}`)}
            </Text>
          </View>
        )}
      </View>
    );
  };

  const renderRepository = (repo: Project) => (
    <View key={repo.id} style={[styles.repoCard, {backgroundColor: theme.colors.surface}]}>
      <TouchableOpacity
        style={styles.repoHeader}
        onPress={() => setExpandedRepo(expandedRepo === repo.id ? null : repo.id)}>
        <View style={styles.repoInfo}>
          <View style={styles.repoTitleRow}>
            <Icon
              name={repo.isGitRepo ? 'git-branch' : 'folder'}
              size={16}
              color={theme.colors.textMuted}
            />
            <Text style={[styles.repoName, {color: theme.colors.text}]}>
              {repo.name}
            </Text>
          </View>
          {repo.description && (
            <Text style={[styles.repoDescription, {color: theme.colors.textSecondary}]}>
              {repo.description}
            </Text>
          )}
          <View style={styles.repoMeta}>
            {repo.language && (
              <View style={styles.languageTag}>
                <View
                  style={[
                    styles.languageDot,
                    {backgroundColor: getLanguageColor(repo.language)}
                  ]}
                />
                <Text style={[styles.languageText, {color: theme.colors.textSecondary}]}>
                  {repo.language}
                </Text>
              </View>
            )}
            <Text style={[styles.updatedText, {color: theme.colors.textMuted}]}>
              Updated {repo.lastModified.toLocaleDateString()}
            </Text>
          </View>
        </View>
        <Icon
          name={expandedRepo === repo.id ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={theme.colors.textMuted}
        />
      </TouchableOpacity>
      
      {expandedRepo === repo.id && (
        <View style={styles.repoActions}>
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: theme.colors.primary}]}
            onPress={() => handleOpenProject(repo)}>
            <Icon name="folder-open" size={16} color="white" />
            <Text style={styles.actionButtonText}>Open Project</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.actionButton, {backgroundColor: theme.colors.secondary, marginLeft: 8}]}
            onPress={() => Alert.alert('Coming Soon', 'File browsing feature coming soon!')}>
            <Icon name="documents" size={16} color="white" />
            <Text style={styles.actionButtonText}>Browse Files</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );

  const renderCurrentProject = () => {
    if (!currentProjectDetails) return null;

    return (
      <View style={[styles.currentProjectCard, {backgroundColor: theme.colors.primary + '10'}]}>
        <View style={styles.currentProjectHeader}>
          <Icon name="folder-open" size={20} color={theme.colors.primary} />
          <Text style={[styles.currentProjectTitle, {color: theme.colors.primary}]}>
            Current Project
          </Text>
        </View>
        <Text style={[styles.currentProjectPath, {color: theme.colors.text}]}>
          {currentProjectDetails.name}
        </Text>
        <Text style={[styles.currentProjectPath, {color: theme.colors.textSecondary}]}>
          {currentProjectDetails.path}
        </Text>
        <View style={styles.projectStats}>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: theme.colors.text}]}>
              {currentProjectDetails.files.length}
            </Text>
            <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>
              Files
            </Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statNumber, {color: theme.colors.text}]}>
              {formatFileSize(currentProjectDetails.files.reduce((acc: number, file: any) => acc + (file.size || 0), 0))}
            </Text>
            <Text style={[styles.statLabel, {color: theme.colors.textSecondary}]}>
              Total Size
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="folder-outline" size={64} color={theme.colors.textMuted} />
      <Text style={[styles.emptyStateTitle, {color: theme.colors.text}]}>
        No Projects Found
      </Text>
      <Text style={[styles.emptyStateText, {color: theme.colors.textSecondary}]}>
        {isConnected
          ? 'Connect to your computer app and open some projects to see them here.'
          : 'Please connect to your computer app to access your repositories.'}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, {backgroundColor: theme.colors.background}]}>
      {/* Header */}
      <View style={[styles.header, {backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border}]}>
        <View style={styles.headerLeft}>
          <Text style={[styles.headerTitle, {color: theme.colors.text}]}>
            Projects
          </Text>
          {isConnected && autoRefreshCountdown > 0 && (
            <Text style={[styles.countdownText, {color: theme.colors.textMuted}]}>
              Auto-refresh in {autoRefreshCountdown}s
            </Text>
          )}
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity
            style={[styles.rescanButton, {backgroundColor: theme.colors.secondary}]}
            onPress={async () => {
              console.log('Manual rescan triggered');
              setIsLoadingFresh(true);
              try {
                const projects = await rescanRepositories();
                if (projects) {
                  setFreshRepositories(projects);
                }
              } finally {
                setIsLoadingFresh(false);
              }
            }}
            disabled={!isConnected || isLoadingFresh}>
            <Icon
              name="folder-outline"
              size={18}
              color="white"
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.refreshButton, {backgroundColor: theme.colors.primary}]}
            onPress={handleRefresh}
            disabled={!isConnected || isRefreshing}>
            <Icon
              name="refresh"
              size={20}
              color="white"
              style={isRefreshing ? styles.rotating : undefined}
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Search Bar */}
      {isConnected && freshRepositories.length > 0 && (
        <View style={[styles.searchContainer, {backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.border}]}>
          <Icon name="search" size={20} color={theme.colors.textMuted} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, {color: theme.colors.text}]}
            placeholder="Search repositories..."
            placeholderTextColor={theme.colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Icon name="close-circle" size={20} color={theme.colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      )}

      {renderConnectionStatus()}

      <Animated.View style={{opacity: fadeAnim, flex: 1}}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={theme.colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}>
          
          {renderCurrentProject()}
          
          {freshRepositories.length > 0 ? (
            <View style={styles.repositoriesSection}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text}]}>
                {searchQuery ? `Filtered Repositories (${filteredRepositories.length})` : `Fresh Repositories (${freshRepositories.length})`}
                {isLoadingFresh && <Text style={{color: theme.colors.textMuted}}> - Loading...</Text>}
              </Text>
              {filteredRepositories.length > 0 ? (
                filteredRepositories.map(renderRepository)
              ) : (
                <View style={styles.emptySearchState}>
                  <Icon name="search-outline" size={48} color={theme.colors.textMuted} />
                  <Text style={[styles.emptySearchTitle, {color: theme.colors.text}]}>
                    No repositories found
                  </Text>
                  <Text style={[styles.emptySearchText, {color: theme.colors.textSecondary}]}>
                    Try adjusting your search query
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="folder-outline" size={64} color={theme.colors.textMuted} />
              <Text style={[styles.emptyStateTitle, {color: theme.colors.text}]}>
                {isLoadingFresh ? 'Loading Fresh Repositories...' : 'No Repositories Found'}
              </Text>
              <Text style={[styles.emptyStateText, {color: theme.colors.textSecondary}]}>
                {isLoadingFresh 
                  ? 'Fetching latest repository list from computer app...' 
                  : (isConnected
                    ? 'No repositories found in your computer app. Make sure you have some projects open.'
                    : 'Please connect to your computer app to access your repositories.')}
              </Text>
            </View>
          )}
        </ScrollView>
      </Animated.View>
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
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerLogo: {
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
  },
  countdownText: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '400',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rescanButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  rotating: {
    // Animation would be added with Animated API in a real implementation
  },
  connectionBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  connectionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 8,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  syncText: {
    fontSize: 12,
    marginLeft: 6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  currentProjectCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  currentProjectHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  currentProjectTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  currentProjectPath: {
    fontSize: 14,
    marginBottom: 12,
  },
  projectStats: {
    flexDirection: 'row',
  },
  statItem: {
    alignItems: 'center',
    marginRight: 24,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  repositoriesSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  repoCard: {
    borderRadius: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  repoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  repoInfo: {
    flex: 1,
  },
  repoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  repoName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  repoDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  repoMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  languageTag: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  languageDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  languageText: {
    fontSize: 14,
  },
  updatedText: {
    fontSize: 12,
  },
  repoActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    flex: 1,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'white',
    marginLeft: 6,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  emptySearchState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptySearchTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
});

export default ProjectsScreen;