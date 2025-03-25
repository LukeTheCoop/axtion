'use client';

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { FiTrash2, FiTag } from 'react-icons/fi';
import styles from './Gallery.module.css';

interface VideoCardProps {
  id: string;
  title: string;
  thumbnailUrl: string;
  genre: string;
  description?: string;
  onDelete: (id: string) => void;
}

const VideoCard: React.FC<VideoCardProps> = ({
  id,
  title,
  thumbnailUrl,
  genre,
  description,
  onDelete,
}) => {
  // Format the title by removing the genre prefix and replacing underscores with spaces
  const formatTitle = () => {
    // Remove genre prefix if it exists
    let formattedTitle = title;
    if (title.startsWith(`${genre}_`)) {
      formattedTitle = title.substring(genre.length + 1);
    }
    
    // Replace underscores with spaces and capitalize each word
    return formattedTitle
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <motion.div 
      className={styles.videoCard}
      layout
    >
      <div className={styles.videoThumbnail}>
        <div className={styles.genreBadge}>
          <FiTag size={10} style={{ marginRight: '4px' }} />
          {genre}
        </div>
        <Image 
          src={thumbnailUrl} 
          alt={formatTitle()} 
          width={640} 
          height={360} 
          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
          priority={id.includes('-0') || id.includes('-1') || id.includes('-2')} // Only prioritize the first few images
          loading={id.includes('-0') || id.includes('-1') || id.includes('-2') ? 'eager' : 'lazy'}
          quality={75}
          placeholder="blur"
          blurDataURL="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjM2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjAyMDIwIi8+PC9zdmc+"
        />
      </div>
      <div className={styles.videoInfo}>
        <motion.h3 
          className={styles.videoTitle}
        >
          {formatTitle()}
        </motion.h3>
        {description && (
          <motion.p 
            className={styles.videoDescription}
          >
            {description}
          </motion.p>
        )}
        <motion.button 
          className={styles.deleteButton} 
          onClick={() => onDelete(id)}
          aria-label={`Delete ${formatTitle()}`}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FiTrash2 size={16} />
          <span>Delete</span>
        </motion.button>
      </div>
    </motion.div>
  );
};

export default VideoCard; 