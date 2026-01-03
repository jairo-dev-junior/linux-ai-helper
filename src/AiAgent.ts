import { Ollama } from "@langchain/ollama"

/**
 * Configuração otimizada do LLM para melhor performance
 * 
 * Para otimizar ainda mais a velocidade, configure o Ollama com:
 * - OLLAMA_NUM_CTX=2048 (contexto menor = mais rápido)
 * - OLLAMA_NUM_THREAD=4 (usar múltiplas threads)
 * - Usar um modelo quantizado menor se disponível (ex: deepseek-r1:8b-q4_K_M)
 */
const llm = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "gpt-oss:20b",
  temperature: 0, // Temperatura 0 para respostas mais determinísticas e rápidas
  maxRetries: 2
})

export default  llm;