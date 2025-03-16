import { ConfigRequest, ConfigResponse } from './types';

const API_BASE_URL = 'http://0.0.0.0:8000/api';

export async function fetchMusicConfig(): Promise<ConfigResponse> {
  const params = new URLSearchParams({
    object: 'music',
    action: 'get',
    genre: 'military',
    agent: 'medium'
  });

  try {
    const response = await fetch(`${API_BASE_URL}/config?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({}), // Empty JSON for 'get' action
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching music config:', error);
    throw error;
  }
}

export async function updateMusicConfig(config: {
  url?: string;
  volume?: number;
  start_time?: number;
}): Promise<ConfigResponse> {
  const params = new URLSearchParams({
    object: 'music',
    action: 'update',
    genre: 'military',
    agent: 'medium'
  });

  try {
    const response = await fetch(`${API_BASE_URL}/config?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(config),
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Error updating music config:', error);
    throw error;
  }
} 