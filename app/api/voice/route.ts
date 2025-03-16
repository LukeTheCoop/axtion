import { NextRequest, NextResponse } from 'next/server';
import { fetchVoiceConfig, updateVoiceConfig } from '../../../api/voice';

export async function GET() {
  try {
    const config = await fetchVoiceConfig();
    
    // Log the response for debugging
    console.log('Voice Config API response:', config);
    
    if (config.success) {
      // Extract values from the config response
      // The response might have different fields than last_used_mothership/prompt
      // Default to Edward if no voice is specified
      return NextResponse.json({
        voice: config.data?.voice || 'Edward',
        speed: config.data?.speed || 0,
        pitch: config.data?.pitch || 1,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to fetch voice configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in voice config route:', error);
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
      voice_id?: string;
      speed?: number;
      pitch?: number;
    } = {
      voice_id: body.voice,
      speed: typeof body.speed === 'number' ? body.speed : undefined,
      pitch: typeof body.pitch === 'number' ? body.pitch : undefined,
    };
    
    // Remove undefined properties
    Object.keys(updatePayload).forEach(key => {
      if (updatePayload[key as keyof typeof updatePayload] === undefined) {
        delete updatePayload[key as keyof typeof updatePayload];
      }
    });
    
    // Log the update payload
    console.log('Updating voice config with:', updatePayload);
    
    const response = await updateVoiceConfig(updatePayload);
    
    if (response.success) {
      return NextResponse.json({ 
        success: true,
        message: 'Voice configuration updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: response.message || 'Failed to update voice configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in voice config update route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 