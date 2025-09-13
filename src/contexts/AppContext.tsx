import React, {createContext, useContext, useState, useEffect} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {v4 as uuidv4} from 'uuid';
import {ChatSession, Message, AppSettings, User} from '../types';

interface AppContextValue {
  user: User | null;
  setUser: (user: User | null) => void;
  chatSessions: ChatSession[];
  currentSession: ChatSession | null;
  createNewSession: () => ChatSession;
  selectSession: (sessionId: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (messageId: string, updates: Partial<Message>) => void;
  deleteSession: (sessionId: string) => void;
  clearAllSessions: () => void;
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
  isLoading: boolean;
  isFirstLaunch: boolean;
  setIsFirstLaunch: (value: boolean) => void;
}

const defaultSettings: AppSettings = {
  theme: 'system',
  voiceEnabled: true,
  autoSend: true,
  connectionSettings: {
    host: 'localhost',
    port: 3001,
    autoReconnect: true,
  },
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export const AppProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [user, setUser] = useState<User | null>(null);
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ChatSession | null>(null);
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState(false);

  useEffect(() => {
    loadAppData();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      saveAppData();
    }
  }, [chatSessions, settings, user, isLoading]);

  const loadAppData = async () => {
    try {
      const [
        savedUser,
        savedSessions,
        savedSettings,
        firstLaunch,
      ] = await Promise.all([
        AsyncStorage.getItem('user'),
        AsyncStorage.getItem('chatSessions'),
        AsyncStorage.getItem('settings'),
        AsyncStorage.getItem('isFirstLaunch'),
      ]);

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }

      if (savedSessions) {
        const sessions = JSON.parse(savedSessions).map((session: any) => ({
          ...session,
          createdAt: new Date(session.createdAt),
          updatedAt: new Date(session.updatedAt),
          messages: session.messages.map((msg: any) => ({
            ...msg,
            timestamp: new Date(msg.timestamp),
          })),
        }));
        setChatSessions(sessions);
        
        if (sessions.length > 0) {
          setCurrentSession(sessions[0]);
        }
      }

      if (savedSettings) {
        setSettings({...defaultSettings, ...JSON.parse(savedSettings)});
      }

      setIsFirstLaunch(firstLaunch === null);
    } catch (error) {
      console.error('Error loading app data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAppData = async () => {
    try {
      const savePromises = [];

      if (user) {
        savePromises.push(AsyncStorage.setItem('user', JSON.stringify(user)));
      }

      if (chatSessions.length > 0) {
        savePromises.push(
          AsyncStorage.setItem('chatSessions', JSON.stringify(chatSessions))
        );
      }

      savePromises.push(
        AsyncStorage.setItem('settings', JSON.stringify(settings))
      );

      await Promise.all(savePromises);
    } catch (error) {
      console.error('Error saving app data:', error);
    }
  };

  const createNewSession = (): ChatSession => {
    const newSession: ChatSession = {
      id: uuidv4(),
      title: 'New Chat',
      messages: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setChatSessions(prev => [newSession, ...prev]);
    setCurrentSession(newSession);
    return newSession;
  };

  const selectSession = (sessionId: string) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setCurrentSession(session);
    }
  };

  const addMessage = (message: Omit<Message, 'id' | 'timestamp'>) => {
    if (!currentSession) return;

    const newMessage: Message = {
      id: uuidv4(),
      timestamp: new Date(),
      ...message,
    };

    setChatSessions(prev =>
      prev.map(session =>
        session.id === currentSession.id
          ? {
              ...session,
              messages: [...session.messages, newMessage],
              updatedAt: new Date(),
              title: session.messages.length === 0 
                ? message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
                : session.title,
            }
          : session
      )
    );

    setCurrentSession(prev =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, newMessage],
            updatedAt: new Date(),
            title: prev.messages.length === 0 
              ? message.content.substring(0, 30) + (message.content.length > 30 ? '...' : '')
              : prev.title,
          }
        : null
    );
  };

  const updateMessage = (messageId: string, updates: Partial<Message>) => {
    if (!currentSession) return;

    setChatSessions(prev =>
      prev.map(session =>
        session.id === currentSession.id
          ? {
              ...session,
              messages: session.messages.map(msg =>
                msg.id === messageId ? {...msg, ...updates} : msg
              ),
              updatedAt: new Date(),
            }
          : session
      )
    );

    setCurrentSession(prev =>
      prev
        ? {
            ...prev,
            messages: prev.messages.map(msg =>
              msg.id === messageId ? {...msg, ...updates} : msg
            ),
            updatedAt: new Date(),
          }
        : null
    );
  };

  const deleteSession = (sessionId: string) => {
    setChatSessions(prev => prev.filter(session => session.id !== sessionId));
    
    if (currentSession?.id === sessionId) {
      const remainingSessions = chatSessions.filter(s => s.id !== sessionId);
      setCurrentSession(remainingSessions.length > 0 ? remainingSessions[0] : null);
    }
  };

  const clearAllSessions = () => {
    setChatSessions([]);
    setCurrentSession(null);
  };

  const updateSettings = (updates: Partial<AppSettings>) => {
    setSettings(prev => ({...prev, ...updates}));
  };

  const handleSetIsFirstLaunch = async (value: boolean) => {
    setIsFirstLaunch(value);
    if (!value) {
      await AsyncStorage.setItem('isFirstLaunch', 'false');
    }
  };

  return (
    <AppContext.Provider
      value={{
        user,
        setUser,
        chatSessions,
        currentSession,
        createNewSession,
        selectSession,
        addMessage,
        updateMessage,
        deleteSession,
        clearAllSessions,
        settings,
        updateSettings,
        isLoading,
        isFirstLaunch,
        setIsFirstLaunch: handleSetIsFirstLaunch,
      }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextValue => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};