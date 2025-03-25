'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiAlertCircle, FiCheck, FiX, FiYoutube, FiMessageSquare, FiVideo } from 'react-icons/fi';
import styles from './Gallery.module.css';

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (videoUrl: string, description: string, keepModalOpen: boolean) => void;
  selectedGenre: string;
}

const AddVideoModal: React.FC<AddVideoModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  selectedGenre,
}) => {
  const [videoUrl, setVideoUrl] = useState('');
  const [description, setDescription] = useState('');
  const [urlError, setUrlError] = useState('');
  const [isRendered, setIsRendered] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  // Persist modal state in localStorage when open/closed
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    if (isOpen) {
      localStorage.setItem('videoModalOpen', 'true');
    } else {
      localStorage.removeItem('videoModalOpen');
    }
  }, [isOpen]);

  // On page load, check if modal should be open
  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const shouldBeOpen = localStorage.getItem('videoModalOpen') === 'true';
    if (shouldBeOpen && !isOpen) {
      // Tell parent to open modal without calling onClose
      const timer = setTimeout(() => {
        document.dispatchEvent(new Event('reopenVideoModal'));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Improve performance by delaying full rendering until modal is opened
  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure the modal actually appears before heavy animations
      const timer = setTimeout(() => {
        setIsRendered(true);
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsRendered(false);
      setShowSuccessToast(false);
    }
  }, [isOpen]);

  const validateYoutubeUrl = (url: string) => {
    // Basic validation for YouTube video URL
    return url.trim() !== '' && (
      url.includes('youtube.com/shorts/') || 
      url.includes('youtube.com/watch') ||
      url.includes('youtu.be/')
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateYoutubeUrl(videoUrl)) {
      setUrlError('Please enter a valid YouTube URL');
      return;
    }
    
    // Pass true to indicate modal is staying open
    onSubmit(videoUrl, description, true);
    
    // Show success toast
    setShowSuccessToast(true);
    
    // Hide toast after 3 seconds
    setTimeout(() => setShowSuccessToast(false), 3000);
    
    // Reset form immediately
    resetForm();
  };

  const resetForm = () => {
    setVideoUrl('');
    setDescription('');
    setUrlError('');
  };

  // Simpler, lighter animation variants
  const backdrop = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.15 } }
  };

  const modal = {
    hidden: { opacity: 0, y: 10, scale: 0.98 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { duration: 0.25 } 
    },
    exit: { 
      opacity: 0, 
      y: 10, 
      scale: 0.98,
      transition: { duration: 0.2 }
    }
  };

  const toast = {
    hidden: { opacity: 0, y: -30, height: 0 },
    visible: { 
      opacity: 1, 
      y: 0, 
      height: 'auto',
      transition: { 
        type: 'spring', 
        stiffness: 400, 
        damping: 30,
        duration: 0.5 
      } 
    },
    exit: { 
      opacity: 0, 
      y: -30, 
      height: 0,
      transition: { 
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className={styles.modalOverlay} 
          onClick={onClose}
          variants={backdrop}
          initial="hidden"
          animate="visible"
          exit="exit"
        >
          <div className={styles.modalContainer} onClick={(e) => e.stopPropagation()}>
            <motion.div 
              className={`${styles.modalContent} ${styles.enhancedModal}`}
              variants={modal}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className={styles.modalHeader}>
                <div className={styles.modalTitleGroup}>
                  <FiVideo className={styles.modalIcon} />
                  <div>
                    <h2 className={styles.modalTitle}>
                      Add New Video
                    </h2>
                    <p className={styles.modalDescription}>
                      Add a new video to the <span className={styles.genreHighlight}>{selectedGenre}</span> genre
                    </p>
                  </div>
                </div>
                <button
                  className={styles.closeModalButton}
                  onClick={onClose}
                >
                  <FiX size={18} />
                </button>
              </div>
              
              <AnimatePresence>
                {showSuccessToast && (
                  <motion.div 
                    className={styles.successToast}
                    variants={toast}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                  >
                    <FiCheck size={16} />
                    Video added to queue
                  </motion.div>
                )}
              </AnimatePresence>
              
              {isRendered && (
                <form className={styles.modalForm} onSubmit={handleSubmit}>
                  <div className={styles.formGroup}>
                    <label htmlFor="videoUrl" className={styles.formLabel}>
                      <FiYoutube size={16} />
                      YouTube URL
                    </label>
                    <input
                      id="videoUrl"
                      type="text"
                      className={styles.formInput}
                      value={videoUrl}
                      onChange={(e) => {
                        setVideoUrl(e.target.value);
                        if (urlError) setUrlError('');
                      }}
                      placeholder="https://youtube.com/shorts/... or https://youtu.be/..."
                      required
                    />
                    <AnimatePresence>
                      {urlError && (
                        <motion.p 
                          className={styles.urlErrorMessage}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                        >
                          <FiAlertCircle size={14} />
                          {urlError}
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="description" className={styles.formLabel}>
                      <FiMessageSquare size={16} />
                      Description
                    </label>
                    <textarea
                      id="description"
                      className={styles.formTextarea}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe what happens in this video..."
                      required
                    />
                  </div>
                  
                  <div className={styles.modalActions}>
                    <button 
                      type="button" 
                      className={styles.cancelButton} 
                      onClick={() => {
                        resetForm();
                        // When closing, use false to allow refresh
                        onSubmit('', '', false);
                        onClose();
                      }}
                    >
                      <FiX size={16} />
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className={styles.submitButton}
                    >
                      <FiCheck size={16} />
                      Add Video
                    </button>
                  </div>
                </form>
              )}
              
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AddVideoModal; 