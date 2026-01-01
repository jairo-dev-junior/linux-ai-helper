# Plano de Implementação - Página de Scripts

## Objetivo
Criar uma nova página que lista scripts gerados pela IA durante as conversas do chat, permitindo visualização e execução dos mesmos.

## Análise da Estrutura Atual

### Componentes Existentes
- `App.tsx`: Componente raiz que renderiza o `Chat`
- `Chat.tsx`: Componente principal do chat com header, mensagens e input
- `Message.tsx`: Componente que renderiza mensagens individuais
- Sistema de temas: `ThemeProvider`, `useTheme`, `themes.ts`
- Tipos: `Message` já possui campo `type: 'text' | 'script' | 'action'`

### Estilos
- CSS Modules sendo utilizado
- Variáveis CSS para temas (dark/light)
- Design consistente com cores do tema

## Tarefas de Implementação

### 1. Sistema de Navegação (Menu)
**Arquivos a criar/modificar:**
- `src/components/Navigation/Navigation.tsx` (novo)
- `src/components/Navigation/Navigation.module.css` (novo)

**Funcionalidades:**
- Menu horizontal simples no topo da aplicação
- Botões/links para navegar entre "Chat" e "Scripts"
- Indicador visual da página atual
- Usar os mesmos estilos do tema (cores, bordas, etc.)

### 2. Tipos e Interfaces para Scripts
**Arquivos a criar/modificar:**
- `src/types/script.ts` (novo)

**Estrutura:**
```typescript
export interface Script {
  id: string;
  title: string;
  description: string;
  content: string; // código do script
  createdAt: Date;
  messageId: string; // ID da mensagem que gerou o script
}

export interface ScriptExecution {
  scriptId: string;
  status: 'running' | 'success' | 'error';
  logs: string[];
  startTime: Date;
  endTime?: Date;
  exitCode?: number;
}
```

### 3. Hook para Gerenciar Scripts
**Arquivos a criar/modificar:**
- `src/hooks/useScripts.ts` (novo)

**Funcionalidades:**
- Extrair scripts das mensagens do chat
- Filtrar mensagens do tipo 'script' do agente
- Parsear o conteúdo para extrair título, descrição e código
- Gerenciar lista de scripts
- Persistir scripts no localStorage (opcional, para manter histórico)

### 4. Página de Scripts
**Arquivos a criar/modificar:**
- `src/components/Scripts/Scripts.tsx` (novo)
- `src/components/Scripts/Scripts.module.css` (novo)
- `src/components/Scripts/ScriptCard.tsx` (novo)
- `src/components/Scripts/ScriptCard.module.css` (novo)

**Estrutura da página:**
- Header similar ao Chat (título "Scripts" + toggle de tema)
- Container de listagem com scroll
- Grid ou lista de blocos (ScriptCard)
- Mensagem quando não houver scripts

**Estrutura do ScriptCard:**
- Título do script
- Descrição breve
- Botão "Executar"
- Estilo consistente com o design do app

### 5. Funcionalidade de Execução de Scripts
**Arquivos a criar/modificar:**
- `src/utils/scriptExecutor.ts` (novo)
- Integração com Electron IPC (se necessário)

**Funcionalidades:**
- Função para executar scripts no sistema
- Feedback visual durante execução (loading no botão)
- Capturar logs em tempo real (stdout/stderr)
- Tratamento de erros

### 6. Modal de Logs de Execução
**Arquivos a criar/modificar:**
- `src/components/Scripts/ExecutionModal.tsx` (novo)
- `src/components/Scripts/ExecutionModal.module.css` (novo)

**Funcionalidades:**
- Modal que abre automaticamente quando um script é executado
- Exibir logs da execução em tempo real
- Área de scroll para logs longos
- Indicador de status (executando, sucesso, erro)
- Botão para fechar o modal
- Botão para copiar logs (opcional)
- Formatação de logs (diferenciação entre stdout e stderr)
- Auto-scroll para o final dos logs durante execução

**Estrutura do Modal:**
- Header com título do script e status
- Área de logs com monospace font
- Footer com botões (Fechar, Copiar logs)
- Overlay escuro ao fundo
- Animações de abertura/fechamento

### 7. Modificar App.tsx para Suportar Navegação
**Arquivos a modificar:**
- `src/App.tsx`

**Mudanças:**
- Adicionar estado para controlar página atual
- Renderizar Navigation
- Renderizar condicionalmente Chat ou Scripts baseado na página atual

### 8. Modificar useChat para Extrair Scripts
**Arquivos a modificar:**
- `src/hooks/useChat.ts` (opcional)

**Considerações:**
- Verificar se mensagens do tipo 'script' estão sendo corretamente identificadas
- Garantir que scripts sejam salvos quando mensagens são adicionadas

### 9. Utilitário para Parsear Scripts das Mensagens
**Arquivos a criar/modificar:**
- `src/utils/scriptParser.ts` (novo)

**Funcionalidades:**
- Função para extrair scripts do texto das mensagens
- Identificar blocos de código (markdown code blocks, etc.)
- Extrair metadados (título, descrição) se presentes
- Criar objetos Script a partir das mensagens

## Ordem de Implementação Sugerida

1. **Fase 1: Estrutura Base**
   - Criar tipos (`script.ts`)
   - Criar componente Navigation
   - Modificar App.tsx para suportar navegação básica

2. **Fase 2: Página de Scripts**
   - Criar componente Scripts
   - Criar componente ScriptCard
   - Aplicar estilos seguindo o design do Chat

3. **Fase 3: Extração de Scripts**
   - Criar scriptParser.ts
   - Criar useScripts.ts
   - Integrar com useChat para capturar scripts

4. **Fase 4: Execução e Modal**
   - Criar scriptExecutor.ts
   - Implementar execução via Electron IPC
   - Criar ExecutionModal component
   - Implementar captura de logs em tempo real
   - Adicionar feedback visual (loading + modal)

5. **Fase 5: Refinamentos**
   - Persistência no localStorage
   - Melhorias de UX
   - Tratamento de erros robusto

## Detalhes de Design

### Menu de Navegação
- Posicionado abaixo do header ou integrado ao header
- Botões com estilo similar ao themeToggle
- Estado ativo destacado visualmente
- Transições suaves

### Página de Scripts
- Layout similar ao Chat
- Grid responsivo de cards (2-3 colunas em desktop, 1 em mobile)
- Cards com bordas, padding e espaçamento consistentes
- Hover effects nos cards

### ScriptCard
- Título em destaque
- Descrição truncada com ellipsis se muito longa
- Botão "Executar" com estilo do tema (accent color)
- Loading state durante execução

### Modal de Execução
- Overlay escuro com opacidade (backdrop)
- Modal centralizado na tela
- Header fixo com título e status
- Área de logs scrollável com fundo escuro (terminal-like)
- Fonte monospace para logs
- Cores diferenciadas: stdout (texto normal), stderr (cor de erro)
- Indicador visual de status (spinner durante execução, ícone de sucesso/erro ao finalizar)
- Botões no footer alinhados à direita
- Responsivo (largura máxima, adapta em mobile)
- Animações suaves de fade-in/fade-out

## Considerações Técnicas

### Extração de Scripts
- A IA pode retornar scripts em diferentes formatos:
  - Blocos de código markdown (```bash, ```sh, etc.)
  - Texto com código inline
  - JSON estruturado (se Message.type === 'script')
- Parser deve ser flexível para diferentes formatos

### Execução de Scripts
- Usar Electron IPC para executar comandos no sistema
- Validar scripts antes de executar (segurança)
- Executar em contexto isolado quando possível
- Capturar stdout/stderr em tempo real
- Stream de logs para o modal durante execução
- Exibir logs formatados no modal (stdout vs stderr)
- Manter histórico de execuções (opcional)

### Persistência
- Salvar scripts no localStorage
- Chave: `linux-ai-helper-scripts`
- Estrutura: array de Script objects serializados

## Arquivos que Serão Criados

```
src/
├── components/
│   ├── Navigation/
│   │   ├── Navigation.tsx
│   │   └── Navigation.module.css
│   └── Scripts/
│       ├── Scripts.tsx
│       ├── Scripts.module.css
│       ├── ScriptCard.tsx
│       ├── ScriptCard.module.css
│       ├── ExecutionModal.tsx
│       └── ExecutionModal.module.css
├── hooks/
│   └── useScripts.ts
├── types/
│   └── script.ts
└── utils/
    ├── scriptParser.ts
    └── scriptExecutor.ts
```

## Arquivos que Serão Modificados

- `src/App.tsx` - Adicionar navegação e roteamento
- `src/hooks/useChat.ts` - (Opcional) Melhorias para capturar scripts

## Testes e Validação

- Verificar extração de scripts de diferentes formatos
- Testar navegação entre páginas
- Validar execução de scripts simples
- Testar modal de logs (abertura, exibição em tempo real, fechamento)
- Verificar formatação de logs (stdout vs stderr)
- Testar scripts que geram muitos logs (scroll automático)
- Validar tratamento de erros e exibição no modal
- Verificar persistência no localStorage
- Testar em ambos os temas (dark/light)
- Validar responsividade (modal em mobile)

## Notas Adicionais

- Manter consistência visual com o design atual
- Usar as mesmas variáveis CSS do tema
- Seguir padrões de código existentes
- Adicionar comentários em português (seguindo padrão do projeto)

