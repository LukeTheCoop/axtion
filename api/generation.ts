import { v4 as uuidv4 } from 'uuid';

// Types for API requests and responses
export interface GenerateScriptRequest {
  mothership: string;
  prompt: string;
  genre: string;
  agent: string;
  session_id: string;
}

export interface SessionRequest {
  session_id: string;
}

export interface ApiResponse {
  success: boolean;
  message?: string;
  error?: string;
  data?: any;
}

// Function to generate a random session ID
export const generateSessionId = (): string => {
  return uuidv4();
};

// Base API call function with error handling
const apiCall = async <T>(
  endpoint: string, 
  method: string = 'POST', 
  body: any = null
): Promise<ApiResponse> => {
  try {
    const response = await fetch(`/api/${endpoint}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: body ? JSON.stringify(body) : null,
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.error || `Error: ${response.status} ${response.statusText}`,
      };
    }

    // Create a response that includes both the standard format and any additional properties from data
    const result: ApiResponse = {
      success: true,
      data
    };

    // If the backend returns videoUrl at top level, include it in our response
    if (data.videoUrl) {
      (result as any).videoUrl = data.videoUrl;
    }
    
    return result;
  } catch (error) {
    console.error(`API call to ${endpoint} failed:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
};

// Generate Script API
export const generateScript = async (
  mothership: string,
  prompt: string,
  genre: string = 'military',
  agent: string = 'medium',
  session_id: string
): Promise<ApiResponse> => {
  return apiCall<ApiResponse>('generate-script', 'POST', {
    mothership,
    prompt,
    genre,
    agent,
    session_id,
  });
};

// Parse Script API
export const parseScript = async (
  session_id: string
): Promise<ApiResponse> => {
  return apiCall<ApiResponse>('parse-script', 'POST', { session_id });
};

// Create Speech API
export const createSpeech = async (
  session_id: string
): Promise<ApiResponse> => {
  return apiCall<ApiResponse>('create-speech', 'POST', { session_id });
};

// Merge Videos API
export const mergeVideos = async (
  session_id: string
): Promise<ApiResponse> => {
  return apiCall<ApiResponse>('merge-videos', 'POST', { session_id });
};

// Add Captions API
export const addCaptions = async (
  session_id: string
): Promise<ApiResponse> => {
  return apiCall<ApiResponse>('add-captions', 'POST', { session_id });
};

// Add Music API
export const addMusic = async (
  session_id: string
): Promise<ApiResponse> => {
  return apiCall<ApiResponse>('add-music', 'POST', { session_id });
};

// Get Video URL API
export const getVideoUrl = async (
  session_id: string
): Promise<ApiResponse> => {
  return apiCall<ApiResponse>('get-video-url', 'POST', { session_id });
}; 