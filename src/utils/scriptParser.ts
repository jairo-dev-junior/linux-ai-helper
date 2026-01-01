import { Message } from '../types/chat';
import { Script } from '../types/script';

/**
 * Extrai scripts das mensagens do agente
 * Procura por blocos de código markdown e mensagens do tipo 'script'
 */
export function extractScriptsFromMessages(messages: Message[]): Script[] {
  const scripts: Script[] = [];

  messages.forEach((message) => {
    // Se a mensagem já é do tipo script
    if (message.type === 'script' && message.sender === 'agent') {
      const script = parseScriptFromMessage(message);
      if (script) {
        scripts.push(script);
      }
      return;
    }

    // Tentar extrair blocos de código do texto
    if (message.sender === 'agent') {
      const extractedScripts = extractCodeBlocks(message.text, message.id);
      scripts.push(...extractedScripts);
    }
  });

  return scripts;
}

/**
 * Parseia uma mensagem do tipo script em um objeto Script
 */
function parseScriptFromMessage(message: Message): Script | null {
  try {
    // Tentar parsear como JSON primeiro
    const parsed = JSON.parse(message.text);
    if (parsed.title && parsed.content) {
      return {
        id: `${message.id}-script`,
        title: parsed.title || 'Script sem título',
        description: parsed.description || '',
        content: parsed.content || parsed.code || '',
        createdAt: message.timestamp,
        messageId: message.id,
      };
    }
  } catch {
    // Não é JSON, continuar com parsing de texto
  }

  // Tentar extrair do texto formatado
  const codeBlocks = extractCodeBlocks(message.text, message.id);
  if (codeBlocks.length > 0) {
    return codeBlocks[0];
  }

  return null;
}

/**
 * Extrai blocos de código markdown do texto
 */
function extractCodeBlocks(text: string, messageId: string): Script[] {
  const scripts: Script[] = [];
  
  // Regex para blocos de código markdown: ```linguagem\ncódigo\n```
  const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
  let match;
  let blockIndex = 0;

  while ((match = codeBlockRegex.exec(text)) !== null) {
    const language = match[1] || 'bash';
    const code = match[2].trim();

    // Extrair título e descrição do contexto antes do bloco
    const beforeBlock = text.substring(0, match.index);
    const titleMatch = beforeBlock.match(/(?:^|\n)(?:#+\s*)?([^\n]+?)(?:\n|$)/);
    const title = titleMatch ? titleMatch[1].trim() : `Script ${blockIndex + 1}`;
    
    // Extrair descrição (texto antes do bloco, limitado a algumas linhas)
    const descriptionLines = beforeBlock
      .split('\n')
      .filter(line => line.trim() && !line.match(/^#+/))
      .slice(-3)
      .join(' ')
      .trim();
    const description = descriptionLines || `Script ${language}`;

    scripts.push({
      id: `${messageId}-block-${blockIndex}`,
      title: title.substring(0, 100), // Limitar tamanho do título
      description: description.substring(0, 200), // Limitar tamanho da descrição
      content: code,
      createdAt: new Date(),
      messageId: messageId,
    });

    blockIndex++;
  }

  return scripts;
}

