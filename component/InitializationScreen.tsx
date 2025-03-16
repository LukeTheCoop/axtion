import React, { useState, useEffect } from 'react';
import styles from './InitializationScreen.module.css';

interface InitializationScreenProps {
  onComplete?: () => void;
  appName?: string;
}

export default function InitializationScreen({ 
  onComplete, 
  appName = "APP NAME" 
}: InitializationScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isInitializing, setIsInitializing] = useState(true);

  // Simulate loading process with artificial progress
  useEffect(() => {
    if (!isInitializing) return;

    const loadingSteps = [
      { progress: 20, delay: 400, message: 'Connecting to API...' },
      { progress: 40, delay: 500, message: 'Loading voice options...' },
      { progress: 60, delay: 600, message: 'Loading settings from backend...' },
      { progress: 80, delay: 500, message: 'Loading user preferences...' },
      { progress: 100, delay: 400, message: 'Finishing up...' }
    ];

    let stepIndex = 0;

    const simulateLoading = async () => {
      for (const step of loadingSteps) {
        await new Promise(resolve => {
          setTimeout(() => {
            setProgress(step.progress);
            resolve(null);
          }, step.delay);
        });
      }

      // Complete initialization with a slight delay for animations
      setTimeout(() => {
        setIsInitializing(false);
        if (onComplete) {
          onComplete();
        }
      }, 400);
    };

    simulateLoading();
  }, [isInitializing, onComplete]);

  return (
    <div className={styles.dashboardContainer}>
      <div className={styles.immersiveLoading}>
        <div className={styles.loadingBackground}>
          {/* Add animated floating background elements */}
          <div className={styles.floatingElements}>
            <div className={styles.floatingCircle}></div>
            <div className={styles.floatingCircle}></div>
            <div className={styles.floatingCircle}></div>
            <div className={styles.floatingCircle}></div>
            <div className={styles.floatingLine}></div>
            <div className={styles.floatingLine}></div>
            <div className={styles.floatingLine}></div>
            <div className={styles.glowDot}></div>
            <div className={styles.glowDot}></div>
            <div className={styles.glowDot}></div>
            <div className={styles.glowDot}></div>
            <div className={styles.glowDot}></div>
            <div className={styles.particle}></div>
            <div className={styles.particle}></div>
            <div className={styles.particle}></div>
            <div className={styles.particle}></div>
            <div className={styles.particle}></div>
            <div className={styles.particle}></div>
            <div className={styles.particle}></div>
            <div className={styles.particle}></div>
          </div>
          <div className={styles.lightRays}></div>
          
          <div className={styles.loadingCentral}>
            {/* Enhanced central loading animation */}
            <div className={styles.loadingLogo}>{appName}</div>
            
            {/* API connection visualization */}
            <div className={styles.connectionVisualization}>
              <div className={styles.serverNode}>
                <div className={styles.nodeLabel}>Client</div>
                <div className={styles.nodePulse}></div>
              </div>
              
              <div className={styles.dataPackets}>
                {[...Array(5)].map((_, i) => (
                  <div 
                    key={i} 
                    className={`${styles.dataPacket} ${progress >= 20 ? styles.active : ''}`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                  ></div>
                ))}
              </div>
              
              <div className={styles.serverNode}>
                <div className={styles.nodeLabel}>API</div>
                <div className={`${styles.nodePulse} ${progress >= 30 ? styles.active : ''}`}></div>
              </div>
            </div>
            
            {/* Progress ring with percentage */}
            <div className={styles.progressRingContainer}>
              <svg className={styles.progressRing} width="120" height="120" viewBox="0 0 120 120">
                <circle
                  className={styles.progressRingBackground}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  strokeWidth="8"
                />
                <circle
                  className={styles.progressRingCircle}
                  cx="60"
                  cy="60"
                  r="50"
                  fill="none"
                  strokeWidth="8"
                  strokeDasharray="314"
                  strokeDashoffset={314 - (314 * progress) / 100}
                  transform="rotate(-90 60 60)"
                />
              </svg>
              <div className={styles.progressPercentage}>{progress}%</div>
            </div>
            
            {/* Loading stages with enhanced visual states */}
            <div className={styles.loadingStagesContainer}>
              <div className={styles.loadingStages}>
                <div 
                  className={`${styles.loadingStage} ${
                    progress >= 20 ? 
                      progress >= 40 ? styles.loadingStageDone : styles.loadingStageActive 
                      : ''
                  }`}
                >
                  <div className={styles.stageIcon}>
                    {progress >= 40 ? '✓' : '⟳'}
                  </div>
                  <div className={styles.stageContent}>
                    <div className={styles.stageName}>API Connection</div>
                    <div className={styles.stageDetail}>
                      {progress < 20 ? 'Waiting...' : 
                       progress < 40 ? 'Connecting to server...' : 
                       'Connected!'}
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`${styles.loadingStage} ${
                    progress >= 40 ? 
                      progress >= 60 ? styles.loadingStageDone : styles.loadingStageActive 
                      : ''
                  }`}
                >
                  <div className={styles.stageIcon}>
                    {progress >= 60 ? '✓' : '⟳'}
                  </div>
                  <div className={styles.stageContent}>
                    <div className={styles.stageName}>Configuration</div>
                    <div className={styles.stageDetail}>
                      {progress < 40 ? 'Waiting...' : 
                       progress < 60 ? 'Loading options...' : 
                       'Loaded!'}
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`${styles.loadingStage} ${
                    progress >= 60 ? 
                      progress >= 80 ? styles.loadingStageDone : styles.loadingStageActive 
                      : ''
                  }`}
                >
                  <div className={styles.stageIcon}>
                    {progress >= 80 ? '✓' : '⟳'}
                  </div>
                  <div className={styles.stageContent}>
                    <div className={styles.stageName}>Backend Settings</div>
                    <div className={styles.stageDetail}>
                      {progress < 60 ? 'Waiting...' : 
                       progress < 80 ? 'Retrieving settings...' : 
                       'Retrieved!'}
                    </div>
                  </div>
                </div>
                
                <div 
                  className={`${styles.loadingStage} ${
                    progress >= 80 ? 
                      progress >= 100 ? styles.loadingStageDone : styles.loadingStageActive 
                      : ''
                  }`}
                >
                  <div className={styles.stageIcon}>
                    {progress >= 100 ? '✓' : '⟳'}
                  </div>
                  <div className={styles.stageContent}>
                    <div className={styles.stageName}>User Preferences</div>
                    <div className={styles.stageDetail}>
                      {progress < 80 ? 'Waiting...' : 
                       progress < 100 ? 'Loading preferences...' : 
                       'Complete!'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Final loading message */}
            {progress >= 100 && (
              <div className={styles.launchingMessage}>
                <div className={styles.spinnerDots}>
                  <div className={styles.spinnerDot}></div>
                  <div className={styles.spinnerDot}></div>
                  <div className={styles.spinnerDot}></div>
                </div>
                <div className={styles.spinnerText}>Launching {appName}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 