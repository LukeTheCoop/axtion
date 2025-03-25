'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiChevronLeft, FiChevronRight, FiLoader, FiTarget, FiCheck, FiYoutube } from 'react-icons/fi';
import styles from './Gallery.module.css';

interface Short {
  id: string;
  title: string;
  thumbnail: string;
  url: string;
}

interface ChannelShortsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectShort: (shortUrl: string) => void;
}

const ChannelShortsModal: React.FC<ChannelShortsModalProps> = ({
  isOpen,
  onClose,
  onSelectShort,
}) => {
  const [channelUrl, setChannelUrl] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [shorts, setShorts] = useState<Short[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [fetchSuccess, setFetchSuccess] = useState(false);
  const [apiError, setApiError] = useState('');

  // Modal animations (simpler version for performance)
  const modal = {
    hidden: { opacity: 0, x: 10, scale: 0.98 },
    visible: { 
      opacity: 1, 
      x: 0, 
      scale: 1,
      transition: { duration: 0.25 } 
    },
    exit: { 
      opacity: 0, 
      x: 10, 
      scale: 0.98,
      transition: { duration: 0.2 }
    }
  };

  const extractChannelIdOrUsername = (url: string): { type: string, value: string } | null => {
    // Extract channel ID from URL
    const channelIdMatch = url.match(/youtube\.com\/channel\/([^\/\?]+)/);
    if (channelIdMatch && channelIdMatch[1]) {
      return { type: 'id', value: channelIdMatch[1] };
    }

    // Extract username from URL
    const usernameMatch = url.match(/youtube\.com\/c\/([^\/\?]+)/);
    if (usernameMatch && usernameMatch[1]) {
      return { type: 'username', value: usernameMatch[1] };
    }

    // Extract handle from URL
    const handleMatch = url.match(/youtube\.com\/@([^\/\?]+)/);
    if (handleMatch && handleMatch[1]) {
      return { type: 'handle', value: handleMatch[1] };
    }

    return null;
  };

  // Function to fetch shorts from YouTube API
  const fetchShortsFromChannel = async (channelUrl: string): Promise<Short[]> => {
    try {
      const channelInfo = extractChannelIdOrUsername(channelUrl);
      if (!channelInfo) {
        throw new Error('Could not extract channel information from URL');
      }

      // Here we'd make a real API call to YouTube Data API v3
      // This requires an API key and proper integration
      // For now, simulate the API call but show different sample data based on the channel
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // In a real implementation, you would:
      // 1. Make an API call to get the channel's uploads or shorts
      // 2. Format the response to match the Short interface
      // 3. Return the actual shorts from the channel

      const channelValue = channelInfo.value;
      // Generate shorts based on the channel identifier to simulate different results
      const shortCount = Math.floor(Math.random() * 5) + 3; // 3-7 shorts
      
      return Array.from({ length: shortCount }, (_, i) => ({
        id: `${channelValue}-${i + 1}`,
        title: `${channelValue}'s Short #${i + 1}`,
        thumbnail: `https://picsum.photos/id/${(i + 1) * 10}/720/1280`,
        url: `https://youtube.com/shorts/${channelValue}-short-${i + 1}`
      }));
    } catch (error) {
      console.error('Error in fetchShortsFromChannel:', error);
      throw error;
    }
  };

  const validateChannelUrl = (url: string) => {
    // Basic validation for YouTube channel URL
    return url.trim() !== '' && (
      url.includes('youtube.com/channel/') || 
      url.includes('youtube.com/@') ||
      url.includes('youtube.com/c/')
    );
  };

  const handleFetchShorts = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateChannelUrl(channelUrl)) {
      setUrlError('Please enter a valid YouTube channel URL');
      return;
    }
    
    setIsLoading(true);
    setUrlError('');
    setApiError('');
    
    try {
      const fetchedShorts = await fetchShortsFromChannel(channelUrl);
      if (fetchedShorts.length === 0) {
        setApiError('No shorts found for this channel');
      } else {
        setShorts(fetchedShorts);
        setCurrentIndex(0);
        setFetchSuccess(true);
      }
    } catch (error) {
      console.error('Error fetching shorts:', error);
      setApiError('Failed to fetch shorts. The YouTube API may be unavailable or the channel does not exist.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrevious = () => {
    setCurrentIndex(prev => (prev > 0 ? prev - 1 : shorts.length - 1));
  };

  const handleNext = () => {
    setCurrentIndex(prev => (prev < shorts.length - 1 ? prev + 1 : 0));
  };

  const handleSelectShort = () => {
    if (shorts.length > 0) {
      onSelectShort(shorts[currentIndex].url);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={`${styles.modalContent} ${styles.enhancedModal} ${styles.shortsModal}`}
          variants={modal}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={styles.modalDecoration}>
            <div className={styles.modalGlow}></div>
          </div>
          
          <div className={styles.modalHeader}>
            <div className={styles.modalTitleGroup}>
              <FiYoutube className={styles.modalIcon} />
              <div>
                <h2 className={styles.modalTitle}>
                  Browse Channel Shorts
                </h2>
                <p className={styles.modalDescription}>
                  Browse and select shorts from a YouTube channel
                </p>
              </div>
            </div>
          </div>
          
          <form className={styles.modalForm} onSubmit={handleFetchShorts}>
            <div className={styles.formGroup}>
              <label htmlFor="channelUrl" className={styles.formLabel}>
                <FiYoutube size={16} />
                YouTube Channel URL
              </label>
              <input
                id="channelUrl"
                type="text"
                className={styles.formInput}
                value={channelUrl}
                onChange={(e) => {
                  setChannelUrl(e.target.value);
                  if (urlError) setUrlError('');
                }}
                placeholder="https://youtube.com/@channel or https://youtube.com/c/channel"
                required
                disabled={isLoading}
              />
              <AnimatePresence>
                {(urlError || apiError) && (
                  <motion.p 
                    className={styles.urlErrorMessage}
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <FiAlertCircle size={14} />
                    {urlError || apiError}
                  </motion.p>
                )}
              </AnimatePresence>
            </div>
            
            <button 
              type="submit" 
              className={`${styles.submitButton} ${fetchSuccess ? styles.successButton : ''}`}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <FiLoader size={16} className={styles.spinningLoader} />
                  Fetching Shorts...
                </>
              ) : fetchSuccess ? (
                <>
                  <FiCheck size={16} />
                  Shorts Loaded
                </>
              ) : (
                <>
                  <FiYoutube size={16} />
                  Fetch Shorts
                </>
              )}
            </button>
          </form>

          {shorts.length > 0 && (
            <div className={styles.shortsSlideshow}>
              <div className={styles.shortsNavigation}>
                <button 
                  className={styles.slideshowButton} 
                  onClick={handlePrevious}
                  aria-label="Previous short"
                >
                  <FiChevronLeft size={18} />
                </button>
                <div className={styles.paginationInfo}>
                  <span className={styles.pageIndicator}>
                    {currentIndex + 1} / {shorts.length}
                  </span>
                </div>
                <button 
                  className={styles.slideshowButton} 
                  onClick={handleNext}
                  aria-label="Next short"
                >
                  <FiChevronRight size={18} />
                </button>
              </div>
              
              <div className={styles.shortsSlide}>
                <img 
                  src={shorts[currentIndex].thumbnail} 
                  alt={shorts[currentIndex].title}
                  className={styles.shortsThumbnail}
                />
                <h3 className={styles.shortsTitle}>{shorts[currentIndex].title}</h3>
                <button 
                  className={`${styles.selectShortButton} ${styles.submitButton}`}
                  onClick={handleSelectShort}
                >
                  <FiTarget size={16} />
                  Select This Short
                </button>
              </div>
            </div>
          )}

          {fetchSuccess && shorts.length === 0 && (
            <div className={styles.emptyShorts}>
              <FiAlertCircle size={24} />
              <p>No shorts found for this channel</p>
            </div>
          )}

          <div className={styles.apiNote}>
            <p>Note: For a complete implementation, you'll need to integrate with the YouTube Data API v3.</p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChannelShortsModal; 