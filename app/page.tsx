'use client';

import React, { useState, useEffect } from 'react';
import InitializationScreen from '../component/InitializationScreen';
import Dashboard from '../component/Dashboard';
import GenerationProcess from '../component/GenerationProcess';
import styles from './page.module.css';

export default function Home() {
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [mothership, setMothership] = useState('');
  const [prompt, setPrompt] = useState('');
  const appName = "AXTION";
  
  const handleLoadingComplete = () => {
    setIsLoading(false);
  };

  const handleGenerate = (mothershipText: string, promptText: string) => {
    setMothership(mothershipText);
    setPrompt(promptText);
    setIsGenerating(true);
  };

  const handleGenerationComplete = () => {
    // If you want to automatically return to the main UI after generation
    // setIsGenerating(false);
  };

  const handleReset = () => {
    setIsGenerating(false);
  };

  // This allows seeing the loading screen for development/testing
  // You can remove this if you want to use real loading conditions
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000); // 3 seconds for demo purposes
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {isLoading ? (
        <InitializationScreen 
          onComplete={handleLoadingComplete} 
          appName={appName} 
        />
      ) : isGenerating ? (
        <GenerationProcess
          mothership={mothership}
          prompt={prompt}
          onComplete={handleGenerationComplete}
          onReset={handleReset}
        />
      ) : (
        <Dashboard onGenerate={handleGenerate} />
      )}
    </>
  );
}
