import { useState, useEffect, useCallback } from 'react';

interface VoiceConfigData {
  voice: string;
  speed: number;
  pitch: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useVoiceConfig() {
  const [configData, setConfigData] = useState<Omit<VoiceConfigData, 'refresh'>>({
    voice: 'Edward', // Default voice
    speed: 0,
    pitch: 1,
    isLoading: true,
    error: null
  });

  const loadConfig = useCallback(async () => {
    try {
      console.log('Fetching voice config from API...');
      setConfigData(prev => ({ ...prev, isLoading: true }));
      
      const response = await fetch('/api/voice');
      
      if (!response.ok) {
        throw new Error(`Failed to load voice configuration: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('Voice config data received:', data);
      
      if (!data.voice) {
        console.warn('Voice config data does not contain expected fields:', data);
      }
      
      setConfigData({
        voice: data.voice || 'Edward',
        speed: data.speed !== undefined ? data.speed : 0,
        pitch: data.pitch !== undefined ? data.pitch : 1,
        isLoading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading voice config:', error);
      setConfigData(prev => ({
        ...prev,
        isLoading: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }));
    }
  }, []);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  return {
    ...configData,
    refresh: loadConfig
  };
} 