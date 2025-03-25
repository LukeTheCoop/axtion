'use client';

import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import VideoCard from './VideoCard';
import { FiFilm, FiLoader } from 'react-icons/fi';
import styles from './Gallery.module.css';

export interface VideoData {
  id: string;
  title: string;
  thumbnailUrl: string;
  genre: string;
  description?: string;
}

interface VideoGalleryProps {
  videos: VideoData[];
  selectedGenre: string;
  onDeleteVideo: (id: string) => void;
  isLoading?: boolean;
}

const VideoGallery: React.FC<VideoGalleryProps> = ({
  videos,
  selectedGenre,
  onDeleteVideo,
  isLoading = false,
}) => {
  const [visibleVideos, setVisibleVideos] = useState<VideoData[]>(videos);
  const [localLoading, setLocalLoading] = useState(false); // Changed to false for initial load
  const prevLoadingRef = useRef(isLoading);
  const prevVideosRef = useRef(videos);
  const isInitialLoad = useRef(true);
  
  useEffect(() => {
    // Skip loading state on initial load
    if (isInitialLoad.current) {
      setVisibleVideos(videos);
      isInitialLoad.current = false;
      return;
    }
    
    // Only show loading state when actively changing pages/genres
    if (videos !== prevVideosRef.current || isLoading !== prevLoadingRef.current) {
      // Only show loading if we're not on the initial load
      setLocalLoading(isLoading);
      
      // Use a shorter delay for smoother transitions
      const timer = setTimeout(() => {
        setVisibleVideos(videos);
        setLocalLoading(false);
      }, 150);
      
      prevVideosRef.current = videos;
      prevLoadingRef.current = isLoading;
      
      return () => clearTimeout(timer);
    }
  }, [videos, selectedGenre, isLoading]);

  // Combined loading state (either from props or local)
  const showLoading = isLoading && localLoading && !isInitialLoad.current;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.04,
        delayChildren: 0.05
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1
      }
    }
  };

  const item = {
    hidden: { y: 15, opacity: 0 },
    show: { y: 0, opacity: 1 },
    exit: { y: -15, opacity: 0 }
  };

  if (videos.length === 0) {
    return (
      <motion.div 
        className={styles.videoGrid}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
      >
        <motion.div 
          className={styles.emptyState}
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <motion.div 
            initial={{ y: 10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <FiFilm size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
            <p>No videos found in the <b>{selectedGenre}</b> genre.</p>
            <p>Click the Add Video button to get started.</p>
          </motion.div>
        </motion.div>
      </motion.div>
    );
  }

  // Don't show loading animation if it's the initial load
  if (showLoading && !isInitialLoad.current) {
    return (
      <div className={styles.loadingContainer}>
        <div className={styles.swirlLoader}>
          <div className={styles.swirlCircle}></div>
          <div className={styles.swirlCircle}></div>
          <div className={styles.swirlCircle}></div>
          <div className={styles.swirlCircle}></div>
          <div className={styles.swirlCircle}></div>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className={styles.videoGrid}
      key={`grid-${selectedGenre}-${visibleVideos.length}`}
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
      layout
    >
      <AnimatePresence mode="wait">
        {visibleVideos.map((video, index) => (
          <motion.div 
            key={video.id} 
            variants={item} 
            layout
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 24
            }}
          >
            <VideoCard
              id={video.id}
              title={video.title}
              thumbnailUrl={video.thumbnailUrl}
              genre={video.genre}
              description={video.description}
              onDelete={onDeleteVideo}
            />
          </motion.div>
        ))}
      </AnimatePresence>
    </motion.div>
  );
};

export default VideoGallery; 