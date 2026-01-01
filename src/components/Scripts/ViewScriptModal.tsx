import { Script } from '../../types/script';
import styles from './ViewScriptModal.module.css';

interface ViewScriptModalProps {
  script: Script | null;
  isOpen: boolean;
  onClose: () => void;
  onExecute: (script: Script) => void;
}

export function ViewScriptModal({ script, isOpen, onClose, onExecute }: ViewScriptModalProps) {
  if (!isOpen || !script) {
    return null;
  }

  const handleExecute = () => {
    onExecute(script);
    onClose();
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <pre className={styles.codeBlock}>
            <code>{script.content}</code>
          </pre>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={onClose}
          >
            Fechar
          </button>
          <button
            type="button"
            className={styles.executeButton}
            onClick={handleExecute}
          >
            Executar Script
          </button>
        </div>
      </div>
    </div>
  );
}

