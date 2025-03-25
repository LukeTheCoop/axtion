import json
import re
import os

class ScriptManager:
    def __init__(self, agent_response):
        self.script = agent_response
        self.scripts = []  # Initialize the scripts list
        self.output_dir = os.path.join("app", "data", "current")
        
        # Ensure the output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
        print(f"ScriptManager initialized with output directory: {self.output_dir}")

    def sanitize_video_name(self, video_name):
        """
        Sanitize video name by removing newlines and other problematic characters.
        
        Args:
            video_name (str): Original video name from agent
            
        Returns:
            str: Sanitized video name
        """
        # Remove newline characters
        video_name = video_name.replace('\n', '')
        
        # Remove extra spaces
        video_name = video_name.strip()
        
        # Ensure the .mp4 extension is properly formatted (no spaces before extension)
        video_name = re.sub(r'\s+\.mp4$', '.mp4', video_name)
        
        # Make sure there's only one .mp4 extension
        if video_name.count('.mp4') > 1:
            parts = video_name.split('.mp4')
            video_name = parts[0] + '.mp4'
            
        return video_name

    def extract_data(self):
        """
        Extract lines from the JSON response returned by the agent.
        The response is expected to be a markdown code block starting with ```json
        containing a JSON object with a 'config' key.
        
        Returns:
            list: List of dictionaries with 'line' and 'video' keys
        """
        # Initialize these attributes explicitly
        self.full_script = ''
        self.videos = []

        # Extract the JSON string from the markdown code block
        json_match = re.search(r'```json\n(.*?)```', self.script, re.DOTALL)
        
        if not json_match:
            print("WARNING: Could not find JSON in the agent response using standard pattern")
            # Try an alternative pattern without newline
            json_match = re.search(r'```json(.*?)```', self.script, re.DOTALL)
            if not json_match:
                raise ValueError("Could not find JSON in the agent response")
        
        json_str = json_match.group(1).strip()
        
        # Clean up common JSON issues before parsing
        # Fix duplicate "line" keys by combining them
        json_str = re.sub(r'"line": "(.*?)"\s*"line": "(.*?)"', r'"line": "\1\2"', json_str)
        
        # First attempt: Try standard JSON parsing
        try:
            data = json.loads(json_str)
            if 'config' in data:
                config_data = data['config']
                # Extract text and videos
                for item in config_data:
                    if 'line' in item and 'video' in item:
                        self.full_script += item['line'] + " "
                        # Sanitize the video name before adding it
                        item['video'] = self.sanitize_video_name(item['video'])
                        self.videos.append(item['video'])
                
                self.ensure_script_format()
                return config_data
            else:
                raise ValueError("JSON does not contain a 'config' key")
        except json.JSONDecodeError as e:
            print(f"JSON parsing error: {str(e)}")
            print("Attempting fallback parsing methods...")
            
            # Second attempt: Fallback to manual regex-based parsing of line-video pairs
            pattern = r'"line"\s*:\s*"(.*?)",\s*"video"\s*:\s*"(.*?)"'
            matches = re.findall(pattern, json_str)
            
            if matches:
                result = []
                for line, video in matches:
                    # Unescape any escaped quotes in the line
                    line = line.replace('\\"', '"')
                    # Sanitize the video name
                    video = self.sanitize_video_name(video)
                    result.append({"line": line, "video": video})
                    self.full_script += line + " "
                    self.videos.append(video)

                self.ensure_script_format()
                return result
            else:
                # Last resort: Try more aggressive line-video pair extraction
                # This looks for any patterns that might represent a line and video
                line_pattern = r'"line"\s*:\s*"(.+?)(?:"\s*,|\s*$)'
                video_pattern = r'"video"\s*:\s*"(.+?)(?:"\s*}|\s*$)'
                
                lines = re.findall(line_pattern, json_str)
                videos = re.findall(video_pattern, json_str)
                
                if lines and videos and len(lines) >= len(videos):
                    result = []
                    # Match as many lines with videos as possible
                    for i in range(min(len(lines), len(videos))):
                        line = lines[i].replace('\\"', '"')
                        # Sanitize the video name
                        video = self.sanitize_video_name(videos[i])
                        result.append({"line": line, "video": video})
                        self.full_script += line + " "
                        self.videos.append(video)
                    
                    if result:
                        self.ensure_script_format()
                        return result
                
                # If all attempts fail, provide helpful debug info
                print("Original JSON string (first 100 chars):", json_str[:100] + "...")
                print("Original JSON string (last 100 chars):", "..." + json_str[-100:])
                print("Failed to parse JSON using all methods. Inspect the agent's output.")
                raise ValueError("Failed to parse JSON using multiple methods")
    
    def ensure_script_format(self):
        """
        Ensures that there is a space after every period in the full script.
        If a period is already followed by a space, it leaves it unchanged.
        """
        # Use regex to find all instances of a period followed by a non-space character
        # and replace them with a period followed by a space and the same character
        self.full_script = re.sub(r'\.([^\s])', r'. \1', self.full_script)
        
    def create_video_control(self, timestamps):
        """
        Takes timestamp data and combines it with the video filenames in self.videos
        to create a video control file similar to video_control.json.
        
        Args:
            timestamps: List of dictionaries containing timestamp data (from output_timestamps.json)
            
        Returns:
            List of dictionaries with timestamp data and video filenames
        """
        if not self.videos:
            raise ValueError("No videos available. Call extract_data first to populate video list.")
            
        if len(timestamps) != len(self.videos):
            print(f"Warning: Number of timestamps ({len(timestamps)}) does not match number of videos ({len(self.videos)})")
            # If needed, handle length mismatch by using shorter length or padding
        
        # Create a new list with timestamp data and videos
        video_control = []
        
        # Use the smaller length to avoid index errors
        num_entries = min(len(timestamps), len(self.videos))
        
        for i in range(num_entries):
            # Create a copy of the timestamp entry
            entry = timestamps[i].copy()
            
            # Add the video field
            entry["video"] = self.videos[i]
            
            # Add to the result list
            video_control.append(entry)
            
        return video_control
    
    def save_video_control(self, video_control, output_file="video_control.json"):
        """
        Saves the video control data to a JSON file in the data/current directory.
        
        Args:
            video_control: List of dictionaries with timestamp and video data
            output_file: Name of the output file
        """
        # Ensure the output directory exists
        os.makedirs(self.output_dir, exist_ok=True)
        
        # Create the full path to the output file
        output_path = os.path.join(self.output_dir, output_file)
        
        # Save the video control data
        with open(output_path, 'w') as f:
            json.dump(video_control, f, indent=2)
            
        print(f"Video control data saved to {output_path}")
        return output_path
            
    def add_script(self, script):
        self.scripts.append(script)

if __name__ == "__main__":
    # Test script with a JSON response
    script = """```json
{
  "config": [
    {
      "line": "The dusty horizon trembled as the 7th Armored Division prepared for what would become the largest tank engagement since World War II.",
      "video": "military_tank_convoy_green_field.mp4"
    },
    {
      "line": "Command had received intelligence of enemy armor massing beyond the ridge - this would be the decisive battle of the campaign.",
      "video": "military_commander_meeting.mp4"
    },
    {
      "line": "Colonel Mercer studied the tactical displays, planning the complex maneuvers that would determine the fate of thousands.",
      "video": "military_soldier_doing_analysis_on_computers.mp4"
    },
    {
      "line": "\"We'll engage at dawn. Three battalions in a pincer movement,\" he told his officers, pointing to the holographic terrain map.",
      "video": "military_two_captains_talking.mp4"
    },
    {
      "line": "As first light broke over the contested valley, our forward observers reported enemy movement - six T-90s advancing in formation.",
      "video": "military_six_tank_convoy.mp4"
    },
    {
      "line": "I pushed myself beyond comfort zones.",
      "video": "cat_crouched_ready_to_pounce\n\n.mp4"
    }
  ]
}
```
final"""
    
    # Create script manager and extract line/video data
    script_manager = ScriptManager(script)
    line_video_pairs = script_manager.extract_data()
    print(f"Successfully extracted {len(line_video_pairs)} line-video pairs.")
    
    # Print the sanitized video names
    print("\nSanitized video names:")
    for pair in line_video_pairs:
        print(f" - {pair['video']}")
    
    # Sample timestamps data (similar to output_timestamps.json)
    sample_timestamps = [
        {
            "start": 0.0,
            "end": 7.5,
            "text": "The dusty horizon trembled as the 7th Armored Division prepared for what would become the largest tank engagement since World War II.",
            "text_offset": 0
        },
        {
            "start": 7.5,
            "end": 14.3,
            "text": "Command had received intelligence of enemy armor massing beyond the ridge - this would be the decisive battle of the campaign.",
            "text_offset": 136
        },
        {
            "start": 14.3,
            "end": 22.1,
            "text": "Colonel Mercer studied the tactical displays, planning the complex maneuvers that would determine the fate of thousands.",
            "text_offset": 266
        },
        {
            "start": 22.1,
            "end": 30.4,
            "text": "\"We'll engage at dawn. Three battalions in a pincer movement,\" he told his officers, pointing to the holographic terrain map.",
            "text_offset": 379
        },
        {
            "start": 30.4,
            "end": 38.6,
            "text": "As first light broke over the contested valley, our forward observers reported enemy movement - six T-90s advancing in formation.",
            "text_offset": 501
        },
        {
            "start": 38.6,
            "end": 41.2,
            "text": "I pushed myself beyond comfort zones.",
            "text_offset": 630
        }
    ]
    
    # Create video control data
    video_control = script_manager.create_video_control(sample_timestamps)
    
    # Print the result
    print("\nVideo Control Output:")
    for entry in video_control:
        print(f"Time: {entry['start']:.1f}-{entry['end']:.1f} | Text: {entry['text'][:40]}... | Video: {entry['video']}")
    
    # Save to file in data/current directory
    output_path = script_manager.save_video_control(video_control, "test_video_control.json")
    print(f"Test successful. Files will be saved to the data/current directory.")
