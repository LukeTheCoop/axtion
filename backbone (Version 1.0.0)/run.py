from fastapi import FastAPI, HTTPException, BackgroundTasks, Body, Query, Path, Depends
from fastapi.responses import JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List, Union
import os
import json
import time
import sys
import uuid
from enum import Enum
import threading
from pathlib import Path
import uvicorn
import json
import os
import re
import sys

# Import the components from our app
sys.path.append('./app')
from app.audio_manage import AudioManager
from app.script_manage import ScriptManager
from app.merge_video import VideoMerger
from app.captions import CaptionAdder
from app.config import Config
from app.agent import Agent_Medium
from app.delivery import Delivery

# Create a session manager for state persistence
class SessionManager:
    def __init__(self):
        self.sessions = {}
        self.session_dir = Path("data/sessions")
        self.session_dir.mkdir(parents=True, exist_ok=True)
        
    def create_session(self):
        """Create a new session with a unique ID"""
        session_id = str(uuid.uuid4())
        self.sessions[session_id] = {
            "created_at": time.time(),
            "script": None,
            "audio_path": None,
            "video_path": None
        }
        return session_id
        
    def get_session(self, session_id):
        """Get a session by ID"""
        return self.sessions.get(session_id)
        
    def update_session(self, session_id, key, value):
        """Update a specific value in a session"""
        if session_id in self.sessions:
            self.sessions[session_id][key] = value
            # Save to file for persistence
            self._save_session(session_id)
            return True
        return False
        
    def _save_session(self, session_id):
        """Save session data to file"""
        session_file = self.session_dir / f"{session_id}.json"
        with open(session_file, "w") as f:
            json.dump(self.sessions[session_id], f)
            
    def _load_session(self, session_id):
        """Load session data from file"""
        session_file = self.session_dir / f"{session_id}.json"
        if session_file.exists():
            with open(session_file, "r") as f:
                self.sessions[session_id] = json.load(f)
                return True
        return False

# Initialize the session manager
session_manager = SessionManager()

app = FastAPI(
    title="Video Generation API",
    description="API for generating videos with AI-generated scripts, text-to-speech, and video editing",
    version="1.0.0"
)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allow all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods
    allow_headers=["*"],  # Allow all headers
)

class ConfigResponse(BaseModel):
    success: bool = True
    message: str = "Config updated successfully"
    config: Optional[str] = None
    data: Optional[dict] = None
    object: Optional[str] = None
    action: Optional[str] = None
    genre: Optional[str] = None
    agent: Optional[str] = None

@app.post("/api/config", response_model=ConfigResponse, tags=["Config"])
async def update_config(
    object: Optional[str] = None,
    action: Optional[str] = None,
    genre: Optional[str] = None,
    agent: Optional[str] = None,
    data: Optional[dict] = None
):
    """
    Update the config for the API.
    """
    config = Config(genre, agent)

    config.config_pipeline(object, action, data)

    return ConfigResponse(success=True, message="Config updated successfully", data=config.data)

# Models for request/response
class ScriptRequest(BaseModel):
    mothership: str
    prompt: str
    genre: str = "military"
    agent: str = "medium"
    session_id: Optional[str] = None

class SessionRequest(BaseModel):
    session_id: str

class GenericResponse(BaseModel):
    success: bool
    message: str
    data: Optional[dict] = None
    session_id: Optional[str] = None

def sanitize_script(script):
    """
    Sanitize the script to fix common issues with AI-generated content.
    """
    if not script:
        return script
        
    # Fix duplicate line keys
    script = re.sub(r'"line": "(.*?)"\s*"line": "(.*?)"', r'"line": "\1\2"', script)
    
    # Fix incomplete JSON blocks
    if '```json' in script and '```' not in script.split('```json', 1)[1]:
        script += "\n```"
    
    # Make sure the final tag is present
    if not script.strip().endswith('final'):
        script = script.strip() + "\nfinal"
    
    return script


@app.post("/api/generate-script", response_model=GenericResponse, tags=["Script"])
async def generate_script(request: ScriptRequest):
    """
    Generate an AI script based on the provided prompt and parameters.
    """
    # Create a new session or use the provided one
    session_id = request.session_id or session_manager.create_session()
    
    try:
        with open(f"app/data/videos/{request.genre}/video_list.json", "r") as f:
            video_list = json.load(f)
    except FileNotFoundError:
        print("Warning: video_list.json not found. Using a predefined script instead.")
        video_list = []

    # Fix: Await the async function and access the data property of the returned object
    config_response = await update_config(object='agent', action='get', genre=request.genre, agent=request.agent, data=None)
    system = config_response.data['system_prompt']

    
    
    print(f'system: {system}\n\n')
    print("Generating script...\n\n")
    agent = Agent_Medium(system, request.mothership, request.prompt, str(video_list))
    raw_script = agent.generate_response()
    print(f"Raw script received from agent (length: {len(raw_script)})\n\n")

    script = sanitize_script(raw_script)
    print(f"Script sanitized (length: {len(script)})\n\n")
    
    # Store script in session along with genre and agent
    session_manager.update_session(session_id, "script", script)
    session_manager.update_session(session_id, "genre", request.genre)
    session_manager.update_session(session_id, "agent", request.agent)
    
    # Save script to a file in the session directory
    script_file = session_manager.session_dir / f"{session_id}_script.txt"
    with open(script_file, "w") as f:
        f.write(script)

    return GenericResponse(
        success=True,
        message="Script generated successfully",
        data={"script": script},
        session_id=session_id
    )

@app.post("/api/parse-script", response_model=GenericResponse, tags=["Script"])
async def parse_script(request: SessionRequest):
    """
    Parse the script to extract the data.
    """
    # Get script from session
    session = session_manager.get_session(request.session_id)
    
    # Check if session doesn't exist but script file does
    script_file = session_manager.session_dir / f"{request.session_id}_script.txt"
    if not session and script_file.exists():
        # Create a new session for this ID
        print(f"Creating new session for existing script file: {request.session_id}")
        session_manager.sessions[request.session_id] = {
            "created_at": time.time(),
            "script": None,
            "audio_path": None,
            "video_path": None
        }
        # Try to load the script
        with open(script_file, "r") as f:
            script = f.read()
            session_manager.update_session(request.session_id, "script", script)
            session = session_manager.get_session(request.session_id)
    # If session doesn't exist in memory or doesn't have a script
    elif not session or not session.get("script"):
        # Try to load session from file
        if not session:
            session_loaded = session_manager._load_session(request.session_id)
            if session_loaded:
                session = session_manager.get_session(request.session_id)
            else:
                raise HTTPException(status_code=404, detail="Session not found. Make sure to call /api/generate-script first.")
                
        # If we still don't have a script, try to load it directly from script file
        if not session or not session.get("script"):
            if script_file.exists():
                with open(script_file, "r") as f:
                    script = f.read()
                    # Update session with script from file
                    if session_manager.update_session(request.session_id, "script", script):
                        session = session_manager.get_session(request.session_id)
                    else:
                        raise HTTPException(status_code=500, detail="Failed to update session with script from file")
            else:
                raise HTTPException(status_code=400, detail="No script found in session or files. Please generate a script first.")
    
    # Now we should have a valid session with a script
    if not session or not session.get("script"):
        raise HTTPException(status_code=500, detail="Failed to retrieve script after attempted recovery")
        
    script = session["script"]
    
    script_manager = ScriptManager(script)
    lines = script_manager.extract_data()  # This also initializes full_script and videos
    
    # Store parsed data in session
    session_manager.update_session(request.session_id, "parsed_script", {
        "lines": lines,
        "full_script": script_manager.full_script,
        "videos": script_manager.videos
    })

    return GenericResponse(
        success=True, 
        message="Script parsed successfully", 
        data={"lines": lines, "videos": script_manager.videos},
        session_id=request.session_id
    )

@app.post("/api/create-speech", response_model=GenericResponse, tags=["Speech"])
async def create_speech(request: SessionRequest):
    """
    Create speech audio from the provided script.
    """
    # Validate session_id is provided
    if not request.session_id:
        raise HTTPException(status_code=400, detail="session_id is required")
        
    # Get parsed script from session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found. Make sure to call /api/generate-script first to create a session.")
    
    if not session.get("parsed_script"):
        # Check if script exists but hasn't been parsed
        if session.get("script"):
            raise HTTPException(
                status_code=400, 
                detail="Script exists but hasn't been parsed. Call /api/parse-script before /api/create-speech."
            )
        else:
            raise HTTPException(
                status_code=400, 
                detail="No script found in session. Call /api/generate-script and /api/parse-script first."
            )
    
    parsed_script = session["parsed_script"]
    
    # Get genre and agent from session
    genre = session.get("genre", "military")  # Default to military if not found
    agent = session.get("agent", "medium")    # Default to medium if not found
    
    # Debug what we're working with
    print(f"Parsed script keys: {parsed_script.keys()}")
    print(f"Using genre: {genre}, agent: {agent}")
    
    # The AudioManager expects a single string, not a list of dictionaries
    # Check if we have the full_script to use
    if "full_script" in parsed_script and parsed_script["full_script"]:
        # Use the full script directly if available
        script_text = parsed_script["full_script"]
        print(f"Using full_script (length: {len(script_text)})")
    else:
        # Extract text from each line and combine into a single narrative
        lines = parsed_script.get("lines", [])
        if not lines:
            raise HTTPException(status_code=400, detail="No lines found in parsed script")
        
        # Combine all lines into a single text
        script_text = "\n".join([line.get("line", "") for line in lines])
        print(f"Combined script lines into text (length: {len(script_text)})")
    
    # Ensure script_text is a string
    if not isinstance(script_text, str):
        script_text = str(script_text)
    
    # Use AudioManager to generate speech from the script text
    audio_manager = AudioManager()

    # Get voice configuration using genre and agent from session
    config_response = await update_config(object='voice', action='get', genre=genre, agent=agent, data=None)
    voice_id = config_response.data['voice_id']
    speed = config_response.data['speed']
    pitch = config_response.data['pitch']

    print(f"voice_id: {voice_id}\n\n")
    print(f"speed: {speed}\n\n")
    print(f"pitch: {pitch}\n\n")
    try:
        # Use the process_text_to_speech method instead, which handles the generation and saving
        audio_path, timestamps_path = audio_manager.process_text_to_speech(
            text=script_text,
            voice_id=voice_id,
            audio_filename="output_audio.mp3",
            timestamps_filename="output_timestamps.json",
            speed=speed,
            pitch=pitch
        )
        print(f"Speech generation successful. Audio saved to: {audio_path}")
    except Exception as e:
        # Provide more detailed error information
        import traceback
        error_trace = traceback.format_exc()
        print(f"Speech generation error: {str(e)}\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Error generating speech: {str(e)}")
    
    # Store audio path in session
    session_manager.update_session(request.session_id, "audio_path", audio_path)
    session_manager.update_session(request.session_id, "timestamps_path", timestamps_path)
    
    return GenericResponse(
        success=True,
        message="Speech created successfully",
        data={"audio_path": audio_path, "timestamps_path": timestamps_path},
        session_id=request.session_id
    )

@app.post("/api/merge-videos", response_model=GenericResponse, tags=["Video"])
async def merge_videos(request: SessionRequest):
    """
    Merge videos according to the script and audio.
    """
    # Get data from session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=400, detail="Session not found")
    
    if not session.get("parsed_script") or not session.get("audio_path"):
        raise HTTPException(status_code=400, detail="Missing parsed script or audio path in session")
    
    if not session.get("timestamps_path"):
        raise HTTPException(status_code=400, detail="Missing timestamps path in session. Speech generation must be completed first.")
    
    parsed_script = session["parsed_script"]
    audio_path = session["audio_path"]
    timestamps_path = session["timestamps_path"]
    
    # Step 1: Load the timestamps and create video control file
    print("\nCreating video control file...")
    try:
        # Load timestamps from file
        with open(timestamps_path, 'r') as f:
            timestamps = json.load(f)
        
        # Create the video control file using the ScriptManager
        script_manager = ScriptManager(session.get("script", ""))
        script_manager.full_script = parsed_script.get("full_script", "")
        script_manager.videos = parsed_script.get("videos", [])
        
        # Use the existing parsed data
        video_control = script_manager.create_video_control(timestamps)
        video_control_path = script_manager.save_video_control(video_control, "video_control.json")
        print(f"Video control file created: {video_control_path}")
        
        # Store video control path in session
        session_manager.update_session(request.session_id, "video_control_path", video_control_path)
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error creating video control file: {str(e)}\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Error creating video control file: {str(e)}")
    
    # Step 2: Merge videos using the VideoMerger
    print("\nMerging videos...")
    try:
        # Initialize the VideoMerger with the video control file
        merger = VideoMerger(video_control_path)
        video_path = merger.process()
        print(f"Merged video saved to: {video_path}")
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error merging videos: {str(e)}\n{error_trace}")
        raise HTTPException(status_code=500, detail=f"Error merging videos: {str(e)}")
    
    # Store video path in session
    session_manager.update_session(request.session_id, "video_path", video_path)
    
    return GenericResponse(
        success=True,
        message="Videos merged successfully",
        data={"video_path": video_path, "video_control_path": video_control_path},
        session_id=request.session_id
    )

@app.post("/api/add-captions", response_model=GenericResponse, tags=["Video"])
async def add_captions(request: SessionRequest):
    """
    Add captions to the video.
    """
    # Get data from session
    session = session_manager.get_session(request.session_id)
    if not session or not session.get("video_path"):
        raise HTTPException(status_code=400, detail="No video path found in session")
    
    video_path = session["video_path"]
    parsed_script = session["parsed_script"]
    
    # Add captions
    caption_adder = CaptionAdder('app/data/current/video_control.json')
    captioned_video_path = caption_adder.add_captions_to_video()
    
    # Store captioned video path in session
    session_manager.update_session(request.session_id, "captioned_video_path", captioned_video_path)
    
    return GenericResponse(
        success=True,
        message="Captions added successfully",
        data={"video_path": captioned_video_path},
        session_id=request.session_id
    )

@app.post("/api/add-music", response_model=GenericResponse, tags=["Audio"])
async def add_music(request: SessionRequest):
    """
    Add background music to the video.
    """
    # Get data from session
    session = session_manager.get_session(request.session_id)
    if not session or not session.get("captioned_video_path"):
        raise HTTPException(status_code=400, detail="No captioned video path found in session")
    
    captioned_video_path = session["captioned_video_path"]
    
    # Get genre and agent from session
    genre = session.get("genre", "military")  # Default to military if not found
    agent = session.get("agent", "medium")    # Default to medium if not found
    print(f"Using genre: {genre}, agent: {agent}")
    
    # Import Music class
    from app.music import Music
    
    # Override defaults with any music parameters already set in the session
    stored_youtube_url = session.get("youtube_url")
    stored_volume = session.get("volume")
    stored_start_time = session.get("start_time")
    
    # If we have music parameters stored in the session, use those instead of getting from config
    if stored_youtube_url or stored_volume is not None or stored_start_time is not None:
        youtube_url = stored_youtube_url or "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        volume = 50 if stored_volume is None else stored_volume
        start_time = 0 if stored_start_time is None else stored_start_time
        print(f"Using stored music parameters: url={youtube_url}, volume={volume}, start_time={start_time}")
    else:
        # Otherwise get from config
        config_response = await update_config(object='music', action='get', genre=genre, agent=agent, data=None)
        youtube_url = config_response.data['url']
        volume = config_response.data['volume']
        start_time = config_response.data['start_time']
        print(f"Using config music parameters: url={youtube_url}, volume={volume}, start_time={start_time}")

    # Download and add music
    music = Music(youtube_url, volume, start_time)
    music_file = music.get_music()
    print(f"music_file: {music_file}\n\n")
    final_output = music.merge_with_video(video_path='app/data/current/output_with_captions.mp4', output_path='app/data/current/output_final.mp4')
    
    # Store final video path in session
    session_manager.update_session(request.session_id, "final_video_path", final_output)
    
    return GenericResponse(
        success=True,
        message="Music added successfully",
        data={"video_path": final_output},
        session_id=request.session_id
    )

# Add endpoints to set music parameters in the session
@app.post("/api/set-music-params", response_model=GenericResponse, tags=["Audio"])
async def set_music_params(
    session_id: str,
    youtube_url: Optional[str] = None,
    volume: Optional[int] = None,
    start_time: Optional[int] = None
):
    """
    Set music parameters for a session without immediately processing.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Update the music parameters in the session
    if youtube_url is not None:
        session_manager.update_session(session_id, "youtube_url", youtube_url)
    if volume is not None:
        session_manager.update_session(session_id, "volume", volume)
    if start_time is not None:
        session_manager.update_session(session_id, "start_time", start_time)
    
    return GenericResponse(
        success=True,
        message="Music parameters updated successfully",
        data={"youtube_url": youtube_url, "volume": volume, "start_time": start_time},
        session_id=session_id
    )

# Add an endpoint to get the current status of a session
@app.get("/api/session/{session_id}", response_model=GenericResponse, tags=["Session"])
async def get_session(session_id: str):
    """
    Get the current status of a session.
    """
    session = session_manager.get_session(session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    return GenericResponse(
        success=True,
        message="Session retrieved successfully",
        data=session,
        session_id=session_id
    )

@app.post("/api/get-video-url")
async def get_video_url(request: SessionRequest):
    """
    Get the video URL for a session.
    """
    # Get data from session
    session = session_manager.get_session(request.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    # Check if we have a final video path in the session
    final_video_path = session.get("final_video_path", "app/data/current/output_final.mp4")
    
    # Print debugging information
    print(f"Session ID: {request.session_id}")
    print(f"Final video path from session: {final_video_path}")
    
    # Create the delivery object and upload the video
    delivery = Delivery()
    result = delivery.upload_video(file_path=final_video_path)
    
    # Check for errors
    if "error" in result:
        raise HTTPException(
            status_code=500, 
            detail=f"Video upload failed: {result['error']}"
        )
    
    # Return the success response
    return GenericResponse(
        success=True, 
        message="Video URL retrieved successfully", 
        data={"video_url": result['video_url']}, 
        session_id=request.session_id
    )

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)