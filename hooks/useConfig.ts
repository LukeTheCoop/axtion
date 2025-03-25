import { useState, useEffect } from 'react';

interface ConfigData {
  mothership: string;
  prompt: string;
  genre: string;
  isLoading: boolean;
  error: string | null;
  setGenre: (genre: string) => void;
}

export function useConfig() {
  const [configData, setConfigData] = useState<ConfigData>({
    mothership: '',
    prompt: '',
    genre: '', // Remove the default genre
    isLoading: true,
    error: null,
    setGenre: () => {} // Initialize with empty function
  });

  // Add function to update genre
  const setGenre = (genre: string) => {
    // Update localStorage
    localStorage.setItem('selectedGenre', genre);
    
    // Update state
    setConfigData(prev => ({
      ...prev,
      genre
    }));
    
    // Optionally update the backend config if needed
    // This can be implemented if there's an API endpoint for it
  };

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
        
        // Get the genre from localStorage first for immediate response
        const localGenre = localStorage.getItem('selectedGenre');
        
        setConfigData({
          mothership: data.mothership || '',
          prompt: data.prompt || '',
          // Prioritize API response, then localStorage, then empty string (no default)
          genre: data.genre || localGenre || '',
          isLoading: false,
          error: null,
          setGenre // Assign the function
        });
      } catch (error) {
        console.error('Error loading config:', error);
        
        // Try to use localStorage as fallback if API fails
        const localGenre = localStorage.getItem('selectedGenre');
        
        setConfigData(prev => ({
          ...prev,
          genre: localGenre || '',
          isLoading: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          setGenre // Assign the function
        }));
      }
    }

    loadConfig();
  }, []);

  return { ...configData, setGenre };
} 