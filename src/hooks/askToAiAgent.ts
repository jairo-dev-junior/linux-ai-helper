import llm from "../AiAgent";
import { ConversationChain } from "langchain/chains";
import { BufferMemory } from "langchain/memory";
import {  SystemDiagnostic } from "../api/SystemDataReceiver";
import  {Message, ScriptMessage} from "../types/chat";

const chain = new ConversationChain({
    llm: llm,
    memory: new BufferMemory({
        memoryKey: "history",
        returnMessages: true
    })
});

const askToAiAgent = async (message: string): Promise<Message> => {
    try {
        console.log("asking to ai agent", message);
        console.log("llm", llm);
        
        if (!llm) {
            throw new Error("LLM não foi inicializado corretamente");
        }

        const response = await chain.invoke({input: message}).then(res => res.response as string);
        console.log("response", response);
        return JSON.parse(response) as Message;
    } catch (error) {
        console.error("Erro em askToAiAgent:", error);
        throw error;
    }
}

async function createContextForAgent(data: SystemDiagnostic) {
  try {
    console.log("criando contexto para o agente", data);

    // Instruções de formato e estrutura de resposta
    const systemInstructions = `Você é um assistente especializado em Linux que ajuda usuários com tarefas do sistema operacional.

REGRAS DE RESPOSTA:
1. FORMATO OBRIGATÓRIO: Sempre retorne APENAS um JSON válido, sem markdown, sem blocos de código, sem texto adicional antes ou depois.
2. ESTRUTURA: O JSON deve seguir exatamente o formato da classe Message.

TIPOS DE MENSAGEM:
- type: "text" - Para respostas de conversa normais ao usuário
- type: "script" - Quando o usuário solicitar criação ou execução de scripts

FORMATO PARA MENSAGENS TIPO "text":
{
  "id": "string",
  "text": "sua resposta em texto puro",
  "sender": "agent",
  "timestamp": "ISO string",
  "type": "text"
}

FORMATO PARA MENSAGENS TIPO "script":
O campo "text" deve conter um JSON stringificado com a estrutura ScriptMessage:
{
  "id": "string",
  "text": "{\\"title\\":\\"Título do Script\\",\\"description\\":\\"Descrição do script\\",\\"content\\":\\"código do script aqui\\",\\"responseMessage\\":\\"Script criado com sucesso!\\"}",
  "sender": "agent",
  "timestamp": "ISO string",
  "type": "script"
}

IMPORTANTE:
- NUNCA use markdown (blocos de código com três backticks) na resposta
- NUNCA adicione texto explicativo antes ou depois do JSON
- SEMPRE retorne JSON válido e parseável
- Use escape adequado para strings JSON aninhadas`;

    // Contexto do sistema formatado de forma estruturada
    const systemContext = `CONTEXTO DO SISTEMA (SEMPRE UTILIZE ESTAS INFORMAÇÕES):

Sistema Operacional:
- Tipo: ${data.sistemaOperacional.tipo}
- Plataforma: ${data.sistemaOperacional.plataforma}
- Arquitetura: ${data.sistemaOperacional.arquitetura}
- Versão: ${data.sistemaOperacional.versao}
- Release: ${data.sistemaOperacional.release}
- Hostname: ${data.sistemaOperacional.hostname}

Processador:
- Modelo: ${data.processador.modelo}
- CPUs: ${data.processador.numeroCPUs}
- Velocidade: ${data.processador.velocidadeMedia} MHz

Memória:
- Total: ${data.memoria.total}
- Livre: ${data.memoria.livre}
- Usada: ${data.memoria.usada} (${data.memoria.percentualUsado}%)

Armazenamento:
- Home: ${data.armazenamento.diretorioHome}
- Temp: ${data.armazenamento.diretorioTmp}

Sistema:
- Usuário: ${data.sistema.usuario}
- Uptime: ${data.sistema.tempoAtividade}
- IP Principal: ${data.sistema.enderecoIP}

Interfaces de Rede:
${data.interfacesRede.map(iface => `- ${iface.nome} (${iface.familia}): ${iface.endereco}`).join('\n')}

INSTRUÇÕES DE USO DO CONTEXTO:
- Use estas informações para criar scripts e comandos apropriados para este sistema específico
- Considere o sistema operacional, arquitetura e configurações ao sugerir comandos
- Adapte caminhos e comandos conforme necessário para este ambiente
- Sempre considere o contexto do sistema ao responder, mesmo que não seja explicitamente solicitado`;

    // Enviar instruções primeiro, depois o contexto
    await chain.invoke({ input: systemInstructions });
    await chain.invoke({ input: systemContext });
  } catch (error) {
    console.error("Erro ao criar contexto para o agente:", error);
    throw error;
  }
}


export {askToAiAgent, createContextForAgent}