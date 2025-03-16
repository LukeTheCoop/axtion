import React, { useState, useEffect, useRef } from 'react';
import styles from './Dashboard.module.css';
import { useAgentConfig } from '../hooks/useAgentConfig';
import SaveNotification from './SaveNotification';

interface AgentPromptProps {
  onPromptSubmit?: (text: string) => void;
}

const AgentPrompt: React.FC<AgentPromptProps> = ({
  onPromptSubmit
}) => {
  const agentConfig = useAgentConfig();
  const [agentPrompt, setAgentPrompt] = useState<string>('');
  const [isPromptFocused, setIsPromptFocused] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showSaveNotification, setShowSaveNotification] = useState<boolean>(false);
  
  // Debounce timer for saving changes
  const saveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Update state when config is loaded
  useEffect(() => {
    console.log('Agent config updated:', agentConfig);
    
    if (!agentConfig.isLoading && !agentConfig.error) {
      // Use prompt from the config which should now contain system_prompt from the API
      if (agentConfig.prompt) {
        console.log('Setting prompt from config:', agentConfig.prompt);
        setAgentPrompt(agentConfig.prompt);
      }
    }
  }, [agentConfig.isLoading, agentConfig.error, agentConfig.prompt]);

  // Save changes to the API
  const saveChanges = async () => {
    if (isSaving || !agentPrompt.trim()) return;
    
    try {
      setIsSaving(true);
      
      const payload = {
        system_prompt: agentPrompt,
      };
      
      console.log('Saving agent prompt:', payload);
      
      const response = await fetch('/api/agent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });
      
      const data = await response.json();
      
      if (response.ok) {
        console.log('Agent prompt saved successfully:', data);
        setShowSaveNotification(true);
        if (onPromptSubmit) onPromptSubmit(agentPrompt);
      } else {
        console.error('Failed to save agent prompt:', data.error);
      }
    } catch (error) {
      console.error('Error saving agent prompt:', error);
    } finally {
      setIsSaving(false);
    }
  };
  
  // Debounced save function to avoid excessive API calls
  const debouncedSave = () => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
    }
    
    saveTimerRef.current = setTimeout(() => {
      saveChanges();
    }, 1000); // Slightly longer debounce for text input
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setAgentPrompt(e.target.value);
    // Don't save on every keystroke
  };

  const handlePromptBlur = () => {
    if (agentPrompt.trim()) {
      saveChanges(); // Save when user clicks away from textarea
    }
  };

  const handleSubmit = () => {
    if (agentPrompt.trim()) {
      saveChanges(); // Save immediately on button click
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <>
      <SaveNotification
        show={showSaveNotification}
        message="Agent prompt saved successfully"
        onComplete={() => setShowSaveNotification(false)}
      />
      
      <div className={styles.settingsContainer}>
        <div className={`${styles.settingsPanel} ${styles.agentPanel}`}>
          <div className={styles.settingsHeader}>
            <h2 className={styles.settingsTitle}>Medium Agent Prompt</h2>
          </div>
          
          <div className={styles.settingsContent}>
            <p className={styles.settingsDescription}>
              Customize the agent prompt for the Medium agent. This will affect how the AI assistant responds to queries.
            </p>
            
            <div className={`${styles.textBoxWrapper} ${isPromptFocused ? styles.focused : ''} ${agentConfig.isLoading || isSaving ? styles.loading : ''}`}>
              <div className={styles.textBoxHeader}>
                <h3 className={styles.textBoxTitle}>Agent Prompt</h3>
                <div className={styles.textBoxInfo}>
                  <span className={styles.textBoxDescription}>
                    Instructions for the Medium AI agent
                  </span>
                  <span className={styles.textBoxHotkey}>Ctrl+Enter to save</span>
                </div>
              </div>

              <div className={styles.textAreaContainer}>
                <textarea
                  className={styles.textArea}
                  value={agentPrompt}
                  onChange={handlePromptChange}
                  onFocus={() => setIsPromptFocused(true)}
                  onBlur={handlePromptBlur}
                  onKeyDown={handleKeyDown}
                  placeholder={agentConfig.isLoading ? "Loading agent prompt..." : "Enter agent prompt here..."}
                  rows={10}
                  disabled={agentConfig.isLoading}
                  style={{
                    width: '100%',
                    padding: '12px 15px',
                    backgroundColor: 'rgba(20, 20, 40, 0.6)',
                    color: '#eaeaea',
                    border: '1px solid rgba(100, 100, 180, 0.4)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5',
                    resize: 'vertical',
                    transition: 'all 0.2s ease',
                    boxShadow: isPromptFocused ? '0 0 0 2px rgba(92, 122, 255, 0.4)' : 'none'
                  }}
                />
                
                <div className={styles.glowingEffect}></div>
              </div>
            </div>

            <button
              className={styles.generateButton}
              onClick={handleSubmit}
              disabled={!agentPrompt.trim() || agentConfig.isLoading || isSaving}
            >
              <span className={styles.generateButtonText}>
                {agentConfig.isLoading ? 'Loading...' : isSaving ? 'Saving...' : 'Save Prompt'}
              </span>
              <div className={styles.generateButtonGlow}></div>
            </button>
            
            <div className={styles.textBoxFooter}>
              <div className={`${styles.pulsingDot} ${agentConfig.isLoading || isSaving ? styles.loading : ''}`}></div>
              <span className={styles.statusText}>
                {agentConfig.isLoading ? 'Loading agent prompt...' : 
                 isSaving ? 'Saving changes...' :
                 agentConfig.error ? `Error: ${agentConfig.error}` : 
                 'Changes are saved when you click away or press Save Prompt'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AgentPrompt; 