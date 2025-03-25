'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiPlus, FiCheck, FiInfo, FiFilm, FiX, FiTag, FiTrash2, FiLoader, FiAlertTriangle } from 'react-icons/fi';
import { useConfig } from '../../hooks/useConfig';
import styles from './Gallery.module.css';

interface GenreSelectorProps {
  genres: string[];
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
  onAddGenre: (genre: string) => void;
}

const GenreSelector: React.FC<GenreSelectorProps> = ({
  genres,
  selectedGenre: propSelectedGenre,
  onSelectGenre,
  onAddGenre,
}) => {
  const { genre: configGenre, isLoading: configLoading, setGenre } = useConfig();
  const [showInput, setShowInput] = useState(false);
  const [newGenre, setNewGenre] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [hoveredGenre, setHoveredGenre] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [genreToDelete, setGenreToDelete] = useState<string>('');
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  
  // Use the last used genre from config if available
  const selectedGenre = propSelectedGenre || configGenre || 'military';
  
  // Only update selected genre from config on initial load, not on every config change
  useEffect(() => {
    if (!configLoading && configGenre && configGenre !== propSelectedGenre) {
      // If the config has loaded and has a genre that's different from the current selection
      onSelectGenre(configGenre);
    }
  }, [configLoading]); // Only depend on configLoading to run just once when loading completes

  // Handle genre selection and update config
  const handleGenreSelect = (genre: string) => {
    onSelectGenre(genre);
    // Update the config with the new genre
    setGenre(genre);
    // Force refresh to load new genre
    window.location.reload();
  };

  const handleAddGenreClick = () => {
    setShowInput(true);
    setShowTooltip(true);
    setTimeout(() => setShowTooltip(false), 5000); // Hide tooltip after 5 seconds
  };

  const handleInputBlur = () => {
    if (newGenre.trim() === '') {
      setShowInput(false);
      setShowTooltip(false);
      return;
    }

    // Check if genre name is valid (one word, no spaces)
    if (newGenre.trim().indexOf(' ') === -1) {
      const trimmedGenre = newGenre.trim().toLowerCase();
      onAddGenre(trimmedGenre);
      setGenre(trimmedGenre); // Update config when adding new genre
      setNewGenre('');
      setShowInput(false);
      setShowTooltip(false);
      // Force refresh to load new genre
      window.location.reload();
    }
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (newGenre.trim() === '') {
        setShowInput(false);
        setShowTooltip(false);
        return;
      }

      // Check if genre name is valid (one word, no spaces)
      if (newGenre.trim().indexOf(' ') === -1) {
        const trimmedGenre = newGenre.trim().toLowerCase();
        onAddGenre(trimmedGenre);
        setGenre(trimmedGenre); // Update config when adding new genre
        setNewGenre('');
        setShowInput(false);
        setShowTooltip(false);
        // Force refresh to load new genre
        window.location.reload();
      }
    } else if (e.key === 'Escape') {
      setNewGenre('');
      setShowInput(false);
      setShowTooltip(false);
    }
  };

  const handleCancelInput = () => {
    setNewGenre('');
    setShowInput(false);
    setShowTooltip(false);
  };

  const handleDeleteClick = (e: React.MouseEvent, genre: string) => {
    e.stopPropagation(); // Prevent triggering the parent button's onClick
    
    // Don't allow deleting the currently selected genre
    if (genre === selectedGenre) {
      return;
    }
    
    setGenreToDelete(genre);
    setDeleteConfirmText('');
    setShowDeleteConfirm(true);
  };

  const handleDeleteGenre = async () => {
    if (deleteConfirmText !== 'delete') {
      return;
    }
    
    try {
      const response = await fetch(`http://0.0.0.0:8000/api/genres/delete?genre=${genreToDelete.toLowerCase()}`, {
        method: 'POST',
        headers: {
          'accept': 'application/json'
        },
        body: '' // Empty body
      });

      if (response.ok) {
        // Close modal and reset
        setShowDeleteConfirm(false);
        setGenreToDelete('');
        setDeleteConfirmText('');
        // Handle successful deletion by refreshing
        window.location.reload();
      } else {
        console.error('Failed to delete genre');
      }
    } catch (error) {
      console.error('Error deleting genre:', error);
    }
  };

  // If config is still loading, show a loading state
  if (configLoading && !propSelectedGenre) {
    return (
      <motion.div 
        className={styles.genreSelector}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className={styles.genreTitle}>
          <FiFilm style={{ display: 'inline', marginRight: '8px' }} />
          Categories
        </div>
        <div className={styles.genreSelectorLoading}>
          <FiLoader className={styles.spinningLoader} />
          <span>Loading categories...</span>
        </div>
      </motion.div>
    );
  }

  return (
    <>
      <motion.div 
        className={styles.genreSelector}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ 
          type: "spring", 
          stiffness: 400, 
          damping: 20, 
          delay: 0.2 
        }}
      >
        <div className={styles.genreTitle}>
          <FiFilm style={{ display: 'inline', marginRight: '8px' }} />
          Categories
        </div>
        <div className={styles.genreOptions}>
          {genres.map((genre, index) => (
            <motion.button
              key={genre}
              className={`${styles.genreOption} ${
                selectedGenre === genre ? styles.genreOptionActive : ''
              }`}
              onClick={() => handleGenreSelect(genre)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + index * 0.05 }}
              whileHover={{ y: -2, boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1)" }}
              whileTap={{ scale: 0.97 }}
              onMouseEnter={() => setHoveredGenre(genre)}
              onMouseLeave={() => setHoveredGenre(null)}
            >
              {selectedGenre === genre ? (
                <FiCheck style={{ fontSize: '14px' }} />
              ) : hoveredGenre === genre && genre !== 'military' ? (
                <FiTrash2 
                  style={{ fontSize: '14px', color: 'var(--color-danger)' }} 
                  onClick={(e) => handleDeleteClick(e, genre)}
                />
              ) : (
                <FiTag style={{ fontSize: '14px' }} />
              )}
              {genre.charAt(0).toUpperCase() + genre.slice(1)}
            </motion.button>
          ))}
          <AnimatePresence>
            {showInput ? (
              <motion.div 
                className={styles.genreInputContainer}
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className={styles.genreInputWrapper}>
                  <input
                    type="text"
                    className={styles.genreInput}
                    value={newGenre}
                    onChange={(e) => setNewGenre(e.target.value)}
                    onBlur={handleInputBlur}
                    onKeyDown={handleInputKeyDown}
                    placeholder="New category name"
                    autoFocus
                  />
                  <button 
                    className={styles.cancelInputButton}
                    onClick={handleCancelInput}
                    aria-label="Cancel"
                  >
                    <FiX />
                  </button>
                </div>
                <AnimatePresence>
                  {showTooltip && (
                    <motion.div 
                      className={styles.genreInputTooltip}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 5 }}
                    >
                      <FiInfo style={{ marginRight: '4px', color: 'var(--color-primary)' }} />
                      Category name should be one word and concise
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ) : (
              <motion.button
                className={styles.addGenreButton}
                onClick={handleAddGenreClick}
                aria-label="Add new category"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ backgroundColor: 'var(--color-accent-dark)', color: 'white' }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                <FiPlus />
                <span>Add Category</span>
              </motion.button>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <motion.div 
            className={styles.modalOverlay}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className={styles.deleteModal}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 500 }}
            >
              <div className={styles.deleteModalHeader}>
                <FiAlertTriangle size={24} color="var(--color-danger)" />
                <h3>Delete Category</h3>
              </div>
              
              <div className={styles.deleteModalContent}>
                <p className={styles.deleteWarning}>
                  Are you sure you want to delete the category <strong>{genreToDelete}</strong>?
                </p>
                <p className={styles.deleteWarningDetails}>
                  This action <strong>cannot be undone</strong> and will permanently delete the category and <strong>clear all associated videos</strong>.
                </p>
                
                <div className={styles.deleteConfirmInput}>
                  <label htmlFor="deleteConfirm">Type <strong>delete</strong> to confirm:</label>
                  <input
                    id="deleteConfirm"
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="delete"
                    autoFocus
                  />
                </div>
              </div>
              
              <div className={styles.deleteModalActions}>
                <button
                  className={styles.cancelButton}
                  onClick={() => setShowDeleteConfirm(false)}
                >
                  Cancel
                </button>
                <button
                  className={`${styles.deleteButton} ${deleteConfirmText === 'delete' ? styles.deleteButtonEnabled : ''}`}
                  onClick={handleDeleteGenre}
                  disabled={deleteConfirmText !== 'delete'}
                >
                  Delete Forever
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default GenreSelector; 