import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'os'
import si from 'systeminformation'
import { exec, spawn } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

// Armazenar processos em execução e callbacks de senha
const runningScripts = new Map<string, {
  process: any;
  passwordResolver?: (password: string) => void;
  logs: Array<{ text: string; isError: boolean }>;
}>()

const require = createRequire(import.meta.url)
const __dirname = path.dirname(fileURLToPath(import.meta.url))

process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null

function createWindow() {
  win = new BrowserWindow({
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  // Abrir DevTools automaticamente em modo de desenvolvimento
  if (VITE_DEV_SERVER_URL) {
    win.webContents.openDevTools()
  }

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
    win = null
  }
})

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Funções auxiliares para formatação
function formatBytes(bytes: number): string {
  const gb = bytes / (1024 * 1024 * 1024);
  if (gb >= 1) {
    return `${gb.toFixed(2)} GB`;
  }
  const mb = bytes / (1024 * 1024);
  if (mb >= 1) {
    return `${mb.toFixed(2)} MB`;
  }
  return `${(bytes / 1024).toFixed(2)} KB`;
}

function formatUptime(seconds: number): string {
  const dias = Math.floor(seconds / 86400);
  const horas = Math.floor((seconds % 86400) / 3600);
  const minutos = Math.floor((seconds % 3600) / 60);
  
  if (dias > 0) {
    return `${dias}d ${horas}h ${minutos}m`;
  }
  if (horas > 0) {
    return `${horas}h ${minutos}m`;
  }
  return `${minutos}m`;
}

// Handler IPC para obter dados do sistema
ipcMain.handle('get-system-data', async () => {
  try {
    // Obter dados do sistema usando systeminformation
    const [systemInfo, osInfo, cpuInfo, memInfo, networkInterfaces, timeInfo] = await Promise.all([
      si.system(),
      si.osInfo(),
      si.cpu(),
      si.mem(),
      si.networkInterfaces(),
      si.time(),
    ]);

    const totalMemory = memInfo.total;
    const freeMemory = memInfo.free;
    const usedMemory = memInfo.used;
    const memoryUsagePercent = (usedMemory / totalMemory) * 100;

    // Processar interfaces de rede
    let mainIP = 'N/A';
    const interfaces: Array<{ nome: string; endereco: string; familia: string }> = [];

    for (const netInterface of networkInterfaces) {
      if (netInterface.ip4 && !netInterface.internal) {
        if (mainIP === 'N/A') {
          mainIP = netInterface.ip4;
        }
        interfaces.push({
          nome: netInterface.iface,
          endereco: netInterface.ip4,
          familia: 'IPv4',
        });
      }
      if (netInterface.ip6 && !netInterface.internal) {
        interfaces.push({
          nome: netInterface.iface,
          endereco: netInterface.ip6,
          familia: 'IPv6',
        });
      }
    }

    const diagnostic = {
      sistemaOperacional: {
        tipo: osInfo.platform || 'Desconhecido',
        plataforma: osInfo.platform || 'Desconhecido',
        arquitetura: os.arch(),
        versao: osInfo.distro ? `${osInfo.distro} ${osInfo.release || ''}`.trim() : osInfo.release || 'Desconhecido',
        release: osInfo.kernel || osInfo.release || 'Desconhecido',
        hostname: osInfo.hostname || 'Desconhecido',
      },
      processador: {
        modelo: cpuInfo.manufacturer && cpuInfo.brand ? `${cpuInfo.manufacturer} ${cpuInfo.brand}` : cpuInfo.brand || 'Desconhecido',
        numeroCPUs: cpuInfo.physicalCores || cpuInfo.cores || 0,
        velocidadeMedia: cpuInfo.speed ? Math.round(cpuInfo.speed) : 0,
      },
      memoria: {
        total: formatBytes(totalMemory),
        livre: formatBytes(freeMemory),
        usada: formatBytes(usedMemory),
        percentualUsado: Math.round(memoryUsagePercent * 100) / 100,
      },
      armazenamento: {
        diretorioHome: os.homedir(),
        diretorioTmp: os.tmpdir(),
      },
      sistema: {
        tempoAtividade: formatUptime(timeInfo.uptime || 0),
        usuario: os.userInfo().username,
        enderecoIP: mainIP,
      },
      interfacesRede: interfaces,
    };

    console.log("Diagnóstico do sistema:", diagnostic);
    return diagnostic;
  } catch (error) {
    console.error("Erro ao obter dados do sistema:", error);
    throw error;
  }
});

// Handler IPC para executar scripts
ipcMain.handle('execute-script', async (event, { scriptId, content, onPasswordRequest }) => {
  try {
    console.log(`Executando script ${scriptId}...`);
    
    const logs: Array<{ text: string; isError: boolean }> = [];
    let exitCode = 0;

    return new Promise((resolve) => {
      // Verificar se o script contém sudo e modificar para usar -S (ler senha do stdin)
      let modifiedContent = content;
      if (onPasswordRequest && content.toLowerCase().includes('sudo')) {
        // Substituir 'sudo ' por 'sudo -S ' para fazer o sudo ler do stdin
        // Mas apenas se não já tiver a flag -S
        modifiedContent = content.replace(/\bsudo\s+(?!-S)/g, 'sudo -S ');
        console.log(`[${scriptId}] Script modificado para usar sudo -S`);
      }
      
      // Usar spawn para poder interagir com o processo
      const shell = process.platform === 'win32' ? 'cmd.exe' : '/bin/bash';
      const args = process.platform === 'win32' ? ['/c', modifiedContent] : ['-c', modifiedContent];
      
      const childProcess = spawn(shell, args, {
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: false,
        // Garantir que o stdin esteja disponível
        detached: false,
      });
      
      // Garantir que o stdin não seja fechado automaticamente
      if (childProcess.stdin) {
        childProcess.stdin.setDefaultEncoding('utf8');
      }

      // Armazenar referência do processo
      const hasSudoModified = modifiedContent !== content; // Se foi modificado para usar sudo -S
      runningScripts.set(scriptId, {
        process: childProcess,
        logs,
        hasSudoModified, // Flag para indicar que foi modificado
      });

      let stdoutBuffer = '';
      let stderrBuffer = '';

      // Função auxiliar para verificar se precisa de senha
      const needsPassword = (text: string): boolean => {
        const lowerText = text.toLowerCase();
        // Padrões mais específicos para sudo
        return (
          lowerText.includes('[sudo] password for') ||
          lowerText.match(/\[sudo\]\s+password\s+for/i) !== null ||
          (lowerText.includes('password') && lowerText.includes('sudo')) ||
          lowerText.trim().endsWith('password:') ||
          lowerText.trim().endsWith('senha:') ||
          lowerText.match(/password\s*:\s*$/i) !== null ||
          lowerText.match(/senha\s*:\s*$/i) !== null
        );
      };

      // Flag para controlar solicitações de senha
      let passwordRequested = false;
      let passwordProvided = false;

      // Capturar stdout
      childProcess.stdout?.on('data', (data: Buffer) => {
        const text = data.toString();
        stdoutBuffer += text;
        
        // Verificar se precisa de senha (sudo geralmente mostra no stderr, mas verificamos ambos)
        if (onPasswordRequest && !passwordRequested && needsPassword(text)) {
          passwordRequested = true;
          passwordProvided = false;
          // Solicitar senha ao renderer
          event.sender.send('request-password', { scriptId });
        } else if (!passwordRequested || passwordProvided) {
          // Adicionar linhas aos logs e enviar em tempo real
          const lines = text.split('\n');
          lines.forEach((line) => {
            if (line.trim()) {
              logs.push({ text: line, isError: false });
              // Enviar log em tempo real
              event.sender.send('script-log', { scriptId, log: line, isError: false });
            }
          });
        }
      });

      // Capturar stderr (sudo geralmente mostra o prompt de senha aqui)
      childProcess.stderr?.on('data', (data: Buffer) => {
        const text = data.toString();
        stderrBuffer += text;
        
        // Verificar se precisa de senha (sudo mostra o prompt no stderr)
        if (onPasswordRequest && !passwordRequested && needsPassword(text)) {
          passwordRequested = true;
          passwordProvided = false;
          console.log(`[${scriptId}] Prompt de senha detectado no stderr:`, text.trim());
          // Solicitar senha ao renderer
          event.sender.send('request-password', { scriptId });
          // Não adicionar o prompt de senha aos logs
          return;
        } else if (!passwordRequested || passwordProvided) {
          // Adicionar linhas aos logs e enviar em tempo real
          const lines = text.split('\n');
          lines.forEach((line) => {
            // Filtrar prompts de senha
            if (line.trim() && !needsPassword(line)) {
              logs.push({ text: line, isError: true });
              // Enviar log em tempo real
              event.sender.send('script-log', { scriptId, log: line, isError: true });
            }
          });
        }
      });
      
      // Se o script contém sudo, podemos precisar aguardar um pouco antes de enviar a senha
      // O sudo pode demorar um pouco para mostrar o prompt

      // Quando o processo terminar
      childProcess.on('close', (code) => {
        exitCode = code || 0;
        runningScripts.delete(scriptId);
        
        // Enviar evento de finalização
        event.sender.send('script-finish', { scriptId, exitCode });
        
        console.log(`Script ${scriptId} finalizado com código ${exitCode}`);
        resolve({
          exitCode,
          logs,
        });
      });

      // Tratamento de erros
      childProcess.on('error', (error) => {
        const errorMessage = error.message || 'Erro desconhecido';
        logs.push({ text: `Erro na execução: ${errorMessage}`, isError: true });
        event.sender.send('script-log', { scriptId, log: `Erro na execução: ${errorMessage}`, isError: true });
        exitCode = 1;
        runningScripts.delete(scriptId);
        event.sender.send('script-finish', { scriptId, exitCode });
        resolve({
          exitCode,
          logs,
        });
      });

      // Timeout de 5 minutos
      setTimeout(() => {
        if (childProcess && !childProcess.killed) {
          childProcess.kill();
          const timeoutMessage = 'Timeout: Script executado por mais de 5 minutos';
          logs.push({ text: timeoutMessage, isError: true });
          event.sender.send('script-log', { scriptId, log: timeoutMessage, isError: true });
          exitCode = 124; // Código de saída padrão para timeout
          runningScripts.delete(scriptId);
          event.sender.send('script-finish', { scriptId, exitCode });
          resolve({
            exitCode,
            logs,
          });
        }
      }, 300000);
    });
  } catch (error) {
    console.error(`Erro ao executar script ${scriptId}:`, error);
    throw error;
  }
});

// Handler IPC para fornecer senha
ipcMain.handle('provide-password', async (_event, { scriptId, password }) => {
  const scriptData = runningScripts.get(scriptId);
  if (scriptData && scriptData.process && !scriptData.process.killed) {
    // Enviar senha para o processo
    if (scriptData.process.stdin && !scriptData.process.stdin.destroyed) {
      try {
        console.log(`[${scriptId}] Tentando enviar senha (${password.length} caracteres)...`);
        
        // Com sudo -S, o sudo lê a senha do stdin imediatamente
        // Enviamos a senha seguida de \n (newline)
        // Se o script foi modificado para usar sudo -S, podemos enviar imediatamente
        const hasSudoModified = (scriptData as any).hasSudoModified;
        
        if (hasSudoModified) {
          // Com sudo -S, enviar imediatamente
          console.log(`[${scriptId}] Script usa sudo -S, enviando senha imediatamente`);
        }
        
        const success = scriptData.process.stdin.write(password + '\n', 'utf8');
        
        if (!success) {
          // Se o buffer estiver cheio, aguardar o evento 'drain'
          scriptData.process.stdin.once('drain', () => {
            console.log(`[${scriptId}] Buffer drenado, senha enviada`);
          });
        } else {
          console.log(`[${scriptId}] Senha enviada com sucesso`);
        }
        
        // Marcar que a senha foi fornecida no scriptData
        (scriptData as any).passwordProvided = true;
        
        return { success: true };
      } catch (error) {
        console.error(`[${scriptId}] Erro ao escrever senha no stdin:`, error);
        return { success: false, error: 'Erro ao enviar senha' };
      }
    } else {
      console.error(`[${scriptId}] Stdin não disponível ou destruído`);
      return { success: false, error: 'Stdin não disponível' };
    }
  }
  console.error(`[${scriptId}] Processo não encontrado ou já finalizado`);
  return { success: false, error: 'Processo não encontrado ou já finalizado' };
});

app.whenReady().then(createWindow)
