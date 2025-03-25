import React from 'react';
import { Metadata } from 'next';
import GalleryClient from './GalleryClient';
import { getGallery, transformGalleryData } from '@/lib/services/galleryService';
import militaryVideos from '../../lib/gallery/military.json';

export const metadata: Metadata = {
  title: 'Video Gallery | Content Collections',
  description: 'Browse and manage your collection of videos',
};

// Format the data from the JSON file into VideoData format as a fallback
function formatMilitaryVideos() {
  const videos = Object.entries(militaryVideos).map(([title, thumbnailUrl], index) => {
    return {
      id: `military-${index}`,
      title,
      thumbnailUrl: thumbnailUrl as string,
      genre: 'military',
      description: generateDescription(title, 'military'),
    };
  });
  
  return videos;
}

// Generate a description based on the title
function generateDescription(title: string, genre: string) {
  const parts = title.replace(`${genre}_`, '').split('_');
  const capitalizedParts = parts.map(part => 
    part.charAt(0).toUpperCase() + part.slice(1)
  );
  
  let description = `${capitalizedParts.join(' ')}.`;
  
  // Add context based on keywords in the title
  if (title.includes('med_evac')) {
    description += ' Medical evacuation operation captured during a training exercise.';
  } else if (title.includes('sniping') || title.includes('sniper')) {
    description += ' Precision marksmanship training for long-range tactical engagement.';
  } else if (title.includes('tank')) {
    description += ' Armored vehicles conducting maneuvers in a controlled environment.';
  } else if (title.includes('helicopter')) {
    description += ' Aerial support operations showing coordination with ground forces.';
  } else if (title.includes('navy') || title.includes('ocean') || title.includes('submarine')) {
    description += ' Naval operations demonstrating maritime tactical capabilities.';
  } else if (title.includes('battle') || title.includes('action')) {
    description += ' Simulated combat scenario used for training purposes.';
  } else {
    description += ' Professional footage captured for training and documentation purposes.';
  }
  
  return description;
}

// Enhance the gallery data with better descriptions
function enhanceGalleryData(galleryData: any[], genre: string) {
  return galleryData.map(item => ({
    ...item,
    description: generateDescription(item.id, genre)
  }));
}

export default function GalleryPage() {
  // Default genre to load initially
  const initialGenre = 'military';
  
  // For now, use the local data directly
  // This avoids server-component issues with URL construction
  const initialVideos = formatMilitaryVideos();
  
  // Calculate total pages - assuming 6 videos per page as defined in GalleryClient
  const VIDEOS_PER_PAGE = 6;
  const totalPages = Math.ceil(initialVideos.length / VIDEOS_PER_PAGE);
  
  return <GalleryClient initialVideos={initialVideos} totalPages={totalPages} />;
}
