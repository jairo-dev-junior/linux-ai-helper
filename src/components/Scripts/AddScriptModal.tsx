import { useState } from 'react';
import { Script } from '../../types/script';
import styles from './AddScriptModal.module.css';

interface AddScriptModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (script: Omit<Script, 'id' | 'createdAt' | 'messageId'>) => void;
}

export function AddScriptModal({ isOpen, onClose, onSave }: AddScriptModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      alert('Por favor, preencha pelo menos o título e o conteúdo do script.');
      return;
    }

    onSave({
      title: title.trim(),
      description: description.trim(),
      content: content.trim(),
    });

    // Limpar formulário
    setTitle('');
    setDescription('');
    setContent('');
    onClose();
  };

  const handleCancel = () => {
    setTitle('');
    setDescription('');
    setContent('');
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={handleCancel}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2 className={styles.title}>Adicionar Novo Script</h2>
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
          <div className={styles.formGroup}>
            <label htmlFor="script-title" className={styles.label}>
              Título <span className={styles.required}>*</span>
            </label>
            <input
              id="script-title"
              type="text"
              className={styles.input}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Verificar espaço em disco"
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="script-description" className={styles.label}>
              Descrição
            </label>
            <textarea
              id="script-description"
              className={styles.textarea}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Breve descrição do que o script faz..."
              rows={2}
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="script-content" className={styles.label}>
              Código do Script <span className={styles.required}>*</span>
            </label>
            <textarea
              id="script-content"
              className={styles.codeTextarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="#!/bin/bash&#10;echo 'Hello World'"
              rows={12}
              spellCheck={false}
            />
          </div>
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
            className={styles.saveButton}
            onClick={handleSave}
          >
            Salvar Script
          </button>
        </div>
      </div>
    </div>
  );
}

