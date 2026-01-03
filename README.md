# Linux AI Helper

Assistente de IA para Linux desenvolvido com Electron, React e TypeScript. Este projeto utiliza o Ollama para fornecer um assistente inteligente que pode ajudar com tarefas do sistema Linux, incluindo a criação e execução de scripts.

## 📋 Pré-requisitos

Antes de começar, certifique-se de ter instalado:

- **Node.js** (versão 18 ou superior)
- **npm** (geralmente vem com o Node.js)
- **Ollama** (instruções de instalação abaixo)

## 🚀 Instalação

### 1. Instalar o Ollama

O Ollama é necessário para executar os modelos de linguagem localmente. Siga os passos abaixo:

#### Linux

```bash
# Instalar o Ollama usando o script oficial
curl -fsSL https://ollama.com/install.sh | sh
```

Ou, se preferir instalar manualmente:

```bash
# Baixar e instalar
curl -L https://ollama.com/download/ollama-linux-amd64 -o /usr/local/bin/ollama
chmod +x /usr/local/bin/ollama
```

#### Verificar instalação

Após a instalação, verifique se o Ollama está funcionando:

```bash
ollama --version
```

### 2. Iniciar o serviço Ollama

O Ollama precisa estar rodando em segundo plano. Inicie o serviço:

```bash
ollama serve
```

**Nota:** Mantenha este terminal aberto ou execute o Ollama como um serviço do sistema.

### 3. Baixar o modelo necessário

O projeto está configurado para usar o modelo `gpt-oss:20b`. Baixe o modelo:

```bash
ollama pull gpt-oss:20b
```

**Alternativa:** Se você preferir usar um modelo diferente ou menor, você pode:

1. Baixar outro modelo (ex: `ollama pull llama3:8b`)
2. Editar o arquivo `src/AiAgent.ts` e alterar o modelo na linha 13

### 4. Clonar e instalar dependências do projeto

```bash
# Clonar o repositório (se ainda não tiver)
git clone <url-do-repositorio>
cd linux-ai-helper

# Instalar as dependências
npm install
```

## ▶️ Executando o Projeto

### Modo de Desenvolvimento

Para executar o projeto em modo de desenvolvimento:

```bash
npm run dev
```

Este comando irá:
- Iniciar o servidor de desenvolvimento Vite
- Abrir a aplicação Electron
- Habilitar o DevTools automaticamente

**Importante:** Certifique-se de que o Ollama está rodando (`ollama serve`) antes de executar o projeto.

### Verificar se o Ollama está acessível

Você pode testar se o Ollama está funcionando corretamente:

```bash
curl http://localhost:11434/api/tags
```

Se retornar uma lista de modelos, o Ollama está funcionando corretamente.

## 🏗️ Build para Produção

Para criar um executável do projeto:

```bash
npm run build
```

Este comando irá:
- Compilar o TypeScript
- Fazer o build do frontend com Vite
- Criar o executável com Electron Builder

O executável será gerado na pasta `dist/` (ou conforme configurado no `electron-builder.json5`).

## 🔧 Configuração

### Alterar o modelo do Ollama

Se você quiser usar um modelo diferente, edite o arquivo `src/AiAgent.ts`:

```typescript
const llm = new Ollama({
  baseUrl: "http://localhost:11434",
  model: "seu-modelo-aqui", // Altere aqui
  temperature: 0,
  maxRetries: 2
})
```

### Otimizar performance do Ollama

Para melhorar a performance, você pode configurar variáveis de ambiente antes de iniciar o Ollama:

```bash
export OLLAMA_NUM_CTX=2048
export OLLAMA_NUM_THREAD=4
ollama serve
```

Ou adicione essas variáveis ao seu arquivo `~/.bashrc` ou `~/.zshrc` para torná-las permanentes.

## 📝 Scripts Disponíveis

- `npm run dev` - Inicia o projeto em modo de desenvolvimento
- `npm run build` - Cria o build de produção
- `npm run lint` - Executa o linter ESLint
- `npm run preview` - Visualiza o build de produção

## 🛠️ Tecnologias Utilizadas

- **Electron** - Framework para aplicações desktop
- **React** - Biblioteca para interfaces de usuário
- **TypeScript** - Superset do JavaScript com tipagem estática
- **Vite** - Build tool e dev server
- **LangChain** - Framework para aplicações com LLMs
- **Ollama** - Ferramenta para executar modelos de linguagem localmente

## ⚠️ Troubleshooting

### Ollama não está respondendo

1. Verifique se o serviço está rodando: `ollama serve`
2. Verifique se a porta 11434 está acessível: `curl http://localhost:11434/api/tags`
3. Verifique se o modelo foi baixado: `ollama list`

### Erro ao executar scripts

O projeto possui validações de segurança para prevenir a execução de comandos perigosos. Se um script não executar, verifique se não contém comandos bloqueados.

### Problemas com dependências

Se encontrar problemas ao instalar dependências:

```bash
# Limpar cache do npm
npm cache clean --force

# Remover node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install
```

## 📄 Licença

[Adicione informações de licença aqui]

## 🤝 Contribuindo

[Adicione informações sobre como contribuir aqui]
