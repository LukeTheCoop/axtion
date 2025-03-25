'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronLeft, FiChevronRight, FiLoader, FiChevronUp, FiChevronDown, FiPlus, FiFilm } from 'react-icons/fi';
import GalleryBackground from '@/component/gallery/GalleryBackground';
import GenreSelector from '@/component/gallery/GenreSelector';
import VideoGallery, { VideoData } from '@/component/gallery/VideoGallery';
import AddVideoButton from '@/component/gallery/AddVideoButton';
import AddVideoModal from '@/component/gallery/AddVideoModal';
import styles from '@/component/gallery/Gallery.module.css';
import { createGenre, uploadVideo, getGallery, transformGalleryData, getGenres, deleteVideo } from '@/lib/services/galleryService';
import { useConfig } from '@/hooks/useConfig';

interface GalleryClientProps {
  initialVideos: VideoData[];
  totalPages: number;
}

const VIDEOS_PER_PAGE = 6; // Reduced from 9 to 6 (2x3 grid)

const GalleryClient: React.FC<GalleryClientProps> = ({ initialVideos, totalPages: initialTotalPages }) => {
  const { genre: configGenre, isLoading: configLoading } = useConfig();
  const [genres, setGenres] = useState<string[]>(['military']);
  const [selectedGenre, setSelectedGenre] = useState<string>('military');
  const [videos, setVideos] = useState<VideoData[]>(initialVideos);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('videoModalOpen') === 'true';
    }
    return false;
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [localLoadingOnly, setLocalLoadingOnly] = useState<boolean>(false);
  
  // Slideshow state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [inputPage, setInputPage] = useState<string>('1');
  const [totalVideosCount, setTotalVideosCount] = useState<number>(initialVideos.length);
  
  // Set the selected genre from config when it's loaded
  useEffect(() => {
    if (!configLoading && configGenre && configGenre !== selectedGenre) {
      setSelectedGenre(configGenre);
    }
  }, [configGenre, configLoading, selectedGenre]);
  
  // Filter videos by the current genre
  const filteredVideos = videos.filter(video => video.genre === selectedGenre);
  
  // Calculate pagination info
  const totalPages = Math.ceil(filteredVideos.length / VIDEOS_PER_PAGE);
  const paginatedVideos = filteredVideos.slice(
    (currentPage - 1) * VIDEOS_PER_PAGE,
    currentPage * VIDEOS_PER_PAGE
  );
  
  // Fetch all available genres on component mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await getGenres();
        if (response.success && response.data.genres.length > 0) {
          setGenres(response.data.genres);
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };
    
    fetchGenres();
  }, []);
  
  // Load videos when genre changes
  useEffect(() => {
    const fetchGalleryData = async () => {
      setIsLoading(true);
      try {
        const response = await getGallery(selectedGenre);
        
        if (response.success && response.data) {
          const transformedData = transformGalleryData(response.data, selectedGenre);
          // Merge with videos from other genres
          const otherGenreVideos = videos.filter(video => video.genre !== selectedGenre);
          setVideos([...transformedData, ...otherGenreVideos]);
        } else {
          console.log(`No data returned for genre: ${selectedGenre}`);
        }
      } catch (error) {
        console.error('Error fetching gallery data:', error);
        // If we encounter an error, don't change anything
      } finally {
        setIsLoading(false);
      }
    };
    
    if (selectedGenre !== 'military') {
      // Only fetch for non-military genres as we already have military data loaded initially
      fetchGalleryData();
    }
  }, [selectedGenre]);
  
  // Update the page input when the current page changes
  useEffect(() => {
    setInputPage(currentPage.toString());
  }, [currentPage]);
  
  const handlePageChange = useCallback((newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages && !isLoading) {
      // Only set local loading (within the gallery component) to prevent full page lag
      setLocalLoadingOnly(true);
      setCurrentPage(newPage);
      
      // Use a shorter loading time for better responsiveness
      setTimeout(() => {
        setLocalLoadingOnly(false);
      }, 150); // Reduced from 200ms to 150ms for better responsiveness
    }
  }, [totalPages, isLoading]);
  
  const handleInputPageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputPage(e.target.value);
  };
  
  const handleInputPageBlur = () => {
    const pageNumber = parseInt(inputPage);
    if (!isNaN(pageNumber) && pageNumber >= 1 && pageNumber <= totalPages && !isLoading) {
      handlePageChange(pageNumber);
    } else {
      setInputPage(currentPage.toString());
    }
  };
  
  const handleInputPageKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleInputPageBlur();
    }
  };

  const handleSelectGenre = (genre: string) => {
    if (genre !== selectedGenre) {
      setSelectedGenre(genre);
      // Reset to the first page when changing genres
      setCurrentPage(1);
      
      // Save the selected genre to the config
      saveGenreToConfig(genre);
    }
  };

  // Function to save genre to config API
  const saveGenreToConfig = async (genre: string) => {
    try {
      // Save selected genre to localStorage for immediate persistence
      localStorage.setItem('selectedGenre', genre);
      
      // Save to API for long-term persistence
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

  const handleAddGenre = async (genreName: string) => {
    // First validate the genre name
    if (!genreName.trim()) return;
    
    // Normalize the genre name (lowercase, no special chars)
    const normalizedGenre = genreName.trim().toLowerCase();
    
    // Check if genre already exists
    if (genres.includes(normalizedGenre)) {
      console.log(`Genre '${normalizedGenre}' already exists`);
      setSelectedGenre(normalizedGenre);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the API to create a new genre
      const response = await createGenre(normalizedGenre);
      
      if (response.success) {
        // Add the new genre to the list and select it
        setGenres(prevGenres => [...prevGenres, normalizedGenre]);
        setSelectedGenre(normalizedGenre);
      } else {
        console.error(`Failed to create genre: ${response.message}`);
      }
    } catch (error) {
      console.error('Error adding genre:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteVideo = async (id: string) => {
    // Find the video to be deleted
    const videoToDelete = videos.find(video => video.id === id);
    
    if (!videoToDelete) {
      console.error('Video not found:', id);
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Convert thumbnail URL to video name (replace jpg with mp4)
      const thumbnailPath = videoToDelete.thumbnailUrl.split('/').pop() || '';
      const videoName = thumbnailPath.replace('.jpg', '.mp4');
      
      // Call the API to delete the video
      const response = await deleteVideo(videoToDelete.genre, videoName);
      
      if (response.success) {
        // Remove the video from the local state
        setVideos(videos.filter(video => video.id !== id));
        
        // Check if we need to adjust the current page after deletion
        const remainingVideos = filteredVideos.filter(video => video.id !== id).length;
        const newTotalPages = Math.ceil(remainingVideos / VIDEOS_PER_PAGE);
        if (currentPage > newTotalPages && newTotalPages > 0) {
          setCurrentPage(newTotalPages);
        }
      } else {
        console.error('Failed to delete video:', response.message);
      }
    } catch (error) {
      console.error('Error deleting video:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddVideo = async (videoUrl: string, description: string, keepModalOpen: boolean) => {
    setIsLoading(true);
    try {
      const response = await uploadVideo(selectedGenre, description, videoUrl);
      
      if (response.success && response.data) {
        // Temporarily add the new video with response data
        const newVideo: VideoData = {
          id: response.data.id || Math.random().toString(36).substring(2, 9),
          title: response.data.title || `${selectedGenre}_video_${Date.now()}`,
          thumbnailUrl: response.data.thumbnailUrl || 'https://res.cloudinary.com/ddab3rxhe/image/upload/v1742226121/gallery/nature/forest_tree_animals_crawling.jpg',
          genre: selectedGenre,
          description: description,
        };
        
        setVideos(prevVideos => [newVideo, ...prevVideos]);
        
        // Only close modal if not keepModalOpen
        if (!keepModalOpen) {
          setIsModalOpen(false);
        }
        
        setCurrentPage(1); // Show first page with new video
        
        // Fetch fresh data after a short delay to allow backend processing
        setTimeout(async () => {
          try {
            const galleryResponse = await getGallery(selectedGenre);
            
            if (galleryResponse.success && galleryResponse.data) {
              const transformedData = transformGalleryData(galleryResponse.data, selectedGenre);
              // Merge with videos from other genres
              const otherGenreVideos = videos.filter(video => video.genre !== selectedGenre);
              setVideos([...transformedData, ...otherGenreVideos]);
            }
          } catch (error) {
            console.error('Error refreshing gallery data after upload:', error);
          } finally {
            setIsLoading(false);
          }
        }, 1500); // Wait 1.5 seconds for backend processing
      } else {
        console.error('Failed to upload video:', response.message);
        // Add a dummy video anyway for the demo
        const newVideo: VideoData = {
          id: Math.random().toString(36).substring(2, 9),
          title: `${selectedGenre}_video_${Date.now()}`,
          thumbnailUrl: 'https://res.cloudinary.com/ddab3rxhe/image/upload/v1742226121/gallery/nature/forest_tree_animals_crawling.jpg',
          genre: selectedGenre,
          description: description,
        };
        
        setVideos([newVideo, ...videos]);
        
        // Only close modal if not keepModalOpen
        if (!keepModalOpen) {
          setIsModalOpen(false);
        }
        
        setCurrentPage(1);
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error uploading video:', error);
      // Add a dummy video anyway for the demo
      const newVideo: VideoData = {
        id: Math.random().toString(36).substring(2, 9),
        title: `${selectedGenre}_video_${Date.now()}`,
        thumbnailUrl: 'https://res.cloudinary.com/ddab3rxhe/image/upload/v1742226121/gallery/nature/forest_tree_animals_crawling.jpg',
        genre: selectedGenre,
        description: description,
      };
      
      setVideos([newVideo, ...videos]);
      
      // Only close modal if not keepModalOpen
      if (!keepModalOpen) {
        setIsModalOpen(false);
      }
      
      setCurrentPage(1);
      setIsLoading(false);
    }
  };

  const handleGenreChange = useCallback((genre: string) => {
    setSelectedGenre(genre);
    setCurrentPage(1);
  }, []);

  useEffect(() => {
    // Event listener to reopen modal after refresh
    const handleReopenModal = () => {
      setIsModalOpen(true);
    };
    
    document.addEventListener('reopenVideoModal', handleReopenModal);
    
    return () => {
      document.removeEventListener('reopenVideoModal', handleReopenModal);
    };
  }, []);

  return (
    <GalleryBackground>
      <div className={styles.outerContainer}>
        <div className={styles.galleryContainer}>
          <div className={styles.galleryContent}>
            <div className={styles.galleryControls}>
              <GenreSelector
                genres={genres}
                selectedGenre={selectedGenre}
                onSelectGenre={handleSelectGenre}
                onAddGenre={handleAddGenre}
              />
              
              <div className={styles.paginationInfo}>
                <FiFilm style={{ marginRight: "8px" }}/>
                <span>{filteredVideos.length} videos</span>
                {totalPages > 1 && (
                  <span className={styles.pageIndicator}>Page {currentPage} of {totalPages}</span>
                )}
                
                {/* Add Video Button */}
                <motion.button
                  className={styles.addVideoPaginationButton}
                  onClick={() => setIsModalOpen(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <FiPlus />
                  <span>Add Video</span>
                </motion.button>

                {/* Dashboard Button - moved here */}
                <motion.button
                  className={styles.dashboardButton}
                  onClick={() => window.location.href = '/'}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="7" height="7"></rect>
                    <rect x="14" y="3" width="7" height="7"></rect>
                    <rect x="14" y="14" width="7" height="7"></rect>
                    <rect x="3" y="14" width="7" height="7"></rect>
                  </svg>
                  <span>Dashboard</span>
                </motion.button>
              </div>
            </div>
            
            {/* Slideshow Controls - Show at top if there are multiple pages */}
            {totalPages > 1 && (
              <div className={styles.slideshowControlsTop}>
                <div className={styles.slideshowButtons}>
                  <motion.button 
                    className={styles.slideshowButton}
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Previous page"
                  >
                    {isLoading ? <FiLoader className={styles.loadingIcon} /> : <FiChevronLeft />}
                  </motion.button>
                  
                  <div className={styles.slideshowPagination}>
                    <input
                      type="text"
                      className={styles.slideshowPageInput}
                      value={inputPage}
                      onChange={handleInputPageChange}
                      onBlur={handleInputPageBlur}
                      onKeyDown={handleInputPageKeyDown}
                      disabled={isLoading}
                      aria-label="Page number"
                    />
                  </div>
                  
                  <motion.button 
                    className={styles.slideshowButton}
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Next page"
                  >
                    {isLoading ? <FiLoader className={styles.loadingIcon} /> : <FiChevronRight />}
                  </motion.button>
                </div>
              </div>
            )}
            
            <VideoGallery
              videos={paginatedVideos}
              selectedGenre={selectedGenre}
              onDeleteVideo={handleDeleteVideo}
              isLoading={isLoading || localLoadingOnly}
            />
          </div>
        </div>
        
        <AddVideoModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleAddVideo}
          selectedGenre={selectedGenre}
        />
      </div>
    </GalleryBackground>
  );
};

export default GalleryClient; 