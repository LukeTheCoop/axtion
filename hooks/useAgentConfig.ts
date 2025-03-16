import { useState, useEffect } from 'react';

interface AgentConfigData {
  mothership: string;
  prompt: string;
  isLoading: boolean;
  error: string | null;
}

export function useAgentConfig() {
  const [configData, setConfigData] = useState<AgentConfigData>({
    mothership: '',
    prompt: '',
    isLoading: true,
    error: null
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        console.log('Fetching agent config from API...');
        const response = await fetch('/api/agent');
        
        if (!response.ok) {
          throw new Error(`Failed to load agent configuration: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Agent config data received:', data);
        
        if (!data.mothership && !data.prompt) {
          console.warn('Agent config data does not contain expected fields:', data);
        }
        
        setConfigData({
          mothership: data.mothership || '',
          prompt: data.prompt || '',
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error loading agent config:', error);
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