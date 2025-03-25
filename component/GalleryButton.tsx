import React from 'react';
import { motion } from 'framer-motion';
import { FiImage } from 'react-icons/fi';
import { useRouter } from 'next/navigation';
import styles from './GalleryButton.module.css';

const GalleryButton: React.FC = () => {
  const router = useRouter();

  const handleClick = () => {
    router.push('/gallery');
  };

  return (
    <motion.button
      className={styles.galleryButton}
      onClick={handleClick}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ 
        scale: 1.05,
        boxShadow: '0 0 25px rgba(120, 120, 255, 0.5)'
      }}
      whileTap={{ scale: 0.98 }}
      transition={{ 
        type: "spring", 
        stiffness: 400, 
        damping: 15 
      }}
    >
      <div className={styles.buttonContent}>
        <FiImage className={styles.galleryIcon} />
        <span className={styles.galleryText}>Gallery</span>
      </div>
      <div className={styles.glow}></div>
      <div className={styles.stars}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`${styles.star} ${styles[`star${i + 1}`]}`}></div>
        ))}
      </div>
    </motion.button>
  );
};

export default GalleryButton; 