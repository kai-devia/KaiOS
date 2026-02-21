import styles from './FileTree.module.css';

function getFileIcon(name) {
  if (name === 'MEMORY.md') return '🧠';
  if (name === 'SOUL.md') return '✨';
  if (name === 'IDENTITY.md') return '🪪';
  if (name === 'USER.md') return '👤';
  if (name === 'TOOLS.md') return '🛠️';
  if (name === 'HEARTBEAT.md') return '💓';
  if (name === 'AGENTS.md') return '🤖';
  if (name === '_index.md') return '📑';
  if (/^\d{4}-\d{2}-\d{2}\.md$/.test(name)) return '📅';
  return '📄';
}

function matchesSearch(name, search) {
  if (!search) return true;
  return name.toLowerCase().includes(search.toLowerCase());
}

function hasMatchingChild(item, search) {
  if (!search) return true;
  if (item.type === 'file') return matchesSearch(item.name, search);
  return item.children?.some(child => hasMatchingChild(child, search));
}

export default function FileTree({ items, search, expanded, onToggle, onFileClick, currentPath, depth = 0 }) {
  if (!items?.length) return null;

  return (
    <ul className={styles.list} style={{ paddingLeft: depth * 12 }}>
      {items.filter(item => hasMatchingChild(item, search)).map(item => (
        <li key={item.path} className={styles.item}>
          {item.type === 'dir' ? (
            <>
              <button
                className={styles.folder}
                onClick={() => onToggle(item.path)}
              >
                <span className={`${styles.arrow} ${expanded[item.path] ? styles.expanded : ''}`}>
                  ▶
                </span>
                <span className={styles.folderIcon}>📁</span>
                <span className={styles.name}>{item.name}</span>
              </button>
              {expanded[item.path] && (
                <FileTree
                  items={item.children}
                  search={search}
                  expanded={expanded}
                  onToggle={onToggle}
                  onFileClick={onFileClick}
                  currentPath={currentPath}
                  depth={depth + 1}
                />
              )}
            </>
          ) : (
            <button
              className={`${styles.file} ${currentPath === item.path ? styles.active : ''}`}
              onClick={() => onFileClick(item.path)}
            >
              <span className={styles.fileIcon}>{getFileIcon(item.name)}</span>
              <span className={styles.name}>{item.name}</span>
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}
