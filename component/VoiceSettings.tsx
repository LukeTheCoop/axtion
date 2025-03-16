import React, { useState, useEffect, useRef } from 'react';
import styles from './Dashboard.module.css';
import { useVoiceConfig } from '../hooks/useVoiceConfig';
import SaveNotification from './SaveNotification';

interface Voice {
  id: string;
  name: string;
  description?: string;
}

interface VoiceSettingsProps {
  onVoiceChange?: (voice: Voice) => void;
  onSpeedChange?: (speed: number) => void;
  onPitchChange?: (pitch: number) => void;
}

const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  onVoiceChange,
  onSpeedChange,
  onPitchChange
}) => {
  const voices: Voice[] = [
    { id: "Edward", name: "Edward", description: "Professional male voice" },
    { id: "am_michael", name: "Michael", description: "Natural conversational voice" },
    { id: "Ethan", name: "Ethan", description: "Clear articulate male voice" },
    { id: "Allison", name: "Allison", description: "Professional female voice" },
  ];

  const voiceConfig = useVoiceConfig();
  const [selectedVoice, setSelectedVoice] = useState<Voice>(voices[0]);
  const [speed, setSpeed] = useState<number>(0);
  const [pitch, setPitch] = useState<number>(1);
  const [visualizer, setVisualizer] = useState<number[]>([]);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSaveNotification, setShowSaveNotification] = useState<boolean>(false);
  const [isPlayingPreview, setIsPlayingPreview] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  // Debounce timer for saving changes
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load voice settings from API
  useEffect(() => {
    if (!voiceConfig.isLoading && !voiceConfig.error) {
      const voiceId = voiceConfig.voice;
      console.log('Voice ID from config:', voiceId);
      const matchedVoice = voices.find(v => v.id === voiceId) || voices[0];
      console.log('Matched voice:', matchedVoice);
      setSelectedVoice(matchedVoice);
      setSpeed(voiceConfig.speed);
      setPitch(voiceConfig.pitch);
    }
  }, [voiceConfig.isLoading, voiceConfig.voice, voiceConfig.speed, voiceConfig.pitch]);

  // Save changes to the API
  const saveChanges = async () => {
    if (isSaving) return;
    
    try {
      setIsSaving(true);
      
      const payload = {
        voice: selectedVoice.id,
        speed,
        pitch,
      };
      
      console.log('Saving voice settings:', payload);
      
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Voice settings saved successfully:', data);
        setShowSaveNotification(true);
        
        // Refresh voice config data after saving to ensure UI is up to date
        await voiceConfig.refresh();
      } else {
        console.error('Failed to save voice settings:', data.error);
      }
    } catch (error) {
      console.error('Error saving voice settings:', error);
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

  // Generate a simulated voice frequency visualizer
  useEffect(() => {
    const generateVisualizer = () => {
      const bars = 15;
      const newVisualizer = [];
      
      for (let i = 0; i < bars; i++) {
        // Create a wave pattern that looks like audio
        const height = 30 + Math.sin(Date.now() / 500 + i / 2) * 20 + Math.random() * 10;
        newVisualizer.push(height);
      }
      
      setVisualizer(newVisualizer);
    };
    
    const interval = setInterval(generateVisualizer, 100);
    return () => clearInterval(interval);
  }, []);

  const handleVoiceChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const voiceId = e.target.value;
    console.log(`Voice selection changed to: ${voiceId}`);
    
    const voice = voices.find(v => v.id === voiceId) || voices[0];
    setSelectedVoice(voice); // Update local state immediately for better UI responsiveness
    
    try {
      // First update the backend
      setIsSaving(true);
      
      const payload = {
        voice: voiceId,
        speed,
        pitch,
      };
      
      console.log('Saving voice change:', payload);
      
      const response = await fetch('/api/voice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Voice setting saved successfully:', data);
        
        if (onVoiceChange) onVoiceChange(voice);
        setShowSaveNotification(true);
      } else {
        console.error('Failed to save voice setting:', data.error);
      }
    } catch (error) {
      console.error('Error changing voice:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setSpeed(newSpeed);
    if (onSpeedChange) onSpeedChange(newSpeed);
    // Don't save on every change - will save on mouseup/touchend
  };

  const handlePitchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPitch = parseFloat(e.target.value);
    setPitch(newPitch);
    if (onPitchChange) onPitchChange(newPitch);
    // Don't save on every change - will save on mouseup/touchend
  };

  // Add handlers for when user releases the slider
  const handleSliderRelease = () => {
    saveChanges();
  };

  // Play voice preview
  const playVoicePreview = () => {
    if (isPlayingPreview) {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      setIsPlayingPreview(false);
      return;
    }

    const audioFile = `/voices/${selectedVoice.id}.mp3`;
    
    if (!audioRef.current) {
      audioRef.current = new Audio(audioFile);
      
      audioRef.current.onended = () => {
        setIsPlayingPreview(false);
      };
    } else {
      audioRef.current.src = audioFile;
    }
    
    audioRef.current.play()
      .then(() => {
        setIsPlayingPreview(true);
      })
      .catch(error => {
        console.error('Error playing voice preview:', error);
        setIsPlayingPreview(false);
      });
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  return (
    <>
      <SaveNotification
        show={showSaveNotification}
        message="Voice settings saved successfully"
        onComplete={() => setShowSaveNotification(false)}
      />
      
      <div className={styles.settingsContainer}>
        <div className={styles.settingsPanel}>
          <div className={styles.settingsHeader}>
            <h2 className={styles.settingsTitle}>Voice Settings</h2>
            <div className={styles.visualizerContainer}>
              {visualizer.map((height, index) => (
                <div 
                  key={index} 
                  className={styles.visualizerBar}
                  style={{ 
                    height: `${height}%`,
                    backgroundColor: `rgba(104, 153, 255, ${0.4 + (height / 100) * 0.6})`,
                    animationDelay: `${index * 0.05}s`
                  }}
                ></div>
              ))}
            </div>
          </div>
          
          <div className={styles.settingsContent}>
            <p className={styles.settingsDescription}>
              Customize the voice output with professional text-to-speech voices. 
              Adjust speed and pitch to match your preferences.
            </p>
            
            <div className={styles.glowPoint} style={{ top: '70px', right: '40px' }}></div>
            <div className={styles.glowPoint} style={{ bottom: '60px', left: '30px' }}></div>
            
            <div className={styles.selectContainer}>
              <label className={styles.sliderName} htmlFor="voice-select">Voice</label>
              <select 
                id="voice-select"
                className={styles.premiumSelect} 
                value={selectedVoice.id}
                onChange={handleVoiceChange}
              >
                {voices.map(voice => (
                  <option key={voice.id} value={voice.id}>
                    {voice.name} - {voice.description}
                  </option>
                ))}
              </select>
              <div className={styles.selectArrow}></div>
            </div>
            
            <div className={styles.sliderContainer3D}>
              <div className={styles.sliderLabel3D}>
                <span className={styles.sliderName}>Speed</span>
                <span className={styles.sliderValue}>{speed.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="-1"
                max="1"
                step="0.1"
                value={speed}
                onChange={handleSpeedChange}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className={styles.sliderInput}
                style={{ width: '100%', opacity: 0, position: 'absolute', zIndex: 2, height: '10px', cursor: 'pointer' }}
              />
              <div className={styles.sliderTrack3D}>
                <div 
                  className={styles.sliderFill3D} 
                  style={{ width: `${((speed + 1) / 2) * 100}%` }}
                ></div>
              </div>
              <div className={styles.sliderMarkers}>
                <span>Slower (-1.0)</span>
                <span>Normal (0.0)</span>
                <span>Faster (1.0)</span>
              </div>
            </div>
            
            <div className={styles.sliderContainer3D}>
              <div className={styles.sliderLabel3D}>
                <span className={styles.sliderName}>Pitch</span>
                <span className={styles.sliderValue}>{pitch.toFixed(1)}</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={handlePitchChange}
                onMouseUp={handleSliderRelease}
                onTouchEnd={handleSliderRelease}
                className={styles.sliderInput}
                style={{ width: '100%', opacity: 0, position: 'absolute', zIndex: 2, height: '10px', cursor: 'pointer' }}
              />
              <div className={styles.sliderTrack3D}>
                <div 
                  className={styles.sliderFill3D} 
                  style={{ width: `${((pitch - 0.5) / 1) * 100}%` }}
                ></div>
              </div>
              <div className={styles.sliderMarkers}>
                <span>Lower (0.5)</span>
                <span>Normal (1.0)</span>
                <span>Higher (1.5)</span>
              </div>
            </div>
            
            <div className={styles.voiceTestSection}>
              <button 
                className={styles.testButton}
                onClick={playVoicePreview}
              >
                <span className={styles.testButtonIcon}>{isPlayingPreview ? '■' : '▶'}</span>
                {isPlayingPreview ? 'Stop Preview' : 'Test Voice'}
              </button>
              <div className={styles.voiceInfo}>
                <div className={styles.voiceInfoItem}>
                  <span className={styles.voiceInfoLabel}>Current Voice:</span>
                  <span className={styles.voiceInfoValue}>{selectedVoice.name}</span>
                </div>
                <div className={styles.voiceInfoItem}>
                  <span className={styles.voiceInfoLabel}>Quality:</span>
                  <span className={styles.voiceInfoValue}>HD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default VoiceSettings; 