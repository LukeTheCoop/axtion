import { useState, useEffect } from 'react';

interface MusicConfigData {
  videoId: string;
  volume: number;
  startTime: number;
  isLoading: boolean;
  error: string | null;
}

export function useMusicConfig() {
  const [configData, setConfigData] = useState<MusicConfigData>({
    videoId: '',
    volume: 100,
    startTime: 0,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    async function loadConfig() {
      try {
        console.log('Fetching music config from API...');
        const response = await fetch('/api/music');
        
        if (!response.ok) {
          throw new Error(`Failed to load music configuration: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        console.log('Music config data received:', data);
        
        setConfigData({
          videoId: data.videoId || '',
          volume: data.volume !== undefined ? data.volume : 100,
          startTime: data.startTime !== undefined ? data.startTime : 0,
          isLoading: false,
          error: null
        });
      } catch (error) {
        console.error('Error loading music config:', error);
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