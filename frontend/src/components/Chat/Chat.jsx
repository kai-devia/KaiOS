import styles from './Chat.module.css';

export default function Chat() {
  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {/* Header */}
        <div className={styles.chatHeader}>
          <span className={styles.chatHeaderIcon}>💬</span>
          <div>
            <h1 className={styles.chatTitle}>Chat directo con Kai</h1>
            <p className={styles.chatSubtitle}>Canal de conversación privado</p>
          </div>
        </div>

        {/* Messages area */}
        <div className={styles.messagesArea}>
          <div className={styles.comingSoon}>
            <div className={styles.comingSoonInner}>
              <span className={styles.comingSoonIcon}>🚀</span>
              <h2>Próximamente...</h2>
              <p>
                Esta sección reemplazará Telegram para conversaciones más cómodas,
                soporte de audios largos y escritura rica.
              </p>
              <ul className={styles.featureList}>
                <li>🎤 Mensajes de voz</li>
                <li>✍️ Markdown en tiempo real</li>
                <li>📎 Archivos adjuntos</li>
                <li>🔔 Notificaciones push</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Input area (disabled placeholder) */}
        <div className={styles.inputArea}>
          <input
            type="text"
            className={styles.messageInput}
            placeholder="Escribe un mensaje..."
            disabled
            aria-label="Área de mensaje (próximamente)"
          />
          <div className={styles.inputActions}>
            <button className={styles.micBtn} disabled title="Audio (próximamente)">
              🎤
            </button>
            <button className={styles.sendBtn} disabled title="Enviar (próximamente)">
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
