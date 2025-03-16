from moviepy import VideoFileClip, TextClip, CompositeVideoClip
import json
import os
import re

class CaptionAdder:
    def __init__(self, control_file_path, input_video_path="app/data/current/output_pre_captions.mp4",
                 output_video_path="app/data/current/output_with_captions.mp4",
                 font_path="app/data/captions/fonts/Montserrat-ExtraBold.ttf", font_size=60, color="white"):
        self.control_file_path = control_file_path
        self.input_video_path = input_video_path
        self.output_video_path = output_video_path
        self.font = font_path if os.path.exists(font_path) else "Arial"
        self.font_size = font_size
        self.color = color
        self.segments = []
        
        # Ensure output directories exist
        os.makedirs(os.path.dirname(self.output_video_path), exist_ok=True)
        
        # Print paths for debugging
        print(f"Caption control file path: {self.control_file_path}")
        print(f"Input video path: {self.input_video_path}")
        print(f"Output video path: {self.output_video_path}")
        print(f"Font path: {self.font_path if hasattr(self, 'font_path') else self.font}")
        
        # Load the video control file
        self.load_control_file()
        
        # Check if font exists
        if not os.path.exists(font_path):
            print(f"Warning: Font file {font_path} not found. Using default font 'Arial' instead.")
    
    def load_control_file(self):
        """Load the video control file with timestamps and text"""
        try:
            with open(self.control_file_path, 'r') as file:
                self.segments = json.load(file)
            print(f"Loaded {len(self.segments)} text segments from control file")
            return True
        except Exception as e:
            print(f"Error loading control file: {e}")
            return False
    
    def word_time_estimator(self, text, total_duration):
        """
        Estimates the timing for each word based on its length and the total duration.
        Longer words will get proportionally more time.
        """
        # Modified regex to keep apostrophes with words and handle punctuation better
        # First split by whitespace to preserve words with apostrophes intact
        raw_words = text.strip().split()
        
        # Process each raw word to handle punctuation correctly
        words = []
        for raw_word in raw_words:
            # Check if word ends with punctuation
            if raw_word and raw_word[-1] in '.,:;!?':
                # If the word is just punctuation, add it as is
                if len(raw_word) == 1:
                    words.append(raw_word)
                else:
                    # Add the word with its punctuation attached
                    words.append(raw_word)
            else:
                # Regular word without punctuation
                words.append(raw_word)
        
        if not words:
            return []
        
        # Calculate total characters (as a rough estimate of speaking time)
        total_chars = sum(len(word) for word in words)
        
        # Minimum duration for very short words (like "a", "I")
        min_duration = 0.15
        
        # Adjust total duration to account for silence at the end (use 90% of total time)
        # This creates a buffer at the end of each segment
        adjusted_duration = total_duration * 0.9
        
        # Allocate time proportionally to each word's length, with a minimum duration
        word_durations = []
        remaining_duration = adjusted_duration
        
        for i, word in enumerate(words):
            # Last word gets all remaining time to ensure we match the adjusted duration
            if i == len(words) - 1:
                word_durations.append((word, remaining_duration))
            else:
                # Calculate proportional duration based on word length
                char_ratio = len(word) / total_chars
                word_duration = max(min_duration, adjusted_duration * char_ratio)
                
                # Ensure we don't exceed remaining time
                word_duration = min(word_duration, remaining_duration)
                remaining_duration -= word_duration
                
                word_durations.append((word, word_duration))
        
        # For standalone punctuation, give minimum duration
        word_durations = [(word, dur if len(word) > 1 else min_duration) 
                          for word, dur in word_durations]
        
        return word_durations
    
    def create_word_clips(self, video_size):
        """Create a list of TextClips for each word with correct timing"""
        if not self.segments:
            print("No segments loaded. Call load_control_file() first.")
            return []
        
        all_clips = []
        video_width, video_height = video_size
        
        for i, segment in enumerate(self.segments):
            start_time = segment["start"]
            end_time = segment["end"]
            text = segment["text"]
            duration = end_time - start_time
            
            # Handle timing differently for first segment vs subsequent segments
            if i == 0:  # First segment
                # Add a slight delay at the beginning of the video
                initial_delay = 0.4  # 400ms delay for first segment
                adjusted_start = start_time + initial_delay
                print(f"First segment: Adding {initial_delay}s delay")
            else:  # Subsequent segments
                # For later segments, start slightly earlier to account for silent gaps
                timing_offset = 0.2  # 200ms earlier
                adjusted_start = max(0, start_time - timing_offset)
                print(f"Segment {i+1}: Starting {timing_offset}s earlier")
            
            # Get word timing estimates
            word_timings = self.word_time_estimator(text, duration)
            
            # Create a clip for each word
            segment_start = adjusted_start
            for word, word_duration in word_timings:
                try:
                    # Create the text clip with the required font parameter
                    # Using the documented parameter names from MoviePy v2
                    txt_clip = TextClip(
                        text=word,
                        font=self.font,  # Required parameter in v2
                        font_size=self.font_size,
                        color=self.color,
                        stroke_color="black",
                        stroke_width=3,
                        method="label",  # Default method
                        text_align="center"   # Text alignment within the clip
                    )
                    
                    # In MoviePy v2, use with_position and with_start/with_duration instead of set_*
                    txt_clip = txt_clip.with_position("center")
                    txt_clip = txt_clip.with_start(segment_start)
                    txt_clip = txt_clip.with_duration(word_duration)
                    
                    print(f"Created clip for word '{word}', starts at {segment_start:.2f}s, duration: {word_duration:.2f}s")
                    all_clips.append(txt_clip)
                    
                except Exception as e:
                    print(f"Error creating text clip for word '{word}': {e}")
                    # Try fallback with just the minimal required parameters
                    try:
                        txt_clip = TextClip(
                            text=word,
                            font="Arial",  # Use a standard system font as fallback
                            font_size=self.font_size
                        )
                        
                        # Also use with_* methods in the fallback
                        txt_clip = txt_clip.with_position("center")
                        txt_clip = txt_clip.with_start(segment_start)
                        txt_clip = txt_clip.with_duration(word_duration)
                        
                        all_clips.append(txt_clip)
                        print(f"Created fallback clip for word '{word}'")
                    except Exception as e2:
                        print(f"All attempts failed for word '{word}': {e2}")
                
                segment_start += word_duration
        
        print(f"Total clips created: {len(all_clips)}")
        return all_clips
    
    def add_captions_to_video(self):
        """Add word-by-word captions to the video"""
        if not self.load_control_file():
            return False
        
        try:
            print(f"Loading video from {self.input_video_path}")
            video = VideoFileClip(self.input_video_path)
            
            # Get video dimensions
            width, height = video.size
            print(f"Video dimensions: {width}x{height}")
            
            # Create text clips for each word
            text_clips = self.create_word_clips(video.size)
            
            if not text_clips:
                print("No text clips were created. Cannot proceed.")
                return False
            
            # Combine the original video with the text clips
            print(f"Adding {len(text_clips)} word captions to video")
            final_clip = CompositeVideoClip([video] + text_clips)
            
            # Write the output file
            print(f"Writing output to {self.output_video_path}")
            final_clip.write_videofile(
                self.output_video_path,
                codec="libx264",
                audio_codec="aac",
                temp_audiofile="temp-audio.m4a",
                remove_temp=True
            )
            
            # Close all clips to free resources
            video.close()
            
            return True
        except Exception as e:
            print(f"Error adding captions to video: {e}")
            import traceback
            traceback.print_exc()
            return False

# Example usage
if __name__ == "__main__":
    caption_adder = CaptionAdder("data/current/video_control.json")
    caption_adder.add_captions_to_video()
