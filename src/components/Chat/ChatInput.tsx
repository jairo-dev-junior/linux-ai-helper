import { useState, KeyboardEvent, ChangeEvent, useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import styles from './ChatInput.module.css';

interface ChatInputProps {
  onSend: (text: string) => void;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  maxLength?: number;
}

export interface ChatInputRef {
  getValue: () => string;
  clear: () => void;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(({
  onSend,
  onValueChange,
  disabled = false,
  placeholder = 'Digite sua mensagem...',
  maxLength = 2000,
}, ref) => {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    getValue: () => text,
    clear: () => setText(''),
  }));

  const handleChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setText(value);
      onValueChange?.(value);
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSend = () => {
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
      onValueChange?.('');
    }
  };

  // Ajustar altura do textarea automaticamente
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      const maxHeight = 8 * 16; // 8rem em pixels
      textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
    }
  }, [text]);

  return (
    <div className={styles.inputContainer}>
      <textarea
        ref={textareaRef}
        className={styles.textarea}
        value={text}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        rows={1}
        onScroll={() => {}}
        style={{overflow: 'hidden'}}
      />
      {maxLength && (
        <div className={styles.charCount}>
          {text.length}/{maxLength}
        </div>
      )}
    </div>
  );
});

ChatInput.displayName = 'ChatInput';

