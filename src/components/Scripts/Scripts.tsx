import { useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import { useScripts } from '../../hooks/useScripts';
import { useTheme } from '../Theme/useTheme';
import { Script } from '../../types/script';
import { ScriptExecution } from '../../types/script';
import { ScriptCard } from './ScriptCard';
import { ExecutionModal } from './ExecutionModal';
import { ViewScriptModal } from './ViewScriptModal';
import { AddScriptModal } from './AddScriptModal';
import { executeScript, validateScript } from '../../utils/scriptExecutor';
import styles from './Scripts.module.css';

export function Scripts() {
  const { messages } = useChatContext();
  const { scripts, addScript } = useScripts({ messages });
  const { theme, toggleTheme } = useTheme();
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [execution, setExecution] = useState<ScriptExecution | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [executingScriptId, setExecutingScriptId] = useState<string | null>(null);

  const handleExecute = async (script: Script) => {
    // Validar script
    const validation = validateScript(script);
    if (!validation.valid) {
      alert(`Erro: ${validation.error}`);
      return;
    }

    setSelectedScript(script);
    setExecutingScriptId(script.id);
    setIsModalOpen(true);
    setExecution({
      scriptId: script.id,
      status: 'running',
      logs: [],
      startTime: new Date(),
    });

    // Executar script
    const logs: string[] = [];
    const executionResult = await executeScript(script, (log, isError) => {
      logs.push(log);
      setExecution((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          logs: [...logs],
        };
      });
    });

    setExecution(executionResult);
    setExecutingScriptId(null);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedScript(null);
    setExecution(null);
  };

  const handleAddScript = (scriptData: Omit<Script, 'id' | 'createdAt' | 'messageId'>) => {
    addScript(scriptData);
  };

  const handleViewScript = (script: Script) => {
    setSelectedScript(script);
    setIsViewModalOpen(true);
  };

  const handleCloseViewModal = () => {
    setIsViewModalOpen(false);
    setSelectedScript(null);
  };

  return (
    <div className={styles.scriptsContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Scripts</h1>
        <div className={styles.headerActions}>
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={styles.addButton}
            aria-label="Adicionar script"
          >
            + Adicionar Script
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            className={styles.themeToggle}
            aria-label="Alternar tema"
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </div>

      <div className={styles.content}>
        {scripts.length === 0 ? (
          <div className={styles.emptyState}>
            <p className={styles.emptyTitle}>Nenhum script encontrado</p>
            <p className={styles.emptyDescription}>
              Scripts gerados pela IA durante as conversas aparecerão aqui.
            </p>
          </div>
        ) : (
          <div className={styles.scriptsGrid}>
            {scripts.map((script) => (
              <ScriptCard
                key={script.id}
                script={script}
                onExecute={handleExecute}
                onView={handleViewScript}
                isExecuting={executingScriptId === script.id}
              />
            ))}
          </div>
        )}
      </div>

      <ExecutionModal
        script={selectedScript}
        execution={execution}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />

      <ViewScriptModal
        script={selectedScript}
        isOpen={isViewModalOpen}
        onClose={handleCloseViewModal}
        onExecute={handleExecute}
      />

      <AddScriptModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddScript}
      />
    </div>
  );
}

