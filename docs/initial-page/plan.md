# Plano de Implementação: Página de Chat com Agente IA

## Status
⏳ **Aguardando Aprovação**

---

## Visão Geral
Este plano detalha a implementação da página de chat conforme especificado em `spec.md`. A implementação será feita em etapas, priorizando os requisitos MUST HAVE.

---

## Estrutura de Arquivos

### Novos Arquivos a Criar
```
src/
├── components/
│   ├── Chat/
│   │   ├── Chat.tsx              # Componente principal do chat
│   │   ├── Chat.module.css       # Estilos do chat
│   │   ├── Message.tsx           # Componente de mensagem individual
│   │   ├── Message.module.css    # Estilos das mensagens
│   │   ├── ChatInput.tsx         # Campo de entrada de texto
│   │   ├── ChatInput.module.css  # Estilos do input
│   │   └── ChatActions.tsx       # Botões de ação (Enviar/Cancelar)
│   │   └── ChatActions.module.css
│   └── Theme/
│       ├── ThemeProvider.tsx     # Provider de tema
│       ├── useTheme.ts            # Hook para gerenciar tema
│       └── themes.ts              # Definição dos temas (claro/escuro)
├── hooks/
│   └── useChat.ts                 # Hook para lógica do chat
├── types/
│   └── chat.ts                    # Tipos TypeScript para chat
└── utils/
    └── storage.ts                  # Utilitário para persistência (tema)
```

### Arquivos a Modificar
- `src/App.tsx` - Substituir conteúdo padrão pelo Chat
- `src/index.css` - Ajustar estilos globais base
- `src/App.css` - Remover ou adaptar estilos antigos

---

## Etapas de Implementação

### Etapa 1: Configuração Base e Tipos
**Objetivo**: Criar estrutura de tipos e configuração inicial

**Tarefas**:
1. Criar `src/types/chat.ts` com interfaces:
   - `Message` (id, text, sender, timestamp)
   - `ChatState` (messages, isLoading, currentRequestId)
   - `Sender` (enum: 'user' | 'agent')

2. Criar estrutura de pastas de componentes

**Estimativa**: 15 minutos

---

### Etapa 2: Sistema de Temas
**Objetivo**: Implementar sistema de temas claro/escuro baseado em One Dark

**Tarefas**:
1. Criar `src/components/Theme/themes.ts`:
   - Definir paleta de cores do tema escuro (One Dark)
   - Definir paleta de cores do tema claro
   - Exportar objetos de tema

2. Criar `src/components/Theme/ThemeProvider.tsx`:
   - Context para gerenciar tema
   - Provider component
   - Função para alternar tema

3. Criar `src/components/Theme/useTheme.ts`:
   - Hook customizado para acessar tema
   - Função toggleTheme

4. Criar `src/utils/storage.ts`:
   - Função para salvar preferência de tema no localStorage
   - Função para carregar preferência salva

5. Integrar ThemeProvider no `src/main.tsx` ou `src/App.tsx`

**Cores One Dark (referência)**:
- Background: #282c34
- Foreground: #abb2bf
- Accent: #61afef
- Success: #98c379
- Warning: #e5c07b
- Error: #e06c75

**Estimativa**: 45 minutos

---

### Etapa 3: Componente de Mensagem
**Objetivo**: Criar componente para exibir mensagens individuais

**Tarefas**:
1. Criar `src/components/Chat/Message.tsx`:
   - Props: message (Message type)
   - Renderizar mensagem do usuário vs agente com estilos diferentes
   - Suporte a quebra de linha
   - Indicador visual do remetente

2. Criar `src/components/Chat/Message.module.css`:
   - Estilos para mensagem do usuário (alinhada à direita)
   - Estilos para mensagem do agente (alinhada à esquerda)
   - Estilos responsivos aos temas
   - Animações sutis de entrada

**Estimativa**: 30 minutos

---

### Etapa 4: Componente de Input
**Objetivo**: Criar campo de entrada de texto com funcionalidades

**Tarefas**:
1. Criar `src/components/Chat/ChatInput.tsx`:
   - Textarea controlado
   - Placeholder informativo
   - Handler para Enter (enviar) e Shift+Enter (nova linha)
   - Desabilitar durante loading
   - Limite de caracteres (ex: 2000)

2. Criar `src/components/Chat/ChatInput.module.css`:
   - Estilos do textarea
   - Estados: focus, disabled
   - Responsivo aos temas

**Estimativa**: 25 minutos

---

### Etapa 5: Componente de Ações (Botões)
**Objetivo**: Criar botões de Enviar e Cancelar

**Tarefas**:
1. Criar `src/components/Chat/ChatActions.tsx`:
   - Botão Enviar:
     - Desabilitado quando input vazio ou loading
     - Indicador de loading quando processando
     - Ícone ou texto "Enviar"
   - Botão Cancelar:
     - Visível apenas quando há requisição em andamento
     - Função para cancelar requisição
     - Estilo de destaque (ex: vermelho/laranja)

2. Criar `src/components/Chat/ChatActions.module.css`:
   - Estilos dos botões
   - Estados: hover, active, disabled
   - Responsivo aos temas

**Estimativa**: 25 minutos

---

### Etapa 6: Hook useChat
**Objetivo**: Criar lógica de gerenciamento do chat

**Tarefas**:
1. Criar `src/hooks/useChat.ts`:
   - Estado de mensagens (useState)
   - Estado de loading (useState)
   - Estado de requestId para cancelamento (useRef)
   - Função `sendMessage`:
     - Adiciona mensagem do usuário
     - Simula envio ao agente (mock inicial)
     - Adiciona resposta do agente após delay
   - Função `cancelRequest`:
     - Cancela requisição em andamento
     - Remove mensagem pendente do agente
   - Função `addMessage` (helper)
   - Função `clearChat` (opcional)

**Nota**: Inicialmente, a resposta do agente será mockada. A integração real com IA será feita posteriormente.

**Estimativa**: 40 minutos

---

### Etapa 7: Componente Principal Chat
**Objetivo**: Integrar todos os componentes no componente principal

**Tarefas**:
1. Criar `src/components/Chat/Chat.tsx`:
   - Importar e usar: Message, ChatInput, ChatActions
   - Usar hook useChat
   - Usar hook useTheme
   - Layout:
     - Container principal (flex column)
     - Área de mensagens (scrollable)
     - Container inferior fixo (input + ações)
   - Scroll automático para última mensagem (useEffect + useRef)
   - Mensagem de boas-vindas inicial

2. Criar `src/components/Chat/Chat.module.css`:
   - Layout flexbox
   - Área de mensagens com scroll
   - Container fixo inferior
   - Responsivo aos temas
   - Altura total da viewport

**Estimativa**: 45 minutos

---

### Etapa 8: Integração no App
**Objetivo**: Substituir conteúdo padrão pelo Chat

**Tarefas**:
1. Modificar `src/App.tsx`:
   - Remover conteúdo padrão
   - Importar e renderizar Chat
   - Envolver com ThemeProvider

2. Ajustar `src/index.css`:
   - Reset básico
   - Variáveis CSS para temas (opcional)
   - Estilos globais mínimos

3. Limpar `src/App.css` ou adaptar para o chat

**Estimativa**: 20 minutos

---

### Etapa 9: Ajustes e Polimento
**Objetivo**: Melhorar UX e corrigir detalhes

**Tarefas**:
1. Ajustes de CSS:
   - Espaçamentos consistentes
   - Transições suaves
   - Animações sutis
   - Responsividade

2. Acessibilidade:
   - ARIA labels nos botões
   - Navegação por teclado
   - Foco visível

3. Testes manuais:
   - Enviar mensagens
   - Cancelar requisições
   - Alternar temas
   - Scroll de mensagens
   - Edge cases (mensagens vazias, muito longas, etc.)

**Estimativa**: 30 minutos

---

## Resumo de Tempo Estimado
- **Total**: ~4 horas e 15 minutos
- **Breakdown**:
  - Configuração: 15 min
  - Temas: 45 min
  - Mensagem: 30 min
  - Input: 25 min
  - Ações: 25 min
  - Hook: 40 min
  - Chat Principal: 45 min
  - Integração: 20 min
  - Polimento: 30 min

---

## Dependências Necessárias
Nenhuma dependência adicional necessária. O projeto já possui:
- React 18.2.0
- TypeScript 5.2.2
- Vite 5.1.6

**Opcional (futuro)**:
- CSS Modules (já suportado nativamente)
- ou styled-components (se preferir)

---

## Decisões Técnicas

### CSS Modules vs Styled Components
**Decisão**: CSS Modules (nativo, sem dependências extras)

### Gerenciamento de Estado
**Decisão**: useState + useRef (simples, suficiente para MVP)
**Futuro**: Considerar Context API ou Zustand se necessário

### Mock do Agente IA
**Decisão**: Simular resposta com delay de 1-2 segundos
**Futuro**: Integrar com API real via IPC do Electron

### Persistência
**Decisão**: localStorage apenas para preferência de tema
**Futuro**: Salvar histórico de conversas

---

## Checklist de Aprovação

Antes de iniciar a implementação, verificar:
- [ ] Estrutura de arquivos aprovada
- [ ] Escolha de CSS Modules confirmada
- [ ] Paleta de cores One Dark aprovada
- [ ] Funcionalidades mockadas do agente aceitas
- [ ] Estimativa de tempo aceita

---

## Próximos Passos Após Aprovação
1. Criar estrutura de pastas
2. Implementar etapas na ordem especificada
3. Testar cada etapa antes de prosseguir
4. Documentar qualquer desvio do plano

---

## Observações
- Este plano foca nos requisitos MUST HAVE
- Funcionalidades NICE TO HAVE podem ser adicionadas em iterações futuras
- A integração real com o agente IA será feita em etapa separada
- O design será minimalista conforme especificado

