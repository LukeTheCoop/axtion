import cloudinary
import cloudinary.uploader
import cloudinary.api
import os
from dotenv import load_dotenv
import time

# Load environment variables from .env file
load_dotenv()

# Get Cloudinary credentials from environment variables
CLOUD_NAME = os.environ.get("CLOUD")
API_KEY = os.environ.get("CLOUD_KEY")
API_SECRET = os.environ.get("CLOUD_SECRET")

# Configure Cloudinary
cloudinary.config(
    cloud_name = CLOUD_NAME,
    api_key = API_KEY,
    api_secret = API_SECRET
)

def upload_to_cloudinary(video_path):
    """Upload a video to Cloudinary and return the URL."""
    try:
        # Use the provided path or default to the final output video
        if not video_path:
            video_path = "app/data/current/output_final.mp4"
        
        # Ensure the path starts with app/ if it's a relative path starting with data/
        if video_path.startswith("data/") and not video_path.startswith("app/"):
            corrected_path = f"app/{video_path}"
            print(f"Path corrected from {video_path} to {corrected_path}")
            video_path = corrected_path
        
        # Check if the video file exists
        if not os.path.exists(video_path):
            # Try an alternative path if the original doesn't exist
            if video_path.startswith("app/") and not os.path.exists(video_path):
                alt_path = video_path[4:]  # Remove 'app/' prefix
                if os.path.exists(alt_path):
                    print(f"Found file at alternative path: {alt_path}")
                    video_path = alt_path
                else:
                    return {"error": f"Video file not found: {video_path} (also checked {alt_path})"}
            else:
                return {"error": f"Video file not found: {video_path}"}
        
        print(f"Uploading video from: {video_path}")
        
        # Upload the video to Cloudinary
        result = cloudinary.uploader.upload(
            video_path,
            resource_type="video",
            folder="webhook_videos",
            overwrite=True
        )
        
        # Get URLs from the result
        video_url = result['secure_url']
        thumbnail_url = cloudinary.utils.cloudinary_url(
            result['public_id'], 
            format='jpg', 
            resource_type='video', 
            width=320, 
            height=240, 
            crop='fill'
        )[0]
        
        return {
            "success": True,
            "video_url": video_url,
            "thumbnail_url": thumbnail_url,
            "public_id": result['public_id']
        }
        
    except Exception as e:
        return {"error": str(e)}

class Delivery:
    def __init__(self):
        self.video_path = "app/data/current/output_final.mp4"
        
    def upload_video(self, file_path=None):
        """
        Upload the video to Cloudinary and return the response.
        
        Args:
            file_path (str, optional): Path to the video file to upload.
                                       If not provided, uses the default path.
        
        Returns:
            dict: Information about the uploaded video including URLs if successful,
                  or error information if the upload failed.
        """
        # Use provided path or default
        video_path = file_path or self.video_path
        
        print(f"Attempting to upload video from: {video_path}")
        print(f"Current working directory: {os.getcwd()}")
        print(f"Does file exist? {os.path.exists(video_path)}")
        
        # List the contents of the directory to help diagnose issues
        try:
            dir_path = os.path.dirname(video_path)
            if os.path.exists(dir_path):
                print(f"Contents of {dir_path}:")
                for filename in os.listdir(dir_path):
                    print(f"  {filename}")
            else:
                print(f"Directory does not exist: {dir_path}")
        except Exception as e:
            print(f"Error listing directory contents: {str(e)}")
            
        response = upload_to_cloudinary(video_path)
        
        if "error" in response:
            print(f"Upload failed: {response['error']}")
        else:
            print(f"Upload successful!")
            print(f"Video URL: {response['video_url']}")
            
        return response

if __name__ == "__main__":
    delivery = Delivery()
    result = delivery.upload_video()
    if "video_url" in result:
        print(result['video_url'])
    else:
        print(f"Upload failed: {result.get('error', 'Unknown error')}")