from moviepy import VideoFileClip, concatenate_videoclips, TextClip, CompositeVideoClip, AudioFileClip
import json
import os

class VideoMerger:
    def __init__(self, video_control_path, video_directory=None, 
                 temp_output_path="app/data/current/output.mp4",
                 final_output_path="app/data/current/output_pre_captions.mp4",
                 audio_path="app/data/current/output_audio.mp3"):
        self.video_control_path = video_control_path
        # If video_directory not provided, determine from the video control file
        if video_directory is None:
            # Extract genre from first video filename in control file
            try:
                with open(video_control_path, 'r') as file:
                    segments = json.load(file)
                    if segments and 'video' in segments[0]:
                        # Extract genre from first part of filename (e.g., cat_***.mp4 -> cat)
                        genre = segments[0]['video'].split('_')[0]
                        self.video_directory = f"app/data/videos/{genre}"
                    else:
                        # Fallback to default
                        self.video_directory = "app/data/videos/cat"
            except Exception:
                # Fallback to default
                self.video_directory = "app/data/videos/cat"
        else:
            self.video_directory = video_directory
        self.temp_output_path = temp_output_path  # Path for the video-only output
        self.final_output_path = final_output_path  # Path for the final video with audio
        self.audio_path = audio_path  # Path to the audio file
        self.segments = []
        self.clips = []
        
        # Ensure output directories exist
        os.makedirs(os.path.dirname(self.temp_output_path), exist_ok=True)
        os.makedirs(os.path.dirname(self.final_output_path), exist_ok=True)
        
        # Print paths for debugging
        print(f"Video directory: {self.video_directory}")
        print(f"Video control path: {self.video_control_path}")
        print(f"Audio path: {self.audio_path}")
        print(f"Final output path: {self.final_output_path}")
        
        # Load video control file
        self.load_control_file()
        
    def load_control_file(self):
        """Load the video control file with timestamps and video names"""
        try:
            with open(self.video_control_path, 'r') as file:
                self.segments = json.load(file)
            print(f"Loaded {len(self.segments)} video segments from control file")
            # Verify the total duration matches expectation
            total_duration = sum(segment["end"] - segment["start"] for segment in self.segments)
            print(f"Total expected duration: {total_duration:.2f} seconds")
            return True
        except Exception as e:
            print(f"Error loading video control file: {e}")
            return False
            
    def prepare_clips(self):
        """Load and trim each video clip according to timestamps"""
        self.clips = []
        
        for i, segment in enumerate(self.segments):
            video_path = os.path.join(self.video_directory, segment["video"])
            start_time = segment["start"]
            end_time = segment["end"]
            duration = end_time - start_time
            
            try:
                print(f"Processing clip {i+1}/{len(self.segments)}: {segment['video']}")
                # Load the video file with resize to ensure consistent dimensions
                clip = VideoFileClip(video_path, audio=False)
                
                # Instead of using subclip, just set the duration directly
                print(f"  Original clip duration: {clip.duration:.2f}s, target duration: {duration:.2f}s")
                
                # Handle clips that are shorter than the required duration
                if clip.duration < duration:
                    print(f"  Video is shorter than required duration. Looping...")
                    # For looping, we'll use a different approach - manually loop in the final video
                    # Just set a marker that this clip needs to loop
                    clip.needs_loop = True
                else:
                    clip.needs_loop = False
                
                # Set the exact duration needed
                # Note: In MoviePy v2, setting duration directly on the clip works
                clip.duration = duration
                print(f"  Set clip duration to: {clip.duration:.2f}s")
                
                # Add to our list of clips
                self.clips.append(clip)
                
            except Exception as e:
                print(f"Error processing clip {segment['video']}: {e}")
                # If a clip fails, add a black clip with the same duration to maintain timing
                from moviepy.video.VideoClip import ColorClip
                print(f"Using a blank clip as fallback for {duration} seconds")
                blank_clip = ColorClip(size=(480, 854), color=(0, 0, 0))
                blank_clip.duration = duration  # Set duration directly
                self.clips.append(blank_clip)
        
        # Verify total duration matches expected
        total_duration = sum(clip.duration for clip in self.clips)
        print(f"Total clip duration: {total_duration:.2f} seconds")
        return len(self.clips) > 0
        
    def merge_videos(self):
        """Concatenate all the clips into a final video"""
        if not self.clips:
            print("No clips to merge. Run prepare_clips() first.")
            return False
            
        try:
            # Process clips that need looping
            final_clips = []
            for clip in self.clips:
                # If clip has the "needs_loop" attribute and it's True, we need to manually handle looping
                if hasattr(clip, 'needs_loop') and clip.needs_loop:
                    # Calculate how many times we need to loop the clip to reach the required duration
                    try:
                        # Try to get the original duration from reader
                        original_duration = clip.reader.duration
                    except (AttributeError, Exception) as e:
                        # Fallback if reader.duration is not available
                        print(f"  Could not access reader.duration: {e}")
                        original_duration = clip.duration  # Use the current duration as fallback
                    
                    # Calculate how many times we need to loop
                    required_duration = clip.duration
                    loop_count = max(2, int(required_duration / original_duration) + 1)
                    print(f"  Looping video {loop_count} times to reach {required_duration:.2f}s from original {original_duration:.2f}s")
                    
                    # Create multiple clips with the original duration
                    loop_clips = []
                    for _ in range(loop_count):
                        loop_clip = VideoFileClip(clip.filename, audio=False)
                        loop_clips.append(loop_clip)
                    
                    # Concatenate the loop clips
                    looped_clip = concatenate_videoclips(loop_clips, method="compose")
                    # Trim to exact duration needed
                    looped_clip = looped_clip.subclip(0, clip.duration)
                    final_clips.append(looped_clip)
                else:
                    final_clips.append(clip)
            
            # Use method="compose" to handle different resolutions properly
            final_clip = concatenate_videoclips(final_clips, method="compose")
            print(f"Created final clip with duration: {final_clip.duration:.2f} seconds")
            return final_clip
        except Exception as e:
            print(f"Error merging clips: {e}")
            # Fallback to direct concatenation if method="compose" fails
            try:
                print("Trying fallback concatenation...")
                final_clip = concatenate_videoclips(self.clips)
                return final_clip
            except Exception as e2:
                print(f"Fallback also failed: {e2}")
                return None
            
    def save_video(self, final_clip=None):
        """Save the video-only output to temp location"""
        if final_clip is None:
            final_clip = self.merge_videos()
            
        if not final_clip:
            return False
            
        try:
            # Create the video without audio first
            print(f"Saving video-only output to {self.temp_output_path}")
            final_clip.write_videofile(
                self.temp_output_path, 
                codec="libx264", 
                audio=False,  # No audio needed for this step
                fps=24  # Consistent frame rate
            )
            
            # Close all clips to free resources
            for clip in self.clips:
                if hasattr(clip, 'close'):
                    clip.close()
            
            return True
        except Exception as e:
            print(f"Error saving video: {e}")
            return False
    
    def merge_audio_with_video(self):
        """Merge the audio file with the video and create the final output using modern MoviePy approach"""
        try:
            # Check if the video file exists
            if not os.path.exists(self.temp_output_path):
                print(f"Error: Video file {self.temp_output_path} does not exist")
                return False
                
            # Check if the audio file exists
            if not os.path.exists(self.audio_path):
                print(f"Error: Audio file {self.audio_path} does not exist")
                return False
                
            print(f"Merging audio from {self.audio_path} with video from {self.temp_output_path}")
            
            # Load the video and audio
            video = VideoFileClip(self.temp_output_path)
            audio = AudioFileClip(self.audio_path)
            
            # In MoviePy v2, it's recommended to use with_audio instead of set_audio
            # with_audio returns a new clip without modifying the original
            final_video = video.with_audio(audio)
            
            # Write the final video with audio using best practices for audio codec
            print(f"Saving final video with audio to {self.final_output_path}")
            final_video.write_videofile(
                self.final_output_path,
                codec="libx264",
                audio_codec="aac",  # AAC is the recommended audio codec for mp4
                temp_audiofile="temp-audio.m4a",  # Specify temp file to avoid issues
                remove_temp=True,  # Remove temp files after processing
                audio_bitrate="192k",  # Higher quality audio
                fps=24
            )
            
            # Close the resources
            video.close()
            audio.close()
            if hasattr(final_video, 'close'):
                final_video.close()
            
            print(f"Final video with audio saved to {self.final_output_path}")
            return True
            
        except Exception as e:
            print(f"Error merging audio with video: {e}")
            return False
            
    def process(self):
        """Run the full video merging process"""
        if not self.load_control_file():
            return False
            
        if not self.prepare_clips():
            return False
            
        final_clip = self.merge_videos()
        if not final_clip:
            return False
            
        if not self.save_video(final_clip):
            return False
            
        # After creating the video-only output, merge with audio
        return self.merge_audio_with_video()


# Example usage
if __name__ == "__main__":
    merger = VideoMerger("data/current/video_control.json")
    merger.process()