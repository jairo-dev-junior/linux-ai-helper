import { useState, useEffect, useRef } from 'react';
import styles from './PasswordModal.module.css';

interface PasswordModalProps {
  isOpen: boolean;
  onConfirm: (password: string) => void;
  onCancel: () => void;
  message?: string;
}

export function PasswordModal({ isOpen, onConfirm, onCancel, message }: PasswordModalProps) {
  const [password, setPassword] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onConfirm(password);
      setPassword('');
    }
  };

  const handleCancel = () => {
    setPassword('');
    onCancel();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Senha Sudo Necessária</h2>
          <button
            type="button"
            className={styles.closeButton}
            onClick={handleCancel}
            aria-label="Fechar modal"
          >
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.message}>
            {message || 'O script requer privilégios de administrador. Por favor, insira sua senha:'}
          </p>
          <form onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="password"
              className={styles.passwordInput}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Digite sua senha"
              autoComplete="current-password"
            />
          </form>
        </div>

        <div className={styles.footer}>
          <button
            type="button"
            className={styles.cancelButton}
            onClick={handleCancel}
          >
            Cancelar
          </button>
          <button
            type="button"
            className={styles.confirmButton}
            onClick={handleSubmit}
            disabled={!password.trim()}
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}

