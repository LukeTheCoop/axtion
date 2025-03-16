import React, { useEffect, useState } from 'react';
import styles from './SaveNotification.module.css';

interface SaveNotificationProps {
  show: boolean;
  message?: string;
  onComplete?: () => void;
}

const SaveNotification: React.FC<SaveNotificationProps> = ({
  show,
  message = 'Changes saved successfully',
  onComplete
}) => {
  const [visible, setVisible] = useState(false);
  const [animationState, setAnimationState] = useState<'entering' | 'visible' | 'exiting' | 'hidden'>('hidden');
  
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    if (show && animationState === 'hidden') {
      // Start showing the notification
      setVisible(true);
      setAnimationState('entering');
      
      // After entering animation completes, set to visible
      timeoutId = setTimeout(() => {
        setAnimationState('visible');
        
        // Schedule the exit animation
        timeoutId = setTimeout(() => {
          setAnimationState('exiting');
          
          // After exit animation, hide completely
          timeoutId = setTimeout(() => {
            setAnimationState('hidden');
            setVisible(false);
            if (onComplete) onComplete();
          }, 500); // Exit animation duration
        }, 2000); // How long to stay visible
      }, 300); // Enter animation duration
    }
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [show, onComplete, animationState]);
  
  if (!visible) return null;
  
  return (
    <div 
      className={`${styles.saveNotification} ${styles[animationState]}`}
      aria-live="polite"
    >
      <div className={styles.saveIcon}>
        <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path 
            d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" 
            fill="currentColor" 
          />
        </svg>
      </div>
      <div className={styles.saveMessage}>{message}</div>
    </div>
  );
};

export default SaveNotification; 