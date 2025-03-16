import React, { useState, useEffect, useRef, useMemo } from 'react';
import styles from './GenerationProcess.module.css';
import LoadingBackground from '../component/LoadingBackground';
import { FiCode, FiDatabase, FiMic, FiVideo, FiType, FiMusic, FiLink, FiDownload, FiShare2, FiPlus } from 'react-icons/fi';
import * as generationApi from '../api/generation';

interface GenerationProcessProps {
  onComplete?: () => void;
  mothership?: string;
  prompt?: string;
  videoUrl?: string;
  onReset?: () => void;
}

const GenerationProcess: React.FC<GenerationProcessProps> = ({ 
  onComplete, 
  mothership = "", 
  prompt = "",
  videoUrl = "", 
  onReset
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [finalVideoUrl, setFinalVideoUrl] = useState(videoUrl);
  const [sessionId, setSessionId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // For debugging - log the props
  useEffect(() => {
    console.log("GenerationProcess initialized with:", { mothership, prompt });
  }, [mothership, prompt]);

  // Define all steps in the generation process - using useMemo to prevent unnecessary re-renders
  const steps = useMemo(() => [
    {
      name: "Generate AI Script",
      description: "Creating an optimized script for your video using advanced AI language models.",
      icon: <FiCode />,
      apiCall: async (sessionId: string) => {
        return generationApi.generateScript(mothership, prompt, "military", "medium", sessionId);
      }
    },
    {
      name: "Extract Information",
      description: "Analyzing and extracting key information from your content and structuring it for the video.",
      icon: <FiDatabase />,
      apiCall: async (sessionId: string) => {
        return generationApi.parseScript(sessionId);
      }
    },
    {
      name: "Create Speech",
      description: "Converting text to natural-sounding speech with our advanced voice synthesis technology.",
      icon: <FiMic />,
      apiCall: async (sessionId: string) => {
        return generationApi.createSpeech(sessionId);
      }
    },
    {
      name: "Merge the Videos",
      description: "Combining visual elements and creating a seamless video experience from multiple sources.",
      icon: <FiVideo />,
      apiCall: async (sessionId: string) => {
        return generationApi.mergeVideos(sessionId);
      }
    },
    {
      name: "Add the Captions",
      description: "Generating precise captions synchronized with speech for better engagement and accessibility.",
      icon: <FiType />,
      apiCall: async (sessionId: string) => {
        return generationApi.addCaptions(sessionId);
      }
    },
    {
      name: "Add the Music",
      description: "Enhancing your video with the perfect soundtrack to complement your content.",
      icon: <FiMusic />,
      apiCall: async (sessionId: string) => {
        return generationApi.addMusic(sessionId);
      }
    },
    {
      name: "Receive URL",
      description: "Finalizing your video and preparing it for viewing and sharing.",
      icon: <FiLink />,
      apiCall: async (sessionId: string) => {
        console.log("Starting getVideoUrl API call with sessionId:", sessionId);
        const response = await generationApi.getVideoUrl(sessionId);
        console.log("getVideoUrl response received:", JSON.stringify(response, null, 2));
        
        // Check if the response itself has the videoUrl (in case the backend returns it directly)
        // Use a type assertion here since the API response might have additional properties
        const responseAny = response as any;
        if (responseAny && responseAny.videoUrl) {
          const videoUrl = responseAny.videoUrl;
          console.log("Found videoUrl at top level of response:", videoUrl);
          
          // Handle relative URLs
          if (videoUrl.startsWith('/') && !videoUrl.startsWith('//')) {
            const baseUrl = window.location.origin;
            const absoluteUrl = `${baseUrl}${videoUrl}`;
            console.log("Converted to absolute URL:", absoluteUrl);
            setFinalVideoUrl(absoluteUrl);
          } else {
            setFinalVideoUrl(videoUrl);
          }
          return response;
        }
        
        if (response.success && response.data) {
          console.log("Response data structure:", JSON.stringify(response.data, null, 2));
          
          // The backend might send the URL as video_url in data property, or nested inside data.data
          let videoUrl = null;
          
          if (response.data.videoUrl) {
            videoUrl = response.data.videoUrl;
            console.log("Found videoUrl directly in response.data:", videoUrl);
          } else if (response.data.video_url) {
            videoUrl = response.data.video_url;
            console.log("Found video_url directly in response.data:", videoUrl);
          } else if (response.data.data && response.data.data.video_url) {
            videoUrl = response.data.data.video_url;
            console.log("Found video_url nested in response.data.data:", videoUrl);
          } else if (response.data.url) {
            videoUrl = response.data.url;
            console.log("Found url in response.data:", videoUrl);
          }
          
          if (videoUrl) {
            console.log("Setting finalVideoUrl to:", videoUrl);
            
            // Check if the URL is relative and convert to absolute if needed
            if (videoUrl.startsWith('/') && !videoUrl.startsWith('//')) {
              // If it's a relative URL starting with '/', make it absolute
              const baseUrl = window.location.origin;
              videoUrl = `${baseUrl}${videoUrl}`;
              console.log("Converted to absolute URL:", videoUrl);
            } else if (!videoUrl.startsWith('http://') && !videoUrl.startsWith('https://') && !videoUrl.startsWith('//')) {
              // If it doesn't have a protocol, assume http/https is missing
              videoUrl = `https://${videoUrl}`;
              console.log("Added https protocol to URL:", videoUrl);
            }
            
            setFinalVideoUrl(videoUrl);
          } else {
            console.warn("No video URL found in response:", response);
          }
        } else {
          console.warn("Invalid response structure:", response);
        }
        return response;
      }
    },
  ], [mothership, prompt]);

  // Generate session ID and start generation process on component mount
  useEffect(() => {
    const newSessionId = generationApi.generateSessionId();
    setSessionId(newSessionId);
    console.log("Generated new session ID:", newSessionId);
    
    // Start the generation process
    setIsGenerating(true);
  }, []);

  // Handle the API calls for each step
  useEffect(() => {
    if (!isGenerating || !sessionId || isComplete || currentStepIndex >= steps.length) {
      return;
    }

    const currentStep = steps[currentStepIndex];
    console.log(`Starting step ${currentStepIndex + 1}/${steps.length}: ${currentStep.name}`);
    
    // Set initial progress for this step
    const stepProgress = currentStepIndex * (100 / steps.length);
    setProgress(stepProgress);
    
    // Create interval to update progress while API call is in progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        // Update progress within the current step's range, but don't complete it yet
        const stepSize = 100 / steps.length;
        const currentStepStart = currentStepIndex * stepSize;
        const currentStepEnd = (currentStepIndex + 1) * stepSize;
        // Only go to 90% of the way to the next step until the API call is complete
        const maxForNow = currentStepEnd - (stepSize * 0.1);
        return Math.min(prev + 0.5, maxForNow);
      });
    }, 100);

    // Make the API call for this step
    const executeStep = async () => {
      try {
        const response = await currentStep.apiCall(sessionId);
        
        if (!response.success) {
          console.error(`Error in step ${currentStepIndex + 1} (${currentStep.name}):`, response.error);
          setError(`Error in ${currentStep.name}: ${response.error}`);
          clearInterval(progressInterval);
          return;
        }

        // Complete this step's progress
        const stepSize = 100 / steps.length;
        const currentStepEnd = (currentStepIndex + 1) * stepSize;
        setProgress(currentStepEnd);
        
        // Move to the next step
        if (currentStepIndex < steps.length - 1) {
          console.log(`Completed step ${currentStepIndex + 1}/${steps.length}. Moving to next step.`);
          setCurrentStepIndex(prevIndex => prevIndex + 1);
        } else {
          console.log("All steps completed. Generation process finished.");
          setIsComplete(true);
          if (onComplete) onComplete();
        }
      } catch (err) {
        console.error(`Exception in step ${currentStepIndex + 1} (${currentStep.name}):`, err);
        setError(`Exception in ${currentStep.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        clearInterval(progressInterval);
      }
    };

    executeStep();

    return () => {
      clearInterval(progressInterval);
    };
  }, [isGenerating, sessionId, currentStepIndex, steps, isComplete, onComplete]);

  // Function to handle creating another video
  const handleCreateAnother = () => {
    if (onReset) {
      onReset();
    }
  };

  // Function to handle retry if there's an error
  const handleRetry = () => {
    setError(null);
    setIsGenerating(true);
  };

  const currentStep = steps[currentStepIndex];

  return (
    <LoadingBackground>
      <div className={styles.processContainer}>
        <div className={styles.processContent}>
          {error ? (
            <>
              <h1 className={styles.title}>Error Occurred</h1>
              <p className={styles.errorMessage}>{error}</p>
              <div className={styles.actionButtons}>
                <button 
                  className={styles.actionButton}
                  onClick={handleRetry}
                >
                  Retry
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={handleCreateAnother}
                >
                  Start Over
                </button>
              </div>
            </>
          ) : isComplete ? (
            <>
              <h1 className={styles.title}>Your Video is Ready!</h1>
              <p className={styles.completionMessage}>
                Your video has been successfully generated and is ready to view. You can now play, 
                download, or share it directly from here.
              </p>
              
              <div className={styles.videoPlayer}>
                {finalVideoUrl ? (
                  <>
                    <video 
                      ref={videoRef}
                      width="100%" 
                      height="100%" 
                      src={finalVideoUrl}
                      controls
                      autoPlay
                      playsInline
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain' }}
                      className={styles.videoElement}
                    >
                      Your browser does not support the video tag.
                    </video>
                  </>
                ) : (
                  <div className={styles.videoPlaceholder}>
                    <p>Video URL not available</p>
                  </div>
                )}
              </div>
              
              <div className={styles.actionButtons}>
                <button className={styles.actionButton}>
                  <FiDownload /> Download
                </button>
                <button className={styles.actionButton}>
                  <FiShare2 /> Share
                </button>
                <button 
                  className={styles.actionButton}
                  onClick={handleCreateAnother}
                >
                  <FiPlus /> Create Another
                </button>
              </div>
            </>
          ) : (
            <>
              <h1 className={styles.title}>Creating Your Video...</h1>

              <div className={styles.progressContainer}>
                <div 
                  className={styles.progressBar} 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>

              <div className={styles.stepInfo}>
                <div className={styles.stepIcon}>
                  {currentStep.icon}
                </div>
                <h2 className={styles.stepName}>{currentStep.name}</h2>
                <p className={styles.stepDescription}>{currentStep.description}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </LoadingBackground>
  );
};

export default GenerationProcess; 