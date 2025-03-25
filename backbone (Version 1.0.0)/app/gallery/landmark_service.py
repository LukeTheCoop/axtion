from app.gallery.tools.landmark import detect_landmarks
from app.gallery.config import GalleryConfig
from app.gallery.view import GalleryView
import os
    
def landmark_pipeline(config, view):
        landmark_dict = {}
        print("Clearing landmarks")
        landmarks_path = config.landmark_clear()
        print("Taking screenshots")
        view.landmark_screenshots()
        print("Detecting landmarks")
        print(landmarks_path)
        for file in os.listdir(landmarks_path):
            if file.endswith(".jpg"):
                try:
                    print(f'detecting landmarks for {file}')
                    landmark_dict = detect_landmarks(f'{landmarks_path}/{file}', landmark_dict)
                except Exception as e:
                    print(f"Error detecting landmarks: {e}")
        return landmark_dict