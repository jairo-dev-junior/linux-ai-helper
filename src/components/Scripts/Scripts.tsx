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
import { PasswordModal } from './PasswordModal';
import { executeScript, validateScript } from '../../utils/scriptExecutor';
import styles from './Scripts.module.css';

export function Scripts() {
  const { messages } = useChatContext();
  const { scripts, addScript, deleteScript } = useScripts({ messages });
  const { theme, toggleTheme } = useTheme();
  const [selectedScript, setSelectedScript] = useState<Script | null>(null);
  const [execution, setExecution] = useState<ScriptExecution | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [executingScriptId, setExecutingScriptId] = useState<string | null>(null);
  const [pendingPassword, setPendingPassword] = useState<((password: string) => void) | null>(null);

  const handleExecute = async (script: Script) => {
    // Validar script
    const validation = validateScript(script);
    if (!validation.valid) {
      alert(`Erro: ${validation.error}`);
      return;
    }

    setSelectedScript(script);
    setExecutingScriptId(script.id);
    // Não abrir o modal automaticamente, apenas quando o usuário clicar em "Ver Execução"
    setExecution({
      scriptId: script.id,
      status: 'running',
      logs: [],
      startTime: new Date(),
    });

    // Executar script
    const logs: string[] = [];
    const executionResult = await executeScript(
      script,
      (log, isError) => {
        logs.push(log);
        setExecution((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            logs: [...prev.logs, log],
          };
        });
      },
      async () => {
        // Função para solicitar senha
        return new Promise<string>((resolve) => {
          setPendingPassword(() => resolve);
          setIsPasswordModalOpen(true);
        });
      }
    );

    // Atualizar execução com resultado final
    setExecution((prev) => {
      if (!prev || prev.scriptId !== script.id) return prev;
      return {
        ...prev,
        status: executionResult.status,
        endTime: executionResult.endTime,
        exitCode: executionResult.exitCode,
      };
    });
    setExecutingScriptId(null);
  };

  const handleViewExecution = (script: Script) => {
    setSelectedScript(script);
    setIsModalOpen(true);
  };

  const handlePasswordConfirm = (password: string) => {
    setIsPasswordModalOpen(false);
    if (pendingPassword) {
      pendingPassword(password);
      setPendingPassword(null);
    }
  };

  const handlePasswordCancel = () => {
    setIsPasswordModalOpen(false);
    if (pendingPassword) {
      pendingPassword(''); // Enviar senha vazia para cancelar
      setPendingPassword(null);
    }
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

  const handleDeleteScript = (scriptId: string) => {
    deleteScript(scriptId);
  };

  return (
    <div className={styles.scriptsContainer}>
      <div className={styles.watermark}></div>
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <img src="/logo-app.png" alt="Logo" className={styles.logo} />
          <h1 className={styles.title}>Scripts</h1>
        </div>
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
                onDelete={handleDeleteScript}
                onViewExecution={handleViewExecution}
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

      <PasswordModal
        isOpen={isPasswordModalOpen}
        onConfirm={handlePasswordConfirm}
        onCancel={handlePasswordCancel}
      />
    </div>
  );
}

