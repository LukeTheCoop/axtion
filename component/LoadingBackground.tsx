import React, { useEffect, useState } from 'react';
import styles from './LoadingBackground.module.css';

interface LoadingBackgroundProps {
  children?: React.ReactNode;
}

const LoadingBackground: React.FC<LoadingBackgroundProps> = ({ children }) => {
  const [animatedLines, setAnimatedLines] = useState<Array<{ id: number, x1: number, y1: number, x2: number, y2: number, color: string, thickness: number }>>([]);
  const [neuralNodes, setNeuralNodes] = useState<Array<{ id: number, x: number, y: number, size: number, pulseDelay: number }>>([]);
  
  // Generate dynamic elements on mount
  useEffect(() => {
    // Create animated network lines
    const lines = [];
    for (let i = 0; i < 15; i++) {
      lines.push({
        id: i,
        x1: Math.random() * 100,
        y1: Math.random() * 100,
        x2: Math.random() * 100,
        y2: Math.random() * 100,
        color: `rgba(${Math.floor(Math.random() * 100 + 155)}, ${Math.floor(Math.random() * 100 + 155)}, 255, ${Math.random() * 0.5 + 0.25})`,
        thickness: Math.random() * 2 + 0.5
      });
    }
    setAnimatedLines(lines);
    
    // Create neural network nodes
    const nodes = [];
    for (let i = 0; i < 12; i++) {
      nodes.push({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 10 + 5,
        pulseDelay: Math.random() * 5
      });
    }
    setNeuralNodes(nodes);
  }, []);

  return (
    <div className={styles.loadingBackground}>
      {/* Dynamic constellation background */}
      <div className={styles.constellationBackground}></div>
      
      {/* Animated network lines */}
      <div className={styles.networkLines}>
        {animatedLines.map(line => (
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
      
      {/* Neural network nodes */}
      <div className={styles.neuralNodes}>
        {neuralNodes.map(node => (
          <div 
            key={`node-${node.id}`}
            className={styles.neuralNode}
            style={{
              left: `${node.x}%`,
              top: `${node.y}%`,
              width: `${node.size}px`,
              height: `${node.size}px`,
              animationDelay: `${node.pulseDelay}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Animated energy field */}
      <div className={styles.energyField}>
        <div className={styles.energyWave}></div>
        <div className={styles.energyWave} style={{ animationDelay: '-5s' }}></div>
        <div className={styles.energyWave} style={{ animationDelay: '-10s' }}></div>
      </div>
      
      {/* Dynamic 3D cubes */}
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
          animationDelay: '-5s', 
          left: '65%', 
          top: '30%',
          transform: 'scale(0.7)' 
        }}>
          <div className={`${styles.cubeFace} ${styles.cubeFront}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeBack}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeLeft}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeRight}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeTop}`}></div>
          <div className={`${styles.cubeFace} ${styles.cubeBottom}`}></div>
        </div>
      </div>
      
      {/* DNA helix animation */}
      <div className={styles.dnaHelix}>
        {Array.from({ length: 12 }).map((_, index) => (
          <React.Fragment key={`dna-${index}`}>
            <div 
              className={styles.dnaStrand}
              style={{ 
                animationDelay: `${index * 0.2}s`,
                left: `${index * 8.333}%` 
              }}
            ></div>
          </React.Fragment>
        ))}
      </div>
      
      {/* Light rays effect */}
      <div className={styles.lightRays}></div>
      
      {/* Central loading area */}
      <div className={styles.loadingCentral}>
        {/* Advanced animation elements */}
        <div className={styles.pulsatingCore}>
          <div className={styles.coreInner}></div>
          <div className={styles.coreMiddle}></div>
          <div className={styles.coreOuter}></div>
        </div>
        
        <div className={styles.circuitPaths}>
          {Array.from({ length: 8 }).map((_, index) => (
            <div 
              key={`circuit-${index}`} 
              className={styles.circuitPath}
              style={{ transform: `rotate(${index * 45}deg)` }}
            >
              <div className={styles.circuitNode}></div>
            </div>
          ))}
        </div>
        
        <div className={styles.dataStream}>
          {Array.from({ length: 20 }).map((_, index) => (
            <div 
              key={`data-${index}`} 
              className={styles.dataParticle}
              style={{ 
                animationDelay: `${index * 0.1}s`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`
              }}
            ></div>
          ))}
        </div>
        
        {/* Children content */}
        {children && (
          <div className={styles.childrenContainer}>
            {children}
          </div>
        )}
      </div>
    </div>
  );
};

export default LoadingBackground; 