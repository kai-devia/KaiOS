import { useState, useContext } from 'react';
import { AgentContext } from '../../../context/AgentContext';
import AgentPicker from '../../Navigation/AgentPicker';
import styles from './Header.module.css';
import LiveBadge from './LiveBadge';
import { useAuth } from '../../../hooks/useAuth';

export default function Header({ isConnected, onLogout }) {
  const { logout } = useAuth();
  const { agentEmoji, agentName } = useContext(AgentContext);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  const handleLogout = onLogout || logout;

  return (
    <header className={styles.header}>
      {/* Title + agent selector — only visible on mobile (desktop uses NavSidebar logo) */}
      <div className={styles.titleSection}>
        <button
          className={styles.titleBtn}
          onClick={() => setShowAgentPicker(!showAgentPicker)}
          title="Seleccionar agente"
        >
          <img src="/kai-avatar.svg" alt="KAI" className={styles.logo} width="24" height="24" />
          <span className={styles.emoji}>{agentEmoji}</span>
          <span className={styles.text}>{agentName}</span>
        </button>
        {showAgentPicker && (
          <div className={styles.pickerContainer}>
            <AgentPicker onClose={() => setShowAgentPicker(false)} />
          </div>
        )}
      </div>

      <div className={styles.actions}>
        <LiveBadge isConnected={isConnected} />
        <button
          className={styles.logoutBtn}
          onClick={handleLogout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
