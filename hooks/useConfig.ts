import { useState, useEffect } from 'react';

interface ConfigData {
  mothership: string;
  prompt: string;
  isLoading: boolean;
  error: string | null;
}

export function useConfig() {
  const [configData, setConfigData] = useState<ConfigData>({
    mothership: '',
    prompt: '',
    isLoading: true,
    error: null
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        console.log('Fetching config from API...');
        const response = await fetch('/api/config');
        
        if (!response.ok) {
          throw new Error(`Failed to load configuration: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Config data received:', data);
        
        if (!data.mothership && !data.prompt) {
          console.warn('Config data does not contain expected fields:', data);
        }
        
        setConfigData({
          mothership: data.mothership || '',
          prompt: data.prompt || '',
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error loading config:', error);
        setConfigData(prev => ({
          ...prev,
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        }));
      }
    }

    loadConfig();
  }, []);

  return configData;
} 