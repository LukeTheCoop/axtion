import React, { useState, useEffect, useRef } from 'react';
import styles from './TextBoxes.module.css';
import { useConfig } from '../hooks/useConfig';
import SaveNotification from './SaveNotification';

interface TextBoxesProps {
  onMothershipSubmit?: (text: string) => void;
  onPromptSubmit?: (text: string) => void;
  onGenerate?: (mothershipText: string, promptText: string) => void;
}

const TextBoxes: React.FC<TextBoxesProps> = ({
  onMothershipSubmit,
  onPromptSubmit,
  onGenerate
}) => {
  const { mothership: initialMothership, prompt: initialPrompt, isLoading, error } = useConfig();
  const [mothership, setMothership] = useState<string>('');
  const [prompt, setPrompt] = useState<string>('');
  const [isMothershipFocused, setIsMothershipFocused] = useState<boolean>(false);
  const [isPromptFocused, setIsPromptFocused] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSaveNotification, setShowSaveNotification] = useState<boolean>(false);
  const [lastSavedField, setLastSavedField] = useState<string>('');

  // Update state when config is loaded
  useEffect(() => {
    if (initialMothership) setMothership(initialMothership);
    if (initialPrompt) setPrompt(initialPrompt);
  }, [initialMothership, initialPrompt]);

  const saveMothershipChanges = async () => {
    if (isSaving || !mothership.trim()) return;
    
    try {
      setIsSaving(true);
      
      const payload = {
        mothership: mothership,
        prompt: prompt // Always include both values
      };
      
      console.log('Saving user config:', payload);
      
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('User config saved successfully:', data);
        setLastSavedField('mothership');
        setShowSaveNotification(true);
        if (onMothershipSubmit) onMothershipSubmit(mothership);
      } else {
        console.error('Failed to save user config:', data.error);
      }
    } catch (error) {
      console.error('Error saving user config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const savePromptChanges = async () => {
    if (isSaving || !prompt.trim()) return;
    
    try {
      setIsSaving(true);
      
      const payload = {
        mothership: mothership, // Always include both values
        prompt: prompt
      };
      
      console.log('Saving user config:', payload);
      
      const response = await fetch('/api/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('User config saved successfully:', data);
        setLastSavedField('prompt');
        setShowSaveNotification(true);
        if (onPromptSubmit) onPromptSubmit(prompt);
      } else {
        console.error('Failed to save user config:', data.error);
      }
    } catch (error) {
      console.error('Error saving user config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleMothershipChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMothership(e.target.value);
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
  };

  const handleMothershipBlur = () => {
    if (mothership.trim()) {
      saveMothershipChanges();
    }
  };

  const handlePromptBlur = () => {
    if (prompt.trim()) {
      savePromptChanges();
    }
  };

  const handleGenerate = () => {
    // Only proceed if at least one of the fields has content
    if (mothership.trim() || prompt.trim()) {
      if (onGenerate) {
        onGenerate(mothership, prompt);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const isGenerateDisabled = !mothership.trim() && !prompt.trim();

  return (
    <>
      <SaveNotification
        show={showSaveNotification}
        message={`${lastSavedField === 'mothership' ? 'Mothership' : 'Prompt'} saved successfully`}
        onComplete={() => setShowSaveNotification(false)}
      />
      
      <div className={styles.textBoxesContainer}>
        {/* Mothership text box */}
        <div className={`${styles.textBoxWrapper} ${isMothershipFocused ? styles.focused : ''} ${isLoading ? styles.loading : ''}`}>
          <div className={styles.textBoxHeader}>
            <h3 className={styles.textBoxTitle}>Mothership</h3>
            <div className={styles.textBoxInfo}>
              <span className={styles.textBoxDescription}>
                Central control system instructions
              </span>
              <span className={styles.textBoxHotkey}>Saved when you click away</span>
            </div>
          </div>

          <div className={styles.textAreaContainer}>
            <textarea
              className={styles.textArea}
              value={mothership}
              onChange={handleMothershipChange}
              onFocus={() => setIsMothershipFocused(true)}
              onBlur={() => {
                setIsMothershipFocused(false);
                handleMothershipBlur();
              }}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Loading mothership instructions..." : "Enter mothership instructions here..."}
              rows={6}
              disabled={isLoading}
            />
            
            <div className={styles.glowingEffect}></div>
          </div>
        </div>

        {/* Prompt text box */}
        <div className={`${styles.textBoxWrapper} ${isPromptFocused ? styles.focused : ''} ${isLoading ? styles.loading : ''}`}>
          <div className={styles.textBoxHeader}>
            <h3 className={styles.textBoxTitle}>Prompt</h3>
            <div className={styles.textBoxInfo}>
              <span className={styles.textBoxDescription}>
                User prompt for AI interaction
              </span>
              <span className={styles.textBoxHotkey}>Saved when you click away</span>
            </div>
          </div>

          <div className={styles.textAreaContainer}>
            <textarea
              className={styles.textArea}
              value={prompt}
              onChange={handlePromptChange}
              onFocus={() => setIsPromptFocused(true)}
              onBlur={() => {
                setIsPromptFocused(false);
                handlePromptBlur();
              }}
              onKeyDown={handleKeyDown}
              placeholder={isLoading ? "Loading prompt data..." : "Enter your prompt here..."}
              rows={6}
              disabled={isLoading}
            />
            
            <div className={styles.glowingEffect}></div>
          </div>
        </div>

        {/* Generate button */}
        <button
          className={styles.generateButton}
          onClick={handleGenerate}
          disabled={isGenerateDisabled || isLoading}
        >
          <span className={styles.generateButtonText}>{isLoading ? 'Loading...' : 'Generate'}</span>
          <div className={styles.generateButtonGlow}></div>
        </button>
        
        <div className={styles.textBoxFooter}>
          <div className={`${styles.pulsingDot} ${isLoading ? styles.loading : ''}`}></div>
          <span className={styles.statusText}>
            {isLoading ? 'Loading configuration...' : 
            isSaving ? 'Saving changes...' :
            error ? `Error: ${error}` : 
            'Changes are saved when you click away from each input'}
          </span>
        </div>
      </div>
    </>
  );
};

export default TextBoxes; 