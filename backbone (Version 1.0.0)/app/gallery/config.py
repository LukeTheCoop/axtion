import os
import json
import requests
import subprocess
import sys
import shutil
class GalleryConfig:
    def __init__(self, genre: str):
        self.genre = genre
        if not os.path.exists(f"app/data/videos/{self.genre}"):
            gallery_path = f"app/data/videos/{self.genre}"
            self.create_gallery_path(gallery_path)
            self.gallery_path = f"app/data/videos/{self.genre}"
            self.update_video_list()
        
        self.gallery_path = f"app/data/videos/{self.genre}"

        # Get data from the video_list.json in the gallery_path
        video_list_path = os.path.join(self.gallery_path, "video_list.json")
        if os.path.exists(video_list_path):
            try:
                with open(video_list_path, 'r') as f:
                    self.video_list = json.load(f)
            except json.JSONDecodeError:
                self.video_list = []
                print(f"Error reading video_list.json, initializing empty list")
        else:
            self.video_list = []
            self.update_video_list()

        self.gallery_path = f"app/data/videos/{self.genre}"


    def create_gallery_path(self, gallery_path):
        os.makedirs(gallery_path, exist_ok=True)

    def get_gallery_path(self):
        return self.gallery_path
    
    
    def update_video_list(self):
        # Path to the directory containing the videos        
        # Path to the JSON file
        json_file = os.path.join(self.gallery_path, "video_list.json")
        
        # Get all MP4 files in the directory
        video_files = [f for f in os.listdir(self.gallery_path) if f.endswith('.mp4')]
        
        # Sort the files alphabetically
        video_files.sort()
        
        # Write the list to the JSON file
        with open(json_file, 'w') as f:
            json.dump(video_files, f, indent=4)
        
        print(f"Updated {json_file} with {len(video_files)} videos")

    def remove_video(self, video_name: str):
        # Load the current video list
        video_list_path = f"{self.gallery_path}/video_list.json"
        with open(video_list_path, 'r') as f:
            videos = json.load(f)
        
        # Remove the specified video from the list
        if video_name in videos:
            videos.remove(video_name)
        
        # Save the updated list back to the file
        with open(video_list_path, 'w') as f:
            json.dump(videos, f, indent=4)

        # Remove the video file from the filesystem
        video_path = os.path.join(self.gallery_path, video_name)
        if os.path.exists(video_path):
            try:
                os.remove(video_path)
                print(f"Deleted video file: {video_path}")
            except Exception as e:
                print(f"Error deleting video file {video_path}: {str(e)}")
        else:
            print(f"Video file not found: {video_path}")
            
        # Remove the associated screenshot file
        video_name_without_ext = os.path.splitext(video_name)[0]
        screenshots_path = os.path.join(self.gallery_path, "screenshots")
        screenshot_path = os.path.join(screenshots_path, f"{video_name_without_ext}.jpg")
        
        if os.path.exists(screenshot_path):
            try:
                os.remove(screenshot_path)
                print(f"Deleted screenshot file: {screenshot_path}")
            except Exception as e:
                print(f"Error deleting screenshot file {screenshot_path}: {str(e)}")
        else:
            print(f"Screenshot file not found: {screenshot_path}")
            
        # Remove the entry from screenshot.json if it exists
        json_file_path = os.path.join(screenshots_path, "screenshot.json")
        if os.path.exists(json_file_path):
            try:
                with open(json_file_path, 'r') as f:
                    screenshots_data = json.load(f)
                
                # Check if the data is a dictionary and contains the video name
                if isinstance(screenshots_data, dict) and video_name_without_ext in screenshots_data:
                    # Remove the entry for this video
                    del screenshots_data[video_name_without_ext]
                    print(f"Removed entry for {video_name_without_ext} from screenshot.json")
                    
                    # Save the updated JSON
                    with open(json_file_path, 'w') as f:
                        json.dump(screenshots_data, f, indent=4)
            except Exception as e:
                print(f"Error updating screenshot.json: {str(e)}")
            
        # Update the video list 
        self.update_video_list()
    
    def add_video(self, video_name: str, video_url: str):


        """
        Download a video from YouTube (or other supported sites) using yt-dlp.
        Then ensure it's at 480x854 resolution for consistency.
        
        Args:
            video_name: Filename to save the video as
            video_url: URL to the YouTube video (e.g., YouTube Short)
        """
        try:
            # Check if video_name already has the genre prefix
            if video_name == "temp.mp4":
                pass
            else:
                genre_prefix = self.genre + '_'
                if not video_name.startswith(genre_prefix):
                    video_name = genre_prefix + video_name
            
            # Ensure the filename ends with .mp4
            if not video_name.endswith('.mp4'):
                video_name += '.mp4'
            
            # Make sure the directory exists
            os.makedirs(self.gallery_path, exist_ok=True)
            
            # Full path where the video will be saved
            video_path = os.path.join(self.gallery_path, video_name)
            temp_video_path = os.path.join(self.gallery_path, f"temp_{video_name}")
            
            # Check if ffmpeg is installed
            try:
                subprocess.check_call(["ffmpeg", "-version"], 
                                     stdout=subprocess.DEVNULL, 
                                     stderr=subprocess.DEVNULL)
                print("ffmpeg is available")
            except (subprocess.CalledProcessError, FileNotFoundError):
                print("Warning: ffmpeg not found. Required for resolution conversion.")
                return
                
            # Check if yt-dlp is installed
            try:
                # First try to install/upgrade yt-dlp if not already installed
                subprocess.check_call([sys.executable, "-m", "pip", "install", "--upgrade", "yt-dlp"], 
                                     stdout=subprocess.DEVNULL, 
                                     stderr=subprocess.DEVNULL)
                print("yt-dlp installed/upgraded successfully")
            except subprocess.CalledProcessError:
                print("Warning: Could not install/upgrade yt-dlp. Attempting to use existing installation.")
            
            # Command to download the video using yt-dlp to a temporary file
            download_command = [
                "yt-dlp",
                "--no-playlist",
                # Try to get a video in mp4 format with the desired aspect ratio
                "--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4",
                "--merge-output-format", "mp4",
                "-o", temp_video_path,
                video_url
            ]
            
            # Execute the download command
            print(f"Downloading video from {video_url}...")
            subprocess.run(download_command, check=True)
            
            print(f"Successfully downloaded video to {temp_video_path}")
            
            # Now convert/resize the video to exactly 480x854 with ffmpeg
            print(f"Converting video to 480x854 resolution...")
            convert_command = [
                "ffmpeg",
                "-i", temp_video_path,
                "-vf", "scale=480:854:force_original_aspect_ratio=decrease,pad=480:854:(ow-iw)/2:(oh-ih)/2",
                "-c:v", "h264",
                "-c:a", "aac",
                "-y",  # Overwrite output file if it exists
                video_path
            ]
            
            subprocess.run(convert_command, check=True)
            print(f"Successfully converted video to 480x854 resolution: {video_path}")
            
            # Remove the temporary file
            if os.path.exists(temp_video_path):
                os.remove(temp_video_path)
                print(f"Removed temporary file: {temp_video_path}")
            
            # Update the video list after adding the new video
            self.update_video_list()
            
        except subprocess.CalledProcessError as e:
            print(f"Error processing video: {str(e)}")
            print("Make sure yt-dlp and ffmpeg are installed and the URL is valid.")
        except Exception as e:
            print(f"Unexpected error processing video: {str(e)}")

    def landmark_clear(self):
        """Clear all files in the landmarks folder while preserving the folder itself."""
        landmarks_path = os.path.join("app", "gallery", "data", "landmarks")
        if os.path.exists(landmarks_path):
            for file in os.listdir(landmarks_path):
                file_path = os.path.join(landmarks_path, file)
                if os.path.isfile(file_path):
                    os.remove(file_path)
            print(f"Landmarks folder cleared: {landmarks_path}")
        else:
            os.makedirs(landmarks_path)
            print(f"Created landmarks folder: {landmarks_path}")
        return landmarks_path

if __name__ == "__main__":
    config = GalleryConfig("nature")
    config.landmark_clear()