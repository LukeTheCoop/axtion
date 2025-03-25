import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiCheck, FiTag } from 'react-icons/fi';
import { getGenres } from '../lib/services/galleryService';
import { useConfig } from '../hooks/useConfig';
import styles from './HeaderGenreSelector.module.css';

interface HeaderGenreSelectorProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

const HeaderGenreSelector: React.FC<HeaderGenreSelectorProps> = ({
  selectedGenre: propSelectedGenre,
  onSelectGenre,
}) => {
  const { genre: configGenre, isLoading: configLoading } = useConfig();
  const [genres, setGenres] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use prop genre if provided, otherwise use config genre
  const selectedGenre = propSelectedGenre || configGenre || '';

  // Set the selected genre from config when it's loaded
  useEffect(() => {
    if (!configLoading && configGenre && !propSelectedGenre) {
      onSelectGenre(configGenre);
    }
  }, [configGenre, configLoading, propSelectedGenre, onSelectGenre]);

  useEffect(() => {
    const fetchGenres = async () => {
      setIsLoading(true);
      try {
        const response = await getGenres();
        if (response.success && response.data.genres.length > 0) {
          setGenres(response.data.genres);
          // If no genre is selected yet, use config or first available
          if (!selectedGenre && response.data.genres.length > 0) {
            // Use config genre if available, otherwise use first genre from API
            onSelectGenre(configGenre || response.data.genres[0]);
          }
        } else {
          // Fallback to default genres if API fails
          setGenres(['military', 'romance', 'horror']);
          if (!selectedGenre) {
            // Use config genre if available, don't default to 'military'
            if (configGenre) {
              onSelectGenre(configGenre);
            } else {
              // Only use military as last resort
              onSelectGenre('military');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
        // Fallback to default genres if API fails
        setGenres(['military', 'romance', 'horror']);
        if (!selectedGenre) {
          // Use config genre if available, don't default to 'military'
          if (configGenre) {
            onSelectGenre(configGenre);
          } else {
            // Only use military as last resort
            onSelectGenre('military');
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    // Only fetch if config loading is complete
    if (!configLoading) {
      fetchGenres();
    }
  }, [configGenre, configLoading, selectedGenre, onSelectGenre]);

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  const handleSelectGenre = (genre: string) => {
    onSelectGenre(genre);
    setIsOpen(false);
    
    // Save selected genre to localStorage to ensure it persists across sessions
    localStorage.setItem('selectedGenre', genre);
    
    // Make API call to save the genre
    saveGenreToConfig(genre);
  };
  
  // Function to save genre to config API
  const saveGenreToConfig = async (genre: string) => {
    try {
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ genre }),
      });
      
      if (!response.ok) {
        console.error('Failed to save genre to config:', await response.json());
      }
    } catch (error) {
      console.error('Error saving genre to config:', error);
    }
  };

  return (
    <motion.div 
      className={styles.headerGenreSelector}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ 
        duration: 0.3,
        delay: 0.1 
      }}
    >
      <div className={styles.selectedGenre} onClick={toggleDropdown}>
        <FiTag className={styles.genreIcon} />
        <span className={styles.genreText}>
          {isLoading || configLoading ? 'Loading...' : selectedGenre ? selectedGenre.charAt(0).toUpperCase() + selectedGenre.slice(1) : 'Select Genre'}
        </span>
        <FiChevronDown className={`${styles.dropdownIcon} ${isOpen ? styles.open : ''}`} />
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div 
            className={styles.dropdown}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {genres.map((genre) => (
              <div 
                key={genre}
                className={`${styles.genreOption} ${selectedGenre === genre ? styles.selected : ''}`}
                onClick={() => handleSelectGenre(genre)}
              >
                {selectedGenre === genre && <FiCheck className={styles.checkIcon} />}
                <span>{genre.charAt(0).toUpperCase() + genre.slice(1)}</span>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default HeaderGenreSelector; 