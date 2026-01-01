import { app, BrowserWindow, ipcMain } from 'electron'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import os from 'os'
import si from 'systeminformation'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

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
ipcMain.handle('execute-script', async (_event, { scriptId, content }) => {
  try {
    console.log(`Executando script ${scriptId}...`);
    
    const logs: Array<{ text: string; isError: boolean }> = [];
    let exitCode = 0;

    // Executar o script
    try {
      const { stdout, stderr } = await execAsync(content, {
        maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        timeout: 300000, // 5 minutos timeout
      });

      // Adicionar stdout aos logs
      if (stdout) {
        stdout.split('\n').forEach((line) => {
          if (line.trim()) {
            logs.push({ text: line, isError: false });
          }
        });
      }

      // Adicionar stderr aos logs
      if (stderr) {
        stderr.split('\n').forEach((line) => {
          if (line.trim()) {
            logs.push({ text: line, isError: true });
          }
        });
      }
    } catch (error: any) {
      exitCode = error.code || 1;
      const errorMessage = error.message || 'Erro desconhecido';
      logs.push({ text: `Erro na execução: ${errorMessage}`, isError: true });
      
      // Adicionar stderr se disponível
      if (error.stderr) {
        error.stderr.split('\n').forEach((line: string) => {
          if (line.trim()) {
            logs.push({ text: line, isError: true });
          }
        });
      }
    }

    console.log(`Script ${scriptId} finalizado com código ${exitCode}`);
    return {
      exitCode,
      logs,
    };
  } catch (error) {
    console.error(`Erro ao executar script ${scriptId}:`, error);
    throw error;
  }
});

app.whenReady().then(createWindow)
