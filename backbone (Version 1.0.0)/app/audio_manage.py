import os
import json
import requests
from dotenv import load_dotenv

class AudioManager:
    """
    A class to handle UnrealSpeech API requests and manage audio and timestamp files.
    """
    
    def __init__(self):
        """Initialize the AudioManager, loading API key from environment variables."""
        load_dotenv()
        self.api_key = os.getenv("VOICE")
        self.api_url = "https://api.v8.unrealspeech.com/speech"
        self.output_dir = os.path.join("app", "data", "current")
        
        # Ensure the output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
        print(f"AudioManager initialized with output directory: {self.output_dir}")
        
    def generate_speech(self, text, voice_id="Sierra", bitrate="192k", 
                       audio_format="mp3", output_format="uri", 
                       timestamp_type="sentence", sync=False, speed=0, pitch=1):
        """
        Generate speech using the UnrealSpeech API.
        
        Args:
            text (str): The text to convert to speech
            voice_id (str): Voice ID to use
            bitrate (str): Audio bitrate
            audio_format (str): Output audio format
            output_format (str): Output delivery format
            timestamp_type (str): Type of timestamps to generate
            sync (bool): Whether to process synchronously
            
        Returns:
            dict: API response containing output URIs and metadata
        """
        payload = {
            "Text": text,
            "VoiceId": voice_id,
            "Bitrate": bitrate,
            "AudioFormat": audio_format,
            "OutputFormat": output_format,
            "TimestampType": timestamp_type,
            "sync": sync,
            "Speed": speed,
            "Pitch": pitch
        }
        
        headers = {
            'Authorization': f'Bearer {self.api_key}'
        }
        
        response = requests.request("POST", self.api_url, headers=headers, json=payload)
        
        if response.status_code != 200:
            raise Exception(f"API request failed with status code {response.status_code}: {response.text}")
            
        return response.json()
    
    def save_audio_and_timestamps(self, response_data, audio_filename=None, timestamps_filename=None):
        """
        Download and save the audio file and timestamps from API response.
        Files are saved in the data/current directory.
        
        Args:
            response_data (dict): Response data from UnrealSpeech API
            audio_filename (str, optional): Filename to save audio as. Defaults to taskId.mp3.
            timestamps_filename (str, optional): Filename to save timestamps as. Defaults to taskId.json.
            
        Returns:
            tuple: (audio_path, timestamps_path) - Paths to saved files
        """
        task_id = response_data.get("TaskId")
        audio_uri = response_data.get("OutputUri")
        print(f"Audio URI: {audio_uri}")
        timestamps_uri = response_data.get("TimestampsUri")
        
        if not audio_uri or not timestamps_uri:
            raise ValueError("Response does not contain valid URIs")
        
        # Ensure the output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Set default filenames if not provided
        if not audio_filename:
            audio_filename = f"{task_id}.mp3"
        
        if not timestamps_filename:
            timestamps_filename = f"{task_id}.json"
        
        # Create full paths within the data/current directory
        audio_path = os.path.join(self.output_dir, audio_filename)
        timestamps_path = os.path.join(self.output_dir, timestamps_filename)
        
        # Download and save audio file
        audio_content = requests.get(audio_uri).content
        with open(audio_path, 'wb') as audio_file:
            audio_file.write(audio_content)
        
        # Download and save timestamps
        timestamps_content = requests.get(timestamps_uri).json()
        with open(timestamps_path, 'w') as timestamps_file:
            json.dump(timestamps_content, timestamps_file, indent=2)
        
        return audio_path, timestamps_path
    
    def process_text_to_speech(self, text, audio_filename=None, timestamps_filename=None, **kwargs):
        """
        Process text to speech and save the results in one step.
        
        Args:
            text (str): The text to convert to speech
            audio_filename (str, optional): Filename to save audio as
            timestamps_filename (str, optional): Filename to save timestamps as
            **kwargs: Additional parameters for the speech generation
            
        Returns:
            tuple: (audio_path, timestamps_path) - Paths to saved files
        """
        response_data = self.generate_speech(text, **kwargs)
        return self.save_audio_and_timestamps(response_data, audio_filename, timestamps_filename)

if __name__ == "__main__":
    audio_manager = AudioManager()
    audio_manager.process_text_to_speech(text="The harsh desert battlefield has become the frontline of modern warfare.", voice_id="Ethan", audio_filename="test.mp3", timestamps_filename="test.json")