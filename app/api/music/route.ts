import { NextRequest, NextResponse } from 'next/server';
import { fetchMusicConfig, updateMusicConfig } from '../../../api/music';

export async function GET() {
  try {
    const config = await fetchMusicConfig();
    
    // Log the response for debugging
    console.log('Music Config API response:', config);
    
    if (config.success) {
      // Check if data uses url property
      if (config.data?.url) {
        // Extract videoId from url
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = config.data.url.match(regExp);
        const videoId = (match && match[2].length === 11) ? match[2] : '';
        
        return NextResponse.json({
          videoId: videoId,
          volume: config.data?.volume || 100,
          startTime: config.data?.start_time || 0,
        });
      } else {
        // Fall back to default properties
        return NextResponse.json({
          videoId: config.data?.videoId || '',
          volume: config.data?.volume || 100,
          startTime: config.data?.startTime || config.data?.start_time || 0,
        });
      }
    } else {
      return NextResponse.json(
        { error: 'Failed to fetch music configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in music config route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Format the update payload with proper typing
    const updatePayload: {
      url?: string;
      volume?: number;
      start_time?: number;
    } = {
      url: body.url,
      volume: typeof body.volume === 'number' ? body.volume : undefined,
      start_time: typeof body.start_time === 'number' ? body.start_time : undefined,
    };
    
    // Remove undefined properties
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key as keyof typeof updatePayload] === undefined) {
        delete updatePayload[key as keyof typeof updatePayload];
      }
    });
    
    // Log the update payload
    console.log('Updating music config with:', updatePayload);
    
    const response = await updateMusicConfig(updatePayload);
    
    if (response.success) {
      return NextResponse.json({ 
        success: true,
        message: 'Music configuration updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: response.message || 'Failed to update music configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in music config update route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 