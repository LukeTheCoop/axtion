import React, { useEffect, useState } from 'react';
import styles from './GalleryBackground.module.css';

interface GalleryBackgroundProps {
  children?: React.ReactNode;
}

const GalleryBackground: React.FC<GalleryBackgroundProps> = ({ children }) => {
  // Static network lines for consistent visual
  const staticLines = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    x1: 10 + (i * 8),
    y1: 15 + (i * 7),
    x2: 60 + (i * 4),
    y2: 40 + (i * 5),
    color: `rgba(100, 160, 255, ${0.2 + (i * 0.02)})`,
    thickness: 0.5 + (i * 0.1)
  }));

  // Static nodes for consistent visual
  const staticNodes = Array.from({ length: 8 }, (_, i) => ({
    id: i,
    x: 15 + (i * 10),
    y: 20 + (i * 8),
    size: 4 + (i * 0.5)
  }));

  return (
    <div className={styles.galleryBackground}>
      {/* Large background title */}
      <h1 className={styles.backgroundTitle}>GALLERY</h1>
      
      {/* Static constellation background */}
      <div className={styles.constellationBackground}></div>
      
      {/* Static network lines */}
      <div className={styles.networkLines}>
        {staticLines.map(line => (
          <div 
            key={`line-${line.id}`}
            className={styles.networkLine}
            style={{
              background: `linear-gradient(to right, transparent, ${line.color}, transparent)`,
              height: `${line.thickness}px`,
              left: `${line.x1}%`,
              top: `${line.y1}%`,
              width: `${Math.sqrt(Math.pow(line.x2 - line.x1, 2) + Math.pow(line.y2 - line.y1, 2))}%`,
              transform: `rotate(${Math.atan2(line.y2 - line.y1, line.x2 - line.x1)}rad)`,
              transformOrigin: 'left center'
            }}
          ></div>
        ))}
      </div>
      
      {/* Static neural network nodes */}
      <div className={styles.neuralNodes}>
        {staticNodes.map(node => (
          <div 
            key={`node-${node.id}`}
            className={styles.neuralNode}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
            }}
          ></div>
        ))}
      </div>
      
      {/* Static energy field */}
      <div className={styles.energyField}>
        <div className={styles.energyWave}></div>
        <div className={styles.energyWave} style={{ opacity: '0.1' }}></div>
        <div className={styles.energyWave} style={{ opacity: '0.05' }}></div>
      </div>
      
      {/* Static 3D cubes */}
      <div className={styles.cubeDimension}>
        <div className={styles.cube}>
          <div className={`${styles.cubeFace} ${styles.cubeFront}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeBack}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeLeft}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeRight}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeTop}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeBottom}`}></div>
        </div>
        <div className={styles.cube} style={{ 
          left: '65%', 
          top: '30%',
          transform: 'scale(0.7) rotateX(15deg) rotateY(15deg)' 
        }}>
          <div className={`${styles.cubeFace} ${styles.cubeFront}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeBack}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeLeft}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeRight}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeTop}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeBottom}`}></div>
        </div>
      </div>
      
      {/* Static DNA helix */}
      <div className={styles.dnaHelix}>
        {Array.from({ length: 8 }).map((_, index) => (
          <React.Fragment key={`dna-${index}`}>
            <div 
              className={styles.dnaStrand}
              style={{ 
                left: `${index * 12}%` 
              }}
            ></div>
          </React.Fragment>
        ))}
      </div>
      
      {/* Static light rays */}
      <div className={styles.lightRays}></div>
      
      {/* Children content */}
      {children}
    </div>
  );
};

export default GalleryBackground; 