import { useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Monitor, MessageSquare, CheckSquare, Activity, Brain, Lock, ChevronLeft, ChevronRight } from 'lucide-react';
import { AgentContext } from '../../context/AgentContext';
import AgentPicker from './AgentPicker';
import styles from './NavSidebar.module.css';

const NAV_ITEMS = [
  { to: '/sistema', icon: Monitor,       label: 'Sistema' },
  { to: '/chat',    icon: MessageSquare, label: 'Chat' },
  { to: '/tasks',   icon: CheckSquare,   label: 'Tasks' },
  { to: '/pulse',   icon: Activity,      label: 'Pulse' },
  { to: '/mente',   icon: Brain,         label: 'Mente' },
  { to: '/vault',   icon: Lock,          label: 'Vault' },
];

export default function NavSidebar({ collapsed, onToggle }) {
  const { agentEmoji, agentName } = useContext(AgentContext);
  const [showAgentPicker, setShowAgentPicker] = useState(false);

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>
      {/* Logo button — opens agent picker */}
      <div className={styles.logoSection}>
        <button
          className={styles.logoBtn}
          onClick={() => setShowAgentPicker(!showAgentPicker)}
          title="Seleccionar agente"
          aria-label="Seleccionar agente"
        >
          <img src="/kai-avatar.svg" alt="KAI" width="28" height="28" className={styles.logo} />
          {!collapsed && (
            <>
              <span className={styles.agentEmoji}>{agentEmoji}</span>
              <span className={styles.logoText}>{agentName}</span>
            </>
          )}
        </button>

        {/* Collapse/expand button */}
        <button
          className={styles.toggleBtn}
          onClick={onToggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-label="Toggle navigation"
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        {/* Agent picker popover */}
        {showAgentPicker && (
          <div className={styles.pickerContainer}>
            <AgentPicker onClose={() => setShowAgentPicker(false)} />
          </div>
        )}
      </div>

      <nav className={styles.nav}>
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `${styles.navItem} ${isActive ? styles.active : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <span className={styles.icon}>
              <Icon size={18} strokeWidth={1.5} />
            </span>
            {!collapsed && <span className={styles.label}>{label}</span>}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
