import { NextRequest, NextResponse } from 'next/server';

// Hardcoded API URL - same as used for config updates
const API_BASE_URL = 'http://0.0.0.0:8000/api';

// Fallback response in case the API call fails
const fallbackResponse = {
  success: true,
  message: "Script generated successfully (fallback response)",
  data: {
    script: "This is a fallback generated script...",
    // Any other data you might need
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON request body
    const body = await request.json();
    
    // Extract required fields
    const { mothership, prompt, genre, agent, session_id } = body;
    
    // Validate inputs
    if (!mothership || !prompt || !session_id) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    console.log(`Processing generate-script request for session: ${session_id}`);
    console.log(`Input - Mothership: ${mothership.substring(0, 50)}...`);
    console.log(`Input - Prompt: ${prompt.substring(0, 50)}...`);
    console.log(`Input - Genre: ${genre}, Agent: ${agent}`);
    
    // Make the actual API call to your backend service
    try {
      const response = await fetch(`${API_BASE_URL}/generate-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          mothership,
          prompt,
          genre,
          agent,
          session_id
        })
      });
      
      if (!response.ok) {
        throw new Error(`Backend API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      return NextResponse.json(data);
    } catch (apiError) {
      console.error("Error calling backend API:", apiError);
      console.warn("Using fallback response due to API error");
      
      // For development purposes, return a fallback response
      // In production, you might want to propagate the error
      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error("Error generating script:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate script" },
      { status: 500 }
    );
  }
} 