import React, { useState } from 'react';
import styles from './AgentSelector.module.css';

type AgentType = 'Lite' | 'Medium' | 'High';

interface AgentSelectorProps {
  onAgentChange?: (agent: AgentType) => void;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  onAgentChange
}) => {
  const [selectedAgent, setSelectedAgent] = useState<AgentType>('Medium');

  const agents = [
    { 
      id: 'Lite', 
      name: 'Lite', 
      description: '½× Price', 
      enabled: false 
    },
    { 
      id: 'Medium', 
      name: 'Medium', 
      description: 'Regular', 
      enabled: true 
    },
    { 
      id: 'High', 
      name: 'High', 
      description: '3× Price', 
      enabled: false 
    }
  ];

  const handleAgentChange = (agent: AgentType) => {
    if (agents.find(a => a.id === agent)?.enabled) {
      setSelectedAgent(agent);
      if (onAgentChange) {
        onAgentChange(agent);
      }
    }
  };

  return (
    <div className={styles.agentSelectorContainer}>
      <div className={styles.agentSelectorLabel}>Agent Type:</div>
      <div className={styles.agentOptions}>
        {agents.map((agent) => (
          <div 
            key={agent.id}
            className={`${styles.agentOption} ${selectedAgent === agent.id ? styles.selected : ''} ${!agent.enabled ? styles.disabled : ''}`}
            onClick={() => agent.enabled && handleAgentChange(agent.id as AgentType)}
          >
            <div className={styles.agentName}>{agent.name}</div>
            <div className={styles.agentDescription}>{agent.description}</div>
            
            {!agent.enabled && (
              <div className={styles.comingSoonBadge}>Coming Soon</div>
            )}
            
            {selectedAgent === agent.id && (
              <div className={styles.selectionIndicator}>
                <div className={styles.selectionDot}></div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default AgentSelector; 