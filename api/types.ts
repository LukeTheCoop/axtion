export interface ConfigRequest {
  object?: string | null;
  action?: string | null;
  genre?: string | null;
  agent?: string | null;
}

interface DataWithPrompt {
  last_used_mothership: string;
  last_used_prompt: string;
  [key: string]: any; // Allow for additional properties
}

interface VoiceData {
  voice: string;
  speed: number;
  pitch: number;
  [key: string]: any;
}

interface MusicData {
  videoId: string;
  volume: number;
  startTime: number;
  [key: string]: any;
}

export interface ConfigResponse {
  success: boolean;
  message: string;
  config: null;
  data: DataWithPrompt | VoiceData | MusicData;
  object: null;
  action: null;
  genre: null;
  agent: null;
} 