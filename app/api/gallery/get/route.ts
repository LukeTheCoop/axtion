import { NextRequest, NextResponse } from 'next/server';
import militaryVideos from '@/lib/gallery/military.json';

// Store other genres data in memory for the demo
const genreData: Record<string, Record<string, string>> = {
  'military': militaryVideos as Record<string, string>,
  // Other genres will be populated at runtime
};

/**
 * GET handler for retrieving videos for a genre
 */
export async function GET(request: NextRequest) {
  try {
    // Get the genre from the URL query parameters
    const { searchParams } = new URL(request.url);
    const genre = searchParams.get('genre');
    
    if (!genre) {
      return NextResponse.json(
        { success: false, message: 'Genre parameter is required' },
        { status: 400 }
      );
    }
    
    // If we don't have data for this genre yet, return empty data
    if (!genreData[genre]) {
      genreData[genre] = {}; // Initialize empty genre data
    }
    
    return NextResponse.json({
      success: true,
      message: `Gallery retrieved for genre: ${genre}`,
      data: genreData[genre],
      session_id: null
    });
  } catch (error) {
    console.error('Error retrieving gallery:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'Failed to retrieve gallery',
        data: {},
        session_id: null
      },
      { status: 500 }
    );
  }
} 