import type { StoredUniverse } from '../../types/universe';
import styles from './HistoryDrawer.module.css';

interface HistoryDrawerProps {
  open: boolean;
  items: StoredUniverse[];
  onClose: () => void;
  onRestore: (item: StoredUniverse) => void;
  onClear: () => void;
}

function dateLabel(value: string) {
  try {
    return new Intl.DateTimeFormat('zh-CN', {
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

export function HistoryDrawer({ open, items, onClose, onRestore, onClear }: HistoryDrawerProps) {
  if (!open) return null;
  return (
    <div className={styles.backdrop} role="presentation" onMouseDown={onClose}>
      <section
        className={styles.drawer}
        role="dialog"
        aria-modal="true"
        aria-labelledby="archive-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p>LOCAL ARCHIVE</p>
            <h2 id="archive-title">本地宇宙档案</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭本地档案">
            ×
          </button>
        </header>
        {items.length === 0 ? (
          <div className={styles.empty}>
            <span aria-hidden="true">○</span>
            <p>这里还没有被保存的宇宙。</p>
            <small>生成结果后，它会只保存在这台设备上。</small>
          </div>
        ) : (
          <ol className={styles.list}>
            {items.map((item) => (
              <li key={`${item.config.catalogId}-${item.savedAt}`}>
                <button type="button" onClick={() => onRestore(item)}>
                  <span>{item.config.catalogId}</span>
                  <strong>{item.config.universeType}</strong>
                  <q>{item.config.text}</q>
                  <time>{dateLabel(item.savedAt)}</time>
                </button>
              </li>
            ))}
          </ol>
        )}
        <footer>
          <span>最多保存 20 条 · 不会上传</span>
          {items.length > 0 && (
            <button type="button" onClick={onClear}>
              清空全部
            </button>
          )}
        </footer>
      </section>
    </div>
  );
}
