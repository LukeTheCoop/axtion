from app.gallery.config import GalleryConfig
from app.gallery.agent import Agent
from app.gallery.view import GalleryView
import os

class Gallery:
    def __init__(self, genre: str):
        self.genre = genre
        self.config = GalleryConfig(genre)
        self.agent = Agent(genre)
        self.view = GalleryView(genre)

    def get_video_name(self, description: str):
        return self.agent.agent_response(description)
    
    def add_video(self, video_name: str, video_url: str):
        self.config.add_video(video_name, video_url)
        
    def remove_video(self, video_name: str):
        self.config.remove_video(video_name)
        
    def get_video_list(self):
        return self.config.get_video_list()
    
    def screenshots_pipeline(self, video_name: str = None):
        screenshot_path = self.view.screenshots_video(video_name)
        if screenshot_path and len(screenshot_path) > 0:
            self.view.upload_screenshots(screenshot_path[0])
        else:
            print(f"No screenshots generated for {video_name}")

    def delete_video(self, video_name: str):
        self.config.remove_video(video_name)


    def upload_pipeline(self, video_url: str, description: str):
        # Get the video name from the agent
        video_name = self.get_video_name(description)
        self.video_url = video_url
        # Ensure it has .mp4 extension
        if not video_name.endswith('.mp4'):
            video_name = video_name + '.mp4'
        
        # Add the video (config.add_video will handle adding genre prefix if needed)
        self.add_video(video_name, video_url)
        
        # Get the actual filename used (with correct genre prefix)
        genre_prefix = self.genre + '_'
        if not video_name.startswith(genre_prefix):
            video_name = genre_prefix + video_name
            
        # Pass the correctly formatted name to screenshots pipeline
        self.screenshots_pipeline(video_name)

    
if __name__ == "__main__":
    from config import GalleryConfig
    from agent import Agent
    from view import GalleryView

    gallery = Gallery("nature")
    gallery.add_video("temp.mp4", "https://www.youtube.com/shorts/rniRvtFyc-4")
    gallery.landmark_pipeline()
        
        
        