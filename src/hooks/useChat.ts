import { useState, useRef, useCallback } from 'react';
import { Message, ScriptMessage } from '../types/chat';
import { askToAiAgent } from './askToAiAgent';
import { addScriptToStorage } from '../utils/scriptStorage';
import { extractScriptsFromMessages } from '../utils/scriptParser';

interface UseChatReturn {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => void;
  cancelRequest: () => void;
  clearChat: () => void;
}

interface ScriptData {
  title: string;
  description: string;
  content: string;
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef<string | null>(null);
  const timeoutRef = useRef<number | null>(null);

  const addMessage = useCallback((message: Message) => {
    setMessages((prev) => [...prev, message]);
    return message.id;
  }, []);

  const createUserMessage = useCallback((text: string): Message => {
    return new Message(
      `${Date.now()}-${Math.random()}`,
      text,
      'user',
      new Date(),
      'text'
    );
  }, []);

  const createAgentMessage = useCallback((text: string, type: 'text' | 'script' | 'action' = 'text'): Message => {
    return new Message(
      `${Date.now()}-${Math.random()}`,
      text,
      'agent',
      new Date(),
      type
    );
  }, []);

  const parseScriptFromJson = useCallback((responseText: string): ScriptData | null => {
    try {
      const parsed = JSON.parse(responseText) as ScriptMessage;
      return {
        title: String(parsed.title || ''),
        description: String(parsed.description || ''),
        content: String(parsed.content || ''),
      };
    } catch {
      return null;
    }
  }, []);

  const parseScriptFromText = useCallback((response: Message): ScriptData => {
    const extractedScripts = extractScriptsFromMessages([response]);
    
    if (extractedScripts.length > 0) {
      const extracted = extractedScripts[0];
      return {
        title: extracted.title,
        description: extracted.description,
        content: extracted.content,
      };
    }

    // Fallback: usar o texto completo como conteúdo
    return {
      title: 'Script gerado pela IA',
      description: '',
      content: response.text,
    };
  }, []);

  const saveScriptToStorage = useCallback((scriptData: ScriptData, messageId: string) => {
    try {
      addScriptToStorage({
        title: scriptData.title || 'Script sem título',
        description: scriptData.description || '',
        content: scriptData.content,
        messageId: messageId,
      });
    } catch (error) {
      console.error('Erro ao salvar script:', error);
    }
  }, []);

  const processScriptResponse = useCallback(
    (response: Message) => {
      try {
        // Tentar parsear o texto como JSON primeiro
        let scriptData = parseScriptFromJson(response.text);
        let responseMessage: string | null = null;

        if (scriptData) {
          // Se conseguiu parsear como JSON, tentar extrair mensagem de resposta
          try {
            const parsed = JSON.parse(response.text) as ScriptMessage;
            if (parsed.responseMessage) {
              responseMessage = typeof parsed.responseMessage === 'string' 
                ? parsed.responseMessage 
                : JSON.stringify(parsed.responseMessage);
            }
          } catch {
            // Ignorar erro ao parsear responseMessage
          }

          // Adicionar mensagem de resposta do agente se existir
          if (responseMessage) {
            addMessage(createAgentMessage(responseMessage, 'text'));
          }
        } else {
          // Se não for JSON válido, tentar usar o parser de scripts
          scriptData = parseScriptFromText(response);
        }

        // Salvar o script no storage
        saveScriptToStorage(scriptData, response.id);
      } catch (error) {
        console.error('Erro ao processar script:', error);
      }
    },
    [parseScriptFromJson, parseScriptFromText, saveScriptToStorage, addMessage, createAgentMessage]
  );

  const handleAgentResponse = useCallback(
    (response: Message, requestId: string) => {
      // Verificar se a requisição ainda é a atual (não foi cancelada)
      if (requestIdRef.current !== requestId) {
        return;
      }

      // Se a resposta for do tipo script, processar e salvar automaticamente
      if (response.type === 'script') {
        processScriptResponse(response);
      }

      addMessage(response);
      setIsLoading(false);
      requestIdRef.current = null;
    },
    [addMessage, processScriptResponse]
  );

  const handleAgentError = useCallback(
    (error: Error, requestId: string) => {
      console.error('Erro ao chamar agente IA:', error);

      // Verificar se a requisição ainda é a atual
      if (requestIdRef.current !== requestId) {
        return;
      }

      const errorMessage = `Erro ao processar sua solicitação: ${error.message || 'Erro desconhecido'}`;
      addMessage(createAgentMessage(errorMessage, 'text'));
      setIsLoading(false);
      requestIdRef.current = null;
    },
    [addMessage, createAgentMessage]
  );

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || isLoading) return;

      // Adicionar mensagem do usuário
      addMessage(createUserMessage(text));
      
      // Enviar ao agente
      setIsLoading(true);
      const requestId = `${Date.now()}-${Math.random()}`;
      requestIdRef.current = requestId;

      askToAiAgent(text)
        .then((response) => handleAgentResponse(response, requestId))
        .catch((error) => handleAgentError(error, requestId));
    },
    [isLoading, addMessage, createUserMessage, handleAgentResponse, handleAgentError]
  );

  const cancelRequest = useCallback(() => {
    // Cancelar requisição atual
    requestIdRef.current = null;
    setIsLoading(false);
    
    // Não remover a mensagem do usuário, apenas parar o processamento
    // A mensagem do usuário já foi adicionada, então mantemos ela
  }, []);

  const clearChat = useCallback(() => {
    if (timeoutRef.current !== null) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setMessages([]);
    setIsLoading(false);
    requestIdRef.current = null;
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    cancelRequest,
    clearChat,
  };
}

