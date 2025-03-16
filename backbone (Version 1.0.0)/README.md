# Video Generation API

A FastAPI application that provides endpoints for generating videos with AI-generated scripts, text-to-speech, and automated video editing.

## Features

- 🎬 AI-powered script generation for videos
- 🗣️ Text-to-speech conversion
- 🎥 Automatic video merging based on script content
- 📝 Caption generation and overlay
- ☁️ Cloud storage integration (Cloudinary)
- ⚙️ Configurable settings for different components
- 🚢 "Mothership" context for more guided content creation

## Installation

1. Clone the repository
2. Install requirements:
   ```
   pip install -r requirements.txt
   ```
3. Set up environment variables in a `.env` file:
   ```
   VOICE=your_unrealspeech_api_key
   CLOUD=your_cloudinary_cloud_name
   CLOUD_KEY=your_cloudinary_api_key
   CLOUD_SECRET=your_cloudinary_api_secret
   ```

## Running the API

Start the FastAPI server:

```
python run.py
```

The API will be available at http://localhost:8000, and the interactive documentation at http://localhost:8000/docs.

## API Endpoints

### Configuration

- `GET /config/{config_type}` - Get current configuration for a specific component
- `POST /config` - Update configuration settings for a specific component

### Video Generation

- `POST /process` - Start a video generation task
- `GET /tasks/{task_id}` - Get the status of a specific task
- `GET /video/{task_id}` - Get the video URL for a completed task
- `GET /tasks` - List all tasks (optionally filtered by status)

## Configuration Types

The API supports different types of configurations:

- **audio**: Settings for audio generation (voice ID, speed, etc.)
- **voice**: Available voice options
- **video**: Video generation settings (output directory, caption options)
- **agent**: AI agent settings (prompts, persona)

## Example Usage

### Updating Audio Configuration

```bash
curl -X POST "http://localhost:8000/config" \
  -H "Content-Type: application/json" \
  -d '{
    "config_type": "audio",
    "settings": {
      "voice_id": "Sierra",
      "speed": 0.3,
      "bitrate": "256k"
    }
  }'
```

### Generating a Video

```bash
curl -X POST "http://localhost:8000/process" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short military story about a desert battle",
    "use_agent": true,
    "audio_settings": {
      "voice_id": "Daniel",
      "speed": 0
    }
  }'
```

### Generating a Video with Mothership Context

```bash
curl -X POST "http://localhost:8000/process" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Write a short military story",
    "mothership": "Desert Storm operation from 1991 with tanks and helicopters",
    "use_agent": true,
    "audio_settings": {
      "voice_id": "Daniel",
      "speed": 0
    }
  }'
```

### Generating a Video with Custom Script

```bash
curl -X POST "http://localhost:8000/process" \
  -H "Content-Type: application/json" \
  -d '{
    "use_agent": false,
    "custom_script": "```json\n{\"config\": [{\"line\": \"This is a test line\", \"video\": \"test_video.mp4\"}]}\n```\nfinal",
    "audio_settings": {
      "voice_id": "Sierra"
    }
  }'
```

### Checking Task Status

```bash
curl -X GET "http://localhost:8000/tasks/your-task-id"
```

### Getting the Video URL

```bash
curl -X GET "http://localhost:8000/video/your-task-id"
```

This will return the video URL once the task is completed:
```json
{
  "status": "success",
  "task_id": "your-task-id",
  "video_url": "https://res.cloudinary.com/your-cloud/video/upload/v123456789/webhook_videos/abcdef123456.mp4",
  "thumbnail_url": "https://res.cloudinary.com/your-cloud/video/upload/w_320,h_240,c_fill/v123456789/webhook_videos/abcdef123456.jpg",
  "completed_at": 1615234567.890123
}
```

## Key Parameters

When using the `/process` endpoint, you can provide these parameters:

- **prompt**: The main instruction for what kind of content to generate
- **mothership**: Additional context or theme that guides the content generation
- **use_agent**: Whether to use AI to generate a script (true) or use a custom script (false)
- **custom_script**: A pre-formatted script in the expected JSON format
- **audio_settings**: Settings for the text-to-speech conversion

## Directory Structure

- `app/` - Core application code
  - `audio_manage.py` - Audio generation with UnrealSpeech
  - `script_manage.py` - Script parsing and management
  - `merge_video.py` - Video merging logic
  - `captions.py` - Caption addition
  - `delivery.py` - Cloud delivery
  - `agent.py` - AI script generation
- `config/` - Configuration files
- `data/current/` - Working directory for files

## Dependencies

- FastAPI
- Uvicorn
- Pydantic
- Claude or similar LLM for script generation
- UnrealSpeech for text-to-speech
- FFmpeg for video processing
- Cloudinary for storage

## License

MIT