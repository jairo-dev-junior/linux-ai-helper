import { Script } from '../../types/script';
import styles from './ScriptCard.module.css';

interface ScriptCardProps {
  script: Script;
  onExecute: (script: Script) => void;
  onView: (script: Script) => void;
  onDelete: (scriptId: string) => void;
  onViewExecution?: (script: Script) => void;
  isExecuting?: boolean;
}

export function ScriptCard({ script, onExecute, onView, onDelete, onViewExecution, isExecuting = false }: ScriptCardProps) {
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

  const handleViewExecutionClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que o clique no botão abra o modal
    if (isExecuting && onViewExecution) {
      onViewExecution(script);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Evitar que o clique no botão abra o modal
    if (!isExecuting) {
      if (window.confirm(`Tem certeza que deseja excluir o script "${script.title}"?`)) {
        onDelete(script.id);
      }
    }
  };

  return (
    <div className={styles.card} onClick={handleCardClick}>
      <button
        type="button"
        className={styles.deleteButton}
        onClick={handleDeleteClick}
        disabled={isExecuting}
        aria-label="Excluir script"
      >
        ×
      </button>
      <div className={styles.cardContent}>
        <h3 className={styles.title}>{script.title}</h3>
        <p className={styles.description}>{script.description}</p>
      </div>
      <div className={styles.cardFooter}>
        {isExecuting && onViewExecution ? (
          <button
            type="button"
            className={styles.viewExecutionButton}
            onClick={handleViewExecutionClick}
          >
            Ver Execução
          </button>
        ) : (
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
        )}
      </div>
    </div>
  );
}

