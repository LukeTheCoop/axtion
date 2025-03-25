import os
import cv2  # OpenCV library for video processing
from app.gallery.config import GalleryConfig
import cloudinary
import cloudinary.uploader
import cloudinary.api
import json  # Import json at the top level

class GalleryView:
    def __init__(self, genre: str):
        self.genre = genre
        self.gallery_path = f"app/data/videos/{self.genre}"
        self.screenshots_path = self.ensure_screenshots_folder()
        
        # Initialize Cloudinary configuration
        cloudinary.config(
            cloud_name = os.environ.get('CLOUD'),
            api_key = os.environ.get('CLOUD_KEY'),
            api_secret = os.environ.get('CLOUD_SECRET'),
            secure = True
        )
        
    def ensure_screenshots_folder(self):
        """
        Ensures that a screenshots folder exists within the gallery path.
        Creates the folder if it doesn't exist and initializes a screenshot.json file.
        """
        screenshots_path = os.path.join(self.gallery_path, "screenshots")
        if not os.path.exists(screenshots_path):
            try:
                os.makedirs(screenshots_path, exist_ok=True)
                print(f"Created screenshots folder at: {screenshots_path}")
                
                # Create screenshot.json file
                json_file_path = os.path.join(screenshots_path, "screenshot.json")
                with open(json_file_path, 'w') as f:
                    json.dump({}, f, indent=4)  # Initialize as empty dictionary
                print(f"Created screenshot.json file at: {json_file_path}")
                
            except Exception as e:
                print(f"Error creating screenshots folder or json file: {str(e)}")
        else:
            # Ensure screenshot.json exists even if the folder already exists
            json_file_path = os.path.join(screenshots_path, "screenshot.json")
            if not os.path.exists(json_file_path):
                try:
                    with open(json_file_path, 'w') as f:
                        json.dump({}, f, indent=4)  # Initialize as empty dictionary
                    print(f"Created screenshot.json file at: {json_file_path}")
                except Exception as e:
                    print(f"Error creating screenshot.json file: {str(e)}")
        return screenshots_path
    
    def upload_screenshots(self, screenshot_path):
        """
        Uploads the screenshot to Cloudinary and saves the URL to screenshot.json.
        
        Args:
            screenshot_path: Path to the screenshot file
            
        Returns:
            Dictionary containing the upload response from Cloudinary
        """
        if not os.path.exists(screenshot_path):
            print(f"Screenshot file not found: {screenshot_path}")
            return None
            
        try:
            # Extract filename for use as public_id in Cloudinary
            filename = os.path.basename(screenshot_path)
            name_without_ext = os.path.splitext(filename)[0]
            
            # Upload to Cloudinary with the genre as folder
            result = cloudinary.uploader.upload(
                screenshot_path,
                folder=f"gallery/{self.genre}",
                public_id=name_without_ext,
                overwrite=True,
                resource_type="image"
            )
            
            # Debug the result structure
            print(f"Cloudinary result type: {type(result)}")
            print(f"Cloudinary result content: {result}")
            
            # Get the secure URL based on the result structure
            if isinstance(result, dict) and 'secure_url' in result:
                secure_url = result['secure_url']
            elif isinstance(result, list) and len(result) > 0:
                # If result is a list, assume the first item contains the URL
                # or if it's a list of URL strings, use the first one
                if isinstance(result[0], dict) and 'secure_url' in result[0]:
                    secure_url = result[0]['secure_url']
                else:
                    secure_url = str(result[0])
            else:
                # Fallback, use string representation
                secure_url = str(result)
                
            print(f"Screenshot uploaded successfully: {secure_url}")
            
            # Update screenshot.json with the new URL
            json_file_path = os.path.join(self.screenshots_path, "screenshot.json")
            
            # Load existing data
            screenshots_data = {}
            if os.path.exists(json_file_path):
                try:
                    with open(json_file_path, 'r') as f:
                        data = json.load(f)
                        
                        # Check if the loaded data is a list instead of a dictionary
                        if isinstance(data, list):
                            print("Converting screenshots.json from list to dictionary format")
                            screenshots_data = {}  # Start with a new empty dictionary
                        else:
                            screenshots_data = data
                except json.JSONDecodeError:
                    # If file is empty or invalid JSON, start with empty dict
                    screenshots_data = {}
            
            # Add or update the entry
            screenshots_data[name_without_ext] = secure_url
            
            # Save updated data
            with open(json_file_path, 'w') as f:
                json.dump(screenshots_data, f, indent=4)
                
            print(f"Updated screenshot.json with URL for {name_without_ext}")
            
            return result
            
        except Exception as e:
            print(f"Error uploading screenshot to Cloudinary: {str(e)}")
            # Print more detailed error information for debugging
            import traceback
            traceback.print_exc()
            return None
    
    def landmark_screenshots(self):
        """
        Takes screenshots every 2 seconds from the temp.mp4 video in the gallery_path
        and saves them in the app/gallery/data/landmarks folder with numerical names.
        """
        # Set the target video
        video_name = "temp.mp4"
        video_path = os.path.join(self.gallery_path, video_name)
        landmarks_path = os.path.join("app", "gallery", "data", "landmarks")
        
        if not os.path.isfile(video_path):
            print(f"Video file not found: {video_path}")
            return []
        
        # Capture frames every 2 seconds
        screenshot_paths = []
        try:
            cap = cv2.VideoCapture(video_path)
            
            # Get video properties
            fps = cap.get(cv2.CAP_PROP_FPS)
            if fps <= 0:
                print(f"Invalid FPS value: {fps}, using default of 30")
                fps = 30
                
            # Calculate frame interval (2 seconds)
            frame_interval = int(fps * 2)
            
            # Process video
            frame_count = 0
            screenshot_count = 1
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                # Take screenshot every 2 seconds (based on frame count)
                if frame_count % frame_interval == 0:
                    screenshot_path = os.path.join(landmarks_path, f"{screenshot_count}.jpg")
                    cv2.imwrite(screenshot_path, frame)
                    screenshot_paths.append(screenshot_path)
                    print(f"Created landmark screenshot {screenshot_count} at {screenshot_path}")
                    screenshot_count += 1
                
                frame_count += 1
            
            cap.release()
            print(f"Created {screenshot_count-1} landmark screenshots")
            
        except Exception as e:
            print(f"Error processing video {video_name}: {str(e)}")
            import traceback
            traceback.print_exc()
        
        return screenshot_paths
    
    def screenshots_video(self, video_name: str = None):
        """
        Takes a screenshot of the first frame of every video in the gallery_path
        and saves it in the screenshots folder.
        
        Args:
            video_name: Optional specific video to screenshot. If None, processes all videos.
            
        Returns:
            List of paths to the created screenshots
        """
        videos = [video_name] if video_name else [f for f in os.listdir(self.gallery_path) 
                                              if os.path.isfile(os.path.join(self.gallery_path, f)) 
                                              and f.lower().endswith(('.mp4', '.avi', '.mov', '.mkv'))]
        
        screenshot_paths = []
        
        for video in videos:
            video_path = os.path.join(self.gallery_path, video)
            if not os.path.isfile(video_path):
                print(f"Video file not found: {video_path}")
                continue
                
            # Get video name without extension
            video_name_without_ext = os.path.splitext(video)[0]
            screenshot_path = os.path.join(self.screenshots_path, f"{video_name_without_ext}.jpg")
            
            # Capture first frame
            try:
                cap = cv2.VideoCapture(video_path)
                ret, frame = cap.read()
                if ret:
                    # Save the first frame as jpg
                    cv2.imwrite(screenshot_path, frame)
                    screenshot_paths.append(screenshot_path)
                    print(f"Created screenshot for {video} at {screenshot_path}")
                else:
                    print(f"Could not read frame from {video}")
                cap.release()
            except Exception as e:
                print(f"Error processing video {video}: {str(e)}")
        
        return screenshot_paths
    
    def display_video_list(self):
        print(self.video_list)

if __name__ == "__main__":
    genre = "military"  # Can be changed or made into a command-line argument
    view = GalleryView(genre)
    config = GalleryConfig(genre)
    
    
    # Then, upload all screenshots in the screenshots folder
    print(f"\nUploading all screenshots to Cloudinary...")
    screenshots_folder = view.screenshots_path
    
    # Get all image files from the screenshots folder
    image_extensions = ['.jpg', '.jpeg', '.png', '.gif']
    screenshot_files = [
        os.path.join(screenshots_folder, f) 
        for f in os.listdir(screenshots_folder) 
        if os.path.isfile(os.path.join(screenshots_folder, f)) and
        any(f.lower().endswith(ext) for ext in image_extensions)
    ]
    
    if not screenshot_files:
        print(f"No screenshot images found in {screenshots_folder}")
    else:
        print(f"Found {len(screenshot_files)} screenshots to upload")
        
        # Upload each screenshot
        for screenshot_path in screenshot_files:
            print(f"\nUploading {os.path.basename(screenshot_path)}...")
            result = view.upload_screenshots(screenshot_path)
            if result:
                print(f"Successfully uploaded {os.path.basename(screenshot_path)}")
            else:
                print(f"Failed to upload {os.path.basename(screenshot_path)}")
                
        print("\nAll screenshots processed.")
        
        # Optionally display the content of the JSON file
        json_file_path = os.path.join(screenshots_folder, "screenshot.json")
        if os.path.exists(json_file_path):
            with open(json_file_path, 'r') as f:
                data = json.load(f)
                print("\nContents of screenshot.json:")
                for key, url in data.items():
                    print(f"{key}: {url}")

if __name__ == "__main__":
    genre = "nature"  # Can be changed or made into a command-line argument
    view = GalleryView(genre)
    view.landmark_screenshots()