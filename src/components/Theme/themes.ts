export type Theme = 'light' | 'dark';

export interface ThemeColors {
  background: string;
  surface: string;
  text: string;
  textSecondary: string;
  accent: string;
  success: string;
  warning: string;
  error: string;
  border: string;
  userMessageBg: string;
  agentMessageBg: string;
}

export const themes: Record<Theme, ThemeColors> = {
  dark: {
    background: '#282c34',
    surface: '#21252b',
    text: '#abb2bf',
    textSecondary: '#5c6370',
    accent: '#61afef',
    success: '#98c379',
    warning: '#e5c07b',
    error: '#e06c75',
    border: '#3e4451',
    userMessageBg: '#2c313c',
    agentMessageBg: '#3e4451',
  },
  light: {
    background: '#ffffff',
    surface: '#f5f5f5',
    text: '#2c313c',
    textSecondary: '#5c6370',
    accent: '#528bcc',
    success: '#7a9e5f',
    warning: '#b8955a',
    error: '#b85450',
    border: '#e0e0e0',
    userMessageBg: '#e3f2fd',
    agentMessageBg: '#f5f5f5',
  },
};

