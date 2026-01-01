import { createContext, useContext, ReactNode } from 'react';
import { useChat } from '../hooks/useChat';
import { Message } from '../types/chat';

interface ChatContextType {
  messages: Message[];
  isLoading: boolean;
  sendMessage: (text: string) => void;
  cancelRequest: () => void;
  clearChat: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const chat = useChat();

  return <ChatContext.Provider value={chat}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChatContext deve ser usado dentro de ChatProvider');
  }
  return context;
}

