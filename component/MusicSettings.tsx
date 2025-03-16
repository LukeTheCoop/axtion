import React, { useState, useRef, useEffect } from 'react';
import styles from './Dashboard.module.css';
import { useMusicConfig } from '../hooks/useMusicConfig';
import SaveNotification from './SaveNotification';

interface SavedVideo {
  id: string;
  url: string;
  title: string;
  thumbnailUrl?: string;
}

interface MusicSettingsProps {
  onVolumeChange?: (volume: number) => void;
}

const MusicSettings: React.FC<MusicSettingsProps> = ({
  onVolumeChange
}) => {
  const musicConfig = useMusicConfig();
  const [url, setUrl] = useState<string>('');
  const [videoId, setVideoId] = useState<string>('');
  const [volume, setVolume] = useState<number>(100);
  const [startTime, setStartTime] = useState<number>(0);
  const [savedVideos, setSavedVideos] = useState<SavedVideo[]>([]);
  const [currentSavedIndex, setCurrentSavedIndex] = useState<number>(-1);
  const [showSaved, setShowSaved] = useState<boolean>(false);
  const [equalizer, setEqualizer] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSaveNotification, setShowSaveNotification] = useState<boolean>(false);
  
  // Debounce timer for saving changes
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Extract YouTube video ID from URL
  const extractVideoId = (url: string): string => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : '';
  };

  // Reconstruct YouTube URL from video ID
  const constructYoutubeUrl = (videoId: string): string => {
    return `https://www.youtube.com/watch?v=${videoId}`;
  };
  
  // Load music config from API
  useEffect(() => {
    console.log('Music config updated:', musicConfig);
    
    if (!musicConfig.isLoading && !musicConfig.error) {
      console.log('Processing music config with videoId:', musicConfig.videoId);
      
      // First prioritize videoId from the API
      if (musicConfig.videoId) {
        setVideoId(musicConfig.videoId);
        // Construct URL from videoId (this will display in the input)
        const constructedUrl = constructYoutubeUrl(musicConfig.videoId);
        console.log('Setting URL from videoId:', constructedUrl);
        setUrl(constructedUrl);
      }
      
      // Set volume from config
      if (musicConfig.volume !== undefined) {
        console.log('Setting volume from config:', musicConfig.volume);
        setVolume(musicConfig.volume);
      }
      
      // Set start time from config
      if (musicConfig.startTime !== undefined) {
        console.log('Setting start time from config:', musicConfig.startTime);
        setStartTime(musicConfig.startTime);
      }
    }
  }, [musicConfig.isLoading, musicConfig.error, musicConfig.videoId, musicConfig.volume, musicConfig.startTime]);

  // Save changes to the API
  const saveChanges = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      const payload = {
        url: videoId ? constructYoutubeUrl(videoId) : undefined,
        volume,
        start_time: startTime,
      };
      
      console.log('Saving music changes:', payload);
      
      const response = await fetch('/api/music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Music settings saved successfully:', data);
        setShowSaveNotification(true);
      } else {
        console.error('Failed to save music settings:', data.error);
      }
    } catch (error) {
      console.error('Error saving music settings:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Debounced save function to avoid excessive API calls
  const debouncedSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      saveChanges();
    }, 500);
  };
  
  // Generate a simulated equalizer
  useEffect(() => {
    const generateEqualizer = () => {
      const bands = 8;
      const newEqualizer = [];
      
      for (let i = 0; i < bands; i++) {
        // Create a moving EQ visualization
        const height = 30 + Math.sin(Date.now() / 600 + i) * 30 + Math.cos(Date.now() / 400 + i * 2) * 20;
        newEqualizer.push(Math.max(5, Math.min(90, height)));
      }
      
      setEqualizer(newEqualizer);
    };
    
    const interval = setInterval(generateEqualizer, 100);
    return () => clearInterval(interval);
  }, []);
  
  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUrl = e.target.value;
    setUrl(newUrl);
    
    // Automatically extract video ID when URL is entered
    const id = extractVideoId(newUrl);
    if (id) {
      setVideoId(id);
      setShowSaved(false);
      // Don't save immediately - will save on blur
    }
  };

  // Save URL when user clicks away from the input
  const handleUrlBlur = () => {
    if (videoId) {
      saveChanges();
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseInt(e.target.value);
    setVolume(newVolume);
    if (onVolumeChange) onVolumeChange(newVolume);
    // Don't save on every change - will save on mouseup/touchend
  };
  
  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStartTime = parseInt(e.target.value);
    setStartTime(newStartTime);
    // Don't save on every change - will save on mouseup/touchend
  };

  // Add handler for when user releases the slider
  const handleSliderRelease = () => {
    saveChanges();
  };

  const handleSaveVideo = () => {
    if (videoId && !savedVideos.some(video => video.id === videoId)) {
      const newVideo: SavedVideo = {
        id: videoId,
        url: url,
        title: `Video ${savedVideos.length + 1}`, // Use YouTube API for actual titles in a real app
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
      };
      
      setSavedVideos([...savedVideos, newVideo]);
    }
  };

  const handleDeleteVideo = (index: number) => {
    const newSavedVideos = [...savedVideos];
    newSavedVideos.splice(index, 1);
    setSavedVideos(newSavedVideos);
    
    if (showSaved) {
      if (newSavedVideos.length === 0) {
        setShowSaved(false);
      } else if (index === currentSavedIndex) {
        // If we're deleting the current video, show the previous one or the first one
        const newIndex = index === 0 ? 0 : index - 1;
        setCurrentSavedIndex(newIndex < newSavedVideos.length ? newIndex : 0);
      } else if (index < currentSavedIndex) {
        // Adjust index if we're deleting a video before the current one
        setCurrentSavedIndex(currentSavedIndex - 1);
      }
    }
  };

  const showNextSaved = () => {
    if (savedVideos.length > 0) {
      const nextIndex = (currentSavedIndex + 1) % savedVideos.length;
      setCurrentSavedIndex(nextIndex);
      setVideoId(savedVideos[nextIndex].id);
      setShowSaved(true);
      debouncedSave(); // Save when changing videos
    }
  };

  const showPreviousSaved = () => {
    if (savedVideos.length > 0) {
      const prevIndex = currentSavedIndex <= 0 ? savedVideos.length - 1 : currentSavedIndex - 1;
      setCurrentSavedIndex(prevIndex);
      setVideoId(savedVideos[prevIndex].id);
      setShowSaved(true);
      debouncedSave(); // Save when changing videos
    }
  };

  const toggleSavedVideos = () => {
    if (showSaved) {
      setShowSaved(false);
    } else if (savedVideos.length > 0) {
      setCurrentSavedIndex(0);
      setVideoId(savedVideos[0].id);
      setShowSaved(true);
      debouncedSave(); // Save when toggling saved videos
    }
  };

  return (
    <>
      <SaveNotification
        show={showSaveNotification}
        message="Music settings saved successfully"
        onComplete={() => setShowSaveNotification(false)}
      />
      
      <div className={styles.settingsContainer}>
        <div className={`${styles.settingsPanel} ${styles.musicPanel}`}>
          <div className={styles.settingsHeader}>
            <h2 className={styles.settingsTitle}>Music Settings</h2>
            
            <div className={styles.equalizerContainer}>
              {equalizer.map((height, index) => (
                <div 
                  key={index} 
                  className={styles.equalizerBar}
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: `rgba(255, 154, 108, ${0.5 + (height / 100) * 0.5})`,
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          <div className={styles.settingsContent}>
            <p className={styles.settingsDescription}>
              Add background music to enhance your experience. Enter a YouTube URL to load music, 
              adjust volume, and save your favorite tracks for quick access.
            </p>
            
            <div className={styles.glowPoint} style={{ top: '100px', right: '50px', backgroundColor: '#ff9a6c', boxShadow: '0 0 10px 2px rgba(255, 154, 108, 0.7)' }}></div>
            <div className={styles.glowPoint} style={{ bottom: '120px', left: '40px', backgroundColor: '#ff9a6c', boxShadow: '0 0 10px 2px rgba(255, 154, 108, 0.7)' }}></div>
            
            <div className={styles.urlInputWrapper}>
              <input 
                type="text" 
                value={url} 
                onChange={handleUrlChange}
                onBlur={handleUrlBlur}
                placeholder="Enter YouTube URL (e.g., https://www.youtube.com/watch?v=...)"
                className={styles.premiumInput}
              />
            </div>
            
            {videoId && (
              <>
                <div className={styles.videoPlayerContainer}>
                  <div className={styles.videoPlayerHeader}>
                    <span className={styles.nowPlayingLabel}>Now Playing</span>
                    <button 
                      onClick={handleSaveVideo}
                      className={`${styles.actionButton} ${styles.saveButton}`}
                      disabled={savedVideos.some(video => video.id === videoId)}
                    >
                      <span className={styles.saveIcon}>♥</span>
                      Save
                    </button>
                  </div>
                  
                  <div className={styles.videoFrameWrapper}>
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${videoId}?autoplay=0&enablejsapi=1&start=${startTime}`}
                      title="YouTube video player"
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className={styles.videoFrame}
                    ></iframe>
                  </div>
                </div>
                
                <div className={styles.sliderContainer3D}>
                  <div className={styles.sliderLabel3D}>
                    <span className={styles.sliderName}>Volume</span>
                    <span className={styles.sliderValue} style={{ color: '#ff9a6c' }}>{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={handleVolumeChange}
                    onMouseUp={handleSliderRelease}
                    onTouchEnd={handleSliderRelease}
                    className={styles.sliderInput}
                    style={{ width: '100%', opacity: 0, position: 'absolute', zIndex: 2, height: '10px', cursor: 'pointer' }}
                  />
                  <div className={styles.sliderTrack3D}>
                    <div 
                      className={styles.sliderFill3D} 
                      style={{ 
                        width: `${volume}%`,
                        background: 'linear-gradient(90deg, #ff7e4a, #ff9a6c)'
                      }}
                    ></div>
                  </div>
                  <div className={styles.sliderMarkers}>
                    <span>Muted (0%)</span>
                    <span>50%</span>
                    <span>Max (100%)</span>
                  </div>
                </div>

                <div className={styles.sliderContainer3D}>
                  <div className={styles.sliderLabel3D}>
                    <span className={styles.sliderName}>Start Time</span>
                    <span className={styles.sliderValue} style={{ color: '#ff9a6c' }}>{startTime}s</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="300"
                    value={startTime}
                    onChange={handleStartTimeChange}
                    onMouseUp={handleSliderRelease}
                    onTouchEnd={handleSliderRelease}
                    className={styles.sliderInput}
                    style={{ width: '100%', opacity: 0, position: 'absolute', zIndex: 2, height: '10px', cursor: 'pointer' }}
                  />
                  <div className={styles.sliderTrack3D}>
                    <div 
                      className={styles.sliderFill3D} 
                      style={{ 
                        width: `${(startTime / 300) * 100}%`,
                        background: 'linear-gradient(90deg, #ff7e4a, #ff9a6c)'
                      }}
                    ></div>
                  </div>
                  <div className={styles.sliderMarkers}>
                    <span>0s</span>
                    <span>150s</span>
                    <span>300s</span>
                  </div>
                </div>
              </>
            )}
            
            <div className={styles.savedVideosSection}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Saved Playlists <span className={styles.savedCount}>{savedVideos.length}</span></h3>
                <button 
                  onClick={toggleSavedVideos}
                  className={`${styles.actionButton} ${styles.toggleButton}`}
                  disabled={savedVideos.length === 0}
                >
                  {showSaved ? 'Current' : 'Saved'}
                </button>
              </div>
              
              {showSaved && savedVideos.length > 0 && (
                <div className={styles.playlistControls}>
                  <button 
                    onClick={showPreviousSaved}
                    className={styles.navButton}
                  >
                    Previous
                  </button>
                  <span className={styles.playlistCounter}>
                    {currentSavedIndex + 1} / {savedVideos.length}
                  </span>
                  <button 
                    onClick={showNextSaved}
                    className={styles.navButton}
                  >
                    Next
                  </button>
                  <button 
                    onClick={() => handleDeleteVideo(currentSavedIndex)}
                    className={`${styles.actionButton} ${styles.deleteButton}`}
                  >
                    Remove
                  </button>
                </div>
              )}
              
              {!showSaved && savedVideos.length > 0 && (
                <div className={styles.savedVideosList}>
                  {savedVideos.map((video, index) => (
                    <div key={video.id} className={styles.savedVideoCard}>
                      {video.thumbnailUrl && (
                        <div className={styles.videoThumbnail}>
                          <img src={video.thumbnailUrl} alt={video.title} />
                          <div className={styles.playOverlay}>
                            <span className={styles.playIcon}>▶</span>
                          </div>
                        </div>
                      )}
                      
                      <div className={styles.videoCardContent}>
                        <div className={styles.videoTitle}>{video.title}</div>
                        <div className={styles.videoCardActions}>
                          <button 
                            onClick={() => {
                              setVideoId(video.id);
                              setCurrentSavedIndex(index);
                              setShowSaved(true);
                              debouncedSave(); // Save when selecting a saved video
                            }}
                            className={`${styles.actionButton} ${styles.playButton}`}
                          >
                            Play
                          </button>
                          <button 
                            onClick={() => handleDeleteVideo(index)}
                            className={`${styles.actionButton} ${styles.deleteButton}`}
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {savedVideos.length === 0 && (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>♫</div>
                  <p className={styles.emptyText}>No saved music found. Load a YouTube video and save it to your playlist.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default MusicSettings; 