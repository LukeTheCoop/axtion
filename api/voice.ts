import { ConfigRequest, ConfigResponse } from './types';

const API_BASE_URL = 'http://0.0.0.0:8000/api';

export async function fetchVoiceConfig(): Promise<ConfigResponse> {
  const params = new URLSearchParams({
    object: 'voice',
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
    console.error('Error fetching voice config:', error);
    throw error;
  }
}

export async function updateVoiceConfig(config: {
  voice_id?: string;
  speed?: number;
  pitch?: number;
}): Promise<ConfigResponse> {
  const params = new URLSearchParams({
    object: 'voice',
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
    console.error('Error updating voice config:', error);
    throw error;
  }
} 