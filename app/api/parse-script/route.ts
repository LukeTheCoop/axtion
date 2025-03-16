import { NextRequest, NextResponse } from 'next/server';

// Hardcoded API URL - same as used for config updates
const API_BASE_URL = 'http://0.0.0.0:8000/api';

const fallbackResponse = {
  success: true,
  message: "Script parsed successfully (fallback response)",
  data: {
    parsedData: {
      scenes: [
        { id: 1, content: "Scene 1 content..." },
        { id: 2, content: "Scene 2 content..." }
      ]
    }
  }
};

export async function POST(request: NextRequest) {
  try {
    // Parse the JSON request body
    const body = await request.json();
    
    // Extract session_id
    const { session_id } = body;
    
    // Validate session_id
    if (!session_id) {
      return NextResponse.json(
        { success: false, error: "Missing session_id" },
        { status: 400 }
      );
    }

    console.log(`Processing parse-script request for session: ${session_id}`);
    
    // Make the actual API call to your backend service
    try {
      const response = await fetch(`${API_BASE_URL}/parse-script`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
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
      return NextResponse.json(fallbackResponse);
    }
  } catch (error) {
    console.error("Error parsing script:", error);
    return NextResponse.json(
      { success: false, error: "Failed to parse script" },
      { status: 500 }
    );
  }
} 