import { ScriptExecution } from '../types/script';
import { Script } from '../types/script';

/**
 * Executa um script no sistema via Electron IPC
 * Retorna um stream de logs em tempo real
 */
export async function executeScript(
  script: Script,
  onLog: (log: string, isError: boolean) => void
): Promise<ScriptExecution> {
  const execution: ScriptExecution = {
    scriptId: script.id,
    status: 'running',
    logs: [],
    startTime: new Date(),
  };

  try {
    if (typeof window === 'undefined' || !window.ipcRenderer) {
      throw new Error('IPC não disponível. Certifique-se de que está executando no Electron.');
    }

    // Enviar script para execução via IPC
    const result = await window.ipcRenderer.invoke('execute-script', {
      scriptId: script.id,
      content: script.content,
    });

    // Processar logs recebidos
    if (result.logs && Array.isArray(result.logs)) {
      result.logs.forEach((log: { text: string; isError: boolean }) => {
        execution.logs.push(log.text);
        onLog(log.text, log.isError);
      });
    }

    execution.status = result.exitCode === 0 ? 'success' : 'error';
    execution.endTime = new Date();
    execution.exitCode = result.exitCode;

    return execution;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    execution.logs.push(`Erro: ${errorMessage}`);
    execution.status = 'error';
    execution.endTime = new Date();
    execution.exitCode = 1;
    onLog(`Erro: ${errorMessage}`, true);
    return execution;
  }
}

/**
 * Valida se um script é seguro para execução
 * (Implementação básica - pode ser expandida)
 */
export function validateScript(script: Script): { valid: boolean; error?: string } {
  // Verificar se o script não está vazio
  if (!script.content || script.content.trim().length === 0) {
    return { valid: false, error: 'Script vazio' };
  }

  // Lista de comandos perigosos (pode ser expandida)
  const dangerousCommands = [
    'rm -rf /',
    'format',
    'dd if=',
    'mkfs',
  ];

  const contentLower = script.content.toLowerCase();
  for (const dangerous of dangerousCommands) {
    if (contentLower.includes(dangerous)) {
      return { valid: false, error: `Comando perigoso detectado: ${dangerous}` };
    }
  }

  return { valid: true };
}

