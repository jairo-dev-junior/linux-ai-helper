import { useEffect, useRef, useState } from 'react';
import { useChatContext } from '../../contexts/ChatContext';
import { useTheme } from '../Theme/useTheme';
import { Message } from './Message';
import { ChatInput, ChatInputRef } from './ChatInput';
import { ChatActions } from './ChatActions';
import styles from './Chat.module.css';
import { getSystemData } from "../../api/SystemDataReceiver";
import { createContextForAgent } from '../../hooks/askToAiAgent';

export function Chat() {
  const { messages, isLoading, sendMessage, cancelRequest } = useChatContext();
  const { theme, toggleTheme } = useTheme();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<ChatInputRef>(null);
  const [inputValue, setInputValue] = useState('');
  
  

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    async function initializeContext() {
      try {
        const systemData = await getSystemData();
        await createContextForAgent(systemData);
      } catch (error) {
        console.error('Erro ao inicializar contexto do agente:', error);
      }
    }
    initializeContext();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = (text: string) => {
    sendMessage(text);
    inputRef.current?.clear();
    setInputValue('');
  };

  const handleInputValueChange = (value: string) => {
    setInputValue(value);
  };

  const handleSendClick = () => {
    const value = inputRef.current?.getValue() || '';
    if (value.trim() && !isLoading) {
      handleSend(value.trim());
    }
  };

  return (
    <div className={styles.chatContainer}>
      <div className={styles.header}>
        <h1 className={styles.title}>Linux AI Helper</h1>
        <button
          type="button"
          onClick={toggleTheme}
          className={styles.themeToggle}
          aria-label="Alternar tema"
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>

      <div className={styles.messagesContainer}>
        {messages.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <p>Olá! Sou seu assistente de IA para organização e otimização do sistema.</p>
            <p>Como posso ajudar você hoje?</p>
          </div>
        ) : (
          messages.map((message) => <Message key={message.id} message={message} />)
        )}
        {isLoading && (
          <div className={styles.loadingIndicator}>
            <span className={styles.loadingDot}></span>
            <span className={styles.loadingDot}></span>
            <span className={styles.loadingDot}></span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className={styles.inputSection}>
        <div className={styles.inputWrapper}>
          <ChatInput
            ref={inputRef}
            onSend={handleSend}
            onValueChange={handleInputValueChange}
            disabled={isLoading}
            placeholder="Digite sua mensagem... (Enter para enviar, Shift+Enter para nova linha)"
          />
          <ChatActions
            onSend={handleSendClick}
            onCancel={cancelRequest}
            canSend={!isLoading && inputValue.trim().length > 0}
            isLoading={isLoading}
          />
        </div>
      </div>
    </div>
  );
}

