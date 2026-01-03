import { ScriptExecution } from '../types/script';
import { Script } from '../types/script';

/**
 * Executa um script no sistema via Electron IPC
 * Retorna um stream de logs em tempo real
 */
export async function executeScript(
  script: Script,
  onLog: (log: string, isError: boolean) => void,
  onPasswordRequest?: () => Promise<string>
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

    // Promise para aguardar finalização
    let finishResolver: ((exitCode: number) => void) | null = null;
    const finishPromise = new Promise<number>((resolve) => {
      finishResolver = resolve;
    });

    // Configurar listener para logs em tempo real
    const logListener = (_event: any, { scriptId: logScriptId, log, isError }: { scriptId: string; log: string; isError: boolean }) => {
      if (logScriptId === script.id) {
        execution.logs.push(log);
        onLog(log, isError);
      }
    };

    // Configurar listener para quando o script terminar
    const finishListener = (_event: any, { scriptId: finishScriptId, exitCode: code }: { scriptId: string; exitCode: number }) => {
      if (finishScriptId === script.id && finishResolver) {
        execution.status = code === 0 ? 'success' : 'error';
        execution.endTime = new Date();
        execution.exitCode = code;
        finishResolver(code);
      }
    };

    // Se o script precisar de senha, configurar listener
    let passwordListener: ((event: any, data: { scriptId: string }) => void) | null = null;
    if (onPasswordRequest) {
      passwordListener = async (_event: any, { scriptId: requestingScriptId }: { scriptId: string }) => {
        if (requestingScriptId === script.id) {
          const password = await onPasswordRequest();
          // Enviar senha de volta para o processo principal
          await window.ipcRenderer.invoke('provide-password', {
            scriptId: script.id,
            password,
          });
        }
      };
      window.ipcRenderer.on('request-password', passwordListener);
    }

    // Registrar listeners
    window.ipcRenderer.on('script-log', logListener);
    window.ipcRenderer.on('script-finish', finishListener);

    // Limpar listeners quando terminar
    const cleanup = () => {
      window.ipcRenderer.off('script-log', logListener);
      window.ipcRenderer.off('script-finish', finishListener);
      if (passwordListener) {
        window.ipcRenderer.off('request-password', passwordListener);
      }
    };

    // Limpar após timeout
    const timeoutId = setTimeout(() => {
      cleanup();
      if (finishResolver) {
        finishResolver(124); // Timeout exit code
      }
    }, 300000); // 5 minutos

    // Enviar script para execução via IPC
    await window.ipcRenderer.invoke('execute-script', {
      scriptId: script.id,
      content: script.content,
      onPasswordRequest: !!onPasswordRequest,
    });

    // Aguardar finalização
    await finishPromise;

    // Limpar timeout e listeners
    clearTimeout(timeoutId);
    cleanup();

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

