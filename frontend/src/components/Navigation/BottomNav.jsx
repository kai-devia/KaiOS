import { useContext } from 'react';
import { AgentContext } from '../../context/AgentContext';
import styles from './BottomNav.module.css';

// En móvil solo Chat — la barra inferior es solo para cambiar de agente
export default function BottomNav() {
  const { agents, agentId, setAgent, modeColors } = useContext(AgentContext);
  
  return (
    <nav className={styles.bottomNav}>
      <div className={styles.modeSelector}>
        {agents.map((agent) => (
          <button
            key={agent.id}
            className={`${styles.modeBtn} ${agentId === agent.id ? styles.modeBtnActive : ''}`}
            style={{ 
              '--mode-color': modeColors[agent.name] || '#00d4aa',
              borderColor: agentId === agent.id ? (modeColors[agent.name] || '#00d4aa') : 'transparent'
            }}
            onClick={() => setAgent(agent.id)}
          >
            {agent.name}
          </button>
        ))}
      </div>
    </nav>
  );
}
