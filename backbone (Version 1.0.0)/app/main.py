from audio_manage import AudioManager
from script_manage import ScriptManager
from merge_video import VideoMerger
from captions import CaptionAdder
from agent import Agent_Light
import json
import os
import re
import sys

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

# Ensure app/data/current directory exists
os.makedirs("app/data/current", exist_ok=True)

# Load video list for Agent
try:
    with open("video_list.json", "r") as f:
        video_list = json.load(f)
except FileNotFoundError:
    print("Warning: video_list.json not found. Using a predefined script instead.")
    video_list = []

# Either generate a new script using the agent or use a predefined one
USE_AGENT = True  # Set to False to use the predefined script

script = None

if USE_AGENT:
    try:
        # Generate script using the Agent
        print("Generating script using AI agent...")
        agent = Agent_Light(
            "You create videos. You write lines and choose videos to go along with them.", 
            "Be creative", 
            "Write a short military story about a desert battle.", 
            str(video_list)
        )
        raw_script = agent.generate_response()
        print(f"Raw script received from agent (length: {len(raw_script)})")
        
        # Sanitize the script
        script = sanitize_script(raw_script)
        print(f"Script sanitized (length: {len(script)})")
        
        # Debug: Print first 200 chars and last 200 chars
        print(f"\nStart of script: {script[:200]}...")
        print(f"End of script: ...{script[-200:]}")
    except Exception as e:
        print(f"Error generating script: {str(e)}")
        print("Falling back to predefined script")
        USE_AGENT = False

if not USE_AGENT or script is None:
    # Use predefined script
    print("Using predefined script...")
    script = """```json
{
  "config": [
    {
      "line": "The morning sun cast long shadows across the desert as our tank battalion prepared for the coming engagement.",
      "video": "military_tank_convoy_green_field.mp4"
    },
    {
      "line": "Intelligence reports indicated enemy armor was massing just beyond the ridge - this would be the decisive battle of the campaign.",
      "video": "military_soldier_doing_analysis_on_computers.mp4"
    },
    {
      "line": "Our commander gathered the platoon leaders, outlining the strategy that would determine the fate of our forces.",
      "video": "military_commander_meeting.mp4"
    },
    {
      "line": "\"We'll engage from three positions,\" he ordered, pointing to tactical displays. \"Maximum firepower, minimum exposure.\"",
      "video": "military_two_captains_talking.mp4"
    },
    {
      "line": "As we moved into position, our six-tank formation advanced methodically across the open terrain.",
      "video": "military_six_tank_convoy.mp4"
    },
    {
      "line": "The radio crackled with reports of enemy movement - their armored column was approaching faster than anticipated.",
      "video": "military_radar_nvg.mp4"
    },
    {
      "line": "The first shots came without warning - an enemy shell struck one of our forward tanks, igniting its fuel reserves.",
      "video": "military_armored_vehicle_on_fire_desert.mp4"
    },
    {
      "line": "\"All units, open fire!\" The command echoed through our comms as our main guns thundered in response.",
      "video": "military_artillery_cannon.mp4"
    },
    {
      "line": "The battlefield erupted in chaos - explosions ripped through the air as tanks from both sides exchanged devastating fire.",
      "video": "military_large_battle_scene_heavy_action_aerial_shot.mp4"
    },
    {
      "line": "Our tank lurched forward, maneuvering between burned-out husks of vehicles as we sought advantageous firing positions.",
      "video": "military_tank.mp4"
    },
    {
      "line": "Above us, jets screamed across the sky, providing crucial air support against enemy reinforcements.",
      "video": "military_jet_flying_in_air.mp4"
    },
    {
      "line": "The battle raged for hours, with neither side willing to concede the strategic high ground.",
      "video": "military_running_from_bombs_fire_desert.mp4"
    },
    {
      "line": "When ammunition ran low, our medics braved enemy fire to reach wounded comrades trapped in disabled vehicles.",
      "video": "military_soldiers_carrying_away_injured_soldiers_desert.mp4"
    },
    {
      "line": "A desperate evacuation began as helicopters descended through smoke-filled skies to extract the critically injured.",
      "video": "military_med_evac_rescue_mission_helicopter_desert.mp4"
    },
    {
      "line": "By sunset, the tide had turned in our favor as enemy tanks began a disorganized retreat across the valley.",
      "video": "military_wartorn_city_drone_shot.mp4"
    },
    {
      "line": "The cost had been high, but the victory decisive - our tank crews had held the line against overwhelming odds.",
      "video": "military_soldier_at_funeral_for_comrades.mp4"
    },
    {
      "line": "In the aftermath, as we surveyed the battlefield, we understood that our actions that day would be remembered in military history.",
      "video": "military_medal_ceremony.mp4"
    }
  ]
}
```
final"""

# Step 1: Parse the script
print("\nStep 1: Extracting data from script...")
try:
    script_manager = ScriptManager(script)
    lines = script_manager.extract_data()  # This also initializes full_script and videos

    # Verify we have data
    if not script_manager.full_script:
        raise ValueError("Failed to extract full script text")

    if not script_manager.videos:
        raise ValueError("Failed to extract video list")

    print(f"Successfully extracted {len(lines)} lines")
    print(f"Full script length: {len(script_manager.full_script)} characters")
except Exception as e:
    print(f"Error in step 1: {str(e)}")
    print("Script extraction failed, cannot continue.")
    sys.exit(1)

# Step 2: Generate speech from the text
print("\nStep 2: Generating speech audio...")
try:
    audio_manager = AudioManager()
    audio_file, timestamps_file = audio_manager.process_text_to_speech(
        text=script_manager.full_script,
        voice_id="Daniel",
        audio_filename="output_audio.mp3",
        timestamps_filename="output_timestamps.json",
        speed=0
    )
    print(f"Audio saved to: {audio_file}")
    print(f"Timestamps saved to: {timestamps_file}")
except Exception as e:
    print(f"Error in step 2: {str(e)}")
    print("Speech generation failed, cannot continue.")
    sys.exit(1)

# Step 3: Create video control file
print("\nStep 3: Creating video control file...")
try:
    with open(timestamps_file, 'r') as f:
        timestamps = json.load(f)
        
    video_control = script_manager.create_video_control(timestamps)
    video_control_path = script_manager.save_video_control(video_control, "video_control.json")
    print(f"Video control file created: {video_control_path}")
except Exception as e:
    print(f"Error in step 3: {str(e)}")
    print("Video control file creation failed, cannot continue.")
    sys.exit(1)

# Step 4: Merge videos
print("\nStep 4: Merging videos...")
try:
    merger = VideoMerger("app/data/current/video_control.json")
    merged_video_path = merger.process()
    print(f"Merged video saved to: {merged_video_path}")
except Exception as e:
    print(f"Error in step 4: {str(e)}")
    print("Video merging failed, cannot continue.")
    sys.exit(1)

# Step 5: Add captions
print("\nStep 5: Adding captions...")
try:
    caption_adder = CaptionAdder("app/data/current/video_control.json")
    captioned_video_path = caption_adder.add_captions_to_video()
    print(f"Video with captions saved to: {captioned_video_path}")
except Exception as e:
    print(f"Error in step 5: {str(e)}")
    print("Caption addition failed.")
    sys.exit(1)

print("\nVideo creation pipeline completed successfully!")


