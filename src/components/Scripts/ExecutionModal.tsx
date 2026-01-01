import { useEffect, useRef } from 'react';
import { Script } from '../../types/script';
import { ScriptExecution } from '../../types/script';
import styles from './ExecutionModal.module.css';

interface ExecutionModalProps {
  script: Script | null;
  execution: ScriptExecution | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ExecutionModal({ script, execution, isOpen, onClose }: ExecutionModalProps) {
  const logsEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [isOpen, execution?.logs]);

  if (!isOpen || !script) {
    return null;
  }

  const getStatusIcon = () => {
    if (!execution) return '⏳';
    switch (execution.status) {
      case 'running':
        return '⏳';
      case 'success':
        return '✅';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusText = () => {
    if (!execution) return 'Preparando...';
    switch (execution.status) {
      case 'running':
        return 'Executando...';
      case 'success':
        return 'Concluído com sucesso';
      case 'error':
        return 'Erro na execução';
      default:
        return 'Preparando...';
    }
  };

  const handleCopyLogs = () => {
    if (execution?.logs) {
      const logsText = execution.logs.join('\n');
      navigator.clipboard.writeText(logsText).then(() => {
        // Feedback visual pode ser adicionado aqui
      });
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerContent}>
            <h2 className={styles.title}>{script.title}</h2>
            <div className={styles.status}>
              <span className={styles.statusIcon}>{getStatusIcon()}</span>
              <span className={styles.statusText}>{getStatusText()}</span>
            </div>
          </div>
          <button
            type="button"
            className={styles.closeButton}
            onClick={onClose}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.logsContainer}>
          {execution && execution.logs.length > 0 ? (
            <>
              {execution.logs.map((log, index) => {
                // Pular linhas completamente vazias
                if (!log.trim() && log === '') {
                  return (
                    <div key={index} className={styles.logLine} style={{ minHeight: '0.5rem', padding: '0.25rem 0' }}>
                      {' '}
                    </div>
                  );
                }

                // Tentar identificar se é stderr (erro)
                const logLower = log.toLowerCase();
                const isError = logLower.includes('error') || 
                               logLower.includes('erro') ||
                               logLower.includes('failed') ||
                               logLower.includes('falhou') ||
                               logLower.includes('exception') ||
                               logLower.includes('traceback') ||
                               (execution.status === 'error' && index === execution.logs.length - 1);
                
                return (
                  <div
                    key={index}
                    className={`${styles.logLine} ${isError ? styles.logError : styles.logStdout}`}
                  >
                    {log || '\u00A0'}
                  </div>
                );
              })}
              <div ref={logsEndRef} />
            </>
          ) : (
            <div className={styles.emptyLogs}>
              {execution?.status === 'running' ? (
                <div className={styles.loadingIndicator}>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                  <span className={styles.loadingDot}></span>
                </div>
              ) : (
                <p>Nenhum log disponível</p>
              )}
            </div>
          )}
        </div>

        <div className={styles.footer}>
          {execution && execution.logs.length > 0 && (
            <button
              type="button"
              className={styles.copyButton}
              onClick={handleCopyLogs}
            >
              Copiar Logs
            </button>
          )}
          <button
            type="button"
            className={styles.closeButtonFooter}
            onClick={onClose}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
}

