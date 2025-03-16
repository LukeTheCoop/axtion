import os
import subprocess
from pathlib import Path
import sys
import shutil

# Track if pydub is available
PYDUB_AVAILABLE = False
try:
    # Try to import pydub
    from pydub import AudioSegment
    # Test that it works by creating a simple silent segment
    test_segment = AudioSegment.silent(duration=100)
    PYDUB_AVAILABLE = True
    print("pydub successfully imported and available for use")
except ImportError as e:
    if "pyaudioop" in str(e):
        print("pydub import error: Missing 'pyaudioop' module")
        print("This is a known issue with Python 3.13. Using MoviePy for volume adjustment instead.")
    else:
        print(f"pydub import error: {e}")
        print("Will use MoviePy for volume adjustment instead.")
except Exception as e:
    print(f"pydub initialization error: {e}")
    print("pydub is installed but encountered an error. Will use MoviePy for volume adjustment instead.")

# Always set volume in merge_with_video for consistency
SET_VOLUME_IN_MERGE = True

class Music:
    def __init__(self, youtube_url: str, volume: int = 100, start_time: int = 0):
        self.youtube_url = youtube_url
        self.volume = volume
        self.start_time = start_time  # Time in seconds to start the audio from

    def get_music(self):
        """
        Download audio from a YouTube URL.
        
        This function tries multiple methods:
        1. yt-dlp (external tool)
        2. youtube-dl (external tool)
        3. pytube (Python library - fallback)
        
        Returns:
            str: Path to the downloaded mp3 file
        """
        # Create output directory if it doesn't exist
        output_dir = Path("data/current")
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Always use "music.mp3" as the filename
        output_file = output_dir / "music.mp3"
        
        # Method 1: Try yt-dlp
        if self._try_ytdlp(output_file):
            # We'll skip direct volume adjustment here
            # The volume will be adjusted during the merge_with_video process
            return str(output_file)
            
        # Method 2: Try youtube-dl
        if self._try_youtubedl(output_file):
            # We'll skip direct volume adjustment here
            # The volume will be adjusted during the merge_with_video process
            return str(output_file)
            
        # Method 3: Fallback to pytube (Python library)
        if self._try_pytube(output_file):
            # We'll skip direct volume adjustment here
            # The volume will be adjusted during the merge_with_video process
            return str(output_file)
            
        # If all methods fail, raise a comprehensive error
        raise Exception(
            "Failed to download YouTube audio. Please install one of these tools:\n"
            "1. yt-dlp: pip install yt-dlp\n"
            "2. youtube-dl: pip install youtube-dl\n"
            "3. pytube: pip install pytube\n"
        )
    
    def merge_with_video(self, video_path="data/current/output_with_captions.mp4", output_path="data/current/output_final.mp4"):
        """
        Merge the downloaded music with a video file and adjust volume in the process.
        Preserves the original audio (speech) and overlays the music on top.
        
        Args:
            video_path: Path to the video file to merge with
            output_path: Path where the final video will be saved
            
        Returns:
            str: Path to the final output video with music
        """
        try:
            # Try to import in this method to bypass potential module-level import issues
            try:
                from moviepy import VideoFileClip, AudioFileClip, CompositeAudioClip
                from moviepy.audio.fx import MultiplyVolume
                from moviepy.audio.fx import AudioLoop
                print("Successfully imported moviepy modules")
            except ImportError as e:
                print(f"Error importing moviepy: {e}")
                print("Please ensure moviepy is installed: pip install moviepy")
                return None
            
            # Create paths
            music_file = Path("data/current/music.mp3")
            video_path = Path(video_path)
            output_path = Path(output_path)
            
            # Ensure the music file exists
            if not music_file.exists():
                print(f"Music file not found at {music_file}")
                return None
                
            # Ensure the video file exists
            if not video_path.exists():
                print(f"Video file not found at {video_path}")
                return None
                
            print(f"Merging music from {music_file} with video from {video_path}")
            print(f"Music volume will be set to {self.volume}% and overlaid on existing audio")
            
            # Check if output directory exists
            output_path.parent.mkdir(parents=True, exist_ok=True)
            
            # Load the video with its original audio
            video = VideoFileClip(str(video_path))
            
            # Extract the original audio from the video
            original_audio = video.audio
            if original_audio is None:
                print("Warning: Video doesn't have any audio. Using music only.")
            
            # Load the music
            music_audio = AudioFileClip(str(music_file))
            
            # Apply start time offset if specified
            if self.start_time > 0:
                if self.start_time < music_audio.duration:
                    print(f"Starting music at {self.start_time} seconds into the audio clip")
                    music_audio = music_audio.subclipped(self.start_time)
                else:
                    print(f"Warning: Start time ({self.start_time}s) exceeds music duration ({music_audio.duration:.2f}s). Using from the beginning.")
            
            # Apply volume adjustment using MultiplyVolume
            volume_factor = self.volume / 100.0
            print(f"Setting music volume to {self.volume}% ({volume_factor:.2f} multiplier) using MultiplyVolume effect")
            
            # Create the volume effect and apply it to the music audio correctly
            volume_effect = MultiplyVolume(volume_factor)
            adjusted_music = music_audio.with_effects([volume_effect])
            print(f"Applied volume factor {volume_factor} to music audio using with_effects")
            
            # If music is shorter than video, loop it to fill the entire duration
            if adjusted_music.duration < video.duration:
                print(f"Music ({adjusted_music.duration:.2f}s) is shorter than video ({video.duration:.2f}s). Will loop music to fill video.")
                loop_effect = AudioLoop(duration=video.duration)
                adjusted_music = adjusted_music.with_effects([loop_effect])
                print(f"Applied audio looping to cover entire video duration")
            # If music is longer than video, trim it
            elif adjusted_music.duration > video.duration:
                adjusted_music = adjusted_music.subclipped(0, video.duration)
                print(f"Music trimmed to match video duration: {video.duration:.2f} seconds")
            
            # Create a composite audio track with both original audio and music
            if original_audio is not None:
                # Create a list with original audio first, then music
                audio_clips = [original_audio, adjusted_music]
                # Combine them into a CompositeAudioClip
                combined_audio = CompositeAudioClip(audio_clips)
                print("Combined original audio with volume-adjusted music")
            else:
                # If there's no original audio, just use the music
                combined_audio = adjusted_music
                print("Using volume-adjusted music only as there was no original audio")
            
            # Set the combined audio to the video
            print(f"Saving final video with music to {output_path}")
            final_video = video.with_audio(combined_audio)
            
            # Write the final video with audio
            final_video.write_videofile(
                str(output_path),
                codec="libx264",
                audio_codec="aac",  # AAC is the recommended audio codec for mp4
                temp_audiofile="temp-audio.m4a",  # Specify temp file to avoid issues
                remove_temp=True,  # Remove temp files after processing
                audio_bitrate="192k",  # Higher quality audio
                fps=24
            )
            
            # Close all resources properly
            if hasattr(video, 'close'):
                video.close()
            if hasattr(original_audio, 'close'):
                original_audio.close()
            if hasattr(music_audio, 'close'):
                music_audio.close()
            if hasattr(adjusted_music, 'close'):
                adjusted_music.close()
            if hasattr(combined_audio, 'close'):
                combined_audio.close()
            if hasattr(final_video, 'close'):
                final_video.close()
            
            print(f"Final video with overlaid music saved to {output_path}")
            return str(output_path)
            
        except Exception as e:
            print(f"Error merging music with video: {e}")
            import traceback
            traceback.print_exc()
            return None
    
    def _adjust_volume(self, file_path):
        """
        Adjust the volume of the audio file using MoviePy.
        
        Args:
            file_path: Path to the audio file to adjust
            
        Returns:
            bool: True if successful, False otherwise
        """
        file_path = Path(file_path)
        print(f"Adjusting volume to {self.volume}%...")
        
        # Due to compatibility issues with pydub in Python 3.13, we'll use MoviePy directly
        return self._adjust_volume_with_moviepy(file_path)
    
    def _adjust_volume_with_moviepy(self, file_path):
        """Adjust volume with MoviePy v2 using the MultiplyVolume effect."""
        try:
            # Import MoviePy for this method only
            from moviepy import AudioFileClip
            from moviepy.audio.fx import MultiplyVolume
            
            print(f"Using MoviePy v2's MultiplyVolume effect for volume adjustment...")
            
            # Load the audio file
            audio = AudioFileClip(str(file_path))
            
            # Apply start time offset if specified
            if self.start_time > 0:
                if self.start_time < audio.duration:
                    print(f"Starting music at {self.start_time} seconds into the audio clip")
                    audio = audio.subclipped(self.start_time)
                else:
                    print(f"Warning: Start time ({self.start_time}s) exceeds music duration ({audio.duration:.2f}s). Using from the beginning.")
            
            # Calculate volume factor
            volume_factor = self.volume / 100.0
            print(f"Using volume factor: {volume_factor:.2f}")
            
            # Create the volume effect and apply it correctly
            volume_effect = MultiplyVolume(volume_factor)
            adjusted_audio = audio.with_effects([volume_effect])
            print(f"Applied volume multiplication using MultiplyVolume effect")
            
            # Save to a temporary file
            temp_file = file_path.with_name("temp_" + file_path.name)
            print(f"Writing volume-adjusted audio to {temp_file}")
            adjusted_audio.write_audiofile(
                str(temp_file),
                codec="mp3",
                bitrate="192k"
            )
            
            # Close audio clips
            if hasattr(audio, 'close'):
                audio.close()
            if hasattr(adjusted_audio, 'close'):
                adjusted_audio.close()
            
            # Replace original with volume-adjusted file
            if temp_file.exists():
                if file_path.exists():
                    file_path.unlink()
                shutil.move(str(temp_file), str(file_path))
                print(f"Volume successfully adjusted to {self.volume}% with MoviePy")
                return True
            else:
                print(f"Error: Temporary file {temp_file} was not created")
                return False
            
        except Exception as e:
            print(f"Error adjusting volume with MoviePy: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _try_ytdlp(self, output_file):
        """Try downloading with yt-dlp."""
        if not shutil.which("yt-dlp"):
            print("yt-dlp not found. Trying other methods...")
            return False
            
        try:
            # Remove file if it already exists to ensure fresh download
            if output_file.exists():
                output_file.unlink()
                
            cmd = [
                "yt-dlp",
                "-x",  # Extract audio
                "--audio-format", "mp3",  # Convert to mp3
                "--audio-quality", "0",  # Best quality
                "--force-overwrites",  # Force overwrite if file exists
                "-o", str(output_file),
                self.youtube_url
            ]
            subprocess.run(cmd, check=True)
            print(f"Successfully downloaded audio using yt-dlp to {output_file}")
            return True
        except subprocess.SubprocessError as e:
            print(f"yt-dlp error: {e}")
            return False
    
    def _try_youtubedl(self, output_file):
        """Try downloading with youtube-dl."""
        if not shutil.which("youtube-dl"):
            print("youtube-dl not found. Trying other methods...")
            return False
            
        try:
            # Remove file if it already exists to ensure fresh download
            if output_file.exists():
                output_file.unlink()
                
            cmd = [
                "youtube-dl",
                "-x",  # Extract audio
                "--audio-format", "mp3",  # Convert to mp3
                "--audio-quality", "0",  # Best quality
                "--force-overwrites",  # Force overwrite if file exists
                "-o", str(output_file),
                self.youtube_url
            ]
            subprocess.run(cmd, check=True)
            print(f"Successfully downloaded audio using youtube-dl to {output_file}")
            return True
        except subprocess.SubprocessError as e:
            print(f"youtube-dl error: {e}")
            return False
    
    def _try_pytube(self, output_file):
        """Try downloading with pytube library (pure Python solution)."""
        try:
            from pytube import YouTube
            from moviepy import AudioFileClip
            
            print("Attempting download with pytube library...")
            
            # Remove file if it already exists to ensure fresh download
            if output_file.exists():
                output_file.unlink()
                
            # Create a temporary directory for the download
            temp_dir = Path("data/temp")
            temp_dir.mkdir(parents=True, exist_ok=True)
            temp_file = temp_dir / "temp_audio"
            
            # Download the audio stream
            yt = YouTube(self.youtube_url)
            audio_stream = yt.streams.filter(only_audio=True).first()
            
            if not audio_stream:
                print("No audio stream found in the YouTube video")
                return False
                
            # Download the audio to the temp directory
            downloaded_file = audio_stream.download(output_path=str(temp_dir), filename=temp_file.name)
            
            # Convert to mp3 using moviepy
            clip = AudioFileClip(downloaded_file)
            
            # We don't adjust volume here, it will be done in the merge_with_video or _adjust_volume methods
            # If needed, we can set clip.volume = volume_factor
            
            clip.write_audiofile(str(output_file))
            clip.close()
            
            # Clean up the temporary file
            os.remove(downloaded_file)
            
            print(f"Successfully downloaded audio using pytube to {output_file}")
            return True
        except ImportError:
            print("pytube or moviepy not installed. Run: pip install pytube moviepy")
            return False
        except Exception as e:
            print(f"pytube error: {e}")
            return False
        
if __name__ == "__main__":
    # Comment out the pydub code as we'll use the class-based approach
    # from pydub import AudioSegment
    # song = AudioSegment.from_mp3("data/current/music.mp3")
    # louder_song = song + 6
    # quieter_song = song - 3
    # quieter_song.export("quieter_song.mp3", format='mp3')
    
    # Uncomment the Music class usage for processing
    # Example using start_time of 30 seconds
    music = Music("https://www.youtube.com/watch?v=yKNxeF4KMsY", volume=50, start_time=260)
    try:
        # Download the music file
        music_file = music.get_music()
        print(f"Downloaded audio: {music_file}")
        
        # First, try to adjust the volume of the standalone MP3
        if Path(music_file).exists():
            if music.volume != 100:
                print("Applying volume adjustment to downloaded audio...")
                music._adjust_volume(music_file)
        
        # Then, merge with video if it exists
        video_path = "data/current/output_with_captions.mp4"
        output_path = "data/current/output_final.mp4"
        if Path(video_path).exists():
            print(f"Found video file: {video_path}")
            final_output = music.merge_with_video(video_path=video_path, output_path=output_path)
            if final_output:
                print(f"Created final video with music: {final_output}")
        else:
            print(f"Video file {video_path} not found. Music file can be used separately.")
    except Exception as e:
        print(f"Error: {e}")
        print("\nPlease install one of the following packages to download YouTube audio:")
        print("  pip install yt-dlp")
        print("  pip install youtube-dl")
        print("  pip install pytube moviepy")
        sys.exit(1)
