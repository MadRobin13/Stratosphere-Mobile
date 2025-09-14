import AsyncStorage from '@react-native-async-storage/async-storage';

export const StorageKeys = {
  IP_ADDRESS: 'connection_ip_address',
  PORT: 'connection_port',
  LAST_CONNECTION: 'last_connection_time',
};

export const saveConnectionSettings = async (ipAddress, port) => {
  try {
    await AsyncStorage.setItem(StorageKeys.IP_ADDRESS, ipAddress);
    await AsyncStorage.setItem(StorageKeys.PORT, port);
    await AsyncStorage.setItem(StorageKeys.LAST_CONNECTION, new Date().toISOString());
    return true;
  } catch (error) {
    console.error('Failed to save connection settings:', error);
    return false;
  }
};

export const loadConnectionSettings = async () => {
  try {
    const ipAddress = await AsyncStorage.getItem(StorageKeys.IP_ADDRESS);
    const port = await AsyncStorage.getItem(StorageKeys.PORT);
    return {
      ipAddress: ipAddress || '10.36.200.2',
      port: port || '3001',
    };
  } catch (error) {
    console.error('Failed to load connection settings:', error);
    return {
      ipAddress: '10.36.200.2',
      port: '3001',
    };
  }
};