import { NextRequest, NextResponse } from 'next/server';
import { fetchConfig, updateConfig } from '../../../api/config';

export async function GET() {
  try {
    const config = await fetchConfig();
    
    // Log the response for debugging
    console.log('Config API response:', config);
    
    if (config.success) {
      return NextResponse.json({
        mothership: config.data.last_used_mothership,
        prompt: config.data.last_used_prompt,
        genre: config.data.last_used_genre || '',
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to fetch configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in config route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Need both mothership and prompt every time
    const currentConfig = await fetchConfig();
    
    // Get the current values to use as defaults
    const currentMothership = currentConfig.success ? (currentConfig.data.last_used_mothership || '') : '';
    const currentPrompt = currentConfig.success ? (currentConfig.data.last_used_prompt || '') : '';
    const currentGenre = currentConfig.success ? (currentConfig.data.last_used_genre || '') : '';
    
    // Format the update payload with proper typing
    const updatePayload = {
      last_used_mothership: body.mothership !== undefined ? body.mothership : currentMothership,
      last_used_prompt: body.prompt !== undefined ? body.prompt : currentPrompt,
      last_used_genre: body.genre !== undefined ? body.genre : currentGenre,
    };
    
    // Log the update payload
    console.log('Updating user config with:', updatePayload);
    
    const response = await updateConfig(updatePayload);
    
    if (response.success) {
      return NextResponse.json({ 
        success: true,
        message: 'User configuration updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: response.message || 'Failed to update user configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in user config update route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 