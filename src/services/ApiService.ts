import axios, {AxiosInstance, AxiosResponse} from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {Platform} from 'react-native';
import {v4 as uuidv4} from 'uuid';

export interface ApiConfig {
  baseURL: string;
  timeout?: number;
  retryAttempts?: number;
  retryDelay?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  status?: number;
}

export interface SessionInfo {
  id: string;
  deviceName: string;
  platform: string;
  currentProject?: string;
  lastActivity: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isVoice?: boolean;
  timestamp: Date;
  model?: string;
}

export interface Project {
  id: string;
  name: string;
  fullName: string;
  path: string;
  description?: string;
  language?: string;
  isGitRepo: boolean;
  lastModified: Date;
}

export interface ProjectDetails extends Project {
  structure: any;
  files: Array<{
    name: string;
    path: string;
    relativePath: string;
    size: number;
    modified: Date;
    extension: string;
  }>;
  dependencies?: string[];
  version?: string;
}

class ApiService {
  private client: AxiosInstance;
  private sessionId: string | null = null;
  private config: ApiConfig;
  private deviceId: string;
  private isConnected: boolean = false;
  private connectionListeners: ((connected: boolean) => void)[] = [];
  private retryQueue: Array<() => Promise<any>> = [];
  private polling: ReturnType<typeof setInterval> | null = null;
  private pollingCallbacks: Map<string, (data: any) => void> = new Map();

  constructor(config: ApiConfig) {
    this.config = {
      timeout: 30000,
      retryAttempts: 3,
      retryDelay: 1000,
      ...config,
    };

    this.client = axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.deviceId = this.generateDeviceId();
    this.setupInterceptors();
    this.loadStoredSession();
  }

  private generateDeviceId(): string {
    // Try to get stored device ID, otherwise generate new one
    return uuidv4();
  }

  private async loadStoredSession() {
    try {
      const storedSessionId = await AsyncStorage.getItem('api_session_id');
      const storedDeviceId = await AsyncStorage.getItem('device_id');
      
      if (storedDeviceId) {
        this.deviceId = storedDeviceId;
      } else {
        await AsyncStorage.setItem('device_id', this.deviceId);
      }

      if (storedSessionId) {
        this.sessionId = storedSessionId;
        // Validate stored session
        await this.validateSession();
      }
    } catch (error) {
      console.error('Failed to load stored session:', error);
    }
  }

  private setupInterceptors() {
    // Request interceptor to add session ID
    this.client.interceptors.request.use(
      (config) => {
        if (this.sessionId) {
          config.headers['x-session-id'] = this.sessionId;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Session expired, create new session
          await this.createSession();
          // Retry the original request
          return this.client.request(error.config);
        }
        return Promise.reject(error);
      }
    );
  }

  // Connection management
  async connect(): Promise<boolean> {
    try {
      // Check network connectivity
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        throw new Error('No network connection');
      }

      // Create or validate session
      if (!this.sessionId) {
        await this.createSession();
      } else {
        await this.validateSession();
      }

      this.isConnected = true;
      this.notifyConnectionListeners(true);
      this.processRetryQueue();
      return true;
    } catch (error) {
      console.error('Connection failed:', error);
      this.isConnected = false;
      this.notifyConnectionListeners(false);
      return false;
    }
  }

  disconnect() {
    this.isConnected = false;
    this.sessionId = null;
    this.stopPolling();
    AsyncStorage.removeItem('api_session_id');
    this.notifyConnectionListeners(false);
  }

  async reconnect(): Promise<boolean> {
    await this.createSession();
    return this.connect();
  }

  // Session management
  private async createSession(): Promise<void> {
    try {
      const deviceName = await this.getDeviceName();
      const response = await this.client.post('/mobile/session', {
        deviceId: this.deviceId,
        deviceName,
        platform: Platform.OS,
      });

      if (response.data.success && response.data.sessionId) {
        this.sessionId = response.data.sessionId;
        await AsyncStorage.setItem('api_session_id', this.sessionId!);
        console.log('Mobile session created:', this.sessionId);
      } else {
        throw new Error('Failed to create session');
      }
    } catch (error) {
      console.error('Session creation failed:', error);
      throw error;
    }
  }

  private async validateSession(): Promise<void> {
    try {
      const response = await this.client.get('/mobile/session');
      if (!response.data.success) {
        throw new Error('Session invalid');
      }
    } catch (error) {
      // Session is invalid, create new one
      await this.createSession();
    }
  }

  async getSession(): Promise<SessionInfo | null> {
    try {
      const response = await this.client.get('/mobile/session');
      if (response.data.success) {
        return {
          ...response.data.session,
          lastActivity: new Date(response.data.session.lastActivity),
        };
      }
      return null;
    } catch (error) {
      console.error('Failed to get session:', error);
      return null;
    }
  }

  // Chat functionality
  async sendMessage(
    message: string,
    isVoice: boolean = false,
    context?: any
  ): Promise<ApiResponse<{message: ChatMessage; userMessage: ChatMessage}>> {
    return this.makeRequest(async () => {
      const response = await this.client.post('/mobile/chat', {
        message,
        isVoice,
        context,
      });

      if (response.data.success) {
        return {
          success: true,
          data: {
            message: {
              ...response.data.message,
              timestamp: new Date(response.data.message.timestamp),
            },
            userMessage: {
              ...response.data.userMessage,
              timestamp: new Date(response.data.userMessage.timestamp),
            },
          },
        };
      } else {
        throw new Error(response.data.error || 'Failed to send message');
      }
    });
  }

  async getChatHistory(
    limit: number = 50,
    offset: number = 0
  ): Promise<ApiResponse<{messages: ChatMessage[]; total: number}>> {
    return this.makeRequest(async () => {
      const response = await this.client.get('/mobile/chat/history', {
        params: {limit, offset},
      });

      if (response.data.success) {
        return {
          success: true,
          data: {
            messages: response.data.messages.map((msg: any) => ({
              ...msg,
              timestamp: new Date(msg.timestamp),
            })),
            total: response.data.total,
          },
        };
      } else {
        throw new Error(response.data.error || 'Failed to get chat history');
      }
    });
  }

  async clearChatHistory(): Promise<ApiResponse> {
    return this.makeRequest(async () => {
      const response = await this.client.delete('/mobile/chat/history');
      return {
        success: response.data.success,
        data: response.data.message,
      };
    });
  }

  // Voice functionality
  async sendVoiceMessage(
    text: string,
    language: string = 'en-US',
    context?: any
  ): Promise<ApiResponse<{message: ChatMessage; userMessage: ChatMessage}>> {
    return this.makeRequest(async () => {
      const response = await this.client.post('/mobile/voice', {
        text,
        language,
        context,
      });

      if (response.data.success) {
        return {
          success: true,
          data: {
            message: {
              ...response.data.message,
              timestamp: new Date(response.data.message.timestamp),
            },
            userMessage: {
              ...response.data.userMessage,
              timestamp: new Date(response.data.userMessage.timestamp),
            },
          },
        };
      } else {
        throw new Error(response.data.error || 'Failed to process voice message');
      }
    });
  }

  // Project management
  async getProjects(): Promise<ApiResponse<{projects: Project[]}>> {
    return this.makeRequest(async () => {
      const response = await this.client.get('/mobile/projects');

      if (response.data.success) {
        return {
          success: true,
          data: {
            projects: response.data.projects.map((project: any) => ({
              ...project,
              lastModified: new Date(project.lastModified),
            })),
          },
        };
      } else {
        throw new Error(response.data.error || 'Failed to get projects');
      }
    });
  }

  async openProject(
    projectId: string,
    projectPath: string
  ): Promise<ApiResponse<{project: ProjectDetails}>> {
    return this.makeRequest(async () => {
      const response = await this.client.post(`/mobile/projects/${projectId}/open`, {
        projectPath,
      });

      if (response.data.success) {
        return {
          success: true,
          data: {
            project: {
              ...response.data.project,
              lastModified: new Date(response.data.project.lastModified),
              files: response.data.project.files?.map((file: any) => ({
                ...file,
                modified: new Date(file.modified),
              })) || [],
            },
          },
        };
      } else {
        throw new Error(response.data.error || 'Failed to open project');
      }
    });
  }

  async getCurrentProject(): Promise<ApiResponse<{project: ProjectDetails | null}>> {
    return this.makeRequest(async () => {
      const response = await this.client.get('/mobile/projects/current');

      if (response.data.success) {
        const project = response.data.project;
        return {
          success: true,
          data: {
            project: project ? {
              ...project,
              lastModified: new Date(project.lastModified),
              files: project.files?.map((file: any) => ({
                ...file,
                modified: new Date(file.modified),
              })) || [],
            } : null,
          },
        };
      } else {
        throw new Error(response.data.error || 'Failed to get current project');
      }
    });
  }

  // File operations
  async readFile(filePath: string): Promise<ApiResponse<{
    path: string;
    content: string;
    size: number;
    modified: Date;
    extension: string;
  }>> {
    return this.makeRequest(async () => {
      const response = await this.client.get('/mobile/files', {
        params: {path: filePath},
      });

      if (response.data.success) {
        return {
          success: true,
          data: {
            ...response.data.file,
            modified: new Date(response.data.file.modified),
          },
        };
      } else {
        throw new Error(response.data.error || 'Failed to read file');
      }
    });
  }

  async writeFile(filePath: string, content: string): Promise<ApiResponse<{
    path: string;
    size: number;
    modified: Date;
  }>> {
    return this.makeRequest(async () => {
      const response = await this.client.put('/mobile/files', {
        path: filePath,
        content,
      });

      if (response.data.success) {
        return {
          success: true,
          data: {
            ...response.data.file,
            modified: new Date(response.data.file.modified),
          },
        };
      } else {
        throw new Error(response.data.error || 'Failed to write file');
      }
    });
  }

  // Connection status and listeners
  getConnectionStatus(): boolean {
    return this.isConnected;
  }

  onConnectionChange(callback: (connected: boolean) => void) {
    this.connectionListeners.push(callback);
    return () => {
      const index = this.connectionListeners.indexOf(callback);
      if (index > -1) {
        this.connectionListeners.splice(index, 1);
      }
    };
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(callback => callback(connected));
  }

  // Polling for real-time updates (replaces WebSocket)
  startPolling(interval: number = 5000) {
    this.stopPolling();
    
    this.polling = setInterval(async () => {
      if (!this.isConnected) return;

      try {
        // Poll for session updates
        const session = await this.getSession();
        if (session) {
          this.notifyPollingCallbacks('session_update', session);
        }

        // Poll for project updates if there's an active project
        const currentProject = await this.getCurrentProject();
        if (currentProject.data?.project) {
          this.notifyPollingCallbacks('project_update', currentProject.data.project);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, interval);
  }

  stopPolling() {
    if (this.polling) {
      clearInterval(this.polling);
      this.polling = null;
    }
  }

  onPollingUpdate(event: string, callback: (data: any) => void) {
    this.pollingCallbacks.set(event, callback);
    return () => {
      this.pollingCallbacks.delete(event);
    };
  }

  private notifyPollingCallbacks(event: string, data: any) {
    const callback = this.pollingCallbacks.get(event);
    if (callback) {
      callback(data);
    }
  }

  // Health check
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/mobile/health');
      return response.data.status === 'OK';
    } catch (error) {
      return false;
    }
  }

  // Utility methods
  private async makeRequest<T>(requestFn: () => Promise<T>): Promise<T> {
    if (!this.isConnected) {
      // Queue request for retry when reconnected
      return new Promise((resolve, reject) => {
        this.retryQueue.push(async () => {
          try {
            const result = await requestFn();
            resolve(result);
          } catch (error) {
            reject(error);
          }
        });
      });
    }

    try {
      return await this.retryRequest(requestFn, this.config.retryAttempts || 3);
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  }

  private async retryRequest<T>(
    requestFn: () => Promise<T>,
    attempts: number
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error) {
      if (attempts > 1) {
        await this.delay(this.config.retryDelay || 1000);
        return this.retryRequest(requestFn, attempts - 1);
      }
      throw error;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private processRetryQueue() {
    const queue = [...this.retryQueue];
    this.retryQueue = [];
    
    queue.forEach(async (requestFn) => {
      try {
        await requestFn();
      } catch (error) {
        console.error('Retry queue request failed:', error);
      }
    });
  }

  private async getDeviceName(): Promise<string> {
    try {
      const deviceName = Platform.select({
        ios: 'iOS Device',
        android: 'Android Device',
        default: 'Mobile Device',
      });
      
      // Try to get more specific device info if available
      return `${deviceName} (${Platform.Version})`;
    } catch (error) {
      return 'Mobile Device';
    }
  }

  // Update base URL (for changing server connection)
  updateBaseURL(baseURL: string) {
    this.config.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  // Get debug information
  getDebugInfo() {
    return {
      deviceId: this.deviceId,
      sessionId: this.sessionId,
      isConnected: this.isConnected,
      baseURL: this.config.baseURL,
      retryQueueLength: this.retryQueue.length,
      pollingActive: this.polling !== null,
    };
  }
}

export default ApiService;