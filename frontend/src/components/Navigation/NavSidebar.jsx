import { useContext, useState, useRef, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { Monitor, MessageSquare, CheckSquare, Activity, Brain, Lock } from 'lucide-react';
import { AgentContext } from '../../context/AgentContext';
import styles from './NavSidebar.module.css';

function ColorDot({ color, onChange }) {
  const inputRef = useRef(null);
  return (
    <span
      className={styles.colorDot}
      style={{ background: color }}
      title="Cambiar color del modo"
      onClick={(e) => { e.stopPropagation(); inputRef.current?.click(); }}
    >
      <input
        ref={inputRef}
        type="color"
        value={color}
        className={styles.colorInput}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.stopPropagation()}
      />
    </span>
  );
}

const NAV_ITEMS = [
  { to: '/sistema', icon: Monitor,       label: 'Sistema' },
  { to: '/chat',    icon: MessageSquare, label: 'Chat' },
  { to: '/tasks',   icon: CheckSquare,   label: 'Tasks' },
  { to: '/pulse',   icon: Activity,      label: 'Pulse' },
  { to: '/mente',   icon: Brain,         label: 'Mente' },
  { to: '/vault',   icon: Lock,          label: 'Vault' },
];

export default function NavSidebar({ collapsed, onToggle }) {
  const { agentId, agentName, setAgent, agents, modeColors, setModeColor } = useContext(AgentContext);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0 });
  const triggerRef = useRef(null);
  const dropdownRef = useRef(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        triggerRef.current && !triggerRef.current.contains(e.target)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTriggerClick = () => {
    if (!dropdownOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      setDropdownPos({
        top: rect.top,
        left: rect.right + 8, // 8px gap to the right of sidebar
      });
    }
    setDropdownOpen(o => !o);
  };

  return (
    <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''}`}>

      {/* Logo section — clicking K or Kai always toggles */}
      <div className={styles.logoSection}>
        <button
          className={styles.logoBtn}
          onClick={onToggle}
          title={collapsed ? 'Expandir menú' : 'Colapsar menú'}
          aria-label="Toggle navigation"
        >
          <img src="/kai-avatar.svg" alt="KAI" width="26" height="26" className={styles.logo} />
          {!collapsed && <span className={styles.logoText}>Kai</span>}
        </button>
      </div>

      {/* Mode selector */}
      <div
        className={styles.modeSection}
        ref={triggerRef}
      >
        <div
          className={styles.modeTrigger}
          onClick={handleTriggerClick}
          title={`Modo: ${agentName}`}
        >
          {collapsed
            ? <span className={styles.modeAbbr}>{agentName.toUpperCase()}</span>
            : <span className={styles.modeLabel}>{agentName}</span>
          }
        </div>

        {/* Expanded mode: inline dropdown */}
        {!collapsed && dropdownOpen && (
          <div className={styles.modeDropdown} ref={dropdownRef}>
            {agents.map((agent) => (
              <div
                key={agent.id}
                className={`${styles.modeOption} ${agentId === agent.id ? styles.modeOptionActive : ''}`}
                onClick={() => { setAgent(agent.id); setDropdownOpen(false); }}
              >
                <span className={styles.modeOptionLabel}>{agent.name}</span>
                <ColorDot
                  color={modeColors[agent.name] || '#00d4aa'}
                  onChange={(color) => setModeColor(agent.name, color)}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Collapsed mode: floating dropdown via position:fixed */}
      {collapsed && dropdownOpen && (
        <div
          className={styles.modeDropdownFixed}
          ref={dropdownRef}
          style={{ top: dropdownPos.top, left: dropdownPos.left }}
        >
          {agents.map((agent) => (
            <div
              key={agent.id}
              className={`${styles.modeOption} ${agentId === agent.id ? styles.modeOptionActive : ''}`}
              onClick={() => { setAgent(agent.id); setDropdownOpen(false); }}
            >
              <span className={styles.modeOptionLabel}>{agent.name}</span>
              <ColorDot
                color={modeColors[agent.name] || '#00d4aa'}
                onChange={(color) => setModeColor(agent.name, color)}
              />
            </div>
          ))}
        </div>
      )}

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
