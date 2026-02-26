import { useState, useCallback, useContext, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { AgentContext } from '../../context/AgentContext';
import Header from './Header/Header';
import NavSidebar from '../Navigation/NavSidebar';
import BottomNav from '../Navigation/BottomNav';
import { useFiles } from '../../hooks/useFiles';
import { useWebSocket } from '../../hooks/useWebSocket';
import { useToast } from '../../hooks/useToast';
import { logout } from '../../api/client';
import styles from './Layout.module.css';

// Detect mobile viewport
function useIsMobile() {
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
}

export default function Layout() {
  const [navCollapsed, setNavCollapsed] = useState(true); // starts collapsed (icon-only)
  const { agentId, agentName } = useContext(AgentContext);
  const { tree, files, refresh } = useFiles(agentId);
  const { toasts, success, info, error } = useToast();
  
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Mobile: redirect to /chat if on any other route
  useEffect(() => {
    if (isMobile && !location.pathname.startsWith('/chat')) {
      navigate('/chat', { replace: true });
    }
  }, [isMobile, location.pathname, navigate]);

  const handleWsMessage = useCallback((msg) => {
    if (msg.type === 'file_changed') {
      info(`📝 ${msg.path} actualizado`);
      refresh();
    } else if (msg.type === 'file_added') {
      info(`➕ ${msg.path} creado`);
      refresh();
    } else if (msg.type === 'file_deleted') {
      info(`🗑️ ${msg.path} eliminado`);
      refresh();
    }
  }, [info, refresh]);

  const { isConnected } = useWebSocket(handleWsMessage);

  return (
    <div className={styles.layout} data-mode={agentName}>
      {/* Main navigation sidebar (desktop) */}
      <NavSidebar
        collapsed={navCollapsed}
        onToggle={() => setNavCollapsed((v) => !v)}
      />

      {/* Right side: header + content */}
      <div className={styles.main}>
        <Header
          isConnected={isConnected}
          onLogout={logout}
        />

        <main className={styles.content}>
          <Outlet
            context={{
              files,
              tree,
              refresh,
              success,
              error,
              info,
              basePath: '',
            }}
          />
        </main>
      </div>

      {/* Mobile bottom navigation */}
      <BottomNav />

      {/* Toast container */}
      <div className="toast-container">
        {toasts.map((t) => (
          <div key={t.id} className={`toast ${t.type}`}>
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
