import { NextRequest, NextResponse } from 'next/server';

/**
 * POST handler for uploading a video to a genre
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Check if required fields are provided
    if (!body.genre || !body.description || !body.video_url) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Genre, description, and video_url are required' 
        },
        { status: 400 }
      );
    }
    
    const { genre, description, video_url } = body;
    
    // For demo/testing purposes, generate a random ID and return success
    // In a real app, you would save this to a database
    console.log(`Uploading video to genre: ${genre}`);
    
    const videoId = `${genre}_video_${Date.now()}`;
    const thumbnailUrl = 'https://res.cloudinary.com/ddab3rxhe/image/upload/v1742226121/gallery/nature/forest_tree_animals_crawling.jpg';
    
    return NextResponse.json({
      success: true,
      message: 'Video uploaded successfully',
      data: {
        id: videoId,
        title: videoId,
        thumbnailUrl,
        genre,
        description,
      }
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to upload video' },
      { status: 500 }
    );
  }
} 