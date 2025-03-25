import { NextRequest, NextResponse } from 'next/server';

/**
 * POST handler for creating a new genre
 */
export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    
    // Check if genre is provided
    if (!body.genre) {
      return NextResponse.json(
        { success: false, message: 'Genre is required' },
        { status: 400 }
      );
    }
    
    const { genre } = body;
    
    // For demo/testing purposes, just return success
    // In a real app, you would save this to a database
    console.log(`Creating new genre: ${genre}`);
    
    return NextResponse.json({
      success: true,
      message: `Genre "${genre}" created successfully`,
    });
  } catch (error) {
    console.error('Error creating genre:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to create genre' },
      { status: 500 }
    );
  }
} 