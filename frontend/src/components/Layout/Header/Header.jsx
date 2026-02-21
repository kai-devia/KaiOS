import styles from './Header.module.css';
import LiveBadge from './LiveBadge';
import { useAuth } from '../../../hooks/useAuth';

export default function Header({ isConnected, onMenuClick, showMenuButton }) {
  const { logout } = useAuth();

  return (
    <header className={styles.header}>
      {showMenuButton && (
        <button className={styles.menuButton} onClick={onMenuClick} aria-label="Menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      )}
      <div className={styles.title}>
        <span className={styles.logo}>🧠</span>
        <span className={styles.text}>KAI DOC</span>
      </div>

      <div className={styles.actions}>
        <LiveBadge isConnected={isConnected} />
        <button
          className={styles.logoutBtn}
          onClick={logout}
          title="Cerrar sesión"
          aria-label="Cerrar sesión"
        >
          Salir
        </button>
      </div>
    </header>
  );
}
