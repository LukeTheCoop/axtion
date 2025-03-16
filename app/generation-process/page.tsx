'use client';

import React, { useState, useEffect } from 'react';
import GenerationProcess from '../../component/GenerationProcess';
import TextBoxes from '../../component/TextBoxes';
import styles from './page.module.css';

export default function GenerationProcessPage() {
  const [showGenerationProcess, setShowGenerationProcess] = useState(false);
  const [mothershipText, setMothershipText] = useState('');
  const [promptText, setPromptText] = useState('');
  const [genre, setGenre] = useState('military'); // Default genre
  const [agent, setAgent] = useState('medium'); // Default agent size
  
  // Add debugging effects
  useEffect(() => {
    console.log('GenerationProcessPage mounted');
  }, []);
  
  const handleGenerate = (mothership: string, prompt: string) => {
    console.log('handleGenerate called with:', { mothership, prompt, genre, agent });
    
    // Make sure we have valid inputs
    if (!mothership.trim() || !prompt.trim()) {
      alert('Please provide both mothership instructions and a prompt.');
      return;
    }
    
    setMothershipText(mothership);
    setPromptText(prompt);
    setShowGenerationProcess(true);
  };
  
  const handleProcessComplete = () => {
    console.log('Generation process completed');
  };
  
  const handleReset = () => {
    console.log('handleReset called');
    setShowGenerationProcess(false);
  };

  return (
    <div className={styles.container}>
      {!showGenerationProcess ? (
        <div className={styles.inputContainer}>
          <h1 className={styles.title}>Create Your Video</h1>
          <p className={styles.description}>
            Enter your mothership instructions and prompt below, then click Generate to start the video creation process.
          </p>
          
          <TextBoxes 
            onMothershipSubmit={(text) => console.log('Mothership submitted:', text)}
            onPromptSubmit={(text) => console.log('Prompt submitted:', text)}
            onGenerate={handleGenerate}
          />
          
          {/* Advanced options (hidden for now, could be expanded in the future) */}
          <div className={styles.advancedOptions} style={{ display: 'none' }}>
            <h3>Advanced Options</h3>
            
            <div className={styles.optionGroup}>
              <label>Genre</label>
              <select 
                value={genre} 
                onChange={(e) => setGenre(e.target.value)}
              >
                <option value="military">Military</option>
                <option value="business">Business</option>
                <option value="general">General</option>
              </select>
            </div>
            
            <div className={styles.optionGroup}>
              <label>Agent Size</label>
              <select 
                value={agent} 
                onChange={(e) => setAgent(e.target.value)}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </div>
          </div>
        </div>
      ) : (
        <GenerationProcess 
          mothership={mothershipText}
          prompt={promptText}
          onComplete={handleProcessComplete}
          onReset={handleReset}
        />
      )}
    </div>
  );
} 