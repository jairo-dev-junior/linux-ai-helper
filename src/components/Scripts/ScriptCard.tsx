import { Script } from '../../types/script';
import styles from './ScriptCard.module.css';

interface ScriptCardProps {
  script: Script;
  onExecute: (script: Script) => void;
  onView: (script: Script) => void;
  isExecuting?: boolean;
}

export function ScriptCard({ script, onExecute, onView, isExecuting = false }: ScriptCardProps) {
  const handleCardClick = () => {
    if (!isExecuting) {
      onView(script);
    }
  };

  const handleExecuteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que o clique no botão abra o modal
    if (!isExecuting) {
      onExecute(script);
    }
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <div className={styles.cardContent}>
        <h3 className={styles.title}>{script.title}</h3>
        <p className={styles.description}>{script.description}</p>
      </div>
      <div className={styles.cardFooter}>
        <button
          type="button"
          className={styles.executeButton}
          onClick={handleExecuteClick}
          disabled={isExecuting}
        >
          {isExecuting ? (
            <>
              <span className={styles.spinner}></span>
              Executando...
            </>
          ) : (
            'Executar'
          )}
        </button>
      </div>
    </div>
  );
}

