import { Ollama } from "@langchain/ollama"

const llm = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "gpt-oss:20b",
  temperature: 0,
  maxRetries: 2
})

export default  llm;