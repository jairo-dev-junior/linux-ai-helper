export interface SystemDiagnostic {
    sistemaOperacional: {
        tipo: string;
        plataforma: string;
        arquitetura: string;
        versao: string;
        release: string;
        hostname: string;
    };
    processador: {
        modelo: string;
        numeroCPUs: number;
        velocidadeMedia: number;
    };
    memoria: {
        total: string;
        livre: string;
        usada: string;
        percentualUsado: number;
    };
    armazenamento: {
        diretorioHome: string;
        diretorioTmp: string;
    };
    sistema: {
        tempoAtividade: string;
        usuario: string;
        enderecoIP: string;
    };
    interfacesRede: Array<{
        nome: string;
        endereco: string;
        familia: string;
    }>;
}

// Função para obter dados do sistema via IPC
export const getSystemData = async (): Promise<SystemDiagnostic> => {
  try {
    if (typeof window !== 'undefined' && window.ipcRenderer) {
      const data = await window.ipcRenderer.invoke('get-system-data');
      return data as SystemDiagnostic;
    }
    throw new Error('IPC não disponível. Certifique-se de que está executando no Electron.');
  } catch (error) {
    console.error("Erro ao obter dados do sistema:", error);
    throw error;
  }
};