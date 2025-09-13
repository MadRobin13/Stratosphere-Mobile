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
}

const defaultConfig: ConnectionConfig = {
  serverUrl: 'localhost',
  port: 3000,
  protocol: 'http',
  timeout: 30000,
  retryAttempts: 3,
  retryDelay: 1000,
  pollingInterval: 5000,
};

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

  // Load saved configuration on mount
  useEffect(() => {
    loadConfig();
  }, []);

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
          // Load initial data
          loadInitialData(service);
        } else {
          setSessionInfo(null);
        }
      });

      return () => {
        unsubscribe();
        service.disconnect();
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

  const loadInitialData = async (service: ApiService) => {
    try {
      // Load projects (repositories)
      const projects = await service.getProjects();
      if (projects.data?.projects) {
        setRepositories(projects.data.projects);
      }
      
      // Load current project if any
      const currentProj = await service.getCurrentProject();
      if (currentProj.data?.project) {
        setCurrentProject(currentProj.data.project.path);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
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

      console.log('Connecting to API:', `${config.protocol}://${config.serverUrl}:${config.port}`);
      
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
        return null;
      }
      
      try {
        const result = await apiService.getProjects();
        const projects = result.data?.projects || null;
        if (projects) {
          setRepositories(projects);
        }
        return projects;
      } catch (error) {
        console.error('Get projects error:', error);
        return null;
      }
    },
    [apiService, isConnected]
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
  };

  return (
    <ConnectionContext.Provider value={contextValue}>
      {children}
    </ConnectionContext.Provider>
  );
};
