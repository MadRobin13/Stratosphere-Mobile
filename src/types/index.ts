export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  isVoice?: boolean;
  isLoading?: boolean;
}

export interface Repository {
  id: string;
  name: string;
  fullName: string;
  description?: string;
  language?: string;
  url: string;
  isPrivate: boolean;
  updatedAt: Date;
}

export interface ProjectFile {
  name: string;
  path: string;
  relativePath: string;
  size: number;
  modified: Date;
  extension: string;
}

export interface ProjectStructure {
  [key: string]: ProjectStructure | ProjectFileInfo;
}

export interface ProjectFileInfo {
  type: 'file';
  size: number;
  extension: string;
}

export interface Connection {
  id: string;
  name: string;
  host: string;
  port: number;
  isConnected: boolean;
  lastConnected?: Date;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  avatarUrl?: string;
  githubToken?: string;
}

export interface VoiceRecording {
  uri: string;
  duration: number;
  timestamp: Date;
}

export interface AIResponse {
  success: boolean;
  response?: string;
  error?: string;
  model: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
  projectContext?: {
    path: string;
    files: ProjectFile[];
    structure: ProjectStructure;
  };
}

export interface AppSettings {
  theme: 'light' | 'dark' | 'system';
  voiceEnabled: boolean;
  autoSend: boolean;
  connectionSettings: {
    host: string;
    port: number;
    autoReconnect: boolean;
  };
  geminiApiKey?: string;
}

export type RootStackParamList = {
  ProjectSelection: undefined;
  Onboarding: undefined;
  Setup: undefined;
  Main: undefined;
  Chat: { sessionId?: string };
  Projects: undefined;
  Settings: undefined;
  Profile: undefined;
  ConnectionSetup: undefined;
  GitHubAuth: undefined;
};

export type MainTabParamList = {
  Chat: undefined;
  Voice: undefined;
};
