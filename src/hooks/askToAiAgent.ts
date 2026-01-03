import llm from "../AiAgent";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import {  SystemDiagnostic } from "../api/SystemDataReceiver";
import  {Message, ScriptMessage} from "../types/chat";

const chain = new ConversationChain({
    llm: llm,
    memory: new BufferMemory({
        memoryKey: "history",
        returnMessages: true,
    })
});

// Cache do contexto do sistema para evitar reenvio desnecessário
let systemContextCache: {
    data: SystemDiagnostic | null;
    timestamp: number;
} = {
    data: null,
    timestamp: 0
};

const CONTEXT_CACHE_TTL = 5 * 60 * 1000; // 5 minutos

/**
 * Blocklist de comandos e padrões perigosos que não devem ser executados
 * Esta lista previne a criação de scripts que podem afetar negativamente o sistema
 */
const DANGEROUS_COMMANDS_BLOCKLIST = [
    // Comandos de remoção perigosos
    'rm -rf /',
    'rm -r /',
    'rm -rf /root',
    'rm -rf /etc',
    'rm -rf /bin',
    'rm -rf /sbin',
    'rm -rf /usr',
    'rm -rf /var',
    'rm -rf /sys',
    'rm -rf /proc',
    'rm -rf /boot',
    'rm -rf /lib',
    'rm -rf /lib64',
    'rm -rf /opt',
    'rm -rf /srv',
    'rm -rf /media',
    'rm -rf /mnt',
    'rm -rf /home',
    'rm -rf /*',
    'rm -r /*',
    'rm -rf ~',
    'rm -rf $HOME',
    'rm -rf /dev',
    
    // Comandos de formatação e manipulação de disco
    'mkfs',
    'format',
    'dd if=/dev/zero',
    'dd if=/dev/urandom',
    'dd of=/dev/',
    'fdisk',
    'parted',
    'sfdisk',
    'cfdisk',
    
    // Comandos de permissões perigosos
    'chmod 777 /',
    'chmod -R 777 /',
    'chmod 000 /',
    'chown root:root /',
    'chown -R root:root /',
    
    // Comandos de rede perigosos
    'iptables -F',
    'iptables --flush',
    'iptables -X',
    'iptables -t nat -F',
    'ip route del',
    'route del default',
    
    // Comandos de sistema críticos
    'systemctl stop',
    'systemctl disable',
    'service stop',
    'init 0',
    'init 6',
    'halt',
    'poweroff',
    'reboot',
    'shutdown',
    'killall',
    'kill -9',
    'pkill -9',
    
    // Comandos de manipulação de arquivos críticos
    '> /etc/passwd',
    '> /etc/shadow',
    '> /etc/sudoers',
    '> /etc/fstab',
    '> /etc/hosts',
    '> /boot',
    '> /etc',
    '> /bin',
    '> /sbin',
    '> /usr',
    
    // Comandos de sobrescrita perigosos
    ':(){ :|:& };:',
    'fork()',
    'fork bomb',
    
    // Comandos de manipulação de swap
    'swapoff -a',
    'swapon',
    
    // Comandos de manipulação de módulos do kernel
    'rmmod',
    'modprobe -r',
    
    // Comandos de manipulação de arquivos de sistema
    'mv /bin',
    'mv /sbin',
    'mv /usr',
    'mv /etc',
    'mv /lib',
    'mv /boot',
    
    // Comandos de manipulação de arquivos de configuração críticos
    'rm /etc/passwd',
    'rm /etc/shadow',
    'rm /etc/sudoers',
    'rm /etc/fstab',
    'rm /etc/hosts',
    'rm /etc/resolv.conf',
    
    // Comandos de manipulação de arquivos de boot
    'rm /boot',
    'rm /vmlinuz',
    'rm /initrd',
    'rm /grub',
    
    // Comandos de manipulação de arquivos de biblioteca
    'rm /lib',
    'rm /lib64',
    'rm /usr/lib',
    'rm /usr/lib64',
    
    // Comandos de manipulação de arquivos de sistema
    'rm /bin',
    'rm /sbin',
    'rm /usr/bin',
    'rm /usr/sbin',
];

/**
 * Tenta extrair e reparar um JSON mal formatado
 * @param jsonString String JSON potencialmente mal formatada
 * @returns String JSON reparada ou null se não for possível reparar
 */
function tryRepairJson(jsonString: string): string | null {
    try {
        // Tentar parsear diretamente primeiro
        JSON.parse(jsonString);
        return jsonString;
    } catch {
        // Tentar encontrar o JSON válido dentro da string
        // Procura pelo padrão { ... } mais externo
        const jsonMatch = jsonString.match(/^[\s\n]*(\{[\s\S]*\})[\s\n]*$/);
        if (jsonMatch) {
            try {
                JSON.parse(jsonMatch[1]);
                return jsonMatch[1];
            } catch {
                // Se ainda falhar, tentar limpar caracteres problemáticos
                let cleaned = jsonMatch[1]
                    .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '') // Remove caracteres de controle exceto \n, \r, \t
                    .trim();
                
                try {
                    JSON.parse(cleaned);
                    return cleaned;
                } catch {
                    return null;
                }
            }
        }
        return null;
    }
}

/**
 * Valida se um script contém comandos perigosos da blocklist
 * @param scriptContent Conteúdo do script a ser validado
 * @returns Objeto com valid (boolean) e error (string opcional)
 */
function validateScriptSafety(scriptContent: string): { valid: boolean; error?: string } {
    if (!scriptContent || scriptContent.trim().length === 0) {
        return { valid: false, error: 'Script vazio' };
    }

    const contentLower = scriptContent.toLowerCase();
    
    for (const dangerousCommand of DANGEROUS_COMMANDS_BLOCKLIST) {
        const dangerousLower = dangerousCommand.toLowerCase();
        
        // Verifica se o comando perigoso está presente no script
        if (contentLower.includes(dangerousLower)) {
            return { 
                valid: false, 
                error: `Comando perigoso detectado na blocklist: ${dangerousCommand}. Este comando pode afetar negativamente o sistema operacional.` 
            };
        }
    }

    return { valid: true };
}

const askToAiAgent = async (message: string): Promise<Message> => {
    try {        
        if (!llm) {
            throw new Error("LLM não foi inicializado corretamente");
        }

        // Invocar chain diretamente sem .then() para melhor performance
        const result = await chain.invoke({input: message});
        const response = result.response as string;
        console.log("response", response);
        // Tentar parsear a resposta
        let parsedMessage: Message;
        try {
            parsedMessage = JSON.parse(response) as Message;
        } catch (parseError) {
            // Tentar reparar o JSON
            const repaired = tryRepairJson(response);
            if (repaired) {
                parsedMessage = JSON.parse(repaired) as Message;
            } else {
                // Se não conseguir reparar, tentar extrair JSON de markdown
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    try {
                        parsedMessage = JSON.parse(jsonMatch[0]) as Message;
                    } catch {
                        throw new Error(`Resposta não é um JSON válido. Erro: ${parseError instanceof Error ? parseError.message : 'Desconhecido'}`);
                    }
                } else {
                    throw new Error(`Resposta não é um JSON válido. Erro: ${parseError instanceof Error ? parseError.message : 'Desconhecido'}`);
                }
            }
        }
        
        // Validar segurança se for um script (validação rápida)
        if (parsedMessage.type === "script") {
            try {
                // Tentar parsear o JSON interno do campo text
                let scriptText = parsedMessage.text;
                
                // Remover espaços em branco no início e fim
                scriptText = scriptText.trim();
                
                // Se o texto começar e terminar com aspas, remover (pode ser string escapada)
                if (scriptText.startsWith('"') && scriptText.endsWith('"')) {
                    scriptText = scriptText.slice(1, -1);
                }
                
                // Tentar parsear o JSON diretamente
                let scriptData: ScriptMessage;
                try {
                    scriptData = JSON.parse(scriptText) as ScriptMessage;
                } catch (innerParseError) {
                    // Se falhar, tentar reparar o JSON
                    const repaired = tryRepairJson(scriptText);
                    if (repaired) {
                        try {
                            scriptData = JSON.parse(repaired) as ScriptMessage;
                        } catch {
                            // Se ainda falhar, tentar extrair JSON do texto
                            const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
                            if (jsonMatch) {
                                scriptData = JSON.parse(jsonMatch[0]) as ScriptMessage;
                            } else {
                                throw new Error(`Não foi possível extrair JSON do script. Erro: ${innerParseError instanceof Error ? innerParseError.message : 'Desconhecido'}`);
                            }
                        }
                    } else {
                        // Tentar extrair JSON do texto
                        const jsonMatch = scriptText.match(/\{[\s\S]*\}/);
                        if (jsonMatch) {
                            scriptData = JSON.parse(jsonMatch[0]) as ScriptMessage;
                        } else {
                            throw new Error(`Não foi possível extrair JSON do script. Erro: ${innerParseError instanceof Error ? innerParseError.message : 'Desconhecido'}`);
                        }
                    }
                }
                
                const scriptContent = String(scriptData.content || '');
                
                // Validação rápida usando includes direto (mais rápido que loop)
                const contentLower = scriptContent.toLowerCase();
                const hasDangerousCommand = DANGEROUS_COMMANDS_BLOCKLIST.some(cmd => 
                    contentLower.includes(cmd.toLowerCase())
                );
                
                if (hasDangerousCommand) {
                    return {
                        id: parsedMessage.id,
                        text: `Erro de segurança: Comando perigoso detectado. O script não foi criado por questões de segurança do sistema.`,
                        sender: "agent",
                        timestamp: parsedMessage.timestamp,
                        type: "text"
                    };
                }
            } catch (parseError) {
                console.error("Erro ao validar script:", parseError);
                console.error("Texto do script que causou erro:", parsedMessage.text.substring(0, 500));
                return {
                    id: parsedMessage.id,
                    text: `Erro ao processar o script retornado pelo agente: ${parseError instanceof Error ? parseError.message : 'Erro desconhecido'}. O JSON pode estar mal formatado.`,
                    sender: "agent",
                    timestamp: parsedMessage.timestamp,
                    type: "text"
                };
            }
        }
        
        return parsedMessage;
    } catch (error) {
        console.error("Erro em askToAiAgent:", error);
        throw error;
    }
}

async function createContextForAgent(data: SystemDiagnostic) {
  try {
    // Verificar cache do contexto
    const now = Date.now();
    const isCacheValid = systemContextCache.data && 
                        (now - systemContextCache.timestamp) < CONTEXT_CACHE_TTL &&
                        JSON.stringify(systemContextCache.data) === JSON.stringify(data);
    
    if (isCacheValid) {
      console.log("Usando contexto do sistema em cache");
      return; // Não reenvia se o cache for válido
    }

    // Atualizar cache
    systemContextCache = {
      data: data,
      timestamp: now
    };
  
    // Instruções de formato e estrutura de resposta (versão otimizada e concisa)
    const systemInstructions = `Você é um assistente Linux especializado. SEMPRE retorne APENAS JSON válido, sem markdown.

FORMATO OBRIGATÓRIO:
- type: "text" → {"id":"string","text":"resposta","sender":"agent","timestamp":"ISO","type":"text"}
- type: "script" → {"id":"string","text":"STRING_JSON_ESCAPADO","sender":"agent","timestamp":"ISO","type":"script"}

IMPORTANTE - ESCAPE DE JSON ANINHADO:
Quando type for "script", o campo "text" DEVE conter um JSON stringificado com escape correto.

REGRAS DE ESCAPE (CRÍTICO):
1. Aspas duplas: " → \\"
2. Quebras de linha: \\n → \\\\n
3. Barras invertidas: \\ → \\\\
4. O JSON interno é uma STRING dentro do JSON externo

PROCESSO:
1. Primeiro, crie o JSON interno com os campos: title, description, content, responseMessage
2. O campo "content" contém o código bash (pode ter \\n, ", etc.)
3. Stringifique esse JSON interno (JSON.stringify)
4. Escape todas as aspas duplas resultantes: " → \\"
5. Escape todas as quebras de linha: \\n → \\\\n
6. Coloque esse resultado no campo "text" do JSON externo

EXEMPLO PASSO A PASSO:
JSON interno (antes de stringificar):
{
  "title": "Script Teste",
  "description": "Descrição",
  "content": "#!/bin/bash\\necho \"Hello\"",
  "responseMessage": "Criado"
}

Após stringificar e escapar (vai no campo "text"):
"{\\"title\\":\\"Script Teste\\",\\"description\\":\\"Descrição\\",\\"content\\":\\"#!/bin/bash\\\\necho \\\\\\"Hello\\\\\\"\\",\\"responseMessage\\":\\"Criado\\"}"

JSON externo final:
{"id":"123","text":"{\\"title\\":\\"Script Teste\\",\\"description\\":\\"Descrição\\",\\"content\\":\\"#!/bin/bash\\\\necho \\\\\\"Hello\\\\\\"\\",\\"responseMessage\\":\\"Criado\\"}","sender":"agent","timestamp":"2024-01-01T00:00:00.000Z","type":"script"}

REGRAS CRÍTICAS:
- NUNCA use markdown ou blocos de código
- Scripts em BASH apenas
- JSON válido e parseável sempre
- SEMPRE escape corretamente: \\" para aspas, \\\\n para quebras de linha, \\\\ para barras
- O campo "text" quando type="script" DEVE ser um JSON válido stringificado e escapado
- Teste mentalmente: o JSON externo deve ser parseável, e o JSON interno (após parse) também
- VALIDAÇÃO: Antes de retornar, verifique mentalmente se o JSON pode ser parseado corretamente
- Se o conteúdo do script tiver caracteres especiais (", \\, \\n), ESCAPE-OS CORRETAMENTE
- O JSON retornado DEVE ser válido e parseável sem erros de sintaxe

COMANDOS BLOQUEADOS (RECUSAR):
- Remoção: rm -rf /, rm -r /, rm -rf /etc, /bin, /usr, /var, /sys, /proc, /boot, /lib, /home, /*, ~, $HOME
- Disco: mkfs, format, dd if=/dev/zero, dd of=/dev/, fdisk, parted
- Permissões: chmod 777 /, chmod 000 /, chown root:root /
- Rede: iptables -F, ip route del, route del default
- Sistema: systemctl stop/disable, init 0/6, halt, poweroff, reboot, shutdown, killall, kill -9
- Arquivos críticos: > /etc/passwd, > /etc/shadow, > /etc/sudoers, > /etc/fstab, rm /boot, mv /bin, mv /usr
- Outros: fork bombs, swapoff -a, rmmod, modprobe -r

SEGURANÇA:
- Se solicitado comando bloqueado, RECUSE e explique o risco
- NUNCA crie scripts que afetem o sistema negativamente
- Em dúvida, prefira NÃO criar o script`;

    // Contexto do sistema formatado de forma estruturada (versão otimizada)
    const systemContext = `CONTEXTO DO SISTEMA:
OS: ${data.sistemaOperacional.tipo} ${data.sistemaOperacional.versao} (${data.sistemaOperacional.arquitetura}) - ${data.sistemaOperacional.hostname}
CPU: ${data.processador.modelo} (${data.processador.numeroCPUs} cores, ${data.processador.velocidadeMedia}MHz)
RAM: ${data.memoria.total} (${data.memoria.percentualUsado}% usado)
Usuário: ${data.sistema.usuario} | Home: ${data.armazenamento.diretorioHome} | IP: ${data.sistema.enderecoIP}
Rede: ${data.interfacesRede.map(iface => `${iface.nome}(${iface.endereco})`).join(', ')}
Use SEMPRE estas informações para adaptar comandos e scripts ao sistema.`;

    // Enviar instruções primeiro, depois o contexto
    await chain.memory?.saveContext({ input: systemInstructions }, { outputKey: "instructions" });
    await chain.memory?.saveContext({ input: systemContext }, { outputKey: "context" });
  } catch (error) {
    console.error("Erro ao criar contexto para o agente:", error);
    throw error;
  }
}


export {askToAiAgent, createContextForAgent, validateScriptSafety, DANGEROUS_COMMANDS_BLOCKLIST}