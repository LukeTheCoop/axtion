/**
 * Gallery API Service
 * Handles all API calls related to the gallery functionality
 */

interface CreateGenreResponse {
  success: boolean;
  message: string;
}

interface UploadVideoResponse {
  success: boolean;
  message: string;
  data?: {
    id: string;
    title: string;
    thumbnailUrl: string;
    genre: string;
    description: string;
  };
}

interface GetGalleryResponse {
  success: boolean;
  message: string;
  data: Record<string, string>;
  session_id: string | null;
}

interface GetGenresResponse {
  success: boolean;
  message: string;
  data: {
    genres: string[];
  };
  session_id: string | null;
}

interface DeleteVideoResponse {
  success: boolean;
  message: string;
}

// External backend URL
const BACKEND_API_URL = 'http://0.0.0.0:8000';

/**
 * Fetch all available genres
 */
export async function getGenres(): Promise<GetGenresResponse> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/genres`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching genres: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch genres:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: { genres: [] },
      session_id: null,
    };
  }
}

/**
 * Create a new genre
 * @param genre The genre name to create
 */
export async function createGenre(genre: string): Promise<CreateGenreResponse> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/gallery/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ genre }),
    });

    if (!response.ok) {
      throw new Error(`Error creating genre: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to create genre:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Upload a video to a genre
 * @param genre The genre to add the video to
 * @param description Description of the video
 * @param videoUrl URL of the video
 */
export async function uploadVideo(
  genre: string,
  description: string,
  videoUrl: string
): Promise<UploadVideoResponse> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/gallery/upload`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        genre,
        description,
        video_url: videoUrl,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error uploading video: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to upload video:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Get videos for a specific genre
 * @param genre The genre to fetch videos for
 */
export async function getGallery(genre: string): Promise<GetGalleryResponse> {
  try {
    const url = new URL(`${BACKEND_API_URL}/api/gallery/get`);
    url.searchParams.append('genre', genre);
    
    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Error fetching gallery: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to fetch gallery:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
      data: {},
      session_id: null,
    };
  }
}

/**
 * Delete a video from a genre
 * @param genre The genre the video belongs to
 * @param videoName The name of the video file to delete
 */
export async function deleteVideo(
  genre: string,
  videoName: string
): Promise<DeleteVideoResponse> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/api/gallery/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        genre,
        video_name: videoName,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error deleting video: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Failed to delete video:', error);
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error occurred',
    };
  }
}

/**
 * Transform API response to VideoData format
 * @param galleryData The gallery data from the API
 * @param genre The genre of the videos
 */
export function transformGalleryData(galleryData: Record<string, string>, genre: string) {
  return Object.entries(galleryData).map(([key, url]) => ({
    id: key,
    title: key.replace(/_/g, ' ').replace(`${genre} `, ''),
    thumbnailUrl: url,
    genre,
    description: key.replace(/_/g, ' ').replace(`${genre} `, ''),
  }));
} 