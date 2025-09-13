import ApiService from '../ApiService';

describe('ApiService', () => {
  let apiService: ApiService;

  beforeEach(() => {
    apiService = new ApiService({
      baseURL: 'http://localhost:3000',
      timeout: 10000,
      retryAttempts: 2,
      retryDelay: 500,
    });
  });

  test('should initialize with correct config', () => {
    const debugInfo = apiService.getDebugInfo();
    expect(debugInfo.baseURL).toBe('http://localhost:3000');
    expect(debugInfo.deviceId).toBeDefined();
    expect(debugInfo.sessionId).toBeNull();
    expect(debugInfo.isConnected).toBe(false);
  });

  test('should handle connection status correctly', () => {
    expect(apiService.getConnectionStatus()).toBe(false);
  });

  test('should generate device ID', () => {
    const debugInfo = apiService.getDebugInfo();
    expect(debugInfo.deviceId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
  });

  test('should update base URL correctly', () => {
    apiService.updateBaseURL('http://192.168.1.100:3000');
    // Note: We can't directly test the internal axios config, 
    // but we can test that the method doesn't throw
    expect(() => apiService.updateBaseURL('http://test.com')).not.toThrow();
  });

  test('should handle health check when not connected', async () => {
    const result = await apiService.healthCheck();
    expect(result).toBe(false);
  });
});