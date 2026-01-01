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

