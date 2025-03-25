'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiVideo } from 'react-icons/fi';
import styles from './Gallery.module.css';

interface AddVideoButtonProps {
  onClick: () => void;
}

const AddVideoButton: React.FC<AddVideoButtonProps> = ({ onClick }) => {
  return (
    <div className={styles.addVideoButtonContainer}>
      <motion.button 
        className={styles.addVideoButton} 
        onClick={onClick}
        aria-label="Add new video"
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 17, 
          delay: 0.4 
        }}
        whileHover={{ y: -4, boxShadow: "0 8px 20px rgba(99, 102, 241, 0.4)" }}
        whileTap={{ scale: 0.97 }}
      >
        <FiVideo size={18} />
        <span>Add Video</span>
        <FiPlus size={16} style={{ marginLeft: '4px' }} />
      </motion.button>
    </div>
  );
};

export default AddVideoButton; 