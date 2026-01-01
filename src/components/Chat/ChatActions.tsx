import styles from './ChatActions.module.css';

interface ChatActionsProps {
  onSend: () => void;
  onCancel: () => void;
  canSend: boolean;
  isLoading: boolean;
}

export function ChatActions({ onSend, onCancel, canSend, isLoading }: ChatActionsProps) {
  if (isLoading) {
    return (
      <div className={styles.actionsContainer}>
        <button
          type="button"
          onClick={onCancel}
          className={`${styles.button} ${styles.cancelButton}`}
          aria-label="Cancelar requisição"
        >
          Cancelar
        </button>
      </div>
    );
  }

  return (
    <div className={styles.actionsContainer}>
      <button
        type="button"
        onClick={onSend}
        disabled={!canSend}
        className={`${styles.button} ${styles.sendButton}`}
        aria-label="Enviar mensagem"
      >
        Enviar
      </button>
    </div>
  );
}

