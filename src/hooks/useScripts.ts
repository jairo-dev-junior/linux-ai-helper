import { useState, useEffect, useCallback } from 'react';
import { Message } from '../types/chat';
import { Script } from '../types/script';
import { extractScriptsFromMessages } from '../utils/scriptParser';
import { loadScriptsFromStorage, saveScriptsToStorage, addScriptToStorage } from '../utils/scriptStorage';

const DEMO_SCRIPT_KEY = 'linux-ai-helper-demo-script-added';

/**
 * Cria um script modelo para demonstração
 */
function createDemoScript(): Script {
  return {
    id: 'demo-script-1',
    title: 'Verificar espaço em disco',
    description: 'Script para verificar o espaço disponível em disco e exibir informações sobre partições.',
    content: `#!/bin/bash
# Verificar espaço em disco
echo "=== Espaço em Disco ==="
df -h

echo ""
echo "=== Partições ==="
lsblk

echo ""
echo "=== Uso de disco por diretório (top 10) ==="
du -h --max-depth=1 /home 2>/dev/null | sort -rh | head -10`,
    createdAt: new Date(),
    messageId: 'demo-message',
  };
}

interface UseScriptsProps {
  messages: Message[];
}

interface UseScriptsReturn {
  scripts: Script[];
  refreshScripts: () => void;
  addScript: (script: Omit<Script, 'id' | 'createdAt' | 'messageId'>) => void;
}

/**
 * Hook para gerenciar scripts extraídos das mensagens do chat
 */
export function useScripts({ messages }: UseScriptsProps): UseScriptsReturn {
  const [scripts, setScripts] = useState<Script[]>([]);

  // Usar funções utilitárias do scriptStorage

  const refreshScripts = useCallback(() => {
    // Extrair scripts das mensagens
    const extractedScripts = extractScriptsFromMessages(messages);
    
    // Carregar scripts salvos do storage
    const savedScripts = loadScriptsFromStorage();
    
    // Combinar scripts extraídos com salvos (evitar duplicatas)
    const allScripts = [...extractedScripts];
    const existingIds = new Set(extractedScripts.map(s => s.id));
    
    savedScripts.forEach(saved => {
      if (!existingIds.has(saved.id)) {
        allScripts.push(saved);
      }
    });

    // Adicionar script modelo se não houver scripts e ainda não foi adicionado
    const demoAdded = localStorage.getItem(DEMO_SCRIPT_KEY);
    if (allScripts.length === 0 && !demoAdded) {
      const demoScript = createDemoScript();
      allScripts.push(demoScript);
      localStorage.setItem(DEMO_SCRIPT_KEY, 'true');
    }

    // Ordenar por data de criação (mais recentes primeiro)
    allScripts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    setScripts(allScripts);
    saveScriptsToStorage(allScripts);
  }, [messages, loadScriptsFromStorage, saveScriptsToStorage]);

  const addScript = useCallback((scriptData: Omit<Script, 'id' | 'createdAt' | 'messageId'>) => {
    // Usar função utilitária para adicionar script
    const newScript = addScriptToStorage(scriptData);

    // Atualizar estado imediatamente
    setScripts((prevScripts) => {
      const updated = [newScript, ...prevScripts];
      // Ordenar por data
      updated.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      return updated;
    });
  }, []);

  useEffect(() => {
    refreshScripts();
  }, [refreshScripts]);

  return {
    scripts,
    refreshScripts,
    addScript,
  };
}

