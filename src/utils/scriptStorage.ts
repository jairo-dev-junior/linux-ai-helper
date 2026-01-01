import { Script } from '../types/script';

const SCRIPTS_STORAGE_KEY = 'linux-ai-helper-scripts';

/**
 * Carrega scripts salvos do localStorage
 */
export function loadScriptsFromStorage(): Script[] {
  try {
    const stored = localStorage.getItem(SCRIPTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      // Converter createdAt de string para Date
      return parsed.map((script: any) => ({
        ...script,
        createdAt: new Date(script.createdAt),
      }));
    }
  } catch (error) {
    console.warn('Erro ao carregar scripts do storage:', error);
  }
  return [];
}

/**
 * Salva scripts no localStorage
 */
export function saveScriptsToStorage(scripts: Script[]): void {
  try {
    localStorage.setItem(SCRIPTS_STORAGE_KEY, JSON.stringify(scripts));
  } catch (error) {
    console.warn('Erro ao salvar scripts no storage:', error);
  }
}

/**
 * Adiciona um script ao storage
 */
export function addScriptToStorage(script: Omit<Script, 'id' | 'createdAt' | 'messageId'> & { messageId?: string }): Script {
  const newScript: Script = {
    ...script,
    id: script.messageId ? `${script.messageId}-script` : `manual-${Date.now()}-${Math.random()}`,
    createdAt: new Date(),
    messageId: script.messageId || 'manual',
  };

  const savedScripts = loadScriptsFromStorage();
  
  // Verificar se já existe um script com o mesmo ID
  const existingIndex = savedScripts.findIndex(s => s.id === newScript.id);
  if (existingIndex >= 0) {
    // Atualizar script existente
    savedScripts[existingIndex] = newScript;
  } else {
    // Adicionar novo script
    savedScripts.push(newScript);
  }

  // Ordenar por data de criação (mais recentes primeiro)
  savedScripts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  
  saveScriptsToStorage(savedScripts);
  return newScript;
}

