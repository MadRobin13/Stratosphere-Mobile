import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  ReactNode,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {AppState, AppStateStatus} from 'react-native';
import ApiService, { ApiConfig, SessionInfo, ChatMessage, Project, ProjectDetails } from '../services/ApiService';
import {useApp} from './AppContext';

export interface ConnectionConfig {
  serverUrl: string;
  port: number;
  protocol: 'http' | 'https';
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  pollingInterval: number;
}

export interface ConnectionContextValue {
  isConnected: boolean;
  isConnecting: boolean;
  config: ConnectionConfig;
  connectionAttempts: number;
  lastConnectionTime: Date | null;
  sessionInfo: SessionInfo | null;
  lastError: string | null;
  connect: (host?: string, port?: number) => Promise<boolean>;
  disconnect: () => void;
  reconnect: () => Promise<boolean>;
  updateConfig: (newConfig: Partial<ConnectionConfig>) => void;
  getConnectionStatus: () => {
    connected: boolean;
    connecting: boolean;
    attempts: number;
    lastConnection: Date | null;
    config: ConnectionConfig;
    sessionInfo: SessionInfo | null;
  };
  // API methods
  sendMessage: (message: string, isVoice?: boolean, context?: any) => Promise<{message: ChatMessage; userMessage: ChatMessage} | null>;
  sendVoiceMessage: (text: string, language?: string, context?: any) => Promise<{message: ChatMessage; userMessage: ChatMessage} | null>;
  getChatHistory: (limit?: number, offset?: number) => Promise<{messages: ChatMessage[]; total: number} | null>;
  clearChatHistory: () => Promise<boolean>;
  getProjects: () => Promise<Project[] | null>;
  rescanRepositories: () => Promise<Project[] | null>;
  openProject: (projectId: string, projectPath: string) => Promise<ProjectDetails | null>;
  getCurrentProject: () => Promise<ProjectDetails | null>;
  readFile: (filePath: string) => Promise<{path: string; content: string; size: number; modified: Date; extension: string} | null>;
  writeFile: (filePath: string, content: string) => Promise<{path: string; size: number; modified: Date} | null>;
  healthCheck: () => Promise<boolean>;
  getDebugInfo: () => any;
  // Legacy compatibility
  repositories: Project[];
  currentProject: string | null;
  refreshRepositories: () => void;
  // Project sync methods
  forceProjectSync: () => Promise<void>;
  lastProjectSync: Date | null;
  projectSyncEnabled: boolean;
  setProjectSyncEnabled: (enabled: boolean) => void;
  syncError: string | null;
  syncRetryCount: number;
  autoOpeningProject: boolean;
}

const defaultConfig: ConnectionConfig = {
  serverUrl: '10.194.219.53', // Hardcoded IP address
  port: 47893, // Correct mobile bridge port
  protocol: 'http',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  pollingInterval: 5000,
};

// AGGRESSIVE LOGGING - This should show in React Native logs
console.log('======================================');
console.log('🚀🚀🚀 ConnectionContext DEFAULT CONFIG:');
console.log('IP ADDRESS:', defaultConfig.serverUrl);
console.log('PORT:', defaultConfig.port);
console.log('======================================');

// Log to verify changes are applied
console.log('🚀 ConnectionContext: Using hardcoded IP address:', defaultConfig.serverUrl);
console.log('🚀 ConnectionContext: Auto-repository opening enabled');

const ConnectionContext = createContext<ConnectionContextValue | undefined>(
  undefined
);

export const useConnection = () => {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within a ConnectionProvider');
  }
  return context;
};

interface ConnectionProviderProps {
  children: ReactNode;
}

export const ConnectionProvider: React.FC<ConnectionProviderProps> = ({
  children,
}) => {
  const {settings} = useApp();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [config, setConfig] = useState<ConnectionConfig>(defaultConfig);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectionTime, setLastConnectionTime] = useState<Date | null>(
    null
  );
  const [sessionInfo, setSessionInfo] = useState<SessionInfo | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [apiService, setApiService] = useState<ApiService | null>(null);
  const [repositories, setRepositories] = useState<Project[]>([]);
  const [currentProject, setCurrentProject] = useState<string | null>(null);
  const [projectSyncInterval, setProjectSyncInterval] = useState<NodeJS.Timeout | null>(null);
  const [lastProjectSync, setLastProjectSync] = useState<Date | null>(null);
  const [projectSyncEnabled, setProjectSyncEnabled] = useState(true);
  const [syncRetryCount, setSyncRetryCount] = useState(0);
  const [syncError, setSyncError] = useState<string | null>(null);
  const [autoOpeningProject, setAutoOpeningProject] = useState(false);

  // Load saved configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);
  
  // Sync with app settings
  useEffect(() => {
    if (settings.connectionSettings) {
      const newConfig = {
        ...config,
        serverUrl: settings.connectionSettings.host,
        port: settings.connectionSettings.port,
      };
      if (newConfig.serverUrl !== config.serverUrl || newConfig.port !== config.port) {
        console.log('Updating connection config from app settings:', newConfig);
        setConfig(newConfig);
      }
    }
  }, [settings.connectionSettings]);

  // Initialize API service when config changes
  useEffect(() => {
    if (config) {
      const baseURL = `${config.protocol}://${config.serverUrl}:${config.port}`;
      const apiConfig: ApiConfig = {
        baseURL,
        timeout: config.timeout,
        retryAttempts: config.retryAttempts,
        retryDelay: config.retryDelay,
      };
      
      const service = new ApiService(apiConfig);
      setApiService(service);

      // Set up connection listeners
      const unsubscribe = service.onConnectionChange((connected) => {
        setIsConnected(connected);
        if (connected) {
          setConnectionAttempts(0);
          setLastConnectionTime(new Date());
          setLastError(null);
          // Get session info
          service.getSession().then((session) => {
            if (session) {
              setSessionInfo(session);
            }
          });
          // Start periodic project sync (but don't load initial data - force explicit refresh)
          startProjectSync(service);
          // Automatically open last used repository
          autoOpenLastRepository(service);
        } else {
          setSessionInfo(null);
          stopProjectSync();
        }
      });

      return () => {
        unsubscribe();
        service.disconnect();
        stopProjectSync();
      };
    }
  }, [config]);

  // Network state monitoring
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected && !isConnected && !isConnecting && apiService) {
        if (settings.connectionSettings.autoReconnect) {
          setTimeout(() => {
            if (!isConnected) {
              connect();
            }
          }, 1000);
        }
      }
    });

    return () => unsubscribe();
  }, [isConnected, isConnecting, apiService, settings.connectionSettings.autoReconnect]);

  // App state monitoring for reconnection
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && !isConnected && apiService) {
        if (settings.connectionSettings.autoReconnect) {
          reconnect();
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, [isConnected, apiService, settings.connectionSettings.autoReconnect]);

  const loadConfig = async () => {
    try {
      const savedConfig = await AsyncStorage.getItem('connection_config');
      if (savedConfig) {
        const parsedConfig = JSON.parse(savedConfig);
        setConfig({ ...defaultConfig, ...parsedConfig });
      }
    } catch (error) {
      console.error('Failed to load connection config:', error);
    }
  };

  const saveConfig = async (newConfig: ConnectionConfig) => {
    try {
      await AsyncStorage.setItem(
        'connection_config',
        JSON.stringify(newConfig)
      );
    } catch (error) {
      console.error('Failed to save connection config:', error);
    }
  };


  const autoOpenLastRepository = async (service: ApiService) => {
    if (autoOpeningProject) return;
    
    try {
      setAutoOpeningProject(true);
      console.log('autoOpenLastRepository: Checking for last used repository...');
      
      // First get current project to see if one is already open
      const currentProj = await service.getCurrentProject();
      if (currentProj.data?.project) {
        console.log(`autoOpenLastRepository: Project already open: ${currentProj.data.project.name}`);
        setCurrentProject(currentProj.data.project.path);
        return;
      }
      
      // Get all projects to find the last used one
      const projectsResult = await service.getProjects();
      if (!projectsResult.data?.projects || projectsResult.data.projects.length === 0) {
        console.log('autoOpenLastRepository: No projects available');
        return;
      }
      
      const projects = projectsResult.data.projects;
      console.log(`autoOpenLastRepository: Found ${projects.length} available projects`);
      
      // Find the most recently modified project (likely the last used)
      const lastUsedProject = projects.reduce((latest, current) => {
        const currentModified = new Date(current.lastModified).getTime();
        const latestModified = new Date(latest.lastModified).getTime();
        return currentModified > latestModified ? current : latest;
      });
      
      console.log(`autoOpenLastRepository: Auto-opening last used repository: ${lastUsedProject.name} (${lastUsedProject.path})`);
      
      // Automatically open the last used repository
      const result = await service.openProject(lastUsedProject.id, lastUsedProject.path);
      if (result.data?.project) {
        setCurrentProject(result.data.project.path);
        console.log(`autoOpenLastRepository: Successfully auto-opened: ${result.data.project.name}`);
      } else {
        console.log('autoOpenLastRepository: Failed to auto-open repository');
      }
    } catch (error) {
      console.error('autoOpenLastRepository: Error auto-opening repository:', error);
    } finally {
      setAutoOpeningProject(false);
    }
  };

  const startProjectSync = (service: ApiService) => {
    // DISABLED: No automatic background sync - only explicit fresh queries
    // This prevents cached/stale data from interfering with fresh data requests
    console.log('Project background sync DISABLED - using only explicit fresh queries for most recent data');
    return;
  };
  
  const stopProjectSync = () => {
    if (projectSyncInterval) {
      clearInterval(projectSyncInterval);
      setProjectSyncInterval(null);
      console.log('Stopped project synchronization');
    }
  };
  
  const forceProjectSync = async () => {
    if (!apiService || !isConnected) {
      console.log('forceProjectSync: Not connected to API service');
      return;
    }
    
    try {
      console.log('forceProjectSync: Force syncing projects from computer app...');
      
      // Always fetch fresh project data
      const projects = await apiService.getProjects();
      if (projects.data?.projects) {
        console.log(`forceProjectSync: Received ${projects.data.projects.length} fresh repositories`);
        setRepositories(projects.data.projects);
        setLastProjectSync(new Date());
        
        // Clear any sync errors
        if (syncError) {
          setSyncError(null);
        }
        if (syncRetryCount > 0) {
          setSyncRetryCount(0);
        }
      } else {
        console.log('forceProjectSync: No projects data received');
        setLastProjectSync(new Date());
      }
      
      // Also sync current project
      const currentProj = await apiService.getCurrentProject();
      if (currentProj.data?.project) {
        console.log(`forceProjectSync: Current project: ${currentProj.data.project.name}`);
        setCurrentProject(currentProj.data.project.path);
      } else {
        console.log('forceProjectSync: No current project');
        setCurrentProject(null);
      }
    } catch (error) {
      console.error('forceProjectSync: Failed to sync from computer app:', error);
      setSyncError(error instanceof Error ? error.message : 'Force sync failed');
      setSyncRetryCount(prev => prev + 1);
    }
  };

  const connect = useCallback(async (host?: string, port?: number): Promise<boolean> => {
    if (isConnecting || isConnected || !apiService) {
      return isConnected;
    }

    try {
      setIsConnecting(true);
      setConnectionAttempts(prev => prev + 1);
      setLastError(null);
      
      // Update config if host/port provided
      if (host || port) {
        const newConfig = {
          ...config,
          ...(host && { serverUrl: host }),
          ...(port && { port }),
        };
        setConfig(newConfig);
        saveConfig(newConfig);
        
        // Update API service base URL
        const baseURL = `${newConfig.protocol}://${newConfig.serverUrl}:${newConfig.port}`;
        apiService.updateBaseURL(baseURL);
      }

      console.log('\n======================================');
      console.log('🚀🚀🚀 ACTUAL CONNECTION ATTEMPT:');
      console.log('CONNECTING TO IP:', config.serverUrl);
      console.log('CONNECTING TO PORT:', config.port);
      console.log('FULL URL:', `${config.protocol}://${config.serverUrl}:${config.port}`);
      console.log('======================================\n');
      
      const success = await apiService.connect();
      
      if (success) {
        console.log('API connected successfully');
        // Start polling for updates
        apiService.startPolling(config.pollingInterval);
        
        // Set up polling listeners
        apiService.onPollingUpdate('session_update', (session: SessionInfo) => {
          setSessionInfo(session);
        });
        
        apiService.onPollingUpdate('project_update', (project: ProjectDetails) => {
          if (project) {
            setCurrentProject(project.path);
          }
        });
      } else {
        console.log('API connection failed');
        setLastError('Connection failed');
      }
      
      setIsConnecting(false);
      return success;
    } catch (error: any) {
      console.error('Connection failed:', error);
      setLastError(error.message || 'Connection failed');
      setIsConnecting(false);
      return false;
    }
  }, [config, isConnecting, isConnected, apiService]);

  const disconnect = useCallback(() => {
    if (apiService) {
      apiService.disconnect();
    }
    setIsConnected(false);
    setIsConnecting(false);
    setConnectionAttempts(0);
    setSessionInfo(null);
    setCurrentProject(null);
    setRepositories([]);
    setLastError(null);
  }, [apiService]);

  const reconnect = useCallback(async (): Promise<boolean> => {
    if (apiService) {
      try {
        setLastError(null);
        return await apiService.reconnect();
      } catch (error: any) {
        setLastError(error.message || 'Reconnection failed');
        return false;
      }
    }
    return false;
  }, [apiService]);

  const updateConfig = useCallback(
    (newConfig: Partial<ConnectionConfig>) => {
      const updatedConfig = { ...config, ...newConfig };
      setConfig(updatedConfig);
      saveConfig(updatedConfig);
    },
    [config]
  );

  const getConnectionStatus = useCallback(() => {
    return {
      connected: isConnected,
      connecting: isConnecting,
      attempts: connectionAttempts,
      lastConnection: lastConnectionTime,
      config,
      sessionInfo,
    };
  }, [isConnected, isConnecting, connectionAttempts, lastConnectionTime, config, sessionInfo]);

  // API method wrappers with error handling
  const sendMessage = useCallback(
    async (message: string, isVoice: boolean = false, context?: any) => {
      if (!apiService || !isConnected) {
        setLastError('Not connected to server');
        return null;
      }
      
      try {
        setLastError(null);
        const result = await apiService.sendMessage(message, isVoice, context);
        return result.data || null;
      } catch (error: any) {
        setLastError(error.message || 'Failed to send message');
        console.error('Send message error:', error);
        return null;
      }
    },
    [apiService, isConnected]
  );

  const sendVoiceMessage = useCallback(
    async (text: string, language: string = 'en-US', context?: any) => {
      if (!apiService || !isConnected) {
        setLastError('Not connected to server');
        return null;
      }
      
      try {
        setLastError(null);
        const result = await apiService.sendVoiceMessage(text, language, context);
        return result.data || null;
      } catch (error: any) {
        setLastError(error.message || 'Failed to send voice message');
        console.error('Send voice message error:', error);
        return null;
      }
    },
    [apiService, isConnected]
  );

  const getChatHistory = useCallback(
    async (limit: number = 50, offset: number = 0) => {
      if (!apiService || !isConnected) {
        return null;
      }
      
      try {
        const result = await apiService.getChatHistory(limit, offset);
        return result.data || null;
      } catch (error) {
        console.error('Get chat history error:', error);
        return null;
      }
    },
    [apiService, isConnected]
  );

  const clearChatHistory = useCallback(
    async () => {
      if (!apiService || !isConnected) {
        return false;
      }
      
      try {
        const result = await apiService.clearChatHistory();
        return result.success;
      } catch (error) {
        console.error('Clear chat history error:', error);
        return false;
      }
    },
    [apiService, isConnected]
  );

  const getProjects = useCallback(
    async () => {
      if (!apiService || !isConnected) {
        console.log('getProjects: Not connected to API service');
        return null;
      }
      
      try {
        console.log('getProjects: Making direct fresh query to computer app for repositories...');
        
        // Always make a fresh API call - no caching, no local state dependency
        const result = await apiService.getProjects();
        const projects = result.data?.projects || null;
        
        if (projects && projects.length > 0) {
          console.log(`getProjects: SUCCESS - Received ${projects.length} fresh repositories directly from computer app`);
          console.log('getProjects: Repository names:', projects.map(p => p.name).join(', '));
          
          // Update local state only for UI display, but always return fresh data
          setRepositories(projects);
          setLastProjectSync(new Date());
          
          // Clear any sync errors since we got fresh data
          if (syncError) {
            setSyncError(null);
          }
          if (syncRetryCount > 0) {
            setSyncRetryCount(0);
          }
        } else {
          console.log('getProjects: WARNING - No projects received from computer app API');
          setLastProjectSync(new Date());
        }
        
        // Always return the fresh data from API, not local state
        return projects;
      } catch (error) {
        console.error('getProjects: ERROR - Failed to query computer app:', error);
        setSyncError(error instanceof Error ? error.message : 'Failed to fetch repositories');
        setSyncRetryCount(prev => prev + 1);
        return null;
      }
    },
    [apiService, isConnected, syncError, syncRetryCount]
  );

  const rescanRepositories = useCallback(
    async () => {
      if (!apiService || !isConnected) {
        console.log('rescanRepositories: Not connected to API service');
        return null;
      }
      
      try {
        console.log('rescanRepositories: Requesting computer app to rescan GitHub directory...');
        
        // First try the rescan endpoint
        const result = await apiService.rescanRepositories();
        const projects = result.data?.projects || null;
        
        if (projects && projects.length > 0) {
          console.log(`rescanRepositories: SUCCESS - Rescan found ${projects.length} repositories`);
          console.log('rescanRepositories: Repository names:', projects.map(p => p.name).join(', '));
          
          // Update local state
          setRepositories(projects);
          setLastProjectSync(new Date());
          
          // Clear any sync errors
          if (syncError) {
            setSyncError(null);
          }
          if (syncRetryCount > 0) {
            setSyncRetryCount(0);
          }
        } else {
          console.log('rescanRepositories: WARNING - Rescan found no repositories');
        }
        
        return projects;
      } catch (error) {
        console.error('rescanRepositories: ERROR - Failed to rescan:', error);
        // Fallback to regular getProjects
        console.log('rescanRepositories: Falling back to regular getProjects...');
        return await getProjects();
      }
    },
    [apiService, isConnected, getProjects, syncError, syncRetryCount]
  );

  const openProject = useCallback(
    async (projectId: string, projectPath: string) => {
      if (!apiService || !isConnected) {
        return null;
      }
      
      try {
        const result = await apiService.openProject(projectId, projectPath);
        const project = result.data?.project || null;
        if (project) {
          setCurrentProject(project.path);
        }
        return project;
      } catch (error) {
        console.error('Open project error:', error);
        return null;
      }
    },
    [apiService, isConnected]
  );

  const getCurrentProject = useCallback(
    async () => {
      if (!apiService || !isConnected) {
        return null;
      }
      
      try {
        const result = await apiService.getCurrentProject();
        const project = result.data?.project || null;
        if (project) {
          setCurrentProject(project.path);
        }
        return project;
      } catch (error) {
        console.error('Get current project error:', error);
        return null;
      }
    },
    [apiService, isConnected]
  );

  const readFile = useCallback(
    async (filePath: string) => {
      if (!apiService || !isConnected) {
        return null;
      }
      
      try {
        const result = await apiService.readFile(filePath);
        return result.data || null;
      } catch (error) {
        console.error('Read file error:', error);
        return null;
      }
    },
    [apiService, isConnected]
  );

  const writeFile = useCallback(
    async (filePath: string, content: string) => {
      if (!apiService || !isConnected) {
        return null;
      }
      
      try {
        const result = await apiService.writeFile(filePath, content);
        return result.data || null;
      } catch (error) {
        console.error('Write file error:', error);
        return null;
      }
    },
    [apiService, isConnected]
  );

  const healthCheck = useCallback(
    async () => {
      if (!apiService) {
        return false;
      }
      
      try {
        return await apiService.healthCheck();
      } catch (error) {
        console.error('Health check error:', error);
        return false;
      }
    },
    [apiService]
  );

  const getDebugInfo = useCallback(
    () => {
      return apiService?.getDebugInfo() || {};
    },
    [apiService]
  );

  // Legacy compatibility methods
  const refreshRepositories = useCallback(() => {
    getProjects();
  }, [getProjects]);

  const contextValue: ConnectionContextValue = {
    isConnected,
    isConnecting,
    config,
    connectionAttempts,
    lastConnectionTime,
    sessionInfo,
    lastError,
    connect,
    disconnect,
    reconnect,
    updateConfig,
    getConnectionStatus,
    sendMessage,
    sendVoiceMessage,
    getChatHistory,
    clearChatHistory,
    getProjects,
    rescanRepositories,
    openProject,
    getCurrentProject,
    readFile,
    writeFile,
    healthCheck,
    getDebugInfo,
    // Legacy compatibility
    repositories,
    currentProject,
    refreshRepositories,
    // Project sync methods
    forceProjectSync,
    lastProjectSync,
    projectSyncEnabled,
    setProjectSyncEnabled,
    syncError,
    syncRetryCount,
    autoOpeningProject,
  };

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
};
