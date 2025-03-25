import React, { ReactNode, useState, useEffect } from 'react';
import styles from './Dashboard.module.css';
import TextBoxes from './TextBoxes';
import AgentSelector from './AgentSelector';
import VoiceSettings from './VoiceSettings';
import MusicSettings from './MusicSettings';
import AgentPrompt from './AgentPrompt';
import HeaderGenreSelector from './HeaderGenreSelector';
import GalleryButton from './GalleryButton';
import { useRouter } from 'next/navigation';
import { useConfig } from '../hooks/useConfig';

type ActiveView = 'dashboard' | 'voice' | 'music' | 'agent';

interface DashboardProps {
  children?: ReactNode;
  sidebarContent?: ReactNode;
  headerContent?: ReactNode;
  onGenerate: (mothership: string, prompt: string) => void;
}

export default function Dashboard({ 
  children, 
  sidebarContent, 
  headerContent,
  onGenerate
}: DashboardProps) {
  const router = useRouter();
  const { genre: configGenre, isLoading: configLoading } = useConfig();
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [stars, setStars] = useState<{ id: number; size: number; top: string; left: string; delay: number }[]>([]);
  const [currentAgent, setCurrentAgent] = useState<string>('Medium');
  const [selectedGenre, setSelectedGenre] = useState<string>('');
  
  // Initialize selectedGenre from config when it loads
  useEffect(() => {
    if (!configLoading && configGenre) {
      setSelectedGenre(configGenre);
    }
  }, [configGenre, configLoading]);
  
  const handleAgentChange = (agentType: string) => {
    console.log('Agent changed to:', agentType);
    setCurrentAgent(agentType);
    // Add additional logic for agent change if needed
  };

  const handleGenreChange = (genre: string) => {
    console.log('Genre changed to:', genre);
    setSelectedGenre(genre);
  };

  const handleNavigateToGallery = () => {
    router.push('/gallery');
  };

  // Generate random stars for the background
  useEffect(() => {
    const generatedStars = [];
    const numStars = 70; // Number of stars to generate
    
    for (let i = 0; i < numStars; i++) {
      generatedStars.push({
        id: i,
        size: Math.random() * 3 + 1, // Random size between 1-4px
        top: `${Math.random() * 100}%`,
        left: `${Math.random() * 100}%`,
        delay: Math.random() * 5 // Random animation delay
      });
    }
    
    setStars(generatedStars);
  }, []);

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return children || <TextBoxes onGenerate={onGenerate} selectedGenre={selectedGenre} />;
      case 'voice':
        return <VoiceSettings />;
      case 'music':
        return <MusicSettings />;
      case 'agent':
        return <AgentPrompt />;
      default:
        return <TextBoxes onGenerate={onGenerate} selectedGenre={selectedGenre} />;
    }
  };

  return (
    <div className={styles.dashboardContainer}>
      {/* Background animations */}
      <div className={`${styles.orb} ${styles.orb1}`}></div>
      <div className={`${styles.orb} ${styles.orb2}`}></div>
      <div className={`${styles.orb} ${styles.orb3}`}></div>
      
      {/* Star field */}
      <div className={styles.starField}>
        {stars.map((star) => (
          <div
            key={star.id}
            className={styles.star}
            style={{
              width: `${star.size}px`,
              height: `${star.size}px`,
              top: star.top,
              left: star.left,
              animation: `twinkle 3s infinite ease-in-out ${star.delay}s`
            }}
          ></div>
        ))}
      </div>
      
      {/* Header section */}
      <header className={styles.header}>
        {headerContent || (
          <div className={styles.headerPlaceholder}>
            <h1 className={styles.headerTitle}>Axtion AI</h1>
            <div className={styles.headerActions}>
              <AgentSelector onAgentChange={handleAgentChange} />
              <HeaderGenreSelector
                selectedGenre={selectedGenre}
                onSelectGenre={handleGenreChange}
              />
              <GalleryButton />
            </div>
          </div>
        )}
      </header>

      <div className={styles.mainSection}>
        {/* Sidebar section */}
        <aside className={styles.sidebar}>
          {sidebarContent || (
            <div className={styles.sidebarPlaceholder}>
              <div className={styles.sidebarLogo}>
                <span className={styles.logoText}>AXTION</span>
              </div>
              
              <nav className={styles.navigation}>
                <div 
                  className={`${styles.navItem} ${activeView === 'dashboard' ? styles.active : ''}`}
                  onClick={() => setActiveView('dashboard')}
                >
                  <div className={styles.navIcon}></div>
                  <span className={styles.navLabel}>Dashboard</span>
                </div>
                <div 
                  className={`${styles.navItem} ${activeView === 'voice' ? styles.active : ''}`}
                  onClick={() => setActiveView('voice')}
                >
                  <div className={styles.navIcon}></div>
                  <span className={styles.navLabel}>Voice Settings</span>
                </div>
                <div 
                  className={`${styles.navItem} ${activeView === 'music' ? styles.active : ''}`}
                  onClick={() => setActiveView('music')}
                >
                  <div className={styles.navIcon}></div>
                  <span className={styles.navLabel}>Music Settings</span>
                </div>
                <div 
                  className={`${styles.navItem} ${activeView === 'agent' ? styles.active : ''}`}
                  onClick={() => setActiveView('agent')}
                >
                  <div className={styles.navIcon}></div>
                  <span className={styles.navLabel}>{`${currentAgent} Prompt`}</span>
                </div>
                <div 
                  className={styles.navItem}
                  onClick={handleNavigateToGallery}
                >
                  <div className={styles.navIcon}></div>
                  <span className={styles.navLabel}>Gallery</span>
                </div>
              </nav>
              
              <div className={styles.sidebarFooter}>
                <div className={styles.userProfile}>
                  <div className={styles.userAvatar}></div>
                  <div className={styles.userInfo}>
                    <span className={styles.userName}>User Name</span>
                    <span className={styles.userRole}>AI Pilot</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Main content section */}
        <main className={styles.content}>
          {renderActiveView()}
        </main>
      </div>
    </div>
  );
} 