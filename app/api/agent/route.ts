import { NextRequest, NextResponse } from 'next/server';
import { fetchAgentConfig, updateAgentConfig } from '../../../api/agent';

export async function GET() {
  try {
    const config = await fetchAgentConfig();
    
    // Log the response for debugging
    console.log('Agent Config API response:', config);
    
    if (config.success) {
      // Handle the case where we have system_prompt in the API response
      const prompt = config.data?.system_prompt || config.data?.last_used_prompt || '';
      const mothership = config.data?.last_used_mothership || '';
      
      return NextResponse.json({
        mothership: mothership,
        prompt: prompt,
      });
    } else {
      return NextResponse.json(
        { error: 'Failed to fetch agent configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in agent config route:', error);
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
      system_prompt?: string;
      last_used_mothership?: string;
    } = {};
    
    // Add fields only if they're provided in the request body
    if (body.system_prompt !== undefined) {
      updatePayload.system_prompt = body.system_prompt;
    }
    
    if (body.mothership !== undefined) {
      updatePayload.last_used_mothership = body.mothership;
    }
    
    // Only proceed if we have something to update
    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }
    
    // Log the update payload
    console.log('Updating agent config with:', updatePayload);
    
    const response = await updateAgentConfig(updatePayload);
    
    if (response.success) {
      return NextResponse.json({ 
        success: true,
        message: 'Agent configuration updated successfully'
      });
    } else {
      return NextResponse.json(
        { error: response.message || 'Failed to update agent configuration' },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error in agent config update route:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 